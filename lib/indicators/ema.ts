export function ema(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = values[0];
  result.push(prev);
  for (let i = 1; i < values.length; i += 1) {
    const current = values[i];
    const next = current * k + prev * (1 - k);
    result.push(next);
    prev = next;
  }
  return result;
}
