import { HistoricalOhlcvBar, StockEquity, StockCagrRecord, SectorCagrRecord, IndustryCagrRecord } from '../types/equity';
import { getHistoricalBars } from '../services/historicalDataStore';

export interface CagrHorizonResult {
  horizon: '1Y' | '3Y' | '5Y' | '10Y' | '15Y';
  years: number;
  cagr: number | null;
  startPrice: number | null;
  startDate: string | null;
  endPrice: number | null;
  endDate: string | null;
  actualElapsedYears: number | null;
  tradingBarsCount: number;
  hasSufficientData: boolean;
}

export interface StockCagrSummary {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  capTier: string;
  marketCapRank?: number;
  currentPrice: number | null;
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  cagr10Y: number | null;
  cagr15Y: number | null;
  horizons: Record<'1Y' | '3Y' | '5Y' | '10Y' | '15Y', CagrHorizonResult>;
  historyYearsAvailable: number;
  totalBarsAvailable: number;
  dataProvenance: 'VERIFIED_OHLCV' | 'INSUFFICIENT_HISTORY';
}

/**
 * CagrEngine: Pure mathematical CAGR computation
 * Formula: ((Price_End / Price_Start) ^ (1 / n) - 1) * 100
 */
export class CagrEngine {
  /**
   * Deterministic core CAGR formula:
   * ((endPrice / startPrice) ^ (1 / n) - 1) * 100
   */
  public static calculateSingleCagr(
    startPrice: number | null | undefined,
    endPrice: number | null | undefined,
    elapsedYears: number
  ): number | null {
    if (
      startPrice === null ||
      startPrice === undefined ||
      endPrice === null ||
      endPrice === undefined ||
      startPrice <= 0 ||
      endPrice <= 0 ||
      elapsedYears <= 0 ||
      isNaN(startPrice) ||
      isNaN(endPrice) ||
      isNaN(elapsedYears)
    ) {
      return null;
    }

    const ratio = endPrice / startPrice;
    const cagr = (Math.pow(ratio, 1 / elapsedYears) - 1) * 100;
    return Number(cagr.toFixed(2));
  }

  /**
   * Computes CAGR for a specific target horizon (1Y, 3Y, 5Y, 10Y, 15Y)
   * from sorted OHLCV bars. Returns null if data is insufficient.
   */
  public static calculateHorizonCagr(
    bars: HistoricalOhlcvBar[],
    horizonYears: number
  ): CagrHorizonResult {
    const horizonKey = `${horizonYears}Y` as '1Y' | '3Y' | '5Y' | '10Y' | '15Y';

    if (!bars || bars.length < 2) {
      return {
        horizon: horizonKey,
        years: horizonYears,
        cagr: null,
        startPrice: null,
        startDate: null,
        endPrice: null,
        endDate: null,
        actualElapsedYears: null,
        tradingBarsCount: 0,
        hasSufficientData: false,
      };
    }

    // Minimum trading bars required (~180 trading days/year)
    const minRequiredBars = Math.floor(horizonYears * 180);
    if (bars.length < minRequiredBars) {
      return {
        horizon: horizonKey,
        years: horizonYears,
        cagr: null,
        startPrice: null,
        startDate: null,
        endPrice: bars[bars.length - 1]?.close || null,
        endDate: bars[bars.length - 1]?.date || null,
        actualElapsedYears: null,
        tradingBarsCount: bars.length,
        hasSufficientData: false,
      };
    }

    const latestBar = bars[bars.length - 1];
    const latestTime = new Date(latestBar.date).getTime();
    const earliestTime = new Date(bars[0].date).getTime();

    // Target start timestamp
    const targetStartTime = latestTime - horizonYears * 365.25 * 24 * 60 * 60 * 1000;

    // Check if earliest bar is too late (more than 45 days after target start)
    if (earliestTime > targetStartTime + 45 * 24 * 60 * 60 * 1000) {
      return {
        horizon: horizonKey,
        years: horizonYears,
        cagr: null,
        startPrice: null,
        startDate: null,
        endPrice: latestBar.close,
        endDate: latestBar.date,
        actualElapsedYears: null,
        tradingBarsCount: bars.length,
        hasSufficientData: false,
      };
    }

    // Binary search to find closest trading bar to target start time
    let low = 0;
    let high = bars.length - 1;
    let bestIdx = 0;
    let minDiff = Infinity;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const t = new Date(bars[mid].date).getTime();
      const diff = Math.abs(t - targetStartTime);

      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = mid;
      }

