import "../styles/globals.css";
import { Composition } from "remotion";

// Placeholder composition; PromoVideo replaces it later.
const Main: React.FC = () => null;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Main"
      component={Main}
      durationInFrames={60}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
