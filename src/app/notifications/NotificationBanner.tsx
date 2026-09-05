import { Button } from "@/components/ui/Button";
import { dismissNotification, useNotification } from "./store";
import * as stylex from "@stylexjs/stylex";
import { colors, control, space } from "@/components/ui/tokens.stylex";
export function NotificationBanner() {
  const notice = useNotification();
  return (
    <div {...stylex.props(styles.host)} aria-live="polite" aria-atomic="true">
      {notice && (
        <div {...stylex.props(styles.notice, notice.tone === "error" && styles.error)}>
          <p>{notice.message}</p>
          <Button variant="quiet" aria-label="Dismiss notification" onClick={dismissNotification}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

const styles = stylex.create({
  host: {
    position: "fixed",
    bottom: space.xl,
    right: space.xl,
    maxWidth: "min(440px, calc(100vw - 48px))",
    zIndex: 100,
  },
  notice: {
    display: "flex",
    alignItems: "center",
    gap: space.lg,
    paddingBlock: space.sm,
    paddingInline: space.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.line,
    borderRadius: control.radius,
    fontSize: 13,
  },
  error: { color: colors.error },
});
