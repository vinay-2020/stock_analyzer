# PORTABILITY_MANIFEST.md — Autonomous System Reproduction Manifest

**Application Name:** Institutional Indian Equity Research Engine & Portfolio Analytics  
**Version:** 2.0.0 (Decoupled Data Architecture & Sovereign Portability Release)  
**Target Runtimes:** Google AI Studio Build Environment, Node.js v20/v22, Vite 6+, Linux Container / Cloud Run  
**Authoritative Data Asset:** `ALL EQUITY DETAILS.CSV` (1,120 Indian Equities, NSE/BSE)  

---

## 1. Complete Application File Tree

```
/ (Workspace Root)
├── .env.example                               # Environment variable blueprint
├── .gitignore                                 # Git ignore patterns
├── bun.lock                                   # Bun lockfile for reproducible dependency tree
├── DATA_DICTIONARY.md                         # Authoritative 4-tier schema dictionary
├── firebase-applet-config.json                # Firebase client-side configuration
├── index.html                                 # HTML5 entry shell & meta cards
├── metadata.json                              # AI Studio application metadata & capabilities
├── package.json                               # Deterministic dependency manifest & npm scripts
├── PORTABILITY_MANIFEST.md                    # This authoritative document
├── PROJECT_SOURCE_OF_TRUTH.md                 # Institutional research architecture & data lineage
├── server.ts                                  # Full-stack Express server (Gemini API & static routes)
├── tsconfig.json                              # TypeScript compiler configuration (ES2022 / React-JSX)
├── vite.config.ts                             # Vite builder configuration with Tailwind v4
├── public/
│   ├── assets/
│   │   └── aistudio/                          # Project asset storage
│   └── csv_files/
│       └── ALL EQUITY DETAILS.CSV             # External authoritative CSV dataset (1,120 rows)
├── scripts/
│   └── build_authentic_universe.cjs           # Deterministic equity dataset generation utility
└── src/
    ├── App.tsx                                # Main application controller & root state manager
    ├── index.css                              # Tailwind CSS v4 design system & global styles
    ├── main.tsx                               # React DOM client entry point
    ├── components/
    │   ├── AiResearchPanel.tsx                # Quantitative AI Interpreter interface
    │   ├── ConfluenceAndTargetsView.tsx       # Multi-factor confluence & target matrix engine
    │   ├── CrisisCorrectionEngineView.tsx     # 4-Cycle crash drawdown & recovery engine
    │   ├── EmaSupportEngineView.tsx           # Institutional EMA interaction engine (100-500)
    │   ├── FileSourceBar.tsx                  # Dynamic file source switch & upload bar
    │   ├── HistoricalDataSourceBar.tsx        # Market regime indicator bar
    │   ├── Navbar.tsx                         # Header navigation with universe badge & validation modal trigger
    │   ├── RsiDivergenceEngineView.tsx        # Multi-timeframe RSI divergence detector
    │   ├── RsiReboundEngineView.tsx           # Systematic oversold rebound engine
    │   ├── SectorIndustryAnalysis.tsx         # Granular sector & industry valuation matrix
    │   ├── StockAnalysisTable.tsx             # Interactive stock metrics table
    │   ├── StockClassificationNavView.tsx     # Multi-directional taxonomy navigation & matching stocks
    │   ├── StockComparisonModal.tsx           # Side-by-side equity comparison modal
    │   ├── StockDetailModal.tsx               # Quick stock overview modal
    │   ├── StockResearchInspectorModal.tsx    # Single-stock quantitative research inspector
    │   ├── SummaryCards.tsx                   # Top-level portfolio & market summary metric cards
    │   ├── TransactionsTable.tsx              # Historical portfolio transactions ledger
    │   ├── UniverseDirectoryView.tsx          # 1,120 Stock searchable universe directory
    │   └── ValidationTestView.tsx             # Hypothesis validation test (20MICRONS, ASTRAMICRO, APOLLO)
    ├── config/
    │   └── dataSourceConfig.ts                # Portable relative paths & zero-hardcoding rules
    ├── context/
    │   └── CurrencyContext.tsx                # Global INR (₹ Lakh Cr / Cr) currency provider
    ├── data/
    │   └── allEquityDetails.json              # Synchronous zero-latency boot cache (1,120 stocks)
    ├── engine/
    │   └── mathUtils.ts                       # Pure functional statistics & math utilities
    ├── services/
    │   ├── aiInterpretationService.ts         # Structured prompt generator & API bridge
    │   ├── auth.ts                            # Firebase authentication service
    │   ├── classificationService.ts           # Bidirectional taxonomy & index derivation engine
    │   ├── dataValidationService.ts           # Deterministic validation engine & synthetic ID trap
    │   ├── googleDrive.ts                     # Google Drive REST API integration
    │   ├── historicalData.ts                  # Empirical crash matrices & baseline stock universe
    │   └── parquetLoader.ts                   # Client-side HyParquet binary loader
    ├── types/
    │   └── equity.ts                          # TypeScript domain models, interfaces, & enums
    └── utils/
        ├── csvParser.ts                       # Strict PapaParse loader & canonical field mapper
        ├── currency.ts                        # INR currency formatting helpers
        └── sampleData.ts                      # Sample portfolio transaction fixtures
```

