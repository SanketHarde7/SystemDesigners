import React, { useState } from 'react';
import { WEAPON_REGISTRY } from '../../constants/weapons';
import { sfx } from '../../engine/audioManager';
import {
  X,
  ArrowUpRight,
  Plus,
  Minus,
  Trash2,
  BookOpen,
  Terminal,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export function TurretInspector({
  selectedNode,
  onClose,
  onUpgradeTier,
  onUpdateCount,
  onToggleStateful,
  onDeleteNode,
  budget,
  currentCost,
  maxPower,
  currentPower
}) {
  const [activeTab, setActiveTab] = useState('eli5');

  if (!selectedNode) return null;
  const reg = WEAPON_REGISTRY[selectedNode.type];
  if (!reg) return null;

  const currentTier = selectedNode.tier || 1;
  const maxTier = reg.tiers.length;
  const currentTierData = reg.tiers[currentTier - 1];
  const nextTierData = currentTier < maxTier ? reg.tiers[currentTier] : null;
  const count = selectedNode.count || 1;

  // Accurate tier-multiplied Upgrade Cost & Power
  const upgradeCost = nextTierData
    ? Math.round(reg.cost * (nextTierData.costMult - currentTierData.costMult) * count)
    : 0;
  const upgradePower = nextTierData
    ? Math.round(reg.power * (nextTierData.powerMult - currentTierData.powerMult) * count)
    : 0;

  const canAffordUpgrade =
    upgradeCost <= budget - currentCost &&
    (maxPower === undefined || upgradePower <= maxPower - currentPower);

  // Accurate tier-multiplied Scale Out (Replica) Cost & Power
  const singleInstanceCost = Math.round(reg.cost * (currentTierData.costMult || 1));
  const singleInstancePower = Math.round(reg.power * (currentTierData.powerMult || 1));
  const canAffordReplica =
    currentCost + singleInstanceCost <= budget &&
    (maxPower === undefined || currentPower + singleInstancePower <= maxPower);

  const isStateful =
    selectedNode.stateful !== undefined ? selectedNode.stateful : reg.stateType === 'STATEFUL';

  return (
    <aside className="w-80 bg-[#121215] border-l border-zinc-800/80 flex flex-col h-full z-20 select-none">
      {/* Inspector Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-start justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            Component Inspector
          </span>
          <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
            {reg.realName}
          </h2>
          <div className="text-[11px] text-zinc-500">{reg.name}</div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 p-1 rounded-lg bg-[#09090b] border border-zinc-800/80 text-xs">
          <button
            onClick={() => setActiveTab('eli5')}
            className={`py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'eli5'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('pro')}
            className={`py-1.5 rounded-md font-medium flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'pro'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>System Spec</span>
          </button>
        </div>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* 1. Vertical Scaling (Hardware Tier) - Placed at Top for Easy Access */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-200">Vertical Scaling (Hardware Tier)</span>
            <span className="font-mono text-[11px] text-indigo-400 font-semibold">
              Tier {currentTier} / {maxTier}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80">
            <div className="text-zinc-200 font-medium">{currentTierData.name}</div>
            <div className="text-zinc-400 font-mono text-[11px] mt-1">
              {currentTierData.rps && `Capacity: ${(currentTierData.rps * count).toLocaleString()} RPS`}
              {currentTierData.writeRps &&
                `Write: ${(currentTierData.writeRps * count).toLocaleString()} RPS | Read: ${(currentTierData.readRps * count).toLocaleString()} RPS`}
              {currentTierData.hitRate && ` • Hit Ratio: ${Math.round(currentTierData.hitRate * 100)}%`}
              {currentTierData.botFilterRate && ` • Bot Drop: ${Math.round(currentTierData.botFilterRate * 100)}%`}
              {currentTierData.staticOffload && ` • Edge Offload: ${Math.round(currentTierData.staticOffload * 100)}%`}
            </div>
          </div>

          {nextTierData ? (
            <button
              disabled={!canAffordUpgrade}
              onClick={() => {
                sfx.playTurretUpgrade();
                onUpgradeTier(selectedNode.id);
              }}
              className={`w-full h-9 px-3 rounded-md flex items-center justify-between text-xs font-medium transition-colors ${
                canAffordUpgrade
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Upgrade to Tier {currentTier + 1}</span>
              </span>
              <span className="font-mono">+${upgradeCost} • +{upgradePower}MW</span>
            </button>
          ) : (
            <div className="h-9 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Maximum Tier (Tier 3) Active</span>
            </div>
          )}
        </div>

        {/* 2. Horizontal Scaling (Replicas) - Enabled for All Components */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-200">Horizontal Scaling (Replicas)</span>
            <span className="font-mono text-xs text-zinc-200">{count}x instances</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={count <= 1}
              onClick={() => onUpdateCount(selectedNode.id, count - 1)}
              className="h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-800 text-zinc-300 flex items-center justify-center gap-1 text-xs font-medium"
            >
              <Minus className="w-3 h-3" />
              <span>Scale In</span>
            </button>
            <button
              disabled={!canAffordReplica}
              onClick={() => {
                sfx.playTurretUpgrade();
                onUpdateCount(selectedNode.id, count + 1);
              }}
              className="h-8 rounded-md bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-800 text-zinc-200 flex items-center justify-center gap-1 text-xs font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>Scale Out (+${singleInstanceCost})</span>
            </button>
          </div>
        </div>

        {/* 3. Session State Mode Toggle (Stateless vs Stateful for SERVER) */}
        {selectedNode.type === 'SERVER' && onToggleStateful && (
          <div className="pt-3 border-t border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-300">Session Architecture</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                  isStateful
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isStateful ? 'STATEFUL (Sticky)' : 'STATELESS'}
              </span>
            </div>
            <button
              onClick={() => onToggleStateful(selectedNode.id)}
              className="w-full h-8 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-indigo-400" />
              <span>Switch to {isStateful ? 'Stateless' : 'Stateful (Sticky Sessions)'}</span>
            </button>
          </div>
        )}

        {/* 4. Educational Documentation */}
        <div className="pt-3 border-t border-zinc-800/80">
          {activeTab === 'eli5' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80 space-y-1.5">
                <div className="font-medium text-zinc-200">
                  {reg.eli5.title}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {reg.eli5.analogy}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80 space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-500">
                  Architectural Purpose
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {reg.eli5.whyNeedIt}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80 space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-500">
                  Design Pattern
                </div>
                <div className="text-xs font-medium text-zinc-200">
                  {reg.interview.pattern}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#09090b] border border-zinc-800/80 space-y-1">
                <div className="text-[10px] font-mono uppercase text-indigo-400">
                  Architecture Note
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {reg.interview.interviewTip}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#09090b] border border-zinc-800/80">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase mb-1">Strengths</div>
                  <div className="text-zinc-400">{reg.interview.pros}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#09090b] border border-zinc-800/80">
                  <div className="text-[10px] font-mono text-amber-400 uppercase mb-1">Tradeoffs</div>
                  <div className="text-zinc-400">{reg.interview.cons}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Decommission Button */}
      <div className="p-4 border-t border-zinc-800/80">
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full h-8 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Component</span>
        </button>
      </div>
    </aside>
  );
}