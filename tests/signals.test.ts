import { describe, expect, it } from "vitest";
import { analyzeCandles } from "../lib/signals/engine";
import type { Candle } from "../lib/types";
import { defaultConfig } from "../lib/types";

const candles: Candle[] = Array.from({ length: 80 }).map((_, index) => {
  const base = 100 + index * 0.5;
  return {
    time: index * 60,
    open: base,
    high: base + 1,
    low: base - 1,
    close: base + 0.4,
    volume: 100 + index
  };
});

describe("signal engine", () => {
  it("returns deterministic score and signal", () => {
    const analysis = analyzeCandles(candles, defaultConfig);
    expect(analysis.signal.score).toBeGreaterThan(0);
    expect(["none", "long", "short", "exit"]).toContain(analysis.signal.latest_signal);
  });
});
