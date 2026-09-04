import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { dismissNotification, notify } from "./store";
import { NotificationBanner } from "./NotificationBanner";
describe("studio notifications", () => {
  beforeEach(dismissNotification);
  afterEach(cleanup);
  test("announces storage errors instead of dropping them and can be dismissed", () => {
    const view = render(<NotificationBanner />);
    act(() => notify("error", "The music library could not be saved."));
    expect(screen.getByText("The music library could not be saved.")).toBeTruthy();
    expect(view.container.querySelector('[aria-live="polite"]')?.textContent).toContain("could not be saved");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("The music library could not be saved.")).toBeNull();
  });
});
