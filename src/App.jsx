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
import { Play, GitBranch, HelpCircle, ChevronUp, ChevronDown, Activity, FileText } from 'lucide-react';

// Helper to build smart topology connections for any set of nodes
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
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, tier: (n.tier || 1) + 1 } : n)));
  };

  const handleUpdateCount = (id, count) => {
    if (count < 1) return;
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, count } : n)));
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
    const remainingNodes = nodes.filter(n => n.id !== id);
    setNodes(remainingNodes);
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
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

  // Deploying a weapon automatically wires it into the topology so it works immediately!
  const handleDeployWeapon = (weaponType) => {
    const reg = WEAPON_REGISTRY[weaponType];
    const newId = `${weaponType.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const newNode = {
      id: newId,
      type: weaponType,
      tier: 1,
      count: 1,
      stateful: reg ? reg.stateType === 'STATEFUL' : false,
      x: 260 + Math.floor(Math.random() * 140),
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

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 overflow-hidden select-none">
      {/* 1. Minimal Enterprise Header */}
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
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(sfx.toggleMute())}
        onUnlockAll={() => setUnlockedWeapons(Object.keys(WEAPON_REGISTRY))}
      />

      {/* 2. Sub-Header Control Bar */}
      <div className="h-12 px-4 bg-[#121215] border-b border-zinc-800/80 flex items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2 py-0.5 rounded bg-zinc-800/90 border border-zinc-700/70 font-mono text-[11px] text-zinc-300 font-medium whitespace-nowrap">
            {mission.concept}
          </span>
          <p className="text-xs text-zinc-400 truncate">
            {mission.objective}
          </p>
          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-zinc-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Est. Latency:</span>
            <span
              className={
                metrics.latencyMs <= 50
                  ? 'text-emerald-400 font-medium'
                  : metrics.latencyMs <= 120
                  ? 'text-amber-400 font-medium'
                  : 'text-rose-400 font-medium'
              }
            >
              {metrics.latencyMs}ms
            </span>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setIsBriefOpen(true)}
            className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mission Brief</span>
          </button>

          <button
            onClick={() => setShowWalkthrough(!showWalkthrough)}
            className={`h-8 px-3 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              showWalkthrough
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Hints</span>
            {showWalkthrough ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleSmartAutoWire}
            className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auto-Connect</span>
          </button>

          <button
            disabled={isSiegeRunning}
            onClick={handleInitiateSiege}
            className="h-8 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.99]"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>
              {isSiegeRunning ? `Running Wave ${siegeProgress?.wave}/3...` : 'Run Benchmark'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Multi-Column Onboarding Stepper */}
      {showWalkthrough && mission.guidance && (
        <div className="bg-[#0c0c0e] border-b border-zinc-800/80 px-4 py-2.5 z-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {mission.guidance.map((step, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-[#121215] border border-zinc-800/70 flex items-start gap-2.5"
              >
                <span className="w-5 h-5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-[11px] font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Main Interactive Architecture Canvas & Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        <CanvasGrid
          nodes={nodes}
          connections={connections}
          selectedNodeId={selectedNodeId}
          onSelectNode={(id) => setSelectedNodeId(id)}
          metrics={metrics}
          isSiegeRunning={isSiegeRunning}
          onMoveNode={handleMoveNode}
          onAddConnection={handleAddConnection}
          onRemoveConnection={handleRemoveConnection}
        />

        {selectedNodeId && (
          <TurretInspector
            selectedNode={nodes.find(n => n.id === selectedNodeId)}
            onClose={() => setSelectedNodeId(null)}
            onUpgradeTier={handleUpgradeTier}
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

      {/* 5. Minimal Component Dock */}
      <WeaponTray
        unlockedWeapons={unlockedWeapons}
        onDeployWeapon={handleDeployWeapon}
        currentCredits={metrics.totalCost}
        currentPower={metrics.totalPower}
        budget={mission.budget}
        maxPower={mission.maxPower}
      />

      {/* 6. Modals */}
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