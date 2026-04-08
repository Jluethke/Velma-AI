# Portfolio Rebalancer

**One-line description:** Analyze a portfolio allocation against target allocation, calculate tax and cost implications, and generate prioritized rebalancing recommendations aligned with risk tolerance, time horizon, and tax efficiency.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `portfolio_holdings` (object, required): Current portfolio with fields:
  - `assets` (array of objects): Each asset with `symbol`, `quantity`, `current_price`, `cost_basis_per_share`, `asset_class` (e.g., "US Equity", "International Equity", "Bonds", "Cash")
  - `account_type` (string): "taxable", "401k", "IRA", "529", etc.
  - `total_value` (number): Sum of all current holdings in dollars

- `client_profile` (object, required): Client characteristics with fields:
  - `risk_tolerance` (string): "conservative", "moderate", "aggressive"
  - `time_horizon_years` (number): Years until funds are needed
  - `tax_bracket` (number): Federal marginal tax rate (0.0-0.37)
  - `holding_period_preference` (string): "short-term", "long-term", "mixed"

- `target_allocation` (object, required): Target allocation model with fields:
  - `allocations` (object): Keys are asset classes, values are target percentages (sum to 100)
  - `rebalance_threshold_percent` (number, optional, default 5): Trigger rebalancing if any asset class deviates by this percentage

- `constraints` (object, optional): Operational constraints with fields:
  - `max_transaction_cost_percent` (number, default 0.1): Maximum acceptable transaction cost as % of portfolio
  - `avoid_wash_sales` (boolean, default true): Apply wash-sale rule checks
  - `minimum_holding_period_days` (number, default 0): Minimum days before selling an asset
  - `liquidity_preference` (string, default "standard"): "high", "standard", "low"
  - `dry_run_mode` (boolean, default false): If true, simulate rebalancing without committing trades

---

## Outputs

- `rebalancing_report` (object): Complete rebalancing analysis with fields:
  - `executive_summary` (string): High-level overview of portfolio status and recommendations
  - `current_allocation` (object): Current allocation percentages by asset class
  - `target_allocation` (object): Target allocation percentages by asset class
  - `deviations` (array of objects): Overweight/underweight analysis with fields: `asset_class`, `current_percent`, `target_percent`, `deviation_percent`, `action` ("reduce", "increase", "hold")
  - `rebalancing_needed` (boolean): Whether rebalancing is recommended
  - `recommended_trades` (array of objects): Ordered list of trades with fields:
    - `action` (string): "sell" or "buy"
    - `symbol` (string): Asset symbol
    - `quantity` (number): Shares to trade
    - `estimated_value` (number): Dollar amount
    - `rationale` (string): Why this trade is recommended
    - `tax_impact` (number): Estimated capital gains/losses in dollars
    - `transaction_cost` (number): Estimated cost in dollars
    - `priority` (number): Execution order (1 = highest priority)
  - `tax_analysis` (object): Summary with fields:
    - `total_capital_gains` (number): Total realized gains from trades
    - `total_capital_losses` (number): Total realized losses from trades
    - `net_tax_liability` (number): Estimated federal tax cost/benefit
    - `tax_loss_harvesting_opportunities` (array): Assets with unrealized losses available for harvesting
  - `cost_benefit_analysis` (object): Quantified value of rebalancing with fields:
    - `total_rebalancing_cost` (number): Sum of transaction costs and tax liability
    - `risk_reduction_value` (number): Estimated value of improved alignment (basis points of portfolio value)
    - `cost_benefit_ratio` (number): Rebalancing benefit divided by cost
    - `recommendation` (string): "rebalance_now", "wait_and_monitor", or "defer"
  - `implementation_notes` (array): Warnings, constraints, or special considerations
  - `expected_outcome` (string): Description of portfolio state after rebalancing
  - `dry_run_summary` (object, optional): If dry_run_mode=true, projected portfolio state without executing trades

---

## Execution Phases

### Phase 1: Collect and Validate Portfolio Data

**Entry Criteria:**
- `portfolio_holdings` is provided and non-empty
- `client_profile` is provided with required fields (risk_tolerance, time_horizon_years, tax_bracket)
- `target_allocation` is provided

