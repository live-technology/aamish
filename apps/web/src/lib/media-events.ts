const allowedSurfaces = new Set(["employee-meal", "enterprise-meal", "admin-menu", "admin-menu-preview"]);

export function validMediaErrorSurface(value: unknown): value is string {
  return typeof value === "string" && allowedSurfaces.has(value);
}
