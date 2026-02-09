import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "db", "chart-analyzer.sqlite");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    symbol TEXT,
    timeframe TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    result_json TEXT NOT NULL,
    summary_text TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS signals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL,
    time INTEGER NOT NULL,
    signal_type TEXT NOT NULL,
    score REAL NOT NULL,
    reasons_json TEXT NOT NULL,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
  );
`);

export function insertAnalysis(params: {
  symbol?: string;
  timeframe: string;
  payloadHash: string;
  resultJson: string;
  summaryText: string;
}) {
  const stmt = db.prepare(
    `INSERT INTO analyses (created_at, symbol, timeframe, payload_hash, result_json, summary_text)
     VALUES (@created_at, @symbol, @timeframe, @payload_hash, @result_json, @summary_text)`
  );
  const info = stmt.run({
    created_at: new Date().toISOString(),
    symbol: params.symbol ?? null,
    timeframe: params.timeframe,
    payload_hash: params.payloadHash,
    result_json: params.resultJson,
    summary_text: params.summaryText
  });
  return info.lastInsertRowid as number;
}

export function insertSignal(params: {
  analysisId: number;
  time: number;
  signalType: string;
  score: number;
  reasonsJson: string;
}) {
  const stmt = db.prepare(
    `INSERT INTO signals (analysis_id, time, signal_type, score, reasons_json)
     VALUES (@analysis_id, @time, @signal_type, @score, @reasons_json)`
  );
  stmt.run({
    analysis_id: params.analysisId,
    time: params.time,
    signal_type: params.signalType,
    score: params.score,
    reasons_json: params.reasonsJson
  });
}

export function listAnalyses(limit = 20) {
  return db.prepare(`SELECT id, created_at, symbol, timeframe, summary_text FROM analyses ORDER BY id DESC LIMIT ?`).all(limit);
}

export function getAnalysis(id: number) {
  return db.prepare(`SELECT * FROM analyses WHERE id = ?`).get(id);
}

export function deleteAnalysis(id: number) {
  db.prepare(`DELETE FROM signals WHERE analysis_id = ?`).run(id);
  db.prepare(`DELETE FROM analyses WHERE id = ?`).run(id);
}
