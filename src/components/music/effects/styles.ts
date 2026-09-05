import * as stylex from "@stylexjs/stylex";
import { space } from "@/components/ui/tokens.stylex";

export const styles = stylex.create({
  heading: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    marginBottom: space.md,
  },
  effectRow: {
    display: "grid",
    gridTemplateColumns: { default: "128px minmax(0, 1fr)", "@media (max-width: 640px)": "minmax(0, 1fr)" },
    alignItems: "start",
    columnGap: space.xl,
    rowGap: space.sm,
    paddingBlock: space.sm,
  },
  effectParameters: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(auto-fit, minmax(110px, 1fr))",
      "@media (max-width: 640px)": "repeat(2, minmax(0, 1fr))",
    },
    gap: space.lg,
    paddingBlock: space.xs,
    paddingLeft: { default: 0, "@media (max-width: 640px)": 36 },
  },
});
