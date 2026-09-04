import { IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { dismissNotification, useNotification } from "./store";
export function NotificationBanner() {
  const notice = useNotification();
  return (
    <div className="notice-host" aria-live="polite" aria-atomic="true">
      {notice && (
        <div className="notice" data-tone={notice.tone}>
          <p>{notice.message}</p>
          <Button variant="ghost" size="icon" aria-label="Dismiss notification" onClick={dismissNotification}>
            <IconX />
          </Button>
        </div>
      )}
    </div>
  );
}
