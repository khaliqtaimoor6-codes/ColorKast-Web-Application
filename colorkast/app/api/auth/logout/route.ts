import { ok } from "@/lib/api";
import { logout } from "@/lib/auth";

export async function POST() {
  await logout();
  return ok({ signedOut: true });
}