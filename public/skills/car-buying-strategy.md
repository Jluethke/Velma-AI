# Car Buying Strategy

Takes you from "I need a car" to "I got a fair deal" without the stomach-churning dealership games. Covers the new-vs-used decision with actual math (not feelings), calculates the true cost of ownership so a "cheap" car doesn't bankrupt you in repairs, gives you negotiation scripts that work, and shows you how to structure financing so you're not paying $8,000 in interest on a depreciating asset. Built for people who'd rather get a root canal than haggle with a salesperson.

## Execution Pattern: Phase Pipeline

```
PHASE 1: NEEDS CHECK    --> Figure out what you actually need (not what the ad made you want)
PHASE 2: NEW VS. USED   --> Run the real math on buying new, certified pre-owned, or used
PHASE 3: TRUE COST      --> Calculate what this car actually costs over 5 years (it's more than the sticker)
PHASE 4: NEGOTIATION    --> Scripts and tactics for getting a fair price without the games
PHASE 5: FINANCING      --> Structure the deal so you're not underwater from day one
```

## Inputs
- transportation_needs: object -- Daily commute distance, passengers (kids, pets, carpool), cargo needs, driving conditions (city, highway, snow, off-road), must-haves (AWD, towing, fuel efficiency, safety ratings)
- budget: object -- Maximum monthly payment you're comfortable with, total cash available for down payment, trade-in vehicle details (year, make, model, mileage, condition), credit score range
- preferences: object -- Vehicle types interested in (sedan, SUV, truck, hybrid/EV), brands you trust or avoid, features that matter (tech, comfort, reliability rankings), color and aesthetic preferences
- timeline: object -- How soon you need the vehicle, flexibility to wait for deals, current vehicle situation (dying, lease ending, totaled, just shopping)
- priorities: object -- Rank these: lowest monthly payment, lowest total cost, best reliability, newest technology, best resale value, lowest environmental impact

## Outputs
- vehicle_shortlist: array -- 3-5 recommended vehicles with specs, pricing, and why each fits your needs
- cost_comparison: object -- 5-year total cost of ownership for each option (purchase, fuel, insurance, maintenance, depreciation)
- negotiation_playbook: object -- Target price, opening offer, scripts for common dealer tactics, walkaway points
- financing_plan: object -- Recommended loan structure, pre-approval strategy, dealer financing vs. outside lender comparison
- purchase_timeline: object -- Step-by-step plan from research to driving off the lot

## Execution

### Phase 1: NEEDS CHECK
**Entry criteria:** Transportation needs and basic budget provided.
**Actions:**
1. Separate needs from wants. You need reliable transportation that fits your family safely. You want a panoramic sunroof and premium sound system. Write both lists, but the needs list drives the decision. A car that checks every want but fails on cargo space for your stroller is the wrong car.
2. Calculate your required specs from your actual life: commute of 60 miles/day means fuel efficiency matters more than horsepower. Two kids in car seats means the back seat needs to be wide enough for two bases with room to buckle. Snowy winters mean AWD or at minimum good snow tires, not a rear-wheel-drive sports car.
3. Set a realistic budget range. The all-in monthly cost of a car is NOT just the payment -- it's payment + insurance + fuel + maintenance. A $400/month payment on a BMW becomes $700/month all-in. A $350/month payment on a Honda Civic might be $500 all-in. Budget for the all-in number.
4. Check if you even need to buy. If your current car is reliable and paid off, spending $500/month on a new one costs $30,000 over 5 years. That's real money. A $2,000 repair on a paid-off car is almost always cheaper than buying.
5. Identify your dealbreakers: minimum safety rating (IIHS Top Safety Pick), maximum acceptable mileage for used, no salvage titles, specific reliability ratings (Consumer Reports, J.D. Power), must have backup camera, etc.

**Output:** Needs list, wants list, all-in monthly budget, vehicle spec requirements, and dealbreaker criteria.
**Quality gate:** Budget includes insurance, fuel, and maintenance -- not just the car payment. Needs and wants are separated. At least 3 dealbreakers are defined.

