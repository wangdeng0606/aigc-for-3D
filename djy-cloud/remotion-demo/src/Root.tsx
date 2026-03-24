import { Composition } from "remotion";
import { DjyDemo } from "./DjyDemo";

// 30fps × 40秒
const FPS = 30;
const DURATION_SEC = 40;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="DjyDemo"
      component={DjyDemo}
      durationInFrames={FPS * DURATION_SEC}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
