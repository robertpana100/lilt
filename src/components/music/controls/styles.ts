import * as stylex from "@stylexjs/stylex";
import { colors, space } from "@/components/ui/tokens.stylex";

export const styles = stylex.create({
  root: { marginTop: space.xl, borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: colors.line },
  basics: { borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: colors.line, paddingBlock: 20 },
  grid: {
    display: "grid",
    gridTemplateColumns: { default: "repeat(2, minmax(0, 1fr))", "@media (max-width: 540px)": "minmax(0, 1fr)" },
    gap: space.xl,
    alignItems: "start",
  },
  stack: { display: "flex", flexDirection: "column", gap: space.xl },
  heading: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: space.md },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 1.5 },
  styleHint: { marginTop: space.sm },
  fullWidth: { gridColumnStart: "1", gridColumnEnd: "-1" },
});
