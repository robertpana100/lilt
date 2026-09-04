import { useState, type ReactNode } from "react";

/** Mount expensive tools only while their native disclosure is open. */
export function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="disclosure" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{title}</summary>
      {open && <div className="disclosure-content">{children}</div>}
    </details>
  );
}
