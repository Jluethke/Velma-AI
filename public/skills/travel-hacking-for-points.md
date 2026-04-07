# Travel Hacking for Points

Shows you how to turn your normal spending into free flights, hotel stays, and airport lounge access without gaming the system in ways that wreck your credit. This isn't about manufactured spending or opening 20 cards -- it's about using the credit card rewards ecosystem strategically so the money you're already spending earns you maximum travel value. Built for people who travel a few times a year and want to stop paying full price for it.

## Execution Pattern: Phase Pipeline

```
PHASE 1: FOUNDATION     --> Assess your credit, spending, and travel goals
PHASE 2: CARD STRATEGY  --> Pick the right cards for your spending and travel patterns
PHASE 3: EARNING ENGINE --> Maximize points on every dollar you already spend
PHASE 4: LOUNGE & STATUS --> Unlock airport lounges and hotel perks without elite status
PHASE 5: REDEMPTION     --> Cash in points at maximum value (not the sucker redemptions)
```

## Inputs
- credit_profile: object -- Credit score range, number of existing cards, recent hard inquiries (last 24 months), oldest account age, any negative marks
- monthly_spending: object -- Breakdown by category: groceries, dining, gas, travel, online shopping, bills/utilities, other. Approximate monthly totals.
- travel_patterns: object -- How often you fly (times per year), preferred airlines, domestic vs. international, typical destinations, hotel preferences (chain loyalty or price-driven), whether you travel solo, couple, or family
- current_rewards: object -- (Optional) Existing points/miles balances, current credit cards and their rewards rates, any hotel or airline loyalty status
- goals: object -- What you want: free flights, hotel stays, lounge access, travel upgrades, or a specific trip you're saving for

## Outputs
- card_recommendations: array -- Specific credit cards to apply for with signup bonuses, annual fee analysis, and application timing
- earning_strategy: object -- Category-by-category plan for maximizing points on existing spending
- lounge_access_plan: object -- How to get into airport lounges with your cards and status
- redemption_playbook: object -- Best ways to use your points with value per point analysis
- annual_review: object -- Yearly card fee vs. value analysis to decide what to keep

## Execution

### Phase 1: FOUNDATION
**Entry criteria:** Credit score, spending breakdown, and travel goals provided.
**Actions:**
1. Assess credit readiness. To play the points game effectively, you need: a credit score above 700 (ideally 740+), no missed payments in the last 12 months, and the discipline to pay your balance in full every month. If you carry a balance, credit card interest (20-30% APR) destroys any rewards value instantly. A 2% cashback card earning $50/month means nothing if you're paying $100/month in interest.
2. Check the 5/24 rule: Chase (one of the most valuable card issuers for travel) will auto-deny you if you've opened 5 or more new credit cards across all banks in the past 24 months. Count your recent new accounts. If you're at 4/24, Chase cards need to be your next applications.
3. Calculate your annual spending by category. This determines which card ecosystems are most valuable for you:
   - Heavy dining and travel spending: Chase Sapphire or Amex Gold territory
   - Heavy grocery spending: Amex Gold (4x points on groceries up to $25k/year) is hard to beat
   - Heavy gas and transit: Cards with rotating categories or flat-rate cards
   - Spread evenly across categories: a 2% flat-rate card might beat a complicated multi-card strategy
4. Define your travel redemption goals with specifics: "I want to fly my family of four to Europe in economy" is a goal. "I want points" is not. Specific goals determine which points currency to focus on and what your target balance needs to be.
5. Calculate the minimum point value you'll accept for redemptions. Cash back = 1 cent per point (cpp). Airline redemptions average 1.5-3 cpp. Hotel redemptions average 0.5-1.5 cpp. Business/first class international can hit 5-15 cpp. Your strategy depends on what kind of traveler you are.

**Output:** Credit readiness assessment, 5/24 status, annual spending by category, specific travel redemption goals, and minimum acceptable point value.
**Quality gate:** Credit score is verified as sufficient for premium cards. Monthly spending is categorized (not just a total). At least one specific travel goal is defined. 5/24 status is calculated if Chase cards are in consideration.

### Phase 2: CARD STRATEGY
**Entry criteria:** Foundation assessment complete.
**Actions:**
1. Identify the optimal first card based on your profile:
   - **New to points (score 740+):** Chase Sapphire Preferred (80-100k point signup bonus, $95 annual fee, points transfer to airlines and hotels). This is the consensus "first travel card" for good reason.
   - **Heavy grocery spender:** Amex Gold (60-90k point signup bonus, $250 annual fee offset by $120 dining credit + $120 Uber credit, 4x on groceries and dining)
   - **Want lounge access now:** Amex Platinum or Capital One Venture X (both come with Priority Pass lounge access, but high annual fees -- $695 and $395 respectively)
   - **Not ready for annual fees:** Chase Freedom Unlimited (1.5% on everything, 3% on dining and drugstores, no annual fee, pairs with Sapphire later)
