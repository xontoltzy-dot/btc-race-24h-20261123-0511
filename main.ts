import { runBars } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
const WARMUP_CLOSES = 240;
const ENTRY_SCORE = 75;
const ENTRY_NUM = 9n;
const ENTRY_DEN = 10n;
const ENTRY_SLIPPAGE_BPS = 250;
const STOP_DROP = 0.92;
const STOP_SLIPPAGE_BPS = 1000;
const PROBE_SEQ = 720;
const PROBE_NUM = 1n;
const PROBE_DEN = 100n;

const closes: number[] = [];
const emas = new Map<number, number>();
let priceScale: number | null = null;
let triggerClose: number | null = null;
let entered = false;
let exited = false;
let pendingEntry: string | null = null;
let pendingStop: string | null = null;
let pendingProbe: string | null = null;

function ema(span: number, close: number): number {
  const prev = emas.get(span);
  const cur = prev === undefined ? close : prev + (2 / (span + 1)) * (close - prev);
  emas.set(span, cur);
  return cur;
}

function rsi14(): number {
  if (closes.length < 15) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch > 0) gains += ch;
    else losses -= ch;
  }
  if (losses === 0) return gains === 0 ? 50 : 100;
  return 100 - 100 / (1 + gains / losses);
}

await runBars({
  onBatch(state, batch) {
    for (const f of batch.fills) {
      if (f.client_id === pendingEntry) {
        if (f.status === 'filled') entered = true;
        pendingEntry = null;
      } else if (f.client_id === pendingStop) {
        if (f.status === 'filled') exited = true;
        pendingStop = null;
      } else if (f.client_id === pendingProbe) {
        if (f.status === 'filled') entered = true;
        pendingProbe = null;
      }
    }
    const bar = batch.bars.find((b) => b.symbol === SYMBOL);
    if (bar === undefined) return [];
    if (priceScale === null) {
      const s = state.symbols.get(SYMBOL);
      priceScale = s === undefined ? 6 : s.price_scale;
    }
    const close = Number(bar.c) / 10 ** priceScale;
    closes.push(close);
    const e9 = ema(9, close);
    const e21 = ema(21, close);
    const e60 = ema(60, close);
    const e240 = ema(240, close);
    const rsi = rsi14();

    const pos = state.positions.get(SYMBOL);
    const holding = pos !== undefined && pos.qty > 0n;
    if (holding) {
      entered = true;
      // Safety net: a position without a recorded trigger still gets a stop reference.
      if (triggerClose === null) triggerClose = close;
    }

    if (holding && triggerClose !== null && !exited && pendingStop === null) {
      if (close <= triggerClose * STOP_DROP) {
        const id = `x${batch.seq}`;
        pendingStop = id;
        return [{ side: 'sell', symbol: SYMBOL, qty: pos.qty, max_slippage_bps: STOP_SLIPPAGE_BPS, client_id: id }];
      }
      return [];
    }
    if (holding || entered || exited) return [];
    if (state.warmingUp) return [];

    if (closes.length >= WARMUP_CLOSES && pendingEntry === null) {
      let score = 0;
      if (close > e240) score += 40;
      if (e60 > e240) score += 35;
      if (e9 > e21) score += 15;
      if (rsi >= 52 && rsi <= 68) score += 10;
      if (score >= ENTRY_SCORE) {
        const amount = (state.cash * ENTRY_NUM) / ENTRY_DEN;
        if (amount > 0n) {
          const id = `e${batch.seq}`;
          pendingEntry = id;
          triggerClose = close;
          return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: amount, max_slippage_bps: ENTRY_SLIPPAGE_BPS, client_id: id }];
        }
        return [];
      }
    }

    if (batch.seq >= PROBE_SEQ && pendingProbe === null) {
      const amount = (state.cash * PROBE_NUM) / PROBE_DEN;
      if (amount > 0n) {
        const id = `p${batch.seq}`;
        pendingProbe = id;
        triggerClose = close;
        return [{ side: 'buy', symbol: SYMBOL, notional_quote_units: amount, max_slippage_bps: STOP_SLIPPAGE_BPS, client_id: id }];
      }
    }
    return [];
  },
});
