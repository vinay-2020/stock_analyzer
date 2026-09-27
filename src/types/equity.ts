export type MarketCapTier = 'HIGH' | 'MID' | 'LOW';

export type StockValidationStatus =
  | 'VALID'
  | 'INVALID_SYMBOL'
  | 'MISSING_SYMBOL'
  | 'DUPLICATE_SYMBOL'
  | 'UNRESOLVED';

export interface StockValidationDetail {
  recordIndex: number;
  rawIdentifier?: string;
  rawCompany?: string;
  reason: string;
  status: StockValidationStatus;
}

export interface StockValidationReport {
  totalSourceRecords: number;
  validStocks: number;
  invalidSymbols: number;
  missingSymbols: number;
  duplicateSymbols: number;
  duplicateCompanyMappings: number;
  unresolvedRecords: number;
  validationDetails: StockValidationDetail[];
  validatedAt: string;
  sourceFile: string;
}

export interface StockEquity {
  symbol: string; // Verified canonical exchange trading symbol
  companyName: string; // Verified registered company name
  sector: string;
  industry: string;
  indices?: string[];
  capTier: MarketCapTier;
  marketCapRank?: number;
  exchange?: 'NSE' | 'BSE' | string;
  isin?: string;
  internalId?: string; // Internal identifier - NEVER displayed as trading symbol
  validationStatus?: StockValidationStatus;
  validationErrors?: string[];
  rawSourceSymbol?: string; // Preserves unnormalized source value for data fidelity
  currentPrice?: number;
  avgPrice?: number;
  peRatio?: number;
  roePercent?: number;
  eps?: number;
  revenueGrowthPercent?: number;
  profitMarginPercent?: number;
  dividendYieldPercent?: number;
  week52High?: number;
  week52Low?: number;
  marketCap?: string;
  marketCapValue?: number; // In Crores INR
  beta?: number;
  totalTradedQuantity?: number;
  totalTradedValue?: number;
  transactionCount?: number;
  historicalBarsCount?: number;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  rawRow?: Record<string, string>;
}

export interface SectorAnalysis {
  sector: string;
  stockCount: number;
  industriesCount: number;
  industries: string[];
  stocks: string[];
  avgPe?: number;
  avgRoe?: number;
  avgDividendYield?: number;
  totalTradedValue: number;
  totalMarketCapValue?: number;
}

export interface IndustryAnalysis {
  industry: string;
  sector: string;
  stockCount: number;
  stocks: string[];
  avgPe?: number;
  avgRoe?: number;
  avgDividendYield?: number;
  totalTradedValue: number;
}

export interface MarketDatasetSummary {
  totalStocks: number;
  highCapCount: number;
  midCapCount: number;
  lowCapCount: number;
  totalSectors: number;
  totalIndustries: number;
  totalTransactions: number;
  totalTradedValue: number;
  totalTradedQuantity: number;
  avgMarketPe?: number;
  avgMarketRoe?: number;
  avgMarketYield?: number;
  topSectorByStocks: string;
  topSectorByTurnover: string;
  topIndustryByStocks: string;
  sectors: SectorAnalysis[];
  industries: IndustryAnalysis[];
  rawHeaders: string[];
  dataDateRange?: { start: string; end: string };
}

export interface EquityTransaction {
  id: string;
  date: string;
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  action: string;
  quantity: number;
  price: number;
  amount: number;
  fees: number;
  notes?: string;
  rawRow?: Record<string, string>;
}

// ----------------------------------------------------
// CAGR RESEARCH TYPES (15Y / 10Y / 5Y / 3Y)
// ----------------------------------------------------

export type CagrTimeframe = '15Y' | '10Y' | '5Y' | '3Y' | '1Y';

export interface StockCagrRecord {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  capTier: MarketCapTier;
  marketCapRank?: number;
  currentPrice?: number;
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  cagr10Y: number | null;
  cagr15Y: number | null;
  startPrice1Y?: number | null;
  startPrice3Y?: number | null;
  startPrice5Y?: number | null;
  startPrice10Y?: number | null;
  startPrice15Y?: number | null;
  rsiLe30Touches?: number;
  rsi30To35Touches?: number;
  ema100Touches?: number;
  ema200Touches?: number;
  ema400Touches?: number;
  ema500Touches?: number;
  historyYearsAvailable: number;
  dataProvenance: 'VERIFIED_OHLCV' | 'ESTIMATED_CAGR_MODEL' | 'INSUFFICIENT_HISTORY';
  notes?: string;
}

