import type { Pivot } from "../structure/pivots";

export function clusterLevels(pivots: Pivot[], bucketSize = 0.002) {
  if (pivots.length === 0) return [];
  const buckets = new Map<number, { price: number; count: number }>();
  for (const pivot of pivots) {
    const key = Math.round(pivot.price / bucketSize) * bucketSize;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.price = (existing.price * (existing.count - 1) + pivot.price) / existing.count;
    } else {
      buckets.set(key, { price: pivot.price, count: 1 });
    }
  }
  return Array.from(buckets.values())
    .map((entry) => ({
      price: entry.price,
      touch_count: entry.count,
      strength: Math.min(100, entry.count * 12)
    }))
    .sort((a, b) => b.strength - a.strength);
}
