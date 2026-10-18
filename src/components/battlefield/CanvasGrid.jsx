import React, { useRef, useState, useEffect } from 'react';
import { ConnectionLines } from './ConnectionLines';
import { TurretNode } from './TurretNode';
import { Radio, Cable, MousePointerClick } from 'lucide-react';

export function CanvasGrid({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  onDoubleClickNode,
  metrics,
  trafficProfile,
  isSiegeRunning,
  onMoveNode,
  onAddConnection,
  onRemoveConnection,
  onUpgradeTier,
  onDowngradeTier,
  onUpdateCount,
  onDeleteNode
}) {
  const containerRef = useRef(null);
  const draggingNodeRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const activeWireRef = useRef(null);
  const onMoveNodeRef = useRef(onMoveNode);

  const [activeWire, setActiveWire] = useState(null);

  useEffect(() => {
    onMoveNodeRef.current = onMoveNode;
  }, [onMoveNode]);

  const handleNodeMouseDown = (node, e) => {
    e.stopPropagation();
    onSelectNode(node.id);
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    draggingNodeRef.current = node.id;
    dragOffsetRef.current = {
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    };
  };

  const handleStartWire = (fromId, e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const wire = {
      fromId,
      toX: e.clientX - rect.left,
      toY: e.clientY - rect.top
    };
    activeWireRef.current = wire;
    setActiveWire(wire);
  };

  const handleCompleteWire = (toId) => {
    const currentWire = activeWireRef.current;
    if (currentWire && currentWire.fromId !== toId && onAddConnection) {
      onAddConnection(currentWire.fromId, toId);
    }
    activeWireRef.current = null;
    setActiveWire(null);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (draggingNodeRef.current && onMoveNodeRef.current) {
        let newX = e.clientX - rect.left - dragOffsetRef.current.x;
        let newY = e.clientY - rect.top - dragOffsetRef.current.y;
        newX = Math.max(16, Math.min(rect.width - 205, newX));
        newY = Math.max(16, Math.min(rect.height - 125, newY));
        onMoveNodeRef.current(draggingNodeRef.current, Math.round(newX), Math.round(newY));
      }

      if (activeWireRef.current) {
        const updated = {
          ...activeWireRef.current,
          toX: e.clientX - rect.left,
          toY: e.clientY - rect.top
        };
        activeWireRef.current = updated;
        setActiveWire(updated);
      }
    };

    const handleMouseUp = () => {
      draggingNodeRef.current = null;
      if (activeWireRef.current) {
        activeWireRef.current = null;
        setActiveWire(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onClick={() => onSelectNode(null)}
      className="relative flex-1 bg-grid-minimal overflow-hidden select-none"
    >
      {/* Top-Left Tactical Controls Hint */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#12161f]/95 border border-[#262d3d] text-[10px] font-mono text-neutral-300">
            <MousePointerClick className="w-3 h-3 text-amber-400" />
            <span>Click: Select & Quick-Edit • <strong className="text-amber-300">Double-Click: Open Inspector</strong> • Del: Remove</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#12161f]/95 border border-[#262d3d] text-[10px] font-mono text-neutral-400">
            <Cable className="w-3 h-3 text-emerald-400" />
            <span>Drag Right Port → Left Port to wire • Click wire to cut</span>
          </div>
        </div>

        {/* Traffic Particle Key */}
        <div className="hidden xl:flex items-center gap-3 px-3 py-1 rounded bg-[#12161f]/95 border border-[#262d3d] text-[10px] font-mono text-neutral-300">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400" /> App Traffic
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Cache Hit
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Async Queue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> DDoS Attack
          </span>
        </div>
      </div>

      {/* Left Traffic Spawn Gate */}
      <div
        style={{ left: '20px', top: '185px', width: '152px' }}
        className="absolute p-3 rounded-lg bg-[#12161f] border-2 border-amber-500/50 shadow-xl z-10 flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-amber-500/15 border border-amber-500/40 flex items-center justify-center">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-black text-white uppercase tracking-wider leading-none">
              SPAWN GATE
            </div>
            <div className="text-[9px] font-mono text-amber-400 mt-0.5">Live Requests</div>
          </div>
        </div>
        <div className="pt-2 border-t border-[#222836] flex items-baseline justify-between">
          <span className="text-[9px] text-neutral-400 font-mono">RATE</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {metrics.netIncomingRps ? Math.round(metrics.netIncomingRps).toLocaleString() : 0} RPS
          </span>
        </div>
      </div>

      {/* Animated SVG Data Pipelines */}
      <ConnectionLines
        nodes={nodes}
        connections={connections}
        isSiegeRunning={isSiegeRunning}
        activeWire={activeWire}
        onRemoveConnection={onRemoveConnection}
        metrics={metrics}
        trafficProfile={trafficProfile}
      />

      {/* Architecture Turret Cards */}
      {nodes.map(node => (
        <TurretNode
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onSelect={(e) => {
            e.stopPropagation();
            onSelectNode(node.id);
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (onDoubleClickNode) onDoubleClickNode(node.id);
          }}
          status={metrics.nodeStatus ? metrics.nodeStatus[node.id] : null}
          onDragStart={(e) => handleNodeMouseDown(node, e)}
          onStartWire={handleStartWire}
          onCompleteWire={handleCompleteWire}
          isWiring={Boolean(activeWire)}
          onUpgradeTier={onUpgradeTier}
          onDowngradeTier={onDowngradeTier}
          onUpdateCount={onUpdateCount}
          onDeleteNode={onDeleteNode}
        />
      ))}
    </div>
  );
}