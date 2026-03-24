import { getBezierPath, EdgeLabelRenderer } from 'reactflow';

export default function RelationshipEdge({
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

  const gradientId = `grad-${id}`;
  const glowId = `glow-${id}`;

  return (
    <>
      <defs>
        {/* 渐变色 */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
          <stop offset="50%" stopColor="#ef4444" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ec4899" stopOpacity={0.6} />
        </linearGradient>
        {/* 发光滤镜 */}
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation={selected ? 4 : 2.5} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 宽透明点击区域 */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={30} className="react-flow__edge-interaction" />

      {/* 发光底层 */}
      <path
        d={edgePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={selected ? 6 : 4}
        strokeLinecap="round"
        opacity={0.3}
        filter={`url(#${glowId})`}
      />

      {/* 主贝塞尔曲线 */}
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

      {/* 流动光点动画 */}
      <circle r={selected ? 3.5 : 2.5} fill="#ef4444" opacity={0.9}>
        <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r={selected ? 2 : 1.5} fill="#fff" opacity={0.95}>
        <animateMotion dur="3s" repeatCount="indefinite" path={edgePath} />
      </circle>

      {/* 第二颗光点（交错） */}
      <circle r={selected ? 2.5 : 1.8} fill="#f97316" opacity={0.7}>
        <animateMotion dur="3s" begin="-1.5s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r={selected ? 1.5 : 1} fill="#fff" opacity={0.8}>
        <animateMotion dur="3s" begin="-1.5s" repeatCount="indefinite" path={edgePath} />
      </circle>

      <EdgeLabelRenderer>
        <div
          className={`group/label cursor-pointer
            flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap
            transition-shadow transition-colors duration-200
            ${selected
              ? 'bg-red-50 text-red-600 border border-red-300 shadow-lg shadow-red-100/50'
              : 'bg-white/90 backdrop-blur-sm text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-400 hover:shadow-lg hover:shadow-red-100/40 shadow-sm'
            }`}
          style={{
            position: 'absolute',
            left: labelX,
            top: labelY,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'all',
          }}
        >
          <span className="text-[11px] font-semibold">{data?.label || '关系'}</span>
          {data?.events?.length > 0 && (
            <span className="text-[9px] bg-red-50 text-red-400 px-1.5 py-px rounded-full border border-red-100">
              {data.events.length}
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