      if (t < targetStartTime) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const startBar = bars[bestIdx];
    const startTime = new Date(startBar.date).getTime();
    const actualElapsedYears = (latestTime - startTime) / (365.25 * 24 * 60 * 60 * 1000);

    // Verify tolerance (actual elapsed years must be within 85% - 125% of target)
    if (actualElapsedYears < horizonYears * 0.85 || actualElapsedYears > horizonYears * 1.25) {
      return {
        horizon: horizonKey,
        years: horizonYears,
        cagr: null,
        startPrice: startBar.close,
        startDate: startBar.date,
        endPrice: latestBar.close,
        endDate: latestBar.date,
        actualElapsedYears: Number(actualElapsedYears.toFixed(2)),
        tradingBarsCount: bars.length,
        hasSufficientData: false,
      };
    }

    const cagr = this.calculateSingleCagr(startBar.close, latestBar.close, actualElapsedYears);

    return {
      horizon: horizonKey,
      years: horizonYears,
      cagr,
      startPrice: startBar.close,
      startDate: startBar.date,
      endPrice: latestBar.close,
      endDate: latestBar.date,
      actualElapsedYears: Number(actualElapsedYears.toFixed(2)),
      tradingBarsCount: bars.length,
      hasSufficientData: cagr !== null,
    };
  }

  /**
   * Computes full 1Y, 3Y, 5Y, 10Y, and 15Y CAGRs for a stock directly from bars.
   */
  public static calculateStockCagr(
    stock: StockEquity,
    customBars?: HistoricalOhlcvBar[]
  ): StockCagrSummary {
    const symbol = stock.symbol.toUpperCase().trim();
    const bars = customBars || getHistoricalBars(symbol);

    const h1Y = this.calculateHorizonCagr(bars, 1);
    const h3Y = this.calculateHorizonCagr(bars, 3);
    const h5Y = this.calculateHorizonCagr(bars, 5);
    const h10Y = this.calculateHorizonCagr(bars, 10);
    const h15Y = this.calculateHorizonCagr(bars, 15);

    let historyYearsAvailable = 0;
    if (bars.length >= 2) {
      const firstT = new Date(bars[0].date).getTime();
      const lastT = new Date(bars[bars.length - 1].date).getTime();
      historyYearsAvailable = Math.max(0, Number(((lastT - firstT) / (365.25 * 86400000)).toFixed(1)));
    }

    const latestPrice = bars.length > 0 ? bars[bars.length - 1].close : stock.currentPrice || null;

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      sector: stock.sector,
      industry: stock.industry,
      capTier: stock.capTier,
      marketCapRank: stock.marketCapRank,
      currentPrice: latestPrice,
      cagr1Y: h1Y.cagr,
      cagr3Y: h3Y.cagr,
      cagr5Y: h5Y.cagr,
      cagr10Y: h10Y.cagr,
      cagr15Y: h15Y.cagr,
      horizons: {
        '1Y': h1Y,
        '3Y': h3Y,
        '5Y': h5Y,
        '10Y': h10Y,
        '15Y': h15Y,
      },
      historyYearsAvailable,
      totalBarsAvailable: bars.length,
      dataProvenance: historyYearsAvailable >= 1 ? 'VERIFIED_OHLCV' : 'INSUFFICIENT_HISTORY',
    };
  }

  /**
   * Batch calculates full CAGRs for the entire universe of stocks.
   */
  public static buildUniverseCagr(
    stocks: StockEquity[],
    customBarsMap?: Map<string, HistoricalOhlcvBar[]>
  ): StockCagrSummary[] {
    return stocks.map((s) => {
      const bars = customBarsMap?.get(s.symbol.toUpperCase().trim());
      return this.calculateStockCagr(s, bars);
    });
  }
}
