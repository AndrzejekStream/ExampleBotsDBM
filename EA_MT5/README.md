# MT5 Expert Advisor Specification (EURUSD / XAUUSD)

## Edge (Etap 0)
Edge opiera się na powtarzalnym zachowaniu rynku w trakcie sesji o najwyższej płynności (Londyn + Nowy Jork):
- **Strukturalny trend na M15 (HH/HL lub LL/LH)** filtruje kierunek, w którym statystycznie częściej występują kontynuacje.
- **BOS na M5** identyfikuje impuls wybicia struktury w kierunku trendu.
- **Powrót do strefy 50–61.8% impulsu** zapewnia wejście na lepszej cenie po krótkotrwałej korekcie.

Wzorzec jest:
- obserwowalny (strukturę i BOS da się jednoznacznie określić),
- powtarzalny statystycznie w okresach wysokiej płynności,
- algorytmizowalny zero-jedynkowo.

## Założenia
- Instrumenty: **EURUSD, XAUUSD**.
- Sesje: **08:00–11:00 CET** oraz **14:30–17:00 CET**.
- Interwały: **M5 (główny)** i **M15 (trend)**.
- Maksymalnie jedna pozycja na instrument.

## Logika wejścia (Entry)
### LONG
1. Na M15: trend wzrostowy = ostatnie dwa **HH** oraz **HL**.
2. Na M5: BOS w górę (zamknięcie świecy powyżej ostatniego swing high).
3. Retracement ceny do **50–61.8%** ostatniego impulsu.
4. Brak przeciwnego BOS po wybiciu.
5. Aktywne godziny sesji.

### SHORT
1. Na M15: trend spadkowy = ostatnie dwa **LL** oraz **LH**.
2. Na M5: BOS w dół (zamknięcie świecy poniżej ostatniego swing low).
3. Retracement ceny do **50–61.8%** ostatniego impulsu.
4. Brak przeciwnego BOS po wybiciu.
5. Aktywne godziny sesji.

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
- Zmienność: **ATR(M5) > minimalny próg**.
- Sesje czasowe: **ON**.
- News filter: **OFF (MVP)**.

## Fail States & Auto-shutdown
EA wstrzymuje handel przy:
- przekroczeniu dziennego/tygodniowego DD,
- 3 stratach z rzędu,
- przekroczeniu limitu spreadu,
- braku wystarczającej zmienności (ATR),
- braku sesji.

## Regime Detection
- Trend wykrywany na M15 za pomocą struktury swingów (HH/HL lub LL/LH).
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
