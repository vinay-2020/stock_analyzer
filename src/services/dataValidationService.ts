import {
  StockEquity,
  StockValidationReport,
  StockValidationStatus,
  StockValidationDetail,
} from '../types/equity';
import { DATA_SOURCE_CONFIG } from '../config/dataSourceConfig';

/**
 * Deterministic Regex pattern to detect synthetic generated IDs:
 * Catches patterns like:
 * - ARIH1002, KALY1070, GUJA1069 (4 uppercase letters followed by 3-4 digits manufactured by scripts)
 * - STOCK_1, STOCK_12, TKR_001
 * - UNKNOWN_1, FAKE_1
 */
const SYNTHETIC_ID_PATTERN = /^(STOCK_\d+|UNKNOWN_\d+|TEMP_\d+|ID_\d+|[A-Z]{3,5}\d{3,5})$/i;

/**
 * Valid Exchange Symbol Pattern for Indian Equities (NSE/BSE):
 * Standard tickers are 1 to 12 uppercase letters/digits/hyphens/ampersand.
 * Examples: RELIANCE, TCS, M&M, BAJAJ-AUTO, 20MICRONS, 3MINDIA.
 */
const VALID_EXCHANGE_SYMBOL_PATTERN = /^[A-Z0-9&-]{1,12}$/;

export interface ValidationInputRecord {
  rawSymbol?: string;
  rawCompany?: string;
  rawExchange?: string;
  rawSector?: string;
  rawIndustry?: string;
  rawIsin?: string;
  rowIndex: number;
  rawRow?: Record<string, string>;
}

/**
 * Deterministically validates an incoming raw record before UI exposure.
 */
export function validateStockRecord(
  input: ValidationInputRecord,
  seenSymbols: Map<string, { companyName: string; rowIndex: number }>,
  seenCompanies: Map<string, { symbol: string; rowIndex: number }>
): {
  status: StockValidationStatus;
  errors: string[];
  canonicalSymbol: string;
  canonicalCompany: string;
} {
  const errors: string[] = [];
  const rawSymbol = (input.rawSymbol || '').trim();
  const rawCompany = (input.rawCompany || '').trim();

  // 1. Missing Symbol Check
  if (!rawSymbol) {
    errors.push('Missing trading symbol in source data.');
    return {
      status: 'MISSING_SYMBOL',
      errors,
      canonicalSymbol: '[MISSING SYMBOL]',
      canonicalCompany: rawCompany || '[UNKNOWN COMPANY]',
    };
  }

  // 2. Synthetic / Manufactured ID Check
  if (SYNTHETIC_ID_PATTERN.test(rawSymbol)) {
    errors.push(
      `Symbol "${rawSymbol}" matches a synthetic or manufactured internal identifier pattern.`
    );
    return {
      status: 'INVALID_SYMBOL',
      errors,
      canonicalSymbol: `[INVALID: ${rawSymbol}]`,
      canonicalCompany: rawCompany || '[UNKNOWN COMPANY]',
    };
  }

  // 3. Format & Character Validity
  const upperSymbol = rawSymbol.toUpperCase();
  if (upperSymbol.length > DATA_SOURCE_CONFIG.maxSymbolLength) {
    errors.push(`Symbol length (${upperSymbol.length}) exceeds maximum allowable exchange limit.`);
  }
  if (!VALID_EXCHANGE_SYMBOL_PATTERN.test(upperSymbol)) {
    errors.push(`Symbol contains invalid characters. Must adhere to exchange standards ([A-Z0-9&-]).`);
  }

  // 4. Missing Company Name Check
  if (!rawCompany) {
    errors.push('Missing canonical company name in source data.');
  }

  // 5. Duplicate Symbol Check
  if (seenSymbols.has(upperSymbol)) {
    const existing = seenSymbols.get(upperSymbol)!;
    if (existing.companyName.toLowerCase() !== rawCompany.toLowerCase()) {
      errors.push(
        `Duplicate symbol "${upperSymbol}" maps to conflicting companies: "${existing.companyName}" (Row ${existing.rowIndex}) vs "${rawCompany}" (Row ${input.rowIndex}).`
      );
      return {
        status: 'DUPLICATE_SYMBOL',
        errors,
        canonicalSymbol: upperSymbol,
        canonicalCompany: rawCompany,
      };
    }
  }

  // 6. Duplicate Company Mapping Check
  if (rawCompany && seenCompanies.has(rawCompany.toLowerCase())) {
    const existing = seenCompanies.get(rawCompany.toLowerCase())!;
    if (existing.symbol !== upperSymbol) {
      errors.push(
        `Company "${rawCompany}" is mapped to multiple symbols: "${existing.symbol}" (Row ${existing.rowIndex}) and "${upperSymbol}" (Row ${input.rowIndex}).`
      );
    }
  }

  if (errors.length > 0) {
    return {
      status: 'INVALID_SYMBOL',
      errors,
      canonicalSymbol: `[INVALID: ${upperSymbol}]`,
      canonicalCompany: rawCompany || '[UNKNOWN COMPANY]',
    };
  }

  return {
    status: 'VALID',
    errors: [],
    canonicalSymbol: upperSymbol,
    canonicalCompany: rawCompany,
  };
}

