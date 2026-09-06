// Pure types and permission helpers — safe to import from client components
// (no database or native-module dependency).

export type Role = "USER" | "ADMIN_L1" | "ADMIN_L2" | "ADMIN_L3";

// Design decision (B): three collections named Premium / Classic / Economy.
// Collection names are not specified by the SRS.
export const COLLECTIONS = ["Premium", "Classic", "Economy"] as const;
export type Collection = (typeof COLLECTIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  USER: [],
  ADMIN_L1: ["paint:add"],
  ADMIN_L2: ["paint:add", "paint:update"],
  ADMIN_L3: ["paint:add", "paint:update", "paint:delete", "users:manage"],
};

export const ROLE_LABELS: Record<Role, string> = {
  USER: "Default user",
  ADMIN_L1: "Administrator Level 1",
  ADMIN_L2: "Administrator Level 2",
  ADMIN_L3: "Administrator Level 3",
};

const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  ADMIN_L1: 1,
  ADMIN_L2: 2,
  ADMIN_L3: 3,
};

export function can(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function roleRank(role: Role): number {
  return ROLE_RANK[role] ?? 0;
}

export function isAdminRole(role: Role | null): boolean {
  return role === "ADMIN_L1" || role === "ADMIN_L2" || role === "ADMIN_L3";
}