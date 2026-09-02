"use client";

import Link from "next/link";
import { MoreHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { uiStyles as styles } from "./primitives";

const MAX_DIRECT_DESTINATIONS = 4;

export type MobileNavigationItem = {
  href: string;
  label: string;
  icon: ReactNode;
  mobilePrimary?: boolean;
};

export function mobileNavigationGroups<T extends Pick<MobileNavigationItem, "href" | "mobilePrimary">>(navigation: T[], currentPath: string) {
  if (navigation.length <= MAX_DIRECT_DESTINATIONS + 1) return { direct: navigation, overflow: [] };

  const preferred = navigation.filter((item) => item.mobilePrimary);
  const direct = preferred.slice(0, MAX_DIRECT_DESTINATIONS);
  for (const item of navigation) {
    if (direct.length >= MAX_DIRECT_DESTINATIONS) break;
    if (!direct.some(({ href }) => href === item.href)) direct.push(item);
  }

  const active = navigation.find(({ href }) => href === currentPath);
  if (active && !direct.some(({ href }) => href === active.href)) {
    direct[MAX_DIRECT_DESTINATIONS - 1] = active;
  }

  const directHrefs = new Set(direct.map(({ href }) => href));
  return {
    direct,
    overflow: navigation.filter(({ href }) => !directHrefs.has(href)),
  };
}

type MobileNavigationProps = {
  workspace: string;
  currentPath: string;
  navigation: MobileNavigationItem[];
};

export function MobileNavigation({ workspace, currentPath, navigation }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => mobileNavigationGroups(navigation, currentPath), [navigation, currentPath]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("a[href]")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        moreButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return <>
    <nav className={styles.mobileNav} aria-label={`${workspace} mobile navigation`}>
      {groups.direct.map(({ href, label, icon }) => (
        <Link
          className={`${styles.mobileNavLink} ${currentPath === href ? styles.mobileNavActive : ""}`}
          href={href}
          aria-current={currentPath === href ? "page" : undefined}
          key={href}
        >
          {icon}
          <span>{label}</span>
        </Link>
      ))}
      {groups.overflow.length > 0 && <button
        className={styles.mobileNavLink}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-more-navigation"
        onClick={() => setOpen((value) => !value)}
        ref={moreButtonRef}
      >
        <MoreHorizontal size={20} aria-hidden="true" />
        <span>More</span>
      </button>}
    </nav>

    {open && <div className={styles.mobileNavOverlay}>
      <div className={styles.mobileNavBackdrop} aria-hidden="true" onClick={() => setOpen(false)} />
      <div className={styles.mobileNavPanel} id="mobile-more-navigation" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title" ref={panelRef}>
        <header>
          <div>
            <span>{workspace}</span>
            <h2 id="mobile-more-title">More destinations</h2>
          </div>
          <button type="button" aria-label="Close more destinations" onClick={() => { setOpen(false); moreButtonRef.current?.focus(); }}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <nav aria-label={`More ${workspace} destinations`}>
          {groups.overflow.map(({ href, label, icon }) => <Link href={href} key={href}>
            {icon}
            <span>{label}</span>
          </Link>)}
        </nav>
      </div>
    </div>}
  </>;
}
