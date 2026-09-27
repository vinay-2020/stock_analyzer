# Institutional Indian Equity Research Engine — Data Dictionary

**Version:** 2.0.0  
**Status:** Approved & Implemented  
**Scope:** Canonical Field Specifications across Ingestion, Normalization, Storage, and UI Presentation layers.

---

## 1. Field Classification Overview

| Category | Definition | Example |
| :--- | :--- | :--- |
| **SOURCE FIELD** | The raw column key and literal value as found in the input CSV file. | `Symbol`, `Security Name`, `Market Cap` |
| **NORMALIZED FIELD** | The sanitized, typed, and validated representation in application memory. | `symbol: 'RELIANCE'`, `marketCapValue: 1980000` |
| **DISPLAY FIELD** | The formatted string or visual badge presented to the user in the UI. | `₹19.80 Lakh Cr`, `[VALID]`, `HIGH` |
| **INTERNAL FIELD** | Unique identifier strictly used for React keys and database indexes; never presented as a trading symbol. | `internalId: 'INTERNAL_1'` |

---

## 2. Core Stock Identity Fields

### SYMBOL
- **Field Type:** String
- **Source Field:** `Symbol`, `Ticker`, `Stock`, `Scrip`
- **Normalized Field:** `StockEquity.symbol`
- **Display Field:** `stock.symbol` (e.g. `RELIANCE`, `TCS`, `20MICRONS`)
- **Internal Field Counterpart:** `StockEquity.internalId` (`INTERNAL_n`)
- **Required / Optional:** Required
- **Allowed Values:** 1 to 12 alphanumeric characters with optional `&` or `-`. Matches `/^[A-Z0-9&-]{1,12}$/`.
- **Normalization Rule:** Trim, uppercase, strip prefixes (`NSE:`, `BSE:`) and series suffixes (`.NS`, `.BO`, `-EQ`). Rejects synthetic patterns like `ARIH1002`, `STOCK_1`.
- **UI Usage:** Table header, search target, modal titles, ticker chips.

---

### COMPANY_NAME
- **Field Type:** String
- **Source Field:** `Security Name`, `Company Name`, `Company`, `Name`
- **Normalized Field:** `StockEquity.companyName`
- **Display Field:** Formatted company title (e.g. `Reliance Industries Ltd.`)
- **Required / Optional:** Required
- **Allowed Values:** Registered corporate name string (typically ends in `Ltd.`, `Limited`, or `Corp`).
- **Normalization Rule:** Trim whitespace, unescape quotes. If missing, flags record with status `MISSING_COMPANY`.
- **UI Usage:** Subtitle below ticker, company profile modal, search query matching.

---

### EXCHANGE
- **Field Type:** String (Enum)
- **Source Field:** `Exchange`, `Market`, `Exch`
- **Normalized Field:** `StockEquity.exchange`
- **Display Field:** `NSE` | `BSE`
- **Required / Optional:** Optional (Defaults to `NSE`)
- **Allowed Values:** `'NSE'`, `'BSE'`
- **Normalization Rule:** Trim, uppercase.
- **UI Usage:** Exchange badge in Inspector Modal and Directory table.

---

### ISIN
- **Field Type:** String
- **Source Field:** `ISIN`, `ISIN Code`
- **Normalized Field:** `StockEquity.isin`
- **Display Field:** 12-character alphanumeric code (e.g. `INE002A01018`)
- **Required / Optional:** Optional
- **Allowed Values:** Standard 12-character Indian ISIN code starting with `INE` or `INF`.
- **Normalization Rule:** Trim, uppercase.
- **UI Usage:** Institutional security identification in modal header.

---

### INTERNAL_ID
- **Field Type:** String
- **Source Field:** N/A (Application-generated)
- **Normalized Field:** `StockEquity.internalId`
- **Display Field:** **NEVER DISPLAYED TO USERS AS A TRADING SYMBOL.**
- **Required / Optional:** Required for all records
- **Allowed Values:** `INTERNAL_1`, `INTERNAL_2`, etc.
- **Rule:** Used strictly for React rendering keys, unique memory lookups, and un-aliased mapping.

