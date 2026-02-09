import type { Candle, Timeframe } from "../types";

const secondsMap: Record<Timeframe, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1D": 86400
};

export function resampleCandles(candles: Candle[], timeframe: Timeframe): Candle[] {
  const bucketSize = secondsMap[timeframe];
  if (!bucketSize) return candles;
  const result: Candle[] = [];
  let bucket: Candle | null = null;
  for (const candle of candles) {
    const bucketTime = Math.floor(candle.time / bucketSize) * bucketSize;
    if (!bucket || bucket.time !== bucketTime) {
      if (bucket) result.push(bucket);
      bucket = {
        time: bucketTime,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      };
    } else {
      bucket.high = Math.max(bucket.high, candle.high);
      bucket.low = Math.min(bucket.low, candle.low);
      bucket.close = candle.close;
      bucket.volume += candle.volume;
    }
  }
  if (bucket) result.push(bucket);
  return result;
}