**Actions:**
1. Parse and validate all portfolio holdings; confirm total value matches sum of positions (tolerance: within 0.01% due to rounding)
2. Validate client profile fields; confirm risk_tolerance is one of ["conservative", "moderate", "aggressive"], time_horizon_years is a positive number, tax_bracket is between 0.0 and 0.37
3. Validate target allocation; confirm asset classes sum to 100% (tolerance: within 0.1%), and that all asset classes in target allocation are present in portfolio (or add with 0 value)
4. Calculate current allocation percentages for each asset class: (asset_class_value / total_portfolio_value) × 100
5. For optional fields in constraints, apply defaults: max_transaction_cost_percent=0.1, avoid_wash_sales=true, minimum_holding_period_days=0, liquidity_preference="standard", dry_run_mode=false
6. Flag any missing or invalid data; document assumptions in data quality report

**Output:**
- Validated portfolio snapshot with current allocation percentages (verified to sum to 100% within 0.1%)
- Validated client profile and target allocation
- Data quality report listing any warnings, assumptions, or defaults applied

**Quality Gate:**
- Portfolio total value > 0, verified by: sum(asset_value for each asset) = portfolio_holdings.total_value ± 0.01%
- All asset classes in target allocation are present in portfolio (or explicitly added with 0 value)
- Client profile is complete: risk_tolerance ∈ {"conservative", "moderate", "aggressive"}, time_horizon_years > 0, tax_bracket ∈ [0.0, 0.37]
- Target allocation sums to 100% ± 0.1%
- No critical data gaps: all required fields are populated

---

### Phase 2: Assess Allocation Deviations

**Entry Criteria:**
- Portfolio snapshot and current allocation percentages are available from Phase 1
- Target allocation is validated
- Rebalance threshold is defined (default 5%, or from target_allocation.rebalance_threshold_percent)

**Actions:**
1. For each asset class, calculate deviation = current_percent - target_percent
2. Identify overweight positions: deviation > rebalance_threshold_percent
3. Identify underweight positions: deviation < -rebalance_threshold_percent
4. Identify positions at target: -rebalance_threshold_percent ≤ deviation ≤ rebalance_threshold_percent
5. Calculate total portfolio deviation metric: sum(|deviation| for all asset classes) / 2 (divide by 2 because overweights and underweights offset)
6. Determine rebalancing necessity: set rebalancing_needed = true if (any single deviation exceeds threshold) OR (total portfolio deviation > 10%); otherwise rebalancing_needed = false
7. Document the decision logic and threshold values used

**Output:**
- Deviation report with columns: asset_class, current_percent, target_percent, deviation_percent, action ("reduce"/"increase"/"hold")
- Boolean flag: `rebalancing_needed` with explicit decision rationale
- Total portfolio deviation metric (numeric value)
- Threshold values used (rebalance_threshold_percent, total_deviation_threshold=10%)

**Quality Gate:**
- Deviations sum to zero ± 0.1% (verified by: sum(deviation for all asset classes) ≈ 0)
- Threshold is applied consistently: each asset class is classified as overweight, underweight, or at-target using the same threshold
- Rebalancing decision is explicit and testable: rebalancing_needed is a boolean with documented decision rule
- Total portfolio deviation is calculated and reported

---

### Phase 3: Calculate Tax Implications

**Entry Criteria:**
- Deviation report is complete from Phase 2
- If rebalancing_needed = false, skip this phase and output "No rebalancing needed; tax analysis not required"
- Portfolio holdings include cost_basis_per_share for all assets
- Client tax_bracket is known
- Account type is specified (taxable vs. tax-deferred)

