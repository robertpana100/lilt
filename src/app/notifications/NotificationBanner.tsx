import { dismissNotification, useNotification } from "./store";
export function NotificationBanner() {
  const notice = useNotification();
  return (
    <div className="notice-host" aria-live="polite" aria-atomic="true">
      {notice && (
        <div className="notice" data-tone={notice.tone}>
          <p>{notice.message}</p>
          <button type="button" aria-label="Dismiss notification" onClick={dismissNotification}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
