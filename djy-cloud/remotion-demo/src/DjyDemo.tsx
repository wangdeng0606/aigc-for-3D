import { AbsoluteFill, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { flip } from "@remotion/transitions/flip";
import { IntroScene } from "./scenes/IntroScene";
import { PipelineScene } from "./scenes/PipelineScene";
import { CharacterScene } from "./scenes/CharacterScene";
import { TechScene } from "./scenes/TechScene";
import { OutroScene } from "./scenes/OutroScene";

export const DjyDemo: React.FC = () => {
  const { fps } = useVideoConfig();

  const T_SHORT = Math.round(0.6 * fps);
  const T_LONG  = Math.round(1.0 * fps);

  return (
    <AbsoluteFill>
      <TransitionSeries>
        {/* Scene 1: 标题 — 7秒 */}
        <TransitionSeries.Sequence durationInFrames={7 * fps}>
          <IntroScene />
        </TransitionSeries.Sequence>

        {/* 转场: wipe 从右侧擦入 */}
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T_LONG })}
        />

        {/* Scene 2: 流水线 — 10秒 */}
        <TransitionSeries.Sequence durationInFrames={10 * fps}>
          <PipelineScene />
        </TransitionSeries.Sequence>

        {/* 转场: clockWipe 顺时针揭开 */}
        <TransitionSeries.Transition
          presentation={clockWipe({ width: 1920, height: 1080 })}
          timing={linearTiming({ durationInFrames: T_LONG })}
        />

        {/* Scene 3: 角色设计 — 9秒 */}
        <TransitionSeries.Sequence durationInFrames={9 * fps}>
          <CharacterScene />
        </TransitionSeries.Sequence>

        {/* 转场: flip 翻转 */}
        <TransitionSeries.Transition
          presentation={flip({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: T_LONG })}
        />

        {/* Scene 4: 场景编辑+视频生成 — 8秒 */}
        <TransitionSeries.Sequence durationInFrames={8 * fps}>
          <TechScene />
        </TransitionSeries.Sequence>

        {/* 转场: fade + slide 组合感 */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: T_SHORT })}
        />

        {/* Scene 5: 结尾 — 5秒 */}
        <TransitionSeries.Sequence durationInFrames={5 * fps}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
