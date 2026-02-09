import type { AnalysisResult } from "../lib/types";

export default function DebugPanel({ analysis }: { analysis: AnalysisResult | null }) {
  if (!analysis) {
    return (
      <div className="rounded-xl border border-slate-800 bg-panel p-4 text-sm text-slate-400">
        No debug data yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-panel p-4">
      <h3 className="text-sm font-semibold">Debug</h3>
      <div className="mt-3 grid gap-4 text-xs text-slate-300">
        <div>
          <p className="font-semibold text-slate-200">Indicator Values</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(analysis.indicators.latest).map(([key, value]) => (
              <span key={key}>{key}: {Number(value).toFixed(2)}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-200">Reasons</p>
          <ul className="list-disc pl-4">
            {analysis.signal.reasons.map((reason) => (
              <li key={reason} className="text-emerald-300">PASS - {reason}</li>
            ))}
            {analysis.signal.blocks.map((block) => (
              <li key={block} className="text-rose-300">FAIL - {block}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-200">Top Block Reasons</p>
          <ul className="list-disc pl-4">
            {analysis.signal.top_block_reasons.map((item) => (
              <li key={item.reason}>{item.reason} ({item.percentage}%)</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
