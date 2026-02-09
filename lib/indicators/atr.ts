import type { Candle } from "../types";

export function atr(candles: Candle[], period = 14): number[] {
  if (candles.length === 0) return [];
  const trueRanges: number[] = [];
  for (let i = 0; i < candles.length; i += 1) {
    const current = candles[i];
    const prev = candles[i - 1];
    const highLow = current.high - current.low;
    const highClose = prev ? Math.abs(current.high - prev.close) : 0;
    const lowClose = prev ? Math.abs(current.low - prev.close) : 0;
    trueRanges.push(Math.max(highLow, highClose, lowClose));
  }
  const result: number[] = Array(candles.length).fill(0);
  let sum = 0;
  for (let i = 0; i < trueRanges.length; i += 1) {
    sum += trueRanges[i];
    if (i === period - 1) {
      result[i] = sum / period;
    } else if (i >= period) {
      result[i] = (result[i - 1] * (period - 1) + trueRanges[i]) / period;
    }
  }
  return result;
}
