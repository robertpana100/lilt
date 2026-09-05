import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "./tokens.stylex";
import { controlStyles } from "./controlStyles";

type SliderProps = Omit<ComponentProps<"input">, "className" | "style" | "type" | "value" | "min" | "max"> & {
  value: number;
  min?: number;
  max?: number;
};

export function Slider({ value, min = 0, max = 100, step = 1, ...props }: SliderProps) {
  const progress = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
  return (
    <input
      {...props}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      {...stylex.props(controlStyles.focus, controlStyles.disabled, styles.slider, styles.progress(`${progress}%`))}
    />
  );
}

const styles = stylex.create({
  slider: {
    appearance: { default: "none", "::-webkit-slider-thumb": "none" },
    width: { default: "100%", "::-webkit-slider-thumb": 12, "::-moz-range-thumb": 12 },
    height: { default: 28, "::-webkit-slider-thumb": 12, "::-moz-range-thumb": 12 },
    minWidth: 0,
    margin: 0,
    padding: 0,
    borderWidth: { default: 0, "::-webkit-slider-thumb": 0, "::-moz-range-thumb": 0 },
    borderRadius: { default: 3, "::-webkit-slider-thumb": "50%", "::-moz-range-thumb": "50%" },
    backgroundColor: {
      default: "transparent",
      "::-webkit-slider-thumb": colors.fill,
      "::-moz-range-thumb": colors.fill,
    },
    backgroundSize: "100% 2px",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    boxShadow: {
      "::-webkit-slider-thumb": `0 0 0 3px ${colors["--page-background"]}`,
      "::-moz-range-thumb": `0 0 0 3px ${colors["--page-background"]}`,
    },
  },
  progress: (value: string) => ({
    backgroundImage: `linear-gradient(to right, ${colors.fill} ${value}, ${colors.track} ${value})`,
  }),
});
