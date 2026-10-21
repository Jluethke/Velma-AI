# Portfolio Check

Gives you a clear, honest snapshot of where your investments stand right now. Not a trading signal, not financial advice, not a pitch to buy anything. Just the numbers: what you hold, how it performed over the day/week/month/quarter, whether your allocation drifted from your targets, which positions moved the most, and what dividends came in. Designed for the person who wants to stay informed without staring at a brokerage app all day.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY    --> Catalog all holdings across accounts
PHASE 2: PERFORMANCE  --> Calculate returns by position and period
PHASE 3: ALLOCATION   --> Compare current mix to target allocation
PHASE 4: SIGNALS      --> Flag drift, concentration risk, and dividend activity
PHASE 5: SUMMARY      --> One-page digest with action items if any
```

## Inputs
- `holdings`: object -- All investment accounts and positions. For each: account name/type (brokerage, 401k, IRA, HSA, crypto wallet), ticker/asset name, share count or unit count, cost basis if known. Can be a paste from a brokerage statement or manual entry.
- `allocation_targets`: object -- (Optional) Target percentages by asset class: US stocks, international stocks, bonds, real estate, crypto, cash. If not provided, defaults will be estimated based on time horizon using age-based heuristics.
- `time_horizon`: string -- (Optional) Investment time horizon: "short" (under 3 years), "medium" (3-10 years), "long" (10+ years). Affects allocation benchmarks and risk framing.

## Outputs
- `holdings_summary`: object -- Every position with current value, cost basis, unrealized gain/loss in dollars and percentage, and weight in overall portfolio
- `performance_report`: object -- Returns for each position and the total portfolio over 1-day, 1-week, 1-month, 3-month, YTD, and 1-year windows
- `allocation_analysis`: object -- Current allocation by asset class vs. target, with drift percentages and whether each class is over/underweight
- `rebalance_actions`: array -- Specific trades needed to return to target allocation, ordered by priority, with dollar amounts

## Execution

### Phase 1: INVENTORY
### Entry Criteria
At least one account with holdings provided.
### Actions
1. Parse all holdings into a unified table: account, asset name, ticker (if applicable), asset class (US equity, international equity, fixed income, real estate/REIT, commodity, crypto, cash/money market), share count, cost basis per share if known.
2. Look up current price for each position. For mutual funds and ETFs, identify underlying asset class. For target-date funds, break into approximate stock/bond split (e.g., a 2050 target date fund is roughly 90% stock / 10% bond).
3. Calculate current market value for each position: shares x current price.
4. Sum total portfolio value across all accounts. Note any positions where price data is unavailable (private investments, alternative assets) and use last known or stated value.
5. Flag any single position exceeding 15% of total portfolio as a concentration risk.

### Output
Unified holdings table with account, ticker, asset class, shares, cost basis, current price, current value, portfolio weight percentage.
### Quality Gate
Every position has a current value. Total portfolio value is calculated. Asset class is assigned for every holding.

### Phase 2: PERFORMANCE
### Entry Criteria
Holdings inventory complete with current prices.
### Actions
1. Calculate unrealized gain/loss for each position: (current price - cost basis) x shares. Express as both dollar amount and percentage. If no cost basis, show "N/A" for gain/loss but still show current value.
2. Calculate portfolio-level returns for standard periods: 1-day, 1-week, 1-month, 3-month, YTD, 1-year. Use dollar-weighted returns if cash flows occurred, time-weighted if not.
3. Identify top 3 movers (largest gain) and bottom 3 movers (largest loss) by dollar impact over the past month. Not percentage -- dollar impact to the portfolio.
4. Compare portfolio return against benchmarks: S&P 500 (US stocks), MSCI EAFE (international), Bloomberg Aggregate (bonds), 60/40 blend (balanced). Use the benchmark most appropriate to the portfolio's risk profile.
5. Calculate portfolio beta if sufficient equity data exists: a beta above 1.2 means significantly more volatile than the market, below 0.8 means more conservative.

### Output
Performance table per position and portfolio total, benchmark comparison, top/bottom movers, risk metrics.
### Quality Gate
Returns calculated for at least 3 time periods. Benchmark comparison is relevant to portfolio composition. Dollar impact, not just percentages.

### Phase 3: ALLOCATION
### Entry Criteria
Performance calculations complete. Allocation targets available (provided or estimated).
### Actions
1. If no targets provided, set defaults based on time horizon:
   - Short (under 3 years): 30% stocks / 50% bonds / 15% cash / 5% alternatives
   - Medium (3-10 years): 60% stocks / 30% bonds / 5% cash / 5% alternatives
   - Long (10+ years): 80% stocks / 10% bonds / 5% cash / 5% alternatives
   - Within stocks, default split: 70% US / 30% international
2. Calculate current allocation by asset class as percentage of total portfolio.
3. Calculate drift: current percentage minus target percentage for each class. Flag any class where drift exceeds 5 percentage points as needing attention.
4. Check for hidden concentration: multiple funds holding the same underlying stocks (e.g., an S&P 500 ETF + a total market ETF are 80%+ overlapping). Deduplicate and show effective exposure.
5. Assess sector concentration within equities if data is available. Flag any single sector above 30% of equity allocation (tech-heavy portfolios are the most common offender).

### Output
Allocation table showing target vs. actual per asset class, drift amounts, overlap analysis, sector concentration flags.
### Quality Gate
Every dollar is allocated to an asset class. Drift is calculated for every class. Overlap between similar funds is identified.

### Phase 4: SIGNALS
### Entry Criteria
Allocation analysis complete.
### Actions
1. Check dividend activity: any dividends received in the past 30 days, amount, whether reinvested or cash. Calculate trailing 12-month dividend yield for the portfolio.
2. Flag tax-loss harvesting opportunities: any position with unrealized loss exceeding $1,000 that could be sold and replaced with a similar (not substantially identical) fund to capture the tax deduction. Note the 30-day wash sale rule.
3. Flag positions that may need attention:
   - Cost basis missing (makes tax reporting harder)
   - Holdings in a taxable account that would be more tax-efficient in an IRA (e.g., REITs, high-yield bonds)
   - Cash drag: more than 5% sitting in cash or money market if time horizon is medium or long
4. Check rebalance threshold: if any asset class has drifted more than 5 percentage points from target, generate specific rebalance trades (what to sell, what to buy, dollar amounts).
5. Note any upcoming events: ex-dividend dates in the next 30 days, fund distributions (common in November-December for mutual funds), bond maturities.

### Output
Dividend summary, tax-loss harvesting candidates, account optimization suggestions, rebalance trade list, upcoming events.
### Quality Gate
Dividend data is current. Tax suggestions note that this is not tax advice. Rebalance trades sum to zero (sells fund buys).

### Phase 5: SUMMARY
### Entry Criteria
All signals analyzed.
### Actions
1. Write a one-page digest:
   - Total portfolio value and change since last check
   - One-sentence performance summary vs. benchmark
   - Allocation status: on target, slightly drifted, or needs rebalancing
   - Top mover and bottom mover with context (why it moved if obvious)
   - Any action items (rebalance, harvest loss, reinvest cash)
2. Assign an overall portfolio health rating:
   - Green: within allocation targets, performing within 2% of benchmark, no concentration risk
   - Yellow: minor drift (5-10%), or single position above 15%, or underperforming benchmark by 2-5%
   - Red: major drift (10%+), or single position above 25%, or significant underperformance
3. If action items exist, prioritize them: tax-loss harvesting before year-end > rebalancing > account optimization > cash deployment.

### Output
One-page portfolio digest, health rating, prioritized action list.
### Quality Gate
Digest fits on one screen. Health rating has clear justification. Actions are specific with dollar amounts.


---

## Worked Example

Illustrative only.

Given typical inputs for How are my investments doing? Holdings summary, performance by period, asset all, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) all holdings cataloged with current values, (2) performance calculated for at least 3 time periods with benchmark comparison, (3) allocation vs. target analyzed with drift flags, (4) dividends and signals reviewed, (5) one-page digest produced with health rating.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | Missing prices for some holdings | Use last known price, note staleness. If no price ever available, use stated value with a flag |
| INVENTORY | Mixed currencies | Convert all to USD using current exchange rates, note FX exposure as a separate risk factor |
| PERFORMANCE | No cost basis for positions | Show current value and period returns but mark gain/loss as "N/A". Recommend contacting brokerage for cost basis |
| ALLOCATION | No targets provided and no time horizon | Default to moderate (60/40) and note the assumption explicitly |
| SIGNALS | Unable to determine dividend data | Skip dividend section, note the gap |
| SIGNALS | User has only one account type | Skip account optimization suggestions (nothing to optimize across) |

## State Persistence
- Holdings snapshot with date (for tracking changes between runs)
- Performance history per run (for trend tracking across months)
- Allocation drift history (for detecting persistent imbalances)
- Dividend income log (for projecting annual yield)
- Rebalance action log (what was suggested vs. what was executed)

## Reference

### Age-Based Allocation Heuristics

| Age Range | Stocks | Bonds | Cash/Alternatives |
|---|---|---|---|
| 20-35 | 80-90% | 5-15% | 5% |
| 36-50 | 60-80% | 15-30% | 5-10% |
| 51-60 | 50-65% | 25-40% | 10% |
| 61+ | 30-50% | 40-55% | 10-15% |

These are starting points. Actual allocation depends on risk tolerance, other income sources, and specific goals.

### Rebalance Thresholds

| Drift Level | Action |
|---|---|
| Under 3% | No action needed |
| 3-5% | Monitor, rebalance at next contribution |
| 5-10% | Rebalance within 30 days |
| Over 10% | Rebalance immediately |

### Common Benchmark Returns (Historical Annual Average)

| Benchmark | 10-Year Avg | Use For |
|---|---|---|
| S&P 500 | ~10-12% | US large cap equity |
| MSCI EAFE | ~5-7% | International developed |
| Bloomberg Agg | ~1-3% | US investment-grade bonds |
| 60/40 Blend | ~7-9% | Balanced portfolios |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
