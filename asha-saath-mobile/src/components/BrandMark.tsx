import Svg, { Circle, Path, Rect } from "react-native-svg";
export function BrandMark() {
  return (
    <Svg
      width={42}
      height={42}
      viewBox="0 0 48 48"
      accessibilityLabel="ASHA Saath original mark"
    >
      <Rect
        x={2}
        y={2}
        width={44}
        height={44}
        rx={7}
        fill="white"
        stroke="#102A43"
        strokeWidth={2}
      />
      <Circle
        cx={17}
        cy={16}
        r={4}
        stroke="#102A43"
        strokeWidth={2}
        fill="white"
      />
      <Circle
        cx={32}
        cy={16}
        r={4}
        stroke="#102A43"
        strokeWidth={2}
        fill="white"
      />
      <Path
        d="M10 31c0-9 14-9 14 0M25 31c0-9 14-9 14 0"
        stroke="#102A43"
        strokeWidth={2}
        fill="none"
      />
      <Path
        d="m10 39 9-4 7 4 12-4"
        stroke="#F29D38"
        strokeWidth={3}
        fill="none"
      />
    </Svg>
  );
}
