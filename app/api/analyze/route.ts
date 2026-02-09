import { NextResponse } from "next/server";
import { analyzeSchema } from "../../../lib/validation/schema";
import { analyzeCandles } from "../../../lib/signals/engine";
import { defaultConfig } from "../../../lib/types";
import { hashPayload } from "../../../lib/utils/hash";
import { insertAnalysis, insertSignal } from "../../../db";
import { logger } from "../../../lib/utils/logger";
import { resampleCandles } from "../../../lib/resample/timeframe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const config = { ...defaultConfig, ...parsed.data.config };
    const resampled = resampleCandles(parsed.data.candles, parsed.data.timeframe as "1m" | "5m" | "15m" | "1h" | "4h" | "1D");
    const analysis = analyzeCandles(resampled, config);
    const payloadHash = hashPayload(parsed.data);

    const summaryText = `${analysis.market_regime.trend.toUpperCase()} | Score ${analysis.signal.score} | ${analysis.signal.latest_signal}`;
    const analysisId = insertAnalysis({
      symbol: parsed.data.symbol,
      timeframe: parsed.data.timeframe,
      payloadHash,
      resultJson: JSON.stringify(analysis),
      summaryText
    });

    insertSignal({
      analysisId,
      time: resampled[resampled.length - 1].time,
      signalType: analysis.signal.latest_signal,
      score: analysis.signal.score,
      reasonsJson: JSON.stringify(analysis.signal.reasons)
    });

    return NextResponse.json({
      id: analysisId,
      result: analysis
    });
  } catch (error) {
    logger.error("Analyze endpoint error", { error: String(error) });
    return NextResponse.json({ error: "Analyze failed" }, { status: 500 });
  }
}
