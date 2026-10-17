import React, { useRef, useState, useEffect } from 'react';
import { ConnectionLines } from './ConnectionLines';
import { TurretNode } from './TurretNode';
import { Globe, Cable } from 'lucide-react';

export function CanvasGrid({
  nodes,
  connections,
  selectedNodeId,
  onSelectNode,
  metrics,
  isSiegeRunning,
  onMoveNode,
  onAddConnection,
  onRemoveConnection
}) {
  const containerRef = useRef(null);
  const draggingNodeRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // State for manual drag-to-connect wire
  const [activeWire, setActiveWire] = useState(null);

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
    setActiveWire({
      fromId,
      toX: e.clientX - rect.left,
      toY: e.clientY - rect.top
    });
  };

  const handleCompleteWire = (toId) => {
    if (activeWire && activeWire.fromId !== toId) {
      onAddConnection(activeWire.fromId, toId);
    }
    setActiveWire(null);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // 1. Smooth 1:1 Node Dragging
      if (draggingNodeRef.current) {
        let newX = e.clientX - rect.left - dragOffsetRef.current.x;
        let newY = e.clientY - rect.top - dragOffsetRef.current.y;

        newX = Math.max(16, Math.min(rect.width - 190, newX));
        newY = Math.max(16, Math.min(rect.height - 110, newY));

        onMoveNode(draggingNodeRef.current, Math.round(newX), Math.round(newY));
      }

      // 2. Live Wire Drawing
      if (activeWire) {
        setActiveWire(prev =>
          prev
            ? {
                ...prev,
                toX: e.clientX - rect.left,
                toY: e.clientY - rect.top
              }
            : null
        );
      }
    };

    const handleMouseUp = () => {
      draggingNodeRef.current = null;
      setActiveWire(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeWire, onMoveNode]);

  return (
    <div
      ref={containerRef}
      onClick={() => onSelectNode(null)}
      className="relative flex-1 bg-grid-minimal overflow-hidden select-none"
    >
      {/* Top-Left Telemetry & Wiring Hint */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            ARCHITECTURE TOPOLOGY
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] text-zinc-400">
          <Cable className="w-3 h-3 text-indigo-400" />
          <span>Drag from any node’s Right Dot to another node’s Left Dot to wire • Click a wire to remove</span>
        </div>
      </div>

      {/* Client Traffic Ingress Node */}
      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-36 p-3 rounded-xl bg-[#121215] border border-zinc-800 shadow-lg z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-zinc-200 leading-none">Ingress</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">Client Traffic</div>
          </div>
        </div>
        <div className="pt-2 border-t border-zinc-800/80 flex items-baseline justify-between">
          <span className="text-[10px] text-zinc-500 font-mono">LOAD</span>
          <span className="text-xs font-mono font-semibold text-zinc-100">
            {metrics.netIncomingRps ? Math.round(metrics.netIncomingRps).toLocaleString() : 0} rps
          </span>
        </div>
      </div>

      {/* SVG Data Pipelines */}
      <ConnectionLines
        nodes={nodes}
        connections={connections}
        isSiegeRunning={isSiegeRunning}
        activeWire={activeWire}
        onRemoveConnection={onRemoveConnection}
      />

      {/* Architecture Nodes */}
      {nodes.map(node => (
        <TurretNode
          key={node.id}
          node={node}
          isSelected={selectedNodeId === node.id}
          onSelect={(e) => {
            e.stopPropagation();
            onSelectNode(node.id);
          }}
          status={metrics.nodeStatus ? metrics.nodeStatus[node.id] : null}
          onDragStart={(e) => handleNodeMouseDown(node, e)}
          onStartWire={handleStartWire}
          onCompleteWire={handleCompleteWire}
          isWiring={Boolean(activeWire)}
        />
      ))}
    </div>
  );
}