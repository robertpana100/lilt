import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dismissNotification, notify } from "@/app/notifications/store";
import { NotificationBanner } from "@/app/notifications/NotificationBanner";
describe("studio notifications", () => {
  beforeEach(dismissNotification);
  afterEach(cleanup);
  test("announces playback errors and can be dismissed", () => {
    const view = render(<NotificationBanner />);
    act(() => notify("error", "Music could not start."));
    expect(screen.getByText("Music could not start.")).toBeTruthy();
    expect(view.container.querySelector('[aria-live="polite"]')?.textContent).toContain("Music could not start.");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Music could not start.")).toBeNull();
  });
});
