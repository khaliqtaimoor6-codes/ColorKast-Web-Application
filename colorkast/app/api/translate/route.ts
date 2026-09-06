import { err, ok, nonEmptyString } from "@/lib/api";
import { translateNumber } from "@/lib/paints";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oldNumber = url.searchParams.get("old") ?? "";
  const source = url.searchParams.get("source") ?? "";
  const target = url.searchParams.get("target") ?? "";

  if (!nonEmptyString(oldNumber) || !nonEmptyString(source) || !nonEmptyString(target)) {
    return err("Old paint number, source collection, and target collection are required.", 400);
  }

  const result = translateNumber(oldNumber, source, target);
  if (!result) {
    return err(`Paint not found for old number "${oldNumber}" in collection "${source}".`, 404);
  }

  return ok({
    source: result.source,
    target: result.target,
    converted: result.converted,
  });
}