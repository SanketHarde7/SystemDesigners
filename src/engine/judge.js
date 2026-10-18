import { solveNetworkTopology } from './simulation';

/**
 * Executes the 3-Wave Boss Siege simulation.
 * Evaluates ANY valid architecture based on real capacity, resilience, and SLA limits.
 */
export async function runSiegeEvaluation({ mission, nodes, connections, onProgress }) {
  // Only Mission 4 (explicit Chaos Monkey mission) and Mission 8 (Capstone) inject hardware faults in Wave 3
  const isChaosMission = mission.id === 4 || mission.id === 8;

  const steps = [
    { wave: 1, name: 'Wave 1: Baseline Traffic Surge (1.0x)', mult: 1.0, chaos: null },
    { wave: 2, name: 'Wave 2: Flash Traffic Peak (1.35x)', mult: 1.35, chaos: null },
    {
      wave: 3,
      name: isChaosMission
        ? 'Wave 3: Chaos Monkey AZ Failover Test (1.20x)'
        : 'Wave 3: Sustained Endurance Load (1.20x)',
      mult: 1.2,
      chaos: isChaosMission ? 'RANDOM' : null
    }
  ];

  const waveResults = [];
  let budgetFailed = false;
  let powerFailed = false;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (onProgress) {
      onProgress({ wave: step.wave, total: 3, name: step.name });
    }

    await new Promise(r => setTimeout(r, 600));

    let chaosVictimId = null;
    if (step.chaos === 'RANDOM') {
      const killable = nodes.filter(
        n =>
          n.type === 'SERVER' ||
          n.type === 'LOAD_BALANCER' ||
          n.type === 'DATABASE' ||
          n.type === 'CACHE'
      );
      if (killable.length > 0) {
        chaosVictimId = killable[Math.floor(Math.random() * killable.length)].id;
      }
    }

    const testRps = Math.round(mission.targetRps * step.mult);
    const metrics = solveNetworkTopology({
      nodes,
      connections,
      targetRps: testRps,
      trafficProfile: mission.trafficProfile,
      chaosVictimId
    });

    if (metrics.totalCost > mission.budget) budgetFailed = true;
    if (metrics.totalPower > mission.maxPower) powerFailed = true;

    const wavePassed =
      metrics.serverLoad <= 1.10 &&
      metrics.dbLoad <= 1.15 &&
      (metrics.lbLoad || 0) <= 1.15 &&
      !metrics.hasSPOF;

    waveResults.push({
      wave: step.wave,
      name: step.name,
      testRps,
      passed: wavePassed,
      latencyMs: metrics.latencyMs,
      serverLoad: metrics.serverLoad,
      dbLoad: metrics.dbLoad,
      spof: metrics.hasSPOF,
      chaosVictimId
    });
  }

  const allPassed = waveResults.every(w => w.passed) && !budgetFailed && !powerFailed;
  const avgLatency = Math.round(
    waveResults.reduce((acc, w) => acc + w.latencyMs, 0) / waveResults.length
  );

  let grade = 'F';
  let stars = 0;

  if (allPassed) {
    if (avgLatency <= 40) {
      grade = 'S';
      stars = 3;
    } else if (avgLatency <= 75) {
      grade = 'A';
      stars = 2;
    } else {
      grade = 'B';
      stars = 1;
    }
  } else {
    grade = budgetFailed || powerFailed ? 'C' : 'F';
    stars = 0;
  }

  const diagnostics = [];
  if (budgetFailed) {
    diagnostics.push(
      '❌ Budget Exceeded: Total hardware cost exceeded the mission budget. Try using caching, queues, or lower-tier horizontal replicas.'
    );
  }
  if (powerFailed) {
    diagnostics.push(
      '❌ Power Limit Exceeded: Total MW power draw surpassed the mission envelope.'
    );
  }
  if (waveResults.some(w => w.serverLoad > 1.10)) {
    const peakSrv = Math.max(...waveResults.map(w => Math.round(w.serverLoad * 100)));
    diagnostics.push(
      `❌ Compute Bottleneck (Peak ${peakSrv}% CPU): Upgrade Server tier (e.g., Tier 2/3), scale out replicas, add Serverless Lambda, or offload traffic via CDN/WAF/Cache.`
    );
  }
  if (waveResults.some(w => w.dbLoad > 1.15)) {
    const peakDb = Math.max(...waveResults.map(w => Math.round(w.dbLoad * 100)));
    diagnostics.push(
      `❌ Storage I/O Bottleneck (Peak ${peakDb}% DB Load): Upgrade Database tier, scale out DB replicas, add Redis Cache for reads, or add a Message Queue / Sharded DB for writes.`
    );
  }
  if (waveResults.some(w => w.spof)) {
    diagnostics.push(
      '❌ Missing Critical Layer: Every architecture requires at least one active Compute node and one active Database/Storage node.'
    );
  }
  if (allPassed) {
    diagnostics.push(
      `✅ SLA Benchmark Passed! Average P99 latency maintained at ${avgLatency}ms across all 3 waves.`
    );
  }

  return {
    success: allPassed,
    grade,
    stars,
    avgLatency,
    budgetFailed,
    powerFailed,
    waveResults,
    diagnostics
  };
}