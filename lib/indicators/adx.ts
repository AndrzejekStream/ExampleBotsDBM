import type { Candle } from "../types";

export function adx(candles: Candle[], period = 14): number[] {
  if (candles.length === 0) return [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < candles.length; i += 1) {
    const current = candles[i];
    const prev = candles[i - 1];
    const upMove = current.high - prev.high;
    const downMove = prev.low - current.low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    ));
  }

  const smooth = (values: number[]) => {
    const out: number[] = Array(values.length).fill(0);
    let sum = 0;
    for (let i = 0; i < values.length; i += 1) {
      sum += values[i];
      if (i === period - 1) {
        out[i] = sum;
      } else if (i >= period) {
        out[i] = out[i - 1] - out[i - 1] / period + values[i];
      }
    }
    return out;
  };

  const smPlus = smooth(plusDM);
  const smMinus = smooth(minusDM);
  const smTr = smooth(tr);

  const dx: number[] = Array(candles.length).fill(0);
  for (let i = period; i < candles.length; i += 1) {
    const idx = i - 1;
    const trVal = smTr[idx];
    const plusDI = trVal === 0 ? 0 : (100 * smPlus[idx]) / trVal;
    const minusDI = trVal === 0 ? 0 : (100 * smMinus[idx]) / trVal;
    const diff = Math.abs(plusDI - minusDI);
    const sum = plusDI + minusDI;
    dx[i] = sum === 0 ? 0 : (100 * diff) / sum;
  }

  const adxValues: number[] = Array(candles.length).fill(0);
  let adxSum = 0;
  for (let i = 0; i < dx.length; i += 1) {
    adxSum += dx[i];
    if (i === period * 2 - 1) {
      adxValues[i] = adxSum / period;
    } else if (i > period * 2 - 1) {
      adxValues[i] = (adxValues[i - 1] * (period - 1) + dx[i]) / period;
    }
  }

  return adxValues;
}
