import { describe, expect, it } from "vitest";
import { detectPivots } from "../lib/structure/pivots";
import type { Candle } from "../lib/types";

const candles: Candle[] = [
  { time: 0, open: 10, high: 11, low: 9, close: 10, volume: 1 },
  { time: 1, open: 10, high: 12, low: 9.5, close: 11, volume: 1 },
  { time: 2, open: 11, high: 13, low: 10, close: 12, volume: 1 },
  { time: 3, open: 12, high: 12.5, low: 10.5, close: 11, volume: 1 },
  { time: 4, open: 11, high: 11.5, low: 9, close: 9.5, volume: 1 },
  { time: 5, open: 9.5, high: 10, low: 8.5, close: 9, volume: 1 }
];

describe("pivots", () => {
  it("detects pivot highs and lows", () => {
    const pivots = detectPivots(candles, 1);
    expect(pivots.some((p) => p.type === "high")).toBe(true);
    expect(pivots.some((p) => p.type === "low")).toBe(true);
  });
});
