import React from 'react';
import {
  Cpu,
  Database,
  Shuffle,
  Zap,
  Globe,
  Layers,
  ShieldAlert,
  Boxes,
  Search,
  HardDrive,
  GitMerge,
  Lock
} from 'lucide-react';
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
  Boxes,
  Search,
  HardDrive,
  GitMerge
};

const BEGINNER_BADGES = {
  SERVER: 'Runs App Logic',
  LAMBDA: 'Auto-Scales Spikes',
  API_GATEWAY: 'Auth & Routing',
  LOAD_BALANCER: 'Splits Traffic',
  DATABASE: 'SQL Storage',
  CACHE: '85% Read Speedup',
  CDN: 'Caches Static/Edge',
  MESSAGE_QUEUE: 'Buffers Writes',
  FIREWALL: 'Blocks DDoS Bots',
  SHARD_DB: 'Massive Write DB',
  SEARCH_ENGINE: 'Fast Text Search',
  OBJECT_STORAGE: 'Media/File Store'
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
    <div className="h-28 bg-[#080d1a] border-t border-indigo-500/20 px-4 flex items-center gap-4 overflow-x-auto z-20 select-none shadow-2xl">
      <div className="flex-shrink-0 pr-3 border-r border-slate-800">
        <div className="text-xs font-bold text-white uppercase tracking-wider">Arsenal Dock</div>
        <div className="text-[10px] text-cyan-400 font-medium mt-0.5">Click card to deploy</div>
      </div>

      <div className="flex items-center gap-2.5 py-2">
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
              style={{
                borderColor: isUnlocked && canAfford ? `${weapon.color}55` : undefined
              }}
              className={`flex-shrink-0 w-48 h-20 rounded-2xl px-3 py-2 flex flex-col justify-between border-2 transition-all text-left relative overflow-hidden ${
                !isUnlocked
                  ? 'border-slate-900 bg-slate-950/50 opacity-40 cursor-not-allowed'
                  : !canAfford
                  ? 'border-rose-900/40 bg-slate-900/40 opacity-50 cursor-not-allowed'
                  : 'bg-[#0f172a] hover:bg-[#16203a] hover:-translate-y-1 cursor-pointer shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${weapon.color}22` }}
                  >
                    <IconComp
                      className="w-3.5 h-3.5"
                      style={{ color: isUnlocked ? weapon.color : '#64748b' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white truncate">
                    {weapon.name}
                  </span>
                </div>
                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
              </div>

              <div className="text-[10px] text-slate-300 font-medium truncate">
                ✨ {BEGINNER_BADGES[weapon.id] || weapon.category}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-slate-800/80">
                <span className="text-amber-300 font-bold">${weapon.cost}</span>
                <span className="text-cyan-400 font-semibold">{weapon.power} MW</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}