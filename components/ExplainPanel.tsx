import type { AnalysisResult } from "../lib/types";

export default function ExplainPanel({ analysis }: { analysis: AnalysisResult | null }) {
  if (!analysis) {
    return (
      <div className="rounded-xl border border-slate-800 bg-panel p-4 text-sm text-slate-400">
        Run an analysis to see the explainability panel.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-panel p-4">
      <h3 className="text-sm font-semibold">Explain</h3>
      <div className="mt-3 grid gap-3 text-xs text-slate-300">
        <div>
          <p className="font-semibold text-slate-200">Market Regime</p>
          <p>Trend: {analysis.market_regime.trend}</p>
          <p>Strength: {analysis.market_regime.strength}</p>
          <p>Volatility: {analysis.market_regime.volatility_state}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-200">Structure</p>
          <p>Trend Bias: {analysis.structure.trend_bias}</p>
          <p>Last Swing High: {analysis.structure.last_swing_high?.price ?? "n/a"}</p>
          <p>Last Swing Low: {analysis.structure.last_swing_low?.price ?? "n/a"}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-200">Latest Signal</p>
          <p>Signal: {analysis.signal.latest_signal}</p>
          <p>Score: {analysis.signal.score}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-200">Patterns</p>
          <ul className="list-disc pl-4">
            {analysis.patterns.slice(-4).map((pattern) => (
              <li key={`${pattern.pattern}-${pattern.index}`}>{pattern.pattern}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
