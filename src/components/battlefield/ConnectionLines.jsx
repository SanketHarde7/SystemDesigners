import React from 'react';

export function ConnectionLines({
  nodes,
  connections,
  isSiegeRunning,
  activeWire,
  onRemoveConnection
}) {
  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = n;
  });

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      {connections.map((conn, idx) => {
        const source = nodeMap[conn.from];
        const target = nodeMap[conn.to];
        if (!source || !target) return null;

        // Exact Right Output Port of Source (width 176px, center height 48px)
        const x1 = source.x + 176;
        const y1 = source.y + 48;

        // Exact Left Input Port of Target (left 0px, center height 48px)
        const x2 = target.x;
        const y2 = target.y + 48;

        const dx = Math.max(40, Math.abs(x2 - x1) * 0.45);
        const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        return (
          <g
            key={`${conn.from}-${conn.to}-${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onRemoveConnection) onRemoveConnection(conn.from, conn.to);
            }}
            className="pointer-events-auto cursor-pointer group"
          >
            {/* Invisible wider hit-area so clicking a wire to delete is easy */}
            <path d={pathData} fill="none" stroke="transparent" strokeWidth="14" />

            {/* Base Conduit Wire */}
            <path
              d={pathData}
              fill="none"
              stroke="#27272a"
              strokeWidth="2.5"
              className="group-hover:stroke-rose-500/80 transition-colors"
              strokeLinecap="round"
            />

            {/* Animated Data Flow Stream */}
            <path
              d={pathData}
              fill="none"
              stroke={isSiegeRunning ? '#6366f1' : '#71717a'}
              strokeWidth="1.5"
              strokeDasharray="6 6"
              className={isSiegeRunning ? 'animate-pulse' : 'group-hover:stroke-rose-400'}
            />
          </g>
        );
      })}

      {/* Live Wire Being Dragged by User */}
      {activeWire && nodeMap[activeWire.fromId] && (
        <path
          d={`M ${nodeMap[activeWire.fromId].x + 176} ${nodeMap[activeWire.fromId].y + 48} L ${activeWire.toX} ${activeWire.toY}`}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
}