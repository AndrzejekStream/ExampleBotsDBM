import { ema } from "./ema";

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const fastEma = ema(values, fast);
  const slowEma = ema(values, slow);
  const macdLine = values.map((_, i) => fastEma[i] - slowEma[i]);
  const signalLine = ema(macdLine, signal);
  const histogram = macdLine.map((val, i) => val - signalLine[i]);
  return { macd: macdLine, signal: signalLine, histogram };
}