/**
 * Validates a batch of parsed stock records and generates a comprehensive deterministic report.
 */
export function validateStockUniverse(
  rawStocks: StockEquity[],
  sourceFileName = 'csv_files/ALL EQUITY DETAILS.CSV'
): {
  validatedStocks: StockEquity[];
  report: StockValidationReport;
} {
  const seenSymbols = new Map<string, { companyName: string; rowIndex: number }>();
  const seenCompanies = new Map<string, { symbol: string; rowIndex: number }>();
  const validationDetails: StockValidationDetail[] = [];

  let validCount = 0;
  let invalidSymbolCount = 0;
  let missingSymbolCount = 0;
  let duplicateSymbolCount = 0;
  let duplicateCompanyCount = 0;
  let unresolvedCount = 0;

  const validatedStocks: StockEquity[] = rawStocks.map((stock, idx) => {
    const rowIndex = idx + 1;
    const validation = validateStockRecord(
      {
        rawSymbol: stock.rawSourceSymbol || stock.symbol,
        rawCompany: stock.companyName,
        rawExchange: stock.exchange,
        rawSector: stock.sector,
        rawIndustry: stock.industry,
        rawIsin: stock.isin,
        rowIndex,
        rawRow: stock.rawRow,
      },
      seenSymbols,
      seenCompanies
    );

    if (validation.status === 'VALID') {
      validCount++;
      seenSymbols.set(validation.canonicalSymbol, {
        companyName: validation.canonicalCompany,
        rowIndex,
      });
      if (validation.canonicalCompany) {
        seenCompanies.set(validation.canonicalCompany.toLowerCase(), {
          symbol: validation.canonicalSymbol,
          rowIndex,
        });
      }
    } else {
      if (validation.status === 'MISSING_SYMBOL') missingSymbolCount++;
      if (validation.status === 'INVALID_SYMBOL') invalidSymbolCount++;
      if (validation.status === 'DUPLICATE_SYMBOL') duplicateSymbolCount++;
      if (validation.status === 'UNRESOLVED') unresolvedCount++;

      validationDetails.push({
        recordIndex: rowIndex,
        rawIdentifier: stock.rawSourceSymbol || stock.symbol,
        rawCompany: stock.companyName,
        reason: validation.errors.join('; '),
        status: validation.status,
      });
    }

    return {
      ...stock,
      symbol: validation.status === 'VALID' ? validation.canonicalSymbol : stock.symbol,
      companyName: validation.canonicalCompany,
      rawSourceSymbol: stock.rawSourceSymbol || stock.symbol,
      internalId: stock.internalId || `INTERNAL_${rowIndex}`,
      validationStatus: validation.status,
      validationErrors: validation.errors,
    };
  });

  const report: StockValidationReport = {
    totalSourceRecords: rawStocks.length,
    validStocks: validCount,
    invalidSymbols: invalidSymbolCount,
    missingSymbols: missingSymbolCount,
    duplicateSymbols: duplicateSymbolCount,
    duplicateCompanyMappings: duplicateCompanyCount,
    unresolvedRecords: unresolvedCount + invalidSymbolCount + missingSymbolCount,
    validationDetails,
    validatedAt: new Date().toISOString(),
    sourceFile: sourceFileName,
  };

  return {
    validatedStocks,
    report,
  };
}
