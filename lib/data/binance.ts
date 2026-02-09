import type { Candle, Timeframe } from "../types";

const timeframeMap: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1D": "1d"
};

type CacheEntry = {
  expires: number;
  data: Candle[];
};

const cache = new Map<string, CacheEntry>();

export async function fetchBinanceKlines(symbol: string, timeframe: Timeframe, limit = 500): Promise<Candle[]> {
  const key = `${symbol}-${timeframe}-${limit}`;
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol.toUpperCase());
  url.searchParams.set("interval", timeframeMap[timeframe]);
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Binance error: ${response.status}`);
  }
  const data: (string | number)[][] = await response.json();
  const candles: Candle[] = data.map((row) => ({
    time: Math.floor(Number(row[0]) / 1000),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5])
  }));

  cache.set(key, { expires: Date.now() + 60_000, data: candles });
  return candles;
}
