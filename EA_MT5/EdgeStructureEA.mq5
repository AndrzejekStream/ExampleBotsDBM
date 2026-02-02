//+------------------------------------------------------------------+
//|                                                EdgeStructureEA.mq5|
//|                     Intraday SMC/PA EA (EURUSD/XAUUSD)           |
//+------------------------------------------------------------------+
#property strict

#include <Trade/Trade.mqh>

input double   RiskPercent            = 0.5;   // % risk per trade
input double   DailyDDLimitPercent    = 2.0;   // daily drawdown limit
input double   WeeklyDDLimitPercent   = 5.0;   // weekly drawdown limit
input int      MaxConsecutiveLosses   = 3;     // max losses in a row
input int      MagicNumber            = 55001;

input int      Session1StartHour      = 8;
input int      Session1StartMinute    = 0;
input int      Session1EndHour        = 11;
input int      Session1EndMinute      = 0;
input int      Session2StartHour      = 14;
input int      Session2StartMinute    = 30;
input int      Session2EndHour        = 17;
input int      Session2EndMinute      = 0;
input int      TimeOffsetHours        = 0;     // broker time -> CET

input int      TrendLookbackBars      = 200;   // M15 lookback for swings
input int      BOSLookbackBars        = 200;   // M5 lookback for swings
input int      MinSLPips              = 8;     // minimum SL in pips
input double   RiskReward             = 2.0;   // TP = RR * SL
input bool     UseBreakEven           = true;
input double   BreakEvenAtR           = 1.0;   // move SL to BE at +1R
input int      TimeExitBars           = 36;    // close after N M5 bars

input int      ATRPeriod              = 14;
input double   ATRMinPips             = 3.0;   // minimal ATR on M5

input double   MaxSpreadPipsFX        = 1.5;   // EURUSD
input double   MaxSpreadPointsXAU     = 40.0;  // XAUUSD

input double   SlippagePoints         = 10.0;  // for market execution

CTrade trade;

int fractalsM5Handle = INVALID_HANDLE;
int fractalsM15Handle = INVALID_HANDLE;
int atrM5Handle = INVALID_HANDLE;

bool tradingDisabled = false;
string disableReason = "";

datetime lastBarTime = 0;

// Track BOS/impulse
int lastBOSDirection = 0; // 1 long, -1 short
int lastBOSBarShift = -1;
double lastImpulseHigh = 0.0;
double lastImpulseLow = 0.0;

// Track position info
bool hasPosition = false;
double entryPrice = 0.0;
double initialSL = 0.0;
int entryBarIndex = -1;

// Risk tracking
double dayStartEquity = 0.0;
double weekStartEquity = 0.0;
int consecutiveLosses = 0;

datetime lastDay = 0;
datetime lastWeek = 0;

string logFileName = "EdgeStructureEA_log.csv";

//+------------------------------------------------------------------+
//| Utility logging                                                  |
//+------------------------------------------------------------------+
void LogEvent(string eventType, string message)
{
   int handle = FileOpen(logFileName, FILE_CSV | FILE_WRITE | FILE_READ | FILE_SHARE_WRITE);
   if(handle == INVALID_HANDLE)
      return;

   FileSeek(handle, 0, SEEK_END);
   string timeStr = TimeToString(TimeCurrent(), TIME_DATE | TIME_SECONDS);
   FileWrite(handle, timeStr, _Symbol, eventType, message);
   FileClose(handle);
}

//+------------------------------------------------------------------+
//| Helper: check session                                            |
//+------------------------------------------------------------------+
bool IsWithinSession(datetime serverTime)
{
   datetime cetTime = serverTime + (TimeOffsetHours * 3600);
   MqlDateTime t;
   TimeToStruct(cetTime, t);
   int minutes = t.hour * 60 + t.min;

   int s1Start = Session1StartHour * 60 + Session1StartMinute;
   int s1End   = Session1EndHour * 60 + Session1EndMinute;
   int s2Start = Session2StartHour * 60 + Session2StartMinute;
   int s2End   = Session2EndHour * 60 + Session2EndMinute;

   bool inS1 = (minutes >= s1Start && minutes <= s1End);
   bool inS2 = (minutes >= s2Start && minutes <= s2End);

   return (inS1 || inS2);
}

