# Zero-Based Budgeter

**One-line description:** Converts income, expenses, and financial goals into a complete zero-based budget with emergency fund timeline, debt payoff strategy, and savings allocation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

### Income & Expense Inputs
- `monthly_net_income` (number, required) -- Total monthly take-home income in dollars. Must be positive.
- `expenses` (object[], required) -- List of monthly expenses. Each object: `{category: string, amount: number, type: "fixed" | "variable"}`. At least one expense required.

### Goal & Debt Inputs
- `financial_goals` (object[], required) -- List of financial goals. Each object: `{goal_name: string, target_amount: number, current_balance: number, priority: 1-5}`. Priority 1 = highest. At least one goal required.
- `debt_list` (object[], optional) -- List of debts. Each object: `{creditor: string, balance: number, interest_rate: number, minimum_payment: number}`. Default: empty array (no debts).

### Configuration Inputs
- `emergency_fund_target` (number, optional) -- Target emergency fund amount in dollars. Default: 4 × total_monthly_expenses (4 months of expenses).
- `current_emergency_fund_balance` (number, optional) -- Current emergency fund savings in dollars. Default: 0.
- `debt_payoff_method` (string, optional) -- "avalanche" (highest interest first) or "snowball" (smallest balance first). Default: "avalanche".

---

## Outputs

- `clarified_inputs` (object) -- Validated and normalized inputs with defaults applied. Schema: `{monthly_net_income: number, expenses: object[], financial_goals: object[], debt_list: object[], emergency_fund_target: number, current_emergency_fund_balance: number, debt_payoff_method: string}`.
- `expense_summary` (object) -- Monthly expenses aggregated by category and type. Schema: `{by_category: {[category]: number}, by_type: {fixed: number, variable: number}, total: number}`.
- `monthly_surplus_deficit` (number) -- Monthly income minus total expenses. Positive = surplus, negative = deficit.
- `emergency_fund_plan` (object) -- Emergency fund strategy with timeline. Schema: `{target: number, current_balance: number, gap: number, monthly_contribution: number, months_to_target: number, priority: boolean}`.
- `debt_payoff_plan` (object[]) -- Ordered list of debts with payoff strategy. Each: `{creditor: string, balance: number, interest_rate: number, minimum_payment: number, monthly_payment: number, payoff_months: number, total_interest_paid: number, payoff_order: number}`.
- `savings_allocation_plan` (object[]) -- Savings goals with monthly allocation. Each: `{goal_name: string, target_amount: number, current_balance: number, gap: number, priority: number, monthly_allocation: number, months_to_target: number}`.
- `zero_based_budget` (object) -- Complete budget allocation. Schema: `{income: number, allocations: [{category: string, amount: number}], total_allocated: number, balance: number}`. Balance must equal 0.
- `financial_timeline` (object) -- Key milestone dates. Schema: `{emergency_fund_complete_date: string (YYYY-MM-DD), all_debt_free_date: string (YYYY-MM-DD), savings_goals_timeline: [{goal_name: string, target_date: string (YYYY-MM-DD)}]}`.
- `budget_report` (string) -- Human-readable summary with analysis and recommendations.

---

## Execution Phases

### Phase 1: Collect and Validate Inputs

**Entry Criteria:**
- Workflow is triggered with income, expenses, and goals provided.

**Actions:**
1. Validate `monthly_net_income`: Must be a number > 0. If missing, zero, or negative, abort with error message: "Monthly income is required and must be positive. Received: [value]".
2. Validate `expenses` array: Must be non-empty. Each expense must have `category` (string, non-empty), `amount` (number > 0), and `type` ("fixed" or "variable"). Remove or flag invalid entries. If all entries are invalid, abort with error: "At least one valid expense is required.".
3. Validate `financial_goals` array: Must be non-empty. Each goal must have `goal_name` (string, non-empty), `target_amount` (number > 0), `current_balance` (number ≥ 0), and `priority` (integer 1-5). If priority is outside 1-5, set to 3 (default). Remove or flag invalid entries. If all entries are invalid, abort with error: "At least one valid goal is required.".
4. Validate `debt_list` (if provided): Each debt must have `creditor` (string, non-empty), `balance` (number > 0), `interest_rate` (number ≥ 0), and `minimum_payment` (number > 0). If interest_rate is missing or negative, set to 0%. Remove or flag invalid entries. If not provided, set to empty array.
5. Set `emergency_fund_target`: If provided and > 0, use provided value. Otherwise, calculate as 4 × (sum of all monthly expenses). Validate that target is ≤ 12 months of expenses; if > 12, warn user and suggest reducing to 6 months (allow override).
6. Set `current_emergency_fund_balance`: If provided and ≥ 0, use provided value. Otherwise, set to 0.
7. Set `debt_payoff_method`: If provided and equals "avalanche" or "snowball", use provided value. Otherwise, default to "avalanche".
8. Output `clarified_inputs` object with all validated and normalized values.