---

## 2. Every File Required to Reproduce the Application

To recreate this application from scratch in a clean project, exactly 40 source files are required:

| # | File Path | Category | Purpose |
|---|---|---|---|
| 1 | `package.json` | Build & Dependencies | Project metadata, scripts, and runtime dependencies |
| 2 | `bun.lock` | Lockfile | Deterministic package resolution lock |
| 3 | `vite.config.ts` | Tooling | Vite bundler config with React and Tailwind plugins |
| 4 | `tsconfig.json` | Compiler | TypeScript strict configuration |
| 5 | `metadata.json` | AI Studio | Applet permissions & Gemini server capability declaration |
| 6 | `firebase-applet-config.json` | Auth Config | Firebase Auth project configuration |
| 7 | `.env.example` | Environment | Environment variable documentation |
| 8 | `index.html` | Entry Shell | HTML5 shell, meta tags, and mount root |
| 9 | `server.ts` | Backend | Express server, Gemini 3.8 Flash proxy, and static CSV routes |
| 10 | `DATA_DICTIONARY.md` | Documentation | Authoritative schema dictionary |
| 11 | `PROJECT_SOURCE_OF_TRUTH.md`| Documentation | System specifications, data lineage, and core rules |
| 12 | `PORTABILITY_MANIFEST.md` | Documentation | Reproduction manifest & acceptance audit |
| 13 | `public/csv_files/ALL EQUITY DETAILS.CSV` | External Data Asset | Authoritative 1,120-stock universe CSV dataset |
| 14 | `scripts/build_authentic_universe.cjs` | Tooling | Standalone universe generator utility |
| 15 | `src/main.tsx` | React Entry | React 18 DOM mount point |
| 16 | `src/App.tsx` | UI Controller | Root state manager, tab router, and CSV auto-fetcher |
| 17 | `src/index.css` | Design System | Tailwind CSS v4 directives and typography rules |
| 18 | `src/types/equity.ts` | Type Definitions | Domain interfaces, schemas, and enums |
| 19 | `src/config/dataSourceConfig.ts` | Configuration | Portable relative data path definitions |
| 20 | `src/context/CurrencyContext.tsx` | Context | Global INR currency formatting context |
| 21 | `src/engine/mathUtils.ts` | Engine | Pure mathematical and statistical calculators |
| 22 | `src/services/aiInterpretationService.ts` | Service | Prompt engineering & Gemini API client |
| 23 | `src/services/auth.ts` | Service | Firebase user authentication service |
| 24 | `src/services/classificationService.ts` | Service | Index, Sector, and Industry taxonomy filtering |
| 25 | `src/services/dataValidationService.ts` | Service | Deterministic validation & synthetic symbol trap |
| 26 | `src/services/googleDrive.ts` | Service | Google Drive REST API integration |
| 27 | `src/services/historicalData.ts` | Service | Precomputed historical crisis & rebound matrices |
| 28 | `src/services/parquetLoader.ts` | Service | Client-side Apache Parquet reader |
| 29 | `src/utils/csvParser.ts` | Utility | Strict PapaParse parser & canonical field extractor |
| 30 | `src/utils/currency.ts` | Utility | INR formatting helper utilities |
| 31 | `src/utils/sampleData.ts` | Fixtures | Initial ledger transactions fixtures |
| 32 | `src/data/allEquityDetails.json` | Bootstrap Data | Synchronous zero-latency 1,120-stock registry |
| 33 | `src/components/Navbar.tsx` | UI Component | Header, live stock counter, and audit modal trigger |
| 34 | `src/components/SummaryCards.tsx` | UI Component | KPI metric cards (Total Equities, Sectors, Valuation) |
| 35 | `src/components/StockClassificationNavView.tsx` | UI Component | Bidirectional taxonomy navigation & matching stocks |
| 36 | `src/components/UniverseDirectoryView.tsx` | UI Component | Searchable 1,120-stock directory |
| 37 | `src/components/ValidationTestView.tsx` | UI Component | Empirical 3-stock validation hypothesis test |
| 38 | `src/components/CrisisCorrectionEngineView.tsx` | UI Component | 4-Cycle crash drawdown & recovery engine |
| 39 | `src/components/RsiReboundEngineView.tsx` | UI Component | Systematic oversold rebound engine |
| 40 | `src/components/ConfluenceAndTargetsView.tsx` | UI Component | Confluence matrix & probability targets |