//+------------------------------------------------------------------+
//| Helper: read last two fractals                                   |
//+------------------------------------------------------------------+
bool GetLastTwoFractals(int handle, int buffer, int lookback, double &lastVal, int &lastShift, double &prevVal, int &prevShift)
{
   if(handle == INVALID_HANDLE)
      return false;

   double values[];
   ArraySetAsSeries(values, true);
   if(CopyBuffer(handle, buffer, 0, lookback, values) <= 0)
      return false;

   lastVal = 0.0;
   prevVal = 0.0;
   lastShift = -1;
   prevShift = -1;

   for(int i = 2; i < lookback; i++)
   {
      if(values[i] != 0.0)
      {
         if(lastShift == -1)
         {
            lastShift = i;
            lastVal = values[i];
         }
         else
         {
            prevShift = i;
            prevVal = values[i];
            return true;
         }
      }
   }
   return false;
}

//+------------------------------------------------------------------+
//| Trend detection on M15                                           |
//+------------------------------------------------------------------+
int GetTrendM15()
{
   double lastHigh, prevHigh, lastLow, prevLow;
   int lastHighShift, prevHighShift, lastLowShift, prevLowShift;

   bool gotHighs = GetLastTwoFractals(fractalsM15Handle, 0, TrendLookbackBars, lastHigh, lastHighShift, prevHigh, prevHighShift);
   bool gotLows  = GetLastTwoFractals(fractalsM15Handle, 1, TrendLookbackBars, lastLow, lastLowShift, prevLow, prevLowShift);

   if(!gotHighs || !gotLows)
      return 0;

   if(lastHigh > prevHigh && lastLow > prevLow)
      return 1;
   if(lastHigh < prevHigh && lastLow < prevLow)
      return -1;

   return 0;
}

//+------------------------------------------------------------------+
//| Check BOS on M5 and record impulse                               |
//+------------------------------------------------------------------+
void UpdateBOS()
{
   double lastHigh, prevHigh, lastLow, prevLow;
   int lastHighShift, prevHighShift, lastLowShift, prevLowShift;

   bool gotHighs = GetLastTwoFractals(fractalsM5Handle, 0, BOSLookbackBars, lastHigh, lastHighShift, prevHigh, prevHighShift);
   bool gotLows  = GetLastTwoFractals(fractalsM5Handle, 1, BOSLookbackBars, lastLow, lastLowShift, prevLow, prevLowShift);

   if(!gotHighs || !gotLows)
      return;

   double close1 = iClose(_Symbol, PERIOD_M5, 1);

   if(close1 > lastHigh && lastBOSBarShift != 1)
   {
      lastBOSDirection = 1;
      lastBOSBarShift = 1;
      lastImpulseHigh = close1;
      lastImpulseLow = lastLow;
      LogEvent("BOS", "Bullish BOS detected");
   }
   else if(close1 < lastLow && lastBOSBarShift != 1)
   {
      lastBOSDirection = -1;
      lastBOSBarShift = 1;
      lastImpulseHigh = lastHigh;
      lastImpulseLow = close1;
      LogEvent("BOS", "Bearish BOS detected");
   }
}

//+------------------------------------------------------------------+
//| Check if spread is acceptable                                    |
//+------------------------------------------------------------------+
bool IsSpreadOk()
{
   double spreadPoints = (SymbolInfoDouble(_Symbol, SYMBOL_ASK) - SymbolInfoDouble(_Symbol, SYMBOL_BID)) / _Point;

   if(_Symbol == "XAUUSD")
      return spreadPoints <= MaxSpreadPointsXAU;

   double spreadPips = spreadPoints * _Point / SymbolInfoDouble(_Symbol, SYMBOL_POINT) / 10.0;
   return spreadPips <= MaxSpreadPipsFX;
}

//+------------------------------------------------------------------+
//| ATR filter                                                       |
//+------------------------------------------------------------------+
bool IsAtrOk()
{
   double atrValues[];
   ArraySetAsSeries(atrValues, true);
   if(CopyBuffer(atrM5Handle, 0, 0, 1, atrValues) <= 0)
      return false;

   double atrPips = atrValues[0] / _Point / 10.0;
   return atrPips >= ATRMinPips;
}

//+------------------------------------------------------------------+
//| Risk calculation                                                 |
//+------------------------------------------------------------------+
double CalculateLot(double slDistancePoints)
{
   if(slDistancePoints <= 0.0)
      return 0.0;

   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = balance * (RiskPercent / 100.0);

   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);

   double valuePerPoint = tickValue / tickSize;
   double lot = riskAmount / (slDistancePoints * valuePerPoint);

   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double step   = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   lot = MathMax(minLot, MathMin(maxLot, lot));
   lot = MathFloor(lot / step) * step;

   return lot;
}

