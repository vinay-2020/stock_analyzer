/**
 * DATA_SOURCE_CONFIG
 * 
 * CORE ARCHITECTURAL PRINCIPLE:
 * DATA MUST REMAIN SEPARATE FROM THE APPLICATION.
 * 
 * This configuration establishes portable, relative paths for all data sources.
 * It contains NO hardcoded Google Drive paths, Windows user folders,
 * temporary AI Studio paths, or session-specific file IDs.
 */

export interface DataSourceConfiguration {
  /** Relative URL / path to the default stock universe CSV */
  stockUniverseCsvRelativeUrl: string;
  /** Primary file name expected for the stock universe registry */
  stockUniverseFileName: string;
  /** Relative folder for portable CSV datasets */
  dataDirectory: string;
  /** Supported exchange identifiers */
  supportedExchanges: readonly string[];
  /** Allowed MIME types for uploaded datasets */
  allowedMimeTypes: readonly string[];
  /** Maximum allowable symbol length according to exchange rules (NSE/BSE max 12) */
  maxSymbolLength: number;
  /** Minimum allowable symbol length */
  minSymbolLength: number;
  /** Validation rules toggle */
  enforceStrictExchangeSymbols: boolean;
}

export const DATA_SOURCE_CONFIG: DataSourceConfiguration = {
  stockUniverseCsvRelativeUrl: '/csv_files/ALL%20EQUITY%20DETAILS.CSV',
  stockUniverseFileName: 'ALL EQUITY DETAILS.CSV',
  dataDirectory: 'csv_files',
  supportedExchanges: ['NSE', 'BSE'],
  allowedMimeTypes: [
    'text/csv',
    'application/vnd.ms-excel',
    'text/plain',
    'application/octet-stream',
  ],
  maxSymbolLength: 14, // NSE symbol format (max 10-12 chars + optional series)
  minSymbolLength: 1,
  enforceStrictExchangeSymbols: true,
};

/**
 * Normalizes any provided relative or external file path into a clean, portable path.
 * Strips any machine-specific Windows/Unix/Drive prefixes.
 */
export function getPortableDataPath(filePath: string): string {
  if (!filePath) return DATA_SOURCE_CONFIG.stockUniverseCsvRelativeUrl;
  // Strip Windows drives like C:\, D:\
  let cleaned = filePath.replace(/^[A-Za-z]:[\\/]/, '');
  // Strip absolute user paths or Drive paths
  cleaned = cleaned.replace(/^.*[\\/]csv_files[\\/]/, 'csv_files/');
  return cleaned;
}
