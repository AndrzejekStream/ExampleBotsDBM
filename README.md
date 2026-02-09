# Chart Analyzer

## Założenia (przyjęte na start)
- `time` w CSV akceptuje: unix ms, unix sec, lub ISO 8601 (np. `2024-01-01T00:00:00Z`).
- Wszystkie czasy są normalizowane do unix seconds.
- Domyślne parametry strategii:
  - Mode: Aggressive
  - RSI overbought/oversold: 70/30
  - Min score: 65
  - ATR multiplier: 1.5
  - Lookback (rolling): 100 świec
  - Volume spike: 1.3
  - Breakout confirm: 1.1
  - Pivot lookback: 3
- Domyślny zakres wskaźników: EMA20/50/200, RSI14, ATR14, ADX14, MACD(12/26/9).
- Resampling CSV odbywa się w backendzie (API `/api/analyze`).

## Dlaczego `better-sqlite3`
Wybrałem `better-sqlite3` ze względu na:
- synchroniczne, deterministyczne operacje (łatwe testowanie i prostota backendu),
- stabilność i brak dodatkowej warstwy ORM dla MVP,
- bardzo szybkie zapytania dla lokalnej bazy.

## Funkcje
- Upload CSV z walidacją kolumn `time, open, high, low, close, volume`.
- Wykres świec + wolumen + EMA (20/50/200).
- Wskaźniki, struktura rynku, poziomy S/R.
- Signal engine (Aggressive/Conservative) z scoringiem i blokadami.
- Top Block Reasons w rolling window (top3 + procenty + block matrix).
- Historia analiz w SQLite.
- Binance API (public) z cache TTL.

## Uruchomienie
```bash
npm install
npm run dev
```

## Format CSV
Plik CSV musi zawierać nagłówki:
```
time,open,high,low,close,volume
```
Przykład w `public/examples/sample.csv`.

## Binance
Pobierz dane z Binance przez UI lub manualnie:
```
GET /api/binance?symbol=BTCUSDT&timeframe=1h&limit=500
```

## Scoring i Top Block Reasons
- Signal engine liczy score na podstawie konfluencji trendu, momentum, ADX, wolumenu i struktury.
- Jeśli signal = `none`, agregowane są blokady z ostatnich `lookback` świec.
- `Top Block Reasons` to top 3 blokady z procentowym udziałem i pełną macierzą blokad.

## Struktura repo
```
/app
/components
/lib/indicators
/lib/structure
/lib/levels
/lib/signals
/lib/resample
/lib/validation
/db
/tests
/public/examples
```

## Checklist
**Działa**
- Upload CSV + render wykresu.
- Analiza i explain/debug panel.
- Historia analiz w SQLite.
- Top Block Reasons w API i UI.

**Opcjonalne**
- Binance fetch (włączone, ale zależne od internetu).
