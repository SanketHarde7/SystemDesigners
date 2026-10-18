import React from 'react';

export function ConnectionLines({
  nodes,
  connections,
  isSiegeRunning,
  activeWire,
  onRemoveConnection,
  metrics,
  trafficProfile
}) {
  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = n;
  });

  // Determine entry nodes (nodes that have no incoming wires, or Edge/Routing nodes)
  const nodesWithIncoming = new Set(connections.map(c => c.to));
  let entryNodes = nodes.filter(n => !nodesWithIncoming.has(n.id));
  if (entryNodes.length === 0 && nodes.length > 0) {
    entryNodes = [nodes[0]];
  }

  // Ingress Portal output coordinates (matches CanvasGrid Ingress box)
  const ingressX = 172;
  const ingressY = 230;

  // Helper to compute realistic RPS label and particle color for each wire
  const getLinkTelemetry = (source, target) => {
    const netRps = metrics?.netIncomingRps || 1200;
    const hitRate = metrics?.cacheHitRate || 0;
    const profile = trafficProfile || { read: 0.7, write: 0.3, static: 0, bot: 0 };

    if (target.type === 'CACHE' || target.type === 'SEARCH_ENGINE') {
      const cacheRps = Math.round(netRps * (profile.read || 0.7));
      return {
        label: `${cacheRps.toLocaleString()} rps (${Math.round(hitRate * 100)}% HIT)`,
        color: '#f59e0b', // Amber Cache
        secondaryColor: '#10b981'
      };
    }

    if (target.type === 'MESSAGE_QUEUE' || source.type === 'MESSAGE_QUEUE') {
      const writeRps = Math.round(netRps * (profile.write || 0.3));
      return {
        label: `${writeRps.toLocaleString()} write/s`,
        color: '#a855f7', // Purple Write Queue
        secondaryColor: '#c084fc'
      };
    }

    if (target.type === 'DATABASE' || target.type === 'SHARD_DB') {
      const readMissRps = netRps * (profile.read || 0.7) * (1 - hitRate);
      const writeRps = netRps * (profile.write || 0.3) * (metrics?.writeBufferActive ? 0.45 : 1);
      const dbTotal = Math.round(readMissRps + writeRps);
      return {
        label: `${dbTotal.toLocaleString()} db iops`,
        color: '#3b82f6', // Blue Storage
        secondaryColor: '#60a5fa'
      };
    }

    if (source.type === 'CDN' || target.type === 'OBJECT_STORAGE') {
      const edgeRps = Math.round((metrics?.staticOffloaded || netRps * 0.25));
      return {
        label: `${edgeRps.toLocaleString()} edge rps`,
        color: '#06b6d4', // Cyan CDN
        secondaryColor: '#22d3ee'
      };
    }

    if (source.type === 'FIREWALL') {
      return {
        label: `${Math.round(netRps).toLocaleString()} clean rps`,
        color: '#10b981',
        secondaryColor: '#ef4444'
      };
    }

    return {
      label: `${Math.round(netRps).toLocaleString()} rps`,
      color: '#6366f1', // Indigo Compute/Routing
      secondaryColor: '#10b981'
    };
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Automated Ingress-to-Entry-Nodes Traffic Beams */}
      {entryNodes.map((target, i) => {
        const x2 = target.x;
        const y2 = target.y + 54;
        const dx = Math.max(40, Math.abs(x2 - ingressX) * 0.45);
        const ingressPathId = `ingress-wire-${target.id}-${i}`;
        const pathData = `M ${ingressX} ${ingressY} C ${ingressX + dx} ${ingressY}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        const hasBots = (trafficProfile?.bot || 0) > 0;

        return (
          <g key={ingressPathId}>
            <path
              id={ingressPathId}
              d={pathData}
              fill="none"
              stroke="#1e293b"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />
            <path
              d={pathData}
              fill="none"
              stroke={hasBots ? '#ef4444' : '#38bdf8'}
              strokeWidth="1.5"
              strokeDasharray="6 6"
              className={isSiegeRunning ? 'animate-flow-fast' : 'animate-flow-line'}
              opacity="0.65"
            />
            {/* Moving Traffic Particle from Ingress */}
            <circle r="3.5" fill={hasBots ? '#ef4444' : '#38bdf8'} filter="url(#glow)">
              <animateMotion
                dur={isSiegeRunning ? '0.7s' : '1.6s'}
                repeatCount="indefinite"
                path={pathData}
              />
            </circle>
          </g>
        );
      })}

      {/* 2. Player-Wired Component Data Pipelines */}
      {connections.map((conn, idx) => {
        const source = nodeMap[conn.from];
        const target = nodeMap[conn.to];
        if (!source || !target) return null;

        // Right Output Port of Source (width 192px, center height 54px)
        const x1 = source.x + 192;
        const y1 = source.y + 54;

        // Left Input Port of Target (left 0px, center height 54px)
        const x2 = target.x;
        const y2 = target.y + 54;

        const dx = Math.max(45, Math.abs(x2 - x1) * 0.45);
        const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 10;

        const telemetry = getLinkTelemetry(source, target);

        return (
          <g
            key={`${conn.from}-${conn.to}-${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onRemoveConnection) onRemoveConnection(conn.from, conn.to);
            }}
            className="pointer-events-auto cursor-pointer group"
          >
            {/* Wide invisible hit-box for easy wire deletion */}
            <path d={pathData} fill="none" stroke="transparent" strokeWidth="18" />

            {/* Outer Glow Conduit */}
            <path
              d={pathData}
              fill="none"
              stroke="#1e293b"
              strokeWidth="3.5"
              className="group-hover:stroke-rose-500/80 transition-colors"
              strokeLinecap="round"
            />

            {/* Animated Laser Data Stream */}
            <path
              d={pathData}
              fill="none"
              stroke={telemetry.color}
              strokeWidth={isSiegeRunning ? '2.5' : '1.8'}
              strokeDasharray="6 6"
              className={
                isSiegeRunning
                  ? 'animate-flow-fast'
                  : 'animate-flow-line group-hover:stroke-rose-400'
              }
            />

            {/* Primary Traffic Particle */}
            <circle r={isSiegeRunning ? '4.5' : '3.5'} fill={telemetry.color} filter="url(#glow)">
              <animateMotion
                dur={isSiegeRunning ? '0.55s' : '1.3s'}
                repeatCount="indefinite"
                path={pathData}
              />
            </circle>

            {/* Secondary Staggered Traffic Particle */}
            <circle r="3" fill={telemetry.secondaryColor} filter="url(#glow)">
              <animateMotion
                dur={isSiegeRunning ? '0.55s' : '1.3s'}
                begin="0.65s"
                repeatCount="indefinite"
                path={pathData}
              />
            </circle>

            {/* Per-Wire Live RPS Telemetry Badge */}
            <g transform={`translate(${midX}, ${midY})`}>
              <rect
                x="-52"
                y="-10"
                width="104"
                height="19"
                rx="6"
                fill="#090d1a"
                stroke={telemetry.color}
                strokeWidth="1"
                strokeOpacity="0.5"
                className="group-hover:stroke-rose-500"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="9.5"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="600"
              >
                {telemetry.label}
              </text>
            </g>
          </g>
        );
      })}

      {/* 3. Live Wire Being Dragged by Player */}
      {activeWire && nodeMap[activeWire.fromId] && (
        <path
          d={`M ${nodeMap[activeWire.fromId].x + 192} ${nodeMap[activeWire.fromId].y + 54} L ${activeWire.toX} ${activeWire.toY}`}
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="5 5"
          className="animate-flow-fast"
        />
      )}
    </svg>
  );
}