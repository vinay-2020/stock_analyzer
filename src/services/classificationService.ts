import { StockEquity, MarketCapTier } from '../types/equity';

/**
 * Derives index memberships deterministically from the ALL EQUITY DETAILS.CSV registry dataset.
 * Combines any explicit index labels present in the raw data with benchmark index tiers
 * and standard NSE sectoral indices derived from sector & industry classifications.
 */
export function deriveStockIndices(stock: {
  symbol: string;
  sector: string;
  industry: string;
  capTier: MarketCapTier;
  marketCapRank?: number;
  indices?: string[];
}): string[] {
  const result = new Set<string>();

  // 1. Include any explicit raw indices already present in the dataset
  if (stock.indices && Array.isArray(stock.indices)) {
    stock.indices.forEach((idx) => {
      if (idx && idx.trim()) result.add(idx.trim().toUpperCase());
    });
  }

  const rank = stock.marketCapRank || 999;
  const tier = stock.capTier;
  const sector = stock.sector || '';
  const industry = stock.industry || '';

  // 2. Benchmark Market-Cap Indices (Official NSE bands: Top 750 stocks only)
  // Stocks with rank > 750 or unindexed equities do NOT belong to any benchmark index.
  if (rank <= 750) {
    result.add('NIFTY TOTAL MARKET');
  }

  // Top 500 stocks belong to NIFTY 500
  if (rank <= 500) {
    result.add('NIFTY 500');
  }

  if (rank <= 50) {
    result.add('NIFTY 50');
    result.add('NIFTY 100');
  } else if (rank <= 100) {
    result.add('NIFTY NEXT 50');
    result.add('NIFTY 100');
  } else if (rank <= 250) {
    result.add('NIFTY MIDCAP 150');
    if (rank <= 200) {
      result.add('NIFTY MIDCAP 100');
    }
  } else if (rank <= 500) {
    result.add('NIFTY SMALLCAP 250');
    if (rank <= 350) {
      result.add('NIFTY SMALLCAP 100');
    }
  } else if (rank <= 750) {
    result.add('NIFTY MICROCAP 250');
  }
  // Ranks 751-1,120: Not part of any benchmark index (Unindexed Equities)

  // 3. Sectoral & Thematic Indices derived from ALL EQUITY DETAILS.CSV classifications
  // Sectoral indices only apply to stocks within the active index universe (rank <= 750)
  if (rank <= 750) {
    const secLower = sector.toLowerCase();
    const indLower = industry.toLowerCase();

    if (secLower.includes('financial') || secLower.includes('finance')) {
      result.add('NIFTY FINANCIAL SERVICES');
      if (indLower.includes('bank')) {
        result.add('NIFTY BANK');
        if (indLower.includes('private')) {
          result.add('NIFTY PRIVATE BANK');
        } else if (indLower.includes('public') || indLower.includes('psu')) {
          result.add('NIFTY PSU BANK');
        }
      }
    } else if (secLower.includes('information tech') || secLower.includes('technology') || secLower === 'it') {
      result.add('NIFTY IT');
    } else if (secLower.includes('auto')) {
      result.add('NIFTY AUTO');
    } else if (secLower.includes('pharma') || secLower.includes('health')) {
      result.add('NIFTY PHARMA');
      result.add('NIFTY HEALTHCARE');
    } else if (secLower.includes('fmcg') || secLower.includes('fast moving') || secLower.includes('consumer goods')) {
      result.add('NIFTY FMCG');
    } else if (secLower.includes('metal') || secLower.includes('mining')) {
      result.add('NIFTY METAL');
    } else if (secLower.includes('oil') || secLower.includes('gas')) {
      result.add('NIFTY OIL & GAS');
      result.add('NIFTY ENERGY');
    } else if (secLower.includes('power') || secLower.includes('utilit')) {
      result.add('NIFTY ENERGY');
    } else if (secLower.includes('infra') || secLower.includes('construction') || secLower.includes('capital goods')) {
      result.add('NIFTY INFRA');
    } else if (secLower.includes('realt') || secLower.includes('real estate')) {
      result.add('NIFTY REALTY');
    } else if (secLower.includes('durables') || secLower.includes('consumer services')) {
      result.add('NIFTY CONSUMER DURABLES');
      result.add('NIFTY INDIA CONSUMPTION');
    } else if (secLower.includes('chemical') || secLower.includes('materials') || secLower.includes('packaging')) {
      result.add('NIFTY COMMODITIES');
    }
  }

  return Array.from(result).sort();
}

export interface IndexSummary {
  name: string;
  type: 'BENCHMARK' | 'SECTORAL' | 'THEMATIC' | 'BROAD_UNIVERSE' | 'UNINDEXED';
  stockCount: number;
  sectorsCount: number;
  industriesCount: number;
  sectors: string[];
  industries: string[];
  stocks: StockEquity[];
}

export interface SectorSummary {
  name: string;
  stockCount: number;
  industriesCount: number;
  industries: string[];
  indices: string[];
  stocks: StockEquity[];
}

export interface IndustrySummary {
  name: string;
  sector: string;
  stockCount: number;
  indices: string[];
  stocks: StockEquity[];
}

export interface StockClassificationSummary {
  stock: StockEquity;
  sector: string;
  industry: string;
  indices: string[];
  peersInIndustry: StockEquity[];
  peersInSector: StockEquity[];
}

/**
 * Highly optimized, in-memory classification & navigation index.
 * Built dynamically from the active stock universe.
 */
