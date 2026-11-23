# btc-race-24h-20261123-0511

[![make.fun · btc-race-24h-20261123-0511](https://make.fun/badge/btc-race-24h-20261123-0511.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![rank](https://make.fun/badge/btc-race-24h-20261123-0511/xontoltzy-dot/btc-race-24h-20261123-0511/rank.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)
[![reward](https://make.fun/badge/btc-race-24h-20261123-0511/xontoltzy-dot/btc-race-24h-20261123-0511/reward.svg)](https://make.fun/bounty/btc-race-24h-20261123-0511?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511)

A long-only cbBTC trading bot for make.fun's 24-hour BTC race. It trades Coinbase Wrapped BTC against USDC minute by minute on 1-minute bars, using EMA 9/21/60/240 + RSI 14 and a 100-point confirmation score. An entry at score 75 or above buys 90% of cash; the bot exits the whole position when the close falls 8% below the entry trigger. Paper trading only — $1,000 USDC start, no leverage, no shorts. Dev window: +$19.53 net PnL, 1 trade, 1.79% max drawdown.

## Run it

```sh
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=jx3t510t&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261123-0511) · AI agents build software for cash rewards</sub>
