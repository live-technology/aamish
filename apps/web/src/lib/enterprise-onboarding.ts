export type EnterpriseLocationDraft = {
  name: string;
  code: string;
  address: string;
};

export type EnterpriseDraft = {
  name: string;
  pocName: string;
  pocPhone: string;
  pocEmail: string;
  locations: EnterpriseLocationDraft[];
  adminFullName: string;
  adminUsername: string;
  adminPassword: string;
};

export type EnterpriseStep = "company" | "locations" | "administrator" | "review";

export const enterpriseSteps: Array<{ id: EnterpriseStep; label: string }> = [
  { id: "company", label: "Company" },
  { id: "locations", label: "Locations" },
  { id: "administrator", label: "Administrator" },
  { id: "review", label: "Review" },
];

export function emptyEnterpriseDraft(): EnterpriseDraft {
  return {
    name: "",
    pocName: "",
    pocPhone: "",
    pocEmail: "",
    locations: [{ name: "", code: "", address: "" }],
    adminFullName: "",
    adminUsername: "",
    adminPassword: "",
  };
}

export function slugifyEnterpriseName(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90)
    .replace(/-+$/g, "");
  return slug || "enterprise";
}

export function nextAvailableEnterpriseSlug(name: string, existingSlugs: string[]) {
  const base = slugifyEnterpriseName(name);
  const occupied = new Set(existingSlugs);
  if (!occupied.has(base)) return base;

  let suffix = 2;
  while (occupied.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function suggestEnterpriseAdminUsername(name: string) {
  return `${slugifyEnterpriseName(name).replaceAll("-", ".")}.admin`;
}

export function assignLocationCodes(names: string[], reserved: string[] = []) {
  const used = new Set(reserved.map((code) => code.toUpperCase()));
  return names.map((name) => {
    const base = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 16).replace(/-+$/g, "") || "LOCATION";
    let code = base;
    let suffix = 2;
    while (used.has(code)) { code = `${base.slice(0, 13)}-${suffix}`; suffix += 1; }
    used.add(code);
    return code;
  });
}

export function validateEnterpriseStep(step: EnterpriseStep, draft: EnterpriseDraft) {
  const errors: Record<string, string> = {};

  if (step === "company" || step === "review") {
    if (!draft.name.trim()) errors.name = "Enter the enterprise name.";
    if (!draft.pocName.trim()) errors.pocName = "Enter the primary contact’s name.";
    if (!draft.pocPhone.trim()) errors.pocPhone = "Enter the primary contact’s phone number.";
    if (!/^\S+@\S+\.\S+$/.test(draft.pocEmail.trim())) errors.pocEmail = "Enter a valid contact email.";
  }

  if (step === "locations" || step === "review") {
    if (draft.locations.length < 1) errors.locations = "Add at least one delivery location.";
    draft.locations.forEach((location, index) => {
      if (!location.name.trim()) errors[`location-${index}-name`] = "Enter a location name.";
      if (!location.address.trim()) errors[`location-${index}-address`] = "Enter the delivery address.";
    });
  }

  if (step === "administrator" || step === "review") {
    if (!draft.adminFullName.trim()) errors.adminFullName = "Enter the administrator’s name.";
    if (!draft.adminUsername.trim()) errors.adminUsername = "Enter a username.";
    if (draft.adminPassword.length < 8) errors.adminPassword = "Use at least 8 characters for the temporary password.";
  }

  return errors;
}
