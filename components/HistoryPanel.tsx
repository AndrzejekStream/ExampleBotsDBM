"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  id: number;
  created_at: string;
  symbol?: string;
  timeframe: string;
  summary_text: string;
};

export default function HistoryPanel({ onLoad }: { onLoad: (id: number) => void }) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => setItems(data.data ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="rounded-xl border border-slate-800 bg-panel p-4">
      <h3 className="text-sm font-semibold">Historia</h3>
      <ul className="mt-3 grid gap-2 text-xs text-slate-300">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-800 p-2">
            <div>
              <p className="text-slate-100">{item.symbol ?? "CSV"} • {item.timeframe}</p>
              <p className="text-slate-400">{item.summary_text}</p>
            </div>
            <button
              className="rounded-md border border-slate-600 px-2 py-1 text-xs"
              onClick={() => onLoad(item.id)}
            >
              Load
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