**Output:**
- `clarified_inputs` (object with all validated inputs and applied defaults)

**Quality Gate:**
- `monthly_net_income` is a positive number, verified by: value > 0.
- `expenses` array is non-empty and all entries have valid `category` (non-empty string), `amount` (positive number), and `type` ("fixed" or "variable"), verified by: count(valid_expenses) > 0.
- `financial_goals` array is non-empty and all entries have valid `goal_name` (non-empty string), `target_amount` (positive number), `current_balance` (non-negative number), and `priority` (integer 1-5), verified by: count(valid_goals) > 0 and all priorities in [1,5].
- `debt_list` is valid (if provided): all entries have `creditor` (non-empty string), `balance` (positive number), `interest_rate` (non-negative number), and `minimum_payment` (positive number), verified by: count(valid_debts) = count(input_debts) or count(input_debts) = 0.
- All defaults are applied and documented in `clarified_inputs`.
- No workflow proceeds with invalid data; all abort conditions are checked before proceeding.

---

### Phase 2: Calculate Current Financial State

**Entry Criteria:**
- `clarified_inputs` is complete and valid (all required fields present and numeric).

**Actions:**
1. Sum all expenses by category: For each unique category in expenses, sum all amounts where category matches. Store as `by_category` object.
2. Sum all expenses by type: Sum all amounts where type = "fixed", sum all amounts where type = "variable". Store as `by_type` object with keys "fixed" and "variable".
3. Calculate total monthly expenses: `total_expenses = sum(all expense amounts)`.
4. Calculate monthly surplus/deficit: `monthly_surplus_deficit = monthly_net_income - total_expenses`.
5. If `monthly_surplus_deficit < 0` (deficit exists): Flag as critical issue. Output warning message: "CRITICAL: Monthly expenses ($[total]) exceed income ($[income]). Monthly deficit: $[deficit]. Budget is not sustainable. Recommend: (1) Reduce variable expenses, (2) Increase income, or (3) Adjust financial goals. Pause workflow for user decision." Pause and wait for user to adjust inputs before proceeding to Phase 3.
6. Output `expense_summary` (object with `by_category`, `by_type`, and `total`) and `monthly_surplus_deficit` (number).

**Output:**
- `expense_summary` (object: `{by_category: {[category]: number}, by_type: {fixed: number, variable: number}, total: number}`)
- `monthly_surplus_deficit` (number, positive or negative)

**Quality Gate:**
- Expense totals are accurate: `sum(by_category values) = total` and `by_type.fixed + by_type.variable = total`, verified by: recalculating sums and comparing.
- Surplus/deficit is calculated as a specific number and flagged as positive (surplus) or negative (deficit), verified by: `monthly_surplus_deficit = monthly_net_income - total_expenses` and sign is correct.
- If deficit exists, a critical warning is raised and workflow pauses for user decision, verified by: deficit flag is set and pause message is output.

---

### Phase 3: Plan Emergency Fund

**Entry Criteria:**
- `monthly_surplus_deficit` is positive (surplus exists). If deficit, Phase 2 pauses workflow.
- `emergency_fund_target` and `current_emergency_fund_balance` are defined (from Phase 1).

