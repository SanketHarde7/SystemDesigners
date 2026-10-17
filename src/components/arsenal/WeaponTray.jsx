import React from 'react';
import { Cpu, Database, Shuffle, Zap, Globe, Layers, ShieldAlert, Boxes, Lock } from 'lucide-react';
import { WEAPON_REGISTRY } from '../../constants/weapons';
import { sfx } from '../../engine/audioManager';

const ICONS = {
  Cpu,
  Database,
  Shuffle,
  Zap,
  Globe,
  Layers,
  ShieldAlert,
  Boxes
};

export function WeaponTray({
  unlockedWeapons,
  onDeployWeapon,
  currentCredits,
  currentPower,
  maxPower,
  budget
}) {
  const allWeapons = Object.values(WEAPON_REGISTRY);

  return (
    <div className="h-24 bg-[#0c0c0e] border-t border-zinc-800/80 px-4 flex items-center gap-4 overflow-x-auto z-20 select-none">
      <div className="flex-shrink-0 pr-3 border-r border-zinc-800/80">
        <div className="text-[11px] font-semibold text-zinc-200">Components</div>
        <div className="text-[10px] text-zinc-500">Click to deploy</div>
      </div>

      <div className="flex items-center gap-2.5">
        {allWeapons.map(weapon => {
          const isUnlocked = unlockedWeapons.includes(weapon.id);
          const IconComp = ICONS[weapon.icon] || Cpu;
          const canAfford =
            currentCredits + weapon.cost <= budget &&
            currentPower + weapon.power <= maxPower;

          return (
            <button
              key={weapon.id}
              disabled={!isUnlocked || !canAfford}
              onClick={() => {
                sfx.playTurretUpgrade();
                onDeployWeapon(weapon.id);
              }}
              className={`flex-shrink-0 w-44 h-16 rounded-lg px-3 py-2 flex flex-col justify-between border transition-all text-left ${
                !isUnlocked
                  ? 'border-zinc-900 bg-zinc-950/50 opacity-40 cursor-not-allowed'
                  : !canAfford
                  ? 'border-zinc-800/60 bg-zinc-900/40 opacity-50 cursor-not-allowed'
                  : 'border-zinc-800 bg-[#121215] hover:border-zinc-700 hover:bg-zinc-800/60 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <IconComp className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-zinc-200 truncate">
                    {weapon.realName.split('(')[0].trim()}
                  </span>
                </div>
                {!isUnlocked && <Lock className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span className="truncate max-w-[90px]">{weapon.name.split(' ')[0]}</span>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300">${weapon.cost}</span>
                  <span>•</span>
                  <span>{weapon.power}MW</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}