**Actions:**
1. If account_type is not "taxable" (e.g., 401k, IRA), skip tax calculations and note "Tax-deferred account; no capital gains tax applies"
2. For each overweight position identified in Phase 2, calculate unrealized gain/loss per share = current_price - cost_basis_per_share
3. Calculate total unrealized gain/loss = unrealized_gain_per_share × quantity
4. Classify holding period: if (current_date - purchase_date) < 365 days, classify as "short-term"; else "long-term"
5. Apply tax rates: short-term gains taxed at client.tax_bracket (ordinary income rate); long-term gains taxed at 15% (or 20% for tax_bracket > 0.37; use 15% as default if holding period unknown)
6. Calculate tax liability for each proposed sale: tax_liability = unrealized_gain × applicable_tax_rate
7. Identify positions with unrealized losses (unrealized_gain < 0); these are tax-loss harvesting opportunities
8. For each proposed trade, calculate net tax impact = tax_liability_from_sale - tax_benefit_from_harvesting
9. If avoid_wash_sales = true, flag wash-sale risks: for each sale, check if a substantially identical asset was purchased within 30 days before or after the sale date
10. Document all tax assumptions and edge cases (missing holding periods, missing cost basis, etc.)

**Output:**
- Tax impact analysis per proposed trade with fields: symbol, action, unrealized_gain_loss, holding_period_classification, tax_rate_applied, tax_liability, wash_sale_flag
- Total capital gains (sum of positive unrealized gains from proposed sales)
- Total capital losses (sum of negative unrealized gains from proposed sales)
- Net tax liability estimate (total_gains × applicable_rate - total_losses × applicable_rate)
- Tax-loss harvesting opportunities (array of assets with unrealized losses > $500, sorted by loss magnitude)
- Wash-sale warnings (if applicable): list of trades flagged for wash-sale risk with dates and asset pairs
- Tax assumptions documented: holding period classification method, tax rates used, edge cases handled

**Quality Gate:**
- Tax calculations are consistent with client tax_bracket: short-term rates = tax_bracket, long-term rates = 15% or 20%
- Holding periods are correctly classified: short-term < 365 days, long-term ≥ 365 days
- All overweight positions have a tax impact calculated (or flagged as "unknown cost basis")
- Harvesting opportunities are identified: all positions with unrealized losses are listed
- Wash-sale flags are applied only if avoid_wash_sales = true and within 30-day window
- Tax assumptions are documented and traceable

---

### Phase 4: Generate Rebalancing Recommendations

**Entry Criteria:**
- Deviation report is complete from Phase 2
- Tax impact analysis is complete from Phase 3 (or skipped if rebalancing_needed = false or tax-deferred account)
- Transaction costs and constraints are defined from Phase 1

**Actions:**
1. If rebalancing_needed = false, output a "hold" recommendation with explanation: "Current allocation is within [threshold]% of target. No rebalancing recommended at this time. Portfolio will be reviewed in [3-6 months]."; skip remaining actions
2. For each underweight position, calculate target_value = target_percent × total_portfolio_value; calculate shares_to_buy = (target_value - current_value) / current_price
3. For each overweight position, calculate shares_to_sell = (current_value - target_value) / current_price
4. Rank sell trades by priority using this order:
   a. Positions with unrealized losses (tax-loss harvesting candidates) — sorted by loss magnitude (largest first)
   b. Positions with smallest tax liability (tax-efficient sells) — sorted by tax_liability (smallest first)
   c. Positions with highest deviation from target — sorted by |deviation| (largest first)
5. Rank buy trades by priority using this order:
   a. Most underweight positions — sorted by |deviation| (largest first)
   b. Positions that reduce overall portfolio deviation fastest
6. Pair sells and buys to minimize cash drag: if portfolio has available cash, suggest buy-first; otherwise suggest sell-first
7. For each trade, calculate transaction cost using: transaction_cost = trade_value × cost_rate, where cost_rate = 0.05% for equities, 0.01% for bonds, 0% for cash, 0.5% for load mutual funds
8. Filter out trades with transaction_cost > (max_transaction_cost_percent × total_portfolio_value)
9. Assign priority numbers starting at 1 (highest priority) based on ranking from steps 4-5
10. Generate rationale for each trade: "[Action] [Quantity] shares of [Symbol] ([Asset_Class]). Current: [Current%]%, Target: [Target%]%, Deviation: [Deviation%]. Tax impact: $[Tax]. Transaction cost: $[Cost]. Rationale: [Reason based on ranking]."
11. Calculate expected portfolio allocation after all trades: for each asset class, new_percent = (current_value ± trade_value) / total_portfolio_value

