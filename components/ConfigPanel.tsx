"use client";

import type { StrategyConfig } from "../lib/types";

export default function ConfigPanel({
  config,
  onChange
}: {
  config: StrategyConfig;
  onChange: (next: StrategyConfig) => void;
}) {
  const update = (field: keyof StrategyConfig, value: string) => {
    onChange({
      ...config,
      [field]: field === "mode" ? value : Number(value)
    } as StrategyConfig);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-panel p-4">
      <h3 className="text-sm font-semibold text-slate-100">Config</h3>
      <div className="mt-4 grid gap-3 text-xs text-slate-300">
        <label className="flex flex-col gap-1">
          Mode
          <select
            value={config.mode}
            onChange={(event) => update("mode", event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 p-2"
          >
            <option value="Aggressive">Aggressive</option>
            <option value="Conservative">Conservative</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            RSI Overbought
            <input
              type="number"
              value={config.rsi_overbought}
              onChange={(event) => update("rsi_overbought", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            RSI Oversold
            <input
              type="number"
              value={config.rsi_oversold}
              onChange={(event) => update("rsi_oversold", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Min Score
            <input
              type="number"
              value={config.min_score}
              onChange={(event) => update("min_score", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            ATR Multiplier
            <input
              type="number"
              step="0.1"
              value={config.atr_multiplier}
              onChange={(event) => update("atr_multiplier", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Lookback
            <input
              type="number"
              value={config.lookback}
              onChange={(event) => update("lookback", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Volume Spike
            <input
              type="number"
              step="0.1"
              value={config.volume_spike}
              onChange={(event) => update("volume_spike", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Breakout Confirm
            <input
              type="number"
              step="0.1"
              value={config.breakout_confirm}
              onChange={(event) => update("breakout_confirm", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            Pivot Lookback
            <input
              type="number"
              value={config.pivot_lookback}
              onChange={(event) => update("pivot_lookback", event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 p-2"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
