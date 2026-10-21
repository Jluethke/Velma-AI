# Home Maintenance

Tracks every recurring maintenance task your home needs and tells you what's due, what's overdue, and what's coming up. Takes your home details (age, systems, appliances, outdoor features) and builds a month-by-month maintenance calendar with specific tasks, time estimates, skill level required, and cost of neglect if you skip it. Designed for the homeowner who knows the furnace filter needs changing but can't remember when they last did it and doesn't want to find out the hard way that the water heater should have been flushed two years ago.

## Execution Pattern: Phase Pipeline

```
PHASE 1: HOME AUDIT     --> Catalog every system, surface, and appliance that needs maintenance
PHASE 2: SCHEDULE BUILD  --> Assign frequency, season, and priority to each task
PHASE 3: DUE NOW        --> Identify overdue and upcoming tasks based on last-done dates
PHASE 4: ACTION CARDS   --> Generate specific task instructions with time, cost, and skill level
```

## Inputs
- `home`: object -- Year built, square footage, stories, roof type and age, siding type, foundation type (slab, crawlspace, basement), heating system (forced air, boiler, heat pump, radiant), cooling system, water heater type and age, septic or sewer, well or municipal water
- `outdoor`: object -- (Optional) Yard size, trees near house, gutters (type, guards?), deck/patio (wood, composite, concrete), driveway (asphalt, concrete, gravel), fence (wood, vinyl, chain link), sprinkler system, pool/hot tub
- `appliances`: object -- (Optional) Major appliances with approximate ages: HVAC, water heater, refrigerator, dishwasher, washer, dryer, garbage disposal, sump pump, garage door opener
- `last_done`: object -- (Optional) What you know about when things were last done: "furnace filter maybe 4 months ago", "gutters cleaned last fall", "never flushed the water heater"
- `climate`: string -- (Optional) Region/ZIP for seasonal timing adjustments

## Outputs
- `maintenance_calendar`: object -- 12-month calendar with tasks assigned to specific months, grouped by season
- `overdue_list`: array -- Tasks that are past their recommended interval, ranked by consequence severity
- `task_cards`: array -- For each task: what to do, how long it takes, tools needed, skill level (DIY easy/DIY moderate/call a pro), cost if DIY, cost if pro, and what happens if you skip it
- `annual_budget`: object -- Estimated annual maintenance cost (rule of thumb: 1-3% of home value per year)

## Execution

### Phase 1: HOME AUDIT
### Entry Criteria
Home description provided.
### Actions
1. Catalog every maintenance-requiring system:
   - **HVAC:** Forced air (filter, duct cleaning, annual tune-up, condensate drain, outdoor unit clearance). Boiler (pressure check, radiator bleed, annual service). Heat pump (same as AC plus defrost check, reversing valve).
   - **Plumbing:** Water heater (anode rod, sediment flush, TPR valve test). Faucets and toilets (check for leaks, replace washers/flappers). Supply hoses (washing machine, dishwasher, ice maker -- replace every 5 years, rubber hoses every 3). Sump pump (test quarterly). Septic (pump every 3-5 years). Well (water quality test annually).
   - **Electrical:** Smoke detectors (test monthly, replace batteries 6-month schedule or at daylight saving, replace unit every 10 years). CO detectors (test monthly, replace every 5-7 years). GFCI outlets (test monthly). Circuit breaker panel (visual inspection annually, look for corrosion or burn marks). Surge protector lifespan (replace every 3-5 years).
   - **Exterior:** Roof (visual inspection twice yearly, after major storms). Gutters (clean 2x/year, 4x if heavy tree cover). Siding (inspect for damage, wash annually). Caulking around windows, doors, penetrations (inspect annually, re-caulk every 5-7 years). Foundation (check for cracks spring and fall). Driveway (seal asphalt every 2-3 years, patch cracks in concrete).
   - **Interior:** Grout and caulk in bathrooms (inspect every 6 months, re-caulk tub/shower every 1-2 years). Dryer vent (clean annually -- dryer fires are a top cause of house fires). Range hood filter (clean or replace every 3-6 months). Garbage disposal (clean monthly with ice and salt or citrus).
   - **Seasonal:** Winterize outdoor faucets and sprinklers before first freeze. Test sump pump before spring thaw. Reverse ceiling fan direction (down in summer, up in winter). Check attic for ice dam signs after snow.
2. Flag systems that are past their expected lifespan:
   - Water heater: tank type 10-15 years, tankless 20+ years.
   - Roof: asphalt shingles 20-30 years, metal 40-70 years, tile 50-100 years.
   - HVAC: 15-20 years.
   - Appliances: dishwasher 10 years, washer/dryer 10-13 years, refrigerator 13-17 years.
   - Garage door opener: 10-15 years.
3. Note home-age-specific concerns:
   - Pre-1978: lead paint risk on any painted surface. Test before sanding or scraping.
   - Pre-1980: possible asbestos in insulation, floor tiles, pipe wrap. Do not disturb without testing.
   - Pre-1990: galvanized steel pipes may be corroding, reducing water pressure and quality.
   - Pre-2000: polybutylene plumbing (gray plastic pipes) is failure-prone, consider replacement.

