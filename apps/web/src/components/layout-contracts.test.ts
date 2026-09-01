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
});