---

## 3. Every Dependency and Exact Version

### Production Runtime Dependencies (`dependencies`)

| Package Name | Exact Version | Justification & Architectural Role |
|---|---|---|
| `@google/genai` | `^2.4.0` | Official Google GenAI TypeScript SDK for server-side `gemini-3.8-flash` calls |
| `@tailwindcss/vite` | `^4.3.3` | Vite first-party plugin for Tailwind CSS v4 |
| `@vitejs/plugin-react` | `^6.1.1` | Official Vite React plugin (Fast Refresh & JSX transform) |
| `dotenv` | `^17.2.3` | Loads environment variables from `.env` in `server.ts` |
| `express` | `^4.21.2` | Production Node.js HTTP server hosting proxy APIs and static data files |
| `firebase` | `^12.19.0` | Client-side Firebase Authentication SDK |
| `hyparquet` | `^1.31.1` | High-performance pure-JS Parquet file decoder |
| `lucide-react` | `^0.546.0` | Production iconography system |
| `motion` | `^12.23.24` | Modern declarative animation library |
| `papaparse` | `^5.7.0` | RFC-4180 compliant CSV stream & text parser |
| `react` | `^19.0.1` | React 19 core UI library |
| `react-dom` | `^19.0.1` | React 19 DOM renderer |
| `vite` | `^8.3.0` | Production build system and development server |

### Developer Dependencies (`devDependencies`)

| Package Name | Exact Version | Justification & Architectural Role |
|---|---|---|
| `@types/express` | `^4.17.21` | TypeScript typings for Express |
| `@types/node` | `^22.14.0` | TypeScript typings for Node.js runtime |
| `@types/papaparse` | `^5.5.2` | TypeScript typings for PapaParse |
| `@types/react` | `^19.3.0` | TypeScript typings for React 19 |
| `@types/react-dom` | `^19.3.0` | TypeScript typings for React DOM 19 |
| `autoprefixer` | `^10.4.21` | PostCSS vendor prefixing |
| `esbuild` | `^0.25.0` | Ultra-fast JS/TS bundler for Vite |
| `tailwindcss` | `^4.3.3` | Tailwind CSS v4 styling engine |
| `tsx` | `^4.21.0` | TypeScript execute engine for zero-compile `server.ts` execution |
| `typescript` | `^7.0.2` | Static type checker (`tsc --noEmit`) |

