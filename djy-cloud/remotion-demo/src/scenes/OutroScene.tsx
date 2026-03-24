import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

const SHOWCASE_IMGS = [
  { img: "shen-front.png", x: 200, y: 300, w: 160 },
  { img: "chu-front.png",  x: 1560, y: 320, w: 160 },
  { img: "bamboo-battle.png", x: 820, y: 680, w: 280 },
];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const titleScale = interpolate(titleSpring, [0, 1], [0.85, 1]);

  const subDelay = Math.round(0.4 * fps);
  const subSpring = spring({ frame: Math.max(0, frame - subDelay), fps, config: { damping: 200 } });

  const lineW = interpolate(titleSpring, [0, 1], [0, 300]);

  // 多层光晕
  const glow1 = 400 + Math.sin(frame / 12) * 40;
  const glow2 = 600 + Math.sin(frame / 18 + 1) * 50;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #06020f 0%, #120828 40%, #1e0d4a 70%, #06020f 100%)" }}>
      {/* 双层光晕 */}
      <div style={{
        position: "absolute", left: "50%", top: "40%",
        width: glow1, height: glow1, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.25) 0%, transparent 70%)",
        transform: "translate(-50%, -50%)",
      }} />
      <div style={{
        position: "absolute", left: "50%", top: "45%",
        width: glow2, height: glow2, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,60,200,0.1) 0%, transparent 60%)",
        transform: "translate(-50%, -50%)",
      }} />

      {/* 浮动展示图 */}
      {SHOWCASE_IMGS.map((s, i) => {
        const d = Math.round((0.2 + i * 0.3) * fps);
        const ss = spring({ frame: Math.max(0, frame - d), fps, config: { damping: 200 } });
        const floatY = Math.sin((frame + i * 30) / 20) * 6;
        return (
          <div key={i} style={{
            position: "absolute", left: s.x, top: s.y + floatY, width: s.w,
            borderRadius: 14, overflow: "hidden", opacity: ss * 0.25,
            border: "1px solid rgba(167,139,250,0.1)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          }}>
            <Img src={staticFile(`images/${s.img}`)} style={{ width: "100%", display: "block" }} />
          </div>
        );
      })}

      {/* 中心内容 */}
      <AbsoluteFill style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontSize: 88, fontWeight: 900, color: "white", letterSpacing: -2,
          opacity: titleSpring, transform: `scale(${titleScale})`,
          textShadow: "0 0 100px rgba(167,139,250,0.5), 0 4px 20px rgba(0,0,0,0.5)",
        }}>
          短剧园
        </div>

        <div style={{
          fontSize: 24, fontWeight: 300, color: "rgba(167,139,250,0.9)",
          letterSpacing: 14, marginTop: 6, opacity: titleSpring,
          textShadow: "0 0 30px rgba(167,139,250,0.3)",
        }}>
          DJY CLOUD
        </div>

        <div style={{
          width: lineW, height: 1, marginTop: 28, marginBottom: 28,
          background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.5), transparent)",
        }} />

        <div style={{
          fontSize: 20, color: "rgba(255,255,255,0.65)", letterSpacing: 4, opacity: subSpring,
        }}>
          AIGC 驱动 · 全流程短剧创作
        </div>

        {/* 技术标签行 */}
        <div style={{
          display: "flex", gap: 12, marginTop: 36, opacity: subSpring,
        }}>
          {["React Flow", "Spring Cloud", "DashScope", "Remotion"].map((t, i) => (
            <div key={i} style={{
              fontSize: 11, padding: "4px 14px", borderRadius: 12,
              color: "rgba(167,139,250,0.5)", background: "rgba(167,139,250,0.06)",
              border: "1px solid rgba(167,139,250,0.1)",
            }}>{t}</div>
          ))}
        </div>

        <div style={{
          fontSize: 13, color: "rgba(255,255,255,0.2)", marginTop: 50,
          letterSpacing: 3, opacity: subSpring,
        }}>
          Built with Remotion · Video as Code
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
