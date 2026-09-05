import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import * as stylex from "@stylexjs/stylex";
import { colors, control, space } from "./tokens.stylex";
import { controlStyles } from "./controlStyles";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  "aria-label": string;
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

/** A select-only combobox. Focus stays on the trigger while exploring options. */
export function Select({ "aria-label": label, value, options, onValueChange, disabled }: SelectProps) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(
    null,
  );
  const selected = options.findIndex((option) => option.value === value);
  const active = Math.max(0, Math.min(highlighted, options.length - 1));
  const expanded = open && !disabled && options.length > 0;

  const show = (index = Math.max(0, selected)) => {
    setHighlighted(index);
    setPosition(null);
    setOpen(true);
  };
  const choose = (index: number) => {
    const option = options[index];
    setOpen(false);
    searchRef.current.text = "";
    if (option && option.value !== value) onValueChange(option.value);
  };

  useLayoutEffect(() => {
    if (!expanded) {
      setOpen(false);
      return;
    }
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;
    const place = () => {
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(Math.max(rect.width, 160), window.innerWidth - 16);
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const height = Math.min(menu.scrollHeight + menu.offsetHeight - menu.clientHeight, 288);
      const upwards = below < height && above > below;
      const maxHeight = Math.max(0, Math.min(288, upwards ? above : below));
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: upwards ? rect.top - Math.min(height, maxHeight) - 4 : rect.bottom + 4,
        width,
        maxHeight,
      });
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !trigger.contains(event.target) && !menu.contains(event.target)) {
        setOpen(false);
      }
    };
    const scroll = (event: Event) => {
      if (event.target instanceof Node && menu.contains(event.target)) return;
      place();
    };
    place();
    window.addEventListener("resize", place);
    document.addEventListener("scroll", scroll, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", scroll, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [expanded, options.length]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const option = document.getElementById(`${id}-${active}`);
    if (!expanded || !position || !menu || !option) return;
    // Scroll only the popup. scrollIntoView can also move the underlying page.
    const top = option.offsetTop;
    const bottom = top + option.offsetHeight;
    if (top < menu.scrollTop) menu.scrollTop = top;
    else if (bottom > menu.scrollTop + menu.clientHeight) menu.scrollTop = bottom - menu.clientHeight;
  }, [active, expanded, id, position]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || !options.length) return;
    const current = expanded ? active : Math.max(0, selected);
    const last = options.length - 1;
    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        if (expanded) choose(active);
        else show();
        return;
      case "Escape":
        if (expanded) event.preventDefault();
        setOpen(false);
        searchRef.current.text = "";
        return;
      case "Tab":
        if (expanded) choose(active);
        return;
      case "ArrowDown":
      case "ArrowUp":
      case "Home":
      case "End":
      case "PageDown":
      case "PageUp": {
        event.preventDefault();
        searchRef.current.text = "";
        if (expanded && event.altKey && event.key === "ArrowUp") {
          choose(active);
          return;
        }
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : event.key === "PageDown"
                ? current + 10
                : event.key === "PageUp"
                  ? current - 10
                  : !expanded
                    ? current
                    : current + (event.key === "ArrowDown" ? 1 : -1);
        if (expanded) setHighlighted(Math.max(0, Math.min(last, next)));
        else show(Math.max(0, Math.min(last, next)));
        return;
      }
    }
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const now = Date.now();
    const text = (now - searchRef.current.time < 700 ? searchRef.current.text : "") + event.key.toLocaleLowerCase();
    searchRef.current = { text, time: now };
    const repeated = Array.from(text).every((character) => character === text[0]);
    const query = repeated ? text[0]! : text;
    for (let offset = repeated ? 1 : 0; offset < options.length + (repeated ? 1 : 0); offset++) {
      const index = (current + offset) % options.length;
      if (options[index]!.label.toLocaleLowerCase().startsWith(query)) {
        if (expanded) setHighlighted(index);
        else show(index);
        return;
      }
    }
    if (!expanded) show();
  };

  return (
    <span {...stylex.props(styles.wrapper)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? id : undefined}
        aria-activedescendant={expanded ? `${id}-${active}` : undefined}
        disabled={disabled || !options.length}
        onClick={() => {
          searchRef.current.text = "";
          if (expanded) setOpen(false);
          else show();
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
        {...stylex.props(controlStyles.input, controlStyles.focus, controlStyles.disabled, styles.trigger)}
      >
        <span {...stylex.props(styles.label)}>{options[selected]?.label ?? "Select"}</span>
        <svg {...stylex.props(styles.icon)} viewBox="0 0 16 16" aria-hidden="true">
          <path d="m5 6 3 3 3-3" />
        </svg>
      </button>
      {expanded &&
        createPortal(
          <div
            ref={menuRef}
            id={id}
            role="listbox"
            aria-label={label}
            {...stylex.props(
              styles.menu,
              !position && styles.hidden,
              position && styles.position(position.left, position.top, position.width, position.maxHeight),
            )}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                id={`${id}-${index}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                onMouseDown={(event) => event.preventDefault()}
                onPointerMove={() => setHighlighted(index)}
                onClick={() => {
                  choose(index);
                  triggerRef.current?.focus();
                }}
                {...stylex.props(styles.option, index === active && styles.active)}
              >
                <span {...stylex.props(styles.label)}>{option.label}</span>
                {option.value === value && (
                  <svg {...stylex.props(styles.icon)} viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m4 8 3 3 5-6" />
                  </svg>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}

const styles = stylex.create({
  wrapper: { display: "grid", minWidth: 0 },
  trigger: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.md, textAlign: "left" },
  label: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  icon: {
    width: 16,
    height: 16,
    flexShrink: 0,
    fill: "none",
    stroke: colors.muted,
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  menu: {
    position: "fixed",
    zIndex: 200,
    overflowY: "auto",
    overscrollBehavior: "contain",
    margin: 0,
    padding: space.xs,
    backgroundColor: colors.surface,
    color: colors["--page-text"],
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.controlLine,
    borderRadius: control.radius,
    boxShadow: "0 4px 16px rgb(0 0 0 / 8%)",
  },
  hidden: { visibility: "hidden" },
  position: (left: number, top: number, width: number, maxHeight: number) => ({ left, top, width, maxHeight }),
  option: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    width: "100%",
    minHeight: 32,
    paddingBlock: 6,
    paddingInline: space.sm,
    borderWidth: 0,
    borderRadius: 3,
    color: "inherit",
    backgroundColor: "transparent",
    fontSize: control.fontSize,
    lineHeight: 1.4,
    textAlign: "left",
    cursor: "pointer",
  },
  active: { backgroundColor: colors.hover },
});
