import React, { useState } from 'react';
import { WEAPON_REGISTRY } from '../../constants/weapons';
import { sfx } from '../../engine/audioManager';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Trash2,
  BookOpen,
  Terminal,
  RefreshCw
} from 'lucide-react';

export function TurretInspector({
  selectedNode,
  onClose,
  onUpgradeTier,
  onDowngradeTier,
  onSetTier,
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
  const prevTierData = currentTier > 1 ? reg.tiers[currentTier - 2] : null;
  const count = selectedNode.count || 1;

  // Accurate tier-multiplied Upgrade Cost & Power
  const upgradeCost = nextTierData
    ? Math.round(reg.cost * (nextTierData.costMult - currentTierData.costMult) * count)
    : 0;
  const upgradePower = nextTierData
    ? Math.round(reg.power * (nextTierData.powerMult - currentTierData.powerMult) * count)
    : 0;

  // Accurate tier-multiplied Downgrade Refund
  const downgradeRefund = prevTierData
    ? Math.round(reg.cost * (currentTierData.costMult - prevTierData.costMult) * count)
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
    <aside className="w-80 bg-[#0b1120] border-l border-indigo-500/20 flex flex-col h-full z-20 select-none shadow-2xl">
      {/* Inspector Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-start justify-between bg-[#080d1a]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            Turret Upgrade Deck
          </span>
          <h2 className="text-sm font-bold text-white mt-0.5">
            {reg.name}
          </h2>
          <div className="text-[11px] text-slate-400">{reg.realName}</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* 1. Vertical Scaling (Interactive Tier 1 / 2 / 3 Selector + Upgrade/Downgrade) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white">1. Hardware Tier (Scale Up / Down)</span>
            <span className="font-mono text-[11px] text-amber-400 font-bold">
              {'★'.repeat(currentTier)}{'☆'.repeat(maxTier - currentTier)} Tier {currentTier}
            </span>
          </div>

          {/* Clickable 3-Tier Cards */}
          <div className="space-y-1.5">
            {reg.tiers.map((tData) => {
              const tNum = tData.tier;
              const isCurrent = tNum === currentTier;
              const tierTotalCost = Math.round(reg.cost * (tData.costMult || 1) * count);
              const currentTotalCost = Math.round(reg.cost * (currentTierData.costMult || 1) * count);
              const diffCost = tierTotalCost - currentTotalCost;

              const tierTotalPower = Math.round(reg.power * (tData.powerMult || 1) * count);
              const currentTotalPower = Math.round(reg.power * (currentTierData.powerMult || 1) * count);
              const diffPower = tierTotalPower - currentTotalPower;

              const canSelectTier =
                tNum < currentTier ||
                (diffCost <= budget - currentCost &&
                  (maxPower === undefined || diffPower <= maxPower - currentPower));

              return (
                <button
                  key={tNum}
                  disabled={isCurrent || !canSelectTier}
                  onClick={() => {
                    sfx.playTurretUpgrade();
                    if (onSetTier) onSetTier(selectedNode.id, tNum);
                  }}
                  className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isCurrent
                      ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-md'
                      : canSelectTier
                      ? 'bg-[#090d1a] hover:bg-slate-800/80 border-slate-800 hover:border-slate-600 text-slate-300 cursor-pointer'
                      : 'bg-[#090d1a]/40 border-slate-900 text-slate-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">
                        T{tNum}
                      </span>
                      <span className="font-semibold text-xs truncate">{tData.name}</span>
                    </div>
                    <div className="text-[10px] font-mono text-cyan-400 mt-1">
                      {tData.rps && `${(tData.rps * count).toLocaleString()} RPS`}
                      {tData.writeRps &&
                        `W: ${(tData.writeRps * count).toLocaleString()} | R: ${(tData.readRps * count).toLocaleString()} RPS`}
                      {tData.hitRate && ` • ${Math.round(tData.hitRate * 100)}% Hit`}
                      {tData.botFilterRate && ` • ${Math.round(tData.botFilterRate * 100)}% Block`}
                      {tData.staticOffload && ` • ${Math.round(tData.staticOffload * 100)}% Offload`}
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] flex-shrink-0">
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        ACTIVE
                      </span>
                    ) : diffCost < 0 ? (
                      <span className="text-emerald-400 font-bold block">
                        Refund +${Math.abs(diffCost)}
                      </span>
                    ) : (
                      <span className={canSelectTier ? 'text-amber-300 font-bold block' : 'text-rose-400 block'}>
                        +${diffCost}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explicit Downgrade & Upgrade Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              disabled={!prevTierData}
              onClick={() => {
                sfx.playTurretUpgrade();
                if (onDowngradeTier) onDowngradeTier(selectedNode.id);
              }}
              className="h-9 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-35 border border-slate-700 text-emerald-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{prevTierData ? `Downgrade (+$${downgradeRefund})` : 'Min Tier'}</span>
            </button>

            <button
              disabled={!nextTierData || !canAffordUpgrade}
              onClick={() => {
                sfx.playTurretUpgrade();
                onUpgradeTier(selectedNode.id);
              }}
              className="h-9 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-35 text-white font-semibold text-[11px] flex items-center justify-center gap-1 shadow-md transition-all"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{nextTierData ? `Upgrade (-$${upgradeCost})` : 'Max Tier'}</span>
            </button>
          </div>
        </div>

        {/* 2. Horizontal Scaling (Replicas) */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white">2. Replica Count (Scale Out / In)</span>
            <span className="font-mono text-xs font-bold text-cyan-300">{count}x Instances</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              disabled={count <= 1}
              onClick={() => {
                sfx.playTurretUpgrade();
                onUpdateCount(selectedNode.id, count - 1);
              }}
              className="h-9 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-35 border border-slate-700 text-emerald-300 flex items-center justify-center gap-1 text-[11px] font-semibold"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>Remove (+${singleInstanceCost})</span>
            </button>
            <button
              disabled={!canAffordReplica}
              onClick={() => {
                sfx.playTurretUpgrade();
                onUpdateCount(selectedNode.id, count + 1);
              }}
              className="h-9 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 disabled:opacity-35 border border-cyan-500/40 text-cyan-200 flex items-center justify-center gap-1 text-[11px] font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Replica (-${singleInstanceCost})</span>
            </button>
          </div>
        </div>

        {/* 3. Stateless vs Stateful Toggle (For Compute) */}
        {selectedNode.type === 'SERVER' && onToggleStateful && (
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white">3. Session Mode</span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full border font-bold ${
                  isStateful
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {isStateful ? 'STATEFUL (Sticky)' : 'STATELESS'}
              </span>
            </div>
            <button
              onClick={() => onToggleStateful(selectedNode.id)}
              className="w-full h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-cyan-400" />
              <span>Switch to {isStateful ? 'Stateless (Recommended)' : 'Stateful'}</span>
            </button>
          </div>
        )}

        {/* 4. Beginner Guide vs Interview Spec Tabs */}
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#080d1a] border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('eli5')}
              className={`py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'eli5'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Beginner Guide</span>
            </button>
            <button
              onClick={() => setActiveTab('pro')}
              className={`py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'pro'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Interview Tips</span>
            </button>
          </div>

          {activeTab === 'eli5' ? (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 space-y-1">
                <div className="font-bold text-amber-300">
                  💡 {reg.eli5.title}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {reg.eli5.analogy}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold">
                  When to Deploy This
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {reg.eli5.whyNeedIt}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#080d1a] border border-slate-800 space-y-1">
                <div className="text-[10px] font-mono uppercase text-indigo-400 font-semibold">
                  FAANG Interview Tip
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {reg.interview.interviewTip}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold mb-1">Pros</div>
                  <div className="text-slate-300">{reg.interview.pros}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                  <div className="text-[10px] font-mono text-amber-400 uppercase font-bold mb-1">Cons</div>
                  <div className="text-slate-300">{reg.interview.cons}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Delete Button */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080d1a]">
        <button
          onClick={() => onDeleteNode(selectedNode.id)}
          className="w-full h-9 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Component (Del / Backspace)</span>
        </button>
      </div>
    </aside>
  );
}