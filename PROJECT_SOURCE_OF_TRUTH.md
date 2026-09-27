# Institutional Indian Equity Research Engine — Project Source of Truth

**Document Version:** 2.0.0 (Portability & Data Integrity Release)  
**Classification:** Authoritative Technical Specification & Canonical Identity Reference  

---

## A. Project Purpose
The **Institutional Indian Equity Research Engine** is a high-performance quantitative decision-support system built for Indian equities (NSE & BSE). The platform provides empirical analysis across four historical market crash cycles (2020 Q1, 2021–2022, 2022–2023, and 2024 Q3–Q4). It tracks trough drawdown, recovery speed, RSI oversold rebound patterns, exponential moving average interactions (EMA 100/200/400/500), multi-factor confluence events, and systematic 10%–40% forward return probabilities across a 1,120-stock universe.

A dedicated **Stock Classification & Universe Navigation Engine** enables bidirectional hierarchy traversal across benchmark indices, broad sectors, granular industries, and constituent stocks.

---

## B. Application Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                             │
│                                                                        │
│  - React 18 SPA + Vite + Tailwind CSS + Lucide Icons                   │
│  - Tab Navigation: Crisis Engine, RSI Rebound, RSI Divergence,         │
│    EMA Support, Confluence Targets, Universe Directory,                │
│    Validation Test (20MICRONS, ASTRAMICRO, APOLLO),                   │
│    Stock Classification & Universe Navigation, AI Research Panel       │
│  - Modal Inspectors: Deep-Dive Stock Analysis & Validation Inspector   │
│  - Mathematical Engines: mathUtils.ts, classificationService.ts        │
│  - Zero Hardcoding Principle: No machine paths or absolute Drive URLs  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         DATA_SOURCE_CONFIG
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                        DATA & VALIDATION LAYER                         │
│                                                                        │
│  - Public Registry CSV: public/csv_files/ALL EQUITY DETAILS.CSV        │
│  - Embedded Fast-Boot JSON: src/data/allEquityDetails.json             │
│  - Data Ingestion & Sanitizer: src/utils/csvParser.ts                  │
│  - Deterministic Validator: src/services/dataValidationService.ts      │
│  - Canonical Identity Model: Distinct Symbol, Legal Name, ISIN, Exch  │
│  - Synthetic ID Trap: Rejects /^[A-Z]{3,5}\d{3,5}$/i & STOCK_n         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## C. Folder & File Structure

```
/
├── public/
│   └── csv_files/
│       └── ALL EQUITY DETAILS.CSV      # Authoritative portable 1,120 Indian stock dataset
├── src/
│   ├── config/
│   │   └── dataSourceConfig.ts         # Portable configuration (no machine paths)
│   ├── data/
│   │   └── allEquityDetails.json       # Synchronous bootstrap dataset (1,120 stocks)
│   ├── engine/
│   │   └── mathUtils.ts                # Pure math, medians, stats
│   ├── services/
│   │   ├── classificationService.ts    # In-memory index, sector, industry taxonomy
│   │   ├── dataValidationService.ts    # Deterministic validation engine & report
│   │   ├── historicalData.ts           # Precomputed crisis matrices & baseline stocks
│   │   └── aiInterpretationService.ts  # Structured prompt & reasoning engine
│   ├── utils/
│   │   ├── csvParser.ts                # Strict PapaParse loader & canonical normalizer
│   │   └── currency.ts                 # INR (₹ Lakh Cr / Cr) currency formatter
│   ├── types/
│   │   └── equity.ts                   # StockEquity, StockValidationReport, CapTier
│   ├── components/
│   │   ├── StockClassificationNavView.tsx # Multi-directional hierarchy explorer
│   │   ├── ValidationTestView.tsx         # Empirical hypothesis test (3 test stocks)
│   │   ├── UniverseDirectoryView.tsx      # Filterable 1,120 stock directory
│   │   ├── StockResearchInspectorModal.tsx# Comprehensive single-stock modal
│   │   └── Navbar.tsx                     # Top navigation with live universe count
│   ├── App.tsx                         # Root component, state management, auto-fetch
│   └── main.tsx                        # React DOM entry point
├── scripts/
│   └── build_authentic_universe.cjs    # Deterministic generator for 1,120 real stocks
├── DATA_DICTIONARY.md                  # Comprehensive field dictionary
├── PROJECT_SOURCE_OF_TRUTH.md          # This authoritative document
├── server.ts                           # Express server with static CSV routes
└── vite.config.ts                      # Vite build configuration
```

---

## D. Data Architecture
The data layer is completely decoupled from application logic:
- The data files reside under `public/csv_files/` and can be placed in any directory or uploaded via the browser UI.
- The application consumes data via portable relative paths defined in `src/config/dataSourceConfig.ts`.
- The synchronous JSON file (`src/data/allEquityDetails.json`) acts as an immediate zero-latency boot cache.
- On mount, `App.tsx` fetches `public/csv_files/ALL EQUITY DETAILS.CSV` and re-runs deterministic validation.
- End-users can upload any updated CSV at runtime through the "Upload ALL EQUITY DETAILS.CSV" interface button.

