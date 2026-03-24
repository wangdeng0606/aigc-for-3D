import { getBezierPath } from 'reactflow';

export default function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  style = {},
}) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const gradientId = `flow-grad-${id}`;
  const glowId = `flow-glow-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.5} />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={selected ? 3.5 : 2} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 宽透明点击区域 */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={24} className="react-flow__edge-interaction" />

      {/* 发光底层 */}
      <path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={selected ? 5 : 3.5}
        strokeLinecap="round"
        opacity={0.25}
        filter={`url(#${glowId})`}
      />

      {/* 主贝塞尔曲线 */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={selected ? 2.5 : 1.6}
        strokeLinecap="round"
        style={style}
      />

      {/* 流动光点 */}
      <circle r={selected ? 3 : 2} fill="#3b82f6" opacity={0.85}>
        <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r={selected ? 1.5 : 1} fill="#fff" opacity={0.9}>
        <animateMotion dur="2.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
}
