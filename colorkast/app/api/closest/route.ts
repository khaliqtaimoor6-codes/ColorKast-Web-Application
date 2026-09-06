import { err, ok } from "@/lib/api";
import { closestColors } from "@/lib/paints";

const MIN_RESULTS = 1;
const MAX_RESULTS = 50;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const r = Number(url.searchParams.get("r"));
  const g = Number(url.searchParams.get("g"));
  const b = Number(url.searchParams.get("b"));
  const rawCount = url.searchParams.get("count");
  const count = Number(rawCount);
  const collection = url.searchParams.get("collection") ?? "ALL";

  // Boundary contract (design decision, documented): 1..50 results.
  if (!Number.isInteger(r) || r < 0 || r > 255) {
    return err("Red channel must be an integer 0–255.", 400);
  }
  if (!Number.isInteger(g) || g < 0 || g > 255) {
    return err("Green channel must be an integer 0–255.", 400);
  }
  if (!Number.isInteger(b) || b < 0 || b > 255) {
    return err("Blue channel must be an integer 0–255.", 400);
  }
  if (!Number.isInteger(count) || count < MIN_RESULTS || count > MAX_RESULTS) {
    return err(`Result count must be an integer between ${MIN_RESULTS} and ${MAX_RESULTS}.`, 400);
  }

  const results = closestColors({ r, g, b, count, collection });
  return ok({ results });
}