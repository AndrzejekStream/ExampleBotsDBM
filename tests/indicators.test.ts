import { describe, expect, it } from "vitest";
import { ema } from "../lib/indicators/ema";
import { rsi } from "../lib/indicators/rsi";
import { atr } from "../lib/indicators/atr";
import type { Candle } from "../lib/types";

const sampleCandles: Candle[] = [
  { time: 1, open: 10, high: 12, low: 9, close: 11, volume: 100 },
  { time: 2, open: 11, high: 13, low: 10, close: 12, volume: 120 },
  { time: 3, open: 12, high: 14, low: 11, close: 13, volume: 130 },
  { time: 4, open: 13, high: 15, low: 12, close: 14, volume: 140 },
  { time: 5, open: 14, high: 16, low: 13, close: 15, volume: 150 },
  { time: 6, open: 15, high: 17, low: 14, close: 16, volume: 160 },
  { time: 7, open: 16, high: 18, low: 15, close: 17, volume: 170 },
  { time: 8, open: 17, high: 19, low: 16, close: 18, volume: 180 },
  { time: 9, open: 18, high: 20, low: 17, close: 19, volume: 190 },
  { time: 10, open: 19, high: 21, low: 18, close: 20, volume: 200 },
  { time: 11, open: 20, high: 22, low: 19, close: 21, volume: 210 },
  { time: 12, open: 21, high: 23, low: 20, close: 22, volume: 220 },
  { time: 13, open: 22, high: 24, low: 21, close: 23, volume: 230 },
  { time: 14, open: 23, high: 25, low: 22, close: 24, volume: 240 },
  { time: 15, open: 24, high: 26, low: 23, close: 25, volume: 250 }
];

describe("indicators", () => {
  it("calculates EMA", () => {
    const values = sampleCandles.map((c) => c.close);
    const result = ema(values, 5);
    expect(result.length).toBe(values.length);
    expect(result[0]).toBe(values[0]);
  });

  it("calculates RSI", () => {
    const values = sampleCandles.map((c) => c.close);
    const result = rsi(values, 14);
    expect(result.length).toBe(values.length);
    expect(result[14]).toBeGreaterThan(50);
  });

  it("calculates ATR", () => {
    const result = atr(sampleCandles, 14);
    expect(result.length).toBe(sampleCandles.length);
    expect(result[13]).toBeGreaterThan(0);
  });
});