//+------------------------------------------------------------------+
//| Check daily/weekly drawdown                                      |
//+------------------------------------------------------------------+
void UpdateDrawdownStatus()
{
   datetime now = TimeCurrent();
   MqlDateTime t;
   TimeToStruct(now, t);

   bool isNewDay = false;
   bool isNewWeek = false;
   MqlDateTime lastDayStruct;
   if(lastDay == 0)
   {
      dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
      consecutiveLosses = 0;
      lastDay = now;
   }
   else
   {
      TimeToStruct(lastDay, lastDayStruct);
      if(lastDayStruct.day != t.day)
      {
         dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
         consecutiveLosses = 0;
         lastDay = now;
         isNewDay = true;
      }
   }
   if(lastDay == now)
      isNewDay = true;

   int weekNumber = (t.day_of_year / 7);
   MqlDateTime lastWeekStruct;
   if(lastWeek == 0)
   {
      weekStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
      lastWeek = now;
   }
   else
   {
      TimeToStruct(lastWeek, lastWeekStruct);
      int lastWeekNumber = lastWeekStruct.day_of_year / 7;
      if(lastWeekNumber != weekNumber)
      {
         weekStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
         lastWeek = now;
         isNewWeek = true;
      }
   }
   if(lastWeek == now)
      isNewWeek = true;

   if(isNewDay && tradingDisabled && disableReason == "Daily DD limit")
   {
      tradingDisabled = false;
      disableReason = "";
   }

   if(isNewWeek && tradingDisabled && disableReason == "Weekly DD limit")
   {
      tradingDisabled = false;
      disableReason = "";
   }

   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double dailyDD = (dayStartEquity - equity) / dayStartEquity * 100.0;
   double weeklyDD = (weekStartEquity - equity) / weekStartEquity * 100.0;

   if(dailyDD >= DailyDDLimitPercent)
   {
      tradingDisabled = true;
      disableReason = "Daily DD limit";
   }

   if(weeklyDD >= WeeklyDDLimitPercent)
   {
      tradingDisabled = true;
      disableReason = "Weekly DD limit";
   }

   if(consecutiveLosses >= MaxConsecutiveLosses)
   {
      tradingDisabled = true;
      disableReason = "Max consecutive losses";
   }
}

