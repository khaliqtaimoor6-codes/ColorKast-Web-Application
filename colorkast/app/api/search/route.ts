import { err, ok } from "@/lib/api";
import { measure, searchPaints, type SearchType } from "@/lib/paints";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const value = url.searchParams.get("value") ?? "";
  const collection = url.searchParams.get("collection") ?? "ALL";

  if (type !== "name" && type !== "number" && type !== "rgb") {
    return err("Search type must be one of: name, number, rgb.", 400);
  }

  // NFR1 — expose server-side search processing time.
  const { result, processingMs } = measure(() =>
    searchPaints({ type: type as SearchType, value, collection }),
  );

  if (!result.ok) {
    return err(result.error ?? "Search failed.", 400);
  }

  return ok({ results: result.results, count: result.count, processingMs });
}