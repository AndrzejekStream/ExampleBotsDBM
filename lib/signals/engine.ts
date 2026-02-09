import type { Candle, StrategyConfig } from "../types";
import { ema } from "../indicators/ema";
import { rsi } from "../indicators/rsi";
import { atr } from "../indicators/atr";
import { adx } from "../indicators/adx";
import { macd } from "../indicators/macd";
import { detectPivots } from "../structure/pivots";
import { classifySwings } from "../structure/swings";
import { clusterLevels } from "../levels/clustering";
import { evaluateSignal } from "./blocks";
import { aggregateTopBlocks } from "./top-block";
import type { AnalysisResult, IndicatorSet } from "../types";

function calculateMarketRegime(candles: Candle[], indicators: IndicatorSet) {
  const latest = candles.length - 1;
  const ema20 = indicators.ema20[latest];
  const ema50 = indicators.ema50[latest];
  const ema200 = indicators.ema200[latest];
  const trend = ema20 > ema50 && ema50 > ema200 ? "bullish" : ema20 < ema50 && ema50 < ema200 ? "bearish" : "range";
  const strength = Math.min(100, Math.abs(ema20 - ema200) / ema200 * 100);
  const atrValue = indicators.atr14[latest];
  const volatility_state = atrValue > indicators.atr14.slice(-20).reduce((s, v) => s + v, 0) / 20 * 1.2
    ? "high"
    : atrValue < indicators.atr14.slice(-20).reduce((s, v) => s + v, 0) / 20 * 0.8
    ? "low"
    : "normal";
  const spreadProxy = candles.slice(-20).map((c) => c.high - c.low).reduce((s, v) => s + v, 0) / 20;
  const liquidity_quality = spreadProxy > atrValue * 1.5 ? "poor" : "ok";
  return { trend, strength: Math.round(strength), volatility_state, liquidity_quality };
}

function detectConsolidation(candles: Candle[], indicators: IndicatorSet) {
  const lookback = 20;
  const recent = candles.slice(-lookback);
  const high = Math.max(...recent.map((c) => c.high));
  const low = Math.min(...recent.map((c) => c.low));
  const atrValue = indicators.atr14[indicators.atr14.length - 1];
  const range = high - low;
  const in_consolidation = range <= atrValue * 3;
  const breakout = candles[candles.length - 1].close > high || candles[candles.length - 1].close < low;
  const false_breakout = breakout && candles.slice(-5).some((c) => c.close > low && c.close < high);
  return {
    in_consolidation,
    upper: high,
    lower: low,
    breakout,
    false_breakout
  };
}

function detectPatterns(candles: Candle[]) {
  const patterns: { pattern: string; index: number; time: number; confidence: number }[] = [];
  const start = Math.max(1, candles.length - 15);
  for (let i = start; i < candles.length; i += 1) {
    const current = candles[i];
    const prev = candles[i - 1];
    const body = Math.abs(current.close - current.open);
    const range = current.high - current.low;
    const upperWick = current.high - Math.max(current.open, current.close);
    const lowerWick = Math.min(current.open, current.close) - current.low;

    if (range > 0 && body / range < 0.2) {
      patterns.push({ pattern: "Doji", index: i, time: current.time, confidence: 0.6 });
    }
    if (lowerWick > body * 2 && upperWick < body) {
      patterns.push({ pattern: "Pin Bar", index: i, time: current.time, confidence: 0.7 });
    }
    if (prev && current.close > prev.open && current.open < prev.close && current.close > current.open) {
      patterns.push({ pattern: "Bullish Engulfing", index: i, time: current.time, confidence: 0.75 });
    }
    if (prev && current.close < prev.open && current.open > prev.close && current.close < current.open) {
      patterns.push({ pattern: "Bearish Engulfing", index: i, time: current.time, confidence: 0.75 });
    }
    if (prev && current.high < prev.high && current.low > prev.low) {
      patterns.push({ pattern: "Inside Bar", index: i, time: current.time, confidence: 0.55 });
    }
  }
  return patterns;
}

