import { NextResponse } from "next/server";
import { historyQuerySchema } from "../../../lib/validation/schema";
import { listAnalyses } from "../../../db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = historyQuerySchema.safeParse({
    limit: searchParams.get("limit") ?? undefined
  });
  const limit = parsed.success && parsed.data.limit ? Number(parsed.data.limit) : 20;
  const data = listAnalyses(limit);
  return NextResponse.json({ data });
}
