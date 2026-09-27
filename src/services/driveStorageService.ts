import {
  StockEquity,
  StockCagrRecord,
  SectorCagrRecord,
  IndustryCagrRecord,
  IndexConstituentContribution,
  RsiAggregateStats,
  EmaAggregateStats,
} from '../types/equity';
import {
  buildStockCagrDataset,
  calculateSectorCagrDataset,
  calculateIndustryCagrDataset,
  calculateIndexConstituentsDataset,
} from '../engine/quantitativeMath';

export interface StructuredResearchPayload {
  version: string;
  generatedAt: string;
  universeSize: number;
  tables: {
    stocksCagr: StockCagrRecord[];
    sectorCagr: SectorCagrRecord[];
    industryCagr: IndustryCagrRecord[];
    rsiResearchSummary: {
      targetProbabilities: string;
      evaluatedWindows: string[];
      evaluatedTargets: string[];
      oversoldZones: string[];
    };
    emaSupportSummary: {
      monitoredPeriods: number[];
      touchThreshold: string;
      bounceConfirmationRule: string;
      breakdownFailureRule: string;
    };
    indexConstituents: {
      nifty50: IndexConstituentContribution[];
      niftyNext50: IndexConstituentContribution[];
      niftyMidcap150: IndexConstituentContribution[];
      niftySmallcap250: IndexConstituentContribution[];
    };
  };
}

/**
 * Builds the complete structured research database payload for Google Drive storage
 */
export function buildStructuredResearchPayload(stocks: StockEquity[]): StructuredResearchPayload {
  const stocksCagr = buildStockCagrDataset(stocks);
  const sectorCagr = calculateSectorCagrDataset(stocks, stocksCagr);
  const industryCagr = calculateIndustryCagrDataset(stocks, stocksCagr);

  const nifty50 = calculateIndexConstituentsDataset(stocks, 'NIFTY 50');
  const niftyNext50 = calculateIndexConstituentsDataset(stocks, 'NIFTY NEXT 50');
  const niftyMidcap150 = calculateIndexConstituentsDataset(stocks, 'NIFTY MIDCAP 150');
  const niftySmallcap250 = calculateIndexConstituentsDataset(stocks, 'NIFTY SMALLCAP 250');

  return {
    version: '2.0.0-QUANT',
    generatedAt: new Date().toISOString(),
    universeSize: stocks.length,
    tables: {
      stocksCagr,
      sectorCagr,
      industryCagr,
      rsiResearchSummary: {
        targetProbabilities: 'Evaluated empirical hit rates across +10% to +80% returns',
        evaluatedWindows: ['30D', '60D', '90D', '120D', '180D', '220D'],
        evaluatedTargets: ['+10%', '+20%', '+30%', '+40%', '+50%', '+75%', '+80%'],
        oversoldZones: ['RSI ≤ 30 (Deep Oversold)', '30 < RSI ≤ 35 (Near Oversold)'],
      },
      emaSupportSummary: {
        monitoredPeriods: [100, 200, 400, 500],
        touchThreshold: 'Within ±3.0% proximity of EMA line',
        bounceConfirmationRule: 'Rebound ≥ +5.0% without closing below prior swing low',
        breakdownFailureRule: 'Close > 3.0% below EMA without recovery within 10 trading days',
      },
      indexConstituents: {
        nifty50,
        niftyNext50,
        niftyMidcap150,
        niftySmallcap250,
      },
    },
  };
}

/**
 * Saves research payload as a downloadable JSON file or transfers to drive connector
 */
export function downloadStructuredResearchJson(stocks: StockEquity[]) {
  const payload = buildStructuredResearchPayload(stocks);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `STOCKS_ANALYZER_RESEARCH_DATABASE_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Deterministic Query Engine for the AI Assistant / Interpreter
 * Queries structured research tables like a relational database query engine
 */
export function queryStructuredResearch(
  payload: StructuredResearchPayload,
  query: {
    table: 'stocksCagr' | 'sectorCagr' | 'industryCagr' | 'nifty50' | 'summary';
    filterSymbol?: string;
    filterSector?: string;
    filterIndustry?: string;
    minCagr5Y?: number;
    limit?: number;
  }
) {
  const limit = query.limit || 50;

  switch (query.table) {
    case 'stocksCagr': {
      let data = payload.tables.stocksCagr;
      if (query.filterSymbol) {
        data = data.filter((s) => s.symbol.toUpperCase() === query.filterSymbol!.toUpperCase());
      }
      if (query.filterSector) {
        data = data.filter((s) => s.sector.toLowerCase().includes(query.filterSector!.toLowerCase()));
      }
      if (query.minCagr5Y !== undefined) {
        data = data.filter((s) => s.cagr5Y !== null && s.cagr5Y >= query.minCagr5Y!);
      }
      return data.slice(0, limit);
    }
    case 'sectorCagr': {
      let data = payload.tables.sectorCagr;
      if (query.filterSector) {
        data = data.filter((s) => s.sector.toLowerCase().includes(query.filterSector!.toLowerCase()));
      }
      return data.slice(0, limit);
    }
    case 'industryCagr': {
      let data = payload.tables.industryCagr;
      if (query.filterIndustry) {
        data = data.filter((s) => s.industry.toLowerCase().includes(query.filterIndustry!.toLowerCase()));
      }
      if (query.filterSector) {
        data = data.filter((s) => s.sector.toLowerCase().includes(query.filterSector!.toLowerCase()));
      }
      return data.slice(0, limit);
    }
    case 'nifty50': {
      return payload.tables.indexConstituents.nifty50.slice(0, limit);
    }
    case 'summary':
    default: {
      return {
        universeSize: payload.universeSize,
        sectorsCount: payload.tables.sectorCagr.length,
        industriesCount: payload.tables.industryCagr.length,
        rsiSummary: payload.tables.rsiResearchSummary,
        emaSummary: payload.tables.emaSupportSummary,
      };
    }
  }
}
