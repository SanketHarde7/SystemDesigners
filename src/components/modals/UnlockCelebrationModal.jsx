import React from 'react';
import { Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { WEAPON_REGISTRY } from '../../constants/weapons';

export function UnlockCelebrationModal({ weaponId, onClose }) {
  if (!weaponId) return null;
  const weapon = WEAPON_REGISTRY[weaponId];
  if (!weapon) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none">
      <div className="w-full max-w-md bg-[#121215] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 border-b border-zinc-800/80 bg-[#09090b] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
              New Infrastructure Component Unlocked
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 mt-0.5">
              {weapon.realName}
            </h2>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#09090b] border border-zinc-800 space-y-1.5">
            <div className="font-medium text-zinc-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{weapon.eli5.title}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {weapon.eli5.analogy}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 font-mono text-[11px]">
            <div className="p-2.5 rounded-lg bg-[#09090b] border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">PROVISION COST</span>
              <span className="text-zinc-200 font-semibold">${weapon.cost} / instance</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#09090b] border border-zinc-800">
              <span className="text-[10px] text-zinc-500 block">POWER DRAW</span>
              <span className="text-zinc-200 font-semibold">{weapon.power} MW</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full h-9 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Continue to Next Scenario</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}