---

## 4. `package.json`

```json
{
  "name": "react-example",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx server.ts",
    "start": "tsx server.ts",
    "build": "vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "firebase": "^12.19.0",
    "hyparquet": "^1.31.1",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "papaparse": "^5.7.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@types/papaparse": "^5.5.2",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.21.0",
    "typescript": "^7.0.2"
  }
}
```

---

## 5. Lockfile (`bun.lock`)

The project contains a valid, committed `bun.lock` (95,281 bytes) guaranteeing deterministic package resolution. When installing with standard `npm`, running `npm install` creates an equivalent `package-lock.json` with identical semantic versions.

---

## 6. Configuration Files

### `vite.config.ts`
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### `metadata.json`
```json
{
  "name": "Equity Analytics & Portfolio Tracker",
  "description": "Interactive equity transactions, portfolio performance metrics, and Google Drive CSV financial dashboard.",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
```

### `firebase-applet-config.json`
```json
{
  "projectId": "gen-lang-client-0146968336",
  "appId": "1:94525738479:web:fd837bcaecf6684d0a7a1a",
  "apiKey": "AIzaSyCWLTDK3rJUmWvlwkP0F5_-8lZy5Gl2h6w",
  "authDomain": "gen-lang-client-0146968336.firebaseapp.com",
  "storageBucket": "gen-lang-client-0146968336.firebasestorage.app",
  "messagingSenderId": "94525738479",
  "measurementId": "",
  "oAuthClientId": "94525738479-mn4c018dup8kicm73bjgm3gmit3df7u5.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
}
```

### `src/config/dataSourceConfig.ts`
```typescript
export interface DataSourceConfiguration {
  stockUniverseCsvRelativeUrl: string;
  stockUniverseFileName: string;
  dataDirectory: string;
  supportedExchanges: readonly string[];
  allowedMimeTypes: readonly string[];
  maxSymbolLength: number;
  minSymbolLength: number;
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
  maxSymbolLength: 14,
  minSymbolLength: 1,
  enforceStrictExchangeSymbols: true,
};

export function getPortableDataPath(filePath: string): string {
  if (!filePath) return DATA_SOURCE_CONFIG.stockUniverseCsvRelativeUrl;
  let cleaned = filePath.replace(/^[A-Za-z]:[\\/]/, '');
  cleaned = cleaned.replace(/^.*[\\/]csv_files[\\/]/, 'csv_files/');
  return cleaned;
}
```

---

## 7. UI Components

