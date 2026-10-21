# Net Worth Tracker

Calculates your total net worth -- everything you own minus everything you owe -- and tracks how it changes month to month. Not about feeling rich or poor. It's a single number that tells you whether you're moving forward or backward financially. Includes milestone tracking so you can see progress toward goals like a specific savings target, debt payoff, or retirement number. Works whether your net worth is negative or seven figures.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSETS       --> Catalog everything you own with current values
PHASE 2: LIABILITIES  --> Catalog everything you owe with current balances
PHASE 3: CALCULATE    --> Net worth, month-over-month delta, and composition
PHASE 4: MILESTONES   --> Track progress toward financial goals
PHASE 5: PROJECT      --> Where you're headed at current pace
```

## Inputs
- `assets`: object -- All assets organized by category: cash (checking, savings, money market), investments (brokerage, 401k, IRA, HSA, crypto), property (home value, vehicles, other), other (business equity, collectibles, receivables). Current or estimated values.
- `liabilities`: object -- All debts: mortgage balance, auto loans, student loans, credit cards, personal loans, medical debt, other. Include interest rate and minimum payment for each.
- `prior_snapshot`: object -- (Optional) Previous net worth calculation for comparison. If this is the first run, will establish the baseline.

## Outputs
- `net_worth_statement`: object -- Complete balance sheet: assets by category, liabilities by category, net worth total
- `change_report`: object -- Month-over-month change broken down by what drove the change (investment gains, debt paydown, new savings, property appreciation, new debt)
- `milestone_tracker`: object -- Progress toward defined milestones (positive net worth, emergency fund funded, debt-free, first $100K, etc.)
- `projection`: object -- Where net worth will be in 6 months, 1 year, and 5 years at current trajectory

## Execution

### Phase 1: ASSETS
### Entry Criteria
At least one asset category provided.
### Actions
1. Catalog all liquid assets (accessible within days):
   - Checking accounts: current balance
   - Savings accounts: current balance, APY being earned
   - Money market accounts: current balance
   - Cash on hand: if material
2. Catalog all investment assets:
   - Retirement accounts (401k, 403b, IRA, Roth IRA): current balance. Note employer match percentage if known (this affects future growth rate).
   - Taxable brokerage: current balance
   - HSA: current balance (triple tax advantage makes this the most efficient account dollar-for-dollar)
   - Crypto: current value in USD
   - Stock options/RSUs: current vested value only (unvested is not yours yet)
3. Catalog all property assets:
   - Primary residence: current estimated value (Zillow Zestimate or recent comparable sales, NOT what you paid)
   - Vehicles: current market value (KBB private party value, not what you owe)
   - Other property: rental property, land, etc.
4. Catalog other assets: business equity (conservative estimate), valuable personal property (only items worth $1,000+), money owed to you.
5. Total all assets by category and grand total.

### Output
Asset inventory table with category, item, and current value. Category subtotals and grand total.
### Quality Gate
Every asset has a current or estimated value. Vehicles use market value not purchase price. Home uses current estimate not purchase price.

### Phase 2: LIABILITIES
### Entry Criteria
Asset inventory complete.
### Actions
1. Catalog all secured debt:
   - Mortgage: remaining balance, interest rate, monthly payment, remaining term. If underwater (owe more than home is worth), flag it.
   - Auto loans: remaining balance, interest rate, monthly payment. Compare balance to vehicle value -- negative equity is common and important to know.
   - HELOC: balance drawn, credit limit, interest rate
2. Catalog all unsecured debt:
   - Credit cards: balance on each card, interest rate (APR), minimum payment. Calculate total credit utilization percentage (total balances / total credit limits). Above 30% hurts credit score; above 50% signals trouble.
   - Student loans: balance, interest rate (federal vs. private matters for forgiveness programs), monthly payment, repayment plan type.
   - Personal loans: balance, rate, payment
   - Medical debt: total outstanding. Note that medical debt under $500 no longer appears on credit reports.
3. Calculate total debt by category.
4. Calculate weighted average interest rate: sum of (each debt balance x its rate) / total debt. This is your "cost of debt."
5. Total all liabilities.

### Output
Liability inventory table with category, creditor, balance, interest rate, monthly payment. Category subtotals and grand total. Weighted average interest rate.
### Quality Gate
Every debt has a balance and interest rate. Credit utilization calculated. Weighted average rate computed.

### Phase 3: CALCULATE
### Entry Criteria
Both assets and liabilities cataloged.
### Actions
1. Calculate net worth: total assets minus total liabilities. If negative, this is not a failure state -- it's a starting point. Many people start negative (student loans, mortgage).
2. Break down net worth composition:
   - Liquid net worth: liquid assets minus all liabilities (excludes property). This is what you could access in a crisis.
   - Investable net worth: investments only (excludes home equity, vehicles)
   - Home equity: home value minus mortgage balance
3. If prior snapshot exists, calculate month-over-month change:
   - Total net worth delta (dollar and percentage)
   - What drove the change: investment gains/losses, debt paydown, new savings deposits, property value changes, new debt taken on
   - Highlight the single biggest contributor to the change (positive or negative)
4. Calculate key ratios:
   - Debt-to-asset ratio: total liabilities / total assets. Below 0.5 is healthy. Above 0.8 is high leverage.
   - Liquidity ratio: liquid assets / monthly expenses. This is your emergency fund in months. Below 1 month is critical. 3-6 months is the standard target.
   - Savings rate: if income data available, (income - spending) / income. 20%+ is excellent. 10-20% is solid. Under 10% leaves little margin.

### Output
Net worth statement, liquid vs. total breakdown, month-over-month change analysis, key financial ratios.
### Quality Gate
Net worth is a single clear number. Change is attributed to specific drivers. Ratios are calculated and benchmarked.

### Phase 4: MILESTONES
### Entry Criteria
Net worth calculated with history if available.
### Actions
1. Identify which milestones have been reached and which are next:
   - Positive net worth (assets > liabilities)
   - $1,000 emergency fund (starter fund)
   - All credit card debt paid off
   - 3-month emergency fund
   - 6-month emergency fund
   - $100,000 net worth (after this, compounding starts to matter more than savings rate)
   - Consumer debt free (everything except mortgage)
   - $250,000 / $500,000 / $1M milestones
   - "Coast FI" (enough invested that compound growth alone reaches retirement target by retirement age, no additional contributions needed)
   - Financial independence (investable assets > 25x annual expenses, the "4% rule" threshold)
2. For the next upcoming milestone: calculate how far away in dollars and estimated months at current pace.
3. If the user has specific goals (save for a house down payment, pay off student loans by date X), track those as custom milestones with progress bars.
4. Note milestone velocity: are milestones being reached faster or slower than previous pace? The first $100K takes the longest. Each subsequent $100K comes faster due to compounding.

### Output
Milestone checklist with status, next milestone with ETA, custom goal tracking, velocity notes.
### Quality Gate
At least 3 milestones identified with status. Next milestone has a specific dollar distance and time estimate.

### Phase 5: PROJECT
### Entry Criteria
Current net worth and change rate established.
### Actions
1. Project net worth at 6 months, 1 year, 3 years, and 5 years using current trajectory:
   - Monthly savings rate (from change analysis or stated)
   - Investment return assumption: 7% annual for stocks, 4% for bonds, weighted by allocation. Use conservative estimates, not optimiztic ones.
   - Debt paydown schedule: apply minimum payments to all debts, extra payments if the user makes them
2. Show two scenarios:
   - "Stay the course": current savings rate and investment returns continue
   - "Accelerate": increase savings rate by $200/month (or whatever the next lever from the budget would yield). Show how this changes the 5-year number.
3. Calculate the "crossover point": when investment returns exceed monthly savings contributions in driving net worth growth. Before this point, saving more matters most. After this point, investment returns matter most.
4. If retirement is a goal: calculate years to financial independence (25x annual expenses in investable assets) at current pace. If over 30 years, note what would need to change.

### Output
Projection table (6mo/1yr/3yr/5yr), two scenarios comparison, crossover point estimate, FI timeline if applicable.
### Quality Gate
Projections use conservative return assumptions (not 12% average). Two scenarios show the impact of incremental changes. Crossover point is estimated.


---

## Worked Example

Illustrative only.

Given typical inputs for Where do I stand financially? Total assets minus total liabilities, month-over-m, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) all assets and liabilities cataloged with current values, (2) net worth calculated with liquid vs. total breakdown, (3) month-over-month change attributed to specific drivers if prior data exists, (4) milestones identified with next milestone ETA, (5) projections calculated for two scenarios.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSETS | Home value unknown | Use Zillow Zestimate or similar automated estimate. If unavailable, use purchase price adjusted for local appreciation rate (typically 3-5% annual) |
| ASSETS | Retirement account balance unknown | Use last statement balance. Note the date. Recommend checking current balance |
| LIABILITIES | Interest rate unknown for a debt | Use category average: credit card 22%, auto loan 7%, student loan 6%, personal loan 11%, mortgage 7% |
| CALCULATE | Net worth is negative | This is a valid result, not an error. Frame the milestone path: the first milestone is reaching zero, then building from there |
| MILESTONES | No prior data for trend | Establish baseline. First run always creates the starting snapshot. Future runs will show change |
| PROJECT | No income data for savings rate estimate | Use net worth change between snapshots as a proxy for net monthly savings |

## State Persistence
- Net worth snapshots by date (building a monthly/quarterly history)
- Asset and liability inventory (for detecting what changed between runs)
- Milestone achievement dates (for tracking velocity)
- Custom goals with progress
- Income and savings rate history

## Reference

### Net Worth Benchmarks by Age (US Median vs. Recommended)

| Age | US Median Net Worth | Recommended Target (1x-2x salary) |
|---|---|---|
| 25-30 | ~$8,000-$30,000 | 0.5x-1x annual salary |
| 30-35 | ~$35,000-$90,000 | 1x-2x annual salary |
| 35-45 | ~$90,000-$190,000 | 2x-4x annual salary |
| 45-55 | ~$190,000-$350,000 | 4x-6x annual salary |
| 55-65 | ~$350,000-$600,000 | 6x-10x annual salary |

### The Power of $100K

Net worth growth from $0 to $100K typically takes 7-10 years. Growth from $100K to $200K takes 3-5 years. Each subsequent $100K is faster because compound returns now exceed what most people can save monthly. This is why the first $100K is the hardest and most important milestone.

### The 4% Rule (Financial Independence)

Investable assets x 0.04 = sustainable annual withdrawal. Therefore: annual expenses x 25 = FI target number.
Example: $60,000/year expenses requires $1,500,000 in investable assets.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
