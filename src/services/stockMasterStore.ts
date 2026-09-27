import { StockEquity, MarketCapTier } from '../types/equity';
import { parseEquityCsv } from '../utils/csvParser';
import { RESEARCH_UNIVERSE_STOCKS } from './historicalData';

/**
 * DATA DOMAIN 1: STOCK MASTER / REFERENCE DATA CONTRACT
 * Strictly for stock identification, company naming, and taxonomy classification.
 * This data answers: "What is this stock and how is it classified?"
 * DOES NOT hold OHLCV historical bars.
 * DOES NOT calculate CAGR / RSI / EMA.
 */
export interface StockMasterRecord {
  symbol: string;
  company: string;
  sector: string;
  industry: string;
  indices: string[];
  capTier: MarketCapTier;
  marketCapRank?: number;
  isin?: string;
  exchange?: string;
}

// In-memory master store indexed by canonical SYMBOL
const stockMasterMap = new Map<string, StockMasterRecord>();

// Metadata tracking for Stock Master Data
interface StockMasterMeta {
  fileName: string;
  recordCount: number;
  uniqueSymbols: number;
  loadedAt: string;
  status: 'Loaded' | 'Empty' | 'Loading' | 'Error';
  lastError?: string;
}

let masterMeta: StockMasterMeta = {
  fileName: 'All_equity_details.csv (Authoritative)',
  recordCount: 0,
  uniqueSymbols: 0,
  loadedAt: new Date().toLocaleTimeString(),
  status: 'Empty',
};

// Subscription listeners
type MasterStoreListener = () => void;
const listeners = new Set<MasterStoreListener>();

function notifyMasterListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error('Error in stockMasterStore listener:', err);
    }
  });
}

export function subscribeStockMasterStore(listener: MasterStoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Initializes the stockMasterStore with baseline authoritative equities
 */
export function initStockMasterStore(
  initialStocks: StockEquity[] = RESEARCH_UNIVERSE_STOCKS,
  sourceName = 'All_equity_details.csv (Authoritative)'
) {
  stockMasterMap.clear();

  initialStocks.forEach((stock) => {
    const canonical = stock.symbol.toUpperCase().trim();
    if (!canonical) return;

    stockMasterMap.set(canonical, {
      symbol: canonical,
      company: stock.companyName,
      sector: stock.sector,
      industry: stock.industry,
      indices: stock.indices || [],
      capTier: stock.capTier,
      marketCapRank: stock.marketCapRank,
      isin: stock.isin,
      exchange: stock.exchange,
    });
  });

  masterMeta = {
    fileName: sourceName,
    recordCount: initialStocks.length,
    uniqueSymbols: stockMasterMap.size,
    loadedAt: new Date().toLocaleTimeString(),
    status: 'Loaded',
  };

  notifyMasterListeners();
}

/**
 * Ingests All_equity_details.csv text directly into stockMasterStore.
 * Completely separate from historicalDataStore.
 */
export function loadMasterDataFromCsv(
  csvText: string,
  fileName = 'All_equity_details.csv'
): {
  success: boolean;
  recordCount: number;
  uniqueSymbols: number;
  error?: string;
} {
  try {
    const parsed = parseEquityCsv(csvText, fileName);
    if (!parsed.stocks || parsed.stocks.length === 0) {
      throw new Error('No valid stock records found in CSV file.');
    }

    stockMasterMap.clear();

    parsed.stocks.forEach((stock) => {
      const canonical = stock.symbol.toUpperCase().trim();
      if (!canonical) return;

      stockMasterMap.set(canonical, {
        symbol: canonical,
        company: stock.companyName,
        sector: stock.sector,
        industry: stock.industry,
        indices: stock.indices || [],
        capTier: stock.capTier,
        marketCapRank: stock.marketCapRank,
        isin: stock.isin,
        exchange: stock.exchange,
      });
    });

    masterMeta = {
      fileName,
      recordCount: parsed.stocks.length,
      uniqueSymbols: stockMasterMap.size,
      loadedAt: new Date().toLocaleTimeString(),
      status: 'Loaded',
    };

    notifyMasterListeners();

    return {
      success: true,
      recordCount: parsed.stocks.length,
      uniqueSymbols: stockMasterMap.size,
    };
  } catch (err: any) {
    console.error('Failed to parse All_equity_details.csv:', err);
    masterMeta.status = 'Error';
    masterMeta.lastError = err?.message || String(err);
    notifyMasterListeners();
    return {
      success: false,
      recordCount: 0,
      uniqueSymbols: 0,
      error: err?.message || 'Failed to parse All_equity_details.csv',
    };
  }
}

/**
 * Fast Lookup: Returns classification and identity for a given canonical symbol
 */
export function getStockMaster(symbol: string): StockMasterRecord | undefined {
  if (!symbol) return undefined;
  const canonical = symbol.toUpperCase().trim();
  const clean = canonical.replace(/\.(NS|BO|BSE|NSE)$/i, '').replace(/^(NSE|BSE):/i, '').trim();

  return stockMasterMap.get(canonical) || stockMasterMap.get(clean);
}

/**
 * Returns all stock master records
 */
export function getAllStockMasterRecords(): StockMasterRecord[] {
  return Array.from(stockMasterMap.values());
}

/**
 * Returns master records converted to the application's StockEquity representation
 * for consumption by downstream UI components requiring StockEquity[]
 */
export function getAllStockMasterAsStockEquity(): StockEquity[] {
  return Array.from(stockMasterMap.values()).map((rec) => ({
    symbol: rec.symbol,
    companyName: rec.company,
    sector: rec.sector,
    industry: rec.industry,
    indices: rec.indices,
    capTier: rec.capTier,
    marketCapRank: rec.marketCapRank,
    isin: rec.isin,
    exchange: rec.exchange,
    validationsPassed: true,
  }));
}

/**
 * Returns count of total master records loaded
 */
export function getMasterRecordCount(): number {
  return masterMeta.recordCount;
}

/**
 * Returns count of unique symbols in stockMasterStore
 */
export function getMasterUniqueSymbolsCount(): number {
  return stockMasterMap.size;
}

/**
 * Returns current metadata about loaded Master Data
 */
export function getMasterMetadata(): StockMasterMeta {
  return { ...masterMeta };
}

// Auto-initialize with baseline universe on module load
initStockMasterStore();
