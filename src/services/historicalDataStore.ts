import { HistoricalOhlcvBar, StockEquity } from '../types/equity';
import {
  calculateWilderRsi,
  calculateEmaSeries,
  calculateCagr,
} from '../engine/quantitativeMath';

// In-memory store for verified historical OHLCV bars mapped by canonical symbol
const historicalBarsMap = new Map<string, HistoricalOhlcvBar[]>();
const loadedFilesSet = new Set<string>();

// Listeners for store changes
type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error in historical data store listener:', e);
    }
  });
}

export function subscribeHistoricalDataStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Returns all filenames loaded into the store
 */
export function getLoadedFiles(): string[] {
  return Array.from(loadedFilesSet);
}

/**
 * Returns total count of unique files loaded
 */
export function getLoadedFilesCount(): number {
  return loadedFilesSet.size;
}

/**
 * Returns all historical bars stored for a given stock symbol (with suffix/prefix resilience)
 */
export function getHistoricalBars(symbol: string): HistoricalOhlcvBar[] {
  if (!symbol) return [];
  const s = symbol.toUpperCase().trim();
  const clean = s.replace(/\.(NS|BO|BSE|NSE)$/i, '').replace(/^(NSE|BSE):/i, '').trim();

  return (
    historicalBarsMap.get(s) ||
    historicalBarsMap.get(clean) ||
    historicalBarsMap.get(`${clean}.NS`) ||
    historicalBarsMap.get(`${clean}.BO`) ||
    []
  );
}

/**
 * Checks if historical bars exist for a given stock symbol
 */
export function hasHistoricalBars(symbol: string): boolean {
  const bars = getHistoricalBars(symbol);
  return !!bars && bars.length > 0;
}

/**
 * Returns all unique symbols currently loaded in the store
 */
export function getAllLoadedSymbols(): string[] {
  return Array.from(historicalBarsMap.keys());
}

/**
 * Returns the entire bars map
 */
export function getAllHistoricalBarsMap(): Map<string, HistoricalOhlcvBar[]> {
  return historicalBarsMap;
}

/**
 * Returns total count of raw historical bars across all symbols in store
 */
export function getTotalHistoricalBarsCount(): number {
  let count = 0;
  historicalBarsMap.forEach((bars) => {
    count += bars.length;
  });
  return count;
}

/**
 * Helper to safely extract string values from byte buffers, numbers, or strings
 */
function parseStringValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (val instanceof Uint8Array || (typeof val === 'object' && val.buffer)) {
    try {
      return new TextDecoder().decode(val).trim();
    } catch {
      return String(val).trim();
    }
  }
  return String(val).trim();
}

/**
 * Helper to safely parse dates from epoch days, timestamps, ISO strings, or binary buffers
 */
function parseDateValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) return !isNaN(val.getTime()) ? val.toISOString().slice(0, 10) : '';
  if (val instanceof Uint8Array || (typeof val === 'object' && val.buffer)) {
    try {
      const decoded = new TextDecoder().decode(val).trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(decoded)) return decoded.slice(0, 10);
      val = decoded;
    } catch {
      // fallback
    }
  }
  if (typeof val === 'number' || typeof val === 'bigint') {
    const num = Number(val);
    if (num > 0 && num < 50000) {
      // Days since 1970-01-01
      const d = new Date(num * 86400000);
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
    } else if (num >= 50000 && num < 10000000000) {
      // Seconds timestamp
      const d = new Date(num * 1000);
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
    } else if (num >= 10000000000) {
      // Milliseconds or microseconds timestamp
      const ms = num > 100000000000000 ? Math.floor(num / 1000) : num;
      const d = new Date(ms);
      return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
    }
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : s.slice(0, 10);
}

/**
 * Normalizes raw records from Parquet or CSV into sorted HistoricalOhlcvBar objects
 */
