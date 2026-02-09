import type { Candle, StrategyConfig } from "../types";
import type { IndicatorSet } from "../types";

export type SignalContext = {
  candles: Candle[];
  indicators: IndicatorSet;
  config: StrategyConfig;
  latestIndex: number;
  trendBias: "up" | "down" | "neutral";
  marketTrend: "bullish" | "bearish" | "range";
  consolidation: { in_consolidation: boolean };
};

export type SignalDecision = {
  score: number;
  latest_signal: "none" | "long" | "short" | "exit";
  reasons: string[];
  blocks: string[];
  blockMatrix: Record<string, number>;
};

export function evaluateSignal(ctx: SignalContext): SignalDecision {
  const { candles, indicators, config, latestIndex, trendBias, marketTrend, consolidation } = ctx;
  const reasons: string[] = [];
  const blocks: string[] = [];
  const blockMatrix: Record<string, number> = {};

  const price = candles[latestIndex].close;
  const ema20 = indicators.ema20[latestIndex];
  const ema50 = indicators.ema50[latestIndex];
  const ema200 = indicators.ema200[latestIndex];
  const rsi = indicators.rsi14[latestIndex];
  const atr = indicators.atr14[latestIndex];
  const adx = indicators.adx14[latestIndex];
  const macdHist = indicators.macd.histogram[latestIndex];

  const bullishTrend = ema20 > ema50 && ema50 > ema200 && marketTrend === "bullish";
  const bearishTrend = ema20 < ema50 && ema50 < ema200 && marketTrend === "bearish";
  const momentumUp = rsi > 50 && macdHist > 0;
  const momentumDown = rsi < 50 && macdHist < 0;

  const volume = candles[latestIndex].volume;
  const avgVolume = candles.slice(-20).reduce((sum, c) => sum + c.volume, 0) / Math.min(20, candles.length);
  const volumeSpike = volume >= avgVolume * config.volume_spike;

  let score = 0;

  if (bullishTrend) {
    score += 25;
    reasons.push("EMA stack bullish");
  } else {
    blocks.push("EMA stack not bullish");
  }

  if (bearishTrend) {
    score += 25;
    reasons.push("EMA stack bearish");
  } else {
    blocks.push("EMA stack not bearish");
  }

  if (momentumUp) {
    score += 15;
    reasons.push("Momentum up (RSI/MACD)");
  } else {
    blocks.push("Momentum not up");
  }

  if (momentumDown) {
    score += 15;
    reasons.push("Momentum down (RSI/MACD)");
  } else {
    blocks.push("Momentum not down");
  }

  if (adx >= 20) {
    score += 10;
    reasons.push("ADX confirms trend");
  } else {
    blocks.push("ADX too low");
  }

  if (volumeSpike) {
    score += 10;
    reasons.push("Volume confirmation");
  } else {
    blocks.push("No volume confirmation");
  }

  if (!consolidation.in_consolidation) {
    score += 10;
    reasons.push("Not in consolidation");
  } else {
    blocks.push("Market in consolidation");
  }

  if (rsi > config.rsi_overbought) {
    blocks.push("RSI overbought");
  }

  if (rsi < config.rsi_oversold) {
    blocks.push("RSI oversold");
  }

  if (atr === 0) {
    blocks.push("ATR unavailable");
  }

  for (const block of blocks) {
    blockMatrix[block] = (blockMatrix[block] ?? 0) + 1;
  }

  const longBias = bullishTrend && momentumUp && trendBias === "up";
  const shortBias = bearishTrend && momentumDown && trendBias === "down";
  let latest_signal: SignalDecision["latest_signal"] = "none";

  if (score >= config.min_score && longBias) {
    latest_signal = "long";
  } else if (score >= config.min_score && shortBias) {
    latest_signal = "short";
  } else if (score < config.min_score / 2) {
    latest_signal = "exit";
  }

  return { score, latest_signal, reasons, blocks, blockMatrix };
}