**Output:**
- Ordered list of recommended trades with fields: priority, action, symbol, quantity, estimated_value, rationale, tax_impact, transaction_cost, holding_period_classification
- Implementation sequence: "Execute trades in priority order (1 first, then 2, etc.). Sell trades should be executed before buy trades to minimize cash drag."
- Summary of expected portfolio state after rebalancing: "After rebalancing, portfolio allocation will be: [Asset_Class]: [Expected%] (Target: [Target%], Deviation: [Expected_Deviation%])."
- Total transaction costs and total tax impact across all trades

**Quality Gate:**
- All trades have a clear, specific rationale (not generic "rebalance" statements)
- Trades are ordered by priority (1, 2, 3, ... with no gaps)
- Transaction costs are estimated and documented; all trades with cost > max_transaction_cost_percent are filtered out
- Proposed allocation after trades matches target allocation within 0.5% per asset class (or documented residual deviation with explanation)
- At least one trade is recommended if rebalancing_needed = true

---

### Phase 5: Validate Against Constraints and Compliance

**Entry Criteria:**
- Recommended trades are generated from Phase 4
- Constraints are defined from Phase 1 (or defaults applied)

**Actions:**
1. For each trade, check holding period requirement: if minimum_holding_period_days > 0, verify that (current_date - purchase_date) ≥ minimum_holding_period_days; if not met, mark trade as "conditional" with required execution date
2. For each sell trade, check wash-sale violations if avoid_wash_sales = true: query purchase history for 30 days before and after proposed sale date; if substantially identical asset was purchased, flag as "wash-sale risk" and suggest deferring sale or harvesting a substitute asset
3. For each trade, verify account type allows the transaction:
   - Taxable accounts: all trades allowed
   - 401(k): no short selling, no margin, limited investment options (flag if trade involves restricted assets)
   - IRA (Traditional/Roth): no short selling, no margin, no borrowing (flag if trade involves restricted assets)
   - 529: limited to education-related investments (flag if trade involves non-qualified assets)
   - HSA: limited investment options (flag if trade involves restricted assets)
4. For each trade, check liquidity: if liquidity_preference = "high", flag illiquid assets (e.g., penny stocks, thinly traded bonds) with warning; if "low", allow illiquid trades without warning
5. Recalculate total transaction costs across all remaining trades; if total exceeds (max_transaction_cost_percent × total_portfolio_value), remove lowest-priority trades until cost is acceptable; document removed trades and reason
6. Classify each trade as: "approved" (no constraints), "conditional" (executable on specific date or condition), or "blocked" (cannot execute due to constraint)
7. Reorder trades to prioritize unblocked/approved trades first, then conditional trades, then blocked trades (for documentation)
8. Generate compliance notes for each blocked or conditional trade: "[Trade] is [status] because [reason]. [Recovery action if applicable]."

**Output:**
- Validated trade list with fields: priority, action, symbol, quantity, compliance_status ("approved"/"conditional"/"blocked"), compliance_notes
- Compliance notes explaining any blocks or conditions (e.g., "Sell XYZ is blocked due to wash-sale rule; recommend deferring until [date] or harvesting substitute asset ABC instead.")
- Revised implementation sequence: "Execute approved trades first (priority order). Conditional trades may be executed on [dates]. Blocked trades cannot be executed; see compliance notes for alternatives."
- Summary of removed trades (if any): "[N] trades were removed due to transaction cost constraints. Removed trades: [List]. Remaining trades achieve [Residual_Deviation%] allocation deviation."

**Quality Gate:**
- All blocked trades have a documented reason (not vague "constraint violation")
- Conditional trades have explicit conditions for execution (specific dates, market conditions, etc.)
- Remaining approved trades are compliant with all constraints (holding period, wash-sale, account type, liquidity)
- Total transaction costs of remaining trades ≤ max_transaction_cost_percent × total_portfolio_value
- Compliance notes are actionable (e.g., suggest alternative trades or deferral dates)

---

### Phase 6: Perform Cost-Benefit Analysis

**Entry Criteria:**
- Validated trade list is complete from Phase 5
- Tax analysis is complete from Phase 3
- Deviation report is complete from Phase 2

