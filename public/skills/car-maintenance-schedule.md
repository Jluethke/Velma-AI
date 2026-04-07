# Car Maintenance Schedule

Builds a complete maintenance plan for your specific vehicle so you stop guessing when the oil needs changing and start actually taking care of the thing that gets you to work every day. Covers everything from basic fluid checks to timing belt replacement by mileage, plus seasonal prep so your car doesn't leave you stranded in January. No mechanic jargon -- just clear schedules, realistic costs, and the stuff that actually matters vs. the stuff the dealer upsells because they need a boat payment.

## Execution Pattern: Phase Pipeline

```
PHASE 1: VEHICLE PROFILE --> Catalog your car's specs, mileage, and maintenance history
PHASE 2: SCHEDULE BUILD  --> Create a mileage and time-based maintenance calendar
PHASE 3: FLUID & FILTER  --> Set up the regular check and replacement intervals
PHASE 4: SEASONAL PREP   --> Climate-specific maintenance for summer, winter, and road trips
PHASE 5: COST & TRACKING --> Budget for everything and track what's been done
```

## Inputs
- vehicle: object -- Year, make, model, trim, engine size, transmission type (auto/manual/CVT), drivetrain (FWD/RWD/AWD/4WD), current mileage
- driving_conditions: object -- Mostly city or highway, daily commute distance, towing or hauling, dusty/gravel roads, extreme heat or cold, stop-and-go traffic
- maintenance_history: object -- (Optional) Last oil change mileage, tire age and condition, any recent repairs, known issues, when brakes were last done
- budget_preference: object -- DIY capability level (none, basic, intermediate, advanced), preference for dealer vs. independent mechanic vs. DIY, monthly maintenance budget
- climate: object -- Region/climate zone, typical winter low temps, summer high temps, salt on roads, heavy rain or flooding risk

## Outputs
- maintenance_calendar: object -- Complete schedule organized by mileage intervals and time, with specific tasks at each interval
- fluid_guide: object -- Every fluid in the vehicle with check intervals, replacement intervals, correct specifications, and capacity
- seasonal_checklist: object -- Spring, summer, fall, and winter preparation tasks specific to your climate
- cost_projection: object -- Estimated annual maintenance costs broken down by task, DIY vs. shop pricing
- tracking_log: object -- Template for recording every maintenance task with date, mileage, cost, and notes

## Execution

