import React, { useState, useEffect, useMemo } from 'react';
import { MISSIONS as INITIAL_MISSIONS } from './constants/levels';
import { WEAPON_REGISTRY } from './constants/weapons';
import { solveNetworkTopology } from './engine/simulation';
import { runSiegeEvaluation } from './engine/judge';
import { sfx } from './engine/audioManager';
import { Header } from './components/layout/Header';
import { CanvasGrid } from './components/battlefield/CanvasGrid';
import { WeaponTray } from './components/arsenal/WeaponTray';
import { TurretInspector } from './components/arsenal/TurretInspector';
import { SiegeReportModal } from './components/modals/SiegeReportModal';
import { UnlockCelebrationModal } from './components/modals/UnlockCelebrationModal';
import { ConceptCodexModal } from './components/modals/ConceptCodexModal';
import { IaCExportModal } from './components/modals/IaCExportModal';
import { CustomMissionModal } from './components/modals/CustomMissionModal';
import { LeaderboardModal } from './components/modals/LeaderboardModal';
import { ProblemBriefModal } from './components/modals/ProblemBriefModal';
import {
  Play,
  GitBranch,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Activity,
  FileText,
  RotateCcw,
  Calculator,
  X
} from 'lucide-react';

function buildAutoConnections(nodeList) {
  const newConns = [];
  const addEdge = (from, to) => {
    if (from !== to && !newConns.some(c => c.from === from && c.to === to)) {
      newConns.push({ from, to });
    }
  };

  const edgeNodes = nodeList.filter(n => n.type === 'CDN' || n.type === 'FIREWALL');
  const routingNodes = nodeList.filter(n => n.type === 'LOAD_BALANCER' || n.type === 'API_GATEWAY');
  const computeNodes = nodeList.filter(n => n.type === 'SERVER' || n.type === 'LAMBDA');
  const fastDataNodes = nodeList.filter(
    n => n.type === 'CACHE' || n.type === 'SEARCH_ENGINE' || n.type === 'OBJECT_STORAGE'
  );
  const queueNodes = nodeList.filter(n => n.type === 'MESSAGE_QUEUE');
  const dbNodes = nodeList.filter(n => n.type === 'DATABASE' || n.type === 'SHARD_DB');

  if (routingNodes.length > 0) {
    edgeNodes.forEach(e => routingNodes.forEach(r => addEdge(e.id, r.id)));
    routingNodes.forEach(r => computeNodes.forEach(c => addEdge(r.id, c.id)));
  } else {
    edgeNodes.forEach(e => computeNodes.forEach(c => addEdge(e.id, c.id)));
  }

  computeNodes.forEach(s => {
    fastDataNodes.forEach(c => addEdge(s.id, c.id));
    if (queueNodes.length > 0) {
      queueNodes.forEach(q => addEdge(s.id, q.id));
    } else {
      dbNodes.forEach(d => addEdge(s.id, d.id));
    }
  });

  queueNodes.forEach(q => dbNodes.forEach(d => addEdge(q.id, d.id)));
  return newConns;
}