export interface SectorCagrRecord {
  sector: string;
  totalConstituents: number;
  top50ConstituentsUsed: number;
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  cagr10Y: number | null;
  cagr15Y: number | null;
  weightedCagr5Y: number | null;
  top50Symbols: string[];
  totalMarketCapCr: number;
  dataProvenance: 'VERIFIED_OHLCV' | 'ESTIMATED_CAGR_MODEL' | 'INSUFFICIENT_HISTORY';
}

export interface IndustryCagrRecord {
  industry: string;
  sector: string;
  totalConstituents: number;
  top25ConstituentsUsed: number;
  sampleSizeDisclosure: string;
  cagr1Y: number | null;
  cagr3Y: number | null;
  cagr5Y: number | null;
  cagr10Y: number | null;
  cagr15Y: number | null;
  weightedCagr5Y: number | null;
  top25Symbols: string[];
  dataProvenance: 'VERIFIED_OHLCV' | 'ESTIMATED_CAGR_MODEL' | 'INSUFFICIENT_HISTORY';
}

// ----------------------------------------------------
// INDEX CONSTITUENT CONTRIBUTION TYPES
// ----------------------------------------------------

export interface IndexConstituentContribution {
  indexName: string;
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  capTier: MarketCapTier;
  marketCapValue: number;
  estimatedIndexWeightPct: number;
  contribution3Y?: number | null;
  contribution5Y?: number | null;
  return5Y?: number | null;
}

// ----------------------------------------------------
// REBOUND OUTCOME MATRIX TYPES (+10% to +80% across 30D to 220D)
// ----------------------------------------------------

export type ReboundOutcomeTarget = '+10%' | '+20%' | '+30%' | '+40%' | '+50%' | '+75%' | '+80%';
export type ReboundOutcomeWindow = '30D' | '60D' | '90D' | '120D' | '180D' | '220D';

export interface ReboundOutcomeStats {
  symbol: string;
  companyName: string;
  sector: string;
  capTier: MarketCapTier;
  sampleEventCount: number;
  hitRates: Record<ReboundOutcomeTarget, Record<ReboundOutcomeWindow, number | null>>;
  avgDaysToTarget: Record<ReboundOutcomeTarget, number | null>;
  dataProvenance: 'VERIFIED_OHLCV' | 'ESTIMATED_MODEL' | 'PENDING_DATASET';
}

// ----------------------------------------------------
// HISTORICAL CRISIS & CORRECTION ENGINE TYPES
// ----------------------------------------------------

export interface MarketCorrectionEvent {
  id: string;
  name: string;
  historicalPeriodLabel?: string;
  startDate: string;
  peakDate: string;
  troughDate: string;
  recovery5PctDate?: string;
  recoveryPeakDate?: string;
  marketPeak: number;
  marketTrough: number;
  niftyDeclinePct: number;
  daysToTrough: number;
  daysToRecovery5Pct?: number;
  daysToRecoveryPeak?: number;
  recoveryDurationDays?: number;
  maxDrawdownPct: number;
  description: string;
}

