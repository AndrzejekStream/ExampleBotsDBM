export function rsi(values: number[], period = 14): number[] {
  if (values.length === 0) return [];
  const result: number[] = Array(values.length).fill(50);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period && i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < values.length; i += 1) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
    result[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  }
  return result;
}