export function buildUniverseClassificationIndex(rawStocks: StockEquity[]) {
  // Ensure every stock has derived indices
  const stocks = rawStocks.map((s) => {
    const indices = s.indices && s.indices.length > 0 ? s.indices : deriveStockIndices(s);
    return {
      ...s,
      indices,
    };
  });

  const indexMap = new Map<string, { stocks: StockEquity[]; sectors: Set<string>; industries: Set<string> }>();
  const sectorMap = new Map<string, { stocks: StockEquity[]; industries: Set<string>; indices: Set<string> }>();
  const industryMap = new Map<string, { sector: string; stocks: StockEquity[]; indices: Set<string> }>();
  const stockLookup = new Map<string, StockEquity>();

  stocks.forEach((stock) => {
    stockLookup.set(stock.symbol.toUpperCase(), stock);

    const sector = stock.sector || 'Unclassified Sector';
    const industry = stock.industry || 'General';
    const indices = stock.indices || [];

    // Populate sector map
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, { stocks: [], industries: new Set(), indices: new Set() });
    }
    const secEntry = sectorMap.get(sector)!;
    secEntry.stocks.push(stock);
    secEntry.industries.add(industry);
    indices.forEach((idx) => secEntry.indices.add(idx));

    // Populate industry map
    if (!industryMap.has(industry)) {
      industryMap.set(industry, { sector, stocks: [], indices: new Set() });
    }
    const indEntry = industryMap.get(industry)!;
    indEntry.stocks.push(stock);
    indices.forEach((idx) => indEntry.indices.add(idx));

    // Populate index map
    if (indices && indices.length > 0) {
      indices.forEach((idx) => {
        if (!indexMap.has(idx)) {
          indexMap.set(idx, { stocks: [], sectors: new Set(), industries: new Set() });
        }
        const idxEntry = indexMap.get(idx)!;
        idxEntry.stocks.push(stock);
        idxEntry.sectors.add(sector);
        idxEntry.industries.add(industry);
      });
    } else {
      // Collect all stocks that do NOT belong to any indices
      const unindexedLabel = 'UNINDEXED EQUITIES (Not in Any Benchmark)';
      if (!indexMap.has(unindexedLabel)) {
        indexMap.set(unindexedLabel, { stocks: [], sectors: new Set(), industries: new Set() });
      }
      const uEntry = indexMap.get(unindexedLabel)!;
      uEntry.stocks.push(stock);
      uEntry.sectors.add(sector);
      uEntry.industries.add(industry);
    }

    // Comprehensive universe collection containing all stocks regardless of indices
    const allUniverseLabel = 'ALL EQUITIES (Complete Universe)';
    if (!indexMap.has(allUniverseLabel)) {
      indexMap.set(allUniverseLabel, { stocks: [], sectors: new Set(), industries: new Set() });
    }
    const allEntry = indexMap.get(allUniverseLabel)!;
    allEntry.stocks.push(stock);
    allEntry.sectors.add(sector);
    allEntry.industries.add(industry);
  });

  // Convert to sorted summaries
  const indicesList: IndexSummary[] = Array.from(indexMap.entries())
    .map(([name, data]) => {
      let type: 'BENCHMARK' | 'SECTORAL' | 'THEMATIC' | 'BROAD_UNIVERSE' | 'UNINDEXED' = 'SECTORAL';
      if (name.startsWith('ALL EQUITIES')) {
        type = 'BROAD_UNIVERSE';
      } else if (name.startsWith('UNINDEXED')) {
        type = 'UNINDEXED';
      } else if (
        name.includes('50') ||
        name.includes('100') ||
        name.includes('150') ||
        name.includes('250') ||
        name.includes('500') ||
        name.includes('TOTAL')
      ) {
        type = 'BENCHMARK';
      } else if (name.includes('CONSUMPTION') || name.includes('COMMODITIES') || name.includes('HEALTHCARE')) {
        type = 'THEMATIC';
      }

      return {
        name,
        type,
        stockCount: data.stocks.length,
        sectorsCount: data.sectors.size,
        industriesCount: data.industries.size,
        sectors: Array.from(data.sectors).sort(),
        industries: Array.from(data.industries).sort(),
        stocks: data.stocks.sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999)),
      };
    })
    .sort((a, b) => {
      // BROAD_UNIVERSE first, then BENCHMARK, then SECTORAL, then THEMATIC, then UNINDEXED
      const typePriority: Record<string, number> = {
        BROAD_UNIVERSE: 1,
        BENCHMARK: 2,
        SECTORAL: 3,
        THEMATIC: 4,
        UNINDEXED: 5,
      };
      const pA = typePriority[a.type] || 99;
      const pB = typePriority[b.type] || 99;
      if (pA !== pB) return pA - pB;
      return b.stockCount - a.stockCount || a.name.localeCompare(b.name);
    });

  const sectorsList: SectorSummary[] = Array.from(sectorMap.entries())
    .map(([name, data]) => ({
      name,
      stockCount: data.stocks.length,
      industriesCount: data.industries.size,
      industries: Array.from(data.industries).sort(),
      indices: Array.from(data.indices).sort(),
      stocks: data.stocks.sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999)),
    }))
    .sort((a, b) => b.stockCount - a.stockCount || a.name.localeCompare(b.name));

  const industriesList: IndustrySummary[] = Array.from(industryMap.entries())
    .map(([name, data]) => ({
      name,
      sector: data.sector,
      stockCount: data.stocks.length,
      indices: Array.from(data.indices).sort(),
      stocks: data.stocks.sort((a, b) => (a.marketCapRank || 999) - (b.marketCapRank || 999)),
    }))
    .sort((a, b) => b.stockCount - a.stockCount || a.name.localeCompare(b.name));

  return {
    stocks,
    stockLookup,
    indicesList,
    sectorsList,
    industriesList,
    indexMap,
    sectorMap,
    industryMap,
  };
}
