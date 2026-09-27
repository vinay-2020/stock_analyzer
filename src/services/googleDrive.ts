export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

/**
 * Searches Google Drive for files matching a query string
 */
export async function searchDriveFiles(
  accessToken: string,
  query: string
): Promise<DriveFileItem[]> {
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', query);
  url.searchParams.set(
    'fields',
    'files(id, name, mimeType, size, modifiedTime, webViewLink)'
  );
  url.searchParams.set('pageSize', '50');
  url.searchParams.set('orderBy', 'modifiedTime desc');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Specifically attempts to find "All equity details.csv" in user's Drive
 */
export async function findTargetEquityFile(accessToken: string): Promise<DriveFileItem | null> {
  try {
    const query = "trashed = false and (name contains 'equity' or name contains 'details' or name contains 'Equity')";
    const matches = await searchDriveFiles(accessToken, query);
    
    // Look for exact match or close match
    const found = matches.find((f) => {
      const n = f.name.toLowerCase();
      return (n.includes('all') && n.includes('equity') && n.endsWith('.csv')) ||
             (n.includes('equity') && n.includes('details') && n.endsWith('.csv')) ||
             n === 'all_equity_details.csv' ||
             n === 'all equity details.csv';
    });

    return found || matches[0] || null;
  } catch (error) {
    console.error('Error finding target equity file in Drive:', error);
    return null;
  }
}

/**
 * Searches for the 3 historical Parquet datasets in user's Google Drive
 * 1. 01_STOCKS_MARKETCAP_HIGH.parquet
 * 2. 02_STOCKS_MARKETCAP_MID.parquet
 * 3. 03_STOCKS_MARKETCAP_LOW.parquet
 */
export async function findHistoricalParquetFiles(accessToken: string): Promise<{
  high?: DriveFileItem;
  mid?: DriveFileItem;
  low?: DriveFileItem;
  allFound: DriveFileItem[];
}> {
  try {
    const query = "trashed = false and (name contains 'parquet' or name contains 'STOCKS' or name contains 'MARKETCAP' or name contains 'HIGH' or name contains 'MID' or name contains 'LOW')";
    const matches = await searchDriveFiles(accessToken, query);

    const high = matches.find((f) => {
      const n = f.name.toUpperCase();
      return (n.includes('01') || n.includes('HIGH')) && (n.includes('PARQUET') || n.includes('STOCKS') || n.includes('MARKETCAP'));
    });

    const mid = matches.find((f) => {
      const n = f.name.toUpperCase();
      return (n.includes('02') || n.includes('MID')) && (n.includes('PARQUET') || n.includes('STOCKS') || n.includes('MARKETCAP'));
    });

    const low = matches.find((f) => {
      const n = f.name.toUpperCase();
      return (n.includes('03') || n.includes('LOW')) && (n.includes('PARQUET') || n.includes('STOCKS') || n.includes('MARKETCAP'));
    });

    return {
      high,
      mid,
      low,
      allFound: matches,
    };
  } catch (error) {
    console.error('Error searching historical Parquet files in Drive:', error);
    return { allFound: [] };
  }
}

/**
 * Download raw file content as text from Google Drive
 */
export async function downloadFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    fileId
  )}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to download file from Drive (${response.status}): ${errText}`);
  }

  return await response.text();
}

/**
 * Download binary file content as ArrayBuffer from Google Drive (for Parquet files)
 */
export async function downloadFileBinary(
  accessToken: string,
  fileId: string
): Promise<ArrayBuffer> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    fileId
  )}?alt=media`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to download binary file from Drive (${response.status}): ${errText}`);
  }

  return await response.arrayBuffer();
}
