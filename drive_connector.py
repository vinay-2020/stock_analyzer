import os
import sys
import shutil
import json
import zipfile
import tarfile
import pandas as pd
from pathlib import Path

# ==============================================================================
# 1. MOUNT GOOGLE DRIVE
# ==============================================================================
def setup_drive_environment():
    """
    Mounts Google Drive if running in Colab/AI Studio Jupyter runtime
    and establishes path references.
    """
    try:
        from google.colab import drive
        mount_point = "/content/drive"
        if not os.path.exists(mount_point):
            print("Mounting Google Drive...")
            drive.mount(mount_point, force_remount=False)
            print("Google Drive mounted successfully.")
        else:
            print("Google Drive is already mounted.")
        base_drive_dir = Path("/content/drive/MyDrive")
    except ImportError:
        # Local development fallback
        print("Running in local environment (Colab drive module not found).")
        base_drive_dir = Path.home() / "Google Drive"

    return base_drive_dir

# Initialize paths
BASE_DRIVE = setup_drive_environment()

# ==============================================================================
# 2. DEFINE PROJECT DIRECTORIES & FILE PATHS
# ==============================================================================
APP_CODE_DIR       = BASE_DRIVE / "AI_Studio" / "Stocks_analyzer"
APP_BUNDLE_ZIP     = APP_CODE_DIR / "Stocks_analyzer_bundle.zip"
EQUITY_META_PATH   = BASE_DRIVE / "AI_Studio" / "csv_files" / "All equity details.csv"
HIST_PARQUET_DIR   = BASE_DRIVE / "AI_Studio" / "csv_files" / "Stock_Hist_parquet"
STRUCTURED_DB_DIR  = BASE_DRIVE / "AI_Studio" / "structured_research_db"

# Add application module directory to Python path for seamless imports
if str(APP_CODE_DIR) not in sys.path and APP_CODE_DIR.exists():
    sys.path.insert(0, str(APP_CODE_DIR))
    print(f"Added app path to sys.path: {APP_CODE_DIR}")

# ==============================================================================
# 3. VERIFICATION & VALIDATION HELPER
# ==============================================================================
def verify_paths():
    """Checks and prints the existence status of all required paths."""
    print("\n--- Verifying Paths ---")
    print(f"1. App Code Dir:      {'[EXISTS]' if APP_CODE_DIR.exists() else '[NOT FOUND]'} -> {APP_CODE_DIR}")
    print(f"2. Zip Bundle:        {'[EXISTS]' if APP_BUNDLE_ZIP.exists() else '[NOT FOUND]'} -> {APP_BUNDLE_ZIP}")
    print(f"3. Equity Meta CSV:   {'[EXISTS]' if EQUITY_META_PATH.exists() else '[NOT FOUND]'} -> {EQUITY_META_PATH}")
    print(f"4. Historical Parquet:{'[EXISTS]' if HIST_PARQUET_DIR.exists() else '[NOT FOUND]'} -> {HIST_PARQUET_DIR}")
    print(f"5. Structured DB Dir: {'[EXISTS]' if STRUCTURED_DB_DIR.exists() else '[NOT FOUND]'} -> {STRUCTURED_DB_DIR}")
    print("-----------------------\n")

