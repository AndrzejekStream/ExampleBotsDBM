import { describe, expect, it } from "vitest";
import { resampleCandles } from "../lib/resample/timeframe";
import type { Candle } from "../lib/types";

const candles: Candle[] = [
  { time: 0, open: 10, high: 11, low: 9, close: 10.5, volume: 1 },
  { time: 60, open: 10.5, high: 12, low: 10, close: 11.5, volume: 2 },
  { time: 120, open: 11.5, high: 13, low: 11, close: 12.5, volume: 3 },
  { time: 180, open: 12.5, high: 14, low: 12, close: 13.5, volume: 4 },
  { time: 240, open: 13.5, high: 15, low: 13, close: 14.5, volume: 5 }
];

describe("resample", () => {
  it("aggregates candles to 5m", () => {
    const result = resampleCandles(candles, "5m");
    expect(result.length).toBe(1);
    expect(result[0].open).toBe(10);
    expect(result[0].close).toBe(14.5);
    expect(result[0].volume).toBe(15);
  });
});
