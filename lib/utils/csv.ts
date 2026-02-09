import type { Candle } from "../types";

export function parseCSV(text: string): Candle[] {
  const rows = text.trim().split(/\r?\n/);
  const header = rows.shift();
  if (!header) return [];
  const columns = header.split(",").map((h) => h.trim().toLowerCase());
  const required = ["time", "open", "high", "low", "close", "volume"];
  for (const col of required) {
    if (!columns.includes(col)) {
      throw new Error(`Missing column: ${col}`);
    }
  }
  const index = Object.fromEntries(columns.map((col, i) => [col, i]));

  return rows
    .map((row) => row.split(","))
    .filter((row) => row.length >= columns.length)
    .map((row) => {
      const rawTime = row[index.time];
      const time = parseTime(rawTime);
      return {
        time,
        open: Number(row[index.open]),
        high: Number(row[index.high]),
        low: Number(row[index.low]),
        close: Number(row[index.close]),
        volume: Number(row[index.volume])
      } satisfies Candle;
    })
    .sort((a, b) => a.time - b.time);
}

export function parseTime(value: string): number {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    return num > 1_000_000_000_000 ? Math.floor(num / 1000) : num > 10_000_000_000 ? Math.floor(num / 1000) : num;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid time: ${value}`);
  }
  return Math.floor(date.getTime() / 1000);
}