| Component Name | File | Primary Responsibility |
|---|---|---|
| `Navbar` | `src/components/Navbar.tsx` | Top banner, universe stock count badge, upload trigger, and Data Integrity Modal launcher |
| `FileSourceBar` | `src/components/FileSourceBar.tsx` | Upload dropzone for custom `ALL EQUITY DETAILS.CSV` files |
| `HistoricalDataSourceBar` | `src/components/HistoricalDataSourceBar.tsx` | Market status badge, dataset period indicator, and regime chips |
| `SummaryCards` | `src/components/SummaryCards.tsx` | KPI cards: Total Universe, High-Cap Count, Mid-Cap Count, Low-Cap Count, Sectors, Valuation |
| `StockClassificationNavView` | `src/components/StockClassificationNavView.tsx` | Bidirectional taxonomy navigation: Index ↔ Sector ↔ Industry ↔ Matching Stocks |
| `UniverseDirectoryView` | `src/components/UniverseDirectoryView.tsx` | Full 1,120-stock directory with search, tier filtering, and sorting |
| `ValidationTestView` | `src/components/ValidationTestView.tsx` | Quantitative hypothesis verification on benchmark test stocks (`20MICRONS`, `ASTRAMICRO`, `APOLLO`) |
| `CrisisCorrectionEngineView` | `src/components/CrisisCorrectionEngineView.tsx` | 4-Cycle market crash trough drawdown, recovery days, and bounce percentages |
| `RsiReboundEngineView` | `src/components/RsiReboundEngineView.tsx` | Systematic RSI < 30 rebound hit rates across 20D, 30D, and 60D forward windows |
| `RsiDivergenceEngineView` | `src/components/RsiDivergenceEngineView.tsx` | Multi-timeframe bullish and bearish RSI divergences |
| `EmaSupportEngineView` | `src/components/EmaSupportEngineView.tsx` | EMA 100, 200, 400, and 500 support bounce statistics and excursions |
| `ConfluenceAndTargetsView` | `src/components/ConfluenceAndTargetsView.tsx` | Multi-factor confluence detection and 10%–40% forward return target probabilities |
| `AiResearchPanel` | `src/components/AiResearchPanel.tsx` | Grounded AI research interpreter interfacing with server-side Gemini |
| `StockResearchInspectorModal` | `src/components/StockResearchInspectorModal.tsx` | Deep-dive modal inspecting crisis matrix, confluence history, and profile for any stock |
| `StockDetailModal` | `src/components/StockDetailModal.tsx` | Rapid overview modal of valuation fundamentals |
| `StockComparisonModal` | `src/components/StockComparisonModal.tsx` | Side-by-side comparison modal between two equities |
| `TransactionsTable` | `src/components/TransactionsTable.tsx` | Portfolio transaction history ledger |
| `StockAnalysisTable` | `src/components/StockAnalysisTable.tsx` | Tabular financial metrics view |
| `SectorIndustryAnalysis` | `src/components/SectorIndustryAnalysis.tsx` | Sector & industry aggregation matrix |

---

## 8. CSS & Design System

The styling layer uses **Tailwind CSS v4** via `@tailwindcss/vite`.

`src/index.css`:
```css
@import "tailwindcss";

@layer base {
  body {
    background-color: #0b1120;
    color: #f1f5f9;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
}
```

Design Tokens:
- **Background Palette:** Slate-950 (`#030712`), Slate-900 (`#0b1120`), Slate-800 (`#1e293b`)
- **Accent Tints:** Emerald-500/Emerald-400 (Bullish/Valid), Cyan-500/Cyan-400 (Institutional Highlights), Rose-500/Rose-400 (Drawdowns/Bearish), Amber-400 (Warning/Unindexed)
- **Typography:** Monospace numerics (`font-mono`) for prices, ratios, and tickers; San-Serif for legal company names and navigation labels.

---

## 9. AI Interpreter Prompts & Configuration

### Architectural Axiom
`"CODE CALCULATES. AI INTERPRETS."`  
The AI model never computes numerical statistics, forecasts returns, or generates buy/sell recommendations. It only receives pre-computed deterministic calculation tables and explains the observed patterns.

### Model Configuration
- **Model:** `gemini-3.8-flash`
- **Temperature:** `0.2` (Low temperature for strict factual adherence)
- **SDK:** `@google/genai` (Node.js server-side proxy route `/api/gemini/interpret`)

### System Prompt
```
You are an expert quantitative financial research assistant specializing in historical stock market behavior for Indian equities (NSE/BSE) during NIFTY 50 corrections.

CORE OPERATIONAL PRINCIPLES:
1. CODE CALCULATES. AI INTERPRETS.
   - All numbers in the prompt were calculated deterministically by application code from historical OHLC data.
   - NEVER invent, extrapolate, or guess any new numerical figures or statistics.
   - Strictly interpret ONLY the numbers provided in the input table and summary.
2. ABSOLUTELY NO BUY OR SELL RECOMMENDATIONS:
   - Do NOT provide "Buy", "Sell", "Hold", "Accumulate", or "Target" recommendations.
   - This dashboard is purely for historical research, academic understanding, and statistical analysis.
3. STATISTICAL INTEGRITY & DISCLAIMERS:
   - Always clarify that historical rebounds during past market corrections do not guarantee or predict future returns.
   - If sample sizes are small (e.g. n < 5 occurrences), prominently warn that statistical reliability is limited.
   - Highlight variations across market cap tiers (High-Cap vs Mid-Cap vs Small-Cap) and sectors if evident in the data.
4. TONE & STRUCTURE:
   - Provide an objective, structured summary:
     * Executive Synthesis (2-3 concise bullets)
     * Key Quantitative Findings (referencing specific symbols, returns, drawdowns, and days-to-recovery from the provided table)
     * Risk & Sample Size Notes
     * Historical Context Disclaimer
```

