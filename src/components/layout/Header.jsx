import React from 'react';
import {
  Shield,
  Zap,
  Coins,
  BookOpen,
  Volume2,
  VolumeX,
  ChevronDown,
  Code2,
  Plus,
  Trophy,
  Unlock,
  Calculator,
  Award
} from 'lucide-react';

export function Header({
  missions,
  currentMission,
  onSelectMission,
  metrics,
  userLevel,
  starsTotal,
  onOpenCodex,
  onOpenIaC,
  onOpenCustomMission,
  onOpenLeaderboard,
  onOpenCalculator,
  isMuted,
  onToggleMute,
  onUnlockAll
}) {
  const mission = missions[currentMission];
  const costPct = Math.min(100, Math.round((metrics.totalCost / mission.budget) * 100));
  const powerPct = Math.min(100, Math.round((metrics.totalPower / mission.maxPower) * 100));
  const isOverBudget = metrics.totalCost > mission.budget;
  const isOverPower = metrics.totalPower > mission.maxPower;

  return (
    <header className="h-14 bg-[#0e1117] border-b-2 border-[#1f2430] px-3 flex items-center justify-between gap-2 z-30 select-none">
      {/* Left: Compact Game Emblem + Rank + Mission Selector (No Wrapping!) */}
      <div className="flex items-center gap-2.5 min-w-0 shrink-0">
        {/* Game Logo */}
        <div className="flex items-center gap-2 bg-[#151922] border border-amber-500/30 rounded-md px-2.5 py-1 shrink-0">
          <div className="w-7 h-7 rounded bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-amber-400" />
          </div>
          <div className="leading-tight whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider text-amber-400 uppercase">
                ARCH ARSENAL
              </span>
              <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500 text-black">
                LVL {userLevel.level}
              </span>
            </div>
            <div className="text-[10px] font-mono text-neutral-400 flex items-center gap-1.5">
              <Award className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
              <span>{userLevel.title}</span>
              <span className="text-amber-400 font-bold">★ {starsTotal}</span>
            </div>
          </div>
        </div>

        {/* Mission Selector Dropdown */}
        <div className="relative group shrink-0">
          <button className="h-9 px-3 rounded-md bg-[#151922] hover:bg-[#1c222e] border-2 border-[#262d3d] hover:border-amber-500/50 text-xs font-bold text-neutral-100 flex items-center gap-2 transition-all whitespace-nowrap">
            <span className="w-2 h-2 rounded-sm bg-amber-400 animate-pulse shrink-0" />
            <span className="max-w-[210px] truncate">{mission.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          </button>

          <div className="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-[#12161f] border-2 border-amber-500/40 rounded-md shadow-2xl py-1 hidden group-hover:block z-50">
            {missions.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => onSelectMission(idx)}
                className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors ${
                  idx === currentMission
                    ? 'bg-amber-500/15 text-amber-300 border-l-4 border-amber-400'
                    : 'text-neutral-300 hover:bg-[#1a202c]'
                }`}
              >
                <span className="font-bold">{m.title}</span>
                <span className="text-[10px] font-mono text-neutral-400 truncate">{m.concept}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Tactical Resource Gauges (Single-Line No-Wrap!) */}
      <div className="hidden lg:flex items-center gap-2.5 shrink-0">
        {/* Gold Credits Gauge */}
        <div className="h-9 px-3 rounded-md bg-[#141820] border border-[#252b38] flex items-center gap-2.5 whitespace-nowrap">
          <Coins className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="w-36">
            <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-1">
              <span className="text-neutral-400 font-bold">CREDITS</span>
              <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-amber-300 font-bold'}>
                ${metrics.totalCost} <span className="text-neutral-500">/ ${mission.budget}</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#090b0e] rounded-sm overflow-hidden border border-neutral-800">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverBudget ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, costPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Power Core Gauge */}
        <div className="h-9 px-3 rounded-md bg-[#141820] border border-[#252b38] flex items-center gap-2.5 whitespace-nowrap">
          <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="w-36">
            <div className="flex items-center justify-between text-[10px] font-mono leading-none mb-1">
              <span className="text-neutral-400 font-bold">REACTOR</span>
              <span className={isOverPower ? 'text-rose-400 font-bold' : 'text-emerald-300 font-bold'}>
                {metrics.totalPower} <span className="text-neutral-500">/ {mission.maxPower} MW</span>
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#090b0e] rounded-sm overflow-hidden border border-neutral-800">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverPower ? 'bg-rose-500' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, powerPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Tactical Command Deck Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onOpenCalculator}
          className="h-8 px-2.5 rounded bg-[#161a23] hover:bg-[#1f2532] border border-[#2a3142] text-[11px] font-bold text-amber-300 flex items-center gap-1.5 transition-all whitespace-nowrap"
          title="Back-of-the-Envelope Estimator"
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden xl:inline">Estimator</span>
        </button>

        <button
          onClick={onOpenCustomMission}
          className="h-8 px-2.5 rounded bg-[#161a23] hover:bg-[#1f2532] border border-[#2a3142] text-[11px] font-bold text-neutral-200 flex items-center gap-1.5 transition-all whitespace-nowrap"
          title="Create Custom Scenario"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden xl:inline">Custom</span>
        </button>

        <button
          onClick={onOpenIaC}
          className="h-8 px-2.5 rounded bg-[#161a23] hover:bg-[#1f2532] border border-[#2a3142] text-[11px] font-bold text-neutral-200 flex items-center gap-1.5 transition-all whitespace-nowrap"
          title="Export Terraform / Docker Compose"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="hidden xl:inline">IaC</span>
        </button>

        <button
          onClick={onOpenCodex}
          className="h-8 px-2.5 rounded bg-[#161a23] hover:bg-[#1f2532] border border-[#2a3142] text-[11px] font-bold text-neutral-200 flex items-center gap-1.5 transition-all whitespace-nowrap"
          title="System Design Codex"
        >
          <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="hidden md:inline">Codex</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="h-8 w-8 rounded bg-[#161a23] hover:bg-[#1f2532] border border-[#2a3142] text-amber-400 flex items-center justify-center transition-colors shrink-0"
          title="Leaderboard"
        >
          <Trophy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onUnlockAll}
          className="h-8 w-8 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 flex items-center justify-center transition-colors shrink-0"
          title="Unlock All Components (Sandbox Mode)"
        >
          <Unlock className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleMute}
          className="h-8 w-8 rounded bg-[#161a23] hover:bg-[#1f2532] border border-[#2a3142] text-neutral-300 flex items-center justify-center transition-colors shrink-0"
          title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
        </button>
      </div>
    </header>
  );
}