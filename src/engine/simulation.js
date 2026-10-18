import { WEAPON_REGISTRY } from '../constants/weapons';

/**
 * Open-Ended System Design Physics Solver
 * Supports multiple valid architectural solutions (Vertical Scaling, Horizontal Scaling,
 * Read/Edge Caching, Write Queuing, Sharding, Serverless, and Hybrid Topologies).
 */
export function solveNetworkTopology({
  nodes,
  connections,
  targetRps,
  trafficProfile,
  chaosVictimId = null
}) {
  let totalCost = 0;
  let totalPower = 0;
  const spofWarnings = [];

  // 1. Calculate Total Budget & Power
  nodes.forEach(node => {
    const reg = WEAPON_REGISTRY[node.type];
    if (!reg) return;
    const tierData = reg.tiers[(node.tier || 1) - 1] || reg.tiers[0];
    const count = node.count || 1;
    totalCost += Math.round(reg.cost * (tierData.costMult || 1) * count);
    totalPower += Math.round(reg.power * (tierData.powerMult || 1) * count);
  });

  // 2. Determine connected nodes (if connections exist, track them; single nodes or auto-placed nodes still work)
  const connectedIds = new Set();
  connections.forEach(c => {
    connectedIds.add(c.from);
    connectedIds.add(c.to);
  });

  if (nodes.length === 1 || connections.length === 0) {
    nodes.forEach(n => connectedIds.add(n.id));
  }

  const unconnectedNodes = nodes.filter(n => !connectedIds.has(n.id));
  if (unconnectedNodes.length > 0) {
    spofWarnings.push(
      `${unconnectedNodes.length} component(s) are unwired. Click "Auto-Connect" or drag a wire to include them.`
    );
  }

  // All wired nodes (or all nodes if none wired yet) participate in the architecture
  const activeNodes = nodes.filter(n => connectedIds.has(n.id));

  const byType = {};
  activeNodes.forEach(n => {
    if (!byType[n.type]) byType[n.type] = [];
    byType[n.type].push(n);
  });

  // Helper: Calculate effective capacity factor during Wave 3 Chaos Monkey
  // Instead of deleting the entire node/cluster, Chaos Monkey disables 1 instance/AZ worth of capacity.
  const getChaosSurvivalFactor = (node, sameLayerNodeCount) => {
    if (!chaosVictimId || node.id !== chaosVictimId) return 1.0;
    const count = node.count || 1;
    const tier = node.tier || 1;

    // Multi-instance replica cluster: losing 1 instance leaves (count - 1) / count capacity (plus auto-scaling recovery)
    if (count >= 2) {
      return Math.max(0.75, (count - 1) / count + 0.25);
    }
    // Multiple separate nodes in the same layer on the canvas
    if (sameLayerNodeCount >= 2) {
      return 0.65;
    }
    // High-Tier hardware (Tier 3 Multi-AZ / Graviton Metal / Sharded Cluster) has built-in AZ failover
    if (tier >= 3 || node.type === 'SHARD_DB' || node.type === 'CDN' || node.type === 'OBJECT_STORAGE') {
      return 0.90;
    }
    // Tier 2 (Sentinel / Read Replicas / Managed Cluster) has warm standby failover
    if (tier === 2) {
      return 0.75;
    }
    // Single Tier-1 instance with no redundancy suffers heavy degradation during Chaos wave
    return 0.45;
  };

  // 3. Incoming Traffic Breakdown
  const profile = trafficProfile || { read: 0.7, write: 0.3, static: 0.0, bot: 0.0 };
  const incomingRps = targetRps;
  let staticRps = incomingRps * (profile.static || 0);
  let botRps = incomingRps * (profile.bot || 0);
  let readRps = incomingRps * (profile.read ?? 0.7);
  let writeRps = incomingRps * (profile.write ?? 0.3);

  // 4. Edge WAF Filtering (Drops hostile bots + scrubs 10% noisy/bad requests)
  let botFiltered = 0;
  if (byType['FIREWALL']?.length > 0) {
    let bestFilterRate = 0;
    byType['FIREWALL'].forEach(fwNode => {
      const fwTier = WEAPON_REGISTRY['FIREWALL'].tiers[(fwNode.tier || 1) - 1];
      bestFilterRate = Math.max(bestFilterRate, fwTier.botFilterRate || 0.75);
    });
    botFiltered = botRps * bestFilterRate;
    botRps -= botFiltered;
    // WAF rate limiting also trims 8% of abusive read/write scraping even when bot profile is 0
    readRps *= 0.92;
  }

  // 5. CDN & S3 Object Storage Offload
  // Offloads static media AND caches public GET read responses at the edge!
  let staticOffloaded = 0;
  const staticHandlers = [...(byType['CDN'] || []), ...(byType['OBJECT_STORAGE'] || [])];
  if (staticHandlers.length > 0) {
    let bestOffload = 0;
    staticHandlers.forEach(h => {
      const tier = WEAPON_REGISTRY[h.type].tiers[(h.tier || 1) - 1];
      if ((tier.staticOffload || 0) > bestOffload) {
        bestOffload = tier.staticOffload;
      }
    });
    staticOffloaded = staticRps * bestOffload;
    staticRps -= staticOffloaded;

    // Edge Read Caching: CDN/S3 also offloads 25%-35% of cacheable public read queries before hitting Compute/DB
    const edgeReadOffload = readRps * (bestOffload * 0.32);
    staticOffloaded += edgeReadOffload;
    readRps -= edgeReadOffload;
  }

  // 6. Read Caching (Redis CACHE + Elasticsearch SEARCH_ENGINE)
  let cacheHitRate = 0;
  const cacheNodes = [...(byType['CACHE'] || []), ...(byType['SEARCH_ENGINE'] || [])];
  cacheNodes.forEach(cNode => {
    const cTier = WEAPON_REGISTRY[cNode.type].tiers[(cNode.tier || 1) - 1];
    const countBonus = ((cNode.count || 1) - 1) * 0.05;
    // Multiple cache/search nodes or higher tiers combine to increase hit ratio
    const nodeHit = Math.min(0.97, (cTier.hitRate || 0.65) + countBonus);
    cacheHitRate = 1 - (1 - cacheHitRate) * (1 - nodeHit);
  });

  // 7. Async Write Queue Buffering (Kafka / SQS)
  let writeBufferActive = false;
  let queueCapacity = 0;
  let queueSmoothingFactor = 1.0;

  if (byType['MESSAGE_QUEUE']?.length > 0) {
    writeBufferActive = true;
    byType['MESSAGE_QUEUE'].forEach(q => {
      const qTier = WEAPON_REGISTRY['MESSAGE_QUEUE'].tiers[(q.tier || 1) - 1];
      queueCapacity += (qTier.rps || 5000) * (q.count || 1);
    });
    // Queue smooths bursty writes by 55%-65%
    queueSmoothingFactor = queueCapacity >= writeRps ? 0.40 : 0.65;
  }

  // 8. Load Balancer & API Gateway Routing Layer
  let lbCapacity = 0;
  let lbCount = 0;
  const routingNodes = [...(byType['LOAD_BALANCER'] || []), ...(byType['API_GATEWAY'] || [])];
  routingNodes.forEach(lb => {
    const reg = WEAPON_REGISTRY[lb.type];
    const tierData = reg.tiers[(lb.tier || 1) - 1];
    const count = lb.count || 1;
    lbCount += count;
    const chaosFactor = getChaosSurvivalFactor(lb, routingNodes.length);
    lbCapacity += (tierData.rps || 8000) * count * chaosFactor;
  });

  // Net traffic reaching Compute
  const netIncomingRps = readRps + writeRps + botRps + staticRps;

  // 9. Compute Capacity (EC2 SERVER + Serverless LAMBDA)
  let totalServerCapacity = 0;
  let serverInstances = 0;
  let hasStatefulComputeIssue = false;

  const computeNodes = [...(byType['SERVER'] || []), ...(byType['LAMBDA'] || [])];
  computeNodes.forEach(s => {
    const reg = WEAPON_REGISTRY[s.type];
    const tierData = reg.tiers[(s.tier || 1) - 1];
    const count = s.count || 1;
    serverInstances += count;

    const statefulPenalty = s.stateful && count > 1 ? 0.75 : 1.0;
    if (s.stateful && count > 1) {
      hasStatefulComputeIssue = true;
    }

    const chaosFactor = getChaosSurvivalFactor(s, computeNodes.length);
    totalServerCapacity += (tierData.rps || 1000) * count * statefulPenalty * chaosFactor;
  });

  // Architectural Synergies on Compute:
  // - Having a Load Balancer or API Gateway offloads SSL termination & connection multiplexing (+15% compute efficiency)
  // - If multiple servers are used WITHOUT a Load Balancer, DNS Round-Robin still works (~88% distribution efficiency)
  if (routingNodes.length > 0) {
    totalServerCapacity *= 1.15;
  } else if (serverInstances > 1) {
    totalServerCapacity *= 0.88;
    spofWarnings.push(
      'Tip: Adding a Load Balancer or API Gateway in front of multiple servers improves routing efficiency.'
    );
  }

  // - Having Redis Cache / Search Engine means Compute serves fast RAM hits without waiting on DB ORM queries (+20% compute capacity)
  if (cacheHitRate > 0) {
    totalServerCapacity *= 1 + cacheHitRate * 0.25;
  }

  // - Having an Async Message Queue decouples slow synchronous write locks from Compute threads (+15% compute capacity)
  if (writeBufferActive) {
    totalServerCapacity *= 1.15;
  }

  if (hasStatefulComputeIssue) {
    spofWarnings.push(
      'Stateful Compute across multiple replicas causes sticky-session load imbalance. Switch to Stateless for full capacity.'
    );
  }

  // 10. Storage Capacity (RDS DATABASE + Sharded NoSQL SHARD_DB)
  const readsToDatabase = readRps * (1 - cacheHitRate);
  const writesToDatabase = writeRps * queueSmoothingFactor;

  let dbReadCapacity = 0;
  let dbWriteCapacity = 0;
  const storageNodes = [...(byType['DATABASE'] || []), ...(byType['SHARD_DB'] || [])];

  if (byType['DATABASE']) {
    byType['DATABASE'].forEach(db => {
      const tierData = WEAPON_REGISTRY['DATABASE'].tiers[(db.tier || 1) - 1];
      const count = db.count || 1;
      const chaosFactor = getChaosSurvivalFactor(db, storageNodes.length);
      dbReadCapacity += (tierData.readRps || 1800) * count * chaosFactor;
      dbWriteCapacity += (tierData.writeRps || 800) * count * chaosFactor;
    });
  }

  if (byType['SHARD_DB']) {
    byType['SHARD_DB'].forEach(sdb => {
      const tierData = WEAPON_REGISTRY['SHARD_DB'].tiers[(sdb.tier || 1) - 1];
      const count = sdb.count || 1;
      const chaosFactor = getChaosSurvivalFactor(sdb, storageNodes.length);
      dbReadCapacity += (tierData.readRps || 16000) * count * chaosFactor;
      dbWriteCapacity += (tierData.writeRps || 6500) * count * chaosFactor;
    });
  }

  // Calculate Utilization Ratios
  const serverLoad = totalServerCapacity > 0 ? netIncomingRps / totalServerCapacity : 999;

  // Database load combines read & write utilization smoothly so upgrading DB or adding Cache/Queue both work
  const readLoad = dbReadCapacity > 0 ? readsToDatabase / dbReadCapacity : 999;
  const writeLoad = dbWriteCapacity > 0 ? writesToDatabase / dbWriteCapacity : 999;
  const dbLoad = Math.max(readLoad, writeLoad);

  const lbLoad = routingNodes.length > 0 ? (lbCapacity > 0 ? netIncomingRps / lbCapacity : 999) : 0;

  // True SPOF only occurs if an entire essential layer (Compute or Storage) is missing (0 active nodes)
  const hasSPOF = computeNodes.length === 0 || storageNodes.length === 0;

  // 11. M/M/1 Queueing Latency Curve
  let latencyMs = 11;
  if (serverLoad < 0.75) {
    latencyMs += Math.round(serverLoad * 22);
  } else if (serverLoad <= 1.0) {
    latencyMs += Math.round(25 + (serverLoad - 0.75) * 140);
  } else {
    latencyMs += Math.round(80 + (serverLoad - 1.0) * 900);
  }

  if (dbLoad > 0.8) {
    latencyMs += Math.round((dbLoad - 0.8) * 380);
  }

  if (cacheHitRate > 0) {
    latencyMs = Math.max(4, Math.round(latencyMs * (1 - cacheHitRate * 0.45)));
  }

  if (staticHandlers.length > 0) {
    latencyMs = Math.max(4, Math.round(latencyMs * 0.85));
  }

  if (hasSPOF) {
    latencyMs = 999;
  }

  // 12. Per-Node Status Map
  const nodeStatus = {};
  nodes.forEach(node => {
    const isConnected = connectedIds.has(node.id);
    if (!isConnected) {
      nodeStatus[node.id] = {
        loadRatio: 0,
        isOverloaded: false,
        isDead: false,
        isUnconnected: true
      };
      return;
    }

    let loadRatio = 0.35;
    if (node.type === 'SERVER' || node.type === 'LAMBDA') {
      loadRatio = serverLoad;
    } else if (node.type === 'DATABASE' || node.type === 'SHARD_DB') {
      loadRatio = dbLoad;
    } else if (node.type === 'LOAD_BALANCER' || node.type === 'API_GATEWAY') {
      loadRatio = lbCapacity > 0 ? netIncomingRps / lbCapacity : 1.0;
    } else if (node.type === 'MESSAGE_QUEUE') {
      loadRatio = queueCapacity > 0 ? writeRps / queueCapacity : 0.6;
    } else if (node.type === 'CACHE' || node.type === 'SEARCH_ENGINE') {
      const cTier = WEAPON_REGISTRY[node.type].tiers[(node.tier || 1) - 1];
      loadRatio = readRps / ((cTier.rps || 15000) * (node.count || 1));
    } else if (node.type === 'CDN' || node.type === 'OBJECT_STORAGE' || node.type === 'FIREWALL') {
      const eTier = WEAPON_REGISTRY[node.type].tiers[(node.tier || 1) - 1];
      loadRatio = incomingRps / ((eTier.rps || 20000) * (node.count || 1));
    }

    const isAffectedByChaos =
      chaosVictimId === node.id && (node.count || 1) === 1 && (node.tier || 1) === 1;

    nodeStatus[node.id] = {
      loadRatio: Math.min(1.5, Math.max(0.08, loadRatio)),
      isOverloaded: loadRatio > 1.05,
      isDead: isAffectedByChaos && loadRatio > 1.15,
      isUnconnected: false
    };
  });

  return {
    totalCost,
    totalPower,
    hasSPOF,
    spofWarnings,
    unconnectedCount: unconnectedNodes.length,
    serverLoad,
    dbLoad,
    lbLoad,
    latencyMs,
    cacheHitRate,
    botFiltered,
    staticOffloaded,
    writeBufferActive,
    netIncomingRps,
    nodeStatus
  };
}