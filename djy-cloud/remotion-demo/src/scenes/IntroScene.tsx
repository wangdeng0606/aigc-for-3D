import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  Easing,
} from "remotion";

const TAGLINE = "AIGC 驱动的短剧全流程创作平台";
const CHAR_FRAMES = 3;

// 浮动角色预览卡
const FLOAT_CARDS = [
  { img: "shen-front.png", x: 120,  y: 180, w: 200, delay: 0.4 },
  { img: "chu-front.png",  x: 1600, y: 200, w: 200, delay: 0.7 },
  { img: "shen-side2.png", x: 80,   y: 620, w: 160, delay: 1.0 },
  { img: "chu-side1.png",  x: 1660, y: 640, w: 160, delay: 1.3 },
  { img: "bamboo-battle.png", x: 1300, y: 750, w: 280, delay: 1.6 },
];

// 粒子系统
const PARTICLES = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 397 + 127) % 1920,
  y: (i * 523 + 89) % 1080,
  size: 2 + (i % 5) * 1.5,
  speed: 0.3 + (i % 7) * 0.15,
  phase: i * 0.8,
}));

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 背景缓慢旋转
  const bgAngle = interpolate(frame, [0, 8 * fps], [135, 155], { extrapolateRight: "clamp" });

  // 标题弹入（有弹性）
  const titleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const titleY = interpolate(titleSpring, [0, 1], [120, 0]);
  const titleScale = interpolate(titleSpring, [0, 1], [0.7, 1]);

  // 副标题
  const subDelay = Math.round(0.6 * fps);
  const subSpring = spring({ frame: Math.max(0, frame - subDelay), fps, config: { damping: 200 } });

  // 装饰线展开
  const lineDelay = Math.round(0.3 * fps);
  const lineSpring = spring({ frame: Math.max(0, frame - lineDelay), fps, config: { damping: 200 } });
  const lineW = interpolate(lineSpring, [0, 1], [0, 500]);

  // 打字机 tagline
  const typeStart = Math.round(2 * fps);
  const typedLen = Math.min(
    TAGLINE.length,
    Math.max(0, Math.floor((frame - typeStart) / CHAR_FRAMES))
  );
  const typedText = TAGLINE.slice(0, typedLen);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;

  // 中心发光脉冲
  const glowPulse = 0.3 + Math.sin(frame / 15) * 0.15;
  const glowSize = 500 + Math.sin(frame / 20) * 60;

  return (
    <AbsoluteFill>
      {/* 深色渐变背景 */}
      <AbsoluteFill
        style={{ background: `linear-gradient(${bgAngle}deg, #06020f 0%, #120828 25%, #1e0d4a 55%, #0d0620 100%)` }}
      />

      {/* 扫光效果 */}
      <div
        style={{
          position: "absolute",
          left: interpolate(frame, [0, 4 * fps], [-600, 2200], { extrapolateRight: "clamp" }),
          top: 0,
          width: 300,
          height: 1080,
          background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.04), transparent)",
          transform: "skewX(-15deg)",
        }}
      />

      {/* 粒子场 */}
      {PARTICLES.map((p, i) => {
        const py = (p.y + frame * p.speed) % 1080;
        const flicker = 0.15 + Math.sin(frame / 10 + p.phase) * 0.1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x + Math.sin(frame / 30 + p.phase) * 8,
              top: py,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: i % 3 === 0 ? "rgba(251,191,36,0.6)" : "rgba(167,139,250,0.5)",
              opacity: flicker,
            }}
          />
        );
      })}

      {/* 浮动角色卡片 */}
      {FLOAT_CARDS.map((card, i) => {
        const d = Math.round(card.delay * fps);
        const cardSpring = spring({ frame: Math.max(0, frame - d), fps, config: { damping: 200 } });
        const floatY = Math.sin((frame + i * 40) / 25) * 8;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: card.x,
              top: card.y + floatY,
              width: card.w,
              borderRadius: 16,
              overflow: "hidden",
              opacity: cardSpring * 0.35,
              transform: `scale(${interpolate(cardSpring, [0, 1], [0.8, 1])})`,
              border: "1px solid rgba(167,139,250,0.15)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            }}
          >
            <Img src={staticFile(`images/${card.img}`)} style={{ width: "100%", display: "block" }} />
          </div>
        );
      })}

      {/* 中心光晕 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(167,139,250,${glowPulse}) 0%, rgba(99,60,200,0.08) 40%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* 中心内容 */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 上装饰线 */}
        <div style={{
          width: lineW, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)",
          marginBottom: 24,
        }} />

        {/* 主标题 */}
        <div style={{
          fontSize: 100,
          fontWeight: 900,
          color: "white",
          letterSpacing: -3,
          opacity: titleSpring,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
          textShadow: "0 0 80px rgba(167,139,250,0.6), 0 4px 20px rgba(0,0,0,0.5)",
        }}>
          短剧园
        </div>

        {/* 英文副标题 */}
        <div style={{
          fontSize: 30,
          fontWeight: 300,
          color: "rgba(167,139,250,0.9)",
          letterSpacing: 16,
          marginTop: 4,
          opacity: subSpring,
          textShadow: "0 0 30px rgba(167,139,250,0.3)",
        }}>
          DJY CLOUD
        </div>

        {/* 下装饰线 */}
        <div style={{
          width: lineW, height: 1,
          background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.6), transparent)",
          marginTop: 24,
        }} />

        {/* 打字机 tagline */}
        <div style={{
          fontSize: 22,
          color: "rgba(255,255,255,0.75)",
          marginTop: 44,
          fontWeight: 400,
          letterSpacing: 4,
          height: 30,
        }}>
          <span>{typedText}</span>
          <span style={{ opacity: cursorOn ? 1 : 0, color: "#a78bfa" }}>│</span>
        </div>
      </AbsoluteFill>

      {/* 底部渐变遮罩 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
        background: "linear-gradient(transparent, rgba(6,2,15,0.8))",
      }} />
    </AbsoluteFill>
  );
};