**Actions:**
1. Calculate total rebalancing cost: sum(transaction_costs) + net_tax_liability
2. Estimate risk reduction value from rebalancing: calculate portfolio risk (standard deviation of returns) before and after rebalancing; estimate value of risk reduction in basis points of portfolio value
   - If portfolio is significantly overweight equities (> 5% above target), risk reduction ≈ 10-20 basis points
   - If portfolio is significantly underweight equities (> 5% below target), risk reduction ≈ 5-10 basis points (opportunity cost)
   - If portfolio is within 5% of target, risk reduction ≈ 0-5 basis points
3. Calculate cost-benefit ratio: (risk_reduction_value / total_rebalancing_cost) if total_rebalancing_cost > 0; else ratio = ∞ (free rebalancing)
4. Generate recommendation based on cost-benefit ratio:
   - If ratio > 2.0: "rebalance_now" (benefit is at least 2x the cost)
   - If ratio between 1.0 and 2.0: "rebalance_now" (benefit exceeds cost, but marginal)
   - If ratio between 0.5 and 1.0: "wait_and_monitor" (benefit is less than cost; defer 3-6 months and reassess)
   - If ratio < 0.5: "defer" (cost exceeds benefit; rebalance only if deviations worsen significantly)
5. Document all assumptions: risk reduction estimates, cost calculations, time horizon for reassessment

**Output:**
- Cost-benefit analysis object with fields:
  - `total_rebalancing_cost` (number): sum of transaction costs and net tax liability
  - `risk_reduction_value` (number): estimated value in basis points of portfolio value
  - `cost_benefit_ratio` (number): risk_reduction_value / total_rebalancing_cost
  - `recommendation` (string): "rebalance_now", "wait_and_monitor", or "defer"
  - `rationale` (string): explanation of recommendation based on cost-benefit ratio and portfolio context
  - `reassessment_date` (string): date to revisit rebalancing decision (3-6 months from now)

**Quality Gate:**
- Cost-benefit ratio is calculated and documented
- Recommendation is explicit and tied to ratio thresholds
- Rationale explains the recommendation in plain language
- Reassessment date is specified

---

### Phase 7: Document and Summarize

**Entry Criteria:**
- Validated trade list is complete from Phase 5
- Tax analysis is complete from Phase 3
- Cost-benefit analysis is complete from Phase 6
- All prior phases have produced outputs

**Actions:**
1. Compile executive summary (2-3 sentences): portfolio status (current allocation vs. target), key deviations, rebalancing recommendation, expected tax impact, and cost-benefit recommendation
2. Create current vs. target allocation comparison: table with columns [Asset_Class, Current%, Target%, Deviation%, Action]
3. List all recommended trades with full details: priority, action, symbol, quantity, value, tax impact, transaction cost, rationale, compliance status
4. Summarize tax analysis: total capital gains, total capital losses, net tax liability, tax-loss harvesting opportunities (list top 5 by loss magnitude)
5. Include cost-benefit analysis: total cost, risk reduction value, ratio, recommendation, reassessment date
6. Generate implementation notes: warnings (wash-sale risks, holding period constraints), special considerations (account type restrictions, liquidity constraints), timeline recommendations (execute over N days/weeks based on portfolio size)
7. Add expected outcome: description of portfolio after rebalancing (allocation percentages, risk profile alignment, expected risk/return characteristics)
8. If dry_run_mode = true, generate dry_run_summary: projected portfolio state, projected tax liability, projected transaction costs, without executing any trades
9. Assemble all sections into `rebalancing_report` object

**Output:**
- Complete `rebalancing_report` object with all required fields:
  - executive_summary (string)
  - current_allocation (object)
  - target_allocation (object)
  - deviations (array)
  - rebalancing_needed (boolean)
  - recommended_trades (array)
  - tax_analysis (object)
  - cost_benefit_analysis (object)
  - implementation_notes (array)
  - expected_outcome (string)
  - dry_run_summary (object, optional)

**Quality Gate:**
- Report is complete and internally consistent: all sections are populated, no contradictions between sections
- All recommendations are traceable to analysis in prior phases: each trade has a rationale that references deviation, tax impact, or cost-benefit analysis
- Executive summary is clear and actionable: a financial advisor could present this to a client without additional context
- A reader unfamiliar with the portfolio could understand the recommendations and implement them using the trade list and implementation notes
- If dry_run_mode = true, dry_run_summary is present and shows projected outcomes without committing trades

