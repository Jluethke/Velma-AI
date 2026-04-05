# Small Business Bookkeeper

Takes your income sources, expenses, and business type, then organizes them into proper categories for tax time. Explains what's deductible (home office, mileage, equipment, software), tracks quarterly estimated tax deadlines, and generates a simple P&L statement. Not an accountant -- a "get your stuff organized so your accountant doesn't charge you double" tool. Designed for freelancers, Etsy sellers, gig workers, and anyone whose "bookkeeping" is a shoebox of receipts.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INTAKE        --> Gather all income and expenses, however messy they are
PHASE 2: CATEGORIZE    --> Sort everything into IRS-friendly categories and flag deductions
PHASE 3: DEDUCTION DIG --> Find money you're leaving on the table by not tracking deductible expenses
PHASE 4: STATEMENTS    --> Generate a Profit & Loss and quarterly tax estimate
PHASE 5: SYSTEM        --> Set up a simple ongoing bookkeeping habit so this doesn't happen again
```

## Inputs
- business_type: string -- What you do: freelancer/consultant, Etsy/e-commerce seller, gig worker (Uber, DoorDash, TaskRabbit), content creator, tutor, side business with inventory, rental income, or other. This determines which deductions apply and which IRS schedule you file.
- income_sources: array -- Every way you earned money: client payments (1099 income), platform sales (Etsy, Shopify, Amazon), gig platform payouts, ad revenue, affiliate income, tips, cash payments. Include amounts if known, or "I made about $X from Y" estimates.
- expenses: array -- Everything you spent on the business, however disorganized: receipts, bank statements, credit card charges, PayPal transactions, Venmo payments, cash purchases. Include the "I think this was for work but I'm not sure" stuff -- we'll sort it out.
- business_details: object -- (Optional) When you started, whether you have an LLC or operate as sole proprietor, EIN or SSN filing, state you operate in, whether you work from home, whether you use your car for business
- tax_situation: object -- (Optional) Filing status (single, married filing jointly, head of household), W-2 job income (if this is a side business), estimated tax payments already made this year, last year's tax situation (did you owe, get a refund, get surprised)
- time_period: string -- What period to organize: current year to date, last full year, last quarter, or specific date range

## Outputs
- categorized_ledger: object -- Every income and expense item assigned to the correct IRS category (Schedule C line items), with explanations for why each item goes where
- deduction_report: object -- All identified deductions with dollar amounts, IRS rules in plain English, and documentation needed to defend each deduction in an audit
- profit_loss: object -- Simple P&L statement: total revenue, total expenses by category, net profit/loss, effective tax rate estimate
- quarterly_taxes: object -- Estimated quarterly tax amounts, due dates, payment methods, and whether you're at risk for an underpayment penalty
- bookkeeping_system: object -- Simple ongoing process to stay organized: what to track, where to track it, how often, and the 15-minute weekly habit that prevents the year-end scramble

## Execution

### Phase 1: INTAKE
**Entry criteria:** At least business type and some income/expense information provided.
**Actions:**
1. Establish the business entity type and filing method. Sole proprietor (Schedule C), single-member LLC (also Schedule C unless elected otherwise), partnership (1065/K-1), S-Corp (1120-S). Most small businesses and side hustles are Schedule C -- if the user doesn't know, it's almost certainly Schedule C.
2. Gather all income sources. For each source, determine:
   - Whether it generates a 1099 (the IRS already knows about it -- don't skip it)
   - Whether it's reported through a platform (Etsy, Stripe, PayPal send 1099-K for $600+ since 2024)
   - Whether it's cash or informal payment (still taxable, still needs to be reported, but no 1099 means you need your own records)
3. Gather all expenses. Accept them in whatever format the user has:
   - Bank/credit card statements: ideal, we can categorize line by line
   - Receipts: organize by date, extract vendor and amount
   - "I spent about $X on Y": use the estimate, flag for documentation
   - Mixed personal/business: we'll split these in the next phase
4. Flag the "where did this money go" gaps: periods with income but no recorded expenses (you definitely spent money, you just didn't track it), and large round-number estimates that need itemizing.
5. Note the time period and calculate running totals: gross income by source, total identifiable expenses, and the gap between them (this rough number is your taxable profit before we find deductions).

**Output:** Complete income list by source with 1099 flags, expense list however messy, identified gaps, rough profit estimate.
**Quality gate:** All 1099-reportable income is captured. Expense list includes everything the user can produce. Gaps are flagged, not ignored.

### Phase 2: CATEGORIZE
**Entry criteria:** Income and expense lists assembled.
**Actions:**
1. Map every expense to an IRS Schedule C category. The main ones in plain English:
   - **Advertising:** Website, business cards, social media ads, Google ads, trade show fees, branded merchandise
   - **Car and truck:** Mileage or actual expenses for business driving (not commuting to a W-2 job)
   - **Contract labor:** Payments to freelancers, subcontractors, virtual assistants (you may need to issue them 1099s if over $600)
   - **Insurance:** Business liability, professional indemnity, product insurance. NOT health insurance (that's a different deduction)
   - **Office expenses:** Supplies, printer ink, paper, postage, small items under $2,500
   - **Rent or lease:** Co-working space, storage unit, equipment rental. NOT home office (separate calculation)
   - **Supplies:** Materials consumed in producing your product or service (fabric for Etsy, ingredients for baking, etc.)
   - **Utilities:** Business phone line, internet (business percentage), website hosting, cloud storage
   - **Other expenses:** Software subscriptions (Canva, Quickbooks, Zoom, Shopify), professional development, bank fees, payment processing fees (Stripe, PayPal, Square take 2.9% -- that's deductible)
2. Handle mixed-use expenses: phone used 60% for business means 60% of the bill is deductible. Internet used for work and Netflix -- estimate the business percentage honestly. Car used for business and personal -- track mileage or estimate the split.
3. Separate capital expenditures from regular expenses. Items over $2,500 with a useful life over 1 year (computer, camera, equipment) are depreciated, not expensed in full -- unless you elect Section 179 (which lets you deduct the full cost in year one for most small businesses). Explain both options.
4. Flag personal expenses misclassified as business: gym memberships (not deductible unless you're a personal trainer), regular clothing (not deductible even if you wear it to client meetings), meals alone (not deductible -- only meals with a business purpose with a client or colleague).
5. For each categorized item, note the documentation needed: receipt, invoice, bank statement, mileage log, or written record of business purpose.

**Output:** Every expense assigned to an IRS category with plain-English explanation, mixed-use items split with percentages, capital items flagged with depreciation vs. Section 179 options, personal items flagged and removed.
**Quality gate:** Every expense is categorized or flagged as personal. Mixed-use percentages are reasonable (claiming 95% business use of a personal car will get audited). Documentation requirements are noted.

### Phase 3: DEDUCTION DIG
**Entry criteria:** Expenses categorized.
**Actions:**
1. **Home office deduction:** If the user works from home, calculate both methods:
   - Simplified method: $5 per square foot, up to 300 sq ft ($1,500 max). Easy, no additional documentation.
   - Regular method: Calculate the percentage of home used exclusively for business (office square footage / total home square footage), then deduct that percentage of rent/mortgage interest, utilities, insurance, repairs, and depreciation. Often larger but requires more records.
   - The space must be used "regularly and exclusively" for business. A kitchen table doesn't count. A dedicated desk in a corner does (probably).
2. **Vehicle deduction:** If the user drives for business:
   - Standard mileage rate: 70 cents per mile for 2025 (check current year rate). Multiply by business miles driven.
   - Actual expense method: gas, insurance, repairs, depreciation, registration -- multiplied by business-use percentage.
   - Compare both methods and recommend the higher one. Standard mileage is simpler; actual expenses are better if the car is expensive to operate.
   - Commuting from home to a regular office is NEVER deductible. Driving from home to client sites IS deductible if home is your principal place of business.
3. **Self-employment health insurance deduction:** If the user pays for their own health insurance (not through a spouse's employer plan), the premiums are deductible -- but on Form 1040, not Schedule C. Often missed by people who focus only on business expenses.
4. **Retirement contributions:** SEP-IRA allows up to 25% of net self-employment income. Solo 401(k) allows up to $23,500 employee contribution plus 25% employer contribution. Both reduce taxable income. If the user isn't saving for retirement, this is the biggest tax shelter available.
5. **Commonly missed deductions specific to the business type:**
   - Freelancers: professional development, conference travel, portfolio hosting, professional memberships
   - Etsy sellers: shipping supplies, packaging materials, craft supplies, product photography equipment
   - Gig workers: phone mount, insulated bags, car washes, parking fees, tolls
   - Content creators: ring lights, microphones, editing software, props, studio rental, music licenses
   - All: bank fees, payment processing fees, accounting software, legal fees, business portion of phone and internet
6. Quantify the total deductions found and calculate the tax savings: deductions multiplied by the user's marginal tax rate (including self-employment tax of 15.3% on the first $168,600 of net earnings for 2025).

**Output:** Deduction report listing every identified deduction with dollar amount, IRS rule in plain English, documentation required, and total tax savings estimate. Home office and vehicle calculations shown with both methods.
**Quality gate:** Home office and vehicle deductions calculated if applicable. At least 3 commonly-missed deductions for the specific business type are checked. Total tax savings is quantified.

### Phase 4: STATEMENTS
**Entry criteria:** All categorization and deductions complete.
**Actions:**
1. Generate a Profit & Loss (P&L) statement:
   - **Revenue section:** Total income by source, listed individually. Gross revenue at the top.
   - **Cost of goods sold (if applicable):** Materials, supplies, and direct costs of producing what you sell. Subtract from revenue to get gross profit.
   - **Operating expenses:** Every categorized expense listed by IRS category with totals. Include home office and vehicle deductions.
   - **Net profit/loss:** Gross profit minus operating expenses. This is the number that gets taxed.
2. Calculate estimated tax liability:
   - **Self-employment tax:** 15.3% of 92.35% of net profit (Social Security + Medicare). This applies even if you also have a W-2 job.
   - **Income tax:** Net profit adds to the user's other income. Use their marginal tax rate. If they don't know their bracket, estimate based on total income.
   - **State tax:** If applicable, estimate using the state's rate on business income.
   - **Total estimated tax:** Sum of the above. This is what the IRS expects you to pay.
3. Calculate quarterly estimated tax payments:
   - Divide annual estimate by 4. Due dates: April 15, June 15, September 15, January 15 (of the following year).
   - If the user has a W-2 job, they may be able to increase withholding instead of making quarterly payments -- simpler and avoids missed deadline penalties.
   - Check for underpayment penalty risk: if you owe more than $1,000 at filing and didn't pay at least 90% of this year's tax or 100% of last year's tax through withholding and estimated payments, there's a penalty.
4. Generate a tax calendar with the 4 quarterly deadlines plus annual filing deadline. Include reminders for gathering 1099s (arrive by January 31) and the filing deadline (April 15, or October 15 with extension -- but estimated tax is still due April 15).
5. Provide the "give this to your accountant" summary: a clean one-page document with total income by source, total expenses by category, net profit, estimated tax payments made, and any questions or unusual items the accountant should look at.

**Output:** P&L statement, estimated tax calculation with quarterly payment amounts, tax deadline calendar, accountant summary document.
**Quality gate:** P&L balances (revenue minus expenses equals net profit). Tax estimate includes self-employment tax. Quarterly payment deadlines include the correct dates for the current tax year. Accountant summary is concise and complete.

### Phase 5: SYSTEM
**Entry criteria:** Statements generated.
**Actions:**
1. Set up a simple categorization system that fits the user's actual behavior:
   - **Separate bank account:** If they don't have one, this is step one. A dedicated checking account for business income and expenses makes everything 10x easier. It doesn't need to be a "business account" with fees -- a free personal checking account used only for business works fine.
   - **Expense tracking method:** Match to the user's personality. Hate apps? Use a single folder for receipts and review monthly. Like apps? Wave (free), QuickBooks Self-Employed ($15/month), or a spreadsheet. The best system is the one you'll actually use.
   - **Mileage tracking:** If driving for business, use an app (MileIQ, Stride, or just a note in your phone). Do it daily -- trying to reconstruct mileage at year-end is miserable and inaccurate.
2. Establish the weekly 15-minute bookkeeping habit:
   - Pick a day (Friday afternoon or Sunday evening work well).
   - Review bank and credit card transactions from the week.
   - Categorize each business transaction (most will be obvious after the first month).
   - Snap photos of any paper receipts and toss the originals (digital copies are IRS-accepted).
   - File invoices sent and payments received.
   - Total time: 10-15 minutes. Skip it for 3 months and you're back to the shoebox.
3. Set quarterly check-in milestones:
   - End of each quarter: run a quick P&L to see if you're on track. Calculate quarterly estimated tax and make the payment.
   - Adjust estimated payments if income is significantly higher or lower than projected.
   - Review categorization of any large or unusual expenses.
4. Prepare for tax season (January-February):
   - Collect all 1099s by January 31.
   - Reconcile 1099 amounts against your records (they're sometimes wrong).
   - Finalize the annual P&L.
   - Gather documentation for all deductions claimed.
   - Deliver the clean package to your accountant or use it for self-filing.
5. Address the "but I haven't been tracking anything" recovery plan: for prior years or the current year so far, bank and credit card statements are your backup records. Download 12 months of statements, highlight business transactions, and categorize in bulk. It takes 2-4 hours per year of catch-up, which is way better than the IRS reconstructing your income for you.

**Output:** Bookkeeping system setup checklist, weekly 15-minute habit template, quarterly review template, tax season prep checklist, catch-up plan for prior periods.
**Quality gate:** System matches the user's actual behavior (not aspirational behavior). Weekly habit takes under 15 minutes. Quarterly deadlines are correct for the current tax year. Catch-up plan has specific steps.

## Exit Criteria
Done when: (1) all income and expenses are categorized into IRS-appropriate categories, (2) deductions are identified with dollar amounts and documentation requirements, (3) P&L statement shows net profit/loss, (4) quarterly estimated tax payments are calculated with due dates, (5) simple ongoing bookkeeping system is set up with a weekly 15-minute habit.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INTAKE | User has no records at all -- no receipts, no statements, nothing | Adjust -- start with bank and credit card statement downloads (available online for at least 12-18 months). Reconstruct from there. If cash-only, estimate conservatively |
| INTAKE | Income is a mix of 1099, cash, barter, and "my friend paid me on Venmo" | Adjust -- all of it is taxable income. Categorize by source and reportability. Venmo/CashApp/Zelle for business are reportable. Barter is taxable at fair market value |
| CATEGORIZE | Expense is ambiguous -- could be personal or business | Adjust -- apply the "would you buy this if you didn't have the business?" test. If yes, it's personal. If no, it's business. If maybe, split it with a reasonable percentage |
| CATEGORIZE | User paid for everything in cash with no receipts | Adjust -- IRS accepts bank withdrawal records, calendar entries showing business activity, and written contemporaneous logs. Create a reconstruction log for cash expenses with dates and amounts |
| DEDUCTION DIG | User's home office is also used as a guest room | Flag -- the "exclusive use" test means a room that doubles as anything else doesn't qualify. If the desk area is a dedicated section of a room, the square footage of just that area may still qualify |
| STATEMENTS | Net loss on the business for multiple years | Advise -- the IRS hobby loss rule (Section 183) says if you show a loss 3 out of 5 years, they may reclassify your business as a hobby and disallow deductions. Document profit intent: business plan, marketing efforts, professional development |
| SYSTEM | User insists they'll never keep up with weekly tracking | Adjust -- fall back to monthly tracking (first Saturday of each month, 30-45 minutes) or quarterly tracking (before estimated tax deadlines). Worse than weekly but infinitely better than annual panic |

## State Persistence
- Categorized transaction history (builds a pattern library so recurring expenses auto-categorize in future periods)
- Deduction checklist by business type (which deductions apply and typical amounts, refined over multiple tax years)
- Quarterly estimated tax payment history (what was owed vs. what was paid, whether adjustments are needed)
- Year-over-year P&L comparison (is revenue growing? are expenses proportional? is net profit improving?)
- IRS category mappings for the user's specific vendors (once you know "Adobe = Software Subscription = Other Expenses," it never needs re-categorizing)
- Tax deadline history (which deadlines were met vs. missed, penalty amounts if any)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
