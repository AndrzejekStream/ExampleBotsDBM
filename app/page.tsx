"use client";

import { useEffect, useMemo, useState } from "react";
import ChartView from "../components/ChartView";
import UploadPanel from "../components/UploadPanel";
import ConfigPanel from "../components/ConfigPanel";
import ExplainPanel from "../components/ExplainPanel";
import DebugPanel from "../components/DebugPanel";
import HistoryPanel from "../components/HistoryPanel";
import { parseCSV } from "../lib/utils/csv";
import type { AnalysisResult, Candle, StrategyConfig, Timeframe } from "../lib/types";
import { defaultConfig } from "../lib/types";
import { resampleCandles } from "../lib/resample/timeframe";

const timeframes: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1D"];

export default function HomePage() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("1h");
  const [config, setConfig] = useState<StrategyConfig>(defaultConfig);
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(true);
  const [showEma200, setShowEma200] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("chart-analyzer-config");
    if (saved) {
      setConfig({ ...defaultConfig, ...JSON.parse(saved) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("chart-analyzer-config", JSON.stringify(config));
  }, [config]);

  const resampled = useMemo(() => {
    return resampleCandles(candles, timeframe);
  }, [candles, timeframe]);

  const runAnalysis = async (inputCandles: Candle[]) => {
    setError(null);
    if (inputCandles.length === 0) {
      setError("No candles loaded.");
      return;
    }
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeframe,
        candles: inputCandles,
        config
      })
    });
    if (!response.ok) {
      setError("Analyze failed.");
      return;
    }
    const data = await response.json();
    setAnalysis(data.result);
  };

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setCandles(parsed);
      await runAnalysis(parsed);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleFetchBinance = async () => {
    setError(null);
    const response = await fetch(`/api/binance?symbol=BTCUSDT&timeframe=${timeframe}&limit=500`);
    if (!response.ok) {
      setError("Binance fetch failed.");
      return;
    }
    const data = await response.json();
    setCandles(data.data);
    await runAnalysis(data.data);
  };

  const handleLoadHistory = async (id: number) => {
    const response = await fetch(`/api/history/${id}`);
    const data = await response.json();
    if (data?.data?.result_json) {
      setAnalysis(JSON.parse(data.data.result_json));
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Chart Analyzer</h1>
        <p className="text-sm text-slate-400">
          Upload CSV or pull from Binance. Run analysis, inspect indicators, and track signal blocks.
        </p>
      </header>

      {error ? (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <UploadPanel onUpload={handleUpload} />
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800 bg-panel p-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-300">Timeframe</span>
              <select
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value as Timeframe)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              >
                {timeframes.map((frame) => (
                  <option key={frame} value={frame}>{frame}</option>
                ))}
              </select>
            </div>
            <button
              className="rounded-md border border-slate-600 px-2 py-1"
              onClick={() => runAnalysis(candles)}
            >
              Analyze
            </button>
            <button
              className="rounded-md border border-slate-600 px-2 py-1"
              onClick={handleFetchBinance}
            >
              Fetch Binance
            </button>
            <a
              href="/examples/sample.csv"
              className="text-accent"
            >
              Download sample CSV
            </a>
          </div>
          <div className="flex flex-wrap gap-4 text-xs">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showEma20} onChange={() => setShowEma20(!showEma20)} /> EMA20
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showEma50} onChange={() => setShowEma50(!showEma50)} /> EMA50
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showEma200} onChange={() => setShowEma200(!showEma200)} /> EMA200
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showVolume} onChange={() => setShowVolume(!showVolume)} /> Volume
            </label>
          </div>
          <ChartView
            candles={resampled}
            indicators={analysis?.indicators ?? null}
            showEma20={showEma20}
            showEma50={showEma50}
            showEma200={showEma200}
            showVolume={showVolume}
          />
        </div>
        <div className="space-y-4">
          <ConfigPanel config={config} onChange={setConfig} />
          <ExplainPanel analysis={analysis} />
          <DebugPanel analysis={analysis} />
          <HistoryPanel onLoad={handleLoadHistory} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-panel p-4 text-xs text-slate-300">
        <h3 className="font-semibold text-slate-100">Risk & Trade Plan</h3>
        {analysis ? (
          <div className="mt-2 grid gap-2">
            <p>Entry: {analysis.risk_plan.proposed_entry ?? "n/a"}</p>
            <p>Stop Loss: {analysis.risk_plan.proposed_sl ?? "n/a"}</p>
            <p>TP: {analysis.risk_plan.proposed_tp.join(", ")}</p>
            <p>RR Estimate: {analysis.risk_plan.rr_estimate ?? "n/a"}</p>
            <ul className="list-disc pl-4">
              {analysis.risk_plan.risk_notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-slate-400">Run analysis to see plan.</p>
        )}
      </section>
    </main>
  );
}
