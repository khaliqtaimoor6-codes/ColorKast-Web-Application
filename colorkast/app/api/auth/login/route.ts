import { err, ok, nonEmptyString } from "@/lib/api";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid request body.", 400);
  }

  const { username, password } = (body ?? {}) as { username?: unknown; password?: unknown };
  if (!nonEmptyString(username) || !nonEmptyString(password)) {
    return err("Username and password are required.", 400);
  }

  const user = await login(username, password);
  if (!user) {
    return err("Invalid username or password.", 401);
  }

  return ok({ username: user.username, role: user.role });
}