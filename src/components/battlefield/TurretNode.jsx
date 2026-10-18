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
  Unplug,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Sliders
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
  onDoubleClick,
  status,
  onDragStart,
  onStartWire,
  onCompleteWire,
  isWiring,
  onUpgradeTier,
  onDowngradeTier,
  onUpdateCount,
  onDeleteNode
}) {
  const reg = WEAPON_REGISTRY[node.type];
  if (!reg) return null;

  const IconComp = ICONS[reg.icon] || Cpu;
  const currentTier = node.tier || 1;
  const maxTier = reg.tiers.length;
  const tierData = reg.tiers[currentTier - 1] || reg.tiers[0];
  const count = node.count || 1;

  const loadRatio = status ? status.loadRatio : 0;
  const isOverloaded = status ? status.isOverloaded : false;
  const isDead = status ? status.isDead : false;
  const isUnconnected = status ? status.isUnconnected : false;
  const isStateful = node.stateful !== undefined ? node.stateful : reg.stateType === 'STATEFUL';

  const healthLabel = isUnconnected
    ? 'OFFLINE'
    : isOverloaded
    ? 'CRITICAL!'
    : loadRatio > 0.78
    ? 'HEAVY'
    : 'ONLINE';

  const barColor = isUnconnected
    ? 'bg-neutral-600'
    : isOverloaded
    ? 'bg-rose-500'
    : loadRatio > 0.78
    ? 'bg-amber-400'
    : 'bg-emerald-400';

  const totalRps = tierData.rps
    ? `${((tierData.rps * count) / 1000).toFixed(1).replace('.0', '')}k RPS`
    : tierData.writeRps
    ? `${((tierData.readRps * count) / 1000).toFixed(1).replace('.0', '')}k R / ${((tierData.writeRps * count) / 1000).toFixed(1).replace('.0', '')}k W`
    : '';

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseDown={onDragStart}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: '192px'
      }}
      className={`absolute rounded-lg cursor-grab active:cursor-grabbing select-none p-2.5 flex flex-col gap-2 transition-all z-10 border-2 ${
        isSelected
          ? 'bg-[#171c26] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.28)] z-20'
          : isUnconnected
          ? 'bg-[#11141c]/90 border-amber-500/40 border-dashed'
          : isOverloaded
          ? 'bg-[#1b1116] bg-hazard-stripes border-rose-500 shadow-lg shadow-rose-950/60'
          : 'bg-[#12161f] border-[#262d3d] hover:border-neutral-500 shadow-xl'
      } ${isDead ? 'opacity-40 grayscale border-dashed border-rose-500' : ''}`}
    >
      {/* FLOATING QUICK-ACTION BAR ON SINGLE CLICK */}
      {isSelected && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0d1017] border-2 border-amber-500/60 rounded-md px-1.5 py-1 flex items-center gap-1 shadow-2xl z-30 whitespace-nowrap"
        >
          {/* Tier Downgrade / Upgrade */}
          <button
            type="button"
            disabled={currentTier <= 1}
            onClick={() => onDowngradeTier && onDowngradeTier(node.id)}
            title="Downgrade Tier (Refund Credits)"
            className="px-1.5 py-0.5 rounded bg-[#1b202c] hover:bg-[#252c3d] disabled:opacity-30 text-[10px] font-mono font-bold text-emerald-400 flex items-center"
          >
            <ChevronDown className="w-3 h-3" /> T-
          </button>
          <button
            type="button"
            disabled={currentTier >= maxTier}
            onClick={() => onUpgradeTier && onUpgradeTier(node.id)}
            title="Upgrade Tier"
            className="px-1.5 py-0.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-[10px] font-mono font-bold text-black flex items-center"
          >
            <ChevronUp className="w-3 h-3" /> T+
          </button>

          <div className="w-[1px] h-3.5 bg-neutral-700 mx-0.5" />

          {/* Replica Scale In / Out */}
          <button
            type="button"
            disabled={count <= 1}
            onClick={() => onUpdateCount && onUpdateCount(node.id, count - 1)}
            title="Scale In (-1 Replica)"
            className="p-1 rounded bg-[#1b202c] hover:bg-[#252c3d] disabled:opacity-30 text-neutral-200"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>
          <span className="text-[10px] font-mono font-bold text-amber-300 px-0.5">{count}x</span>
          <button
            type="button"
            onClick={() => onUpdateCount && onUpdateCount(node.id, count + 1)}
            title="Scale Out (+1 Replica)"
            className="p-1 rounded bg-[#1b202c] hover:bg-[#252c3d] text-neutral-200"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-neutral-700 mx-0.5" />

          {/* Open Inspector Button */}
          <button
            type="button"
            onClick={onDoubleClick}
            title="Open Turret Inspector (or Double-Click card)"
            className="p-1 rounded bg-[#1b202c] hover:bg-amber-500/20 text-amber-400"
          >
            <Sliders className="w-3 h-3" />
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={() => onDeleteNode && onDeleteNode(node.id)}
            title="Delete Turret (Del / Backspace)"
            className="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* LEFT INPUT PORT */}
      <button
        type="button"
        title="Input Port (Drop wire here)"
        onMouseUp={(e) => {
          e.stopPropagation();
          onCompleteWire(node.id);
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm border-2 flex items-center justify-center transition-transform ${
          isWiring
            ? 'bg-amber-400 border-black scale-125 cursor-pointer shadow-lg shadow-amber-500/50'
            : 'bg-[#0b0d12] border-neutral-500 hover:border-amber-400 hover:scale-110'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-sm bg-neutral-300 pointer-events-none" />
      </button>

      {/* RIGHT OUTPUT PORT */}
      <button
        type="button"
        title="Output Port (Drag to connect wire)"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartWire(node.id, e);
        }}
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-sm bg-[#0b0d12] border-2 border-amber-400 hover:bg-amber-400 hover:scale-125 flex items-center justify-center cursor-crosshair transition-transform shadow-md"
      >
        <span className="w-1.5 h-1.5 rounded-sm bg-amber-300 pointer-events-none" />
      </button>

      {/* Top Row: Icon, Stars & Replica Tag */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded bg-[#1a202c] border border-[#2d3748] flex items-center justify-center"
          >
            <IconComp className="w-4 h-4" style={{ color: reg.color }} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-0.5 text-[10px] leading-none">
              {[1, 2, 3].map(star => (
                <span
                  key={star}
                  className={star <= currentTier ? 'text-amber-400' : 'text-neutral-700'}
                >
                  ★
                </span>
              ))}
              <span className="ml-1 font-mono text-[9px] text-neutral-400 font-bold">
                MK-{currentTier}
              </span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 font-bold mt-0.5">
              {totalRps}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 font-mono text-[9px]">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold">
            {count}x
          </span>
          {node.type === 'SERVER' && (
            <span
              className={`px-1 rounded text-[8px] font-bold ${
                isStateful ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isStateful ? 'STATEFUL' : 'STATELESS'}
            </span>
          )}
        </div>
      </div>

      {/* Middle Row: Component Title & Spec */}
      <div>
        <div className="text-xs font-extrabold text-neutral-100 truncate tracking-tight">
          {reg.name}
        </div>
        <div className="text-[10px] font-mono text-neutral-400 truncate">
          {tierData.name}
        </div>
      </div>

      {/* Bottom Row: Segmented Tactical Load Bar */}
      <div className="pt-1 border-t border-[#222836]">
        <div className="flex items-center justify-between text-[9px] font-mono mb-1">
          <span
            className={`font-bold ${
              isUnconnected
                ? 'text-amber-400'
                : isOverloaded
                ? 'text-rose-400'
                : loadRatio > 0.78
                ? 'text-amber-300'
                : 'text-emerald-400'
            }`}
          >
            {isUnconnected ? (
              <span className="flex items-center gap-1">
                <Unplug className="w-2.5 h-2.5" /> {healthLabel}
              </span>
            ) : (
              healthLabel
            )}
          </span>
          {!isUnconnected && (
            <span className={isOverloaded ? 'text-rose-400 font-bold' : 'text-neutral-300 font-bold'}>
              {Math.round(loadRatio * 100)}% CPU
            </span>
          )}
        </div>

        <div className="w-full h-2 bg-[#090b0e] rounded-sm overflow-hidden border border-[#262d3d] p-[1px]">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${isUnconnected ? 100 : Math.min(100, loadRatio * 100)}%` }}
          />
        </div>
      </div>

      {/* Alert Badge */}
      {isOverloaded && !isDead && !isUnconnected && (
        <div className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-sm p-0.5 shadow-lg animate-bounce">
          <AlertCircle className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );
}