/**
 * Pure mathematical and technical calculation utilities.
 * Strictly deterministic — no random numbers or synthetic guesses.
 */

export interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Calculates Exponential Moving Average (EMA) for an array of price values.
 * Uses standard multiplier: 2 / (period + 1)
 */
export function calculateEMA(prices: number[], period: number): (number | undefined)[] {
  if (prices.length < period) {
    return new Array(prices.length).fill(undefined);
  }

  const ema: (number | undefined)[] = new Array(prices.length).fill(undefined);
  const multiplier = 2 / (period + 1);

  // Initialize with Simple Moving Average for the first 'period' elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  let prevEma = sum / period;
  ema[period - 1] = prevEma;

  // Calculate successive EMAs
  for (let i = period; i < prices.length; i++) {
    const currentPrice = prices[i];
    prevEma = (currentPrice - prevEma) * multiplier + prevEma;
    ema[i] = prevEma;
  }

  return ema;
}

/**
 * Calculates Relative Strength Index (RSI) using standard Wilder's smoothing.
 * Period default: 14
 */
export function calculateRSI(prices: number[], period: number = 14): (number | undefined)[] {
  if (prices.length <= period) {
    return new Array(prices.length).fill(undefined);
  }

  const rsi: (number | undefined)[] = new Array(prices.length).fill(undefined);
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(0, change));
    losses.push(Math.max(0, -change));
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) {
    rsi[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    rsi[period] = 100 - 100 / (1 + rs);
  }

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi[i + 1] = 100;
    } else {
      const rs = avgGain / avgLoss;
      rsi[i + 1] = 100 - 100 / (1 + rs);
    }
  }

  return rsi;
}

/**
 * Calculates standard deviation of an array of numbers.
 */
export function calculateStdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculates median of an array of numbers.
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculates percentage difference: ((a - b) / b) * 100
 */
export function pctDifference(current: number, base: number): number {
  if (base === 0) return 0;
  return ((current - base) / base) * 100;
}