### Output
Complete home system inventory with ages, conditions, and lifespan status.
### Quality Gate
Every system in the home has an entry. Items past their lifespan are flagged. Home-age hazards (lead, asbestos) are noted where applicable.

### Phase 2: SCHEDULE BUILD
### Entry Criteria
Home audit complete.
### Actions
1. Assign each task to its optimal month based on climate zone:
   - **January:** Check weather stripping, test smoke/CO detectors, inspect attic insulation for ice dam signs.
   - **February:** Service furnace/boiler (end of heavy-use season), check sump pump, plan spring projects.
   - **March:** Test outdoor faucets as thaw begins, inspect roof and gutters post-winter, service garage door opener (lubricate, test auto-reverse).
   - **April:** HVAC transition: turn off humidifier, clean/replace filter, schedule AC tune-up. Spring yard cleanup, inspect foundation for winter damage, power wash siding and deck.
   - **May:** AC tune-up, clean dryer vent, inspect and clean gutters, check deck/patio for winter damage (re-stain/seal if needed), start sprinkler system.
   - **June:** Inspect caulking around windows and doors, check exterior paint, clean range hood filter, test GFCI outlets.
   - **July:** Mid-summer AC filter check, deep clean kitchen appliances (dishwasher, garbage disposal), inspect for pest entry points.
   - **August:** Check smoke/CO detector batteries (6-month mark from February check), inspect roof (before fall rains), clean gutters if tree cover is heavy.
   - **September:** Schedule furnace tune-up, reverse ceiling fans, flush water heater, touch up exterior caulk before cold.
   - **October:** Winterize: shut off and drain outdoor faucets, blow out sprinklers, clean gutters, check weather stripping, test furnace.
   - **November:** Test smoke/CO detectors, replace HVAC filter, check for drafts around windows and doors, inspect fireplace and chimney (if applicable, clean every 1-2 years with regular use).
   - **December:** Inspect holiday electrical loads (overloaded circuits), check sump pump battery backup, review and plan next year's major maintenance.
2. Set frequency for recurring tasks:
   - Monthly: test smoke/CO detectors, clean garbage disposal, check HVAC filter (replace every 30-90 days depending on type and pets).
   - Quarterly: test sump pump, inspect plumbing for leaks, clean range hood filter, test GFCI outlets.
   - Biannually: clean gutters, check smoke detector batteries, deep clean HVAC.
   - Annually: HVAC professional tune-up, flush water heater, clean dryer vent, inspect roof, service garage door, re-caulk as needed.
   - Every 2-3 years: seal asphalt driveway, re-stain wood deck, replace supply hoses, power wash exterior.
   - Every 3-5 years: pump septic tank, replace surge protectors, inspect/replace water heater anode rod.
   - Every 5-10 years: re-caulk windows and doors, replace water heater anode rod (if not already), repaint exterior, replace smoke detectors.
3. Assign priority to each task: critical (fire/flood/safety risk if skipped), important (costly damage if neglected), and routine (cosmetic or minor efficiency).

### Output
12-month maintenance calendar with tasks, frequencies, and priorities.
### Quality Gate
Every month has at least one task assigned. Critical tasks are flagged. Seasonal timing matches the user's climate zone.

### Phase 3: DUE NOW
### Entry Criteria
Schedule built and last-done dates provided.
### Actions
1. Compare each task's last-done date to its required frequency. Flag anything overdue.
2. Rank overdue items by consequence:
   - **Critical overdue:** Dryer vent not cleaned in 2+ years (fire risk), smoke detectors not tested in 6+ months, furnace not serviced in 2+ years, water heater not flushed in 5+ years (sediment buildup, tank corrosion).
   - **Important overdue:** Gutters not cleaned in 1+ year (foundation water damage), HVAC filter not changed in 4+ months (efficiency loss, system strain), caulking cracked and not addressed (water intrusion, mold).
   - **Routine overdue:** Deck not stained in 3+ years (cosmetic then structural), driveway not sealed in 4+ years (accelerated cracking).
3. Identify upcoming tasks in the next 30 days.
4. Generate a "do this weekend" list: the 3-5 most impactful tasks that can be done in a single Saturday.

### Output
Overdue list ranked by consequence, upcoming-30-day list, and weekend priority list.
### Quality Gate
No critical overdue items are buried below routine ones. Weekend list is realistic (total time under 4 hours).

