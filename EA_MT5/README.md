# MT5 Expert Advisor Specification (FX Majors + Selected USD Crosses)

## Edge (Etap 0)
Edge opiera się na powtarzalnym zachowaniu rynku w trakcie aktywności 24/5:
- **Strukturalny trend na M5 (HH/HL lub LL/LH)** filtruje kierunek, w którym statystycznie częściej występują kontynuacje.
- **BOS na M1** identyfikuje impuls wybicia struktury w kierunku trendu.
- **Powrót do strefy 50–61.8% impulsu** zapewnia wejście na lepszej cenie po krótkotrwałej korekcie.

Wzorzec jest:
- obserwowalny (strukturę i BOS da się jednoznacznie określić),
- powtarzalny statystycznie w okresach wysokiej płynności,
- algorytmizowalny zero-jedynkowo.

## Założenia
- Instrumenty: **EURUSD, GBPUSD, USDCHF, USDJPY, USDCHN, AUDUSD, NZDUSD, USDCAD, USDEK**.
- Sesje: **24/5 (bez ograniczeń godzinowych)**.
- Interwały: **M1 (główny)** i **M5 (trend)**.
- Maksymalnie jedna pozycja na instrument.

## Logika wejścia (Entry)
### LONG
1. Na M5: trend wzrostowy = ostatnie dwa **HH** oraz **HL**.
2. Na M1: BOS w górę (zamknięcie świecy powyżej ostatniego swing high).
3. Retracement ceny do **50–61.8%** ostatniego impulsu.
4. Brak przeciwnego BOS po wybiciu.
5. Handel 24/5 (brak filtra sesji).

### SHORT
1. Na M5: trend spadkowy = ostatnie dwa **LL** oraz **LH**.
2. Na M1: BOS w dół (zamknięcie świecy poniżej ostatniego swing low).
3. Retracement ceny do **50–61.8%** ostatniego impulsu.
4. Brak przeciwnego BOS po wybiciu.
5. Handel 24/5 (brak filtra sesji).

## Logika wyjścia (Exit)
- **SL strukturalny**: poniżej ostatniego HL (LONG) / powyżej ostatniego LH (SHORT).
- **Minimalny SL**: ustawiany, gdy SL strukturalny jest zbyt ciasny.
- **TP**: stałe **RR 1:2**.
- **Break-even** po osiągnięciu **+1R**.
- **Time exit** po X świecach, jeśli TP/SL nie został trafiony.

## Risk Management
- **0.5%** ryzyka na trade.
- **DD dzienny**: 2% (blokada handlu do końca dnia).
- **DD tygodniowy**: 5% (blokada handlu do końca tygodnia).
- **3 straty z rzędu**: stop handlu do następnego dnia.

## Filtry bezpieczeństwa
- Spread: **EURUSD ≤ 1.5 pips**, **XAUUSD ≤ 40 punktów**.
- Zmienność: **ATR(M1) > minimalny próg**.
- Sesje czasowe: **OFF**.
- News filter: **OFF (MVP)**.

## Fail States & Auto-shutdown
EA wstrzymuje handel przy:
- przekroczeniu dziennego/tygodniowego DD,
- 3 stratach z rzędu,
- przekroczeniu limitu spreadu,
- braku wystarczającej zmienności (ATR),
- braku sesji (wyłączone).

## Regime Detection
- Trend wykrywany na M5 za pomocą struktury swingów (HH/HL lub LL/LH).
- Brak trendu → EA nie handluje.

## Metryki (logowane w CSV)
- Expectancy, R-multiple, MAE/MFE, drawdown i rozkład wyników są przygotowane do analizy po eksporcie z logów.

## Anti-overfitting
- Ograniczona liczba parametrów.
- Parametry wejściowe przygotowane do walk-forward i testów OOS.

## Execution Reality Check
- Slippage, częściowe wypełnienia i latencja uwzględnione poprzez konserwatywne SL/TP oraz filtr spreadu.

## Architektura EA
- **OnInit**: inicjalizacja wskaźników i logów.
- **OnDeinit**: zamknięcie plików/logów.
- **OnTick**: logika sesji, filtrów, entry/exit.
- Moduły: trend, BOS, risk, filtry, logging.

## Parametryzacja
Wszystkie kluczowe wartości dostępne jako `input` w EA.
