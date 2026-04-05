# Party Planner

Takes the occasion, guest count, budget, venue (home, rented space, outdoor), and vibe (casual backyard BBQ to formal dinner party), then generates a complete plan: food/drink menu with quantities, decoration ideas, timeline for day-of setup, activity/entertainment suggestions, and a shopping list. Handles kids' parties, milestone birthdays, holiday gatherings, graduation parties, and retirement celebrations.

## Execution Pattern: Phase Pipeline

```
PHASE 1: BRIEF     --> Gather event details (occasion, guests, venue, budget, vibe)
PHASE 2: MENU      --> Design food and drink plan with quantities and prep timeline
PHASE 3: DECOR     --> Decoration theme, supplies, and setup instructions
PHASE 4: PROGRAM   --> Activities, entertainment, and event flow timeline
PHASE 5: LOGISTICS --> Shopping list, setup schedule, and day-of runsheet
PHASE 6: CLEANUP   --> Post-party breakdown plan and next-day tasks
```

## Inputs
- occasion: string -- What's being celebrated: birthday (specify age/milestone), holiday (which one), graduation, baby shower, retirement, engagement, housewarming, "just a get-together", or custom
- guest_count: object -- Number of adults, kids (with age ranges), elderly guests, and anyone with dietary restrictions or accessibility needs
- venue: object -- Location type (home backyard, home indoor, rented hall, park, restaurant private room), size constraints, kitchen access, available equipment (grill, oven, tables, chairs)
- budget: string -- Total party budget (e.g., "$200", "$500-800", "keep it cheap", "go all out")
- vibe: string -- Casual (paper plates OK), semi-casual (nice but not stuffy), formal (real plates, dress code), themed (specify theme)
- timing: object -- Date, start time, expected duration, any hard end time (venue closes, noise ordinance, kids' bedtimes)

## Outputs
- menu_plan: object -- Complete food and drink menu with recipes, quantities scaled to guest count, and prep timeline
- decoration_plan: object -- Theme, color scheme, supply list with quantities, and setup instructions
- program_schedule: object -- Event flow from first guest arrival to last goodbye, including activities and entertainment
- shopping_list: object -- Consolidated master list sorted by store type (grocery, party supply, liquor store) with quantities and cost estimates
- day_of_runsheet: object -- Hour-by-hour timeline for setup, service, and cleanup with task assignments
- budget_breakdown: object -- Estimated cost by category (food, drinks, decorations, entertainment, rentals) with total

## Execution

### Phase 1: BRIEF
**Entry criteria:** Occasion and approximate guest count provided.
**Actions:**
1. Classify the event: sit-down meal, buffet/grazing, cocktail party, outdoor cookout, kids' activity party, or mixed format.
2. Map guest demographics: kids need different food, activities, and safety considerations. Elderly guests need seating and accessibility. Teenagers need something to do or they'll stare at phones.
3. Assess venue constraints: indoor square footage determines if buffet or sit-down works. Outdoor means weather contingency. Home kitchen limits hot food variety. No kitchen means cold/pre-made only.
4. Set budget allocations by category: food (40-50%), drinks (15-20%), decorations (10-15%), entertainment (10-15%), supplies/rentals (10-15%). Adjust based on priorities.
5. Identify dietary restrictions: vegetarian, vegan, gluten-free, nut allergies, kosher, halal, diabetic. Plan to accommodate without making a separate "sad plate."

**Output:** Event profile with format, guest breakdown, venue capabilities, budget allocation, and dietary map.
**Quality gate:** Format matches venue capacity. Budget allocations are realistic. All dietary needs are flagged.

### Phase 2: MENU
**Entry criteria:** Event profile complete.
**Actions:**
1. Design the food plan based on event format:
   - **Sit-down dinner:** appetizer, main course (with vegetarian option), 2 sides, bread, dessert.
   - **Buffet/grazing:** 2-3 proteins, 3-4 sides, salad, bread, 2 desserts. Plan for people eating 1.5x what you'd expect.
   - **Cocktail party:** 8-10 appetizers/small bites (mix of hot and cold), no main course needed.
   - **Cookout:** 2 grilled proteins, 3-4 sides (one pasta salad, one green, one starchy), condiments, buns, dessert.
   - **Kids' party:** keep it simple: pizza or nuggets, fruit, veggie tray with ranch, juice boxes, cake.
2. Calculate quantities using per-person estimates: 6-8 oz protein, 4-6 oz per side, 2-3 appetizer pieces per type for first hour + 1 per hour after.
3. Plan drinks: non-alcoholic for all guests, alcoholic options if appropriate. Calculate: 2 drinks per person for first hour, 1 per hour after. Include water, always.
4. Design the dessert: match the occasion (birthday cake, graduation cupcakes, holiday pie, etc.). Calculate portions.
5. Build the prep timeline: what can be made 2 days ahead, 1 day ahead, morning of, and must-be-done-last-minute.
6. Identify dishes that dietary-restricted guests can eat. Ensure at least 60% of the spread is accessible to every guest without modification.

**Output:** Complete menu with recipes, per-person quantities, drink calculator, and prep timeline.
**Quality gate:** Quantities account for all guests plus 15% buffer. Dietary restrictions covered. Prep timeline is realistic for home kitchen (if applicable).

### Phase 3: DECOR
**Entry criteria:** Menu planned, event format confirmed.
**Actions:**
1. Propose a cohesive theme and color scheme: tied to the occasion (gold and black for a 50th birthday, school colors for graduation, pastels for baby shower) or vibe (rustic, tropical, minimalist, retro).
2. List decoration elements: table centerpieces, balloon arrangements (arch, bouquets, or scattered), banners/signage, tablecloths and napkins, lighting (string lights, candles, lanterns), photo backdrop if applicable.
3. Calculate quantities: one centerpiece per table, balloon count based on space, enough tablecloths and napkins for guest count plus extras.
4. Specify DIY vs. buy: which decorations can be made cheaply at home (paper garlands, mason jar centerpieces) vs. which are worth buying (helium balloons, printed banners).
5. Add venue-specific setup notes: outdoor needs weights for balloons, indoor needs command strips not nails, rented venues have setup time restrictions.
6. Include a photo/memory station if appropriate: Polaroid guest book, photo booth props, memory jar for retirements.

**Output:** Decoration plan with theme, color palette, item list with quantities, DIY instructions, and purchase list.
**Quality gate:** Theme is cohesive. Quantities match venue and guest count. DIY projects are achievable with stated timeline.

### Phase 4: PROGRAM
**Entry criteria:** Decor plan complete.
**Actions:**
1. Design the event flow timeline from start to finish:
   - **First 30 min:** Arrival, greet guests, drinks and appetizers, background music.
   - **Hour 1-2:** Main activity or meal service (varies by event type).
   - **Mid-event:** Speeches, toasts, or special moments (cake cutting, gift opening, slideshow).
   - **Final hour:** Dessert, winding down, thank-yous, party favors if applicable.
2. Plan activities appropriate to the event:
   - **Kids' parties:** 2-3 structured activities (craft, game, treasure hunt) plus free play time.
   - **Adult casual:** lawn games (cornhole, giant Jenga), trivia, playlist collaboration.
   - **Adult formal:** background music progression (chill to upbeat), toasts, slideshow.
   - **Mixed age:** activities that work for all (photo booth, bingo, karaoke).
3. Plan the music: suggest playlist vibes by event phase (ambient for arrival, upbeat for peak, mellow for winding down). Recommend Spotify playlists or genre keywords.
4. Identify the "dead zone" risk: the 20 minutes after food is cleared when energy drops. Plan a transition activity (dessert service, game, speech, dancing).
5. If gifts are expected: plan when and how (open at party or later? Gift table setup? Thank-you card station?).

**Output:** Event flow timeline, activity plan with materials needed, music guide, and special moment choreography.
**Quality gate:** No gaps longer than 15 minutes without a planned element. Activities match guest demographics. Timeline fits within venue availability.

### Phase 5: LOGISTICS
**Entry criteria:** Menu, decor, and program finalized.
**Actions:**
1. Consolidate all needed items into a master shopping list, sorted by store:
   - **Grocery store:** food ingredients, beverages, ice, paper goods.
   - **Party supply store:** decorations, balloons, themed items, party favors.
   - **Liquor store:** beer, wine, spirits, mixers (if applicable).
   - **Hardware/dollar store:** extra folding chairs, extension cords, coolers, trash bags.
2. Add quantities and estimated prices for everything. Sum by category and total.
3. Build the day-of setup runsheet (working backward from party start):
   - T-minus 4 hours: begin cooking time-intensive items, set up tables and chairs.
   - T-minus 2 hours: decorate, set out plates and utensils, chill drinks.
   - T-minus 1 hour: finish cooking, set out appetizers, do final walkthrough.
   - T-minus 15 min: light candles, start music, take a breath.
4. Assign tasks if multiple helpers are available (who handles food, who handles decor, who handles drinks).
5. List equipment needs: do you have enough plates, glasses, chairs, serving utensils? What needs to be borrowed, rented, or bought?
6. Weather contingency for outdoor events: when to make the call, indoor backup plan, tents/tarps as insurance.

**Output:** Master shopping list with prices, setup runsheet with task assignments, equipment checklist, and contingency plan.
**Quality gate:** Shopping list accounts for every item in menu, decor, and program plans. Setup timeline is achievable with stated helpers. Budget total is within range.

### Phase 6: CLEANUP
**Entry criteria:** Logistics plan complete.
**Actions:**
1. Plan end-of-party breakdown: when to start quietly cleaning during the event (clear empty plates, consolidate trash) vs. post-event teardown.
2. List cleanup supplies needed: trash bags (double what you think), recycling containers, food storage containers, cleaning spray, dish soap.
3. Food handling: what leftovers to save (label and refrigerate within 2 hours), what to send home with guests, what to discard.
4. Decoration teardown: what's reusable (store for next event), what's trash (balloons, used tablecloths), what needs to be returned (rentals).
5. Next-day tasks: return rented equipment, take out extra trash, send thank-you messages/texts, post photos if desired.
6. Venue-specific: if rented, document the space condition, return keys, confirm deposit return timeline.

**Output:** Cleanup plan with supply list, food storage guide, and next-day task list.
**Quality gate:** Food safety guidelines followed. Rental returns are scheduled. Nothing is forgotten at the venue.

## Exit Criteria
Done when: (1) complete menu with quantities is provided, (2) decoration plan has a cohesive theme and supply list, (3) event timeline covers arrival through departure with no dead zones, (4) master shopping list is consolidated with cost estimates within budget, (5) day-of runsheet has setup timeline and task assignments, (6) cleanup plan is included.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| BRIEF | Guest count is "I don't know, maybe 20, maybe 50" | Adjust -- plan for the high estimate on food (better to have leftovers), mid estimate on seating, and ensure venue fits maximum |
| BRIEF | Budget is unrealistically low for the event ($50 for 30 people) | Escalate -- show what's possible at that budget (potluck, BYOB, DIY everything), suggest alternatives |
| MENU | Too many competing dietary restrictions | Adjust -- build a naturally inclusive menu (grilled proteins, salads, rice) rather than trying to have a separate option for each restriction |
| DECOR | Theme requested is complex and budget is low | Adjust -- find the 3-4 highest-impact decoration elements and skip the rest. A few well-placed items beat a room full of dollar-store filler |
| PROGRAM | Event is too short for planned activities | Adjust -- cut activities to essentials (eat, special moment, one activity). Under 2 hours means pick one focus |
| LOGISTICS | Shopping list exceeds budget | Adjust -- identify the biggest cost drivers, suggest substitutions (store-brand, seasonal produce, batch cocktail instead of full bar) |

## State Persistence
- Event templates (successful party plans can be reused and adapted for future events)
- Guest dietary profiles (don't re-ask about allergies for recurring guests)
- Vendor and supplier notes (which stores had the best prices, which bakeries delivered on time)
- Recipe scaling history (actual quantities consumed vs planned -- improves estimates over time)
- Seasonal adjustments (outdoor viability by month, seasonal food pricing, holiday supply availability)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.