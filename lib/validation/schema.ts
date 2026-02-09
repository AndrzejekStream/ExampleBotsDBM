import { z } from "zod";

export const candleSchema = z.object({
  time: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number()
});

export const analyzeSchema = z.object({
  symbol: z.string().optional(),
  timeframe: z.string(),
  candles: z.array(candleSchema).min(20),
  config: z
    .object({
      mode: z.enum(["Aggressive", "Conservative"]),
      rsi_overbought: z.number(),
      rsi_oversold: z.number(),
      min_score: z.number(),
      atr_multiplier: z.number(),
      lookback: z.number(),
      volume_spike: z.number(),
      breakout_confirm: z.number(),
      pivot_lookback: z.number()
    })
    .optional()
});

export const historyQuerySchema = z.object({
  limit: z.string().optional()
});
