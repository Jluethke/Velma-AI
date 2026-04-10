# Travel Planner

Takes destination, dates, budget, travel style (backpacker to luxury), group composition (solo, couple, family with kids, group), and interests, then builds a day-by-day itinerary with logistics. Covers flights, accommodation recommendations by area, must-see vs skip-it attractions, restaurant suggestions by cuisine and budget, local transportation, packing list, and money-saving tips. Handles "I have no idea where to go" with destination suggestions based on preferences.

## Execution Pattern: Phase Pipeline

```
PHASE 1: PROFILE    --> Gather traveler details (dates, budget, style, group, interests)
PHASE 2: DESTINATION --> Select or validate destination, identify neighborhoods and base areas
PHASE 3: LOGISTICS  --> Flights, accommodation, transportation, visas, insurance
PHASE 4: ITINERARY  --> Day-by-day schedule with activities, meals, and transit
PHASE 5: PRACTICAL  --> Packing list, money tips, safety notes, language basics
PHASE 6: BACKUP     --> Rainy day alternatives, cancellation plans, emergency contacts
```

## Inputs
- destination: string -- Where you want to go, or "help me decide" with general preferences (beach, mountains, city, culture, adventure)
- dates: object -- Travel dates or flexible range, total trip length, any fixed dates within the trip (wedding, conference, event)
- budget: string -- Total trip budget or per-day budget (e.g., "$2000 total", "$150/day", "backpacker cheap", "luxury no limit")
- travelers: object -- Number of adults, kids (with ages), any mobility limitations, dietary restrictions, or medical needs
- style: string -- Backpacker, budget-conscious, mid-range comfort, luxury, adventure/active, relaxation-focused, cultural deep-dive
- interests: array -- What you want to do/see: food, history, nightlife, nature, beaches, museums, shopping, architecture, wildlife, photography, sports
- constraints: object -- (Optional) Must-see items, places to avoid, previous trips to the region, visa/passport status, pet arrangements needed at home

## Outputs
- itinerary: object -- Day-by-day plan with morning, afternoon, and evening activities, restaurant suggestions, and transit instructions
- logistics: object -- Flight recommendations, accommodation options by neighborhood, local transport guide, visa requirements
- budget_plan: object -- Estimated daily spending breakdown (accommodation, food, activities, transport) with total and savings tips
- packing_list: array -- Climate-appropriate packing list tailored to planned activities
- practical_guide: object -- Currency, tipping norms, safety notes, useful phrases, cultural etiquette, emergency numbers

## Execution

### Phase 1: PROFILE
**Entry criteria:** At least a destination idea or preference set provided.
**Actions:**
1. Determine trip type: relaxation (beach, resort, spa), adventure (hiking, diving, safari), cultural (museums, ruins, food tours), city break (shopping, nightlife, sightseeing), or mixed.
2. Assess group dynamics: solo traveler needs differ from families. Kids under 5 limit daily walking distance and require nap breaks. Teenagers need some independence. Elderly travelers need accessibility consideration.
3. Calculate per-day budget from total: subtract estimated flight cost, divide remainder by trip days. This is the daily operating budget for accommodation, food, activities, and local transport.
4. Identify travel constraints: passport validity (6+ months required for most countries), visa requirements, vaccination requirements, travel insurance needs.
5. Flag scheduling constraints: fixed events, flight availability on specific dates, seasonal considerations (monsoon season, peak tourist season, shoulder season value).

**Output:** Traveler profile with trip type, group needs, daily budget target, and constraint list.
**Quality gate:** Budget breakdown is realistic for the destination. Visa/passport requirements are flagged if international. Group needs are documented.

### Phase 2: DESTINATION
**Entry criteria:** Traveler profile complete.
**Actions:**
1. If destination is set: validate it against preferences, dates, and budget. Flag conflicts (e.g., Iceland in January on a beach vacation budget).
2. If destination is "help me decide": generate 3-5 destination options ranked by fit. For each: why it matches, best time to visit, rough daily cost, pros and cons.
3. Research the destination: identify distinct neighborhoods/areas, map which areas are best for staying (proximity to attractions, safety, transit access, budget fit).
4. Recommend 2-3 base areas ranked by priority:
   - Best overall (balance of location, price, character)
   - Best for budget (cheaper but still well-connected)
   - Best for vibe (the cool neighborhood, the local favorite, the hidden gem)
5. Identify what's actually worth seeing vs. tourist traps. Flag overrated attractions and suggest better alternatives.
6. Check seasonal factors: weather forecast for travel dates, any local holidays or festivals (opportunity or obstacle), peak pricing periods.

