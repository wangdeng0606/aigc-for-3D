import { getBezierPath, EdgeLabelRenderer } from 'reactflow';

export default function SceneEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const gradientId = `sgrad-${id}`;
  const glowId = `sglow-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={selected ? 4 : 2.5} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={30} className="react-flow__edge-interaction" />

      <path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={selected ? 6 : 4}
        strokeLinecap="round"
        opacity={0.3}
        filter={`url(#${glowId})`}
      />

      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={selected ? 2.5 : 1.8}
        strokeLinecap="round"
        style={style}
      />

      <circle r={selected ? 3 : 2} fill="#3b82f6" opacity={0.9}>
        <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r={selected ? 1.8 : 1.2} fill="#fff" opacity={0.95}>
        <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
      </circle>

      <circle r={selected ? 2.2 : 1.5} fill="#10b981" opacity={0.7}>
        <animateMotion dur="3s" begin="-1.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r={selected ? 1.2 : 0.8} fill="#fff" opacity={0.8}>
        <animateMotion dur="3s" begin="-1.5s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={`absolute pointer-events-none flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold
              ${selected
                ? 'bg-blue-50 text-blue-600 border border-blue-300 shadow-lg shadow-blue-100/50'
                : 'bg-white/90 backdrop-blur-sm text-blue-500 border border-blue-200 shadow-sm'
              }`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
