# Small Business Tax Planning

**One-line description:** The business owner and their accountant each submit the real financial picture and what they know is coming — AI produces a year-end and forward tax plan that reduces the bill, eliminates surprises, and puts the owner in control of their numbers before it is too late to act.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both owner and accountant must submit before synthesis runs.

---

## Inputs

### Shared
- `shared_business_name` (string, required): Business name.
- `shared_tax_year_or_planning_period` (string, required): Tax year or planning period being addressed.

### Business Owner Submits Privately
- `owner_current_year_financials` (object, required): Revenue, expenses, profit — current year-to-date and any large unusual items.
- `owner_major_transactions_planned` (object, required): Equipment purchases, real estate, ownership changes, distributions — anything large planned before year-end or next year.
- `owner_personal_financial_situation` (object, required): Personal income outside the business, spouse income, significant personal transactions — anything that affects the combined tax picture.
- `owner_what_they_are_worried_about` (array, required): What tax situations, liabilities, or IRS notices are you nervous about?
- `owner_goals_for_the_plan` (array, required): Minimize this year's bill? Build retirement? Structure for a sale? What are you optimizing for?

### Accountant / CPA Submits Privately
- `accountant_current_year_tax_estimate` (object, required): Current estimated federal and state tax liability based on available financials.
- `accountant_strategies_available` (object, required): What tax reduction strategies are available given the owner's situation — retirement plans, timing, entity structure, deductions?
- `accountant_issues_flagged` (array, required): What accounting or tax issues do you see — misclassifications, underpaid estimates, risky deductions, missing records?
- `accountant_what_owner_has_not_considered` (array, required): Strategies or risks the owner has not brought up that are relevant to their situation.
- `accountant_year_end_deadlines` (object, required): What must be done before December 31st vs. what can wait until the return is filed?

## Outputs
- `tax_liability_projection` (object): Current year estimated tax, with and without planning strategies applied.
- `action_list_with_deadlines` (array): Specific actions to take before year-end and before the filing deadline — with dollar impact estimates.
- `retirement_and_savings_plan` (object): Retirement contribution strategy that reduces current-year tax — plan type, contribution amount, deadline.
- `forward_planning_recommendations` (array): Entity structure, quarterly estimates, and strategies for the following year.
- `issues_to_resolve` (array): Accounting problems, missing records, or risky positions that need to be cleaned up.
- `advisor_coordination_list` (array): What the owner needs to do with their attorney, financial advisor, or bookkeeper before the return is filed.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both submissions received.
**Actions:** Confirm owner's financials and accountant's tax estimate present.
**Output:** Readiness confirmation.
**Quality Gate:** Owner's current-year financials and accountant's liability estimate both present.

---

### Phase 1: Assess the Current Tax Position
**Entry Criteria:** Both submissions confirmed.
**Actions:** 1. Build the current-year tax picture — income, estimated liability, estimated payments made or owed. 2. Identify the issues the accountant flagged — what is the risk and the dollar exposure? 3. Cross-reference the owner's planned transactions against available strategies — do they create or eliminate tax opportunities? 4. Assess whether the owner's goals are achievable in the current structure or require entity or strategy changes.
**Output:** Current tax picture, issue risk assessment, transaction-strategy alignment, goal feasibility.
**Quality Gate:** Tax estimate is specific — "estimated federal liability is $X, state is $Y, currently $Z short in payments."

---

### Phase 2: Build the Planning Strategies
**Entry Criteria:** Position assessed.
**Actions:** 1. For each available strategy, quantify the estimated tax reduction and what it requires. 2. Prioritize by dollar impact and ease of implementation before year-end. 3. Build the retirement contribution strategy — which plan, how much, and what the tax reduction is. 4. Identify timing strategies — income deferral, expense acceleration — that are available before year-end.
**Output:** Strategy list with dollar impact, retirement plan recommendation, timing strategies.
**Quality Gate:** Every strategy has an estimated dollar impact and a specific action required. No vague recommendations.

---

### Phase 3: Build the Action Plan
**Entry Criteria:** Strategies built.
**Actions:** 1. Sequence actions by deadline — what must be done before December 31 vs. before filing. 2. Assign each action a dollar impact and a responsible party (owner, accountant, attorney, bookkeeper). 3. Build the forward-planning recommendations — quarterly estimates, entity review, next year's setup. 4. List issues to resolve — records to gather, positions to clean up, estimates to pay.
**Output:** Action list with deadlines and dollar impacts, forward recommendations, issues to resolve.
**Quality Gate:** Action list is specific enough that the owner knows exactly what to do and by when. Dollar impacts are estimates, not guarantees, but are stated.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Plan built.
**Actions:** 1. Present tax liability projection with and without planning. 2. Deliver action list with deadlines. 3. Deliver retirement and savings plan. 4. Deliver forward planning recommendations. 5. Flag issues to resolve and advisor coordination items.
**Output:** Full synthesis — liability projection, action list, retirement plan, forward recommendations, issues.
**Quality Gate:** Owner knows their current liability, what they can do to reduce it, and exactly what to do in the next 60 days.

---

## Exit Criteria
Done when: (1) current tax liability is specific, (2) every strategy has a dollar estimate and action, (3) retirement plan is specific with amounts and deadlines, (4) action list has deadlines, (5) issues are named and have owners.

---
Copyright 2024-present The Wayfinder Trust. All rights reserved.
