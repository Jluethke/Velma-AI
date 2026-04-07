# Home Buying Decision Framework

Walks you through the entire home-buying decision from "can I even afford this?" to "here's my offer strategy." No realtor sales pitches -- just the math, the market reality, and the moves that protect you from the biggest financial mistake most people make. Covers affordability (the real number, not what the bank says you qualify for), neighborhood research beyond the listing photos, and how to structure an offer that doesn't leave money on the table or get you into a bidding war you'll regret.

## Execution Pattern: Phase Pipeline

```
PHASE 1: AFFORDABILITY  --> Calculate what you can actually afford (not the bank's fantasy number)
PHASE 2: MARKET SCAN    --> Analyze the local market to know if you're buying in a trap or an opportunity
PHASE 3: NEIGHBORHOOD   --> Research the area like you're going to live there (because you are)
PHASE 4: PROPERTY EVAL  --> Score specific properties against your actual needs and budget
PHASE 5: OFFER STRATEGY --> Build an offer that's competitive without being reckless
```

## Inputs
- financial_profile: object -- Gross and net annual income, monthly debt payments (car, student loans, credit cards), current savings/investments, credit score range, any expected income changes in the next 2-3 years
- down_payment: object -- Cash available for down payment, source of funds (savings, gift, 401k loan), whether more can be saved and timeline
- location_preferences: array -- Target cities/neighborhoods, commute requirements, school district needs, dealbreakers (flood zone, HOA, highway noise)
- property_requirements: object -- Bedrooms, bathrooms, square footage range, must-haves vs. nice-to-haves, property type (single family, condo, townhouse)
- timeline: object -- When you want to buy, lease expiration or other hard deadlines, flexibility to wait if market is unfavorable

## Outputs
- affordability_report: object -- True affordable price range, monthly payment breakdown (PITI + maintenance), stress-test scenarios (job loss, rate increase, major repair)
- market_analysis: object -- Local market conditions (buyer's vs. seller's), price trends, days on market, inventory levels, seasonal patterns
- neighborhood_scorecard: object -- Rated comparison of target neighborhoods on safety, schools, appreciation, commute, lifestyle fit
- property_shortlist: array -- Scored properties with pros, cons, and red flags for each
- offer_playbook: object -- Recommended offer price, contingencies to include/waive, escalation strategy, timeline, and walkaway number

## Execution

### Phase 1: AFFORDABILITY
**Entry criteria:** Income, debts, savings, and credit score range provided.
**Actions:**
1. Calculate the bank-approved number using standard DTI ratios: front-end (housing payment / gross income) max 28%, back-end (all debt / gross income) max 36%. This is the ceiling the bank will let you hit -- it is NOT the number you should target.
2. Calculate the real affordable number. Take monthly net income (after tax, after 401k). Subtract all existing debt payments. Subtract actual monthly living costs (groceries, utilities, insurance, transportation, subscriptions, etc.). The housing payment should be no more than 60% of what's left -- the other 40% is your margin for life.
3. Build the full monthly payment picture: principal + interest (use current 30-year rate), property taxes (estimate 1-2% of home value annually, varies wildly by state), homeowner's insurance (estimate $100-250/month), PMI if putting less than 20% down (estimate 0.5-1% of loan annually), HOA if applicable. Add them all up -- this is PITI, the real monthly number.
4. Add maintenance reserves: budget 1% of home value per year for maintenance ($300k house = $250/month). New construction can go lower (0.5%), anything over 30 years old should go higher (1.5%). This is the cost people forget and then panic about.
5. Stress-test the number: Can you afford the payment if rates go up 2% at refinance? Can you cover 3 months of payments from savings if you lose your job? Can you absorb a $10k emergency repair (roof, HVAC, foundation)? If any answer is no, lower the target price.
6. Factor in closing costs: budget 2-5% of purchase price for closing costs (lender fees, title insurance, appraisal, inspection, escrow). This comes out of your cash, separate from the down payment.

**Output:** True affordable price range with floor and ceiling, complete monthly cost breakdown, stress-test results, and cash needed at closing.
**Quality gate:** Monthly payment uses actual current interest rates. All five components of PITI are included. Stress test covers job loss, rate increase, and emergency repair scenarios. Closing costs are budgeted separately from down payment.