---

## Exit Criteria

The skill is DONE when:
1. `rebalancing_report` is generated with all required fields populated (executive_summary, current_allocation, target_allocation, deviations, rebalancing_needed, recommended_trades, tax_analysis, cost_benefit_analysis, implementation_notes, expected_outcome)
2. If `rebalancing_needed = true`, at least one trade is recommended with priority, action, symbol, quantity, value, rationale, tax impact, transaction cost, and compliance status
3. If `rebalancing_needed = false`, a clear explanation is provided: "Current allocation is within [threshold]% of target. No rebalancing recommended at this time."
4. All recommended trades are validated and compliant with constraints: each trade has a compliance_status ("approved", "conditional", or "blocked") with documented reason
5. Tax implications are calculated and documented: total_capital_gains, total_capital_losses, net_tax_liability, and tax-loss harvesting opportunities are all present
6. Cost-benefit analysis is complete: total_rebalancing_cost, risk_reduction_value, cost_benefit_ratio, and recommendation are all present
7. If dry_run_mode = true, dry_run_summary is present showing projected portfolio state without executing trades
8. A financial advisor could present this report to a client and implement the recommendations using the trade list and implementation notes

---

## Error Handling

| Phase | Failure Mode | Response |
|-------|--------------|----------|
| Phase 1 | Portfolio total value does not match sum of holdings (difference > 0.01%) | **Adjust** -- recalculate total using sum of asset values; flag discrepancy in data quality report with magnitude of difference |
| Phase 1 | Asset classes in portfolio do not match target allocation | **Adjust** -- add missing asset classes to portfolio with 0 value; or remove from target allocation with warning; document in data quality report |
| Phase 1 | Client profile is incomplete (missing risk_tolerance, time_horizon_years, or tax_bracket) | **Abort** -- return error message: "Missing required field: [field_name]. Cannot proceed without this information." |
| Phase 2 | All positions are at target (no rebalancing needed) | **Adjust** -- set `rebalancing_needed = false`; output "hold" recommendation with explanation; skip Phases 3-6 |
| Phase 3 | Cost basis is missing for some holdings | **Adjust** -- assume cost basis = current value (no gain/loss) for affected assets; flag in tax analysis with note: "Cost basis unknown for [symbol]; assumed zero gain/loss" |
| Phase 3 | Holding period is unknown (purchase date not provided) | **Adjust** -- assume long-term (conservative for tax purposes); apply 15% tax rate; flag assumption in tax analysis |
| Phase 3 | Account type is tax-deferred (401k, IRA, etc.) | **Adjust** -- skip tax calculations; note "Tax-deferred account; no capital gains tax applies" in tax analysis |
| Phase 4 | Transaction costs exceed acceptable threshold for all trades | **Adjust** -- remove lowest-priority trades until total cost ≤ max_transaction_cost_percent × portfolio_value; output partial recommendation with explanation: "[N] trades removed due to cost constraints. Remaining trades achieve [Residual_Deviation%] allocation deviation." |
| Phase 5 | Trade is blocked by wash-sale rule or holding period | **Adjust** -- mark as "conditional" with execution date (e.g., "executable after [date]"); or suggest substitute asset; document in compliance notes |
| Phase 5 | Account type does not allow proposed trade (e.g., short selling in IRA) | **Abort** -- remove trade from recommendation; flag in compliance notes: "[Trade] cannot be executed in [account_type] account. Reason: [Reason]. Alternative: [Alternative trade if available]." |
| Phase 6 | Cost-benefit ratio cannot be calculated (total_rebalancing_cost = 0) | **Adjust** -- set ratio = ∞; recommendation = "rebalance_now" (free rebalancing with positive benefit) |
| Phase 7 | Recommended trades do not achieve target allocation (residual deviation > 1%) | **Adjust** -- document residual deviation in expected_outcome; explain why (constraints, costs, etc.): "After rebalancing, [Asset_Class] will be [Residual%] away from target due to [Reason]." |

---

## Reference Section

### Domain Knowledge and Decision Criteria