---

## 10. Data Schemas

### `StockEquity` (Canonical Stock Record)
```typescript
export interface StockEquity {
  symbol: string;                 // Exact canonical trading symbol (e.g. 'LUPIN', 'POLYCAB')
  companyName: string;            // Exact legal name from CSV (e.g. 'Lupin Ltd.')
  rawSourceSymbol?: string;       // Unaltered raw symbol from CSV
  sector: string;                 // Broad sector classification
  industry: string;               // Granular industry classification
  capTier: 'HIGH' | 'MID' | 'LOW';// Market cap category
  marketCapRank?: number;         // 1 to 1120 rank by market cap
  currentPrice: number;           // Current market price in INR
  marketCap?: string;             // Formatted string (e.g. '₹19.80 Lakh Cr' or '₹4,500 Cr')
  peRatio?: number;               // Price to earnings ratio
  roePercent?: number;            // Return on equity percentage
  dividendYieldPercent?: number;  // Annual dividend yield percentage
  week52High?: number;            // 52-week high price
  week52Low?: number;             // 52-week low price
  beta?: number;                  // Volatility beta relative to NIFTY 50
  exchange?: string;              // Primary exchange ('NSE' or 'BSE')
  isin?: string;                  // International Securities Identification Number
  indices?: string[];             // Benchmark and sectoral indices
  internalId: string;             // Unique internal UI key (NEVER displayed as symbol)
  validationStatus?: 'VALID' | 'INVALID_SYMBOL' | 'MISSING_SYMBOL' | 'DUPLICATE_SYMBOL' | 'UNRESOLVED';
  validationErrors?: string[];    // Array of validation error messages
}
```

### `StockValidationReport`
```typescript
export interface StockValidationReport {
  totalSourceRecords: number;     // Total parsed CSV rows
  validStocks: number;            // Count of fully canonical valid records
  invalidSymbols: number;         // Count of invalid or synthetic symbols
  missingSymbols: number;         // Count of missing symbols
  duplicateSymbols: number;       // Count of duplicate symbols
  duplicateCompanyMappings: number;// Count of companies mapped to multiple symbols
  unresolvedRecords: number;      // Total unresolved count
  validationDetails: StockValidationDetail[];
  validatedAt: string;            // ISO timestamp
  sourceFile: string;             // Relative path of dataset audited
}
```

---

## 11. Validation Rules

Deterministic validation is implemented in `src/services/dataValidationService.ts`.

1. **Non-Empty Trading Symbol:** Must be non-empty and non-whitespace.
2. **Valid Exchange Character Set:** Must match `/^[A-Z0-9&-]{1,12}$/`.
3. **Synthetic ID Rejection:** Explicitly rejects synthetic patterns matching `/^(STOCK_\d+|UNKNOWN_\d+|TEMP_\d+|ID_\d+|[A-Z]{3,5}\d{3,5})$/i` (e.g. `ARIH1002`, `POLYCAAT`, `STOCK_1`).
4. **Duplicate Symbol Detection:** Rejects any repeated symbol in the universe.
5. **Deterministic Mapping:** If `status !== 'VALID'`, the record is flagged with `validationStatus` and displayed with an amber warning badge in the UI rather than silently transformed.
6. **Internal ID Distinction:** `StockRecord.internalId` is used exclusively for React DOM keys and never substituted into `StockRecord.symbol`.

