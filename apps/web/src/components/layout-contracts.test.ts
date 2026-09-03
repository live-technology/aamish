import { describe, expect, test } from "bun:test";

async function readStylesheet(name: string) {
  return Bun.file(new URL(name, import.meta.url)).text();
}

describe("responsive layout contracts", () => {
  test("contains package and employee images inside bounded media frames", async () => {
    const menu = await readStylesheet("./menu-library.module.css");
    const employee = await readStylesheet("./employee-experience.module.css");

    expect(menu).toContain("aspect-ratio:16/9");
    expect(menu).toContain(".visual img,.imagePreview img{width:100%;height:100%;object-fit:cover}");
    expect(employee).toContain(".optionImage{height:130px");
    expect(employee).toContain(".optionImage img{width:100%;height:100%;object-fit:cover}");
  });

  test("centers desktop headings, metrics, and enterprise status controls", async () => {
    const ui = await readStylesheet("./ui/ui.module.css");
    const admin = await readStylesheet("./admin-experience.module.css");

    expect(ui).toContain("@media(min-width:960px){.pageHeader{align-items:center}}");
    expect(admin).toContain(".metricCard{display:flex;align-items:center");
    expect(admin).toContain(".activeToggle{display:inline-flex;align-items:center");
  });

  test("anchors desktop account controls to the viewport", async () => {
    const ui = await readStylesheet("./ui/ui.module.css");
    const shell = await readStylesheet("./ui/app-shell.tsx");
    const signOut = await readStylesheet("./ui/sign-out-button.tsx");

    expect(ui).toContain(".sidebar{position:sticky;top:0;height:100vh;min-height:0;align-self:start");
    expect(ui).toContain(".sidebarFooter{display:grid;gap:8px;margin-top:auto");
    expect(ui).toContain(".signOutButton{width:100%;justify-content:flex-start}");
    expect(shell).toContain("<SignOutButton labelled />");
    expect(signOut).toContain("Sign out");
    expect(signOut).toContain('aria-label="Sign out"');
  });

  test("contains mobile navigation without clipping destinations", async () => {
    const ui = await readStylesheet("./ui/ui.module.css");
    const mobileNavigation = await readStylesheet("./ui/mobile-navigation.tsx");

    expect(ui).toContain(".mobileNav{position:fixed;right:0;bottom:0;left:0;z-index:70;display:flex;overflow:hidden");
    expect(ui).toContain(".mobileNavLink{min-width:0;flex:1 1 0");
    expect(ui).toContain("min-height:64px");
    expect(mobileNavigation).toContain('aria-current={currentPath === href ? "page" : undefined}');
    expect(mobileNavigation).toContain('aria-label="Close more destinations"');
  });
});