export function ingestRawHistoricalRecords(rawRecords: any[], fileName?: string): {
  symbolsLoaded: string[];
  totalBarsIngested: number;
} {
  if (!rawRecords || rawRecords.length === 0) {
    return { symbolsLoaded: [], totalBarsIngested: 0 };
  }

  const firstRow = rawRecords[0];
  const keys = typeof firstRow === 'object' && firstRow !== null ? Object.keys(firstRow) : [];

  // Flexible column key matchers with extensive coverage of financial datasets
  const symbolKey =
    keys.find((k) =>
      /^(symbol|ticker|stock|scrip|company_symbol|stock_code|security|scrip_cd|equity|tradingsymbol|name)$/i.test(
        k.trim()
      )
    ) || keys.find((k) => /symbol|ticker|scrip|tradingsymbol/i.test(k));

  const dateKey =
    keys.find((k) =>
      /^(date|timestamp|trade_date|traded_date|datetime|time|day|period|dt)$/i.test(k.trim())
    ) || keys.find((k) => /date|timestamp/i.test(k));

  const openKey =
    keys.find((k) => /^(open|open_price|openprice|op|first_price)$/i.test(k.trim())) ||
    keys.find((k) => /open/i.test(k));

  const highKey =
    keys.find((k) => /^(high|high_price|highprice|hp|max_price)$/i.test(k.trim())) ||
    keys.find((k) => /high/i.test(k));

  const lowKey =
    keys.find((k) => /^(low|low_price|lowprice|lp|min_price)$/i.test(k.trim())) ||
    keys.find((k) => /low/i.test(k));

  const closeKey =
    keys.find((k) =>
      /^(close|close_price|closeprice|adj_close|adjclose|ltp|last_price|lastprice|settle_price|price|closing_price)$/i.test(
        k.trim()
      )
    ) || keys.find((k) => /close|adj.*close|ltp|settle/i.test(k));

  const volKey =
    keys.find((k) =>
      /^(volume|vol|traded_quantity|traded_qty|tottrdqty|shares|qty|total_traded_quantity|turnover)$/i.test(
        k.trim()
      )
    ) || keys.find((k) => /vol|qty|shares|tottrd/i.test(k));

  const tempMap = new Map<string, HistoricalOhlcvBar[]>();

  for (let i = 0; i < rawRecords.length; i++) {
    const row = rawRecords[i];
    if (!row) continue;

    let rawSym: any = symbolKey ? row[symbolKey] : row.symbol || row.Symbol || row.ticker || row.Ticker;
    if (!rawSym && rawSym !== 0) continue;

    const rawSymbolStr = parseStringValue(rawSym).toUpperCase();
    if (!rawSymbolStr) continue;

    const cleanSymbol = rawSymbolStr
      .replace(/\.(NS|BO|BSE|NSE)$/i, '')
      .replace(/^(NSE|BSE):/i, '')
      .trim();

    const rawDate = dateKey ? row[dateKey] : row.date || row.Date || row.timestamp || row.Timestamp;
    const dateStr = parseDateValue(rawDate);
    if (!dateStr) continue;

    const rawClose = closeKey ? row[closeKey] : row.close || row.Close || row.ltp || row.LTP || row.price || row.Price;
    const close = Number(rawClose);
    if (isNaN(close) || close <= 0) continue;

    const rawOpen = openKey ? row[openKey] : row.open || row.Open;
    const rawHigh = highKey ? row[highKey] : row.high || row.High;
    const rawLow = lowKey ? row[lowKey] : row.low || row.Low;
    const rawVol = volKey ? row[volKey] : row.volume || row.Volume;

    const open = Number(rawOpen);
    const high = Number(rawHigh);
    const low = Number(rawLow);
    const volume = Number(rawVol);

    const bar: HistoricalOhlcvBar = {
      date: dateStr,
      symbol: cleanSymbol,
      open: !isNaN(open) && open > 0 ? open : close,
      high: !isNaN(high) && high > 0 ? high : Math.max(open || close, close),
      low: !isNaN(low) && low > 0 ? low : Math.min(open || close, close),
      close,
      volume: !isNaN(volume) && volume >= 0 ? volume : 0,
    };

    if (!tempMap.has(cleanSymbol)) {
      tempMap.set(cleanSymbol, []);
    }
    tempMap.get(cleanSymbol)!.push(bar);
  }

  let totalBarsIngested = 0;
  const symbolsLoaded: string[] = [];

  // Merge and sort chronologically with existing store bars
  tempMap.forEach((bars, symbol) => {
    const existingBars = historicalBarsMap.get(symbol) || [];
    const allBars = existingBars.length > 0 ? existingBars.concat(bars) : bars;
    allBars.sort((a, b) => a.date.localeCompare(b.date));

    // Remove duplicate dates for the same symbol
    const deduped: HistoricalOhlcvBar[] = [];
    let lastDate = '';
    for (const b of allBars) {
      if (b.date !== lastDate) {
        deduped.push(b);
        lastDate = b.date;
      }
    }

    historicalBarsMap.set(symbol, deduped);
    totalBarsIngested += deduped.length;
    symbolsLoaded.push(symbol);
  });

  if (fileName) {
    loadedFilesSet.add(fileName);
  }

  notifyListeners();

  return {
    symbolsLoaded,
    totalBarsIngested,
  };
}