export default function App() {
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [currentMissionIdx, setCurrentMissionIdx] = useState(0);
  const mission = missions[currentMissionIdx];

  const [nodes, setNodes] = useState(mission.initialNodes);
  const [connections, setConnections] = useState(mission.initialConnections);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(true);

  const [unlockedWeapons, setUnlockedWeapons] = useState(mission.unlockedAtStart);
  const [bestStarsByMission, setBestStarsByMission] = useState({});
  const [isMuted, setIsMuted] = useState(false);

  const [isSiegeRunning, setIsSiegeRunning] = useState(false);
  const [siegeProgress, setSiegeProgress] = useState(null);
  const [siegeReport, setSiegeReport] = useState(null);
  const [unlockedPopupWeapon, setUnlockedPopupWeapon] = useState(null);

  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isIaCOpen, setIsIaCOpen] = useState(false);
  const [isCustomMissionOpen, setIsCustomMissionOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const [calcDauMillions, setCalcDauMillions] = useState(10);
  const [calcReqPerUser, setCalcReqPerUser] = useState(20);
  const [calcPayloadKb, setCalcPayloadKb] = useState(15);

  useEffect(() => {
    setNodes(mission.initialNodes);
    setConnections(mission.initialConnections);
    setSelectedNodeId(null);
    setSiegeReport(null);
    setUnlockedWeapons(prev => Array.from(new Set([...prev, ...mission.unlockedAtStart])));
  }, [currentMissionIdx, missions]);

  const starsTotal = useMemo(() => {
    return Object.values(bestStarsByMission).reduce((sum, s) => sum + s, 0);
  }, [bestStarsByMission]);

  const metrics = useMemo(() => {
    return solveNetworkTopology({
      nodes,
      connections,
      targetRps: mission.targetRps,
      trafficProfile: mission.trafficProfile
    });
  }, [nodes, connections, mission]);

  const userRank = useMemo(() => {
    if (starsTotal >= 18) return { level: 5, title: 'Principal Architect' };
    if (starsTotal >= 12) return { level: 4, title: 'Staff Systems Engineer' };
    if (starsTotal >= 7)  return { level: 3, title: 'Senior Cloud Engineer' };
    if (starsTotal >= 3)  return { level: 2, title: 'Systems Engineer' };
    return { level: 1, title: 'Associate Architect' };
  }, [starsTotal]);

  const handleMoveNode = (id, x, y) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, x, y } : n)));
  };

  const handleUpgradeTier = (id) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const reg = WEAPON_REGISTRY[n.type];
        const currentTier = n.tier || 1;
        if (!reg || currentTier >= reg.tiers.length) return n;

        const nextTierData = reg.tiers[currentTier];
        const currentTierData = reg.tiers[currentTier - 1];
        const count = n.count || 1;
        const extraCost = Math.round(reg.cost * (nextTierData.costMult - currentTierData.costMult) * count);
        const extraPower = Math.round(reg.power * (nextTierData.powerMult - currentTierData.powerMult) * count);

        if (metrics.totalCost + extraCost > mission.budget || metrics.totalPower + extraPower > mission.maxPower) {
          return n;
        }
        sfx.playTurretUpgrade();
        return { ...n, tier: currentTier + 1 };
      })
    );
  };

  const handleDowngradeTier = (id) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const currentTier = n.tier || 1;
        if (currentTier <= 1) return n;
        sfx.playTurretUpgrade();
        return { ...n, tier: currentTier - 1 };
      })
    );
  };

  const handleSetTier = (id, targetTier) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const reg = WEAPON_REGISTRY[n.type];
        if (!reg || targetTier < 1 || targetTier > reg.tiers.length) return n;
        return { ...n, tier: targetTier };
      })
    );
  };

  const handleUpdateCount = (id, newCount) => {
    if (newCount < 1) return;
    setNodes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const currentCount = n.count || 1;
        if (newCount > currentCount) {
          const reg = WEAPON_REGISTRY[n.type];
          const tierData = reg?.tiers[(n.tier || 1) - 1] || reg?.tiers[0];
          const singleCost = Math.round((reg?.cost || 100) * (tierData?.costMult || 1));
          const singlePower = Math.round((reg?.power || 10) * (tierData?.powerMult || 1));
          if (
            metrics.totalCost + singleCost > mission.budget ||
            metrics.totalPower + singlePower > mission.maxPower
          ) {
            return n;
          }
        }
        sfx.playTurretUpgrade();
        return { ...n, count: newCount };
      })
    );
  };

  const handleToggleStateful = (id) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id !== id) return n;
        const reg = WEAPON_REGISTRY[n.type];
        const currentStateful =
          n.stateful !== undefined ? n.stateful : reg?.stateType === 'STATEFUL';
        return { ...n, stateful: !currentStateful };
      })
    );
  };

  const handleDeleteNode = (id) => {
    if (!id) return;
    sfx.playLaserShot();
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    setSelectedNodeId(prev => (prev === id ? null : prev));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedNodeId) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteNode(selectedNodeId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);

  const handleResetMission = () => {
    sfx.playTurretUpgrade();
    setNodes(mission.initialNodes);
    setConnections(mission.initialConnections);
    setSelectedNodeId(null);
  };

  const handleAddConnection = (fromId, toId) => {
    if (!fromId || !toId || fromId === toId) return;
    setConnections(prev => {
      const exists = prev.some(
        c => (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
      );
      if (exists) return prev;
      sfx.playTurretUpgrade();
      return [...prev, { from: fromId, to: toId }];
    });
  };

  const handleRemoveConnection = (fromId, toId) => {
    setConnections(prev => prev.filter(c => !(c.from === fromId && c.to === toId)));
  };

  const handleDeployWeapon = (weaponType) => {
    const reg = WEAPON_REGISTRY[weaponType];
    const newId = `${weaponType.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const newNode = {
      id: newId,
      type: weaponType,
      tier: 1,
      count: 1,
      stateful: reg ? reg.stateType === 'STATEFUL' : false,
      x: 280 + Math.floor(Math.random() * 140),
      y: 120 + Math.floor(Math.random() * 140)
    };
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    setConnections(buildAutoConnections(updatedNodes));
    setSelectedNodeId(newId);
  };

  const handleSmartAutoWire = () => {
    sfx.playTurretUpgrade();
    setConnections(buildAutoConnections(nodes));
  };

  const handleAddCustomMission = async (customMission) => {
    const updated = [...missions, customMission];
    setMissions(updated);
    setCurrentMissionIdx(updated.length - 1);
    try {
      await fetch('http://localhost:5000/api/custom-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customMission)
      });
    } catch (e) {}
  };

  const handleInitiateSiege = async () => {
    setIsSiegeRunning(true);
    sfx.playLaserShot();

    const report = await runSiegeEvaluation({
      mission,
      nodes,
      connections,
      onProgress: (prog) => setSiegeProgress(prog)
    });

    setIsSiegeRunning(false);
    setSiegeProgress(null);
    setSiegeReport(report);

    if (report.success) {
      sfx.playVictory();
      setBestStarsByMission(prev => ({
        ...prev,
        [mission.id]: Math.max(prev[mission.id] || 0, report.stars)
      }));

      if (
        mission.newWeaponReward &&
        WEAPON_REGISTRY[mission.newWeaponReward] &&
        !unlockedWeapons.includes(mission.newWeaponReward)
      ) {
        setUnlockedWeapons(prev => [...prev, mission.newWeaponReward]);
        setUnlockedPopupWeapon(mission.newWeaponReward);
      }

      try {
        await fetch('http://localhost:5000/api/siege-record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Anil_Architect',
            missionId: mission.id,
            grade: report.grade,
            stars: report.stars,
            avgLatency: report.avgLatency,
            totalCost: metrics.totalCost,
            nodes,
            connections
          })
        });
      } catch (e) {}
    } else {
      sfx.playDefeat();
    }
  };

  const avgQps = Math.round((calcDauMillions * 1_000_000 * calcReqPerUser) / 86400);
  const peakQps = Math.round(avgQps * 2.5);
  const bandwidthMbps = Math.round((peakQps * calcPayloadKb * 8) / 1000);
  const storageTbPerYear = (
    ((calcDauMillions * 1_000_000 * (calcReqPerUser * 0.2) * calcPayloadKb) / 1_000_000_000) *
    365
  ).toFixed(1);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#060913] text-zinc-100 overflow-hidden select-none">
      <Header
        missions={missions}
        currentMission={currentMissionIdx}
        onSelectMission={(idx) => setCurrentMissionIdx(idx)}
        metrics={metrics}
        userLevel={userRank}
        starsTotal={starsTotal}
        onOpenCodex={() => setIsCodexOpen(true)}
        onOpenIaC={() => setIsIaCOpen(true)}
        onOpenCustomMission={() => setIsCustomMissionOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenCalculator={() => setIsCalculatorOpen(true)}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(sfx.toggleMute())}
        onUnlockAll={() => setUnlockedWeapons(Object.keys(WEAPON_REGISTRY))}
      />

      <div className="h-12 px-4 bg-[#0b1120] border-b border-slate-800/90 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 font-mono text-[11px] text-indigo-300 font-semibold whitespace-nowrap">
            🎯 {mission.concept}
          </span>
          <p className="text-xs text-slate-300 font-medium truncate">
            {mission.objective}
          </p>
          <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Est. Ping:</span>
            <span
              className={
                metrics.latencyMs <= 50
                  ? 'text-emerald-400 font-bold'
                  : metrics.latencyMs <= 120
                  ? 'text-amber-400 font-bold'
                  : 'text-rose-400 font-bold'
              }
            >
              {metrics.latencyMs}ms
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsBriefOpen(true)}
            className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mission Brief</span>
          </button>

          <button
            onClick={() => setShowWalkthrough(!showWalkthrough)}
            className={`h-8 px-3 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
              showWalkthrough
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Quest Hints</span>
            {showWalkthrough ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleResetMission}
            title="Reset Map to Initial State"
            className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleSmartAutoWire}
            className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>Auto-Wire</span>
          </button>

          <button
            disabled={isSiegeRunning}
            onClick={handleInitiateSiege}
            className="h-8 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {isSiegeRunning ? `Wave ${siegeProgress?.wave}/3 Incoming...` : 'Launch Siege Test'}
            </span>
          </button>
        </div>
      </div>

      {showWalkthrough && mission.guidance && (
        <div className="bg-[#080d1a] border-b border-indigo-500/20 px-4 py-2.5 z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {mission.guidance.map((step, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-[#0f172a] border border-slate-800 flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <CanvasGrid
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          metrics={metrics}
          trafficProfile={mission.trafficProfile}
          isSiegeRunning={isSiegeRunning}
          onMoveNode={handleMoveNode}
          onAddConnection={handleAddConnection}
          onRemoveConnection={handleRemoveConnection}
          onUpgradeTier={handleUpgradeTier}
          onDowngradeTier={handleDowngradeTier}
          onUpdateCount={handleUpdateCount}
          onDeleteNode={handleDeleteNode}
        />

        {selectedNodeId && (
          <TurretInspector
            selectedNode={nodes.find(n => n.id === selectedNodeId)}
            onClose={() => setSelectedNodeId(null)}
            onUpgradeTier={handleUpgradeTier}
            onDowngradeTier={handleDowngradeTier}
            onSetTier={handleSetTier}
            onUpdateCount={handleUpdateCount}
            onToggleStateful={handleToggleStateful}
            onDeleteNode={handleDeleteNode}
            budget={mission.budget}
            currentCost={metrics.totalCost}
            maxPower={mission.maxPower}
            currentPower={metrics.totalPower}
          />
        )}
      </div>

      <WeaponTray
        unlockedWeapons={unlockedWeapons}
        onDeployWeapon={handleDeployWeapon}
        currentCredits={metrics.totalCost}
        currentPower={metrics.totalPower}
        budget={mission.budget}
        maxPower={mission.maxPower}
      />

      {isCalculatorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-[#0d1326] border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#080d1a]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">
                  Back-of-the-Envelope System Estimator
                </h2>
              </div>
              <button
                onClick={() => setIsCalculatorOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-400 leading-relaxed">
                In real interviews, you estimate traffic & storage before placing components. Adjust the inputs below to see how DAU translates into RPS and Storage:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800">
                  <label className="text-[10px] text-slate-400 block mb-1">Daily Active Users (M)</label>
                  <input
                    type="number"
                    min="1"
                    value={calcDauMillions}
                    onChange={(e) => setCalcDauMillions(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-sm"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800">
                  <label className="text-[10px] text-slate-400 block mb-1">Actions / User / Day</label>
                  <input
                    type="number"
                    min="1"
                    value={calcReqPerUser}
                    onChange={(e) => setCalcReqPerUser(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-sm"
                  />
                </div>
                <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800">
                  <label className="text-[10px] text-slate-400 block mb-1">Avg Payload (KB)</label>
                  <input
                    type="number"
                    min="1"
                    value={calcPayloadKb}
                    onChange={(e) => setCalcPayloadKb(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                  <span className="text-[10px] text-indigo-300 block">AVERAGE QPS (DAU × Req / 86,400s)</span>
                  <span className="text-lg font-bold text-white">{avgQps.toLocaleString()} RPS</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[10px] text-amber-300 block">PEAK LOAD (2.5x Surge)</span>
                  <span className="text-lg font-bold text-amber-300">{peakQps.toLocaleString()} RPS</span>
                </div>
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-300 block">INGRESS BANDWIDTH</span>
                  <span className="text-base font-bold text-cyan-300">{bandwidthMbps.toLocaleString()} Mbps</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-300 block">1-YEAR WRITE STORAGE</span>
                  <span className="text-base font-bold text-emerald-300">{storageTbPerYear} TB / yr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SiegeReportModal
        report={siegeReport}
        mission={mission}
        onNextMission={() => {
          setSiegeReport(null);
          setCurrentMissionIdx(prev => Math.min(missions.length - 1, prev + 1));
        }}
        onRetry={() => setSiegeReport(null)}
        isLastMission={currentMissionIdx === missions.length - 1}
      />

      {unlockedPopupWeapon && (
        <UnlockCelebrationModal
          weaponId={unlockedPopupWeapon}
          onClose={() => setUnlockedPopupWeapon(null)}
        />
      )}

      {isBriefOpen && <ProblemBriefModal mission={mission} onClose={() => setIsBriefOpen(false)} />}
      {isCodexOpen && <ConceptCodexModal onClose={() => setIsCodexOpen(false)} />}
      {isIaCOpen && <IaCExportModal nodes={nodes} onClose={() => setIsIaCOpen(false)} />}
      {isCustomMissionOpen && (
        <CustomMissionModal
          onCreateMission={handleAddCustomMission}
          onClose={() => setIsCustomMissionOpen(false)}
        />
      )}
      {isLeaderboardOpen && <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} />}
    </div>
  );
}