2. Plan the application sequence. Don't apply for 5 cards in a week -- that tanks your score and raises red flags. Space applications 3-6 months apart. Apply for the highest-value card first (best signup bonus relative to your spend).
3. Calculate signup bonus value: a 100,000-point Chase signup bonus is worth $1,250 through their travel portal or $1,500-3,000+ when transferred to airline partners for premium redemptions. Compare this to the spending requirement (usually $4,000-5,000 in 3 months) and annual fee.
4. Build a 12-month card roadmap: which cards to get, in what order, minimum spend requirements and timelines, and when annual fees hit. Plan so minimum spend requirements don't overlap (you don't want to hit $10,000 in spending requirements simultaneously unless your normal spending covers it).
5. Evaluate keeper vs. churn decisions: some cards are worth keeping long-term (Amex Gold if you spend heavily on groceries and dining). Others should be downgraded to no-annual-fee versions after the first year once the signup bonus posts and credits are used. Never close your oldest credit card -- downgrade it instead to preserve credit history.

**Output:** Recommended cards in application order, 12-month roadmap with signup bonus deadlines, annual fee vs. value analysis for each card, and downgrade/keep strategy.
**Quality gate:** Card recommendations match the user's spending patterns and travel goals. Signup bonus spending requirements are achievable with normal spending. Application timing respects the 5/24 rule. Annual fee is justified by quantified value.

### Phase 3: EARNING ENGINE
**Entry criteria:** Card strategy defined, at least one travel card in hand.
**Actions:**
1. Set up category optimization -- the right card for every purchase:
   - Groceries: highest grocery multiplier card (Amex Gold: 4x, or Blue Cash Preferred: 6% on first $6k)
   - Dining: highest dining multiplier card (Amex Gold: 4x, or Chase Sapphire: 3x)
   - Travel: primary travel card (Chase Sapphire: 5x on travel through portal, 2x on other travel)
   - Gas: best gas card (rotate based on quarterly bonuses or dedicated gas card)
   - Everything else: flat-rate card as the catchall (2% card or 1.5x point card)
2. Maximize non-spending earning:
   - Shopping portals: Rakuten (often 3-15% back at major retailers), airline shopping portals (2-10 miles per dollar at normal stores), Chase and Amex offer programs (targeted discounts on existing spending)
   - Dining programs: link your credit cards to airline and hotel dining programs for bonus miles at participating restaurants (on top of the credit card rewards)
   - Referral bonuses: most premium cards offer 10,000-30,000 points for referring friends. If someone asks you which card to get, give them your referral link.
3. Don't manufacture spending. Buying gift cards to hit minimum spend, loading prepaid debit cards, or money order schemes can get your accounts shut down, your points clawed back, and potentially flag you for fraud. It's not worth it. Hit minimum spend with normal spending, timing large purchases (insurance premiums, annual subscriptions, furniture) to coincide with new card signup periods.
4. Set up automatic payments on the right cards: put recurring bills (streaming, phone, internet, insurance) on the card where they earn the most points. Then set all cards to autopay the full statement balance. Never pay interest. Ever.
5. Track your earning rate: calculate your effective earning rate across all cards. If you're spending $4,000/month and earning 6,000 points average, your blended rate is 1.5x. The goal is 2x+ through category optimization. Track monthly to make sure your strategy is actually working.

**Output:** Card-per-category spending guide, shopping portal strategy, recurring bill assignments, earning rate tracking template, and list of timing opportunities for large purchases.
**Quality gate:** Every spending category has an assigned card. At least 2 non-spending earning methods are identified. No manufactured spending is recommended. Autopay is set up for full balance on all cards.

### Phase 4: LOUNGE & STATUS
**Entry criteria:** At least one premium travel card active.
**Actions:**
1. Map your lounge access options:
   - **Priority Pass:** Comes with Amex Platinum, Capital One Venture X, and several other premium cards. 1,400+ lounges worldwide. Quality varies wildly -- some are quiet oases with hot food, others are crowded rooms with stale pretzels. Check lounge reviews before your flight.
   - **Centurion Lounges:** Amex Platinum only. Premium lounges at major US airports. Excellent food and drinks. Getting crowded but still the best domestic lounge network for card-based access.
   - **Capital One Lounges:** Capital One Venture X. Newer, expanding network. Currently at DFW, IAD, DEN with more coming. High quality.
   - **Airline lounges:** Some airline cards include lounge access (Delta Reserve includes Sky Clubs, United Club card includes United Clubs). Only worth it if you fly that airline frequently.
2. Understand guest policies: Priority Pass often allows 2 guests free. Centurion Lounges allow 2 guests with Platinum. Some lounges charge $30-50 per guest. If you travel with family, factor guest costs into the card's value proposition.
3. Earn hotel status without staying 50 nights:
   - Amex Platinum comes with Marriott Gold and Hilton Gold automatically
   - Certain credit cards grant mid-tier status (Marriott Bonvoy Brilliant: Platinum Elite, Hilton Aspire: Diamond)
   - Status match: if you have status at one chain, others will sometimes match it. Check StatusMatcher.com for current offers.