---

## E. Data-Source Requirements
Any input stock dataset must fulfill the following criteria:
1. Format: Comma-Separated Values (`.csv`).
2. Header Row: Column names must identify Symbol, Company/Security Name, Sector, and Industry.
3. Quantities & Metrics: Market Cap, Current Price, P/E Ratio, ROE (%), Dividend Yield (%), 52-Week High, 52-Week Low, Beta, Exchange, and ISIN.
4. Completeness: All 1,120 stocks must be represented.
5. Integrity: Trading symbols must be genuine NSE/BSE exchange symbols without synthetic script artifacts.

---

## F. CSV Schemas
The canonical CSV schema used in `ALL EQUITY DETAILS.CSV`:
```csv
Symbol,Security Name,Sector,Industry,Cap Tier,Market Cap Rank,Market Cap,Current Price,P/E Ratio,ROE (%),Dividend Yield (%),52 Week High,52 Week Low,Beta,Exchange,ISIN
RELIANCE,"Reliance Industries Ltd.","Oil & Gas","Refining & Marketing",HIGH,1,"₹19.80 Lakh Cr",2945.5,26.4,9.8,0.35,3681.88,2120.76,1.05,NSE,INE002A01018
TCS,"Tata Consultancy Services Ltd.","Information Technology","IT Services & Consulting",HIGH,2,"₹14.20 Lakh Cr",3890.2,29.8,48.2,1.45,4862.75,2800.94,0.82,NSE,INE467B01029
...
```

---

## G. Field Definitions
- **Symbol**: Verified canonical exchange trading symbol (e.g., `RELIANCE`, `TCS`, `20MICRONS`, `ASTRAMICRO`, `APOLLO`).
- **Security Name**: Full legal registered corporate title (e.g., `Reliance Industries Ltd.`).
- **Sector**: 1 of 18 broad industry sectors.
- **Industry**: Granular subsector classification.
- **Cap Tier**: Market capitalization tier (`HIGH` [1–100], `MID` [101–350], `LOW` [351–1120]).
- **Market Cap Rank**: Numeric ranking from 1 to 1120.
- **Market Cap**: Formatted INR denomination (`₹ Lakh Cr` or `₹ Cr`).
- **Current Price**: Price in INR.
- **P/E Ratio**: Trailing Twelve Months Price-to-Earnings.
- **ROE (%)**: Return on Equity percentage.
- **Dividend Yield (%)**: Trailing dividend yield.
- **52 Week High / Low**: 52-week price extremes.
- **Beta**: Market beta relative to NIFTY 50.
- **Exchange**: Exchange authority (`NSE` or `BSE`).
- **ISIN**: International Securities Identification Number (`INE...`).

---

## H. Stock Identity Rules
1. **Never manufacture trading symbols:** If a source record has a missing symbol, it must be marked `[MISSING SYMBOL]` and assigned validation status `MISSING_SYMBOL`.
2. **Never expose internal IDs as trading symbols:** Application keys (`INTERNAL_1`, `INTERNAL_2`) are reserved exclusively for React keys and database indexes.
3. **Synthetic ID Pattern Rejection:** Any symbol matching `/^(STOCK_\d+|UNKNOWN_\d+|TEMP_\d+|ID_\d+|[A-Z]{3,5}\d{3,5})$/i` (such as `ARIH1002`, `ARIH1017`, `STOCK_1`) is immediately flagged as `INVALID_SYMBOL`.
4. **Preserve Raw Source:** The unnormalized raw input is retained in `rawSourceSymbol` to ensure complete auditability.

---

## I. Data Normalization Rules
- Trim leading and trailing whitespace from all string fields.
- Strip exchange prefixes (`NSE:`, `BSE:`) and series suffixes (`.NS`, `.BO`, `-EQ`).
- Convert symbols to uppercase.
- Parse numbers cleanly: strip currency symbols (`₹`, `$`, `€`, `Rs.`), commas, and percentages.
- Map empty strings, dashes (`-`, `—`), and `N/A` to `undefined`.

---

## J. Classification & Navigation Logic
The Classification Engine provides 5 distinct navigation directions:
1. **Direction 1 (Index → Sector → Industry → Stocks):** Traverses from benchmark indices (`NIFTY 50`, `NIFTY NEXT 50`, `NIFTY MIDCAP 150`, `NIFTY SMALLCAP 250`, `NIFTY MICROCAP 250`, sectoral indices, thematic indices, or `UNINDEXED EQUITIES`).
2. **Direction 2 (Sector → Industry → Stocks):** Index-free browsing starting directly from 1 of 18 broad sectors.
3. **Direction 3 (Industry → Stocks):** Direct lookup across all granular industries.
4. **Direction 4 (All Equities Explorer):** Complete universe view containing all 1,120 stocks, sorted by rank or cap tier.
5. **Direction 5 (Stock → Sector → Industry → Indices):** Reverse inspection showing all parent memberships for a single chosen stock.

---