---

## 3. Classification & Taxonomy Fields

### SECTOR
- **Field Type:** String
- **Source Field:** `Sector`, `Sector Name`, `Category`
- **Normalized Field:** `StockEquity.sector`
- **Display Field:** 1 of 18 broad sectors (e.g., `Financial Services`, `Information Technology`)
- **Required / Optional:** Required
- **Allowed Values:** 18 recognized sectors:
  `Financial Services`, `Information Technology`, `Automobile & Auto Components`, `Healthcare & Pharmaceuticals`, `Fast Moving Consumer Goods`, `Capital Goods`, `Construction & Infrastructure`, `Oil & Gas`, `Metals & Mining`, `Chemicals`, `Power & Utilities`, `Consumer Services`, `Consumer Durables`, `Telecommunication`, `Construction Materials`, `Realty`, `Textiles`, `Packaging`.
- **Normalization Rule:** Trim. If absent, defaults to `'Unclassified Sector'`.
- **UI Usage:** Level 1/2 filter pills, aggregation cards, sectoral bar charts.

---

### INDUSTRY
- **Field Type:** String
- **Source Field:** `Industry`, `Industry Name`, `Sub-Industry`, `Subsector`
- **Normalized Field:** `StockEquity.industry`
- **Display Field:** Granular industry classification (e.g., `Private Sector Bank`, `Aerospace & Defense Electronics`)
- **Required / Optional:** Required
- **Allowed Values:** Granular business activity descriptions mapped to parent sectors.
- **Normalization Rule:** Trim. If absent, defaults to `${sector} - General`.
- **UI Usage:** Level 2/3 filter cards, peer comparison groups.

---

### INDEX_MEMBERSHIPS
- **Field Type:** Array of Strings (`string[]`)
- **Source Field:** `Indices`, `Index`, `Benchmark` (or derived deterministically)
- **Normalized Field:** `StockEquity.indices`
- **Display Field:** Index badges (e.g. `NIFTY 50`, `NIFTY IT`, `ALL EQUITIES (Complete Universe)`)
- **Required / Optional:** Optional (Unindexed equities are captured in `UNINDEXED EQUITIES`)
- **Allowed Values:** Benchmark indices (`NIFTY 50`, `NIFTY NEXT 50`, `NIFTY MIDCAP 150`, `NIFTY SMALLCAP 250`, `NIFTY MICROCAP 250`), Sectoral indices, or Universal tiers.
- **Normalization Rule:** Derived deterministically from market cap rank and sector mappings.
- **UI Usage:** Level 1 Navigation Cards, filter chips in tables and modals.

---

## 4. Valuation & Market Metrics Fields

### MARKET_CAP
- **Field Type:** String / Number
- **Source Field:** `Market Cap`, `Market Capitalization`, `MCAP`
- **Normalized Field:** `StockEquity.marketCap` (string) & `StockEquity.marketCapValue` (number in Cr)
- **Display Field:** `₹19.80 Lakh Cr` or `₹14,500 Cr`
- **Required / Optional:** Optional
- **Allowed Values:** Positive numbers.
- **Normalization Rule:** Formats into Lakh Crores for values >= 100,000 Cr, otherwise standard INR Crores.
- **UI Usage:** Summary metric badge, sorting key in tables.

---

### CAP_TIER
- **Field Type:** String (Enum)
- **Source Field:** `Cap Tier`, `Tier`, `Market Cap Tier`
- **Normalized Field:** `StockEquity.capTier`
- **Display Field:** `HIGH`, `MID`, `LOW`
- **Required / Optional:** Required
- **Allowed Values:**
  - `HIGH`: Large Cap (Ranks 1–100)
  - `MID`: Mid Cap (Ranks 101–350)
  - `LOW`: Small / Micro Cap (Ranks 351–1120)
