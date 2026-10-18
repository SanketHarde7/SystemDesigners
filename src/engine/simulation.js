import { WEAPON_REGISTRY } from '../constants/weapons';

// Valid stage ordering to detect impossible/anti-pattern wiring (e.g., LB -> DB directly without Compute)
const STAGE_RANK = {
  CDN: 1,
  FIREWALL: 1,
  LOAD_BALANCER: 2,
  API_GATEWAY: 2,
  SERVER: 3,
  LAMBDA: 3,
  CACHE: 4,
  SEARCH_ENGINE: 4,
  OBJECT_STORAGE: 4,
  MESSAGE_QUEUE: 4,
  DATABASE: 5,
  SHARD_DB: 5
};

export function solveNetworkTopology({
  nodes,
  connections,
  targetRps,
  trafficProfile,
  requiresStrongConsistency = false,
  chaosVictimId = null
}) {
  let totalCost = 0;
  let totalPower = 0;
  const spofWarnings = [];
  const configErrors = [];

  // 1. Calculate Total Budget & Power (all placed nodes cost money/power)
  nodes.forEach(node => {
    const reg = WEAPON_REGISTRY[node.type];
    if (!reg) return;
    const tierData = reg.tiers[(node.tier || 1) - 1] || reg.tiers[0];
    const count = node.count || 1;
    totalCost += Math.round(reg.cost * (tierData.costMult || 1) * count);
    totalPower += Math.round(reg.power * (tierData.powerMult || 1) * count);
  });

  // 2. Strict Wiring Check: Newly deployed nodes MUST be wired to work!
  const connectedIds = new Set();
  connections.forEach(c => {
    connectedIds.add(c.from);
    connectedIds.add(c.to);
  });

  if (nodes.length === 1) {
    connectedIds.add(nodes[0].id);
  }

  const unconnectedNodes = nodes.filter(n => !connectedIds.has(n.id));
  if (unconnectedNodes.length > 0) {
    spofWarnings.push(
      `${unconnectedNodes.length} component(s) are UNWIRED! Drag a wire from Right Dot → Left Dot (or click Auto-Wire) so traffic can flow.`
    );
  }

  // 3. Detect Architectural Wiring Anti-Patterns
  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = n;
  });

  connections.forEach(c => {
    const src = nodeMap[c.from];
    const dst = nodeMap[c.to];
    if (!src || !dst) return;

    const srcStage = STAGE_RANK[src.type] || 3;
    const dstStage = STAGE_RANK[dst.type] || 3;

    // Anti-Pattern 1: Routing/Edge wired directly to Database/Cache/Queue bypassing Compute!
    if ((srcStage === 1 || srcStage === 2) && dstStage >= 4) {
      configErrors.push(
        `Invalid Topology Wire: ${WEAPON_REGISTRY[src.type].name} cannot talk directly to ${WEAPON_REGISTRY[dst.type].name} without a Compute layer (EC2 or Lambda) in between!`
      );
    }

    // Anti-Pattern 2: Backwards wiring (e.g., Database -> Load Balancer or Server -> Load Balancer)
    if (srcStage > dstStage && !(srcStage === 4 && dstStage === 4)) {
      configErrors.push(
        `Reverse Data Flow: ${WEAPON_REGISTRY[src.type].name} is wired backwards into ${WEAPON_REGISTRY[dst.type].name}. Cut the wire and connect Left-to-Right.`
      );
    }
  });

  // Active connected nodes
  const activeNodes = nodes.filter(n => connectedIds.has(n.id));
  const byType = {};
  activeNodes.forEach(n => {
    if (!byType[n.type]) byType[n.type] = [];
    byType[n.type].push(n);
  });

  // Helper: Chaos Monkey Survival Factor
  const getChaosSurvivalFactor = (node, sameLayerNodeCount) => {
    if (!chaosVictimId || node.id !== chaosVictimId) return 1.0;
    const count = node.count || 1;
    const tier = node.tier || 1;

    if (count >= 2) return Math.max(0.78, (count - 1) / count + 0.25);
    if (sameLayerNodeCount >= 2) return 0.70;
    if (tier >= 3 || node.type === 'SHARD_DB' || node.type === 'CDN' || node.type === 'OBJECT_STORAGE') {
      return 0.90;
    }
    if (tier === 2) return 0.65;
    return 0.40;
  };

  // 4. Incoming Traffic Breakdown
  const profile = trafficProfile || { read: 0.7, write: 0.3, static: 0.0, bot: 0.0 };
  const incomingRps = targetRps;
  let staticRps = incomingRps * (profile.static || 0);
  let botRps = incomingRps * (profile.bot || 0);
  let readRps = incomingRps * (profile.read ?? 0.7);
  let writeRps = incomingRps * (profile.write ?? 0.3);

  // 5. Edge WAF Filtering
  let botFiltered = 0;
  if (byType['FIREWALL']?.length > 0) {
    let bestFilterRate = 0;
    byType['FIREWALL'].forEach(fwNode => {
      const fwTier = WEAPON_REGISTRY['FIREWALL'].tiers[(fwNode.tier || 1) - 1];
      bestFilterRate = Math.max(bestFilterRate, fwTier.botFilterRate || 0.75);
    });
    botFiltered = botRps * bestFilterRate;
    botRps -= botFiltered;
    readRps *= 0.92;
  }

  // 6. CDN & S3 Object Storage Offload
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

    const edgeReadOffload = readRps * (bestOffload * 0.30);
    staticOffloaded += edgeReadOffload;
    readRps -= edgeReadOffload;
  }

  // 7. Read Caching & Eviction / Strategy Mechanics (Idea 1)
  let cacheHitRate = 0;
  let cacheWriteAmplification = 1.0;
  const cacheNodes = [...(byType['CACHE'] || []), ...(byType['SEARCH_ENGINE'] || [])];

  cacheNodes.forEach(cNode => {
    const cTier = WEAPON_REGISTRY[cNode.type].tiers[(cNode.tier || 1) - 1];
    const eviction = cNode.evictionPolicy || 'LRU';
    const strategy = cNode.cacheStrategy || 'CACHE_ASIDE';
    const countBonus = ((cNode.count || 1) - 1) * 0.05;

    let effectiveHit = Math.min(0.97, (cTier.hitRate || 0.65) + countBonus);

    // If user sets NO_EVICTION under high load, RAM fills up with stale keys -> OOM Hit Rate Collapse!
    if (eviction === 'NO_EVICTION' && incomingRps >= 3000) {
      effectiveHit = 0.25;
      configErrors.push(
        'Redis Cache OOM Error: Eviction Policy is set to "NO_EVICTION"! RAM filled up and new keys are rejected. Switch to LRU or LFU.'
      );
    } else if (eviction === 'LFU') {
      effectiveHit = Math.min(0.98, effectiveHit + 0.03);
    }

    // Cache Strategy Trade-offs
    if (strategy === 'WRITE_BACK') {
      cacheWriteAmplification = 0.65; // Batches writes in RAM
      if (requiresStrongConsistency) {
        configErrors.push(
          'Data Loss Risk: Write-Back Cache buffers financial writes in volatile RAM! Switch Cache Strategy to Cache-Aside or Write-Through.'
        );
      }
    } else if (strategy === 'WRITE_THROUGH') {
      cacheWriteAmplification = 1.08; // Synchronous write to both Cache + DB
      effectiveHit = Math.min(0.98, effectiveHit + 0.04);
    }

    cacheHitRate = 1 - (1 - cacheHitRate) * (1 - effectiveHit);
  });

  // 8. Async Write Queue & Delivery Guarantee Mechanics (Idea 1)
  let writeBufferActive = false;
  let queueCapacity = 0;
  let queueSmoothingFactor = 1.0;

  if (byType['MESSAGE_QUEUE']?.length > 0) {
    writeBufferActive = true;
    byType['MESSAGE_QUEUE'].forEach(q => {
      const qTier = WEAPON_REGISTRY['MESSAGE_QUEUE'].tiers[(q.tier || 1) - 1];
      const delivery = q.deliveryGuarantee || 'AT_LEAST_ONCE';
      const speedMult = delivery === 'AT_MOST_ONCE' ? 1.25 : 1.0;

      if (delivery === 'AT_MOST_ONCE' && requiresStrongConsistency) {
        configErrors.push(
          'Dropped Orders Detected: Message Queue is set to "At-Most-Once (Fire & Forget)" during a financial checkout sale! Switch to At-Least-Once + Idempotency.'
        );
      }

      queueCapacity += (qTier.rps || 5000) * (q.count || 1) * speedMult;
    });
    queueSmoothingFactor = queueCapacity >= writeRps ? 0.40 : 0.65;
  }

  // 9. Load Balancer & Routing Algorithm Mechanics (Idea 1)
  let lbCapacity = 0;
  let lbCount = 0;
  let lbEfficiencyMult = 1.12;
  let hasIpHash = false;

  const routingNodes = [...(byType['LOAD_BALANCER'] || []), ...(byType['API_GATEWAY'] || [])];
  routingNodes.forEach(lb => {
    const reg = WEAPON_REGISTRY[lb.type];
    const tierData = reg.tiers[(lb.tier || 1) - 1];
    const count = lb.count || 1;
    const algo = lb.routingAlgo || 'LEAST_CONN';

    if (algo === 'LEAST_CONN') lbEfficiencyMult = Math.max(lbEfficiencyMult, 1.18);
    if (algo === 'IP_HASH') hasIpHash = true;

    lbCount += count;
    const chaosFactor = getChaosSurvivalFactor(lb, routingNodes.length);
    lbCapacity += (tierData.rps || 8000) * count * chaosFactor;
  });

  const netIncomingRps = readRps + writeRps + botRps + staticRps;

  // 10. Compute Capacity & Stateful/Sticky Session Mechanics
  let totalServerCapacity = 0;
  let serverInstances = 0;

  const computeNodes = [...(byType['SERVER'] || []), ...(byType['LAMBDA'] || [])];
  computeNodes.forEach(s => {
    const reg = WEAPON_REGISTRY[s.type];
    const tierData = reg.tiers[(s.tier || 1) - 1];
    const count = s.count || 1;
    serverInstances += count;

    let statefulPenalty = 1.0;
    if (s.stateful && count > 1) {
      if (!hasIpHash) {
        statefulPenalty = 0.65;
        configErrors.push(
          'Session Broken: EC2 Cluster is STATEFUL with multiple replicas, but Load Balancer is not using IP-Hash! Switch EC2 to Stateless (recommended) or LB to IP-Hash.'
        );
      } else {
        statefulPenalty = 0.85; // IP-Hash prevents broken sessions, slight hot-spot overhead
      }
    }

    const chaosFactor = getChaosSurvivalFactor(s, computeNodes.length);
    totalServerCapacity += (tierData.rps || 1000) * count * statefulPenalty * chaosFactor;
  });

  if (routingNodes.length > 0) {
    totalServerCapacity *= lbEfficiencyMult;
  } else if (serverInstances > 1) {
    totalServerCapacity *= 0.88;
  }

  if (cacheHitRate > 0) {
    totalServerCapacity *= 1 + cacheHitRate * 0.25;
  }
  if (writeBufferActive) {
    totalServerCapacity *= 1.15;
  }

  // 11. Storage Capacity & CAP Theorem Consistency Mechanics (Idea 1)
  const readsToDatabase = readRps * (1 - cacheHitRate);
  const writesToDatabase = writeRps * queueSmoothingFactor * cacheWriteAmplification;

  let dbReadCapacity = 0;
  let dbWriteCapacity = 0;
  let eventualConsistencyLatencySave = 0;
  const storageNodes = [...(byType['DATABASE'] || []), ...(byType['SHARD_DB'] || [])];

  if (byType['DATABASE']) {
    byType['DATABASE'].forEach(db => {
      const tierData = WEAPON_REGISTRY['DATABASE'].tiers[(db.tier || 1) - 1];
      const count = db.count || 1;
      const consistency = db.consistencyMode || 'STRONG';
      const chaosFactor = getChaosSurvivalFactor(db, storageNodes.length);

      let consWriteMult = 1.0;
      if (consistency === 'EVENTUAL') {
        if (requiresStrongConsistency) {
          configErrors.push(
            'CAP Theorem SLA Violation: Database is set to Eventual Consistency during a financial/inventory transaction flow! Switch Database to Strong ACID Consistency.'
          );
        }
        consWriteMult = 1.35; // Async replication unlocks 35% higher write throughput
        eventualConsistencyLatencySave = 4;
      }

      dbReadCapacity += (tierData.readRps || 1800) * count * chaosFactor;
      dbWriteCapacity += (tierData.writeRps || 800) * count * consWriteMult * chaosFactor;
    });
  }

  if (byType['SHARD_DB']) {
    byType['SHARD_DB'].forEach(sdb => {
      const tierData = WEAPON_REGISTRY['SHARD_DB'].tiers[(sdb.tier || 1) - 1];
      const count = sdb.count || 1;
      const consistency = sdb.consistencyMode || 'STRONG';
      const chaosFactor = getChaosSurvivalFactor(sdb, storageNodes.length);

      let consWriteMult = 1.0;
      if (consistency === 'EVENTUAL') {
        if (requiresStrongConsistency) {
          configErrors.push(
            'CAP Theorem SLA Violation: Sharded DB is set to Eventual Consistency on a strict transactional mission! Switch to Strong Quorum Consistency.'
          );
        }
        consWriteMult = 1.35;
        eventualConsistencyLatencySave = 4;
      }

      dbReadCapacity += (tierData.readRps || 16000) * count * chaosFactor;
      dbWriteCapacity += (tierData.writeRps || 6500) * count * consWriteMult * chaosFactor;
    });
  }

  // Utilization Ratios
  const serverLoad = totalServerCapacity > 0 ? netIncomingRps / totalServerCapacity : 999;
  const readLoad = dbReadCapacity > 0 ? readsToDatabase / dbReadCapacity : 999;
  const writeLoad = dbWriteCapacity > 0 ? writesToDatabase / dbWriteCapacity : 999;
  const dbLoad = Math.max(readLoad, writeLoad);
  const lbLoad = routingNodes.length > 0 ? (lbCapacity > 0 ? netIncomingRps / lbCapacity : 999) : 0;

  // Chaos Monkey SPOF check for Mission 4: single LB or single Tier-1/2 DB fails under Chaos
  let chaosSpofFailed = false;
  if (chaosVictimId) {
    if (routingNodes.length === 1 && lbCount === 1) {
      chaosSpofFailed = true;
      configErrors.push(
        'Single Point of Failure (SPOF): Your single 1x Load Balancer was terminated by Chaos Monkey! Scale Load Balancer to 2x replicas.'
      );
    }
    if (
      byType['DATABASE']?.length === 1 &&
      !byType['SHARD_DB']?.length &&
      (byType['DATABASE'][0].tier || 1) < 3 &&
      (byType['DATABASE'][0].count || 1) < 2
    ) {
      chaosSpofFailed = true;
      configErrors.push(
        'Single Point of Failure (SPOF): Single-AZ SQL Database (Tier 2) had no Multi-AZ standby during Chaos Monkey! Upgrade DB to Tier 3 (Multi-AZ) or 2x replicas.'
      );
    }
  }

  const hasSPOF =
    computeNodes.length === 0 ||
    storageNodes.length === 0 ||
    unconnectedNodes.length > 0 ||
    chaosSpofFailed ||
    configErrors.length > 0;

  // 12. M/M/1 Queueing Latency Curve
  let latencyMs = Math.max(5, 11 - eventualConsistencyLatencySave);
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
  if (computeNodes.length === 0 || storageNodes.length === 0) {
    latencyMs = 999;
  }

  // 13. Per-Node Status Map
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
      chaosVictimId === node.id && (node.count || 1) === 1 && (node.tier || 1) < 3;

    nodeStatus[node.id] = {
      loadRatio: Math.min(1.5, Math.max(0.08, loadRatio)),
      isOverloaded: loadRatio > 1.05,
      isDead: isAffectedByChaos && (loadRatio > 1.1 || chaosSpofFailed),
      isUnconnected: false
    };
  });

  return {
    totalCost,
    totalPower,
    hasSPOF,
    spofWarnings,
    configErrors,
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