export interface StockCorrectionResponse {
  eventId: string;
  eventName: string;
  symbol: string;
  companyName: string;
  sector: string;
  capTier: MarketCapTier;
  priceBeforeCorrection: number;
  lowestPrice: number;
  maxDrawdownPct: number;
  niftyDeclinePct: number;
  relativeDrawdownPct: number;
  relativeDrawdownCategory: 'fell_less' | 'fell_in_line' | 'fell_more';
  lowestRsi: number;
  rsiOversold30Occurred?: boolean;
  rsiOversold35Occurred?: boolean;
  bullishDivergenceOccurred?: boolean;
  ema20Before?: number;
  ema50Before?: number;
  ema100Before?: number;
  ema200Before?: number;
  ema400Before?: number;
  ema500Before?: number;
  rsiBefore?: number;
  distFromEma200BeforePct?: number;
  volatility30DBeforePct?: number;
  distFromEma100AtTroughPct?: number;
  distFromEma200AtTroughPct?: number;
  distFromEma400AtTroughPct?: number;
  distFromEma500AtTroughPct?: number;
  ema100Interacted?: boolean;
  ema200Interacted?: boolean;
  ema400Interacted?: boolean;
  ema500Interacted?: boolean;
  return5D?: number;
  return10D?: number;
  return20D?: number;
  return30D?: number | null;
  return45D?: number;
  return60D?: number | null;
  return90D?: number | null;
  return120D?: number | null;
  return180D?: number | null;
  return220D?: number | null;
  maxReturn60D?: number;
  maxReturn90D?: number;
  maxReturn120D?: number | null;
  maxReturn180D?: number | null;
  maxReturn220D?: number | null;
  daysTo10PctGain?: number | null;
  daysTo20PctGain?: number | null;
  daysTo30PctGain?: number | null;
  daysTo40PctGain?: number | null;
  daysTo50PctGain?: number | null;
  daysTo75PctGain?: number | null;
  daysTo80PctGain?: number | null;
  recoveredPreCorrectionPrice?: boolean;
  daysToRecoverPreCorrectionPrice?: number | null;
  reboundConditionsPresent?: string[];
  overlapsNextCorrection?: boolean;
  overlapDetails?: string;
  isCorporateActionAdjusted?: boolean;
  corporateActionDetails?: string;
  recoverySpeedVsNifty: 'faster_than_nifty' | 'in_line_with_nifty' | 'slower_than_nifty';
  dataQualityStatus: 'complete' | 'insufficient_history';
}

// ----------------------------------------------------
// CLUSTERED INDEPENDENT RSI REBOUND EVENT TYPES
// ----------------------------------------------------

export interface RsiReboundOccurrence {
  date: string; // Primary interaction / start date
  eventStartDate?: string;
  eventEndDate?: string;
  symbol: string;
  companyName?: string;
  sector?: string;
  triggerType: 'RSI_LE_30' | 'RSI_LE_35' | 'RSI_30_TO_35' | 'RSI_CROSS_30' | 'RSI_CROSS_35' | 'RSI_RECOVER_50';
  rsiAtTrigger: number;
  lowestRsi?: number;
  priceAtTrigger: number;
  priceAtEventStart?: number;
  lowestPriceDuringEvent?: number;
  reboundConfirmationDate?: string;
  daysInCondition?: number; // Days spent inside the RSI zone
  lowestSubsequentPrice?: number;
  maxAdverseDrawdownPct?: number | null;
  return5D?: number;
  return10D?: number;
  return20D?: number;
  return30D?: number | null;
  return60D?: number | null;
  return90D?: number | null;
  return120D?: number | null;
  return180D?: number | null;
  return220D?: number | null;
  maxSubsequentRecoveryPct?: number;
  achieved10Pct30D?: boolean;
  achieved20Pct60D?: boolean;
  achieved30Pct90D?: boolean;
  achieved40Pct120D?: boolean;
  achieved50Pct180D?: boolean;
  achieved75Pct220D?: boolean;
  achieved80Pct220D?: boolean;
  dataProvenance?: 'VERIFIED_OHLCV' | 'ESTIMATED_MODEL';
}

export interface RsiAggregateStats {
  symbol: string;
  triggerType: string;
  totalOccurrences: number; // Clustered independent events count (Denominator)
  positive20DCount: number;
  positive20DPct: number;
  positive30DCount: number;
  positive30DPct: number;
  positive60DCount: number;
  positive60DPct: number;
  positive90DCount: number;
  positive90DPct: number;
  hitRate10Pct30D?: number;
  hitRate20Pct60D?: number;
  hitRate30Pct90D?: number;
  hitRate40Pct120D?: number;
  hitRate50Pct180D?: number;
  hitRate75Pct220D?: number;
  hitRate80Pct220D?: number;
  avgReturn20D?: number;
  avgReturn30D?: number;
  avgReturn60D: number;
  avgReturn90D?: number;
  avgReturn120D?: number;
  avgReturn180D?: number;
  avgReturn220D?: number;
  medianReturn60D?: number;
  maxReturn60D?: number;
  minReturn60D?: number;
  stdDevReturn60D: number;
  sampleSizeReliability: 'High (n ≥ 10)' | 'Moderate (5 ≤ n < 10)' | 'Low (n < 5) — observe caution';
}

// ----------------------------------------------------
// RSI DIVERGENCE ENGINE TYPES
// ----------------------------------------------------

