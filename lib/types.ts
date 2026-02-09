export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1D";

export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type IndicatorSet = {
  ema20: number[];
  ema50: number[];
  ema200: number[];
  rsi14: number[];
  atr14: number[];
  adx14: number[];
  macd: { macd: number[]; signal: number[]; histogram: number[] };
};

export type AnalysisResult = {
  market_regime: {
    trend: "bullish" | "bearish" | "range";
    strength: number;
    volatility_state: "low" | "normal" | "high";
    liquidity_quality: "ok" | "poor";
  };
  indicators: IndicatorSet & { latest: Record<string, number> };
  structure: {
    swings: { index: number; type: "high" | "low"; price: number }[];
    last_swing_high?: { index: number; price: number } | null;
    last_swing_low?: { index: number; price: number } | null;
    trend_bias: "up" | "down" | "neutral";
  };
  levels: { price: number; touch_count: number; strength: number }[];
  consolidation: {
    in_consolidation: boolean;
    upper: number | null;
    lower: number | null;
    breakout: boolean;
    false_breakout: boolean;
  };
  patterns: { pattern: string; index: number; time: number; confidence: number }[];
  signal: {
    mode: "Aggressive" | "Conservative";
    latest_signal: "none" | "long" | "short" | "exit";
    score: number;
    reasons: string[];
    blocks: string[];
    top_block_reasons: { reason: string; count: number; percentage: number }[];
    block_matrix: Record<string, number>;
  };
  risk_plan: {
    proposed_entry: number | null;
    proposed_sl: number | null;
    proposed_tp: number[];
    rr_estimate: number | null;
    risk_notes: string[];
  };
};

export type StrategyConfig = {
  mode: "Aggressive" | "Conservative";
  rsi_overbought: number;
  rsi_oversold: number;
  min_score: number;
  atr_multiplier: number;
  lookback: number;
  volume_spike: number;
  breakout_confirm: number;
  pivot_lookback: number;
};

export const defaultConfig: StrategyConfig = {
  mode: "Aggressive",
  rsi_overbought: 70,
  rsi_oversold: 30,
  min_score: 65,
  atr_multiplier: 1.5,
  lookback: 100,
  volume_spike: 1.3,
  breakout_confirm: 1.1,
  pivot_lookback: 3
};
