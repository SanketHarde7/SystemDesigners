import { WEAPON_REGISTRY } from '../constants/weapons';

/**
 * Strict Graph-Aware System Design Physics Solver
 * Only counts components that are wired into the active topology!
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
  let hasSPOF = false;
  const spofWarnings = [];

  // 1. Calculate Total Budget & Power (all placed nodes cost money/power)
  nodes.forEach(node => {
    const reg = WEAPON_REGISTRY[node.type];
    if (!reg) return;
    const tierData = reg.tiers[(node.tier || 1) - 1] || reg.tiers[0];
    const count = node.count || 1;
    totalCost += Math.round(reg.cost * (tierData.costMult || 1) * count);
    totalPower += Math.round(reg.power * (tierData.powerMult || 1) * count);
  });

  // 2. Determine which nodes are actually connected in the graph
  const connectedIds = new Set();
  connections.forEach(c => {
    connectedIds.add(c.from);
    connectedIds.add(c.to);
  });

  // If there is only 1 node on canvas, treat it as connected to ingress
  if (nodes.length === 1) {
    connectedIds.add(nodes[0].id);
  }

  const unconnectedNodes = nodes.filter(n => !connectedIds.has(n.id));
  if (unconnectedNodes.length > 0) {
    spofWarnings.push(
      `${unconnectedNodes.length} component(s) are unconnected! Drag a wire from an output port to connect them.`
    );
  }

  // Filter active, non-destroyed, connected nodes
  const activeNodes = nodes.filter(n => n.id !== chaosVictimId && connectedIds.has(n.id));
  const byType = {};
  activeNodes.forEach(n => {
    if (!byType[n.type]) byType[n.type] = [];
    byType[n.type].push(n);
  });

  // 3. Incoming Traffic Breakdown
  const profile = trafficProfile || { read: 0.7, write: 0.3, static: 0.0, bot: 0.0 };
  const incomingRps = targetRps;
  let staticRps = incomingRps * (profile.static || 0);
  let botRps = incomingRps * (profile.bot || 0);
  const readRps = incomingRps * (profile.read || 0.7);
  const writeRps = incomingRps * (profile.write || 0.3);

  // 4. Edge WAF Filtering
  let botFiltered = 0;
  if (byType['FIREWALL']?.length > 0) {
    const fwNode = byType['FIREWALL'][0];
    const fwTier = WEAPON_REGISTRY['FIREWALL'].tiers[(fwNode.tier || 1) - 1];
    const rate = fwTier.botFilterRate || 0.75;
    botFiltered = botRps * rate;
    botRps -= botFiltered;
  }

  // 5. CDN & S3 Static Media Offload
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
  }

  // Net traffic reaching Gateways / Load Balancers / Compute
  const netIncomingRps = readRps + writeRps + botRps + staticRps;

  // 6. Compute Capacity (EC2 SERVER + Serverless LAMBDA)
  let totalServerCapacity = 0;
  let serverInstances = 0;
  let hasStatefulComputeIssue = false;

  const computeNodes = [...(byType['SERVER'] || []), ...(byType['LAMBDA'] || [])];
  computeNodes.forEach(s => {
    const reg = WEAPON_REGISTRY[s.type];
    const tierData = reg.tiers[(s.tier || 1) - 1];
    const count = s.count || 1;
    serverInstances += count;

    // If EC2 is marked STATEFUL with multiple replicas, sticky session imbalance reduces effective capacity by 35%
    const statefulPenalty = s.stateful && count > 1 ? 0.65 : 1.0;
    if (s.stateful && count > 1) {
      hasStatefulComputeIssue = true;
    }

    totalServerCapacity += (tierData.rps || 1000) * count * statefulPenalty;
  });

  if (hasStatefulComputeIssue) {
    spofWarnings.push(
      'Stateful Compute detected across multiple replicas! Sticky sessions cause 35% load imbalance. Switch compute to Stateless.'
    );
  }

  // 7. Load Balancer & API Gateway Checks
  let lbCapacity = 0;
  let lbCount = 0;
  const routingNodes = [...(byType['LOAD_BALANCER'] || []), ...(byType['API_GATEWAY'] || [])];
  routingNodes.forEach(lb => {
    const reg = WEAPON_REGISTRY[lb.type];
    const tierData = reg.tiers[(lb.tier || 1) - 1];
    const count = lb.count || 1;
    lbCount += count;
    lbCapacity += (tierData.rps || 8000) * count;
  });

  // SPOF Checks
  if (serverInstances > 1 && lbCount === 0) {
    hasSPOF = true;
    spofWarnings.push('Multiple compute instances require a connected Load Balancer or API Gateway to distribute traffic.');
  }
  if (byType['LOAD_BALANCER']?.length === 1 && (byType['LOAD_BALANCER'][0].count || 1) === 1 && incomingRps >= 8500) {
    spofWarnings.push('Single Load Balancer instance (1x) is a Single Point of Failure under Chaos testing. Scale out to 2x.');
  }
  if (byType['DATABASE']?.length === 1 && (byType['DATABASE'][0].tier || 1) < 3 && incomingRps >= 8500) {
    spofWarnings.push('Single-AZ SQL Database without Multi-AZ failover (Tier 3) will fail during Chaos outage tests.');
  }

  // 8. Read Caching (Redis CACHE + Elasticsearch SEARCH_ENGINE)
  let cacheHitRate = 0;
  const cacheNodes = [...(byType['CACHE'] || []), ...(byType['SEARCH_ENGINE'] || [])];
  cacheNodes.forEach(cNode => {
    const cTier = WEAPON_REGISTRY[cNode.type].tiers[(cNode.tier || 1) - 1];
    cacheHitRate = Math.max(cacheHitRate, cTier.hitRate || 0.6);
  });

  const readsToDatabase = readRps * (1 - cacheHitRate);

  // 9. Async Write Queue Buffering (Kafka / SQS)
  let writeBufferActive = false;
  let writesToDatabase = writeRps;
  let queueCapacity = 0;
  if (byType['MESSAGE_QUEUE']?.length > 0) {
    writeBufferActive = true;
    byType['MESSAGE_QUEUE'].forEach(q => {
      const qTier = WEAPON_REGISTRY['MESSAGE_QUEUE'].tiers[(q.tier || 1) - 1];
      queueCapacity += (qTier.rps || 5000) * (q.count || 1);
    });
    // Queue smooths bursty writes by 50% if queue itself isn't overloaded
    const queueFactor = queueCapacity >= writeRps ? 0.45 : 0.75;
    writesToDatabase = writeRps * queueFactor;
  }

  // 10. Storage Capacity (RDS DATABASE + Sharded NoSQL SHARD_DB)
  let dbReadCapacity = 0;
  let dbWriteCapacity = 0;

  if (byType['DATABASE']) {
    byType['DATABASE'].forEach(db => {
      const tierData = WEAPON_REGISTRY['DATABASE'].tiers[(db.tier || 1) - 1];
      dbReadCapacity += tierData.readRps || 1600;
      dbWriteCapacity += tierData.writeRps || 700;
    });
  }

  if (byType['SHARD_DB']) {
    byType['SHARD_DB'].forEach(sdb => {
      const tierData = WEAPON_REGISTRY['SHARD_DB'].tiers[(sdb.tier || 1) - 1];
      dbReadCapacity += tierData.readRps || 16000;
      dbWriteCapacity += tierData.writeRps || 6500;
    });
  }

  // Separate Read and Write utilization so write locks accurately bottleneck SQL
  const serverLoad = totalServerCapacity > 0 ? netIncomingRps / totalServerCapacity : 999;
  const readLoad = dbReadCapacity > 0 ? readsToDatabase / dbReadCapacity : 999;
  const writeLoad = dbWriteCapacity > 0 ? writesToDatabase / dbWriteCapacity : 999;
  const dbLoad = Math.max(readLoad, writeLoad);

  // 11. M/M/1 Queueing Latency Curve
  let latencyMs = 11;
  if (serverLoad < 0.75) {
    latencyMs += Math.round(serverLoad * 22);
  } else if (serverLoad <= 1.0) {
    latencyMs += Math.round(25 + (serverLoad - 0.75) * 180);
  } else {
    latencyMs += Math.round(95 + (serverLoad - 1.0) * 1400);
  }

  if (dbLoad > 0.8) {
    latencyMs += Math.round((dbLoad - 0.8) * 520);
  }
  if (cacheHitRate > 0) {
    latencyMs = Math.max(4, Math.round(latencyMs * (1 - cacheHitRate * 0.45)));
  }
  if (unconnectedNodes.length > 0 && activeNodes.length === 0) {
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

    if (node.id === chaosVictimId) {
      nodeStatus[node.id] = {
        loadRatio: 0,
        isDead: true,
        isOverloaded: true,
        isUnconnected: false
      };
      return;
    }

    let loadRatio = 0.35;
    if (node.type === 'SERVER' || node.type === 'LAMBDA') {
      loadRatio = serverLoad;
    } else if (node.type === 'DATABASE' || node.type === 'SHARD_DB') {
      loadRatio = dbLoad;
    } else if (node.type === 'LOAD_BALANCER' || node.type === 'API_GATEWAY') {
      loadRatio = lbCapacity > 0 ? netIncomingRps / lbCapacity : 1.2;
    } else if (node.type === 'MESSAGE_QUEUE') {
      loadRatio = queueCapacity > 0 ? writeRps / queueCapacity : 0.9;
    } else if (node.type === 'CACHE' || node.type === 'SEARCH_ENGINE') {
      const cTier = WEAPON_REGISTRY[node.type].tiers[(node.tier || 1) - 1];
      loadRatio = readRps / (cTier.rps || 15000);
    }

    nodeStatus[node.id] = {
      loadRatio: Math.min(1.5, Math.max(0.08, loadRatio)),
      isOverloaded: loadRatio > 1.0,
      isDead: false,
      isUnconnected: false
    };
  });

  return {
    totalCost,
    totalPower,
    hasSPOF: hasSPOF || unconnectedNodes.length > 0 || (chaosVictimId && activeNodes.length === 0),
    spofWarnings,
    unconnectedCount: unconnectedNodes.length,
    serverLoad,
    dbLoad,
    latencyMs,
    cacheHitRate,
    botFiltered,
    staticOffloaded,
    writeBufferActive,
    netIncomingRps,
    nodeStatus
  };
}