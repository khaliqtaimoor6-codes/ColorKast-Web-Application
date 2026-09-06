import { ok } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return ok(null);
  return ok({ id: user.id, username: user.username, role: user.role });
}