### Phase 1: VEHICLE PROFILE
**Entry criteria:** Vehicle year, make, model, and current mileage provided.
**Actions:**
1. Identify the specific maintenance schedule for this vehicle. Every manufacturer publishes one in the owner's manual. The dealer's "recommended" schedule often adds unnecessary services -- go by the manual, not the service advisor's clipboard.
2. Determine if the vehicle falls under "normal" or "severe" driving conditions. Most people qualify for severe and don't realize it. Severe includes: frequent short trips (under 10 miles), stop-and-go traffic, dusty roads, extreme temperatures (below 10F or above 90F regularly), towing, or carrying heavy loads. If any of these apply, use the severe schedule -- it has shorter intervals.
3. Document the current state: approximate mileage of last oil change, age and condition of tires (look for wear bars -- if they're level with the tread, you need tires now), when brakes were last inspected, any warning lights currently on, any noises or vibrations.
4. Check for any open recalls: enter the VIN at NHTSA.gov. Recalls are fixed free by the dealer regardless of age or mileage. Unfixed recalls can also affect resale value and, more importantly, your safety.
5. Note the vehicle's known weak points. Every model has them. Google "[year make model] common problems" and check forums. If your 2017 Honda CR-V has the oil dilution issue, you need to check oil more frequently. If your Subaru burns oil, same thing. Knowing the failure modes helps you catch problems early.

**Output:** Vehicle maintenance profile with manufacturer schedule, normal vs. severe classification, current maintenance state, recall status, and known model-specific issues.
**Quality gate:** Maintenance schedule is based on the manufacturer's manual (not dealer upsell). Normal vs. severe driving classification is determined. Open recalls are checked. At least 2 model-specific issues are identified.

### Phase 2: SCHEDULE BUILD
**Entry criteria:** Vehicle profile complete.
**Actions:**
1. Build the mileage-interval schedule. Standard intervals for most modern vehicles:
   - Every 5,000-7,500 miles (or 6 months): oil and filter change, tire rotation, multi-point inspection
   - Every 15,000-20,000 miles: cabin air filter, engine air filter inspection, brake inspection
   - Every 30,000 miles: transmission fluid (if applicable -- many "lifetime" fluids should still be changed), brake fluid flush, coolant inspection, spark plugs (if platinum/iridium, may go 60-100k)
   - Every 60,000 miles: timing belt or chain inspection (belt replacement if equipped -- $600-1,200 at a shop, engine destruction if it breaks), suspension component inspection, drive belt replacement
   - Every 100,000 miles: spark plugs (if not done at 60k), water pump (often done with timing belt), major fluid flush (transmission, coolant, brake, power steering)
2. Adjust intervals for severe conditions: typically cut the oil change interval by 30% (7,500 becomes 5,000), air filters by 40%, and transmission fluid by 25%. Dusty environments are hardest on air filters. Stop-and-go traffic is hardest on transmission fluid and brakes.
3. Map upcoming maintenance by current mileage: if the car has 47,000 miles, list everything due now, at 50k, at 60k, and at 75k. This prevents surprises.
4. Set time-based minimums: even if you don't drive much, oil should be changed at least annually (it degrades over time), brake fluid every 2-3 years regardless of mileage (it absorbs moisture), and coolant every 5 years. Tires should be replaced at 6 years old regardless of tread -- the rubber degrades.
5. Create a simple reminder system: phone calendar events for time-based items, a note on the visor with "next oil change at X miles," and a glove box folder for receipts.

**Output:** Complete mileage-interval maintenance schedule customized to the vehicle and driving conditions, upcoming maintenance list based on current mileage, and reminder system setup.
**Quality gate:** Schedule distinguishes between normal and severe intervals. Time-based minimums are included for low-mileage drivers. Next 3 upcoming maintenance events are identified with estimated dates.

### Phase 3: FLUID & FILTER
**Entry criteria:** Maintenance schedule established.
**Actions:**
1. Create the fluid inventory for the vehicle with exact specifications:
   - **Engine oil:** Weight (0W-20, 5W-30, etc. -- use only what the manual says), capacity (quarts), filter part number, synthetic vs. conventional (if the manual says synthetic, use synthetic -- no debate)
   - **Transmission fluid:** Type (ATF+4, Mercon, CVT-specific, etc. -- using the wrong type can destroy a transmission), capacity for drain-and-fill vs. full flush
   - **Coolant:** Type (many manufacturers now use specific long-life formulas -- don't mix colors), concentration (50/50 pre-mixed or concentrate), capacity
   - **Brake fluid:** DOT rating (DOT 3, DOT 4, DOT 5.1 -- never DOT 5 unless the manual says so), capacity
   - **Power steering fluid:** Type (some use ATF, some use specific PS fluid -- check the cap), capacity
   - **Differential/transfer case fluid:** If AWD or 4WD, gear oil weight and capacity
2. Set check intervals for each fluid: engine oil (every fuel stop -- takes 30 seconds), coolant (monthly -- cold engine only), brake fluid (monthly -- visual level check), transmission (every oil change -- some have no dipstick, needs a shop), power steering (monthly).
3. Create the filter replacement schedule:
   - Engine oil filter: every oil change
   - Engine air filter: inspect every 15k, replace every 30k (sooner in dusty conditions) -- this is a 2-minute DIY job on most cars, shops charge $40-60 for a $15 filter
   - Cabin air filter: every 15-20k or annually -- another easy DIY, $15-20 filter vs. $50-75 at a shop
   - Fuel filter: varies wildly by vehicle (some are lifetime, some need replacement at 60k)
   - Transmission filter: if applicable, with transmission fluid service
4. Show how to check each fluid (for DIY-capable owners): where the dipstick or reservoir is, what the fluid should look like (color and consistency), and what it means if it's dark, milky, or low. Dark brown oil is normal near change time. Milky oil means coolant contamination -- stop driving immediately.
5. Flag any fluids that are commonly wrong at quick-lube shops: wrong oil weight (they often default to 5W-30 when your car needs 0W-20), wrong coolant type (green conventional in a car that needs orange extended-life), and overfilling (too much oil is as bad as too little).

**Output:** Complete fluid specification guide, check and replacement intervals, filter schedule with DIY vs. shop costs, fluid condition guide, and common shop mistakes to watch for.
**Quality gate:** Every fluid specification matches the owner's manual. Check intervals are realistic (not "check everything weekly"). At least 3 common fluid mistakes are flagged. DIY vs. shop cost comparison is included for filters.

### Phase 4: SEASONAL PREP
**Entry criteria:** Climate information and driving conditions provided.
**Actions:**
1. **Winter preparation** (if temps regularly drop below 32F):
   - Tires: switch to winter tires below 45F regularly (all-seasons lose grip below 40F) or verify all-seasons have adequate tread (4/32" minimum for winter -- the penny test isn't enough, use a quarter)
   - Battery: test battery health (most auto parts stores do this free). Cold cranking amps drop significantly in cold weather. If the battery is over 4 years old, replace it proactively -- a $150 battery is cheaper than a tow.
   - Coolant: verify antifreeze protection level (should protect to at least -34F for most climates). Test with a $5 antifreeze tester.
   - Wipers: replace blades, switch to winter blades if heavy snow, fill washer fluid with -20F rated fluid
   - Emergency kit: blanket, flashlight, phone charger, small shovel, kitty litter or sand for traction, jumper cables
2. **Summer preparation** (if temps regularly exceed 85F):
   - Cooling system: inspect hoses for soft spots or cracks, verify coolant level, test AC system (recharge if blowing warm)
   - Tires: check pressure more frequently (heat increases tire pressure -- overinflated tires blow out). Set to the door jamb specification, not the tire sidewall number.
   - Battery: heat actually kills batteries faster than cold. Same 4-year replacement rule applies.
   - Engine: ensure oil is at proper level (engines work harder in heat), check serpentine belt for cracks (heat accelerates rubber degradation)
3. **Road trip preparation** (before any trip over 200 miles):
   - Check all fluid levels
   - Inspect tire condition and pressure (including the spare -- a flat spare is useless)
   - Test all lights (headlights, brake lights, turn signals)
   - Verify registration, insurance, and roadside assistance are current
   - Pack: jumper cables, flashlight, basic tool kit, first aid kit, phone charger, water
4. **Spring/Fall transition:**
   - Spring: wash undercarriage thoroughly (road salt causes rust), inspect brakes (salt and moisture accelerate wear), switch back to all-season tires if using winter set
   - Fall: prepare for earlier darkness (test all lights, clean headlight lenses if cloudy -- a $10 restoration kit makes a huge difference), check heater and defrost operation before you need them

**Output:** Seasonal maintenance checklists for winter, summer, and transitions, road trip preparation checklist, emergency kit list.
**Quality gate:** Seasonal tasks are specific to the user's climate (not generic). Tire guidance includes specific tread depth numbers. Battery replacement is proactive, not reactive. Road trip checklist includes the spare tire.

### Phase 5: COST & TRACKING
**Entry criteria:** Full maintenance schedule established.
**Actions:**
1. Project annual maintenance costs broken down by task:
   - Oil changes: 2-4 per year, $40-80 DIY / $60-120 shop (conventional), $50-100 DIY / $80-150 shop (synthetic)
   - Tires: amortize over 4-5 years, budget $600-1,200 per set depending on vehicle
   - Brakes: front and rear, amortize over 3-5 years, $150-300 DIY / $400-800 shop per axle
   - Major services (60k, 100k): divide by years until due, set aside monthly
   - Unexpected repairs: budget $50-100/month as a repair fund for the inevitable surprise
2. Compare DIY vs. shop costs for each task. Some jobs are easy DIY wins: oil change (saves $30-50), air filters (saves $30-50), wipers (saves $20-30), battery (saves $40-60). Some are not worth DIY: timing belt (requires special tools), transmission service (mess and risk), brake jobs (safety critical unless experienced).
3. Find a trustworthy mechanic before you need one: ask friends for recommendations, check Google and Yelp reviews (but read them -- look for specific positive experiences, not just star ratings), verify ASE certification, start with a small job (oil change) and see how they treat you. A good indie mechanic charges 30-50% less than a dealer for the same work.
4. Set up a tracking log with columns: date, mileage, service performed, parts used (brand and part numbers), cost, shop or DIY, notes. Keep this in a spreadsheet or app. This log is worth money -- it increases resale value and helps you spot patterns (if you're adding oil between changes, that's a problem to catch early).
5. Know what to decline at the dealer/shop: fuel system cleaning (snake oil for modern cars), engine flush (can actually cause damage), transmission flush on high-mileage vehicles that have never had one (can dislodge debris and cause failures), "premium" anything that isn't in your manual.

**Output:** Annual maintenance cost projection, DIY vs. shop comparison, mechanic selection guide, maintenance tracking template, and list of common upsells to decline.
**Quality gate:** Cost projection includes both routine and amortized major services. DIY recommendations match the user's stated skill level. At least 3 common upsells are identified. Tracking template includes all essential fields.

## Exit Criteria
Done when: (1) vehicle-specific maintenance schedule is built with mileage and time intervals, (2) all fluids are documented with correct specifications, (3) seasonal checklists are customized to climate, (4) annual cost projection is complete, (5) tracking system is set up.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| VEHICLE PROFILE | Owner's manual is lost or unavailable | Adjust -- manufacturer maintenance schedules are available online at the brand's website or through repair databases like RepairPal. Use these as authoritative sources. |
| SCHEDULE BUILD | Vehicle has unknown maintenance history (just purchased) | Adjust -- assume nothing has been done recently. Start with a comprehensive inspection (most shops charge $100-150) and reset all intervals from there. |
| FLUID & FILTER | Vehicle uses specialized or hard-to-find fluids | Flag -- some European vehicles require specific fluids that aren't available at auto parts stores. Identify the correct part numbers and order online or through the dealer before the service is due. |
| SEASONAL PREP | Owner lives in a mild climate with no extreme weather | Simplify -- skip the extreme seasonal items, focus on spring/fall general inspections and road trip prep. Even mild climates should do annual battery and tire checks. |
| COST & TRACKING | Maintenance costs exceed the vehicle's value | Escalate -- when annual maintenance plus repairs exceed roughly 50% of the vehicle's market value, it's time to consider replacement. Run the numbers through the car-buying-strategy skill. |

## State Persistence
- Complete service history log (date, mileage, task, cost, provider)
- Upcoming maintenance queue (next 3-5 items due by mileage and date)
- Fluid specifications reference (for quick access during DIY or shop visits)
- Cost tracking by category (to identify if one area is consuming disproportionate budget)
- Tire and battery install dates (for age-based replacement tracking)
- Mechanic and shop contacts with ratings based on experience

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