### Phase 2: NEW VS. USED
**Entry criteria:** Vehicle requirements and budget established.
**Actions:**
1. Run the depreciation math: a new car loses 20-30% of its value in the first year and about 15% per year after that. A $40,000 new car is worth roughly $28,000 after one year and $17,000 after three years. You're paying $23,000 for three years of driving. A 3-year-old version of the same car bought at $17,000 might be worth $10,000 three years later -- $7,000 for three years of driving. That's the new vs. used math in a nutshell.
2. Factor in the exceptions: some vehicles hold value exceptionally well (Toyota Tacoma, Jeep Wrangler, Honda Civic). Buying these used saves less because used prices stay high. Some vehicles depreciate brutally (luxury sedans, first-model-year redesigns). Buying these used is where the real deals are.
3. Evaluate certified pre-owned (CPO): manufacturer-backed warranty on a used vehicle. Typically costs $1,000-3,000 more than the same non-certified used car but comes with warranty coverage that can be worth it, especially on German or luxury brands where a single repair can cost $2,000+.
4. Consider the EV/hybrid question: if your commute is under 40 miles each way and you can charge at home, an EV dramatically reduces fuel costs ($40-60/month in electricity vs. $150-300 in gas). But factor in charging infrastructure, battery degradation on used EVs (check battery health report), and higher insurance costs.
5. Build a shortlist of 3-5 specific vehicles: include make, model, year, target mileage range, and estimated purchase price. Use KBB, Edmunds, and actual local listings (not just national averages) to set realistic price expectations.

**Output:** New vs. used recommendation with supporting math, CPO evaluation, EV/hybrid consideration, and shortlist of 3-5 specific vehicles with target prices.
**Quality gate:** Depreciation is calculated with actual numbers, not hand-waving. At least one new, one used, and one CPO option are compared (if applicable). Shortlist has specific target prices based on current market data.

### Phase 3: TRUE COST
**Entry criteria:** Vehicle shortlist established.
**Actions:**
1. Calculate 5-year total cost of ownership for each shortlisted vehicle:
   - Purchase price (after negotiation target -- we'll get there)
   - Financing cost (total interest paid over loan term)
   - Insurance (get actual quotes -- a Mustang GT and a Camry cost wildly different amounts to insure, especially for under-25 drivers)
   - Fuel (annual miles / MPG x price per gallon, or electricity cost for EVs)
   - Maintenance (oil changes, tires, brakes, filters, fluids -- Edmunds True Cost to Own is a solid baseline)
   - Repairs (out-of-warranty repairs -- Japanese brands average $400-600/year, German brands average $800-1,500/year, American brands are in between)
   - Depreciation (estimated value at end of 5 years subtracted from purchase price)
2. Compare the 5-year totals side by side. The "cheap" used car that needs $3,000 in repairs annually might cost more than the reliable new car with a warranty. The "expensive" hybrid might be cheaper than the gas model when you factor in $1,800/year in fuel savings.
3. Calculate cost per mile: total 5-year cost / total miles driven. This is the great equalizer -- it tells you what each mile actually costs you. Anything under $0.50/mile is good. Over $0.75/mile and you're spending serious money on transportation.
4. Factor in opportunity cost: a $10,000 down payment invested instead would grow to roughly $14,000 in 5 years at market average returns. That's a $4,000 hidden cost of a large down payment. (This doesn't mean don't put money down -- it means understand what it's costing you.)
5. Check insurance costs specifically: get quotes for each shortlisted vehicle before deciding. Insurance varies dramatically by vehicle, and a $50/month difference is $3,000 over 5 years. Sports cars, luxury vehicles, and cars commonly stolen (Kia, Hyundai recently) cost more.

**Output:** 5-year total cost of ownership comparison table, cost per mile for each vehicle, insurance comparison, and revised ranking based on true cost rather than sticker price.
**Quality gate:** All six cost categories are included for each vehicle. Insurance is based on actual quotes (not estimates). Cost per mile is calculated. True cost ranking may differ from sticker price ranking.

### Phase 4: NEGOTIATION
**Entry criteria:** Top 1-2 vehicles selected based on true cost analysis.
**Actions:**
1. Research the fair price before stepping foot in a dealership: check KBB Fair Purchase Price, Edmunds True Market Value, and TrueCar. Cross-reference with actual local listings. Your target price is the average of these sources, not the asking price.
2. Get pre-approved for financing BEFORE going to the dealer. Your bank or credit union rate is your baseline. When the dealer tries to beat it (and they might -- they get volume discounts from lenders), you'll know if their offer is actually better. Never let them run your credit without a pre-approval in your pocket.
3. Script for the most common dealer tactics:
   - "What monthly payment are you looking for?" -- NEVER answer this. Say "I'm focused on the total out-the-door price. What's your best price on this vehicle?"
   - "Let me talk to my manager." -- This is theater. They already know the floor price. Be patient, don't fill the silence.
   - "We're losing money at this price." -- They're not. Invoice price is available online. They also get holdback, dealer incentives, and volume bonuses.
   - The four-square worksheet -- They'll try to jumble price, trade-in, down payment, and monthly payment together. Negotiate each one separately. Price first, then trade-in, then financing.