## K. Sector & Industry Mapping
The system maps across 18 distinct sectors:
- Financial Services
- Information Technology
- Automobile & Auto Components
- Healthcare & Pharmaceuticals
- Fast Moving Consumer Goods
- Capital Goods
- Construction & Infrastructure
- Oil & Gas
- Metals & Mining
- Chemicals
- Power & Utilities
- Consumer Services
- Consumer Durables
- Telecommunication
- Construction Materials
- Realty
- Textiles
- Packaging

---

## L. Index Mapping
Stocks are mapped to indices deterministically based on:
1. Market Cap Rank:
   - Rank 1–50: `NIFTY 50`
   - Rank 51–100: `NIFTY NEXT 50`
   - Rank 101–250: `NIFTY MIDCAP 150`
   - Rank 251–500: `NIFTY SMALLCAP 250`
   - Rank 501–750: `NIFTY MICROCAP 250`
2. Sectoral Indices: `NIFTY BANK`, `NIFTY IT`, `NIFTY AUTO`, `NIFTY PHARMA`, `NIFTY FMCG`, `NIFTY METAL`, `NIFTY OIL & GAS`, `NIFTY REALTY`, etc.
3. Universal Categories:
   - `ALL EQUITIES (Complete Universe)`: Includes all 1,120 stocks.
   - `UNINDEXED EQUITIES (Not in Any Benchmark)`: Catches stocks without formal index memberships.

---

## M. Matching Stocks Logic
In any navigation view:
- If an index is chosen, stocks are filtered by that index (or all stocks if "ALL EQUITIES" is selected).
- If a sector is selected, only stocks in that sector are displayed.
- If an industry is selected, only stocks in that industry are displayed.
- If a global search query is typed, matches on symbol, company name, sector, industry, and index are included.
- Results are deterministically sorted by `marketCapRank`.

---

## N. AI Interpreter Behavior
The AI Research Assistant operates deterministically:
- Grounds responses exclusively in loaded data.
- Refuses to fabricate historical prices, dates, or non-existent metrics.
- Uses exact drawdown, rebound, RSI, and EMA interaction numbers.
- Labels events strictly as "NIFTY 50 historical correction events" without inventing speculative macroeconomic causes.

---

## O. Validation Rules
The deterministic validator checks:
1. `symbol` exists and is non-empty.
2. `symbol` is not a synthetic ID matching `/^[A-Z]{3,5}\d{3,5}$/`.
3. `symbol` complies with exchange format (`^[A-Z0-9&-]{1,12}$`).
4. `companyName` exists.
5. No duplicate symbols map to conflicting companies.
6. No duplicate companies map to conflicting symbols.

A validation report is produced:
- `TOTAL SOURCE RECORDS`
- `VALID STOCKS`
- `INVALID SYMBOLS`
- `MISSING SYMBOLS`
- `DUPLICATE SYMBOLS`
- `DUPLICATE COMPANY MAPPINGS`
- `UNRESOLVED RECORDS`

---

## P. Known Data-Quality Rules
- An authentic Indian stock symbol contains only uppercase letters, numbers, and allowed punctuation (`&`, `-`).
- Fake identifiers like `ARIH1002`, `ARIH1017`, `STOCK_1` are rejected by the validator.
- Unindexed stocks must always remain visible and accessible in the taxonomy.

---

## Q. How to Replace/Update Data
To update or replace the dataset:
1. Overwrite `public/csv_files/ALL EQUITY DETAILS.CSV` with the new CSV file.
2. Or in the browser UI under "Stock Classification & Universe Navigation", click **Upload ALL EQUITY DETAILS.CSV** and select the new CSV.
3. The application will parse, validate, compute taxonomy maps, and update the UI in real time.

---

## R. How to Move Application to Another AI Studio Project
1. Copy the entire repository directory (all files under project root).
2. Run `npm install` or `bun install`.
3. Start the dev server (`npm run dev`).
4. All UI, logic, taxonomy, and validation rules are self-contained.

---

## S. How to Connect a New Drive Data Location
1. The application does not depend on any hardcoded Drive paths.
2. Simply place your `ALL EQUITY DETAILS.CSV` into the `public/csv_files/` directory, or use the in-app file uploader.
3. If an external relative path is desired, update `DATA_SOURCE_CONFIG.stockUniverseCsvRelativeUrl` in `src/config/dataSourceConfig.ts`.

---

## T. What Must NEVER Be Hard-Coded
1. User-specific Windows paths (e.g. `C:\Users\...`).
2. Absolute Google Drive paths (e.g. `/content/drive/...` or web drive IDs).
3. Temporary environment container IDs.
4. Hardcoded individual stock overrides for synthetic IDs (e.g., hardcoding `ARIH1002`).

---

## U. Troubleshooting
- **Build Error: Unresolved Import:** Ensure `src/data/allEquityDetails.json` exists. If missing, regenerate it by running `node scripts/build_authentic_universe.cjs`.
- **Validation Warnings:** Open the "Validation" button in the Classification view header to inspect the table of flagged records and reasons.
- **Port Conflict:** Ensure server runs on port 3000 as configured in `server.ts`.
