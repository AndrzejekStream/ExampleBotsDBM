import type { Candle } from "../types";

export type Pivot = { index: number; type: "high" | "low"; price: number };

export function detectPivots(candles: Candle[], lookback = 3): Pivot[] {
  const pivots: Pivot[] = [];
  for (let i = lookback; i < candles.length - lookback; i += 1) {
    const slice = candles.slice(i - lookback, i + lookback + 1);
    const current = candles[i];
    const isHigh = slice.every((c) => current.high >= c.high);
    const isLow = slice.every((c) => current.low <= c.low);
    if (isHigh) {
      pivots.push({ index: i, type: "high", price: current.high });
    }
    if (isLow) {
      pivots.push({ index: i, type: "low", price: current.low });
    }
  }
  return pivots;
}
