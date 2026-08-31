import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";
import { uiStyles as styles } from "./primitives";

export type ShellNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type AppShellProps = {
  workspace: string;
  fullName: string;
  roleLabel: string;
  currentPath: string;
  navigation: ShellNavigationItem[];
  children: ReactNode;
};

export function AppShell({
  workspace,
  fullName,
  roleLabel,
  currentPath,
  navigation,
  children,
}: AppShellProps) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href={navigation[0]?.href || "/"}>
          <Image
            src="/brand/amish-logo-01.png"
            alt="Aamish"
            width={126}
            height={55}
            priority
          />
        </Link>
        <p className={styles.workspace}>{workspace}</p>
        <nav className={styles.nav} aria-label={`${workspace} navigation`}>
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              className={`${styles.navLink} ${currentPath === href ? styles.navActive : ""}`}
              href={href}
              aria-current={currentPath === href ? "page" : undefined}
              key={href}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.profile}>
            <strong>{fullName}</strong>
            <span>{roleLabel}</span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <Image
          src="/brand/amish-logo-01.png"
          alt="Aamish"
          width={96}
          height={42}
          priority
        />
        <span>{workspace}</span>
        <SignOutButton />
      </header>

      <main className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </main>

      <nav className={styles.mobileNav} aria-label={`${workspace} mobile navigation`}>
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link
            className={`${styles.mobileNavLink} ${currentPath === href ? styles.mobileNavActive : ""}`}
            href={href}
            aria-current={currentPath === href ? "page" : undefined}
            key={href}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
