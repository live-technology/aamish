"use client";

import { useEffect, useRef } from "react";

const focusableSelector = "button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1'])";

export function useModalDialog<T extends HTMLElement>(open: boolean, onClose: () => void, busy = false) {
  const dialogRef = useRef<T | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus());
    function keydown(event: KeyboardEvent) {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (event.key === "Escape" && !busy) { event.preventDefault(); closeRef.current(); return; }
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll<HTMLElement>(focusableSelector)].filter((item) => !item.hidden);
      if (!controls.length) { event.preventDefault(); dialog.focus(); return; }
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", keydown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [open, busy]);
  return dialogRef;
}
