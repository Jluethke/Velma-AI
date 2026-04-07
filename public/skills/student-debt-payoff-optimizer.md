# Student Debt Payoff Optimizer

Takes your student loan mess -- federal, private, subsidized, unsubsidized, multiple servicers, confusing repayment options -- and builds a clear payoff strategy that minimizes what you pay in total while keeping your monthly payments survivable. Covers loan consolidation decisions, income-driven repayment plan selection, forgiveness program eligibility (PSLF and others), refinancing math, and the psychological game of staying motivated through years of payments. No shame about how much you borrowed. The system failed you, not the other way around. Now let's deal with the math. **Note: student loan policies change frequently. Verify current rates, programs, and eligibility with your loan servicer or studentaid.gov. This is educational guidance, not financial or legal advice.**

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY     --> Map every loan with its balance, rate, servicer, and type
PHASE 2: STRATEGY      --> Choose the optimal repayment plan based on your income and goals
PHASE 3: FORGIVENESS   --> Assess eligibility for forgiveness programs and calculate their value
PHASE 4: OPTIMIZATION  --> Refinancing decisions, extra payment math, and acceleration tactics
PHASE 5: EXECUTION     --> Automate payments, track progress, and stay motivated for the long haul
```

## Inputs
- loans: array -- Every student loan: lender/servicer, balance, interest rate, type (federal subsidized, federal unsubsidized, federal PLUS, private), monthly payment, repayment plan currently on, loan status (in repayment, grace period, deferment, forbearance, default)
- income: object -- Current gross and net income, filing status (single, married filing jointly/separately), expected income trajectory (stable, growing, uncertain), spouse's income and loans if applicable
- employment: object -- Current employer, sector (public, nonprofit, private), how long you've been there, likelihood of staying, any employer student loan benefits
- financial_context: object -- (Optional) Other debts, monthly budget flexibility (how much extra could go toward loans), savings, retirement contributions, major upcoming expenses
- goals: object -- (Optional) What you want: minimize total paid, minimize monthly payment, be debt-free by a specific date, qualify for forgiveness, psychological wins (seeing balances drop)

## Outputs
- loan_inventory: object -- Complete loan map with balances, rates, types, and servicers organized and prioritized
- repayment_strategy: object -- Recommended repayment plan with monthly payment projection and total cost over time
- forgiveness_assessment: object -- Eligibility for PSLF, IDR forgiveness, and other programs with expected value
- optimization_plan: object -- Refinancing analysis, extra payment strategy, and acceleration tactics with specific dollar impacts
- execution_system: object -- Payment automation setup, progress tracking, and motivation framework

## Execution

### Phase 1: INVENTORY
**Entry criteria:** Person has at least basic loan information or access to their loan servicer accounts.
**Actions:**
1. Build a complete loan inventory. Most people don't actually know what they owe -- they have a vague sense of dread and a number they're afraid to look at. Pull everything into one place:
   - Log into studentaid.gov (for federal loans) and each private lender's portal
   - For each loan: original amount borrowed, current balance, interest rate, loan type (subsidized, unsubsidized, Grad PLUS, Parent PLUS, private), servicer name, current monthly payment, repayment plan, and loan status
   - Include any loans in deferment, forbearance, or default -- they still exist even if you're not paying them
2. Calculate the real numbers:
   - **Total balance:** Add everything up. Yes, it's painful. But you can't optimize what you don't measure.
   - **Weighted average interest rate:** (Each loan's balance x rate) / total balance. This is the "real" interest rate on your total debt.
   - **Monthly interest cost:** Total balance x weighted average rate / 12. This is how much you're paying just in interest each month before any principal is touched.
   - **Current trajectory:** At your current monthly payments, when will the loans be paid off and how much total will you pay (principal + interest)?
3. Categorize loans by priority:
   - **Highest interest rate first (avalanche):** Mathematically saves the most money. Best for people motivated by optimization.
   - **Smallest balance first (snowball):** Psychologically easier -- you see loans disappear faster. Best for people who need momentum.
   - **Type-based:** Federal loans have protections (income-driven plans, forgiveness, deferment options) that private loans don't. Never sacrifice federal protections without a very good reason.
4. Check loan status for any red flags:
   - Loans in default: these need immediate attention. Default means credit damage, potential wage garnishment, and loss of access to income-driven repayment and forgiveness. Rehabilitation (9 on-time payments) or consolidation can get you out of default.
   - Loans in forbearance/deferment: interest is probably still accruing (especially on unsubsidized and PLUS loans). If you can afford any payment at all, paying even interest-only during forbearance prevents the balance from growing.
   - Capitalized interest: check if unpaid interest has been added to the principal. This is the "balance grew even though I was paying" phenomenon.
5. Identify any employer benefits:
   - Some employers offer student loan repayment assistance ($50-$200/month)
   - Since 2020, employers can pay up to $5,250/year toward your student loans tax-free
   - If your employer offers this and you're not using it, that's money on the table

**Output:** Complete loan inventory with balances, rates, types, and servicers; total debt metrics including weighted average rate and monthly interest cost; current payoff trajectory; priority categorization; and employer benefit check.
**Quality gate:** Every loan is accounted for (including ones in deferment/default). Weighted average rate is calculated. Current trajectory shows total cost, not just monthly payment.

### Phase 2: STRATEGY
**Entry criteria:** Loan inventory complete.
**Actions:**
1. Evaluate federal repayment plan options (for federal loans only -- private loans don't have these):
   - **Standard Repayment:** Fixed payments over 10 years. Highest monthly payment, lowest total cost. Good if you can afford it.
   - **Graduated Repayment:** Starts low, increases every 2 years over 10 years. Higher total cost. Only makes sense if your income will reliably grow.
   - **Extended Repayment:** Fixed or graduated over 25 years. Lower monthly but dramatically higher total cost.
   - **Income-Driven Repayment (IDR) plans:**
     - SAVE (Saving on a Valuable Education): generally the lowest payment for most borrowers. Payment is based on income and family size.
     - PAYE (Pay As You Earn): 10% of discretionary income, 20-year forgiveness.
     - IBR (Income-Based Repayment): 10-15% of discretionary income, 20-25-year forgiveness.
     - ICR (Income-Contingent Repayment): 20% of discretionary income, 25-year forgiveness. Usually worst option but only one available for Parent PLUS after consolidation.
2. Run the math for your specific situation:
   - What's the monthly payment under each plan?
   - What's the total paid over the life of each plan (principal + interest)?
   - If on an IDR plan, what's the estimated forgiven amount after 20-25 years? (This may be taxable income -- plan for the tax bill)
   - How does your expected income trajectory change the math? If your income will triple in 10 years, an IDR plan might cost more in the long run than standard repayment.
3. Choose the strategy based on your goal:
   - **Goal: minimize total cost:** Standard repayment (or IDR + aggressive extra payments on highest-rate loans)
   - **Goal: minimize monthly payment:** IDR plan (SAVE is usually the best option)
   - **Goal: pursue forgiveness:** IDR plan + qualifying employment (see Phase 3)
   - **Goal: debt-free by a specific date:** Calculate required monthly payment and see if it's affordable
4. Handle the married-filing-separately vs. jointly decision if applicable. Some IDR plans count only your income if you file separately, but filing separately costs you other tax benefits. Run both scenarios:
   - Filing jointly: higher IDR payment but lower taxes
   - Filing separately: lower IDR payment but higher taxes and loss of credits/deductions
   - Which saves more? It depends on the gap between your incomes and loan balances. This is worth running with actual numbers.
5. For private loans: the options are simpler and less generous. You have whatever the lender offers (usually just term length options). The main lever for private loans is refinancing to a lower rate (see Phase 4). Private loans cannot be put on income-driven plans, are not eligible for federal forgiveness, and have limited deferment/forbearance.

**Output:** Repayment plan comparison with monthly payments and total costs for each option, recommended strategy matched to goals, filing status analysis if married, and private loan strategy.
**Quality gate:** Math is run for at least 3 plan options with specific dollar amounts. IDR forgiveness is calculated including tax implications. Married filing analysis is included if applicable.

### Phase 3: FORGIVENESS
**Entry criteria:** Repayment strategy chosen.
**Actions:**
1. Assess Public Service Loan Forgiveness (PSLF) eligibility:
   - **Employer requirement:** Must work full-time for a qualifying employer: government (federal, state, local), 501(c)(3) nonprofits, certain other nonprofits. Check with the PSLF Help Tool at studentaid.gov.
   - **Loan requirement:** Must have Direct Loans (or consolidate into Direct Loans). FFEL and Perkins loans don't qualify unless consolidated.
   - **Payment requirement:** 120 qualifying monthly payments (10 years) while on an IDR plan AND working for a qualifying employer. Payments don't need to be consecutive.
   - **Forgiveness:** Tax-free. The remaining balance after 120 payments is forgiven completely.
2. Calculate the PSLF financial impact:
   - What's your projected monthly payment on the IDR plan that qualifies?
   - What's the total you'll pay over 120 months?
   - What's the projected balance at the 120th payment (the amount forgiven)?
   - Compare to: total cost if you just paid it off on standard repayment. If the forgiven amount is significant, PSLF could save tens or hundreds of thousands of dollars.
3. Assess IDR forgiveness (for borrowers NOT pursuing PSLF):
   - After 20-25 years of IDR payments (depending on the plan), the remaining balance is forgiven
   - CRITICAL DIFFERENCE: IDR forgiveness is currently treated as taxable income. If $80,000 is forgiven, that's an $80,000 income event. Depending on your tax bracket, the tax bill could be $15,000-$25,000+.
   - Start a "tax bomb" savings fund now if you're heading toward IDR forgiveness. Even $50/month for 20 years grows to cover most of the tax bill.
   - Note: there was a temporary provision making IDR forgiveness tax-free through 2025 -- check current status as this may have been extended.
4. Check for other forgiveness and discharge programs:
   - **Teacher Loan Forgiveness:** Up to $17,500 for teaching 5 years in low-income schools
   - **Borrower Defense to Repayment:** If your school engaged in fraud or deception
   - **Total and Permanent Disability Discharge:** If you're disabled
   - **Closed School Discharge:** If your school closed while you were enrolled
   - **State-specific programs:** Many states offer loan forgiveness for specific professions (nurses, lawyers in public interest, STEM teachers)
5. Set up PSLF tracking if pursuing it:
   - Submit the Employment Certification Form (ECF) annually and every time you change employers
   - Track qualifying payment count on studentaid.gov
   - Keep documentation of everything: employment dates, payment records, ECF confirmations
   - Common PSLF mistakes to avoid: wrong loan type (must be Direct Loans), wrong repayment plan (must be IDR), wrong employer (for-profit subsidiaries of nonprofits may not qualify), missed recertification

**Output:** PSLF eligibility assessment with financial impact calculation, IDR forgiveness projection with tax implications, other forgiveness program eligibility, and PSLF tracking plan if pursuing.
**Quality gate:** PSLF math includes specific dollar amounts (payments made vs. amount forgiven). Tax implications of IDR forgiveness are calculated. PSLF tracking steps are specific and documented.

### Phase 4: OPTIMIZATION
**Entry criteria:** Forgiveness assessment complete.
**Actions:**
1. Evaluate refinancing for each loan:
   - **When refinancing makes sense:** You have private loans with high interest rates, or you have federal loans AND you're not pursuing forgiveness AND you have stable income AND you can get a significantly lower rate (2%+ reduction)
   - **When refinancing is dangerous:** You refinance federal loans into private loans and lose access to IDR plans, forgiveness, deferment, and forbearance. If you lose your job or income drops, you have no safety net. Never refinance federal loans unless you are very sure about your income stability and don't want forgiveness.
   - **Rate comparison:** Get quotes from 3-5 refinancing lenders (SoFi, Earnest, Laurel Road, etc.). Pre-qualification uses soft credit pulls (no impact on credit score). Compare: new rate vs. current rate, new term vs. remaining term, monthly payment change, total cost change.
2. Build an extra payment strategy:
   - **Avalanche method:** Direct all extra payments to the highest interest rate loan first (minimum payments on everything else). Saves the most money mathematically.
   - **Snowball method:** Direct extra payments to the smallest balance first. Faster psychological wins as loans disappear.
   - Calculate the impact: an extra $100/month on a $30,000 loan at 6% saves ~$6,500 in interest and pays it off 5 years early. Show the specific numbers for this person's loans.
   - IMPORTANT: when making extra payments, specify that the extra amount goes to PRINCIPAL, not future payments. Servicers will default to advancing your due date instead of reducing principal. Call and confirm.
3. Find money for extra payments:
   - Employer match or student loan benefit (Phase 1)
   - Tax refund: instead of treating it as a bonus, throw it at the highest-rate loan
   - Side income: even $200/month extra makes a significant difference on a 10-year timeline
   - Expense reduction: the Budget Builder skill can help here
   - Windfalls: bonuses, gifts, selling stuff. The rule: at least 50% of any windfall goes to debt.
4. Evaluate consolidation (different from refinancing):
   - **Federal Direct Consolidation:** Combines multiple federal loans into one with a weighted average interest rate (rounded up to nearest 1/8%). Doesn't save money but simplifies payments and can make FFEL/Perkins loans eligible for IDR and PSLF.
   - **Don't consolidate if:** you're already on an IDR plan with significant payment history (consolidation can reset your forgiveness clock in some cases -- check the current rules carefully).
   - **Private consolidation = refinancing.** Same considerations as above.
5. Run the complete optimization scenario:
   - Baseline: current plan with current payments → total cost over time
   - Optimized: recommended plan + extra payment strategy → total cost and time saved
   - Show the difference in dollars and months. Nothing motivates like seeing "this plan saves you $23,000 and gets you debt-free 4 years sooner."

**Output:** Refinancing analysis with rate comparison, extra payment strategy with specific dollar impact, found money opportunities, consolidation evaluation, and optimized vs. baseline comparison.
**Quality gate:** Refinancing analysis includes the loss of federal protections in the calculus. Extra payment impact is calculated with specific numbers. Optimized scenario shows dollars and time saved.

### Phase 5: EXECUTION
**Entry criteria:** Optimization plan finalized.
**Actions:**
1. Set up payment automation:
   - Enroll in autopay for every loan (most servicers offer a 0.25% interest rate reduction for autopay -- small but free)
   - Set up automatic extra payments to the targeted loan (and confirm it's applied to principal)
   - If paid biweekly (instead of monthly), you make 26 half-payments = 13 full payments per year (one extra payment annually, no additional effort)
   - Set calendar reminders for: annual IDR recertification, PSLF employment certification, any variable rate adjustment dates, and refinancing rate check (annually -- rates change)
2. Build a progress tracking dashboard (spreadsheet, app, or paper):
   - Total balance remaining (updated monthly)
   - Total interest paid to date
   - Number of loans remaining (for snowball motivation)
   - Months remaining at current pace
   - PSLF qualifying payment count (if applicable)
   - Milestones: each $10,000 paid off, each loan eliminated, halfway point, etc.
3. Create a motivation system for the long haul. Student loan payoff takes years -- motivation will fade. Counter that with:
   - **Visual progress:** A thermometer chart, a colored-in grid, or a simple balance graph that goes down over time. Put it somewhere you see daily.
   - **Milestone celebrations:** Define them in advance. When you pay off the first loan, you get [specific treat]. When you hit the halfway point, you get [bigger reward]. Make the reward proportional but not debt-creating.
   - **Annual review:** Every year on the anniversary of starting your payoff plan, calculate: total paid this year, interest saved vs. the old plan, new projected payoff date. Seeing the impact keeps you going.
4. Plan for life disruptions because they WILL happen:
   - **Job loss:** If on federal loans, request deferment or forbearance immediately. If pursuing PSLF, periods of non-qualifying employment pause your count but don't reset it. Private loans have limited options -- call the lender immediately.
   - **Income change (up):** Increase extra payments proportionally. Lifestyle creep is the enemy of debt payoff.
   - **Income change (down):** Recertify for IDR with new income (payment will decrease). Do not go into default -- there's always an option.
   - **Major expense (medical, car, baby):** Temporarily reduce extra payments to minimum only. Protect your emergency fund. Resume the plan when the crisis passes.
5. Set the "debt-free date" celebration:
   - Calculate your projected payoff date with the optimized plan
   - Put it on the calendar
   - Tell people about it (accountability + excitement)
   - When you hit it: actually celebrate. You did something most people never finish. Then immediately redirect what you were paying on loans into retirement savings and building wealth.

**Output:** Payment automation setup checklist, progress tracking dashboard template, motivation system with milestones and rewards, disruption contingency plans, and debt-free date with celebration plan.
**Quality gate:** Autopay is set with rate reduction. Extra payments specify principal only. Tracking includes both financial metrics and motivational elements. Disruption plans cover the major scenarios.

## Exit Criteria
Done when: (1) every loan is inventoried with balance, rate, type, and servicer, (2) repayment strategy is chosen with math showing monthly payment and total cost, (3) forgiveness eligibility is assessed with financial impact, (4) optimization plan shows specific dollar savings vs. current approach, (5) execution system automates payments and tracks progress.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | Person doesn't know their loan details | Adjust -- walk through accessing studentaid.gov for federal loans and pulling credit report (annualcreditreport.com) for all loans including private. The data exists; they just haven't looked. |
| INVENTORY | Loans are in default | Escalate priority -- default resolution comes before optimization. Options: rehabilitation (9 payments to exit default), consolidation (faster but loses some benefits), or settlement (rare, requires lump sum). Contact the servicer or collection agency immediately. |
| STRATEGY | Income is too low for any meaningful payment | Adjust -- enroll in SAVE plan (payment may be $0 for very low incomes). $0 payments on SAVE still count toward IDR forgiveness. Also explore state and local assistance programs. |
| STRATEGY | Person has both federal and private loans | Adjust -- treat them as separate strategies. Federal loans get IDR/forgiveness analysis. Private loans get refinancing analysis. Never mix the two. |
| FORGIVENESS | Person changed from qualifying PSLF employer | Adjust -- PSLF payments don't need to be consecutive. If they return to qualifying employment later, the count resumes. Meanwhile, stay on IDR to keep payments low. |
| FORGIVENESS | Person has been paying for years but never submitted PSLF certification | Adjust -- submit ECF immediately for all past qualifying employment. Retroactive certification is possible. Also check if past payments that didn't qualify under old rules might qualify under recent expansions. |
| OPTIMIZATION | Person wants to aggressively pay off federal loans while also qualifying for forgiveness | Adjust -- these goals conflict. If forgiveness will save you money, making extra payments is literally throwing away the forgiveness benefit. Run both scenarios and show which saves more. |
| EXECUTION | Person falls off the plan after 6 months | Adjust -- re-engage with the progress tracker. Show how much has been paid and saved so far. Restart the motivation system. If the payments are genuinely unaffordable, recertify IDR or restructure. |

## State Persistence
- Complete loan inventory updated quarterly (balances, rates, status)
- Payment history and extra payment tracking
- PSLF qualifying payment count and employment certification log
- Total interest paid vs. total interest under original plan (savings visualization)
- Forgiveness timeline and projected forgiven amount
- Annual optimization review (should you refinance now? Has income changed the IDR math?)
- Milestone achievement log

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