### Phase 2: MARKET SCAN
**Entry criteria:** Affordability range established and target locations identified.
**Actions:**
1. Pull current market indicators for each target area: median sale price, price per square foot, median days on market, list-to-sale price ratio, months of inventory (under 3 = seller's market, 3-6 = balanced, over 6 = buyer's market).
2. Analyze price trends over the last 12 months and 5 years. Is the market appreciating, flat, or correcting? A market that jumped 30% in 2 years and is now flat might be at the top. A market that's been climbing 3-5% annually is healthier.
3. Check interest rate trajectory. Rising rates mean less competition (fewer qualified buyers) but higher monthly payments. Falling rates mean you can refinance later but expect more bidding wars now.
4. Identify seasonal patterns. In most markets, inventory peaks in spring/summer and prices are highest. Fall/winter often has less competition and more motivated sellers. The best deals are often between Thanksgiving and February.
5. Look for red flags: new construction flooding the market (can suppress resale values), major employer leaving the area, rising crime stats, school rating declines, pending zoning changes that could put a warehouse next to your dream home.
6. Compare your affordable range to what's actually available. If your budget is $350k but the median in your target area is $500k, you need to expand your search area or adjust expectations -- not stretch the budget.

**Output:** Market conditions summary for each target area, price trend analysis, seasonal buying recommendations, red flags, and reality check on budget vs. available inventory.
**Quality gate:** Data is current (within last 30 days). Both short-term and long-term trends are analyzed. At least one red flag check is performed per target area. Budget-to-market fit is explicitly stated.

### Phase 3: NEIGHBORHOOD
**Entry criteria:** Market analysis complete, target areas narrowed to 2-4 neighborhoods.
**Actions:**
1. Score each neighborhood on commute: actual drive time during rush hour (not Google Maps at 2am), public transit options and reliability, commute cost (gas, tolls, parking, transit pass). A cheap house with an expensive commute isn't cheap.
2. Check school ratings if relevant -- but go deeper than the number. Look at test score trends (improving or declining?), student-to-teacher ratio, extracurricular offerings, and whether the district boundary might be redrawn.
3. Evaluate safety using actual crime data (not vibes). Check the local PD's crime map, compare property crime and violent crime rates to city averages. Drive the neighborhood at night, not just during an open house on a sunny Saturday.
4. Assess lifestyle fit: walkability score, proximity to grocery stores and medical care, restaurants and entertainment, parks and recreation, house of worship if relevant. Visit on a weekday and a weekend to see what daily life actually looks like.
5. Research future development: check the city planning department for approved developments, zoning changes, new roads, or commercial projects. That empty lot next door could become a strip mall or a park -- and it changes your property value dramatically.
6. Talk to residents. Seriously. Knock on a few doors or visit a local coffee shop and ask people what they like and don't like about living there. Neighbors will tell you things no listing agent ever will -- flooding, noise, problem properties, parking wars.

**Output:** Neighborhood comparison scorecard with ratings for commute, schools, safety, lifestyle, future development, and resident feedback. Top 1-2 recommended neighborhoods.
**Quality gate:** Each neighborhood scored on at least 5 factors. Commute is based on rush-hour reality. At least one on-the-ground visit recommendation is included. Future development is checked.

### Phase 4: PROPERTY EVAL
**Entry criteria:** Target neighborhoods selected, specific properties identified.
**Actions:**
1. Score each property against the must-have list. Anything missing a must-have is immediately dropped -- no exceptions, no "we'll make it work." Must-haves exist for a reason. Nice-to-haves get points but don't disqualify.
2. Calculate the true cost of each property: purchase price + estimated repairs/updates + closing costs + monthly carrying cost x 12. A $300k house that needs a $40k kitchen and $15k roof is a $355k house with $300k house comps.
3. Get a pre-inspection read (before making an offer if possible): age of roof, HVAC, water heater, and electrical panel. If any are near end of life, budget for replacement. Roof: $8-15k. HVAC: $5-12k. Water heater: $1-3k. Electrical panel: $2-4k.
4. Check the property's history: how long has it been listed, any price reductions (signals motivation), previous sale price and date (reveals if seller is trying to flip), days on market vs. area average.
5. Look for red flags that inspections might miss: evidence of water damage (stains on ceilings, musty basement smell), foundation cracks wider than 1/4 inch, DIY electrical or plumbing work, additions that may not be permitted, grading that slopes toward the house.
6. Estimate 5-year total cost of ownership and compare across properties. Include purchase, closing, repairs, monthly carrying costs, and projected appreciation (use conservative 2-3% annually, not the "this market is hot" number).