**Output:** Validated destination with neighborhood guide, base area recommendations, attraction priority list, and seasonal notes.
**Quality gate:** Destination matches stated preferences and budget. Neighborhoods are assessed for safety and convenience. Tourist traps are flagged.

### Phase 3: LOGISTICS
**Entry criteria:** Destination and base area selected.
**Actions:**
1. Flight research guidance: best airports to fly into, typical price ranges for the route, whether budget carriers serve the route, optimal booking window.
2. Accommodation recommendations by category:
   - Budget: hostels, guesthouses, Airbnb shared spaces, capsule hotels.
   - Mid-range: boutique hotels, well-reviewed Airbnbs, apart-hotels.
   - Luxury: top-rated hotels, resort options, unique stays (treehouses, overwater bungalows, historic properties).
3. For each accommodation option: neighborhood, proximity to transit and attractions, typical nightly rate, booking platform recommendation.
4. Local transportation guide: airport to city (cheapest and fastest options), getting around daily (metro, bus, rideshare, bike rental, walking), any passes or cards that save money (transit day passes, tourist cards).
5. Visa and entry requirements: do you need one, how to apply, processing time, cost, any on-arrival options.
6. Travel insurance recommendation: what to cover (medical, cancellation, baggage), approximate cost, whether credit card travel benefits apply.

**Output:** Flight guidance, 3-5 accommodation options with pricing, transportation guide, visa checklist, and insurance notes.
**Quality gate:** Accommodation options cover the stated budget range. Transportation guide includes specific routes from airport. Visa requirements are confirmed for traveler's passport.

### Phase 4: ITINERARY
**Entry criteria:** Logistics planned, base area selected.
**Actions:**
1. Design the day-by-day itinerary following these principles:
   - Day 1: low-key arrival day (check in, explore the neighborhood, easy dinner). No major attractions when jet-lagged.
   - Middle days: one major activity or attraction per day, supplemented with neighborhood exploration, food, and downtime. Do not schedule every hour.
   - Last day: flexible morning for last-minute shopping or revisiting favorites, pack, transit to airport.