### Phase 4: ACTION CARDS
### Entry Criteria
Due-now list generated.
### Actions
1. For each task on the overdue and upcoming lists, generate an action card:
   - **What:** Specific task description (not "clean gutters" but "remove debris from all gutters and downspouts, flush with hose to check flow, check gutter slope and reattach any sagging sections").
   - **Time:** Estimated duration (gutter cleaning: 1-2 hours for a single-story, 2-4 hours for two-story).
   - **Tools:** What you need (ladder, gloves, garden hose, gutter scoop, bucket).
   - **Skill level:** DIY Easy (anyone), DIY Moderate (some comfort with tools/heights), Call a Pro (specialized equipment, safety risk, licensed work).
   - **DIY cost:** Materials only (gutter cleaning: $0 if you have a ladder and gloves, $20-30 for a gutter cleaning kit).
   - **Pro cost:** Typical contractor price (gutter cleaning: $100-250 depending on home size and stories).
   - **Skip cost:** What happens if you don't do it -- in dollars and consequences (clogged gutters: water pools at foundation, can cause $5,000-15,000 in foundation repair, $3,000-10,000 in basement waterproofing, immediate risk of fascia rot at $500-1,500).
2. For tasks marked "Call a Pro," note what to look for in a contractor: licensed, insured, reviews, red flags.
3. Calculate the annual maintenance budget: sum of all DIY costs plus pro costs for tasks you'll hire out.

### Output
Action cards for all due tasks, annual budget estimate, and contractor guidance where applicable.
### Quality Gate
Every action card has all seven fields filled. Skip costs are realistic and sourced from typical repair cost ranges. Time estimates account for skill level.


---

## Worked Example

Illustrative only.

Given typical inputs for Tracks every recurring home maintenance task with month-by-month calendar, overd, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) every home system is cataloged, (2) 12-month maintenance calendar is built, (3) overdue items are identified and ranked, (4) action cards are generated for all due tasks, (5) annual maintenance budget is estimated.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| HOME AUDIT | User doesn't know system ages | Estimate from home purchase date and visible condition. "Water heater has no date sticker" = assume 10 years if you don't know, and prioritize an inspection |
| SCHEDULE BUILD | User is in a mild climate (no freeze/thaw cycle) | Adjust -- remove winterization tasks, extend outdoor maintenance season, shift focus to humidity and pest prevention |
| DUE NOW | User has never done any maintenance (everything is overdue) | Prioritize by safety first (smoke detectors, dryer vent, HVAC filter), then by damage prevention (gutters, water heater flush), then everything else. Don't overwhelm -- give a 4-week ramp-up plan |
| ACTION CARDS | User is a renter | Filter out landlord-responsibility items (roof, HVAC replacement, structural). Focus on renter tasks (smoke detector testing, HVAC filter, drain maintenance, reporting issues) |
| ACT | User can't afford all recommended maintenance | Prioritize strictly by consequence cost: $50 in dryer vent cleaning prevents $25,000 in fire damage. Defer cosmetic items indefinitely |

## State Persistence
- Last-done dates per task (updated when user completes a task)
- System ages and replacement projections (updated when systems are replaced)
- Contractor history (who did good work, who to avoid)
- Annual spend tracking (actual vs budgeted)
- Seasonal notes (issues discovered during inspections that need follow-up)

## Reference

### Home System Lifespan Reference

| System | Expected Lifespan | Replace When |
|---|---|---|
| Asphalt roof | 20-30 years | Multiple leaks, granule loss, curling shingles |
| Furnace | 15-20 years | Frequent repairs, cracked heat exchanger, >$500 repair on unit >15 years |
| Central AC | 15-20 years | R-22 refrigerant (phased out), SEER below 13, compressor failure |
| Water heater (tank) | 10-15 years | Rust-colored water, leaking at base, popping/rumbling sounds |
| Water heater (tankless) | 20+ years | Flow rate decline, error codes, scale buildup despite flushing |
| Dishwasher | 10 years | Not cleaning well, leaking, motor noise |
| Washer | 10-13 years | Vibration, leaking, not spinning |
| Dryer | 10-13 years | Not drying fully, excessive heat, burning smell |
| Garbage disposal | 10-12 years | Jamming frequently, leaking, slow drain |
| Garage door opener | 10-15 years | Safety reverse failing, excessive noise, inconsistent operation |

### Monthly Maintenance Quick Reference

| Month | Critical Task | Time |
|---|---|---|
| Jan | Test smoke/CO detectors, check weather stripping | 30 min |
| Feb | Service furnace, test sump pump | 2 hrs (pro for furnace) |
| Mar | Inspect roof post-winter, test outdoor faucets | 1 hr |
| Apr | Replace HVAC filter, power wash exterior | 2-3 hrs |
| May | Schedule AC tune-up, clean dryer vent | 1-2 hrs (pro for AC) |
| Jun | Inspect caulking, check exterior paint | 1 hr |
| Jul | Clean kitchen appliances, pest inspection | 1 hr |
| Aug | Replace smoke detector batteries, clean gutters | 2 hrs |
| Sep | Flush water heater, schedule furnace tune-up | 1 hr + pro |
| Oct | Winterize faucets/sprinklers, clean gutters | 2-3 hrs |
| Nov | Test smoke/CO, replace HVAC filter, check drafts | 1 hr |
| Dec | Inspect electrical loads, check sump pump backup | 30 min |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
