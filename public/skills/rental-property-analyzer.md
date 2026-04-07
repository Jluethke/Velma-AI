# Rental Property Analyzer

Evaluates a rental property investment from every angle -- cash flow, tenant headaches, maintenance costs, and tax implications -- so you know if that "great deal" is actually great or just someone else's money pit dressed up with new paint. Built for people considering their first (or next) investment property who want the real numbers, not the guru-on-YouTube numbers that conveniently leave out vacancy, repairs, and the 2am toilet call.

## Execution Pattern: Phase Pipeline

```
PHASE 1: CASH FLOW       --> Run the real numbers on income vs. expenses (all of them)
PHASE 2: TENANT STRATEGY  --> Build a screening system that protects you and stays legal
PHASE 3: MAINTENANCE PLAN --> Budget for everything that will break (because it will)
PHASE 4: TAX OPTIMIZATION --> Maximize deductions and structure ownership correctly
PHASE 5: GO/NO-GO        --> Make the final decision with eyes wide open
```

## Inputs
- property_details: object -- Purchase price, property type (single family, duplex, multi-unit, condo), age of property, bedrooms/bathrooms, square footage, current condition, any needed repairs
- financing: object -- Down payment amount, loan terms (rate, length, type), closing costs estimate, whether using conventional, FHA, or portfolio loan
- rental_market: object -- Target monthly rent (or range), local vacancy rate, comparable rents in the area, tenant demand indicators (college town, military base, job center)
- investor_profile: object -- Other income sources, tax bracket, investment goals (cash flow vs. appreciation vs. both), time available for management, distance from property
- current_portfolio: object -- (Optional) Other properties owned, total debt-to-income, available reserves, property management experience

## Outputs
- cash_flow_projection: object -- Monthly and annual cash flow with all expenses itemized, break-even analysis, ROI calculations (cash-on-cash, cap rate, total return)
- tenant_screening_system: object -- Application criteria, screening checklist, red flags to watch for, fair housing compliance notes
- maintenance_budget: object -- Year 1 and ongoing annual maintenance budget, capital expenditure reserve schedule, emergency fund target
- tax_strategy: object -- Deductible expenses list, depreciation schedule, entity structure recommendation, estimated tax savings
- investment_verdict: object -- Go/no-go recommendation with supporting data, risk assessment, and comparison to alternative investments

## Execution

### Phase 1: CASH FLOW
**Entry criteria:** Property details, financing terms, and rental market data provided.
**Actions:**
1. Calculate gross rental income: monthly rent x 12. Then subtract a vacancy factor -- use 8% for average markets, 5% for high-demand areas, 10-12% for seasonal or college towns. If you're using 0% vacancy, you're lying to yourself.
2. List every operating expense with monthly amounts:
   - Property taxes (check actual tax records, not estimates)
   - Insurance (landlord policy, not homeowner -- typically 15-25% more)
   - Property management (10% of rent if hiring, $0 if self-managing but honestly value your time)
   - Maintenance and repairs (budget 10% of gross rent minimum)
   - Capital expenditure reserves (roof, HVAC, appliances -- another 5-8% of rent set aside monthly)
   - Utilities you'll cover (water, sewer, trash, lawn care -- depends on lease structure)
   - HOA fees if applicable
   - Vacancy cost (the months between tenants -- not just lost rent but also turnover costs: cleaning, painting, listing)
3. Calculate Net Operating Income (NOI): gross rent minus vacancy minus all operating expenses (but NOT the mortgage payment). This is the property's performance independent of your financing.
4. Calculate cash flow: NOI minus mortgage payment (principal + interest). This is what hits your bank account each month. If it's negative, this property loses money every month regardless of appreciation hopes.
5. Run the key metrics:
   - Cash-on-cash return: annual cash flow / total cash invested (down payment + closing + initial repairs). Target: 8%+ for cash flow investors.
   - Cap rate: NOI / purchase price. Compare to area average. Below 5% in most markets is thin.
   - 1% rule quick check: does monthly rent equal at least 1% of purchase price? ($200k house should rent for $2,000+). Not a hard rule, but below 0.7% is almost impossible to cash flow.
