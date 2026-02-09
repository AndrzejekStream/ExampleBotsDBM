import type { Pivot } from "./pivots";

export function classifySwings(pivots: Pivot[]) {
  const swings = [...pivots].sort((a, b) => a.index - b.index);
  const lastHigh = swings.filter((s) => s.type === "high").slice(-1)[0];
  const lastLow = swings.filter((s) => s.type === "low").slice(-1)[0];

  const trendBias = (() => {
    if (!lastHigh || !lastLow) return "neutral";
    const highs = swings.filter((s) => s.type === "high");
    const lows = swings.filter((s) => s.type === "low");
    if (highs.length < 2 || lows.length < 2) return "neutral";
    const prevHigh = highs[highs.length - 2];
    const prevLow = lows[lows.length - 2];
    if (lastHigh.price > prevHigh.price && lastLow.price > prevLow.price) return "up";
    if (lastHigh.price < prevHigh.price && lastLow.price < prevLow.price) return "down";
    return "neutral";
  })();

  return {
    swings,
    lastHigh: lastHigh ? { index: lastHigh.index, price: lastHigh.price } : null,
    lastLow: lastLow ? { index: lastLow.index, price: lastLow.price } : null,
    trendBias
  };
}