4. Maximize status perks: even mid-tier hotel status often includes room upgrades (when available), late checkout, bonus points, free breakfast (Hilton Gold and above), and executive lounge access (Marriott Platinum and above at some properties). Always book directly with the hotel -- third-party bookings forfeit status benefits.
5. Use credit card travel protections that replace paid insurance: trip delay coverage (most premium cards reimburse meals and hotel if your flight is delayed 6-12 hours), lost luggage coverage, rental car insurance (decline the CDW at the counter and use your card's coverage), and travel accident insurance. Know what your cards cover BEFORE you travel.

**Output:** Lounge access map for your specific cards, guest policy summary, hotel status acquisition plan, status perks guide, and credit card travel protections summary.
**Quality gate:** Lounge access is mapped to cards the user actually holds or plans to get. Guest policies are specified. At least one hotel status shortcut is identified. Travel protections are listed with claim procedures.

### Phase 5: REDEMPTION
**Entry criteria:** Points balance accumulated, travel goals defined.
**Actions:**
1. Never redeem points through the credit card's travel portal as your first option (with one exception: Chase Sapphire Reserve gets 1.5 cpp through the portal, which is competitive). Transfer to airline and hotel partners for maximum value:
   - Chase Ultimate Rewards transfers to: United, Southwest, Hyatt, British Airways, Air France/KLM, and more
   - Amex Membership Rewards transfers to: Delta, ANA, Singapore, Hilton, Marriott, and more
   - Capital One Miles transfer to: Air Canada, Turkish, Avianca, Wyndham, and more
2. Know the sweet spots -- specific redemptions where points are worth 2-10x more than average:
   - **Hyatt:** consistently best hotel redemption value. Category 1-4 hotels for 5,000-15,000 points/night can yield 2-4 cpp
   - **United:** partner flights on ANA, Lufthansa, and Turkish in business class for 60-88k miles
   - **Southwest Companion Pass:** earn 135,000 points in a calendar year and a designated companion flies free on every flight for the rest of that year plus the following year
   - **ANA round-trip business class to Japan:** 75-90k Virgin Atlantic or Amex points -- widely considered one of the best redemptions in the game
3. Book award flights 330 days out for the best availability. For popular routes and premium cabins, waiting until 2 months before means you'll find nothing. Set alerts using tools like Google Flights, ExpertFlyer, or AwardLogic for availability on your target routes.
4. Avoid the worst redemptions:
   - Gift cards through points (usually 0.5-0.7 cpp -- you're losing half the value)
   - Amazon checkout with points (0.5-0.8 cpp -- terrible)
   - Airline economy tickets on peak dates (sometimes worse value than just buying the ticket)
   - "Points + cash" options that use an unfavorable points rate
5. Do an annual audit: every January, review each card's annual fee against the value you received (points earned, credits used, lounge visits, hotel status, travel protections used). If a card isn't providing value equal to 2x its annual fee, downgrade or cancel it. Keep your strategy fresh as card benefits change.

**Output:** Transfer partner guide prioritized by value, sweet spot redemption list for your goals, booking timeline, redemptions to avoid, and annual card audit template.
**Quality gate:** Redemption recommendations include specific cpp values. At least 3 sweet spot redemptions are identified for the user's goals. Worst-value redemptions are explicitly listed. Annual audit includes a keep/downgrade decision for each card.

## Exit Criteria
Done when: (1) credit readiness is confirmed, (2) card strategy is built with application timeline, (3) every spending category has an optimized card, (4) lounge access and status plan is in place, (5) redemption strategy targets specific high-value uses with cpp benchmarks.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| FOUNDATION | Credit score below 700 | Adjust -- start with a no-annual-fee cashback card to build credit. Revisit points strategy in 6-12 months after score improves. Do not apply for premium cards -- the denial hurts your score further. |
| FOUNDATION | User carries a credit card balance | Stop -- fix this first. Pay off the balance before playing the points game. 25% APR destroys all rewards value. Recommend a balance transfer card (0% intro APR) instead of a travel card. |
| CARD STRATEGY | Over 5/24 and wants Chase cards | Adjust -- wait until under 5/24 or focus on Amex and Capital One ecosystems instead. Some Chase business cards bypass 5/24. |
| EARNING ENGINE | Monthly spending is too low to earn meaningful points | Adjust -- focus on a single no-annual-fee card with a flat rate, maximize shopping portals, and target one specific redemption rather than building a large balance. |
| REDEMPTION | Points about to expire | Escalate -- most transferable points don't expire while the account is open, but airline miles do. Transfer points to prevent expiration, make a small earning transaction, or donate a small amount to reset the clock. |
| REDEMPTION | Can't find award availability for target trip | Adjust -- try alternate airports (flying into a nearby city can open availability), flexible dates (midweek is better), different transfer partners for the same route, or break the trip into segments. |

## State Persistence
- Points balances by program (updated monthly)
- Card inventory with annual fee dates, anniversary bonuses, and credit limits
- Spending by category by month (to track earning efficiency)
- Redemption history with cpp achieved (to benchmark future redemptions)
- Upcoming annual fee dates with keep/downgrade decisions
- Credit inquiry count and 5/24 status tracking

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
