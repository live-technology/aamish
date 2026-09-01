export type AppRole = "SUPER_ADMIN" | "ENTERPRISE_ADMIN" | "EMPLOYEE";

const ROLE_DESTINATIONS: Record<AppRole, string> = {
  SUPER_ADMIN: "/admin",
  ENTERPRISE_ADMIN: "/enterprise",
  EMPLOYEE: "/employee",
};

export const SESSION_ENDED_LOGIN_PATH = "/login?reason=session-ended";

export function destinationForRole(role: AppRole) {
  return ROLE_DESTINATIONS[role];
}

export function isRoleDestination(value: unknown): value is string {
  return (
    typeof value === "string" &&
    Object.values(ROLE_DESTINATIONS).includes(value)
  );
}
