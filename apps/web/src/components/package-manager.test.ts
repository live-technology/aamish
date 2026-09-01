import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MenuCard, MenuImageField, type MenuPackage } from "./package-manager";

const menu: MenuPackage = {
  id: "menu-1",
  title: "Homestyle lunch",
  description: "Rice, vegetables, and protein.",
  category: "REGULAR_LUNCH",
  price: 150,
  status: "ACTIVE",
  image_mobile_url: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
};

describe("menu library contracts", () => {
  test("keeps package imagery decorative beside its text identity", () => {
    const html = renderToStaticMarkup(createElement(MenuCard, { menu, edit: () => undefined }));
    expect(html).toContain("Homestyle lunch");
    expect(html).toContain("৳150.00");
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-label="Edit Homestyle lunch"');
  });

  test("requires an image on create", () => {
    const html = renderToStaticMarkup(createElement(MenuImageField, { editing: null, previewUrl: "", imageFile: null, chooseImage: () => undefined }));
    expect(html).toContain('required=""');
    expect(html).toContain("JPG, PNG, or WebP");
  });

  test("preserves the current image unless edit chooses a replacement", () => {
    const html = renderToStaticMarkup(createElement(MenuImageField, { editing: menu, previewUrl: "", imageFile: null, chooseImage: () => undefined }));
    expect(html).not.toContain('required=""');
    expect(html).toContain("Replace image");
    expect(html).toContain("Homestyle lunch current image");
  });
});