2. Cluster activities geographically: don't zigzag across the city. Group things by neighborhood to minimize transit time.
3. Include meal suggestions for each day: breakfast (local cafe or hotel), lunch (near the day's activities, mid-budget), dinner (range of options from street food to nice restaurant). Always include at least one "eat where locals eat" suggestion per day.
4. Build in buffer time: 30 minutes between activities for transit, getting lost, spontaneous discoveries. At least one "free afternoon" with no plans for trips over 5 days.
5. For families with kids: limit walking to age-appropriate distances, include playground or park breaks, plan around nap schedules for under-5s, identify kid-friendly restaurants.
6. For each activity: include hours of operation, typical visit duration, whether advance booking is required, cost, and transit instructions from the previous activity.

**Output:** Day-by-day itinerary with activities, meals, transit, timing, and costs per day.
**Quality gate:** No day has more than 2 major attractions. Geographic clustering minimizes transit. Buffer time is included. Opening hours are noted.

### Phase 5: PRACTICAL
**Entry criteria:** Itinerary finalized.
**Actions:**
1. Build a packing list based on:
   - Weather forecast for travel dates (layers, rain gear, sun protection).
   - Planned activities (hiking boots, swimsuit, formal dinner outfit, temple-appropriate clothing).
   - Trip length (how many outfits, laundry options at accommodation).
   - Group specifics (kids' essentials, medication, mobility aids).
2. Money guide: local currency, best way to get cash (ATM on arrival vs. currency exchange), credit card acceptance, tipping norms by context (restaurant, taxi, hotel, tour guide), common scams to avoid.
3. Communication: local SIM card or eSIM options, WiFi availability, messaging app preference in the region (WhatsApp, WeChat, Line).
4. Cultural etiquette: dress codes (religious sites, restaurants), greeting customs, photography rules, bargaining norms, things that are rude without realizing it.
5. Useful phrases: 10-15 essential phrases in the local language (hello, thank you, excuse me, how much, where is, the check please, help, I don't understand). Include pronunciation guide.
6. Safety notes: neighborhoods to avoid at night, common tourist scams, emergency numbers (local 911 equivalent), nearest embassy/consulate location.

**Output:** Packing list, money and tipping guide, communication setup, cultural notes, phrase card, and safety briefing.
**Quality gate:** Packing list matches climate and activities. Safety notes are specific to the destination, not generic travel advice.

### Phase 6: BACKUP
**Entry criteria:** Practical guide complete.
**Actions:**
1. Rainy day alternatives for each day of the itinerary: indoor activities, museums, cooking classes, spa visits, shopping areas, cinema (for families).
2. Cancellation and rebooking guidance: what's refundable, change fees, travel insurance claim process.
3. Medical preparation: nearest hospital to accommodation, pharmacy locations, whether prescriptions transfer, any required vaccinations.
4. Emergency contacts: local emergency number, embassy/consulate, travel insurance hotline, airline rebooking number, accommodation emergency contact.
5. Document checklist: passport copies (digital and paper), travel insurance policy number, hotel confirmation numbers, flight booking references, emergency cash stash location.
6. Connectivity-down plan: key information to have on paper or offline (hotel address in local language for taxi, map screenshot, emergency contacts written down, not just in phone).

**Output:** Rainy day alternatives per itinerary day, emergency contact card, document checklist, and offline information pack.
**Quality gate:** Every itinerary day has an indoor alternative. Emergency contacts are complete. Key information has offline backup.

## Exit Criteria
Done when: (1) day-by-day itinerary covers every day of the trip with activities, meals, and logistics, (2) accommodation and transportation recommendations are within budget, (3) packing list matches climate and activities, (4) practical guide covers money, safety, and cultural notes, (5) rainy day alternatives are provided, (6) total estimated cost is within budget.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| PROFILE | "I have 3 days and want to see all of Europe" | Adjust -- explain realistic scope, suggest 1-2 cities maximum, or recommend a single-country focus |
| DESTINATION | Budget doesn't match destination (Tokyo on $30/day) | Adjust -- show what's possible at that budget, suggest alternative destinations where budget goes further |
| LOGISTICS | Visa required with insufficient processing time | Escalate -- flag as trip-blocking issue, suggest visa-free alternatives or expedited processing if available |
| ITINERARY | More must-see items than days available | Adjust -- prioritize by uniqueness (things you can only do HERE), cut items available elsewhere, suggest extending trip if possible |
| PRACTICAL | Traveling with serious medical needs | Escalate -- recommend consulting travel medicine clinic, ensure accommodation is near medical facilities |
| BACKUP | Destination has significant safety concerns | Escalate -- present government travel advisories, suggest safer alternatives, don't sugarcoat the risk |
| BACKUP | User rejects final output | **Targeted revision** -- ask which section fell short (itinerary day, accommodation options, budget breakdown, packing list, or practical guide) and rerun only that section. Do not rebuild the full trip plan. |

## State Persistence
- Traveler profiles (passport details, airline loyalty programs, accommodation preferences, dietary needs)
- Trip history (destinations visited, favorites, things to skip next time)
- Price benchmarks (actual costs vs estimates -- improves budget accuracy for similar destinations)
- Packing list templates (base list that adapts per trip rather than starting from scratch)
- Restaurant and attraction reviews (personal ratings build better future recommendations)

---

## Reference

### Budget Classification by Destination Type

| Style | Daily Budget (per person) | What It Gets |
|---|---|---|
| Backpacker | $25-60 | Hostel dorm, street food, free attractions |
| Budget | $60-120 | Private room, local restaurants, some paid attractions |
| Mid-range | $120-250 | 3-star hotel, sit-down restaurants, most attractions |
| Luxury | $250+ | 4-5 star hotel, fine dining, VIP experiences |

Adjust significantly by destination: $60/day is luxury in Southeast Asia and budget in Scandinavia.

### Daily Budget Per-Person Calculator

`Daily operating budget = (Total budget - flight cost) ÷ trip days`

Typical flight cost ranges: short-haul domestic $100-400, long-haul international $600-1,500, peak season ×1.5

### Itinerary Design Rules

- Day 1: low-key arrival (no major attractions; jet lag recovery)
- Max 2 major attractions per day
- Cluster activities geographically (no zigzagging)
- 30-minute buffer between activities
- One free afternoon for trips over 5 days
- Last day: flexible morning + airport transit

### Visa Processing Time Guide (Rough)

| Visa Type | Lead Time Needed |
|---|---|
| Visa-free / on arrival | 0 days (just check passport validity) |
| E-visa / electronic | 3-7 business days |
| Embassy appointment | 4-8 weeks |
| Complex visa (US, Schengen, UK) | 6-12 weeks in peak season |

Passport validity requirement: 6 months beyond return date for most countries.

### Emergency Reference Card (Template)

- Local emergency number: [country-specific]
- Embassy/consulate: [nearest to destination]
- Travel insurance hotline: [from policy document]
- Airline rebooking: [airline's 24-hr number]
- Hotel emergency contact: [at check-in]
- Key addresses offline: hotel address in local language + nearest hospital

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.