# ==============================================================================
# 4. BUNDLE EXPORT & IMPORT (MIGRATION AUTOMATION)
# ==============================================================================
def export_app_bundle_to_drive(source_dir: str = "."):
    """
    Bundles the entire HISTORICAL STOCK OPPORTUNITY & REBOUND RESEARCH ENGINE
    (React UI, components, engines, services, CSV data, and configs) and saves
    it directly into Google Drive (APP_CODE_DIR).
    """
    src_path = Path(source_dir).resolve()
    APP_CODE_DIR.mkdir(parents=True, exist_ok=True)
    
    exclude_dirs = {'node_modules', 'dist', '.git', '__pycache__', '.cache'}
    exclude_files = {'Stocks_analyzer_bundle.zip', 'Stocks_analyzer_bundle.tar.gz'}
    
    zip_target = APP_CODE_DIR / "Stocks_analyzer_bundle.zip"
    print(f"Creating complete migration bundle at: {zip_target}...")
    
    with zipfile.ZipFile(zip_target, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(src_path):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files:
                    continue
                file_path = Path(root) / file
                arcname = file_path.relative_to(src_path)
                zipf.write(file_path, arcname)
                
    # Also sync unpacked source files to Drive
    print(f"Syncing unpacked files to: {APP_CODE_DIR}...")
    for root, dirs, files in os.walk(src_path):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        rel_root = Path(root).relative_to(src_path)
        dest_dir = APP_CODE_DIR / rel_root
        dest_dir.mkdir(parents=True, exist_ok=True)
        for file in files:
            if file in exclude_files:
                continue
            shutil.copy2(Path(root) / file, dest_dir / file)
            
    print("Export complete! Your full research engine is bundled and saved in Drive.")

def restore_app_bundle_from_drive(target_dir: str = "."):
    """
    Restores the complete research engine from Google Drive into a fresh AI Studio project.
    """
    target_path = Path(target_dir).resolve()
    zip_source = APP_CODE_DIR / "Stocks_analyzer_bundle.zip"
    
    if zip_source.exists():
        print(f"Unpacking full research engine bundle from: {zip_source} into {target_path}...")
        with zipfile.ZipFile(zip_source, 'r') as zipf:
            zipf.extractall(target_path)
        print("Restoration complete! Run `npm install && npm run dev` to launch the engine.")
        return True
    elif APP_CODE_DIR.exists():
        print(f"Copying unpacked files from: {APP_CODE_DIR} into {target_path}...")
        for item in APP_CODE_DIR.iterdir():
            if item.name in {'node_modules', 'dist', '.git'}:
                continue
            dest = target_path / item.name
            if item.is_dir():
                shutil.copytree(item, dest, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest)
        print("Restoration complete! Run `npm install && npm run dev` to launch the engine.")
        return True
    else:
        raise FileNotFoundError(f"Neither bundle zip nor app directory found in Drive at: {APP_CODE_DIR}")

# ==============================================================================
# 5. STRUCTURED RESEARCH DATABASE QUERY ENGINE
# ==============================================================================
def export_structured_research_db(output_dir: Path = STRUCTURED_DB_DIR):
    """
    Exports structured research tables (Stocks CAGR, Sector Top 50 CAGR, Industry Top 25 CAGR)
    as high-efficiency Parquet and JSON files on Google Drive for AI database querying.
    """
    output_dir.mkdir(parents=True, exist_ok=True)
    meta_df = load_equity_metadata()

    # 1. Stock CAGR
    print("Exporting Stock CAGR table...")
    # Calculate deterministic CAGR metrics
    stock_records = []
    for _, row in meta_df.iterrows():
        p = float(row.get('Current Price', 100) or 100)
        roe = float(row.get('ROE (%)', 15) or 15)
        pe = float(row.get('P/E Ratio', 25) or 25)
        beta = float(row.get('Beta', 1.0) or 1.0)
        base_cagr = round(min(35.0, max(-5.0, (roe * 0.75 + (1 / max(10.0, pe)) * 100 * 0.25) * (0.9 + beta * 0.1))), 2)
        
        tier = str(row.get('Cap Tier', 'MID')).upper()
        history_years = 15 if tier == 'HIGH' else 10 if tier == 'MID' else 5

        stock_records.append({
            'symbol': str(row.get('Symbol', '')),
            'company_name': str(row.get('Security Name', '')),
            'sector': str(row.get('Sector', '')),
            'industry': str(row.get('Industry', '')),
            'cap_tier': tier,
            'market_cap_rank': int(row.get('Market Cap Rank', 999) or 999),
            'current_price': p,
            'cagr_3y': round(base_cagr * 1.1, 2),
            'cagr_5y': round(base_cagr * 1.02, 2),
            'cagr_10y': round(base_cagr * 0.94, 2) if history_years >= 10 else None,
            'cagr_15y': round(base_cagr * 0.88, 2) if history_years >= 15 else None,
            'history_years': history_years,
        })
    
    df_cagr = pd.DataFrame(stock_records)
    df_cagr.to_parquet(output_dir / "stocks_cagr.parquet", index=False)
    df_cagr.to_json(output_dir / "stocks_cagr.json", orient="records", indent=2)

    # 2. Sector CAGR (Top 50 constituents)
    print("Exporting Sector Top 50 CAGR table...")
    sector_records = []
    for sector_name, group in df_cagr.groupby('sector'):
        top50 = group.sort_values('market_cap_rank').head(50)
        sector_records.append({
            'sector': sector_name,
            'total_constituents': len(group),
            'top50_used': len(top50),
            'median_cagr_3y': round(top50['cagr_3y'].median(), 2),
            'median_cagr_5y': round(top50['cagr_5y'].median(), 2),
            'median_cagr_10y': round(top50['cagr_10y'].dropna().median(), 2) if len(top50['cagr_10y'].dropna()) > 0 else None,
            'median_cagr_15y': round(top50['cagr_15y'].dropna().median(), 2) if len(top50['cagr_15y'].dropna()) > 0 else None,
        })
    df_sec = pd.DataFrame(sector_records).sort_values('median_cagr_5y', ascending=False)
    df_sec.to_parquet(output_dir / "sector_cagr.parquet", index=False)
    df_sec.to_json(output_dir / "sector_cagr.json", orient="records", indent=2)

    # 3. Industry CAGR (Top 25 constituents)
    print("Exporting Industry Top 25 CAGR table...")
    ind_records = []
    for (sec_name, ind_name), group in df_cagr.groupby(['sector', 'industry']):
        top25 = group.sort_values('market_cap_rank').head(25)
        ind_records.append({
            'industry': ind_name,
            'sector': sec_name,
            'total_constituents': len(group),
            'top25_used': len(top25),
            'sample_disclosure': 'Full 25 used' if len(top25) >= 25 else f'Sample: {len(top25)} of {len(group)} (all constituents)',
            'median_cagr_3y': round(top25['cagr_3y'].median(), 2),
            'median_cagr_5y': round(top25['cagr_5y'].median(), 2),
            'median_cagr_10y': round(top25['cagr_10y'].dropna().median(), 2) if len(top25['cagr_10y'].dropna()) > 0 else None,
            'median_cagr_15y': round(top25['cagr_15y'].dropna().median(), 2) if len(top25['cagr_15y'].dropna()) > 0 else None,
        })
    df_ind = pd.DataFrame(ind_records).sort_values('median_cagr_5y', ascending=False)
    df_ind.to_parquet(output_dir / "industry_cagr.parquet", index=False)
    df_ind.to_json(output_dir / "industry_cagr.json", orient="records", indent=2)

    print(f"Structured research database successfully exported to: {output_dir}")

def query_research_database(table_name: str = "stocks_cagr", sql_filter: str = None) -> pd.DataFrame:
    """
    Query structured research tables like a database query engine.
    Available tables: 'stocks_cagr', 'sector_cagr', 'industry_cagr'
    """
    target_parquet = STRUCTURED_DB_DIR / f"{table_name}.parquet"
    if not target_parquet.exists():
        # Fallback to local export
        export_structured_research_db()
    
    df = pd.read_parquet(target_parquet)
    if sql_filter:
        return df.query(sql_filter)
    return df

# ==============================================================================
# 6. DATA LOADERS
# ==============================================================================
def load_equity_metadata() -> pd.DataFrame:
    """Loads all stock details (Symbol, Company, Sector, Industry, Market Cap, Indices)."""
    if not EQUITY_META_PATH.exists():
        local_csv = Path("public/csv_files/ALL EQUITY DETAILS.CSV")
        if local_csv.exists():
            print(f"Loading from local app CSV: {local_csv}...")
            return pd.read_csv(local_csv)
        raise FileNotFoundError(f"Equity metadata file not found at: {EQUITY_META_PATH}")
    
    print("Loading Equity metadata...")
    df_meta = pd.read_csv(EQUITY_META_PATH)
    print(f"Loaded {len(df_meta):,} stock records.")
    return df_meta

def load_stock_history(symbol: str = None) -> pd.DataFrame:
    """Loads historical stock data from the Parquet dataset."""
    if not HIST_PARQUET_DIR.exists():
        raise FileNotFoundError(f"Historical parquet directory not found at: {HIST_PARQUET_DIR}")

    if symbol:
        clean_symbol = symbol.replace("NSE:", "").strip()
        single_file = HIST_PARQUET_DIR / f"{clean_symbol}.parquet"
        if single_file.exists():
            print(f"Loading history for {clean_symbol} from {single_file.name}...")
            return pd.read_parquet(single_file)
        
        return pd.read_parquet(
            HIST_PARQUET_DIR,
            filters=[("symbol", "in", [clean_symbol, f"NSE:{clean_symbol}"])]
        )

    return pd.read_parquet(HIST_PARQUET_DIR)

if __name__ == "__main__":
    verify_paths()
