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
  AlertCircle,
  Unplug
} from 'lucide-react';
import { WEAPON_REGISTRY } from '../../constants/weapons';

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

export function TurretNode({
  node,
  isSelected,
  onSelect,
  status,
  onDragStart,
  onStartWire,
  onCompleteWire,
  isWiring
}) {
  const reg = WEAPON_REGISTRY[node.type];
  if (!reg) return null;
  const IconComp = ICONS[reg.icon] || Cpu;
  const tierData = reg.tiers[(node.tier || 1) - 1] || reg.tiers[0];

  const loadRatio = status ? status.loadRatio : 0;
  const isOverloaded = status ? status.isOverloaded : false;
  const isDead = status ? status.isDead : false;
  const isUnconnected = status ? status.isUnconnected : false;

  const isStateful = node.stateful !== undefined ? node.stateful : reg.stateType === 'STATEFUL';

  const statusColor = isUnconnected
    ? 'bg-zinc-600'
    : isOverloaded
    ? 'bg-rose-500'
    : loadRatio > 0.75
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div
      onClick={onSelect}
      onMouseDown={onDragStart}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: '176px'
      }}
      className={`absolute rounded-xl cursor-grab active:cursor-grabbing select-none p-3 flex flex-col gap-2 transition-colors z-10 border ${
        isSelected
          ? 'bg-[#18181c] border-indigo-500 ring-1 ring-indigo-500/40 shadow-2xl'
          : isUnconnected
          ? 'bg-[#121215]/90 border-amber-500/50 border-dashed shadow-md'
          : 'bg-[#121215] border-zinc-800 hover:border-zinc-700 shadow-lg'
      } ${isDead ? 'opacity-40 grayscale border-dashed border-rose-500' : ''}`}
    >
      {/* LEFT INPUT PORT (Drop target for incoming wire) */}
      <button
        type="button"
        title="Input Port (Drop wire here)"
        onMouseUp={(e) => {
          e.stopPropagation();
          onCompleteWire(node.id);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-transform ${
          isWiring
            ? 'bg-indigo-500 border-white scale-125 cursor-pointer shadow-lg shadow-indigo-500/50'
            : 'bg-zinc-900 border-zinc-600 hover:border-indigo-400 hover:scale-110'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 pointer-events-none" />
      </button>

      {/* RIGHT OUTPUT PORT (Drag from here to connect to another component) */}
      <button
        type="button"
        title="Output Port (Drag to connect wire)"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartWire(node.id, e);
        }}
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-zinc-900 border-2 border-indigo-400 hover:bg-indigo-500 hover:scale-125 flex items-center justify-center cursor-crosshair transition-transform shadow"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 pointer-events-none" />
      </button>

      {/* Top Row: Icon, Replicas, Tier & State Badge */}
      <div className="flex items-center justify-between gap-1">
        <div className="w-7 h-7 rounded-lg bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-zinc-200">
          <IconComp className="w-3.5 h-3.5" style={{ color: reg.color }} />
        </div>

        <div className="flex items-center gap-1 font-mono text-[9px]">
          <span
            className={`px-1 py-0.5 rounded border ${
              isStateful
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {isStateful ? 'STATEFUL' : 'STATELESS'}
          </span>
          {node.count > 1 && (
            <span className="px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              {node.count}x
            </span>
          )}
          <span className="px-1 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
            T{node.tier || 1}
          </span>
        </div>
      </div>

      {/* Middle Row: Component Name & Real Instance Spec */}
      <div>
        <div className="text-xs font-semibold text-zinc-100 truncate">
          {reg.name}
        </div>
        <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
          {tierData.name}
        </div>
      </div>

      {/* Bottom Row: Utilization or Unconnected Warning */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
          <span className="text-zinc-500">{isUnconnected ? 'STATUS' : 'LOAD'}</span>
          {isUnconnected ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Unplug className="w-2.5 h-2.5" /> UNWIRED
            </span>
          ) : (
            <span className={isOverloaded ? 'text-rose-400 font-semibold' : 'text-zinc-300'}>
              {Math.round(loadRatio * 100)}%
            </span>
          )}
        </div>
        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${statusColor}`}
            style={{ width: `${isUnconnected ? 100 : Math.min(100, loadRatio * 100)}%` }}
          />
        </div>
      </div>

      {/* Alert Badge */}
      {isOverloaded && !isDead && !isUnconnected && (
        <div className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 shadow-md">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}