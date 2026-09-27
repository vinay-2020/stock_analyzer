import { parquetReadObjects, snappyUncompress } from 'hyparquet';
import { MarketCapTier } from '../types/equity';
import { ingestRawHistoricalRecords } from './historicalDataStore';

export interface ParquetParseResult {
  fileName: string;
  rowCount: number;
  columns: string[];
  stocksIdentified: string[];
  detectedTier?: MarketCapTier;
  dateRange?: { start: string; end: string };
  rawRecords: any[];
  error?: string;
}

/**
 * Parses an ArrayBuffer containing Parquet data using pure JavaScript (hyparquet).
 * Supports Snappy compression.
 */
export async function parseParquetBuffer(
  buffer: ArrayBuffer,
  fileName: string
): Promise<ParquetParseResult> {
  try {
    let rows: any[] = [];

    // hyparquet compressors expect: (input: Uint8Array, outputLength: number) => Uint8Array
    const customCompressors = {
      SNAPPY: (input: Uint8Array, outputLength: number): Uint8Array => {
        const output = new Uint8Array(outputLength);
        snappyUncompress(input, output);
        return output;
      },
    };

    try {
      rows = await parquetReadObjects({
        file: buffer,
        compressors: customCompressors,
      });
    } catch (snappyErr) {
      // Fallback without explicit compressor if snappy was not used or failed
      rows = await parquetReadObjects({
        file: buffer,
      });
    }

    if (!rows || rows.length === 0) {
      return {
        fileName,
        rowCount: 0,
        columns: [],
        stocksIdentified: [],
        rawRecords: [],
        error: 'Parquet file contained 0 rows.',
      };
    }

    // Ingest into historicalDataStore
    const { symbolsLoaded } = ingestRawHistoricalRecords(rows, fileName);

    const firstRow = rows[0];
    const columns = Object.keys(firstRow);

    const dateKey =
      columns.find((c) =>
        /^(date|timestamp|trade_date|datetime)$/i.test(c.trim())
      ) || columns.find((c) => /date/i.test(c));

    let minDate = '';
    let maxDate = '';

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (dateKey && row[dateKey]) {
        const dStr = String(row[dateKey]).slice(0, 10);
        if (!minDate || dStr < minDate) minDate = dStr;
        if (!maxDate || dStr > maxDate) maxDate = dStr;
      }
    }

    // Determine cap tier from filename if matched
    let detectedTier: MarketCapTier = 'HIGH';
    const lowerName = fileName.toLowerCase();
    if (lowerName.includes('low') || lowerName.includes('03_')) {
      detectedTier = 'LOW';
    } else if (lowerName.includes('mid') || lowerName.includes('02_')) {
      detectedTier = 'MID';
    } else {
      detectedTier = 'HIGH';
    }

    return {
      fileName,
      rowCount: rows.length,
      columns,
      stocksIdentified: symbolsLoaded.length > 0 ? symbolsLoaded : [],
      detectedTier,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : undefined,
      rawRecords: rows,
    };
  } catch (err: any) {
    console.error(`Failed to parse Parquet file ${fileName}:`, err);
    return {
      fileName,
      rowCount: 0,
      columns: [],
      stocksIdentified: [],
      rawRecords: [],
      error: `Parquet parsing error: ${err?.message || 'Invalid or unreadable parquet format'}`,
    };
  }
}
