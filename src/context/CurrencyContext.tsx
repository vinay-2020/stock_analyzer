import React, { createContext, useContext } from 'react';
import {
  formatCurrency as formatCurr,
  formatCompactCurrency as formatCompactCurr,
  formatPercent as formatPct,
  formatIndianNumber as formatNum,
} from '../utils/currency';

interface CurrencyContextType {
  currency: 'INR';
  formatCurrency: (val: number | null | undefined) => string;
  formatCompactCurrency: (val: number | null | undefined) => string;
  formatPercent: (val: number | null | undefined) => string;
  formatNumber: (val: number | null | undefined, decimals?: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'INR',
  formatCurrency: formatCurr,
  formatCompactCurrency: formatCompactCurr,
  formatPercent: formatPct,
  formatNumber: formatNum,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <CurrencyContext.Provider
      value={{
        currency: 'INR',
        formatCurrency: formatCurr,
        formatCompactCurrency: formatCompactCurr,
        formatPercent: formatPct,
        formatNumber: formatNum,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