6. Project 5-year returns including: cumulative cash flow, mortgage principal paydown (equity you're building), estimated appreciation (use conservative 2-3%), and total return on invested capital.

**Output:** Complete cash flow statement (monthly and annual), all key metrics calculated, 5-year projection, and honest assessment of whether the numbers work.
**Quality gate:** Vacancy rate is included (never 0%). Maintenance AND capex reserves are budgeted separately. Cash-on-cash return is calculated on actual cash invested, not purchase price. All five expense categories are addressed.

### Phase 2: TENANT STRATEGY
**Entry criteria:** Cash flow analysis shows the property can work (or is close).
**Actions:**
1. Define ideal tenant profile based on property and market: income requirement (typically 3x monthly rent), credit score minimum (620-650 for most markets, adjust for local conditions), rental history length, employment stability.
2. Build a screening checklist that's consistent and legally compliant:
   - Credit check (look for patterns, not just the score -- medical debt is different from eviction judgments)
   - Background check (criminal history policies must comply with local fair housing laws -- blanket bans are illegal in many jurisdictions)
   - Employment verification (call the employer directly, don't just take a pay stub)
   - Previous landlord references (call the landlord before the current one -- the current landlord might lie to get rid of a bad tenant)
   - Income verification (pay stubs, tax returns for self-employed, bank statements)
3. Know the fair housing rules cold: you cannot discriminate based on race, color, religion, national origin, sex, familial status, or disability (federal). Many states and cities add additional protected classes. "I had a bad feeling" is not a legal reason to deny.
4. Set up a professional application process: use a standardized application form, charge a reasonable application fee (check state limits), document every decision with objective criteria, keep records for at least 3 years.
5. Develop a lease that protects you: late payment penalties and grace periods, maintenance request procedures, property access notification requirements (typically 24-48 hours), lease violation process, renewal terms and rent increase notice periods. Use a state-specific lease template reviewed by a local attorney.
6. Plan for tenant turnover: budget 1-2 months of vacancy per turnover, $500-2,000 for unit refresh (cleaning, paint, minor repairs), and have your listing ready to go before the current tenant moves out.

**Output:** Tenant screening criteria, application process, fair housing compliance notes, lease essentials checklist, and turnover budget.
**Quality gate:** Screening criteria are objective and measurable. Fair housing compliance is addressed. Lease covers the five essential protective clauses. Turnover costs are budgeted.

### Phase 3: MAINTENANCE PLAN
**Entry criteria:** Property details and condition assessment available.
**Actions:**
1. Inventory every major system and estimate remaining useful life:
   - Roof (asphalt shingle: 20-25 years, metal: 40-50 years) -- replacement: $8-15k
   - HVAC (15-20 years) -- replacement: $5-12k
   - Water heater (8-12 years, tankless: 20 years) -- replacement: $1-3k
   - Appliances (10-15 years each) -- budget $500-2k per appliance
   - Plumbing (copper: 50+ years, galvanized: 20-50 years, PEX: 40+ years)
   - Electrical panel (if under 100 amps or has Federal Pacific/Zinsco, budget for replacement)
   - Foundation and structure (look for settlement cracks, water intrusion)
2. Create a year-by-year capital expenditure forecast: which systems will need replacement in years 1-5, 5-10, and 10-20. Spread the cost across months as a reserve contribution.
3. Budget for routine maintenance: HVAC servicing twice annually ($150-300), gutter cleaning twice annually ($150-250), lawn care ($100-200/month if not tenant responsibility), pest control quarterly ($100-150), smoke/CO detector batteries annually.
4. Build an emergency fund specifically for the property: target is 3-6 months of mortgage + expenses. A burst pipe at 2am doesn't care about your cash flow projections. Minimum starting reserve: $5,000 per unit.
5. Develop a vendor list before you need one: licensed plumber, electrician, HVAC tech, general handyman, locksmith, cleaning crew. Get quotes now, not during an emergency when you'll pay triple.
6. Set up a maintenance request system: tenants need a clear way to report issues (app, email, phone number), you need a way to track and document all repairs (date, issue, resolution, cost). This protects you legally and helps with tax records.

**Output:** Major system inventory with remaining life estimates, capex reserve schedule, annual routine maintenance budget, emergency fund target, vendor list template, and maintenance tracking system.
**Quality gate:** Every major system has a remaining life estimate. Capex reserves are calculated as monthly contributions. Emergency fund has a specific dollar target. Routine maintenance is scheduled, not reactive.

### Phase 4: TAX OPTIMIZATION
**Entry criteria:** Property financials established, investor tax bracket known.
**Actions:**
1. List every deductible expense (this is where rental properties shine):
   - Mortgage interest (often the biggest deduction in early years)
   - Property taxes
   - Insurance premiums
   - Property management fees
   - Repairs and maintenance (deductible in the year paid)
   - Travel to/from the property for management purposes
   - Professional services (accountant, attorney, property manager)
   - Advertising for tenants
   - Utilities you pay
   - HOA fees
2. Set up depreciation: residential rental property depreciates over 27.5 years. Take the property value (not land -- get the land/building split from the tax assessment or an appraisal), divide by 27.5. This is an annual "paper loss" that reduces your taxable income even though you didn't actually spend the money. On a $250k building value, that's $9,090/year in deductions.
3. Understand the difference between repairs (deductible immediately) and improvements (depreciated over time). Fixing a broken window: repair. Replacing all windows with upgraded ones: improvement. The IRS cares about this distinction and so should you.
4. Evaluate entity structure: sole proprietorship (simplest, least protection), LLC (liability protection, pass-through taxation), S-Corp (potential self-employment tax savings at scale). For most single-property investors, an LLC is the sweet spot. Consult a local attorney -- LLC rules vary significantly by state.
5. Know the passive activity loss rules: rental income is generally "passive" which means losses can only offset other passive income -- unless you qualify as a real estate professional (750+ hours/year) or your AGI is under $100k (up to $25k in losses can offset active income, phases out between $100k-$150k).
6. Plan for the exit: when you sell, you'll owe capital gains tax plus depreciation recapture (25% on all the depreciation you claimed). A 1031 exchange lets you defer all of this by reinvesting into another property. Know this before you buy, not when you sell.

**Output:** Complete deductible expense list with estimated annual amounts, depreciation schedule, repair vs. improvement guidelines, entity structure recommendation, passive loss rule implications, and exit tax planning notes.
**Quality gate:** Depreciation uses building value only (land excluded). Repair vs. improvement distinction is explained. Passive activity loss limitations are addressed for the investor's specific income level. Exit strategy includes 1031 exchange consideration.

### Phase 5: GO/NO-GO
**Entry criteria:** All previous phases complete.
**Actions:**
1. Build the investment summary scorecard:
   - Cash-on-cash return: is it above your minimum threshold (8%+ for cash flow focus, 5%+ if also banking on appreciation)?
   - Monthly cash flow: positive after ALL expenses including reserves?
   - Total 5-year projected return: how does it compare to just putting the money in an index fund (average 7-10% annually with zero effort)?
   - Debt coverage ratio: NOI / annual mortgage payment should be above 1.2 (meaning income covers the mortgage with 20% buffer).
2. Assess the risk factors:
   - Market risk: is the area dependent on a single employer or industry?
   - Tenant risk: is the pool deep enough to avoid extended vacancies?
   - Maintenance risk: is the property old enough that multiple systems could fail simultaneously?
   - Regulatory risk: is the local government tenant-friendly to the point where evictions take 6+ months?
   - Personal risk: do you have the time, proximity, and temperament for landlording?
3. Compare to alternatives: what would this same capital earn in the stock market, a REIT, a syndication deal, or simply paying down your primary mortgage? If the rental barely beats a savings account after accounting for your time, it's not worth it.
4. Set the decision criteria: the property should clear at least 3 of these 5 bars -- positive monthly cash flow from day 1, cash-on-cash return above 8%, located in a market with population/job growth, no major capital expenditures needed in years 1-3, and manageable from your current location/schedule.
5. If it's a go: outline the next steps (make offer, schedule inspection, line up financing, set up LLC, open property bank account). If it's a no-go: document why so you can quickly evaluate the next deal against the same criteria.

**Output:** Investment scorecard, risk assessment, alternative investment comparison, go/no-go recommendation with clear reasoning, and next steps.
**Quality gate:** Decision is based on actual calculated returns, not "this feels like a good deal." Risk assessment covers at least 4 categories. Alternative investment comparison is included. Next steps are specific and actionable.

## Exit Criteria
Done when: (1) cash flow projection includes all expenses with vacancy and reserves, (2) tenant screening system is legally compliant and documented, (3) maintenance budget covers routine and capital expenditures, (4) tax strategy is mapped to investor's situation, (5) go/no-go decision is backed by calculated returns and risk assessment.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| CASH FLOW | Property is cash-flow negative even with optimistic assumptions | Flag -- show exactly how much monthly subsidy is needed. Only proceed if appreciation play is strong AND investor can absorb the loss indefinitely. |
| CASH FLOW | Rent estimates are based on Zillow "Zestimates" only | Adjust -- require actual comparable rents from listings, property managers, or Rentometer. Zestimates can be off by 20%+. |
| TENANT STRATEGY | Investor wants to skip screening to fill vacancy fast | Escalate -- a bad tenant costs $5,000-$30,000 in damages, lost rent, and eviction costs. One month of vacancy is cheaper than one bad tenant. |
| MAINTENANCE | Property needs immediate major repairs exceeding reserves | Adjust -- factor repair costs into the purchase price negotiation. If seller won't budge, recalculate all returns with repair costs included. |
| TAX OPTIMIZATION | Investor is already at passive loss limit | Adjust -- focus on maximizing deductions within the passive income bucket, consider real estate professional status if hours qualify. |
| GO/NO-GO | Numbers are borderline -- not clearly good or bad | Default to no. Borderline deals become bad deals when one thing goes wrong. Wait for a deal that's clearly good. |

## State Persistence
- Property financial models (saved for comparison across multiple potential investments)
- Market rent data with dates (to track rent growth over time)
- Maintenance logs and costs (actual vs. budgeted, for refining future estimates)
- Tenant screening records (for legal compliance and pattern recognition)
- Tax deduction tracking (actual expenses by category for tax filing)
- Portfolio-level metrics (total cash flow, total equity, total return across all properties)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