export interface RsiDivergenceRecord {
  date: string;
  symbol: string;
  companyName: string;
  sector: string;
  type: 'BULLISH' | 'BEARISH';
  subtype: 'Raw Divergence' | 'Near Oversold (RSI ≤ 35)' | 'Near Long-Term EMA Support';
  priceAtSignal: number;
  rsiAtSignal: number;
  nearEmaLevel?: 'EMA 200' | 'EMA 400' | 'EMA 500';
  return5D?: number;
  return10D?: number;
  return20D?: number;
  return30D?: number;
  return60D?: number;
  return90D?: number;
  return120D?: number | null;
  return180D?: number | null;
  return220D?: number | null;
  maxReturnSubsequentPct?: number;
  maxDrawdownAfterSignalPct?: number;
}

// ----------------------------------------------------
// CLUSTERED INDEPENDENT EMA SUPPORT EVENT TYPES
// ----------------------------------------------------

export interface EmaInteractionRecord {
  date: string;
  eventStartDate?: string;
  firstProximityDate?: string;
  reboundConfirmationDate?: string;
  symbol: string;
  companyName: string;
  sector: string;
  emaPeriod: 20 | 50 | 100 | 200 | 400 | 500;
  emaValue: number;
  priceAtInteraction: number;
  closestDistanceToEma?: number;
  lowestPriceDuringInteraction?: number;
  daysInEmaZone?: number; // Days spent inside the proximity zone
  proximityPct: number;
  bouncedConfirmed: boolean; // Successful support rebound (>= +5%)
  failedBreakdown?: boolean; // Breakdown failure
  maxAdverseExcursionPct: number; // Max drawdown below EMA
  maxSubsequentRecoveryPct?: number;
  return5D?: number;
  return10D?: number;
  return20D?: number;
  return30D?: number | null;
  return60D?: number | null;
  return90D?: number | null;
  return120D?: number | null;
  return180D?: number | null;
  return220D?: number | null;
  dataProvenance?: 'VERIFIED_OHLCV' | 'ESTIMATED_MODEL';
}

export interface EmaAggregateStats {
  symbol: string;
  emaPeriod: 20 | 50 | 100 | 200 | 400 | 500;
  proximityThresholdPct?: number;
  touchCount: number; // Clustered independent events count (Denominator)
  bounceCount: number;
  failureCount?: number;
  bounceSuccessRatePct: number;
  avg30DReturn: number;
  avg60DReturn: number;
  avg90DReturn?: number;
  avgMaxAdverseExcursionPct: number;
}

// ----------------------------------------------------
// CONFLUENCE & TARGET TYPES
// ----------------------------------------------------

export interface ConfluenceRecord {
  id: string;
  name: string;
  symbol: string;
  companyName: string;
  sector: string;
  matchedEventDate: string;
  conditionsMatched: string[];
  score?: number;
  forwardReturn30D?: number | null;
  forwardReturn60D?: number | null;
  forwardReturn90D?: number | null;
  forwardReturn120D?: number | null;
  forwardReturn180D?: number | null;
  forwardReturn220D?: number | null;
  maxDrawdownPostSignalPct?: number;
  maxReboundPct?: number;
  achieved20PctRebound: boolean;
  achieved50PctRebound?: boolean;
}

export interface ReturnTargetMatrixRow {
  symbol: string;
  companyName: string;
  sector: string;
  capTier: MarketCapTier;
  sampleCorrectionEventsCount: number;
  hitRate10Pct20D: number;
  hitRate20Pct30D: number;
  hitRate20Pct60D: number;
  hitRate30Pct60D: number;
  hitRate40Pct90D: number;
  hitRate10Pct30D?: number;
  hitRate30Pct90D?: number;
  hitRate40Pct120D?: number;
  hitRate50Pct180D?: number;
  hitRate75Pct220D?: number;
  hitRate80Pct220D?: number;
  avgDaysTo10Pct?: number;
  avgDaysTo20Pct?: number;
  avgDaysTo30Pct?: number;
  avgDaysTo40Pct?: number;
}

export interface HistoricalOhlcvBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  symbol: string;
}

export interface AiInterpretationResponse {
  success: boolean;
  interpretation?: string;
  error?: string;
  source?: string;
}

export interface FileMetadataState {
  sourceType: 'local_parquet' | 'local_csv' | 'local_upload' | 'benchmark_dataset' | 'google_drive' | 'research_universe';
  fileName: string;
  fileSize?: string;
  rowCount: number;
  loadedAt?: string;
  notes?: string;
}