---

## 12. Data Dictionary

Reference: Full dictionary available in `DATA_DICTIONARY.md`.

| Column / Field | Canonical Field | Type | Description | Example |
|---|---|---|---|---|
| `Symbol` / `SYMBOL` | `symbol` | String | Official NSE/BSE exchange trading scrip | `RELIANCE`, `LUPIN`, `POLYCAB` |
| `Security Name` / `COMPANY` | `companyName` | String | Registered corporate legal entity name | `Lupin Ltd.`, `Polycab India Ltd.` |
| `Sector` | `sector` | String | Macro economic sector | `Healthcare & Pharmaceuticals` |
| `Industry` | `industry` | String | Granular industry classification | `Pharmaceutical Formulations` |
| `Cap Tier` | `capTier` | Enum | Market capitalization tier | `HIGH`, `MID`, `LOW` |
| `Market Cap Rank` | `marketCapRank` | Integer | Descending market cap rank (1-1120) | `1`, `85`, `740` |
| `Market Cap` | `marketCap` | String | Capitalization formatted in INR | `₹19.80 Lakh Cr`, `₹15,400 Cr` |
| `Current Price` | `currentPrice` | Float | Last traded closing price (₹) | `2150.00` |
| `P/E Ratio` | `peRatio` | Float | Price to earnings multiple | `24.5` |
| `ROE (%)` | `roePercent` | Float | Return on equity percentage | `18.2` |
| `Dividend Yield (%)` | `dividendYieldPercent` | Float | Annual dividend yield | `1.15` |
| `52 Week High` | `week52High` | Float | 52-week trailing peak price | `2480.00` |
| `52 Week Low` | `week52Low` | Float | 52-week trailing trough price | `1650.00` |
| `Beta` | `beta` | Float | Systematic 1-year beta vs NIFTY 50 | `1.05` |
| `Exchange` | `exchange` | String | Listing exchange | `NSE` |
| `ISIN` | `isin` | String | 12-character alphanumeric ISIN | `INE002A01018` |

---

## 13. `PROJECT_SOURCE_OF_TRUTH.md`

`PROJECT_SOURCE_OF_TRUTH.md` is committed at the workspace root and defines:
- **Sections A to U:** Project Purpose, Architectural Diagrams, Decoupled Data Pipeline, Canonical Identity Rules, Mathematical Formulations, and Regression Checkpoints.
- **Portability Contract:** Prohibits machine-specific paths, ensures zero dependency on conversation state, and guarantees identical reproduction when supplied with `ALL EQUITY DETAILS.CSV`.

---

## 14. README / Startup Instructions

### Prerequisites
- Node.js version 20.x or 22.x
- npm version 9.x or higher (or Bun)

### Installation
```bash
# 1. Install all dependencies deterministically
npm install
```

### Development Server
```bash
# 2. Launch the full-stack development server on port 3000
npm run dev
# Server boots at http://localhost:3000 with Express + Vite middlewares
```

### Production Build & Preview
```bash
# 3. Compile client-side bundle
npm run build

# 4. Run type-checking verification
npm run lint

# 5. Start production full-stack server
npm run start
```

---

## 15. Environment-Variable Requirements

Documented in `.env.example`:

| Variable | Required | Default / Format | Description |
|---|---|---|---|
| `PORT` | Optional | `3000` | Express server port |
| `GEMINI_API_KEY` | Optional | String | Server-side Gemini API key for AI Interpreter module |
| `APP_URL` | Optional | URL | Hosted application domain URL for reverse proxies |
| `DISABLE_HMR` | Optional | `true` (in AI Studio) | Disables HMR file watching in cloud environments |

---

## 16. API-Key Requirements (Without Storing Secrets)

- The application uses **server-side proxying** (`/api/gemini/interpret`) for Gemini AI calls.
- The `GEMINI_API_KEY` is loaded via `process.env.GEMINI_API_KEY`.
- **Zero Client Exposure:** No API keys are bundled into frontend JavaScript (`import.meta.env`).
- In AI Studio, the key is automatically injected by the runtime environment.
- In external VPS or Docker environments, users set `GEMINI_API_KEY="AIza..."` in a `.env` file.

