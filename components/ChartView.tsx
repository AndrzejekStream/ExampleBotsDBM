"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CrosshairMode,
  type CandlestickData,
  type HistogramData,
  type LineData
} from "lightweight-charts";
import type { Candle, IndicatorSet } from "../lib/types";

const toCandle = (candle: Candle): CandlestickData => ({
  time: candle.time,
  open: candle.open,
  high: candle.high,
  low: candle.low,
  close: candle.close
});

export type ChartProps = {
  candles: Candle[];
  indicators: IndicatorSet | null;
  showEma20: boolean;
  showEma50: boolean;
  showEma200: boolean;
  showVolume: boolean;
};

export default function ChartView({
  candles,
  indicators,
  showEma20,
  showEma50,
  showEma200,
  showVolume
}: ChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const chart = createChart(containerRef.current, {
      height: 420,
      layout: {
        background: { color: "#0b1220" },
        textColor: "#e2e8f0"
      },
      rightPriceScale: {
        borderColor: "#1f2937"
      },
      timeScale: {
        borderColor: "#1f2937"
      },
      grid: {
        horzLines: { color: "#111827" },
        vertLines: { color: "#111827" }
      },
      crosshair: { mode: CrosshairMode.Normal }
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444"
    });
    candleSeries.setData(candles.map(toCandle));

    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: "#38bdf8",
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        scaleMargins: { top: 0.8, bottom: 0 }
      });
      const volumeData: HistogramData[] = candles.map((c) => ({
        time: c.time,
        value: c.volume,
        color: c.close >= c.open ? "#22c55e" : "#ef4444"
      }));
      volumeSeries.setData(volumeData);
    }

    const addLine = (data: number[], color: string): void => {
      const line = chart.addLineSeries({ color, lineWidth: 2 });
      const lineData: LineData[] = data.map((value, index) => ({
        time: candles[index].time,
        value
      }));
      line.setData(lineData);
    };

    if (indicators) {
      if (showEma20) addLine(indicators.ema20, "#38bdf8");
      if (showEma50) addLine(indicators.ema50, "#a855f7");
      if (showEma200) addLine(indicators.ema200, "#facc15");
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [candles, indicators, showEma20, showEma50, showEma200, showVolume]);

  return <div ref={containerRef} className="h-[420px] w-full rounded-xl border border-slate-800" />;
}
