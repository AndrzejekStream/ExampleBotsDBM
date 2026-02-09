import { NextResponse } from "next/server";
import { fetchBinanceKlines } from "../../../lib/data/binance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") ?? "BTCUSDT";
  const timeframe = (searchParams.get("timeframe") ?? "1h") as "1m" | "5m" | "15m" | "1h" | "4h" | "1D";
  const limit = Number(searchParams.get("limit") ?? "300");
  try {
    const data = await fetchBinanceKlines(symbol, timeframe, limit);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
