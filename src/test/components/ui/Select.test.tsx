import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Select } from "@/components/ui/Select";

const options = [
  { value: "apple", label: "Apple" },
  { value: "apricot", label: "Apricot" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
];

function Example({ onChange = () => {} }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState("apple");
  return (
    <>
      <Select
        aria-label="Fruit"
        value={value}
        options={options}
        onValueChange={(next) => {
          setValue(next);
          onChange(next);
        }}
      />
      <button type="button">Next control</button>
    </>
  );
}

function activeOption(trigger: HTMLElement) {
  return document.getElementById(trigger.getAttribute("aria-activedescendant") ?? "");
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("custom select", () => {
  test("opens a custom listbox and commits a pointer selection with focus on the trigger", () => {
    const onChange = vi.fn();
    const view = render(<Example onChange={onChange} />);
    const trigger = screen.getByRole("combobox", { name: "Fruit" });
    expect(view.container.querySelector("select")).toBeNull();
    expect(screen.queryByRole("listbox")).toBeNull();
    fireEvent.click(trigger);
    const list = screen.getByRole("listbox", { name: "Fruit" });
    expect(list.id).toBe(trigger.getAttribute("aria-controls"));
    expect(list.parentElement).toBe(document.body);
    expect(screen.getByRole("option", { name: "Apple", selected: true })).toBeTruthy();
    fireEvent.click(screen.getByRole("option", { name: "Banana" }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith("banana");
    expect(trigger.textContent).toBe("Banana");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  test("explores with arrows and boundary keys without changing the value; Escape cancels", () => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    const trigger = screen.getByRole("combobox");
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(activeOption(trigger)?.textContent).toBe("Apple");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(activeOption(trigger)?.textContent).toBe("Apricot");
    fireEvent.keyDown(trigger, { key: "End" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(activeOption(trigger)?.textContent).toBe("Cherry");
    fireEvent.keyDown(trigger, { key: "PageUp" });
    expect(activeOption(trigger)?.textContent).toBe("Apple");
    fireEvent.keyDown(trigger, { key: "PageDown" });
    expect(activeOption(trigger)?.textContent).toBe("Cherry");
    fireEvent.keyDown(trigger, { key: "Home" });
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    expect(activeOption(trigger)?.textContent).toBe("Apple");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger.textContent).toBe("Apple");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test.each(["Enter", " ", "Tab"])("commits the highlighted option with %s", (key) => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "End" });
    const allowDefault = fireEvent.keyDown(trigger, { key });
    expect(allowDefault).toBe(key === "Tab");
    expect(onChange).toHaveBeenCalledExactlyOnceWith("cherry");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  test("supports typed prefixes, repeated-letter cycling, and a fresh search after a pause", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
    render(<Example />);
    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "a" });
    expect(activeOption(trigger)?.textContent).toBe("Apricot");
    fireEvent.keyDown(trigger, { key: "a" });
    expect(activeOption(trigger)?.textContent).toBe("Apple");
    clock.mockReturnValue(2000);
    for (const key of "apr") fireEvent.keyDown(trigger, { key });
    expect(activeOption(trigger)?.textContent).toBe("Apricot");
    clock.mockReturnValue(3000);
    fireEvent.keyDown(trigger, { key: "c" });
    expect(activeOption(trigger)?.textContent).toBe("Cherry");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(trigger.textContent).toBe("Cherry");
  });

  test("dismisses on outside pointer input or blur without committing or taking focus", () => {
    const onChange = vi.fn();
    render(<Example onChange={onChange} />);
    const trigger = screen.getByRole("combobox");
    const next = screen.getByRole("button", { name: "Next control" });
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: "End" });
    fireEvent.pointerDown(next);
    act(() => next.focus());
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(next);
    fireEvent.click(trigger);
    fireEvent.blur(trigger);
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  test("reflects controlled changes and closes when disabled without reopening on enable", () => {
    const onValueChange = vi.fn();
    const props = { "aria-label": "Fruit", options, onValueChange };
    const view = render(<Select {...props} value="apple" />);
    const trigger = screen.getByRole("combobox");
    view.rerender(<Select {...props} value="banana" />);
    expect(trigger.textContent).toBe("Banana");
    fireEvent.click(trigger);
    expect(activeOption(trigger)?.textContent).toBe("Banana");
    view.rerender(<Select {...props} value="banana" disabled />);
    expect(screen.queryByRole("listbox")).toBeNull();
    view.rerender(<Select {...props} value="banana" />);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
