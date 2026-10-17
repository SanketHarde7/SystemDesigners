import { solveNetworkTopology } from './simulation';

/**
 * Executes the 3-Wave Boss Siege simulation.
 * Wave 1: Baseline Traffic (1.0x Target RPS)
 * Wave 2: Flash Surge (1.35x Target RPS)
 * Wave 3: Chaos Monkey Outage (random component outage test)
 */
export async function runSiegeEvaluation({ mission, nodes, connections, onProgress }) {
  const steps = [
    { wave: 1, name: 'Wave 1: Baseline Traffic Surge', mult: 1.0, chaos: null },
    { wave: 2, name: 'Wave 2: Flash Traffic Peak (1.35x)', mult: 1.35, chaos: null },
    { wave: 3, name: 'Wave 3: Chaos Monkey Infiltration', mult: 1.20, chaos: 'RANDOM' }
  ];

  const waveResults = [];
  let budgetFailed = false;
  let powerFailed = false;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (onProgress) {
      onProgress({ wave: step.wave, total: 3, name: step.name });
    }
    await new Promise(r => setTimeout(r, 650));

    let chaosVictimId = null;
    if (step.chaos === 'RANDOM') {
      const killable = nodes.filter(n => n.type === 'SERVER' || n.type === 'LOAD_BALANCER' || n.type === 'CACHE');
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

    const wavePassed = metrics.serverLoad <= 1.05 && metrics.dbLoad <= 1.15 && !metrics.hasSPOF;
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
  const avgLatency = Math.round(waveResults.reduce((acc, w) => acc + w.latencyMs, 0) / waveResults.length);
  
  let grade = 'F';
  let stars = 0;

  if (allPassed) {
    if (avgLatency <= 35) {
      grade = 'S';
      stars = 3;
    } else if (avgLatency <= 60) {
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
    diagnostics.push('❌ Budget Exceeded: You spent more Gold Credits than authorized for this mission.');
  }
  if (powerFailed) {
    diagnostics.push('❌ Reactor Core Overheated: Total energy requirement surpassed maximum power cap.');
  }
  if (waveResults.some(w => w.serverLoad > 1.05)) {
    diagnostics.push('⚠️ Server Meltdown: Compute turrets bottlenecked. Add more servers or upgrade tiers.');
  }
  if (waveResults.some(w => w.dbLoad > 1.15)) {
    diagnostics.push('⚠️ Database Exhaustion: SQL vault struggled under write/read locks. Deploy Caching or Message Queues.');
  }
  if (waveResults.some(w => w.spof)) {
    diagnostics.push('⚠️ Single Point of Failure: The system could not endure Chaos Monkey node failure without dropping traffic.');
  }
  if (allPassed) {
    diagnostics.push(`🏆 Outstanding Architecture: P99 latency maintained at ${avgLatency}ms. All SLA requirements fulfilled.`);
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