**Actions:**
1. Calculate emergency fund gap: `gap = emergency_fund_target - current_emergency_fund_balance`.
2. If `gap ≤ 0`: Emergency fund is complete or exceeded. Set `monthly_contribution = 0`, `months_to_target = 0`, and `priority = false`. Proceed to Phase 4.
3. If `gap > 0`:
   a. Allocate 50% of monthly surplus to emergency fund: `monthly_contribution = 0.5 × monthly_surplus_deficit`. If `monthly_contribution > gap`, set `monthly_contribution = gap` (pay off in one month).
   b. Calculate months to reach target: `months_to_target = ceiling(gap / monthly_contribution)` (rounded up to nearest integer).
   c. Set priority flag: `priority = true` if `gap > (2 × total_monthly_expenses)`, else `priority = false`. (Emergency fund is high-priority if gap exceeds 2 months of expenses.)
4. Output `emergency_fund_plan` with all calculated fields.

**Output:**
- `emergency_fund_plan` (object: `{target: number, current_balance: number, gap: number, monthly_contribution: number, months_to_target: number, priority: boolean}`)

**Quality Gate:**
- Emergency fund contribution does not exceed available surplus: `monthly_contribution ≤ monthly_surplus_deficit`, verified by: checking value.
- Timeline is realistic: `months_to_target` is a non-negative integer (0 if complete, > 0 if in progress), verified by: `months_to_target ≥ 0 and months_to_target = integer`.
- Priority flag correctly reflects financial health: `priority = true` if `gap > (2 × total_monthly_expenses)`, else `priority = false`, verified by: checking condition.
- Gap calculation is accurate: `gap = emergency_fund_target - current_emergency_fund_balance`, verified by: recalculating.

---

### Phase 4: Plan Debt Payoff Strategy

**Entry Criteria:**
- `emergency_fund_plan` is complete (from Phase 3).
- `debt_list` is provided (may be empty).
- Remaining surplus after emergency fund allocation is calculated: `remaining_surplus = monthly_surplus_deficit - emergency_fund_monthly_contribution`.

**Actions:**
1. If `debt_list` is empty: Output empty `debt_payoff_plan = []` and proceed to Phase 5.
2. If debts exist:
   a. Calculate remaining monthly surplus: `remaining_surplus = monthly_surplus_deficit - emergency_fund_plan.monthly_contribution`.
   b. Calculate sum of minimum payments: `total_minimum_payments = sum(debt.minimum_payment for all debts)`.
   c. If `remaining_surplus < total_minimum_payments`: Flag as critical. Output warning: "CRITICAL: Debt minimum payments ($[total_minimum]) exceed remaining surplus ($[remaining]). Budget cannot support current debt obligations. Recommend: (1) Reduce emergency fund contribution, (2) Increase income, or (3) Negotiate lower minimum payments. Pause workflow for user decision." Pause and wait for user to adjust inputs before proceeding.
   d. Sort debts by `debt_payoff_method`:
      - If "avalanche": Sort by `interest_rate` descending (highest interest first).
      - If "snowball": Sort by `balance` ascending (smallest balance first).
   e. For each debt in sorted order, assign `payoff_order = 1, 2, 3, ...` (position in payoff sequence).
   f. For each debt in order:
      - Assign monthly payment: `monthly_payment = max(debt.minimum_payment, (remaining_surplus / count(debts)))`. (Each debt receives at least its minimum payment; remaining surplus is split equally among debts.)
      - Calculate payoff months: `payoff_months = ceiling(debt.balance / monthly_payment)` (rounded up to nearest integer).
      - Calculate total interest paid: `total_interest_paid = (monthly_payment × payoff_months) - debt.balance`. (Interest = total paid minus principal.)
   g. Output `debt_payoff_plan` as array of objects with all calculated fields, sorted by `payoff_order`.

**Output:**
- `debt_payoff_plan` (object[]: `[{creditor: string, balance: number, interest_rate: number, minimum_payment: number, monthly_payment: number, payoff_months: number, total_interest_paid: number, payoff_order: number}, ...]`)

**Quality Gate:**
- Debt payoff order matches selected method: If "avalanche", verify `interest_rate` is descending across payoff_order. If "snowball", verify `balance` is ascending across payoff_order, verified by: checking sort order.
- Monthly payments are feasible: `sum(monthly_payment for all debts) ≤ remaining_surplus`, verified by: summing and comparing.
- Payoff timelines are positive integers: `payoff_months ≥ 1` for all debts, verified by: checking all values.
- Total interest paid is accurately calculated: `total_interest_paid = (monthly_payment × payoff_months) - balance` for each debt, verified by: recalculating.
- If debt list is empty, `debt_payoff_plan = []`, verified by: checking array length.

