import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const STEPS = [
  { icon: "🎭", title: "角色解析", desc: "AI 提取性别、发型、服装、风格" },
  { icon: "📐", title: "多角度生成", desc: "正面 / 侧面 / 背面 / 3/4 参考图集" },
  { icon: "💾", title: "结构化存储", desc: "创建 Character + Phase + RefSet" },
  { icon: "🎬", title: "场景图生成", desc: "关键词 + 角色参考图 → 场景图" },
  { icon: "🎥", title: "视频生成", desc: "场景图 + 分镜描述 → 分镜视频" },
  { icon: "🔍", title: "视频反向解析", desc: "帧截取 → 角色识别 → 形象一致性" },
  { icon: "📊", title: "事件分析", desc: "AI 分析事件 → 推演关系变化" },
];

export const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 标题动画
  const titleSpring = spring({ frame, fps, config: { damping: 200 } });
  const titleOpacity = titleSpring;
  const titleY = interpolate(titleSpring, [0, 1], [-30, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0a0a1a 0%, #111133 50%, #0d0d2a 100%)",
      }}
    >
      {/* 网格背景 */}
      <AbsoluteFill style={{ opacity: 0.05 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={`h-${i}`}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: i * 54,
              height: 1,
              background: "white",
            }}
          />
        ))}
        {Array.from({ length: 36 }, (_, i) => (
          <div
            key={`v-${i}`}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: i * 54,
              width: 1,
              background: "white",
            }}
          />
        ))}
      </AbsoluteFill>

      {/* 标题 */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}
      >
        <div style={{ fontSize: 42, fontWeight: 700, color: "white", letterSpacing: 2 }}>
          AI 生产流水线
        </div>
        <div style={{ fontSize: 18, color: "rgba(167,139,250,0.7)", marginTop: 8, letterSpacing: 4 }}>
          7 STEP PIPELINE
        </div>
      </div>

      {/* 步骤卡片 */}
      <div
        style={{
          position: "absolute",
          top: 160,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {STEPS.map((step, i) => {
          const delay = Math.round((0.6 + i * 0.35) * fps);
          const stepSpring = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: { damping: 15, stiffness: 120 },
          });
          const x = interpolate(stepSpring, [0, 1], [-600, 0]);
          const opacity = stepSpring;

          // 连接线动画
          const lineProgress = interpolate(
            frame,
            [delay + 8, delay + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {/* 步骤编号 */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: `rgba(167, 139, 250, ${0.15 + stepSpring * 0.25})`,
                  border: "2px solid rgba(167, 139, 250, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#a78bfa",
                  opacity,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>

              {/* 连接线 */}
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    left: 100,
                    top: 44,
                    width: 2,
                    height: lineProgress * 12,
                    background: "rgba(167, 139, 250, 0.3)",
                  }}
                />
              )}

              {/* 卡片 */}
              <div
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(167, 139, 250, 0.15)",
                  borderRadius: 12,
                  padding: "14px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  opacity,
                  transform: `translateX(${x}px)`,
                }}
              >
                <span style={{ fontSize: 28 }}>{step.icon}</span>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: "white" }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部循环提示 */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [8 * fps, 9 * fps], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ fontSize: 16, color: "rgba(167,139,250,0.6)", letterSpacing: 2 }}>
          ↻ 回到 Step 4 — 循环生成下一场景
        </div>
      </div>
    </AbsoluteFill>
  );
};
