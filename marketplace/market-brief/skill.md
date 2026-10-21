# Market Brief

A fast, no-nonsense summary of what happened in financial markets. Covers index performance, which sectors led and lagged, notable earnings or economic data, what central banks did or said, and a crypto snapshot. Designed to be read in under two minutes so you stay informed without drowning in financial media noise. No predictions, no hype, no "markets are jittery" filler language.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INDICES      --> Major index performance and context
PHASE 2: SECTORS      --> What led, what lagged, and why
PHASE 3: CATALYSTS    --> Earnings, economic data, central bank actions
PHASE 4: CRYPTO       --> Bitcoin, Ethereum, and notable altcoin moves
PHASE 5: DIGEST       --> Two-minute readable summary with portfolio relevance
```

## Inputs
- `interests`: array -- (Optional) Sectors or topics of particular interest: tech, energy, healthcare, real estate, etc. Prioritizes coverage of these areas.
- `portfolio_context`: object -- (Optional) If the user has holdings, note major positions so the brief can flag relevant moves. Ticker list is enough.
- `period`: string -- (Optional) "today", "this week", "this month". Defaults to "today" for a daily brief, "this week" for a Monday morning catch-up.

## Outputs
- `index_summary`: object -- Performance of major indices (S&P 500, NASDAQ, Dow, Russell 2000, international) with point and percentage change
- `sector_rotation`: object -- 11 GICS sectors ranked by performance, top 3 and bottom 3 highlighted with reasons
- `notable_events`: array -- Earnings beats/misses, economic releases (CPI, jobs, GDP, PMI), Fed/ECB/BOJ actions or commentary
- `crypto_overview`: object -- BTC and ETH price and change, total crypto market cap, any notable altcoin moves or regulatory news
- `relevance_notes`: array -- (If portfolio context provided) Which of the user's holdings were directly affected by today's moves

## Execution

### Phase 1: INDICES
### Entry Criteria
Period is established (today, this week, this month).
### Actions
1. Gather closing or current data for major indices:
   - S&P 500 (US large cap, broadest market gauge)
   - NASDAQ Composite (tech-heavy)
   - Dow Jones Industrial Average (30 blue chips)
   - Russell 2000 (small caps, leading indicator of risk appetite)
   - MSCI EAFE (international developed)
   - MSCI Emerging Markets
   - 10-Year US Treasury Yield (bond market signal)
   - VIX (volatility index, fear gauge: below 15 = calm, 15-25 = normal, above 25 = elevated anxiety, above 35 = panic)
2. For each index: point change, percentage change, whether it closed at or near a 52-week high or low.
3. Identify the dominant market theme: risk-on (stocks up, yields up, VIX down), risk-off (stocks down, bonds up, VIX up), rotation (some sectors up, others down, market flat), or mixed (no clear signal).
4. Note market breadth: what percentage of S&P 500 stocks were up vs. down. A market that's up 1% but only 40% of stocks advanced is narrow (often unhealthy). A market up 0.5% with 70% advancing is broad (usually healthier).

### Output
Index performance table, market theme classification, breadth reading.
### Quality Gate
All major indices have data. Theme is identified. Breadth is noted.

### Phase 2: SECTORS
### Entry Criteria
Index data collected.
### Actions
1. Rank the 11 GICS sectors by performance for the period:
   - Technology, Healthcare, Financials, Consumer Discretionary, Consumer Staples, Energy, Industrials, Materials, Real Estate, Utilities, Communication Services
2. Highlight the top 3 performers with a one-line reason (e.g., "Energy +2.3%: crude oil up on OPEC supply cut confirmation").
3. Highlight the bottom 3 performers with a one-line reason (e.g., "Real Estate -1.1%: 10-year yield jumped 8bps, pressuring rate-sensitive sectors").
4. Note any sector divergence that tells a story: utilities and staples leading usually signals defensive positioning. Tech and discretionary leading signals growth optimizm. Energy and materials leading signals inflation/commodity concerns.
5. If the user specified interest sectors, give those extra detail regardless of their rank.

### Output
Sector ranking table, top 3 and bottom 3 with reasons, rotation narrative.
### Quality Gate
All 11 sectors ranked. Reasons are specific, not generic. User's interest sectors covered.

### Phase 3: CATALYSTS
### Entry Criteria
Sector analysis complete.
### Actions
1. Earnings: list any major company earnings reported in the period. For each: company name, EPS vs. estimate (beat/miss by how much), revenue vs. estimate, guidance (raised/maintained/lowered), stock reaction. Focus on market-moving names -- not every small-cap report.
2. Economic data releases: CPI/PPI (inflation), Non-Farm Payrolls/unemployment (jobs), GDP, PMI/ISM (manufacturing/services health), consumer confidence, housing starts/permits, retail sales. For each: actual vs. consensus estimate, what it signals.
3. Central bank actions: Fed rate decisions, FOMC minutes, Fed governor speeches (especially if they moved markets). ECB, BOJ, BOE if they acted or said something market-moving. Note the current Fed Funds rate and where futures price the next move.
4. Geopolitical or macro events: trade policy changes, sanctions, supply chain disruptions, commodity shocks, major regulatory announcements affecting markets.
5. Rank catalysts by market impact: which single event moved markets the most today/this week.

### Output
Earnings table, economic data summary, central bank actions, geopolitical flags, impact ranking.
### Quality Gate
Data is actual numbers, not vague ("inflation came in hot" is not enough -- include the actual CPI print and the consensus). Impact ranking identifies the single biggest mover.

### Phase 4: CRYPTO
### Entry Criteria
Traditional market analysis complete.
### Actions
1. Bitcoin: current price, period change (dollar and percentage), distance from all-time high, dominance percentage (BTC share of total crypto market cap).
2. Ethereum: current price, period change, ETH/BTC ratio trend (measuring ETH performance relative to BTC).
3. Total crypto market cap and period change.
4. Notable altcoin moves: any token in the top 50 by market cap that moved more than 10% in either direction, with a one-line reason if known.
5. Regulatory and institutional news: ETF flows (spot BTC/ETH ETFs), exchange news, regulatory actions (SEC, CFTC, international), major institutional adoption or abandonment.
6. DeFi/stablecoin snapshot: total value locked in DeFi, any stablecoin de-peg events (USDT/USDC/DAI), significant protocol events.

### Output
BTC and ETH summary, market cap, notable altcoin moves, regulatory/institutional news, DeFi snapshot.
### Quality Gate
Prices are current. Moves have reasons where identifiable. Regulatory news is factual, not speculative.

### Phase 5: DIGEST
### Entry Criteria
All market data collected and analyzed.
### Actions
1. Write the two-minute digest in this structure:
   - **Headline:** One sentence summarizing the market day/week (e.g., "Markets rallied on cooler CPI print, S&P 500 up 1.2% to close at 5,450")
   - **The Number:** Single most important data point or event
   - **Winners/Losers:** Three lines max covering what worked and what didn't
   - **What's Next:** Key events in the next 1-3 days (earnings, data releases, Fed meetings)
2. If portfolio context was provided, add a "Your Portfolio" section: flag any holdings that were directly affected by today's events. Note if any of the user's positions reported earnings, were affected by sector rotation, or had significant price moves.
3. Keep language flat and factual. No "investors are nervous" or "markets cheered the data." Say what happened and let the reader draw conclusions.
4. Total word count target: 300-500 words. If it's longer, cut the least important items.

### Output
Two-minute market digest, portfolio relevance notes if applicable, upcoming events calendar.
### Quality Gate
Under 500 words. No filler language. Every sentence has a fact or number. Upcoming events are dated.


---

## Worked Example

Illustrative only.

Given typical inputs for What happened in the markets today? Index performance, sector rotation, notable , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) all major indices reported with performance data, (2) sectors ranked with reasons for leaders/laggards, (3) catalysts identified with actual numbers, (4) crypto snapshot complete, (5) digest is under 500 words and reads in under 2 minutes.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INDICES | Markets are closed (weekend/holiday) | Use most recent closing data, note that markets were closed, preview upcoming week's catalysts |
| INDICES | Data is delayed or unavailable for some indices | Use available data, note gaps, use previous close as fallback |
| SECTORS | Sector data incomplete | Report available sectors, note which are missing |
| CATALYSTS | No major earnings or data releases in period | Note the quiet calendar. A quiet day is still useful information -- it means moves were driven by positioning or technicals, not fundamentals |
| CRYPTO | Crypto data unavailable | Skip crypto section, note that it was omitted |
| DIGEST | Too much happened to fit in 500 words | Prioritize by portfolio impact first, then by market-wide impact. Push lower-priority items to a "Also Notable" bullet list |

## State Persistence
- Market data per run (for building trend context across briefs)
- User interest sectors (so they don't have to re-specify)
- Portfolio tickers (for automatic relevance filtering)
- Notable earnings dates coming up (for proactive flagging)

## Reference

### Key Economic Indicators and Their Market Impact

| Indicator | Frequency | Why It Matters |
|---|---|---|
| CPI / PPI | Monthly | Inflation gauge. Higher than expected = bad for stocks/bonds (suggests tighter Fed policy) |
| Non-Farm Payrolls | Monthly (first Friday) | Jobs market health. Strong = good for economy but can mean higher rates. Weak = recession fear |
| GDP | Quarterly | Overall economic growth. Surprise beats/misses move markets |
| PMI / ISM | Monthly | Manufacturing and services health. Below 50 = contraction. Above 50 = expansion |
| FOMC Decision | 8x/year | Rate changes or guidance shifts move everything |
| Consumer Confidence | Monthly | Forward-looking spending indicator |

### VIX Interpretation

| VIX Level | Market Sentiment |
|---|---|
| Below 12 | Complacent (sometimes a contrarian warning) |
| 12-18 | Normal, low volatility |
| 18-25 | Elevated concern, typical during corrections |
| 25-35 | High fear, usually during selloffs |
| Above 35 | Panic (March 2020 hit 82) |

### Sector Rotation Signals

| Leaders | Laggards | Signal |
|---|---|---|
| Tech, Discretionary | Utilities, Staples | Risk-on, growth optimizm |
| Utilities, Staples, Healthcare | Tech, Discretionary | Defensive rotation, risk-off |
| Energy, Materials | Tech, Financials | Inflation/commodity cycle |
| Financials, Industrials | Real Estate, Utilities | Rising rate environment |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