---

### Phase 5: Allocate Remaining Surplus to Savings Goals

**Entry Criteria:**
- `emergency_fund_plan` and `debt_payoff_plan` are complete (from Phases 3 and 4).
- Remaining monthly surplus is calculated: `remaining_surplus = monthly_surplus_deficit - emergency_fund_plan.monthly_contribution - sum(debt_payoff_plan[*].monthly_payment)`.

**Actions:**
1. Calculate remaining surplus after emergency fund and debt payments: `remaining_surplus = monthly_surplus_deficit - emergency_fund_plan.monthly_contribution - sum(debt.monthly_payment for all debts in debt_payoff_plan)`.
2. If `remaining_surplus ≤ 0`: Output empty `savings_allocation_plan = []`. Note in report: "No remaining surplus available for additional savings goals. User must complete emergency fund and debt payoff before saving for additional goals." Proceed to Phase 6.
3. If `remaining_surplus > 0`:
   a. Sort `financial_goals` by `priority` ascending (1 = highest priority first).
   b. Calculate priority weights: For each goal, `weight = (6 - priority)`. (Priority 1 → weight 5, priority 5 → weight 1.)
   c. Calculate total weight: `total_weight = sum(weight for all goals)`.
   d. For each goal in priority order:
      - Calculate monthly allocation: `monthly_allocation = (weight / total_weight) × remaining_surplus`. (Allocate proportionally to priority weight.)
      - Calculate gap: `gap = target_amount - current_balance`.
      - If `gap ≤ 0`: Goal is already met. Set `monthly_allocation = 0` and `months_to_target = 0`.
      - If `gap > 0`: Calculate months to target: `months_to_target = ceiling(gap / monthly_allocation)` (rounded up to nearest integer).
   e. Output `savings_allocation_plan` as array of objects with all calculated fields, sorted by `priority`.

**Output:**
- `savings_allocation_plan` (object[]: `[{goal_name: string, target_amount: number, current_balance: number, gap: number, priority: number, monthly_allocation: number, months_to_target: number}, ...]`)

**Quality Gate:**
- Total allocations do not exceed remaining surplus: `sum(monthly_allocation for all goals) ≤ remaining_surplus`, verified by: summing and comparing.
- All goals receive allocation proportional to priority: Each goal's allocation = `(weight / total_weight) × remaining_surplus`, verified by: recalculating allocations.
- Timelines are non-negative integers: `months_to_target ≥ 0` for all goals, verified by: checking all values.
- If remaining surplus ≤ 0, `savings_allocation_plan = []`, verified by: checking array length.

---

### Phase 6: Create Zero-Based Budget

**Entry Criteria:**
- All allocations from Phases 2-5 are complete and validated.

**Actions:**
1. Build budget allocation table as array of objects, each with `category` (string) and `amount` (number):
   a. Add line item: `{category: "Fixed Expenses", amount: expense_summary.by_type.fixed}`.
   b. Add line item: `{category: "Variable Expenses", amount: expense_summary.by_type.variable}`.
   c. Add line item: `{category: "Emergency Fund Contribution", amount: emergency_fund_plan.monthly_contribution}`.
   d. For each debt in `debt_payoff_plan`: Add line item `{category: "Debt Payment - [creditor]", amount: debt.monthly_payment}`.
   e. For each goal in `savings_allocation_plan`: Add line item `{category: "Savings - [goal_name]", amount: goal.monthly_allocation}`.
2. Sum all allocations: `total_allocated = sum(amount for all line items)`.
3. Calculate balance: `balance = monthly_net_income - total_allocated`.
4. If `balance ≠ 0` (due to rounding): Adjust the largest allocation by the rounding difference to make `balance = 0`. (Zero-based budget requires income = total allocated.)
5. Output `zero_based_budget` object with `income`, `allocations` array, `total_allocated`, and `balance` (must equal 0).