**Rebalancing Threshold:** Default 5% deviation per asset class. Rationale: Deviations < 5% typically have tax/cost impact exceeding benefit. Adjust lower for large portfolios (> $1M) or higher for small portfolios (< $100k).

**Tax Rates (Simplified):**
- Short-term capital gains: taxed as ordinary income (use client tax bracket)
- Long-term capital gains: 15% (or 20% for high earners; use 15% as default if tax_bracket not specified)
- Tax-loss harvesting: offset gains dollar-for-dollar; excess losses carry forward up to $3,000 per year

**Transaction Costs:**
- Equities: ~0.05% of trade value (commissions + bid-ask spread)
- Bonds: ~0.01% of trade value
- Mutual funds/ETFs: 0% (no commission) to 0.5% (load funds)
- Crypto/alternatives: 0.1-1% (highly variable)

**Wash-Sale Rule:** Cannot claim a loss on a security if you buy a substantially identical security within 30 days before or after the sale. Applies to taxable accounts only. Substantially identical includes same ticker, same fund, or funds with > 90% overlap in holdings.

**Holding Period Classification:**
- Short-term: < 365 days (taxed as ordinary income)
- Long-term: ≥ 365 days (preferential tax rates)

**Risk Tolerance to Allocation Models:**
- Conservative: 20-30% equities, 60-70% bonds, 5-10% cash
- Moderate: 50-60% equities, 30-40% bonds, 5-10% cash
- Aggressive: 80-90% equities, 5-15% bonds, 0-5% cash

**Time Horizon Adjustments:**
- < 3 years: reduce equity allocation by 20-30%; increase bonds/cash
- 3-10 years: use standard allocation for risk tolerance
- > 10 years: can increase equity allocation by 10-20% if risk tolerance allows

**Tax-Loss Harvesting Opportunities:** Identify positions with unrealized losses > $500 (material enough to offset gains). Prioritize harvesting in December (year-end) or when portfolio is rebalanced. Use substitute assets (different fund with similar holdings) to maintain desired allocation while harvesting losses.

**Cost-Benefit Ratio Thresholds:**
- Ratio > 2.0: "rebalance_now" (benefit is at least 2x the cost)
- Ratio 1.0-2.0: "rebalance_now" (benefit exceeds cost)
- Ratio 0.5-1.0: "wait_and_monitor" (benefit < cost; defer 3-6 months)
- Ratio < 0.5: "defer" (cost exceeds benefit; rebalance only if deviations worsen)

**Implementation Timeline:**
- Small portfolios (< $100k): execute all trades in 1-2 days
- Medium portfolios ($100k-$1M): execute over 1-2 weeks (reduce market impact)
- Large portfolios (> $1M): execute over 2-4 weeks; consider limit orders

**Constraints by Account Type:**
- Taxable: all trades allowed; tax implications apply
- 401(k): no wash-sale rule; limited investment options; no short selling; no margin
- IRA (Traditional/Roth): no wash-sale rule; no short selling; no margin; no borrowing
- 529: limited to education-related investments; no tax-loss harvesting
- HSA: limited investment options; no short selling; must maintain health-related purpose

**Dry-Run Mode:** When `dry_run_mode = true`, simulate rebalancing without committing trades. Output projected portfolio state, projected tax liability, projected transaction costs, and expected risk/return characteristics. Allows clients to review impact before execution.

---

## State Persistence (Optional)

If this skill is run repeatedly (e.g., quarterly rebalancing), consider tracking:
- Historical allocation deviations (to identify drift patterns and predict future rebalancing needs)
- Tax-loss harvesting history (to avoid wash-sale violations and track cumulative harvesting benefit)
- Prior rebalancing trades and their outcomes (to evaluate effectiveness and actual vs. projected costs)
- Client preference changes (risk tolerance, time horizon, constraints, account additions/withdrawals)
- Market performance by asset class (to understand whether deviations are due to market movement or contributions/withdrawals)

Store in a `rebalancing_history` object with timestamps, trade details, actual costs, and outcomes. Use history to:
- Predict future rebalancing frequency and costs
- Identify patterns in client behavior (e.g., frequent contributions that cause drift)
- Optimize rebalancing strategy over time (e.g., batch trades to reduce costs)
- Provide accountability and transparency to clients
