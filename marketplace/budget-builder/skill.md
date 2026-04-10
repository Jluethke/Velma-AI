# Budget Builder

Takes your income, bills, and spending habits and builds a realistic monthly budget you'll actually follow. Not a Dave Ramsey lecture -- a practical plan that accounts for your actual life (yes, including coffee and streaming). Shows where money is going, where you're bleeding, and what small changes have the biggest impact. Designed for people who've never budgeted or whose budgets always fail.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INTAKE     --> Gather income, fixed bills, and spending habits
PHASE 2: FORENSICS  --> Analyze where money actually goes (the uncomfortable truth)
PHASE 3: BLUEPRINT  --> Build a budget that fits your real life, not a fantasy version
PHASE 4: LEVERS     --> Identify the 3-5 changes with the biggest impact for the least pain
PHASE 5: GUARDRAILS --> Set up simple rules and checkpoints so you actually stick with it
```

## Inputs
- income: object -- Take-home pay (after taxes), frequency (weekly/biweekly/monthly), any side income or irregular income (freelance, tips, bonuses)
- fixed_expenses: array -- Bills that are the same every month: rent/mortgage, car payment, insurance, loan payments, subscriptions, phone, internet
- variable_spending: object -- Rough estimates or bank statement data for: groceries, dining out, gas/transport, entertainment, shopping, personal care, kids, pets
- financial_situation: object -- (Optional) Current savings, debt balances and interest rates, credit score range, any upcoming big expenses (car repair, medical, holiday)
- goals: object -- (Optional) What you want from budgeting: stop living paycheck to paycheck, pay off debt, save for something specific, just stop the bleeding

## Outputs
- spending_snapshot: object -- Where every dollar currently goes, categorized and totaled, with percentage breakdowns
- monthly_budget: object -- Realistic spending plan organized by category with specific dollar amounts
- bleed_points: array -- The 3-5 biggest areas where money is disappearing, ranked by dollar amount
- action_plan: array -- Specific, low-pain changes ranked by impact (dollars saved per month vs. lifestyle disruption)
- monthly_checkup: object -- Simple weekly and monthly check-in template to stay on track

## Execution

### Phase 1: INTAKE
**Entry criteria:** At least take-home income and a rough idea of monthly bills provided.
**Actions:**
1. Establish monthly take-home income. If paid biweekly, multiply by 26 and divide by 12 (not by 2 -- this is a common mistake that loses people 2 paychecks a year). If irregular income, use the average of the last 3 worst months as the baseline.
2. List every fixed expense with exact amounts and due dates. Include the ones people forget: subscriptions (Netflix, Spotify, gym, apps, cloud storage), insurance premiums, minimum debt payments, HOA/condo fees, child support, tithing.
3. Estimate variable spending. If bank/credit card statements are available, use real numbers. If not, use honest estimates -- then add 20% (people universally underestimate spending on food, Amazon, and "small stuff").
4. Calculate current monthly surplus or deficit: income minus all spending. If the number is negative, flag immediately -- this is an emergency budget situation.
5. Note any financial context: high-interest debt (anything above 10% APR), upcoming expenses, whether there's any savings cushion at all.

**Output:** Complete financial snapshot showing income, fixed costs, variable spending, and current monthly surplus/deficit.
**Quality gate:** Income is verified as after-tax. All subscriptions are accounted for. Variable spending includes the 20% honesty buffer if estimates were used.

### Phase 2: FORENSICS
**Entry criteria:** Financial snapshot is complete.
**Actions:**
1. Categorize all spending into buckets:
   - **Non-negotiable:** Rent/mortgage, utilities, insurance, minimum debt payments, groceries (not dining out), transportation to work, medication
   - **Important but flexible:** Phone plan, internet, groceries (the premium stuff), gas beyond commute, basic clothing
   - **Lifestyle:** Dining out, entertainment, subscriptions, hobbies, shopping, personal care beyond basics
   - **Invisible leaks:** Fees (ATM, overdraft, late payment), unused subscriptions, impulse purchases, convenience spending (delivery fees, premium gas when regular works)
2. Calculate the percentage of income going to each bucket. Healthy targets:
   - Non-negotiable: 50-60%
   - Important but flexible: 10-15%
   - Lifestyle: 10-20%
   - Savings/debt payoff: 10-20%
   - If non-negotiable exceeds 70%, this is a structural problem (income too low or housing too expensive), not a spending discipline problem.
3. Identify the "latte factor" -- but be honest about it. Cutting $5/day coffee saves $150/month. But if that coffee is the only joy in your morning, cutting it will make the whole budget collapse. Separate genuine waste from things that keep you sane.
4. Flag subscription stacking: count total subscription spend. Average American household spends $219/month on subscriptions and thinks they spend $86.
5. Detect payment timing problems: bills clustered on the same dates causing cash crunches, even when monthly income covers everything.

**Output:** Categorized spending breakdown with percentages, identified leaks, subscription audit, and cash flow timing analysis.
**Quality gate:** Every dollar of spending is categorized. Invisible leaks are quantified. The gap between "what people think they spend" and "what they actually spend" is explicitly shown.

### Phase 3: BLUEPRINT
**Entry criteria:** Forensics complete.
**Actions:**
1. Set the budget foundation using a modified needs/wants/future framework:
   - **Needs (50-60%):** Non-negotiable bills, groceries, transportation, minimum debt payments, insurance
   - **Wants (20-30%):** Everything that makes life worth living -- dining out, entertainment, hobbies, subscriptions you actually use, personal care
   - **Future (10-20%):** Emergency fund, extra debt payments, savings goals
   - Adjust percentages based on income level. Below $3,000/month take-home, needs will realistically be 65-75% and that's okay -- the budget accounts for this.
2. Assign specific dollar amounts to each category and subcategory. Round to whole numbers. No one tracks $7.83 budgets.
3. Build in a "life happens" buffer of 3-5% of income for the stuff that always comes up -- car needs an oil change, kid needs new shoes, friend's birthday. This is NOT savings. This is "I forgot about this expense" insurance.
4. Handle irregular expenses: annual subscriptions, quarterly insurance, holiday spending, back-to-school. Divide annual cost by 12 and set aside monthly.
5. If the budget won't balance (spending exceeds income even after cuts), be direct about it: list what has to change, starting with the highest-impact options that don't require moving or changing jobs.

**Output:** Monthly budget with specific dollar amounts per category, "life happens" buffer included, irregular expenses smoothed to monthly amounts.
**Quality gate:** Budget totals exactly equal take-home income (every dollar has a job). Buffer is included. No category is set to $0 unless genuinely inapplicable.

### Phase 4: LEVERS
**Entry criteria:** Budget blueprint complete.
**Actions:**
1. Rank all potential changes by the "Impact-to-Pain Ratio" (IPR):
   - **High impact, low pain:** Canceling subscriptions you forgot about, switching to annual billing, negotiating insurance rates, dropping premium services to standard (phone plan, streaming tier), refinancing high-interest debt
   - **High impact, medium pain:** Meal prepping 3 days a week instead of buying lunch, switching grocery stores, carpooling or adjusting commute, negotiating rent at renewal
   - **High impact, high pain:** Moving to cheaper housing, selling a car, lifestyle downgrades that affect daily quality of life
   - **Low impact, any pain:** Skipping coffee, obsessing over coupon clipping, turning off lights (saves ~$3/month) -- not worth the mental energy
2. Select the top 3-5 changes that together close the budget gap or hit the savings target. Never recommend more than 5 -- too many changes at once guarantees failure.
3. For each change, calculate: exact monthly dollar impact, one-time effort to implement, ongoing effort to maintain, and what it actually costs you in lifestyle terms (be honest).
4. If debt exists, recommend a payoff order: avalanche (highest interest first, mathematically optimal) or snowball (smallest balance first, psychologically easier). Pick based on personality, not textbook answers.
5. Identify "found money" opportunities: employer 401k match not being captured (literally free money being left on the table), FSA/HSA pre-tax savings, tax withholding adjustments if getting large refunds.

**Output:** Prioritized list of 3-5 specific changes with dollar impact, effort level, and honest lifestyle cost. Debt payoff recommendation if applicable. Found money opportunities.
**Quality gate:** Each recommendation has a specific dollar amount attached. Total savings from recommendations is enough to meet the stated goal. No recommendations that require willpower alone.

### Phase 5: GUARDRAILS
**Entry criteria:** Lever recommendations selected.
**Actions:**
1. Set up a weekly 5-minute check-in template:
   - How much have I spent this week vs. weekly budget (monthly budget / 4.33)?
   - Any surprise expenses? Pull from buffer or adjust?
   - Am I on track for the month or drifting?
2. Define the "circuit breaker" rules:
   - If you overspend in one category, borrow from another specific category (define which ones are okay to borrow from)
   - If you blow the budget by more than 15% one month, don't quit -- just reset next month
   - The 24-hour rule: any non-essential purchase over $50 (or whatever threshold fits), wait 24 hours
3. Set up a monthly review template:
   - Compare actual spending to budget per category
   - Calculate how much went to savings/debt payoff
   - Note what worked and what didn't (adjust the budget, not your willpower)
   - If the budget failed 3 months in a row in the same category, the budget is wrong, not you -- adjust the category up and find savings elsewhere
4. Create a "wins" tracker: every month, calculate total debt paid off, savings added, and subscriptions cancelled. Seeing progress prevents quitting.
5. Plan for budget-breaking months: holidays (November-December), back to school (August), tax season, summer vacations. Set aside small amounts in advance rather than blowing the budget.

**Output:** Weekly check-in template, monthly review template, circuit breaker rules, wins tracker, seasonal adjustment calendar.
**Quality gate:** Check-in takes under 5 minutes. Rules are specific (not "be careful with spending"). Failure recovery is built in.

## Exit Criteria
Done when: (1) complete spending snapshot shows where every dollar goes, (2) monthly budget assigns every dollar of income to a category, (3) top 3-5 highest-impact changes are identified with specific dollar amounts, (4) weekly and monthly check-in templates are provided, (5) budget accounts for irregular expenses and has a "life happens" buffer.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INTAKE | No bank statement data, only guesses | Adjust -- use estimates with 20% buffer, recommend tracking all spending for 2 weeks before finalizing budget |
| INTAKE | Irregular or unpredictable income | Adjust -- budget based on lowest earning month of the last 6, treat anything above as bonus income for savings/debt |
| FORENSICS | Spending exceeds income (deficit) | Escalate -- this is a crisis budget. Focus exclusively on covering non-negotiables and finding immediate income or cuts |
| FORENSICS | Household members disagree on spending priorities | Adjust -- give each adult a fixed "no questions asked" allowance, budget the rest jointly |
| BLUEPRINT | Cannot make the math work without major life changes | Flag -- be direct that no budget trick fixes a structural income-to-cost problem. List the hard options honestly |
| LEVERS | Person has already cut everything obvious | Adjust -- shift focus to income side (overtime, side work, selling unused items, assistance programs) |
| GUARDRAILS | Previous budgets always failed within 2 months | Adjust -- start with tracking only (no restrictions) for month 1, then introduce limits gradually |
| ACT | User rejects the budget or says it doesn't reflect their real life | **Adjust** -- incorporate specific feedback (e.g., a category is set too low, a cut is not realistic, a goal isn't the right priority), update the affected categories, and regenerate the impacted blueprint and lever recommendations; do not restart from Phase 1 unless the income or expense data was significantly wrong |

## State Persistence
- Monthly income and expense baseline (for tracking changes over time)
- Budget vs. actual history (what was planned vs. what happened each month)
- Subscription inventory (what's active, what was cancelled, renewal dates)
- Debt payoff progress (balances over time, interest saved, projected payoff dates)
- Seasonal spending patterns (which months consistently run over budget and by how much)
- "What worked" log (which budget strategies this specific person actually follows vs. ignores)

## Reference

### Budget Category Allocation Benchmarks

| Category | Tight Budget (<$3K/mo take-home) | Standard Budget | Healthy Budget |
|---|---|---|---|
| Non-negotiables (housing, utilities, insurance, minimums) | 65–75% | 50–60% | 45–55% |
| Important but flexible (food, transport, phone) | 10–15% | 10–15% | 10–15% |
| Lifestyle (dining, entertainment, subscriptions, hobbies) | 5–10% | 15–20% | 20–25% |
| Savings / debt payoff | 0–5% | 10–20% | 20–30% |

If non-negotiables exceed 70%, this is a structural income problem, not a spending discipline problem.

### Impact-to-Pain Ratio (IPR) Decision Tree

```
Is the savings ≥ $50/month?
├── Yes → Is the lifestyle cost low (habit change or one-time action)?
│   ├── Yes → High IPR: Recommend immediately
│   └── No → Medium IPR: Recommend with caveat about sustainability
└── No → Is it a "set and forget" action (cancel subscription, refinance)?
    ├── Yes → Low-medium IPR: Worth doing, low effort
    └── No → Low IPR: Skip — mental energy cost exceeds benefit
```

### Biweekly Income Conversion

Biweekly (26 pays/year): Monthly income = (gross annual / 12) OR (paycheck × 26 / 12)
NOT paycheck × 2 — this loses 2 paychecks per year and causes a recurring deficit.

### Debt Payoff Methods

| Method | Best For | How It Works |
|---|---|---|
| Avalanche | Mathematically optimal; suits analytical personalities | Pay minimums on all debts; apply extra to highest-APR debt first |
| Snowball | Psychologically motivating; suits people who need wins | Pay minimums on all debts; apply extra to smallest-balance debt first |
| Hybrid | Motivation + optimization | Use snowball until 1-2 quick wins, then switch to avalanche |

### The "Latte Factor" Reality Check

Before recommending any cut, calculate: (daily cost × 365) / 12 = monthly impact
- $5/day coffee = $152/month. Meaningful if eliminated. But if it's the one daily pleasure, cutting it usually causes budget failure within 60 days.
- Rule: only cut what the user agrees feels like waste, not what feels like survival.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