/**
 * Deterministically calculates:
 * 1. 1Y, 3Y, 5Y, 10Y, 15Y CAGR using actual historical closing prices and dates.
 * 2. RSI <= 30 and RSI 30-35 independent event counts using state-machine clustering.
 * 3. EMA 100, 200, 400, 500 independent touch counts using +/- 3% proximity clustering.
 */
export function computeHistoricalMetricsForBars(bars: HistoricalOhlcvBar[]): {
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  cagr10Y: number | null;
  cagr15Y: number | null;
  startPrice1Y: number | null;
  startPrice3Y: number | null;
  startPrice5Y: number | null;
  startPrice10Y: number | null;
  startPrice15Y: number | null;
  rsiLe30Touches: number;
  rsi30To35Touches: number;
  ema100Touches: number;
  ema200Touches: number;
  ema400Touches: number;
  ema500Touches: number;
  historyYearsAvailable: number;
  latestPrice: number | null;
} {
  if (!bars || bars.length < 2) {
    return {
      cagr1Y: null,
      cagr3Y: null,
      cagr5Y: null,
      cagr10Y: null,
      cagr15Y: null,
      startPrice1Y: null,
      startPrice3Y: null,
      startPrice5Y: null,
      startPrice10Y: null,
      startPrice15Y: null,
      rsiLe30Touches: 0,
      rsi30To35Touches: 0,
      ema100Touches: 0,
      ema200Touches: 0,
      ema400Touches: 0,
      ema500Touches: 0,
      historyYearsAvailable: 0,
      latestPrice: null,
    };
  }

  const latestBar = bars[bars.length - 1];
  const latestPrice = latestBar.close;
  const latestTime = new Date(latestBar.date).getTime();
  const earliestTime = new Date(bars[0].date).getTime();
  const totalDays = (latestTime - earliestTime) / (1000 * 60 * 60 * 24);
  const historyYearsAvailable = Math.max(0, Number((totalDays / 365.25).toFixed(1)));

  // Helper to find starting price for a specific year horizon
  const findCagrForYears = (years: number): { cagr: number | null; startPrice: number | null } => {
    // Require minimum bars (approx 180 trading days per year)
    const minRequiredBars = Math.floor(years * 180);
    if (bars.length < minRequiredBars) {
      return { cagr: null, startPrice: null };
    }

    const targetTime = latestTime - years * 365.25 * 24 * 60 * 60 * 1000;
    // Earliest bar must be before targetTime + 45 days margin
    if (earliestTime > targetTime + 45 * 24 * 60 * 60 * 1000) {
      return { cagr: null, startPrice: null };
    }

    // Binary search to find closest bar to targetTime
    let low = 0;
    let high = bars.length - 1;
    let bestIdx = 0;
    let minDiff = Infinity;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const t = new Date(bars[mid].date).getTime();
      const diff = Math.abs(t - targetTime);

      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = mid;
      }

      if (t < targetTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const startBar = bars[bestIdx];
    const startTime = new Date(startBar.date).getTime();
    const actualElapsedYears = (latestTime - startTime) / (365.25 * 24 * 60 * 60 * 1000);

    // If start date is too far from target (> 15% tolerance), return null
    if (actualElapsedYears < years * 0.85 || actualElapsedYears > years * 1.25) {
      return { cagr: null, startPrice: null };
    }

    if (!startBar.close || startBar.close <= 0 || latestPrice <= 0) {
      return { cagr: null, startPrice: null };
    }

    const cagr = calculateCagr(startBar.close, latestPrice, actualElapsedYears);
    return {
      cagr,
      startPrice: startBar.close,
    };
  };

  const cagr1 = findCagrForYears(1);
  const cagr3 = findCagrForYears(3);
  const cagr5 = findCagrForYears(5);
  const cagr10 = findCagrForYears(10);
  const cagr15 = findCagrForYears(15);

  // 2. RSI 14 State-Machine Clustered Event Counts
  const closes = bars.map((b) => b.close);
  const rsiSeries = calculateWilderRsi(closes, 14);

  let rsiLe30Touches = 0;
  let rsi30To35Touches = 0;
  let inRsiEpisode = false;
  let minRsiInEpisode = 100;
  let consecutiveAboveExit = 0;

  for (let i = 14; i < bars.length; i++) {
    const rsi = rsiSeries[i];
    if (rsi === null) continue;

    if (rsi <= 35.0) {
      if (!inRsiEpisode) {
        inRsiEpisode = true;
        minRsiInEpisode = rsi;
        consecutiveAboveExit = 0;
      } else {
        if (rsi < minRsiInEpisode) minRsiInEpisode = rsi;
        consecutiveAboveExit = 0;
      }
    } else if (inRsiEpisode) {
      if (rsi > 40.0) {
        // Immediate exit: RSI recovered above 40.0
        if (minRsiInEpisode <= 30.0) {
          rsiLe30Touches++;
        } else if (minRsiInEpisode > 30.0 && minRsiInEpisode <= 35.0) {
          rsi30To35Touches++;
        }
        inRsiEpisode = false;
        minRsiInEpisode = 100;
        consecutiveAboveExit = 0;
      } else {
        consecutiveAboveExit++;
        if (consecutiveAboveExit >= 3) {
          // Exit after 3 consecutive days above 35.0
          if (minRsiInEpisode <= 30.0) {
            rsiLe30Touches++;
          } else if (minRsiInEpisode > 30.0 && minRsiInEpisode <= 35.0) {
            rsi30To35Touches++;
          }
          inRsiEpisode = false;
          minRsiInEpisode = 100;
          consecutiveAboveExit = 0;
        }
      }
    }
  }

  // 3. EMA 100, 200, 400, 500 State-Machine Clustered Touch Counts
  const ema100Series = calculateEmaSeries(closes, 100);
  const ema200Series = calculateEmaSeries(closes, 200);
  const ema400Series = calculateEmaSeries(closes, 400);
  const ema500Series = calculateEmaSeries(closes, 500);

  const countEmaTouches = (emaSeries: (number | null)[], minPeriod: number): number => {
    let touchCount = 0;
    let inEmaEpisode = false;
    let daysOutside = 0;

    for (let i = minPeriod; i < bars.length; i++) {
      const ema = emaSeries[i];
      if (ema === null || ema <= 0) continue;

      const bar = bars[i];
      const distPct = Math.abs((bar.close - ema) / ema);
      const isPiercing = bar.low <= ema && bar.high >= ema;
      const isNearEma = distPct <= 0.03 || isPiercing; // Within 3% or pierced

      if (isNearEma && !inEmaEpisode) {
        touchCount++;
        inEmaEpisode = true;
        daysOutside = 0;
      } else if (isNearEma && inEmaEpisode) {
        daysOutside = 0;
      } else if (!isNearEma && inEmaEpisode) {
        daysOutside++;
        // Reset episode if outside proximity for 3 consecutive bars or moves > 6% away
        if (daysOutside >= 3 || distPct > 0.06) {
          inEmaEpisode = false;
          daysOutside = 0;
        }
      }
    }
    return touchCount;
  };

  const ema100Touches = countEmaTouches(ema100Series, 100);
  const ema200Touches = countEmaTouches(ema200Series, 200);
  const ema400Touches = countEmaTouches(ema400Series, 400);
  const ema500Touches = countEmaTouches(ema500Series, 500);

  return {
    cagr1Y: cagr1.cagr,
    cagr3Y: cagr3.cagr,
    cagr5Y: cagr5.cagr,
    cagr10Y: cagr10.cagr,
    cagr15Y: cagr15.cagr,
    startPrice1Y: cagr1.startPrice,
    startPrice3Y: cagr3.startPrice,
    startPrice5Y: cagr5.startPrice,
    startPrice10Y: cagr10.startPrice,
    startPrice15Y: cagr15.startPrice,
    rsiLe30Touches,
    rsi30To35Touches,
    ema100Touches,
    ema200Touches,
    ema400Touches,
    ema500Touches,
    historyYearsAvailable,
    latestPrice,
  };
}