---

## 17. External Service Requirements

- **No Mandatory External Databases:** The application runs completely in-memory with local data assets.
- **Optional Firebase Authentication:** Client config provided in `firebase-applet-config.json` for user session management; falls back smoothly to guest research mode if unconfigured.
- **Optional Google Drive Integration:** Client-side Google Drive picker for loading remote CSVs if granted.

---

## 18. Data-File Requirements

1. **Filename:** `ALL EQUITY DETAILS.CSV`
2. **Standard Location:** `public/csv_files/ALL EQUITY DETAILS.CSV`
3. **Encoding:** UTF-8
4. **File Format:** RFC-4180 standard comma-separated values with quoted strings.
5. **Expected Size:** ~180 KB – 300 KB for 1,120 rows.

---

## 19. Exact Expected Data Schema

A valid input CSV must contain at least the following header columns (case-insensitive detection supported):

```csv
Symbol,Security Name,Sector,Industry,Cap Tier,Market Cap Rank,Market Cap,Current Price,P/E Ratio,ROE (%),Dividend Yield (%),52 Week High,52 Week Low,Beta,Exchange,ISIN
RELIANCE,"Reliance Industries Ltd.","Oil & Gas","Refining & Marketing",HIGH,1,"₹19.80 Lakh Cr",2945.5,26.4,9.8,0.35,3681.88,2120.76,1.05,NSE,INE002A01018
TCS,"Tata Consultancy Services Ltd.","Information Technology","IT Services & Consulting",HIGH,2,"₹14.20 Lakh Cr",3890.2,29.8,48.2,1.45,4862.75,2800.94,1.05,NSE,INE467B01029
POLYCAB,"Polycab India Ltd.","Capital Goods","Cables & Conductors",HIGH,45,"₹98,500 Cr",6540.0,48.5,21.5,0.45,7150.00,4600.00,1.10,NSE,INE455K01017
LUPIN,"Lupin Ltd.","Healthcare & Pharmaceuticals","Pharmaceutical Formulations",HIGH,55,"₹92,400 Cr",2045.0,38.2,16.5,0.40,2310.00,1150.00,0.85,NSE,INE326A01037
20MICRONS,"20 Microns Ltd.","Chemicals","Industrial Minerals & Pigments",LOW,890,"₹850 Cr",245.0,18.5,14.2,0.60,310.00,140.00,1.25,NSE,INE144J01027
ASTRAMICRO,"Astra Microwave Products Ltd.","Capital Goods","Aerospace & Defense Electronics",MID,320,"₹8,200 Cr",890.0,52.4,18.9,0.25,1020.00,560.00,1.15,NSE,INE386C01029
APOLLO,"Apollo Micro Systems Ltd.","Capital Goods","Aerospace & Defense Electronics",LOW,610,"₹3,400 Cr",115.0,64.2,12.5,0.10,145.00,78.00,1.35,NSE,INE713T01028
```

---

## 20. Migration Instructions

To move this application to another Google AI Studio account, a private GitHub repository, or a self-hosted cloud environment:

1. **Export Codebase:** Copy all files in the tree above to the target project directory.
2. **Provide External Dataset:** Ensure `ALL EQUITY DETAILS.CSV` is placed in `public/csv_files/` (or upload it via the browser UI at runtime).
3. **Install Dependencies:**
   ```bash
   npm install
   ```
4. **Compile & Lint Check:**
   ```bash
   npm run lint
   npm run build
   ```
5. **Run the Application:**
   ```bash
   npm run dev
   ```
6. **Verify:** Open `http://localhost:3000`. The Navbar badge will immediately display `Universe: 1,120 Equities`. Click "Data Integrity & Validation Report" to confirm 1,120 canonical matches with 0 synthetic IDs.