**Output:**
- `zero_based_budget` (object: `{income: number, allocations: [{category: string, amount: number}, ...], total_allocated: number, balance: number}`)

**Quality Gate:**
- Total allocated equals monthly net income (zero-based): `total_allocated = monthly_net_income` and `balance = 0`, verified by: checking equality.
- Every dollar of income is assigned to a category: `allocations` array contains all expense, debt, savings, and emergency fund line items, verified by: checking array completeness.
- All line items are accounted for and accurate: Each line item amount matches its source (expense_summary, debt_payoff_plan, savings_allocation_plan, emergency_fund_plan), verified by: spot-checking calculations.

---

### Phase 7: Generate Financial Timeline and Report

**Entry Criteria:**
- All previous phases (1-6) are complete and validated.

**Actions:**
1. Calculate key dates (using today's date as reference):
   a. Emergency fund complete date: If `emergency_fund_plan.months_to_target = 0`, set to today. Otherwise, set to today + `emergency_fund_plan.months_to_target` months (format: YYYY-MM-DD).
   b. All debt free date: If `debt_payoff_plan` is empty, set to today. Otherwise, set to today + max(`debt.payoff_months` for all debts) months (format: YYYY-MM-DD).
   c. Savings goals completion dates: For each goal in `savings_allocation_plan`, if `months_to_target = 0`, set to today. Otherwise, set to today + `months_to_target` months (format: YYYY-MM-DD).
2. Build `financial_timeline` object with all calculated dates.
3. Generate human-readable `budget_report` (string) including:
   a. **Summary:** "Monthly income: $[income]. Total monthly expenses: $[total_expenses]. Monthly surplus: $[surplus]." (Or deficit if applicable.)
   b. **Expense Breakdown:** "Fixed expenses: $[fixed]. Variable expenses: $[variable]."
   c. **Emergency Fund Status:** "Current emergency fund: $[current]. Target: $[target]. Gap: $[gap]. Monthly contribution: $[contribution]. Timeline: [months_to_target] months ([complete_date])."
   d. **Debt Payoff Strategy:** "Debt payoff method: [avalanche|snowball]. [If debts exist:] Debts in payoff order: [list each debt with balance, interest rate, monthly payment, payoff timeline, total interest]. All debt free date: [date]. [If no debts:] No debts to pay off."
   e. **Savings Goals:** "[For each goal:] [Goal name]: Target $[target], current $[current], monthly allocation $[allocation], timeline [months] months ([target_date])."
   f. **Budget Allocation:** "Every dollar allocated: [list each category and amount from zero_based_budget.allocations]."
   g. **Key Recommendations:** Generate specific, actionable recommendations based on the plan:
      - If `emergency_fund_plan.priority = true`: "PRIORITY: Build emergency fund to [target] before aggressive debt payoff. This protects against unexpected expenses."
      - If `debt_payoff_plan` exists and max(`payoff_months`) > 120 (10 years): "WARNING: Debt payoff timeline exceeds 10 years. Consider increasing debt payments or reducing other allocations to accelerate payoff."
      - If `savings_allocation_plan` is empty: "No remaining surplus for additional savings goals. Focus on emergency fund and debt payoff first."
      - If `monthly_surplus_deficit > 0` and `monthly_surplus_deficit < 100`: "Surplus is tight. Monitor variable expenses closely and adjust budget if income changes."
      - If `debt_payoff_plan` exists: "You will be debt-free in [months] months ([date]) if you maintain this plan."
      - If `savings_allocation_plan` is not empty: "You will reach your savings goals in [max_months] months ([max_date]) if you maintain this plan."
4. Output `financial_timeline` and `budget_report`.

**Output:**
- `financial_timeline` (object: `{emergency_fund_complete_date: string (YYYY-MM-DD), all_debt_free_date: string (YYYY-MM-DD), savings_goals_timeline: [{goal_name: string, target_date: string (YYYY-MM-DD)}, ...]}`)
- `budget_report` (string with summary, analysis, and recommendations)

**Quality Gate:**
- All dates are in the future (or today if goal is already met) and realistic: Each date ≥ today, verified by: checking date values.
- Report is clear, actionable, and references all major plan components: Report includes summary, expense breakdown, emergency fund status, debt payoff strategy, savings goals, budget allocation, and recommendations, verified by: checking for all sections.
- Recommendations are specific and tied to the user's financial situation: Each recommendation references a specific metric (e.g., "timeline exceeds 10 years", "surplus is tight", "debt-free in [months] months"), verified by: checking that recommendations are not generic.

---

## Exit Criteria

The skill is DONE when:
1. All inputs are validated and normalized (Phase 1 complete).
2. Expense summary and monthly surplus/deficit are calculated (Phase 2 complete).
3. Emergency fund plan is created with timeline (Phase 3 complete).
4. Debt payoff strategy is determined and ordered (Phase 4 complete).
5. Savings goals are allocated and timed (Phase 5 complete).
6. Zero-based budget is created with income = total allocations (Phase 6 complete, balance = 0).
7. Financial timeline and report are generated (Phase 7 complete).
8. User can read the budget report and identify: (1) monthly surplus/deficit, (2) emergency fund timeline and target date, (3) debt payoff timeline and target date (if debts exist), (4) savings goal timelines and target dates, (5) complete monthly budget allocation, verified by: report contains all sections and is readable.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Monthly income is missing, zero, or negative | **Abort** -- Output error: "Monthly income is required and must be positive. Received: [value]." Request valid income figure before proceeding. |
| Phase 1 | Expenses array is empty or all expenses are invalid | **Abort** -- Output error: "At least one valid expense is required. Please provide a list of monthly expenses." Request expense list before proceeding. |
| Phase 1 | Financial goals array is empty or all goals are invalid | **Abort** -- Output error: "At least one valid goal is required. Please provide a list of financial goals." Request goals list before proceeding. |
| Phase 1 | Priority value is outside 1-5 range | **Adjust** -- Set priority to 3 (default/medium priority). Log: "Priority [value] is outside 1-5 range; set to 3." |
| Phase 1 | Interest rate is missing or negative | **Adjust** -- Set interest_rate to 0%. Log: "Interest rate [value] is invalid; set to 0%." |
| Phase 1 | Emergency fund target exceeds 12 months of expenses | **Adjust** -- Warn user: "Emergency fund target ($[target]) exceeds 12 months of expenses ($[12_months]). Recommend reducing to 6 months ($[6_months]). Allow user to override or accept recommendation. |
| Phase 2 | Monthly surplus is negative (expenses exceed income) | **Adjust** -- Flag as critical. Output warning: "CRITICAL: Monthly expenses ($[total]) exceed income ($[income]). Monthly deficit: $[deficit]. Budget is not sustainable. Recommend: (1) Reduce variable expenses, (2) Increase income, or (3) Adjust financial goals." Pause workflow and ask user to adjust inputs before proceeding to Phase 3. |
| Phase 4 | Debt minimum payments exceed remaining surplus after emergency fund | **Adjust** -- Flag as critical. Output warning: "CRITICAL: Debt minimum payments ($[total_minimum]) exceed remaining surplus ($[remaining]). Budget cannot support current debt obligations. Recommend: (1) Reduce emergency fund contribution, (2) Increase income, or (3) Negotiate lower minimum payments." Pause workflow and ask user to adjust inputs before proceeding. |
| Phase 4 | Debt payoff timeline exceeds 10 years (120 months) | **Adjust** -- Flag in report as extended timeline. Output recommendation: "Debt payoff timeline exceeds 10 years. Consider increasing debt payments or reducing other allocations to accelerate payoff." Continue with plan but highlight in report. |
| Phase 6 | Rounding errors cause balance ≠ 0 | **Adjust** -- Adjust largest allocation by rounding difference to achieve zero-based balance (balance = 0). Log: "Rounding adjustment: [category] adjusted by $[amount]." |
| Phase 7 | Debt payoff timeline exceeds 10 years | **Adjust** -- Flag in report as extended timeline. Output recommendation: "Debt payoff timeline exceeds 10 years. Consider increasing debt payments or reducing other allocations to accelerate payoff." |
| Phase 7 | User rejects final output | **Targeted revision** -- ask which budget category, allocation percentage, or debt payoff plan fell short and rerun only that section. Do not regenerate the full budget. |

---

## Reference Section

### Domain Knowledge: Zero-Based Budgeting Principles

1. **Zero-Based Budget Definition:** Every dollar of income is assigned to a specific category (expenses, debt, savings, emergency fund). The equation is: Income = Fixed Expenses + Variable Expenses + Emergency Fund Contribution + Debt Payments + Savings Allocations. Balance = 0.

2. **Emergency Fund Priority:** Financial advisors recommend 3-6 months of expenses in emergency savings before aggressive debt payoff. This skill defaults to 4 months. An emergency fund protects against unexpected expenses (job loss, medical emergency, car repair) and prevents accumulating new debt during hardship.

3. **Debt Payoff Methods:**
   - **Avalanche:** Pay highest interest rate first. Minimizes total interest paid over time. Best for mathematical optimization and long-term savings.
   - **Snowball:** Pay smallest balance first. Provides psychological wins and momentum by eliminating debts quickly. Best for motivation and behavioral change.

4. **Expense Categories:** 
   - **Fixed Expenses:** Rent, insurance, minimum debt payments, utilities. Difficult to reduce short-term.
   - **Variable Expenses:** Groceries, entertainment, discretionary spending. Flexible and can be adjusted.

5. **Surplus Allocation Priority:** Emergency Fund → Debt Payoff → Savings Goals. This order minimizes financial risk by ensuring stability (emergency fund) before growth (savings).

6. **Realistic Timelines:** 
   - Debt payoff timelines > 10 years (120 months) suggest the plan is unsustainable. Recommend increasing income or reducing expenses.
   - Savings goal timelines > 10 years may be unrealistic for short-term goals. Recommend increasing allocation or adjusting target.

### Decision Criteria

- **When to prioritize emergency fund over debt:** If current emergency fund < 1 month of expenses, prioritize emergency fund to 1 month before aggressive debt payoff. If gap > 2 months of expenses, set `priority = true` to highlight urgency.
- **When to flag a deficit as critical:** If monthly expenses exceed income, the budget is not sustainable. User must reduce expenses or increase income before planning debt payoff or savings. Pause workflow and request adjustment.
- **When to recommend goal adjustment:** If timeline to any goal exceeds 10 years, recommend reducing target or increasing allocation. If remaining surplus is zero, note that no additional savings are possible until emergency fund and debt payoff are complete.
- **When to use avalanche vs. snowball:** Recommend avalanche for users focused on minimizing interest paid (mathematically optimal). Recommend snowball for users who need psychological motivation (quick wins).

### Checklists

**Pre-Budget Checklist:**
- [ ] Monthly net income is confirmed (after taxes, deductions).
- [ ] All recurring monthly expenses are listed (fixed and variable).
- [ ] Financial goals are prioritized (1-5 scale, where 1 = highest priority).
- [ ] Debt list includes all outstanding balances and interest rates.
- [ ] Emergency fund target is realistic (3-6 months of expenses, default 4 months).
- [ ] Current emergency fund balance is known (or assumed to be $0).

**Post-Budget Checklist:**
- [ ] Zero-based budget balances (income = allocations, balance = 0).
- [ ] Emergency fund timeline is realistic (< 12 months recommended, or user accepts longer timeline).
- [ ] Debt payoff timeline is realistic (< 10 years recommended).
- [ ] Savings goals are achievable within 5-10 years (or user accepts longer timeline).
- [ ] User understands and commits to the plan.
- [ ] User has identified specific actions to reduce variable expenses if needed.

### State Persistence (Optional)

If this skill is run monthly or quarterly, track:
- **Actual expenses vs. budgeted expenses:** Variance analysis showing where user is over/under budget by category.
- **Progress toward goals:** Monthly progress on emergency fund, debt payoff, and savings goals. Identify if user is on track or falling behind.
- **Changes in income or goals:** Trigger rebalancing if income changes (raise, job loss) or goals change (new debt, new savings goal).
- **Patterns in variable expenses:** Identify seasonal spending patterns (e.g., higher expenses in winter) and adjust budget accordingly.
- **Debt payoff acceleration:** If user pays more than minimum, recalculate payoff timeline and interest saved.

This allows the skill to adapt the budget over time and provide trend analysis.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.