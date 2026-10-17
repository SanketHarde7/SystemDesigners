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
  Unlock
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
    <header className="h-14 bg-[#09090b] border-b border-zinc-800/80 px-4 flex items-center justify-between z-30 select-none">
      {/* Left: Brand Identity & Mission Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-100">
                ArchArsenal
              </span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                v2.4
              </span>
            </div>
            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <span>{userLevel.title}</span>
              <span>•</span>
              <span className="font-mono text-zinc-400">{starsTotal} pts</span>
            </div>
          </div>
        </div>

        <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

        {/* Mission Selector Dropdown */}
        <div className="relative group">
          <button className="h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 text-xs font-medium text-zinc-200 flex items-center gap-2 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="max-w-[200px] truncate">{mission.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>

          <div className="absolute top-full left-0 mt-1 w-80 max-h-96 overflow-y-auto bg-[#121215] border border-zinc-800 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
            {missions.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => onSelectMission(idx)}
                className={`w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 transition-colors ${
                  idx === currentMission
                    ? 'bg-indigo-600/10 text-indigo-300 border-l-2 border-indigo-500'
                    : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <span className="font-medium">{m.title}</span>
                <span className="text-[11px] text-zinc-500 truncate">{m.concept}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Center: Minimal Resource Telemetry Pills */}
      <div className="hidden lg:flex items-center gap-6">
        {/* Budget Meter */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Coins className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-zinc-500 font-medium">Budget</span>
              <span className={`font-mono font-medium ${isOverBudget ? 'text-rose-400' : 'text-zinc-200'}`}>
                ${metrics.totalCost} <span className="text-zinc-600">/ ${mission.budget}</span>
              </span>
            </div>
            <div className="w-28 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min(100, costPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Power Meter */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-zinc-500 font-medium">Compute Power</span>
              <span className={`font-mono font-medium ${isOverPower ? 'text-rose-400' : 'text-zinc-200'}`}>
                {metrics.totalPower} <span className="text-zinc-600">/ {mission.maxPower} MW</span>
              </span>
            </div>
            <div className="w-28 h-1 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isOverPower ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, powerPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Unified Monochrome Action Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenCustomMission}
          className="h-8 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">New Scenario</span>
        </button>

        <button
          onClick={onOpenIaC}
          className="h-8 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-1.5 transition-colors"
        >
          <Code2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Export IaC</span>
        </button>

        <button
          onClick={onOpenCodex}
          className="h-8 px-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 flex items-center gap-1.5 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden md:inline">Docs</span>
        </button>

        <button
          onClick={onOpenLeaderboard}
          className="h-8 w-8 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
          title="Leaderboard"
        >
          <Trophy className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onUnlockAll}
          className="h-8 w-8 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
          title="Unlock Sandbox Mode"
        >
          <Unlock className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleMute}
          className="h-8 w-8 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-zinc-600" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
}