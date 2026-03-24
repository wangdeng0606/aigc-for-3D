import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";

const SHEN_IMGS = ["shen-front.png", "shen-side1.png", "shen-back.png", "shen-side2.png"];
const CHU_IMGS  = ["chu-front.png", "chu-side1.png", "chu-back.png", "chu-side2.png"];
const ANGLE_LABELS = ["正面", "侧面", "背面", "¾ 视角"];

export const CharacterScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- 左侧：模拟 React Flow 画布上的角色卡 ----
  const canvasSpring = spring({ frame, fps, config: { damping: 200 } });

  // ---- 右侧：模拟角色面板 ----
  const panelDelay = Math.round(1.2 * fps);
  const panelSpring = spring({ frame: Math.max(0, frame - panelDelay), fps, config: { damping: 15, stiffness: 100 } });
  const panelX = interpolate(panelSpring, [0, 1], [420, 0]);

  // RefSet 图片依次出现
  const refDelay = Math.round(2.5 * fps);

  // 底部提示
  const tipOpacity = interpolate(frame, [6 * fps, 7 * fps], [0, 0.6], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0c0c1a" }}>
      {/* 模拟 IDE/App 背景网格 */}
      <AbsoluteFill style={{ opacity: 0.03 }}>
        <svg width="1920" height="1080">
          {Array.from({ length: 80 }, (_, i) => (
            <line key={`g-${i}`} x1={i * 24} y1={0} x2={i * 24} y2={1080} stroke="white" strokeWidth={1} />
          ))}
          {Array.from({ length: 45 }, (_, i) => (
            <line key={`gh-${i}`} x1={0} y1={i * 24} x2={1920} y2={i * 24} stroke="white" strokeWidth={1} />
          ))}
        </svg>
      </AbsoluteFill>

      {/* ==== 左侧：模拟画布 ==== */}
      <div style={{
        position: "absolute", top: 40, left: 60, width: 900,
        opacity: canvasSpring,
      }}>
        {/* 顶部 Tab 栏 */}
        <div style={{
          display: "flex", gap: 0, marginBottom: 20,
        }}>
          {["角色设计", "场景管理"].map((t, i) => (
            <div key={i} style={{
              padding: "10px 28px",
              fontSize: 14, fontWeight: 600,
              color: i === 0 ? "white" : "rgba(255,255,255,0.35)",
              background: i === 0 ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
              borderBottom: i === 0 ? "2px solid #a78bfa" : "2px solid transparent",
              letterSpacing: 1,
            }}>{t}</div>
          ))}
        </div>

        {/* 角色卡片 1: 沈逸风 */}
        {renderCharCard(frame, fps, 0.3, "沈逸风", "男", "初出江湖", "shen-front.png", "#f59e0b", 120, 80, true)}

        {/* 角色卡片 2: 楚夜寒 */}
        {renderCharCard(frame, fps, 0.8, "楚夜寒", "男", "初出江湖", "chu-front.png", "#8b5cf6", 500, 350, false)}

        {/* 关系连线 (模拟) */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: 900, height: 700, pointerEvents: "none" }}>
          <defs>
            <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          {(() => {
            const lineSpring = spring({ frame: Math.max(0, frame - Math.round(1.5 * fps)), fps, config: { damping: 200 } });
            const progress = lineSpring;
            return (
              <>
                <line
                  x1={350} y1={160} x2={350 + (500 - 350) * progress} y2={160 + (430 - 160) * progress}
                  stroke="url(#edgeGrad)" strokeWidth={2} strokeDasharray="8 4"
                />
                {progress > 0.9 && (
                  <g transform="translate(390, 280)">
                    <rect x={-30} y={-12} width={60} height={24} rx={12} fill="rgba(167,139,250,0.2)" stroke="rgba(167,139,250,0.4)" strokeWidth={1} />
                    <text x={0} y={5} textAnchor="middle" fill="#a78bfa" fontSize={11} fontWeight={600}>宿敌</text>
                  </g>
                )}
              </>
            );
          })()}
        </svg>
      </div>

      {/* ==== 右侧：模拟角色面板 ==== */}
      <div style={{
        position: "absolute", top: 30, right: 0, width: 420, height: 1020,
        background: "linear-gradient(180deg, rgba(15,10,30,0.97), rgba(10,8,20,0.98))",
        borderLeft: "1px solid rgba(167,139,250,0.15)",
        borderRadius: "20px 0 0 20px",
        padding: "24px 20px",
        transform: `translateX(${panelX}px)`,
        overflow: "hidden",
        boxShadow: "-10px 0 40px rgba(0,0,0,0.5)",
      }}>
        {/* 面板标题 */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, overflow: "hidden",
            border: "2px solid rgba(245,158,11,0.4)",
          }}>
            <Img src={staticFile("images/shen-front.png")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>沈逸风</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>男 · 武当弟子</div>
          </div>
        </div>

        {/* 阶段标签 */}
        <div style={{
          fontSize: 12, fontWeight: 600, color: "rgba(167,139,250,0.6)", letterSpacing: 2, marginBottom: 10,
        }}>
          阶段管理
        </div>
        <div style={{
          display: "flex", gap: 8, marginBottom: 20,
        }}>
          {["初出江湖", "名震武林"].map((label, i) => (
            <div key={i} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
              background: i === 0 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
              color: i === 0 ? "#fbbf24" : "rgba(255,255,255,0.3)",
              border: `1px solid ${i === 0 ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}>{label}</div>
          ))}
        </div>

        {/* 描述 */}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 18 }}>
          性格坚毅的青年侠客，师从武当，擅长剑术与轻功
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: 6, marginBottom: 22, flexWrap: "wrap" }}>
          {["勇敢", "正义", "剑术"].map((tag, i) => (
            <div key={i} style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 12,
              color: "#fbbf24", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
            }}>{tag}</div>
          ))}
        </div>

        {/* 参考图集标题 */}
        <div style={{
          fontSize: 12, fontWeight: 600, color: "rgba(167,139,250,0.6)", letterSpacing: 2, marginBottom: 12,
        }}>
          参考图集 · 白衣剑装
        </div>

        {/* 四角度图片网格 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SHEN_IMGS.map((img, i) => {
            const imgDelay = refDelay + Math.round(i * 0.2 * fps);
            const imgSpring = spring({ frame: Math.max(0, frame - imgDelay), fps, config: { damping: 15 } });
            return (
              <div key={i} style={{
                borderRadius: 10, overflow: "hidden",
                border: "1px solid rgba(167,139,250,0.12)",
                opacity: imgSpring,
                transform: `scale(${interpolate(imgSpring, [0, 1], [0.85, 1])})`,
              }}>
                <Img src={staticFile(`images/${img}`)} style={{ width: "100%", display: "block" }} />
                <div style={{
                  textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.35)",
                  padding: "4px 0", background: "rgba(0,0,0,0.3)",
                }}>{ANGLE_LABELS[i]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部提示 */}
      <div style={{
        position: "absolute", bottom: 30, left: 60,
        fontSize: 14, color: "rgba(167,139,250,0.5)", letterSpacing: 2, opacity: tipOpacity,
      }}>
        Phase × RefSet 系统 → 角色外观演进 → AI 形象一致性保障
      </div>
    </AbsoluteFill>
  );
};

/** 模拟画布上的角色节点卡片 */
function renderCharCard(
  frame: number, fps: number, delaySec: number,
  name: string, gender: string, phase: string, img: string,
  color: string, x: number, y: number, selected: boolean,
) {
  const delay = Math.round(delaySec * fps);
  const s = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12 } });
  const scale = interpolate(s, [0, 1], [0.7, 1]);

  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: 230,
      background: "rgba(255,255,255,0.06)",
      border: selected ? "2px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: "16px 18px",
      opacity: s,
      transform: `scale(${scale})`,
      boxShadow: selected ? "0 0 30px rgba(167,139,250,0.15)" : "0 4px 20px rgba(0,0,0,0.3)",
    }}>
      {/* 四角圆点 */}
      {[{ t: -3, l: -3 }, { t: -3, r: -3 }, { b: -3, l: -3 }, { b: -3, r: -3 }].map((pos, i) => (
        <div key={i} style={{
          position: "absolute", ...pos as any,
          width: 6, height: 6, borderRadius: "50%",
          background: "rgba(167,139,250,0.4)",
        }} />
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, overflow: "hidden",
          border: `2px solid ${color}66`,
          boxShadow: `0 4px 12px ${color}22`,
        }}>
          <Img src={staticFile(`images/${img}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{gender}</div>
          <div style={{
            fontSize: 10, fontWeight: 500, marginTop: 4,
            color: `${color}cc`, background: `${color}15`, padding: "2px 8px", borderRadius: 6,
            display: "inline-block",
          }}>{phase}</div>
        </div>
      </div>
    </div>
  );
}
