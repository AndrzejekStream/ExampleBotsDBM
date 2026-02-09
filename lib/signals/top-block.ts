export function aggregateTopBlocks(blockHistory: Record<string, number>[]) {
  const totals: Record<string, number> = {};
  let totalBlocks = 0;
  for (const snapshot of blockHistory) {
    for (const [reason, count] of Object.entries(snapshot)) {
      totals[reason] = (totals[reason] ?? 0) + count;
      totalBlocks += count;
    }
  }
  const top = Object.entries(totals)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: totalBlocks === 0 ? 0 : Math.round((count / totalBlocks) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return { top, matrix: totals };
}