//+------------------------------------------------------------------+
//| Entry logic                                                      |
//+------------------------------------------------------------------+
void TryOpenTrade()
{
   if(tradingDisabled)
      return;
   if(!IsWithinSession(TimeCurrent()))
      return;
   if(!IsSpreadOk())
      return;
   if(!IsAtrOk())
      return;

   int trend = GetTrendM15();
   if(trend == 0)
      return;

   UpdateBOS();

   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   if(lastBOSDirection == trend && lastImpulseHigh != 0.0 && lastImpulseLow != 0.0)
   {
      double fib50 = lastImpulseLow + (lastImpulseHigh - lastImpulseLow) * 0.5;
      double fib618 = lastImpulseLow + (lastImpulseHigh - lastImpulseLow) * 0.618;

      if(trend == 1 && bid >= MathMin(fib50, fib618) && bid <= MathMax(fib50, fib618))
      {
         double sl = lastImpulseLow;
         double slDistance = bid - sl;
         double minSL = MinSLPips * _Point * 10.0;
         if(slDistance < minSL)
            sl = bid - minSL;

         double tp = bid + (bid - sl) * RiskReward;
         double lot = CalculateLot((bid - sl) / _Point);

         if(lot > 0.0)
         {
            trade.SetExpertMagicNumber(MagicNumber);
            trade.SetDeviationInPoints((int)SlippagePoints);
            if(trade.Buy(lot, _Symbol, ask, sl, tp, "BOS-Fib Long"))
            {
               entryPrice = ask;
               initialSL = sl;
               entryBarIndex = iBarShift(_Symbol, PERIOD_M5, TimeCurrent());
               hasPosition = true;
               LogEvent("TRADE", "Opened long position");
            }
         }
      }
      else if(trend == -1 && ask <= MathMax(fib50, fib618) && ask >= MathMin(fib50, fib618))
      {
         double sl = lastImpulseHigh;
         double slDistance = sl - ask;
         double minSL = MinSLPips * _Point * 10.0;
         if(slDistance < minSL)
            sl = ask + minSL;

         double tp = ask - (sl - ask) * RiskReward;
         double lot = CalculateLot((sl - ask) / _Point);

         if(lot > 0.0)
         {
            trade.SetExpertMagicNumber(MagicNumber);
            trade.SetDeviationInPoints((int)SlippagePoints);
            if(trade.Sell(lot, _Symbol, bid, sl, tp, "BOS-Fib Short"))
            {
               entryPrice = bid;
               initialSL = sl;
               entryBarIndex = iBarShift(_Symbol, PERIOD_M5, TimeCurrent());
               hasPosition = true;
               LogEvent("TRADE", "Opened short position");
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Manage open position                                             |
//+------------------------------------------------------------------+
void ManagePosition()
{
   if(!PositionSelect(_Symbol))
   {
      hasPosition = false;
      return;
   }

   double currentPrice = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double sl = PositionGetDouble(POSITION_SL);
   double tp = PositionGetDouble(POSITION_TP);
   long type = PositionGetInteger(POSITION_TYPE);
   double entry = PositionGetDouble(POSITION_PRICE_OPEN);

   if(UseBreakEven && initialSL != 0.0)
   {
      double risk = MathAbs(entry - initialSL);
      double profit = (type == POSITION_TYPE_BUY) ? (currentPrice - entry) : (entry - currentPrice);

      if(profit >= risk * BreakEvenAtR)
      {
         double newSL = entry;
         if((type == POSITION_TYPE_BUY && newSL > sl) || (type == POSITION_TYPE_SELL && newSL < sl))
         {
            trade.PositionModify(_Symbol, newSL, tp);
            LogEvent("MANAGE", "Moved SL to break-even");
         }
      }
   }

   if(entryBarIndex >= 0 && TimeExitBars > 0)
   {
      int currentBar = iBarShift(_Symbol, PERIOD_M5, TimeCurrent());
      if(currentBar >= 0 && (currentBar - entryBarIndex) >= TimeExitBars)
      {
         trade.PositionClose(_Symbol);
         LogEvent("MANAGE", "Closed position by time exit");
      }
   }
}

//+------------------------------------------------------------------+
//| Expert initialization                                            |
//+------------------------------------------------------------------+
int OnInit()
{
   fractalsM5Handle = iFractals(_Symbol, PERIOD_M5);
   fractalsM15Handle = iFractals(_Symbol, PERIOD_M15);
   atrM5Handle = iATR(_Symbol, PERIOD_M5, ATRPeriod);

   if(fractalsM5Handle == INVALID_HANDLE || fractalsM15Handle == INVALID_HANDLE || atrM5Handle == INVALID_HANDLE)
   {
      LogEvent("ERROR", "Failed to initialize indicators");
      return INIT_FAILED;
   }

   trade.SetExpertMagicNumber(MagicNumber);
   dayStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   weekStartEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   lastDay = TimeCurrent();
   lastWeek = TimeCurrent();

   LogEvent("INFO", "EA initialized");
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization                                          |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(fractalsM5Handle != INVALID_HANDLE)
      IndicatorRelease(fractalsM5Handle);
   if(fractalsM15Handle != INVALID_HANDLE)
      IndicatorRelease(fractalsM15Handle);
   if(atrM5Handle != INVALID_HANDLE)
      IndicatorRelease(atrM5Handle);

   LogEvent("INFO", "EA deinitialized");
}

//+------------------------------------------------------------------+
//| OnTick                                                           |
//+------------------------------------------------------------------+
void OnTick()
{
   datetime currentBarTime = iTime(_Symbol, PERIOD_M5, 0);
   if(currentBarTime == lastBarTime)
      return;

   lastBarTime = currentBarTime;

   UpdateDrawdownStatus();
   if(tradingDisabled)
   {
      LogEvent("RISK", "Trading disabled: " + disableReason);
      return;
   }

   ManagePosition();

   if(!PositionSelect(_Symbol))
      TryOpenTrade();
}

//+------------------------------------------------------------------+
//| Track consecutive losses                                         |
//+------------------------------------------------------------------+
void OnTradeTransaction(const MqlTradeTransaction& trans, const MqlTradeRequest& request, const MqlTradeResult& result)
{
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD && trans.deal_entry == DEAL_ENTRY_OUT)
   {
      double profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT);
      if(profit < 0)
      {
         consecutiveLosses++;
         LogEvent("RISK", "Loss recorded. Consecutive losses: " + IntegerToString(consecutiveLosses));
      }
      else
      {
         consecutiveLosses = 0;
      }
   }
}
