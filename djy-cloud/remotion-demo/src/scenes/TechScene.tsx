import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

const VIDEO_NODES = [
  { title: "第一幕 · 竹林相遇", status: "done", x: 80, y: 100 },
  { title: "第二幕 · 竹林对决", status: "generating", x: 420, y: 60 },
  { title: "第三幕 · 月下追忆", status: "idle", x: 760, y: 120 },
];

const SCENE_NODE = { title: "竹林场景", x: 250, y: 400 };

export const TechScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const canvasSpring = spring({ frame, fps, config: { damping: 200 } });

  // 右侧面板滑入
  const panelDelay = Math.round(1 * fps);
  const panelSpring = spring({ frame: Math.max(0, frame - panelDelay), fps, config: { damping: 15 } });
  const panelX = interpolate(panelSpring, [0, 1], [500, 0]);

  // 生成按钮脉冲
  const pulse = 0.7 + Math.sin(frame / 8) * 0.3;

  // 进度条动画
  const progressDelay = Math.round(3 * fps);
  const progress = interpolate(frame, [progressDelay, progressDelay + 3 * fps], [0, 0.75], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0a0a18" }}>
      {/* 网格背景 */}
      <AbsoluteFill style={{ opacity: 0.025 }}>
        <svg width="1920" height="1080">
          {Array.from({ length: 80 }, (_, i) => (
            <line key={`v-${i}`} x1={i * 24} y1={0} x2={i * 24} y2={1080} stroke="white" strokeWidth={1} />
          ))}
          {Array.from({ length: 45 }, (_, i) => (
            <line key={`h-${i}`} x1={0} y1={i * 24} x2={1920} y2={i * 24} stroke="white" strokeWidth={1} />
          ))}
        </svg>
      </AbsoluteFill>

      {/* ==== 左侧：场景画布 ==== */}
      <div style={{ position: "absolute", top: 30, left: 50, width: 1000, opacity: canvasSpring }}>
        {/* Tab */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
          {["角色设计", "场景管理"].map((t, i) => (
            <div key={i} style={{
              padding: "10px 28px", fontSize: 14, fontWeight: 600,
              color: i === 1 ? "white" : "rgba(255,255,255,0.35)",
              background: i === 1 ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
              borderBottom: i === 1 ? "2px solid #38bdf8" : "2px solid transparent",
            }}>{t}</div>
          ))}
        </div>

        {/* 视频节点 */}
        {VIDEO_NODES.map((node, i) => {
          const delay = Math.round((0.3 + i * 0.4) * fps);
          const ns = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12 } });
          const statusColor = node.status === "done" ? "#34d399" : node.status === "generating" ? "#fbbf24" : "#64748b";
          return (
            <div key={i} style={{
              position: "absolute", left: node.x, top: node.y + 50,
              width: 260, padding: "14px 16px",
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${statusColor}33`,
              borderRadius: 12,
              opacity: ns, transform: `scale(${interpolate(ns, [0, 1], [0.8, 1])})`,
              boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: statusColor, boxShadow: `0 0 10px ${statusColor}66`,
                }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{node.title}</div>
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
                {node.status === "done" ? "✓ 已完成" : node.status === "generating" ? "⟳ 生成中..." : "⊘ 待生成"}
              </div>
            </div>
          );
        })}

        {/* 场景节点（带竹林图） */}
        {(() => {
          const sd = Math.round(1.5 * fps);
          const ss = spring({ frame: Math.max(0, frame - sd), fps, config: { damping: 15 } });
          return (
            <div style={{
              position: "absolute", left: SCENE_NODE.x, top: SCENE_NODE.y,
              width: 300, borderRadius: 14, overflow: "hidden",
              border: "1px solid rgba(56,189,248,0.25)",
              opacity: ss, transform: `scale(${interpolate(ss, [0, 1], [0.85, 1])})`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            }}>
              <Img src={staticFile("images/bamboo-battle.png")} style={{ width: "100%", display: "block" }} />
              <div style={{
                padding: "10px 14px",
                background: "rgba(10,10,24,0.9)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>竹林对决</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                  深夜竹林，月光映照，两位武侠人物持剑对峙
                </div>
              </div>
            </div>
          );
        })()}

        {/* 节点之间的连线 */}
        <svg style={{ position: "absolute", top: 50, left: 0, width: 1000, height: 500, pointerEvents: "none" }}>
          {[
            { x1: 340, y1: 80, x2: 420, y2: 40 },
            { x1: 680, y1: 40, x2: 760, y2: 100 },
            { x1: 400, y1: 160, x2: 300, y2: 350 },
          ].map((l, i) => {
            const ld = Math.round((1 + i * 0.3) * fps);
            const lp = interpolate(frame, [ld, ld + 15], [0, 1], {
              extrapolateLeft: "clamp", extrapolateRight: "clamp",
            });
            return (
              <line key={i}
                x1={l.x1} y1={l.y1}
                x2={l.x1 + (l.x2 - l.x1) * lp}
                y2={l.y1 + (l.y2 - l.y1) * lp}
                stroke="rgba(56,189,248,0.2)" strokeWidth={1.5} strokeDasharray="6 4"
              />
            );
          })}
        </svg>
      </div>

      {/* ==== 右侧：视频生成面板 ==== */}
      <div style={{
        position: "absolute", top: 30, right: 0, width: 460, height: 1020,
        background: "linear-gradient(180deg, rgba(15,10,30,0.97), rgba(10,8,20,0.98))",
        borderLeft: "1px solid rgba(56,189,248,0.15)",
        borderRadius: "20px 0 0 20px",
        padding: "24px 22px",
        transform: `translateX(${panelX}px)`,
        boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
        overflow: "hidden",
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 6 }}>
          第二幕 · 竹林对决
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 20, letterSpacing: 1 }}>
          VIDEO GENERATION
        </div>

        {/* 剧本区 */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(56,189,248,0.6)", letterSpacing: 2, marginBottom: 8 }}>
          剧本
        </div>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 18,
          padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          月色朦胧的竹林中，沈逸风与楚夜寒四目相对。剑光闪烁，竹叶纷飞。两人身形如电，在竹林间穿梭对决...
        </div>

        {/* 分镜 */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(56,189,248,0.6)", letterSpacing: 2, marginBottom: 8 }}>
          分镜描述
        </div>
        <div style={{
          fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20,
          padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          全景：竹林深处月光穿透竹叶 → 中景：两人拔剑对峙 → 特写：剑锋交击火花
        </div>

        {/* 参与角色 */}
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(56,189,248,0.6)", letterSpacing: 2, marginBottom: 10 }}>
          参与角色
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          {[{ name: "沈逸风", img: "shen-front.png", c: "#f59e0b" }, { name: "楚夜寒", img: "chu-front.png", c: "#8b5cf6" }].map((ch, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: `1px solid ${ch.c}22`,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", border: `1px solid ${ch.c}44` }}>
                <Img src={staticFile(`images/${ch.img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "white" }}>{ch.name}</div>
            </div>
          ))}
        </div>

        {/* 生成按钮 + 进度 */}
        <div style={{
          padding: "12px 0", borderRadius: 12, textAlign: "center",
          background: `rgba(56,189,248,${0.15 * pulse})`,
          border: "1px solid rgba(56,189,248,0.3)",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", letterSpacing: 2 }}>
            ⟳ 生成中...
          </div>
        </div>

        {/* 进度条 */}
        <div style={{
          height: 6, borderRadius: 3,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}>
          <div style={{
            width: `${progress * 100}%`, height: "100%",
            background: "linear-gradient(90deg, #38bdf8, #a78bfa)",
            borderRadius: 3,
            boxShadow: "0 0 10px rgba(56,189,248,0.4)",
          }} />
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6, textAlign: "center" }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* 底部技术栈 */}
      <div style={{
        position: "absolute", bottom: 24, left: 0, right: 0,
        display: "flex", justifyContent: "center", gap: 12,
      }}>
        {["Spring Cloud", "DashScope wan2.6-t2v", "React Flow", "Remotion"].map((t, i) => {
          const td = Math.round((4 + i * 0.15) * fps);
          const ts = spring({ frame: Math.max(0, frame - td), fps, config: { damping: 200 } });
          return (
            <div key={i} style={{
              fontSize: 11, padding: "4px 14px", borderRadius: 12,
              color: "rgba(167,139,250,0.6)", background: "rgba(167,139,250,0.06)",
              border: "1px solid rgba(167,139,250,0.12)", opacity: ts,
            }}>{t}</div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
