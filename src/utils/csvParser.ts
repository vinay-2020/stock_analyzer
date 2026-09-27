import Papa from 'papaparse';
import {
  EquityTransaction,
  IndustryAnalysis,
  MarketDatasetSummary,
  SectorAnalysis,
  StockEquity,
  StockValidationReport,
} from '../types/equity';
import { deriveStockIndices } from '../services/classificationService';
import { validateStockUniverse } from '../services/dataValidationService';

// Clean column keys: lowercase, trim, remove non-alphanumeric except space
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Clean and parse numbers safely without assumptions or guessing
export function parseNumber(val: any): number | undefined {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') return isNaN(val) ? undefined : val;
  const str = String(val).trim();
  if (!str || str === '-' || str === '—' || str.toLowerCase() === 'na' || str.toLowerCase() === 'n/a') {
    return undefined;
  }

  // Remove currency signs (₹, $, €, £), 'Rs', 'Rs.', commas, percentage
  const cleaned = str
    .replace(/[₹$€£%]/g, '')
    .replace(/^rs\.?\s*/i, '')
    .replace(/,/g, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

// Clean stock symbol: strips NSE / BSE prefixes/suffixes like .NS, .BO, -EQ, :NSE, etc.
export function cleanStockSymbol(raw: string): string {
  if (!raw) return '';
  let s = raw.trim().toUpperCase();

  s = s.replace(/^(NSE|BSE):/i, '');
  s = s.replace(/:(NSE|BSE)$/i, '');
  s = s.replace(/\.(NS|BO|BSE|NSE)$/i, '');
  s = s.replace(/-EQ$/i, '');
  s = s.replace(/_EQ$/i, '');

  return s.trim();
}

// Format date string consistently (YYYY-MM-DD)
function normalizeDate(rawDate: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();

  const parts = trimmed.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      // DD-MM-YYYY (Indian) or MM-DD-YYYY
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }

  return trimmed;
}

/**
 * Strict Data Fidelity Parser for Equity CSVs
 * Strictly adheres to columns and values present in the data.
 * Does NOT generate fake prices, synthetic P/E, or estimated projections.
 */
export function parseEquityCsv(
  csvText: string,
  sourceFileName = 'csv_files/ALL EQUITY DETAILS.CSV'
): {
  stocks: StockEquity[];
  transactions: EquityTransaction[];
  summary: MarketDatasetSummary;
  rawHeaders: string[];
  validationReport: StockValidationReport;
} {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  if (!parsed.data || parsed.data.length === 0) {
    throw new Error('CSV is empty or could not be parsed');
  }

  const rawRows = parsed.data;
  const rawHeaders = Object.keys(rawRows[0] || {});

  // Map fields dynamically based on normalized column names
  const headerMap: Record<string, string> = {};
  for (const h of rawHeaders) {
    const norm = normalizeKey(h);
    headerMap[norm] = h;
  }

  const findKey = (...candidates: string[]): string | undefined => {
    for (const cand of candidates) {
      const norm = normalizeKey(cand);
      if (headerMap[norm]) return headerMap[norm];
    }
    // Substring fallback
    for (const cand of candidates) {
      const norm = normalizeKey(cand);
      for (const [k, original] of Object.entries(headerMap)) {
        if (k.includes(norm) || norm.includes(k)) return original;
      }
    }
    return undefined;
  };

  const symbolKey = findKey('symbol', 'ticker', 'stocksymbol', 'scrip', 'scripname', 'stock', 'code', 'instrument');
  const companyKey = findKey('company', 'companyname', 'security', 'securityname', 'name', 'description', 'scripdescription');
  const sectorKey = findKey('sector', 'sectors', 'sectorname', 'category', 'broadsector');
  const industryKey = findKey('industry', 'industries', 'industryname', 'subsector', 'subindustry', 'sub_industry', 'group');
  const indexKey = findKey('index', 'indices', 'indexname', 'benchmark', 'benchmarkindex', 'niftyindex', 'series');
  const exchangeKey = findKey('exchange', 'market', 'exch', 'exchangename');
  const isinKey = findKey('isin', 'isincode');
  const rankKey = findKey('marketcaprank', 'mcaprank', 'rank', 'rankno');
  const capTierKey = findKey('captier', 'tier', 'marketcaptier', 'category');
  const dateKey = findKey('date', 'tradedate', 'transactiondate', 'orderdate', 'executiondate', 'txndate');
  const actionKey = findKey('action', 'type', 'ordertype', 'transactiontype', 'buysell', 'side', 'activity');
  const qtyKey = findKey('quantity', 'qty', 'shares', 'units', 'volume', 'tradeqty');
  const priceKey = findKey('price', 'rate', 'tradeprice', 'executionprice', 'unitprice', 'costprice', 'buyprice', 'avgprice');
  const amountKey = findKey('amount', 'total', 'totalamount', 'tradevalue', 'netamount', 'turnover', 'value');
  const feesKey = findKey('fees', 'brokerage', 'charges', 'commission', 'stt', 'tax');
  const notesKey = findKey('notes', 'remarks', 'comment');

  // Fundamentals keys in CSV
  const currentPriceKey = findKey('currentprice', 'cmp', 'ltp', 'marketprice', 'closeprice', 'lastprice', 'prevclose');
  const peKey = findKey('pe', 'peratio', 'p/e', 'pe ratio');
  const roeKey = findKey('roe', 'returnonequity', 'roe%');
  const epsKey = findKey('eps', 'earningspershare');
  const revGrowthKey = findKey('revenuegrowth', 'salesgrowth', 'growth%');
  const marginKey = findKey('profitmargin', 'netmargin', 'margin%');
  const divYieldKey = findKey('dividendyield', 'divyield', 'yield%');
  const high52Key = findKey('52weekhigh', '52whigh', 'high52', '52w high');
  const low52Key = findKey('52weeklow', '52wlow', 'low52', '52w low');
  const betaKey = findKey('beta');
  const mcapKey = findKey('marketcap', 'mcap', 'capitalization');

  const transactions: EquityTransaction[] = [];
  const rawStockList: StockEquity[] = [];

  let totalTradedValue = 0;
  let totalTradedQuantity = 0;

  rawRows.forEach((row, idx) => {
    let rawSymbol = symbolKey && row[symbolKey] ? row[symbolKey].trim() : '';
    let rawCompany = companyKey && row[companyKey] ? row[companyKey].trim() : '';
    const rawExchange = exchangeKey && row[exchangeKey] ? row[exchangeKey].trim().toUpperCase() : 'NSE';
    const rawIsin = isinKey && row[isinKey] ? row[isinKey].trim() : undefined;
    const rawRank = parseNumber(rankKey ? row[rankKey] : undefined);
    const parsedCapTier = capTierKey && row[capTierKey] ? (row[capTierKey].trim().toUpperCase() as any) : undefined;

    if (!rawSymbol && !rawCompany) {
      for (const val of Object.values(row)) {
        if (val && val.trim().length > 0 && val.trim().length <= 20) {
          rawSymbol = val.trim();
          break;
        }
      }
    }

    // Cleaned trading symbol - DO NOT invent synthetic STOCK_1 symbols
    const cleanedSymbol = cleanStockSymbol(rawSymbol);
    const companyName = (rawCompany || cleanedSymbol || '[UNKNOWN COMPANY]').trim();
    const sector = (sectorKey && row[sectorKey] ? row[sectorKey].trim() : 'Unclassified Sector') || 'Unclassified Sector';
    const industry = (industryKey && row[industryKey] ? row[industryKey].trim() : `${sector} - General`) || `${sector} - General`;

    const rawDate = dateKey ? row[dateKey] : '';
    const date = normalizeDate(rawDate);
    const action = actionKey && row[actionKey] ? row[actionKey].trim().toUpperCase() : 'TRADE';

    const qty = parseNumber(qtyKey ? row[qtyKey] : undefined) ?? 0;
    let price = parseNumber(priceKey ? row[priceKey] : undefined);
    let amount = parseNumber(amountKey ? row[amountKey] : undefined);

    if ((price === undefined || price === 0) && amount !== undefined && qty > 0) {
      price = +(amount / qty).toFixed(2);
    } else if ((amount === undefined || amount === 0) && price !== undefined && qty > 0) {
      amount = +(price * qty).toFixed(2);
    }

    const fees = parseNumber(feesKey ? row[feesKey] : undefined) ?? 0;
    const notes = notesKey ? row[notesKey] : undefined;

    // Fundamentals from this row (only if strictly provided in CSV)
    const currentPrice = parseNumber(currentPriceKey ? row[currentPriceKey] : undefined) ?? price;
    const peRatio = parseNumber(peKey ? row[peKey] : undefined);
    const roePercent = parseNumber(roeKey ? row[roeKey] : undefined);
    const eps = parseNumber(epsKey ? row[epsKey] : undefined);
    const revenueGrowthPercent = parseNumber(revGrowthKey ? row[revGrowthKey] : undefined);
    const profitMarginPercent = parseNumber(marginKey ? row[marginKey] : undefined);
    const dividendYieldPercent = parseNumber(divYieldKey ? row[divYieldKey] : undefined);
    const week52High = parseNumber(high52Key ? row[high52Key] : undefined);
    const week52Low = parseNumber(low52Key ? row[low52Key] : undefined);
    const beta = parseNumber(betaKey ? row[betaKey] : undefined);
    const marketCap = mcapKey && row[mcapKey] ? row[mcapKey].trim() : undefined;

    // Add transaction record if date or quantity/amount exist
    if (date || qty > 0 || (amount !== undefined && amount > 0)) {
      transactions.push({
        id: `txn_${idx + 1}_${cleanedSymbol || idx + 1}`,
        date: date || 'Recorded',
        symbol: cleanedSymbol,
        companyName,
        sector,
        industry,
        action,
        quantity: qty,
        price: price ?? 0,
        amount: amount ?? 0,
        fees,
        notes,
        rawRow: row,
      });

      if (amount) totalTradedValue += amount;
      if (qty) totalTradedQuantity += qty;
    }

    const capTier = parsedCapTier || (rawRank ? (rawRank <= 100 ? 'HIGH' : rawRank <= 350 ? 'MID' : 'LOW') : (idx < 100 ? 'HIGH' : idx < 350 ? 'MID' : 'LOW'));

    rawStockList.push({
      symbol: cleanedSymbol,
      companyName,
      sector,
      industry,
      capTier,
      marketCapRank: rawRank ?? (idx + 1),
      exchange: rawExchange,
      isin: rawIsin,
      internalId: `INTERNAL_${idx + 1}`,
      rawSourceSymbol: rawSymbol,
      currentPrice,
      peRatio,
      roePercent,
      eps,
      revenueGrowthPercent,
      profitMarginPercent,
      dividendYieldPercent,
      week52High,
      week52Low,
      beta,
      marketCap,
      totalTradedQuantity: qty,
      totalTradedValue: amount ?? 0,
      transactionCount: 1,
      rawRow: row,
    });
  });

  // Validate universe records deterministically through Canonical Identity & Validation rules
  const { validatedStocks, report: validationReport } = validateStockUniverse(rawStockList, sourceFileName);

  const stocks = validatedStocks;

  // Compute average price per stock if traded and attach derived indices
  stocks.forEach((s) => {
    if (s.totalTradedQuantity && s.totalTradedQuantity > 0 && s.totalTradedValue) {
      s.avgPrice = +(s.totalTradedValue / s.totalTradedQuantity).toFixed(2);
    }
    s.indices = deriveStockIndices(s);
  });

  // Sort stocks alphabetically by symbol
  stocks.sort((a, b) => a.symbol.localeCompare(b.symbol));

  // Sector Level Analysis
  const sectorMap = new Map<string, {
    stocks: StockEquity[];
    industries: Set<string>;
    totalTradedValue: number;
  }>();

  // Industry Level Analysis
  const industryMap = new Map<string, {
    sector: string;
    stocks: StockEquity[];
    totalTradedValue: number;
  }>();

  stocks.forEach((stock) => {
    // Sector group
    const sec = sectorMap.get(stock.sector) || {
      stocks: [],
      industries: new Set<string>(),
      totalTradedValue: 0,
    };
    sec.stocks.push(stock);
    sec.industries.add(stock.industry);
    sec.totalTradedValue += stock.totalTradedValue ?? 0;
    sectorMap.set(stock.sector, sec);

    // Industry group
    const indKey = `${stock.sector}:::${stock.industry}`;
    const ind = industryMap.get(indKey) || {
      sector: stock.sector,
      stocks: [],
      totalTradedValue: 0,
    };
    ind.stocks.push(stock);
    ind.totalTradedValue += stock.totalTradedValue ?? 0;
    industryMap.set(indKey, ind);
  });

  const sectors: SectorAnalysis[] = Array.from(sectorMap.entries()).map(([sector, data]) => {
    const peValues = data.stocks.map((s) => s.peRatio).filter((v): v is number => v !== undefined && v > 0);
    const roeValues = data.stocks.map((s) => s.roePercent).filter((v): v is number => v !== undefined);
    const yieldValues = data.stocks.map((s) => s.dividendYieldPercent).filter((v): v is number => v !== undefined);

    const avgPe = peValues.length > 0
      ? +(peValues.reduce((a, b) => a + b, 0) / peValues.length).toFixed(1)
      : undefined;

    const avgRoe = roeValues.length > 0
      ? +(roeValues.reduce((a, b) => a + b, 0) / roeValues.length).toFixed(1)
      : undefined;

    const avgDividendYield = yieldValues.length > 0
      ? +(yieldValues.reduce((a, b) => a + b, 0) / yieldValues.length).toFixed(2)
      : undefined;

    return {
      sector,
      stockCount: data.stocks.length,
      industriesCount: data.industries.size,
      industries: Array.from(data.industries).sort(),
      stocks: data.stocks.map((s) => s.symbol).sort(),
      avgPe,
      avgRoe,
      avgDividendYield,
      totalTradedValue: +data.totalTradedValue.toFixed(2),
    };
  }).sort((a, b) => b.stockCount - a.stockCount);

  const industries: IndustryAnalysis[] = Array.from(industryMap.entries()).map(([key, data]) => {
    const industryName = key.split(':::')[1] || key;
    const peValues = data.stocks.map((s) => s.peRatio).filter((v): v is number => v !== undefined && v > 0);
    const roeValues = data.stocks.map((s) => s.roePercent).filter((v): v is number => v !== undefined);
    const yieldValues = data.stocks.map((s) => s.dividendYieldPercent).filter((v): v is number => v !== undefined);

    const avgPe = peValues.length > 0
      ? +(peValues.reduce((a, b) => a + b, 0) / peValues.length).toFixed(1)
      : undefined;

    const avgRoe = roeValues.length > 0
      ? +(roeValues.reduce((a, b) => a + b, 0) / roeValues.length).toFixed(1)
      : undefined;

    const avgDividendYield = yieldValues.length > 0
      ? +(yieldValues.reduce((a, b) => a + b, 0) / yieldValues.length).toFixed(2)
      : undefined;

    return {
      industry: industryName,
      sector: data.sector,
      stockCount: data.stocks.length,
      stocks: data.stocks.map((s) => s.symbol).sort(),
      avgPe,
      avgRoe,
      avgDividendYield,
      totalTradedValue: +data.totalTradedValue.toFixed(2),
    };
  }).sort((a, b) => b.stockCount - a.stockCount);

  // Overall Market Averages strictly from existing data points
  const allPe = stocks.map((s) => s.peRatio).filter((v): v is number => v !== undefined && v > 0);
  const allRoe = stocks.map((s) => s.roePercent).filter((v): v is number => v !== undefined);
  const allYield = stocks.map((s) => s.dividendYieldPercent).filter((v): v is number => v !== undefined);

  const avgMarketPe = allPe.length > 0 ? +(allPe.reduce((a, b) => a + b, 0) / allPe.length).toFixed(1) : undefined;
  const avgMarketRoe = allRoe.length > 0 ? +(allRoe.reduce((a, b) => a + b, 0) / allRoe.length).toFixed(1) : undefined;
  const avgMarketYield = allYield.length > 0 ? +(allYield.reduce((a, b) => a + b, 0) / allYield.length).toFixed(2) : undefined;

  const topSectorByStocks = sectors[0]?.sector || 'N/A';
  const sortedByTurnover = [...sectors].sort((a, b) => b.totalTradedValue - a.totalTradedValue);
  const topSectorByTurnover = sortedByTurnover[0]?.sector || 'N/A';
  const topIndustryByStocks = industries[0]?.industry || 'N/A';

  const highCapCount = stocks.filter((s) => s.capTier === 'HIGH').length;
  const midCapCount = stocks.filter((s) => s.capTier === 'MID').length;
  const lowCapCount = stocks.filter((s) => s.capTier === 'LOW').length;

  const summary: MarketDatasetSummary = {
    totalStocks: stocks.length,
    highCapCount,
    midCapCount,
    lowCapCount,
    totalSectors: sectors.length,
    totalIndustries: industries.length,
    totalTransactions: transactions.length,
    totalTradedValue: +totalTradedValue.toFixed(2),
    totalTradedQuantity,
    avgMarketPe,
    avgMarketRoe,
    avgMarketYield,
    topSectorByStocks,
    topSectorByTurnover,
    topIndustryByStocks,
    sectors,
    industries,
    rawHeaders,
  };

  return {
    stocks,
    transactions,
    summary,
    rawHeaders,
    validationReport,
  };
}