- **Normalization Rule:** If not provided in CSV, calculated automatically from `marketCapRank`.
- **UI Usage:** Tier filter buttons, colored cap badges.

---

### CURRENT_PRICE
- **Field Type:** Number
- **Source Field:** `Current Price`, `CMP`, `LTP`, `Close Price`, `Price`
- **Normalized Field:** `StockEquity.currentPrice`
- **Display Field:** `₹2,945.50`
- **Required / Optional:** Optional
- **Allowed Values:** Positive decimal number.
- **Normalization Rule:** Strips currency symbols and commas.
- **UI Usage:** Card header, table price column.

---

### PE_RATIO
- **Field Type:** Number
- **Source Field:** `P/E Ratio`, `PE`, `P/E`
- **Normalized Field:** `StockEquity.peRatio`
- **Display Field:** `26.4x` or `—`
- **Required / Optional:** Optional
- **Allowed Values:** Decimal number or `undefined`.
- **Normalization Rule:** Parsed as floating point.
- **UI Usage:** Valuation comparison column.

---

### ROE_PERCENT
- **Field Type:** Number
- **Source Field:** `ROE (%)`, `ROE`, `Return on Equity`
- **Normalized Field:** `StockEquity.roePercent`
- **Display Field:** `9.8%` or `—`
- **Required / Optional:** Optional
- **Allowed Values:** Decimal number.
- **Normalization Rule:** Strips `%` sign.
- **UI Usage:** Profitability metric chip.

---

### DIVIDEND_YIELD
- **Field Type:** Number
- **Source Field:** `Dividend Yield (%)`, `Yield (%)`, `Div Yield`
- **Normalized Field:** `StockEquity.dividendYieldPercent`
- **Display Field:** `0.35%` or `—`
- **Required / Optional:** Optional
- **Allowed Values:** Decimal number.
- **Normalization Rule:** Strips `%` sign.
- **UI Usage:** Yield metric indicator.

---

### 52_WEEK_HIGH & 52_WEEK_LOW
- **Field Type:** Number
- **Source Field:** `52 Week High`, `52 Week Low`, `52W High`, `52W Low`
- **Normalized Field:** `StockEquity.week52High`, `StockEquity.week52Low`
- **Display Field:** `₹3,681.88 / ₹2,120.76`
- **Required / Optional:** Optional
- **Allowed Values:** Positive numbers.
- **Normalization Rule:** Cleaned and parsed as float.
- **UI Usage:** 52-week price range progress bar in Stock Inspector Modal.

---

### BETA
- **Field Type:** Number
- **Source Field:** `Beta`
- **Normalized Field:** `StockEquity.beta`
- **Display Field:** `1.05`
- **Required / Optional:** Optional
- **Allowed Values:** Positive decimal number (typical range 0.40 to 2.20).
- **Normalization Rule:** Float parse.
- **UI Usage:** Systematic risk indicator in Research modals.

---

## 5. Validation & Integrity Fields

### VALIDATION_STATUS
- **Field Type:** String (Enum)
- **Source Field:** N/A (Derived by `dataValidationService.ts`)
- **Normalized Field:** `StockEquity.validationStatus`
- **Display Field:** `[VALID]`, `[INVALID_SYMBOL]`, `[MISSING_SYMBOL]`, `[DUPLICATE_SYMBOL]`, `[UNRESOLVED]`
- **Required / Optional:** Assigned to every record.
- **Allowed Values:**
  - `VALID`: Passed all format, length, pattern, and collision checks.
  - `INVALID_SYMBOL`: Matched synthetic pattern (e.g. `ARIH1002`, `STOCK_1`) or invalid characters.
  - `MISSING_SYMBOL`: Source row had blank or null symbol.
  - `DUPLICATE_SYMBOL`: Same symbol mapped to conflicting legal company names.
  - `UNRESOLVED`: Critical structure or column failure.
- **UI Usage:** Level 4 Warning badges and Validation Report summary table.