**Output:** Property scorecard for each candidate with must-have compliance, true cost calculation, red flag assessment, and 5-year cost of ownership comparison.
**Quality gate:** No property with a missing must-have advances. True cost includes repairs and updates. At least 3 red flag checks performed per property. 5-year projection uses conservative appreciation.

### Phase 5: OFFER STRATEGY
**Entry criteria:** Top 1-2 properties selected with full evaluation complete.
**Actions:**
1. Determine starting offer price based on market conditions: in a buyer's market, start 5-10% below asking. In balanced, start at or slightly below asking. In a seller's market, decide your max before writing the offer and don't exceed it in the heat of the moment.
2. Set your walkaway number -- the absolute maximum you'll pay, including any escalation. Write it down. Tell your agent. This number should not exceed your affordability ceiling from Phase 1 under any circumstances.
3. Structure contingencies strategically: inspection contingency (never waive this -- ever), financing contingency (protect yourself unless you're cash), appraisal contingency (waiving this means you cover the gap in cash if the home appraises low). In competitive markets, shorten contingency timelines instead of waiving them.
4. Prepare escalation clause if competing offers are expected: "We offer $X, and will beat any competing offer by $Y up to a maximum of $Z." Only use this when you know there are multiple offers and you've set a firm ceiling.
5. Identify non-price sweeteners that cost you little but appeal to sellers: flexible closing date, leaseback option if they need time to move, large earnest money deposit (shows seriousness), personal letter (works in some markets, illegal to consider in others -- check local rules).
6. Plan for the three scenarios: (a) offer accepted -- schedule inspection within 5-7 days, lock rate immediately, start insurance shopping, (b) offer countered -- know which terms you'll flex on and which are non-negotiable, (c) offer rejected -- move to backup property, don't chase a deal out of emotion.

**Output:** Complete offer package with starting price, escalation strategy, contingency recommendations, walkaway number, and action plans for acceptance, counter, and rejection scenarios.
**Quality gate:** Offer price does not exceed affordability ceiling. Inspection contingency is included. Walkaway number is set before offer is submitted. All three outcome scenarios are planned for.

## Exit Criteria
Done when: (1) true affordability range is calculated with stress testing, (2) market conditions are analyzed for target areas, (3) neighborhoods are scored and compared, (4) specific properties are evaluated with true cost calculations, (5) offer strategy is complete with walkaway number and contingency plan.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| AFFORDABILITY | Bank pre-approval is much higher than real affordable number | Flag -- explain the difference between "qualified" and "comfortable." Show the monthly payment at the bank's number vs. your number. The bank doesn't care if you eat ramen. |
| AFFORDABILITY | Down payment is less than 5% | Adjust -- explore FHA (3.5% down), VA (0% if eligible), USDA (0% in qualifying areas), or down payment assistance programs. Factor PMI into monthly cost. |
| MARKET SCAN | Target area is far beyond budget | Adjust -- identify adjacent neighborhoods, up-and-coming areas within 15-20 minutes, or suggest waiting and saving if market conditions favor patience |
| NEIGHBORHOOD | Limited data available for rural or new development areas | Adjust -- rely more heavily on in-person visits, county records, and conversations with locals. Use broader area statistics as proxy. |
| PROPERTY EVAL | Dream house needs $50k+ in work | Escalate -- recalculate as total cost. If it still fits the budget, proceed with contractor estimates before offer. If not, walk away no matter how much you love the kitchen layout. |
| OFFER STRATEGY | Multiple offer situation driving price above walkaway | Hold the line -- your walkaway number exists for a reason. Another house will come. Overpaying by $30k feels small until you see 30 years of interest on it. |

## State Persistence
- Affordability calculations (income, debts, monthly payment ceiling, stress-test results)
- Market data snapshots (for tracking trends over time if the search extends months)
- Neighborhood scorecards (for revisiting if priorities shift)
- Property evaluation history (every property considered, scored, and why it was kept or dropped)
- Offer history (what was offered, what happened, lessons for next offer)
- Rate lock status and pre-approval expiration dates

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