4. Negotiate the out-the-door price (OTD): this includes the vehicle price, tax, title, registration, and dealer fees. Ask for the OTD price in writing. Refuse any "dealer prep," "documentation fees" over $200, "paint protection," or "VIN etching" -- these are pure profit add-ons.
5. If trading in: get a Carvana, CarMax, and KBB instant offer before visiting the dealer. These are your floor for the trade-in value. If the dealer won't match or beat them, sell privately or to Carvana.
6. Be willing to walk away. This is the single most powerful negotiation tool. If the price isn't right, say "I appreciate your time, but that's not going to work for me" and leave. Half the time, they'll call within 24 hours with a better offer.

**Output:** Target price for each vehicle, pre-negotiation checklist, scripts for common dealer tactics, OTD price template, trade-in value floor, and walkaway strategy.
**Quality gate:** Target price is based on at least 2 independent pricing sources. Monthly payment trap is addressed. Trade-in has an independent valuation. At least 3 dealer tactics are scripted.

### Phase 5: FINANCING
**Entry criteria:** Negotiated price agreed or target established.
**Actions:**
1. Compare financing options:
   - Credit union (typically lowest rates, 24-48 hour approval)
   - Bank (convenient if you have a relationship, rates are competitive)
   - Dealer financing (sometimes offers 0% or low APR promotions on new cars -- this is legitimate and can be the best option, but only on the manufacturer's promotional rate, not the dealer's "we found you a great rate" markup)
   - Online lenders (can be competitive, check reviews)
2. Choose the right loan term: 36 months has the lowest total cost but highest payment. 60 months is the sweet spot for most people. 72+ months means you're buying more car than you can afford -- the interest cost is brutal and you'll be underwater for years. Rule: if you can't afford the payment on a 60-month loan, the car is too expensive.
3. Optimize the down payment: put enough down to avoid being underwater (owing more than the car is worth). For new cars, that means at least 20%. For used, at least 10%. Less than this and you're at risk of owing more than the car is worth from day one, which is a disaster if the car is totaled or stolen.
4. Evaluate GAP insurance: if you're putting less than 20% down, GAP insurance covers the difference between what you owe and what the car is worth if it's totaled. Your credit union often sells it for $200-400 flat. The dealer will charge $800-1,500. Don't buy it at the dealer.
5. Decline the F&I (Finance and Insurance) office add-ons: extended warranties (buy them later if you want, for half the price, from a third party), fabric protection, paint sealant, wheel-and-tire packages, prepaid maintenance plans. The F&I office is the most profitable room in the dealership. Everything they sell has a 50-300% markup.
6. Final check before signing: verify the interest rate matches your pre-approval or the agreed dealer rate, confirm the loan term is what you agreed to (they sometimes quietly add months), check that the price on the contract matches the negotiated OTD price, and make sure no add-ons appeared that you didn't agree to.

**Output:** Financing comparison with total interest costs, recommended loan structure, down payment guidance, F&I add-on list (with what to decline), and contract review checklist.
**Quality gate:** At least 2 financing sources are compared. Total interest cost is calculated, not just the monthly payment. Loan term does not exceed 60 months for used vehicles. Contract review checklist covers rate, term, price, and add-ons.

## Exit Criteria
Done when: (1) vehicle needs are defined and separated from wants, (2) new vs. used decision is supported by depreciation math, (3) 5-year true cost is calculated for top options, (4) negotiation strategy with scripts is ready, (5) financing is structured to avoid being underwater.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| NEEDS CHECK | Budget doesn't support any vehicle that meets the needs | Adjust -- explore older model years, expand search radius, consider private-party sales, or delay purchase and save for a larger down payment |
| NEW VS. USED | Used car market is inflated (prices near new) | Adjust -- when used prices are within 10-15% of new, buying new with a warranty often makes more sense. Check manufacturer incentives and loyalty programs. |
| TRUE COST | Insurance quotes are shockingly high | Adjust -- this is a real signal. Either choose a different vehicle, bundle with other policies, increase deductible, or shop more carriers. Don't ignore this cost. |
| NEGOTIATION | Dealer won't budge on price | Walk away. Seriously. There is always another dealer, and internet sales departments at competing dealers will compete for your business via email. |
| FINANCING | Credit score is too low for competitive rates | Adjust -- delay purchase 6-12 months, pay down existing debt, dispute any errors on credit report, consider a larger down payment to offset rate, or explore credit union membership (they're more flexible). |
| FINANCING | Buyer is underwater on current car | Escalate -- rolling negative equity into a new loan is a financial trap. Options: keep driving current car until equity is positive, sell privately to minimize the gap, or pay the difference in cash. Never roll it in. |

## State Persistence
- Vehicle research and comparison data (shortlist with pricing, features, and ratings)
- Negotiation records (offers made, counteroffers, dealer contacts)
- Financing pre-approvals (rates, terms, expiration dates)
- True cost calculations (for comparing to actual ownership costs over time)
- Trade-in valuations with dates (values change monthly)
- Maintenance schedule for purchased vehicle (feeding into car-maintenance-schedule skill)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
