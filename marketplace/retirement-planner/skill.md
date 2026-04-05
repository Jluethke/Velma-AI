# Retirement Planner

Takes your current age, savings, income, and retirement goals and builds a realistic picture of where you stand. Not financial advice -- a clarity tool. Shows projections at different savings rates, explains Social Security timing tradeoffs (62 vs 67 vs 70), identifies gaps, and suggests questions to ask a financial advisor. Designed for people in their 40s-60s who know they should be planning but feel overwhelmed. Uses plain language, no financial jargon.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SNAPSHOT    --> Where you stand right now (savings, income, debts, timeline)
PHASE 2: PROJECTION  --> What your future looks like at current pace vs. adjusted pace
PHASE 3: SOCIAL SEC  --> Social Security timing analysis (when to claim and why it matters)
PHASE 4: GAP         --> What's missing and what levers you have to close the gap
PHASE 5: QUESTIONS   --> Specific questions to bring to a financial advisor
```

## Inputs
- personal: object -- Current age, planned retirement age (or "I don't know"), marital status, spouse's age and work status if applicable, state of residence
- income: object -- Current annual income (gross), spouse's income if applicable, expected income changes (promotion, career wind-down, part-time transition)
- savings: object -- 401(k)/403(b) balance, IRA/Roth IRA balance, other retirement accounts, taxable investment accounts, savings accounts, pension (if any -- type and estimated monthly benefit)
- contributions: object -- Current monthly retirement contributions, employer match details (percentage and cap), whether you're maxing out any accounts
- debt: object -- Mortgage (balance, rate, years remaining), other debts (car loans, credit cards, student loans, medical debt)
- expenses: object -- (Optional) Estimated monthly expenses now, expected changes in retirement (mortgage paid off, kids independent, healthcare increase, travel plans)
- social_security: object -- (Optional) Estimated monthly benefit from SSA.gov statement (at 62, at 67, at 70). If unknown, skill estimates from income history
- goals: object -- (Optional) What retirement looks like to you: stay in current home, downsize, relocate, travel, work part-time, help grandkids with college, leave an inheritance

## Outputs
- current_snapshot: object -- Net worth summary, savings rate, years to retirement, monthly retirement income gap
- projections: object -- Three scenarios (current pace, moderate increase, aggressive increase) showing projected savings at retirement and estimated monthly income
- social_security_analysis: object -- Claiming age comparison (62/67/70) with breakeven ages and total lifetime benefits
- gap_analysis: object -- Difference between projected retirement income and estimated expenses, with specific shortfall or surplus amounts
- action_items: array -- Concrete steps ranked by impact, plus specific questions to ask a financial advisor
- advisor_prep: object -- Summary sheet to bring to a financial advisor meeting

## Execution

### Phase 1: SNAPSHOT
**Entry criteria:** At least age, income, and some retirement savings information provided.
**Actions:**
1. Calculate current net worth: total retirement savings + other investments + home equity (if owned) - total debts. Note: home equity is real wealth but you can't eat your house -- separate "liquid" retirement assets from "illiquid" ones.
2. Calculate current savings rate: annual retirement contributions (yours + employer match) divided by gross income. Benchmarks:
   - Below 10%: behind for most people
   - 10-15%: adequate if you started in your 20s-30s
   - 15-20%: good for mid-career starters
   - 20%+: strong, especially if catching up
3. Calculate years to retirement. If "I don't know" for retirement age, use 67 as default (full Social Security age for most people today).
4. Estimate current trajectory: if you save nothing more and your existing savings grow at 6% annually (conservative stock/bond blend after inflation), what will you have at retirement age?
5. Flag immediate concerns:
   - High-interest debt (above 7%) competing with retirement savings
   - No employer match being captured (leaving free money on the table)
   - Zero emergency fund (retirement savings will get raided in a crisis)
   - Over 50 and less than 3x annual salary saved (common guideline: 1x by 30, 3x by 40, 6x by 50, 8x by 60, 10x by 67)

**Output:** Net worth summary (liquid vs illiquid), savings rate with benchmark comparison, years to retirement, current trajectory projection, immediate concern flags.
**Quality gate:** All savings accounts are totaled. Savings rate includes employer match. Trajectory projection uses reasonable growth assumptions (6% real return for stocks/bonds, clearly stated).

### Phase 2: PROJECTION
**Entry criteria:** Snapshot complete.
**Actions:**
1. Build three projection scenarios, all in today's dollars (inflation-adjusted, so the numbers mean what they say):
   - **Current pace:** Keep saving exactly what you save now. What's the balance at retirement?
   - **Moderate increase:** Increase contributions by $200/month (or to 15% of income, whichever is more realistic). What changes?
   - **Aggressive catch-up:** Max out 401(k) ($23,500/year for 2025, $31,000 if over 50 with catch-up contribution). What changes?
2. For each scenario, calculate estimated monthly retirement income using the 4% rule (withdraw 4% of savings annually as a sustainable rate for 30 years). This is a rough guideline, not a guarantee.
   - Example: $500,000 saved = $20,000/year = ~$1,667/month from savings
   - Add estimated Social Security benefit
   - Add any pension income
   - Total = estimated monthly retirement income
3. Compare estimated retirement income to estimated retirement expenses:
   - If expenses are unknown, use 70-80% of current income as a starting estimate (no commute, no retirement contributions, possibly no mortgage, but higher healthcare costs)
   - Adjust for known changes: mortgage payoff date, kids becoming independent, planned relocation
4. Show the "magic of time" for each scenario: how much more each year of delay costs. At age 50, waiting one year to increase savings by $500/month costs roughly $100,000 at retirement (due to lost compounding). Make the cost of waiting tangible.
5. If applicable, model the impact of working 2-3 extra years. Often the single biggest lever because it simultaneously adds savings years, reduces withdrawal years, and increases Social Security benefits.

**Output:** Three scenario projections with balances at retirement, estimated monthly income, and comparison to estimated expenses. Cost-of-waiting calculation. Impact of working longer.
**Quality gate:** All three scenarios use the same assumptions (growth rate, inflation, tax treatment) for fair comparison. 4% rule is explained as a guideline with caveats. Numbers are in today's dollars.

### Phase 3: SOCIAL SEC
**Entry criteria:** Projections complete. Age and income information available.
**Actions:**
1. If SSA statement is available, use those numbers directly. If not, estimate benefits based on income history using SSA's approximate formula (benefits are based on highest 35 years of earnings, adjusted for inflation).
2. Compare three claiming ages with plain-language explanation:
   - **Age 62 (earliest):** Reduced benefit -- approximately 70% of full benefit. You get checks sooner, but each check is permanently smaller. Good if: you need the money to survive, health concerns, spouse has strong income/benefits.
   - **Age 67 (full retirement age for most):** 100% of your earned benefit. The baseline. Good if: you're in decent health and have some savings to bridge.
   - **Age 70 (maximum):** Enhanced benefit -- approximately 124% of full benefit (8% increase per year past 67). Each check is permanently larger. Good if: you're healthy, have savings to bridge the gap, expect to live past ~80, and want maximum guaranteed income later in life.
3. Calculate the breakeven ages:
   - 62 vs 67: At what age does the person who waited until 67 come out ahead in total lifetime benefits? (Typically around age 78-80.)
   - 67 vs 70: At what age does the person who waited until 70 come out ahead? (Typically around age 82-83.)
   - Plain language: "If you live past [breakeven age], waiting was the better financial choice."
4. Spousal benefit analysis (if married):
   - Spousal benefits (up to 50% of higher earner's benefit)
   - Survivor benefits (surviving spouse can switch to deceased spouse's higher benefit)
   - Coordination strategy: often the higher earner delays to 70 (maximizing the survivor benefit) while the lower earner claims earlier
5. Tax considerations in plain language:
   - If total income exceeds certain thresholds, up to 85% of Social Security benefits are taxable
   - This matters for deciding when to draw from retirement accounts vs. Social Security
   - Roth conversions before claiming can reduce future tax on Social Security (mention as something to discuss with advisor)

**Output:** Side-by-side comparison of claiming at 62/67/70 with monthly amounts, breakeven ages, spousal strategy if applicable, and tax note.
**Quality gate:** All three claiming ages are compared with specific dollar amounts. Breakeven ages are calculated. Spousal coordination is addressed if married. Tax impact is mentioned without overcomplicating.

### Phase 4: GAP
**Entry criteria:** Projections and Social Security analysis complete.
**Actions:**
1. Calculate the retirement income gap (or surplus) for each scenario:
   - Gap = Estimated monthly expenses - (Retirement account income + Social Security + Pension)
   - Negative gap means you're projected to fall short
   - Positive gap means you're projected to have more than enough
2. If there's a gap, rank the levers to close it by impact:
   - **Save more now** -- every additional $100/month matters, especially with 10+ years to go
   - **Work longer** -- even 1-2 extra years has an outsized impact (more saving + less withdrawing + higher Social Security)
   - **Reduce planned expenses** -- downsizing housing is usually the single biggest lifestyle lever
   - **Optimize Social Security timing** -- delaying from 62 to 67 can add $500-800/month permanently
   - **Part-time work in early retirement** -- even $1,000/month part-time for the first 5 years dramatically extends savings
   - **Catch-up contributions** -- if over 50, you can contribute an extra $7,500/year to 401(k) beyond the normal limit
   - **Pay off mortgage before retirement** -- eliminating the largest expense reduces how much income you need
   - **Relocate to lower cost area** -- can cut expenses by 20-40% depending on current and target locations
3. If there's a surplus, note it -- but also stress-test it:
   - What if you need long-term care? (Average cost: $4,500-9,000/month depending on type and location)
   - What if the market drops 30% in year one of retirement? (Sequence of returns risk)
   - What if you live to 95? (Longevity risk -- running out of money at 88 is a real fear for good reason)
4. Healthcare bridge: if retiring before 65 (Medicare eligibility), estimate marketplace insurance costs ($500-1,500/month per person depending on age and location). This is one of the most overlooked costs of early retirement.

**Output:** Gap or surplus for each scenario, ranked levers to close any gap, stress test results, healthcare bridge cost if applicable.
**Quality gate:** Gap is calculated with specific monthly dollar amounts. Levers are ranked by impact and feasibility. Stress tests cover longevity, market risk, and healthcare. No false comfort if the situation is tight.

### Phase 5: QUESTIONS
**Entry criteria:** Gap analysis complete.
**Actions:**
1. Generate a personalized list of questions to ask a financial advisor, based on what the analysis revealed. Not generic questions -- specific ones:
   - "Given that I have $X in a traditional 401(k) and plan to retire at Y, should I be doing Roth conversions now while I'm in the Z% tax bracket?"
   - "My mortgage will be paid off 3 years after I retire. Should I accelerate payoff or keep investing the difference?"
   - "I have a pension that offers a lump sum or monthly payments. Which is better for my situation?"
   - "Should I claim Social Security at 62 and invest it, or wait until 70 for the higher guaranteed amount?"
2. Create an advisor preparation sheet -- a one-page summary to bring to the meeting:
   - Current age, target retirement age
   - Account balances by type
   - Current savings rate
   - Monthly income needed in retirement (estimated)
   - Gap amount identified
   - Top concerns
3. Note the difference between types of financial advisors:
   - **Fee-only fiduciary:** Charges a flat fee or hourly rate. Legally required to act in your interest. This is what you want.
   - **Commission-based:** Makes money by selling you financial products. May recommend things that pay them more, not necessarily what's best for you.
   - **Robo-advisors:** Low-cost automated investing. Good for simple situations, less helpful for complex retirement planning.
   - How to find a fee-only fiduciary: NAPFA.org, Garrett Planning Network, or search "fee-only financial advisor near me."
4. Flag things NOT to do without professional advice:
   - Don't cash out a 401(k) early (10% penalty + taxes can eat 30-40% of the balance)
   - Don't put all retirement savings into a single stock or crypto
   - Don't co-sign loans using retirement assets as collateral
   - Don't assume Social Security won't be there (it may be reduced but is very unlikely to disappear entirely)

**Output:** Personalized advisor questions, one-page preparation sheet, advisor type guide, list of things to avoid.
**Quality gate:** Questions are specific to this person's situation (not generic). Preparation sheet is concise enough to actually bring to a meeting. Advisor guidance is practical and actionable.

## Exit Criteria
Done when: (1) current snapshot shows net worth, savings rate, and trajectory, (2) three projection scenarios show retirement balances and estimated monthly income, (3) Social Security claiming ages are compared with breakeven analysis, (4) gap or surplus is quantified with levers to adjust, (5) personalized advisor questions and preparation sheet are provided.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| SNAPSHOT | Person doesn't know their account balances | Adjust -- provide instructions for checking (log into 401k provider, check last statement, call HR). Use rough estimates if needed, flag as imprecise |
| SNAPSHOT | Person has no retirement savings at all | Adjust -- skip trajectory analysis, focus entirely on "starting from zero" plan with age-appropriate urgency level |
| PROJECTION | Person is over 60 with very little saved | Adjust -- be honest but not hopeless. Focus on Social Security optimization, expense reduction, working longer, and part-time income. Small changes still matter |
| PROJECTION | Extremely high income skews standard benchmarks | Adjust -- use percentage-of-income benchmarks rather than dollar thresholds. High earners need to replace a larger absolute income |
| SOCIAL SEC | No SSA statement and income history is vague | Adjust -- use rough estimates based on current income, clearly label as approximate, strongly recommend creating an account at SSA.gov for actual numbers |
| SOCIAL SEC | Person is divorced (may be eligible for ex-spouse's benefits) | Flag -- divorced after 10+ years of marriage may be eligible for benefits based on ex-spouse's record. This is a critical question for an advisor |
| GAP | Gap is so large that no reasonable lever closes it | Escalate -- be direct but compassionate. Focus on maximizing Social Security, reducing expenses, part-time work, and government assistance programs. Discuss whether the retirement age needs to move |
| QUESTIONS | Person says they can't afford a financial advisor | Adjust -- recommend free resources: AARP Financial Planning, local community college workshops, VITA tax help, Benefits.gov for assistance programs, fee-only advisors who charge hourly ($150-300 for a single session) |

## State Persistence
- Financial snapshot (account balances, income, debts at time of analysis -- baseline for tracking progress)
- Projection assumptions (growth rates, inflation rates, retirement age used -- for consistent re-runs)
- Social Security estimates (claiming age decision and rationale -- revisit as circumstances change)
- Gap closure progress (which levers were pulled, contribution changes made, debts paid off)
- Advisor meeting outcomes (what was discussed, recommendations given, actions taken)
- Life event triggers (job change, inheritance, health change, spouse retirement -- events that warrant re-running the analysis)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