export function analyzeCandles(candles: Candle[], config: StrategyConfig): AnalysisResult {
  const closes = candles.map((c) => c.close);
  const indicators: IndicatorSet = {
    ema20: ema(closes, 20),
    ema50: ema(closes, 50),
    ema200: ema(closes, 200),
    rsi14: rsi(closes, 14),
    atr14: atr(candles, 14),
    adx14: adx(candles, 14),
    macd: macd(closes)
  };

  const pivots = detectPivots(candles, config.pivot_lookback);
  const structure = classifySwings(pivots);
  const levels = clusterLevels(pivots, Math.max(0.5, candles[candles.length - 1].close * 0.002));
  const consolidation = detectConsolidation(candles, indicators);
  const patterns = detectPatterns(candles);
  const market_regime = calculateMarketRegime(candles, indicators);

  const blockHistory: Record<string, number>[] = [];
  const start = Math.max(20, candles.length - config.lookback);
  for (let i = start; i < candles.length; i += 1) {
    const decision = evaluateSignal({
      candles,
      indicators,
      config,
      latestIndex: i,
      trendBias: structure.trendBias,
      marketTrend: market_regime.trend,
      consolidation
    });
    blockHistory.push(decision.blockMatrix);
  }

  const latestDecision = evaluateSignal({
    candles,
    indicators,
    config,
    latestIndex: candles.length - 1,
    trendBias: structure.trendBias,
    marketTrend: market_regime.trend,
    consolidation
  });

  const { top, matrix } = aggregateTopBlocks(blockHistory);

  const latest = candles[candles.length - 1];
  const proposed_entry = latest.close;
  const atrValue = indicators.atr14[indicators.atr14.length - 1] || 0;
  const proposed_sl = latestDecision.latest_signal === "long"
    ? latest.close - atrValue * config.atr_multiplier
    : latestDecision.latest_signal === "short"
    ? latest.close + atrValue * config.atr_multiplier
    : null;
  const proposed_tp = proposed_sl
    ? [1.5, 2, 3].map((rr) => latestDecision.latest_signal === "long"
      ? latest.close + (latest.close - proposed_sl) * rr
      : latest.close - (proposed_sl - latest.close) * rr)
    : [];
  const rr_estimate = proposed_sl
    ? Math.abs((proposed_tp[1] - latest.close) / (latest.close - proposed_sl))
    : null;

  return {
    market_regime,
    indicators: {
      ...indicators,
      latest: {
        ema20: indicators.ema20[indicators.ema20.length - 1],
        ema50: indicators.ema50[indicators.ema50.length - 1],
        ema200: indicators.ema200[indicators.ema200.length - 1],
        rsi14: indicators.rsi14[indicators.rsi14.length - 1],
        atr14: indicators.atr14[indicators.atr14.length - 1],
        adx14: indicators.adx14[indicators.adx14.length - 1],
        macd: indicators.macd.macd[indicators.macd.macd.length - 1]
      }
    },
    structure: {
      swings: structure.swings,
      last_swing_high: structure.lastHigh,
      last_swing_low: structure.lastLow,
      trend_bias: structure.trendBias
    },
    levels,
    consolidation,
    patterns,
    signal: {
      mode: config.mode,
      latest_signal: latestDecision.latest_signal,
      score: latestDecision.score,
      reasons: latestDecision.reasons,
      blocks: latestDecision.blocks,
      top_block_reasons: top,
      block_matrix: matrix
    },
    risk_plan: {
      proposed_entry,
      proposed_sl,
      proposed_tp,
      rr_estimate,
      risk_notes: [
        indicators.atr14[indicators.atr14.length - 1] > indicators.atr14.slice(-20).reduce((s, v) => s + v, 0) / 20
          ? "High volatility: widen stops."
          : "Volatility normal."
      ]
    }
  };
}
