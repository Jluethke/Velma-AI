# Energy Audit

Analyzes your household energy usage patterns to find where money is leaking out through the walls, literally and figuratively. Takes your utility bills (electric, gas, water), home details (square footage, age, insulation, windows, HVAC system), and usage habits (thermostat settings, appliance use patterns, occupancy), then produces a ranked list of savings opportunities with estimated dollar impact per month. Designed for the homeowner who opened a winter heating bill and said "that can't be right."

## Execution Pattern: Phase Pipeline

```
PHASE 1: BASELINE     --> Establish current usage and cost from utility data
PHASE 2: HOME PROFILE --> Map home characteristics that affect efficiency
PHASE 3: WASTE HUNT   --> Identify specific sources of energy waste
PHASE 4: SAVINGS PLAN --> Rank opportunities by ROI and generate action plan
```

## Inputs
- `utility_bills`: object -- Last 12 months of electric and gas bills: kWh and therms per month, cost per month, rate structure (flat, tiered, time-of-use). Water bills if relevant (hot water heating)
- `home`: object -- Square footage, year built, stories, insulation type and R-value (if known), window type (single/double/triple pane, age), HVAC system (type, age, SEER/AFUE rating, last serviced), water heater (type, gallons, age), roof material and color, attic insulation, basement/crawlspace condition
- `appliances`: object -- Major appliances: refrigerator (age, size), washer/dryer (gas or electric dryer), dishwasher, oven/stove (gas or electric), space heaters, window AC units, pool pump, hot tub, EV charger
- `habits`: object -- Thermostat settings (day/night/away, summer/winter), shower duration and frequency per person, laundry loads per week, dishwasher runs per week, lights left on habits, electronics standby (TVs, game consoles, computers always on)
- `climate`: object -- (Optional) ZIP code or region for heating/cooling degree day data, typical summer highs, winter lows

## Outputs
- `usage_baseline`: object -- Monthly usage breakdown by category (heating, cooling, hot water, lighting, appliances, phantom loads), year-over-year trend, cost per category
- `waste_sources`: array -- Ranked list of identified waste with estimated monthly cost: e.g., "Thermostat 4F above optimal: $18/month", "15-year-old refrigerator: $12/month excess vs new model"
- `savings_plan`: object -- Ranked action items by ROI: no-cost behavior changes, low-cost fixes ($0-50), medium investments ($50-500), major upgrades ($500+), each with estimated annual savings and payback period
- `efficiency_score`: object -- Home rated on a 1-100 scale across heating, cooling, hot water, lighting, appliances, and envelope (insulation/windows/air sealing)

## Execution

### Phase 1: BASELINE
### Entry Criteria
At least 3 months of utility data provided (12 months preferred for seasonal pattern).
### Actions
1. Calculate monthly energy consumption in standardized units:
   - Electricity: kWh per month. If only dollar amounts, back-calculate at local rate (US average ~$0.16/kWh, varies $0.10-0.35 by state).
   - Natural gas: therms per month (1 therm = 100,000 BTU = 29.3 kWh). If in CCF, multiply by 1.037.
   - Propane: gallons per month (1 gallon = 91,500 BTU).
2. Build monthly usage curve: plot 12 months of kWh and therms. The baseline is the lowest usage month (typically spring/fall with minimal heating or cooling). Everything above that baseline in summer is cooling load, in winter is heating load.
3. Calculate per-square-foot usage:
   - Efficient homes: 5-10 kWh/sqft/year electricity, 25-40 therms/year gas heating (cold climate).
   - Average homes: 10-15 kWh/sqft/year.
   - Inefficient homes: 15-25+ kWh/sqft/year.
4. Compare to regional averages: US average household uses ~10,500 kWh/year electricity, ~500 therms/year gas. Adjust for climate zone.
5. Identify the peak month and its cost. This is the pain point and the biggest opportunity.
6. Calculate total annual energy spend.

### Output
Monthly usage table, baseline consumption, seasonal loads (heating/cooling), per-sqft efficiency, comparison to averages, annual total spend.
### Quality Gate
Usage figures are internally consistent (summer peak matches cooling, winter peak matches heating). Per-sqft numbers are plausible for the home size.

### Phase 2: HOME PROFILE
### Entry Criteria
Baseline established.
### Actions
1. Assess the building envelope:
   - **Insulation:** Attic R-value target by climate zone: Zone 1 (hot) R-30 to R-49, Zone 5-7 (cold) R-49 to R-60. Walls target R-13 to R-21. Below target = heat loss.
   - **Windows:** Single pane loses ~10x more heat than R-19 wall. Double pane with low-E is the minimum modern standard. Windows older than 20 years likely have failed seals (foggy glass = broken seal = single-pane performance).
   - **Air sealing:** Typical older home has air leakage equivalent to leaving a window open 24/7. Gaps around outlets, attic hatch, plumbing penetrations, dryer vent, recessed lights.
2. Assess HVAC system:
   - **Age and efficiency:** Central AC: pre-2006 units are typically SEER 10-12 (minimum now is SEER 15, high-efficiency is 20+). Every SEER point is roughly 7% efficiency gain. Gas furnace: pre-1995 units are 80% AFUE; modern high-efficiency is 95-98% AFUE.
   - **Maintenance:** Dirty filter increases energy use 5-15%. Refrigerant charge off by 10% increases cost 20%. Last professional tune-up date matters.
   - **Ductwork:** Typical duct leakage is 20-30% of conditioned air. Ducts in unconditioned space (attic, crawlspace) are the worst offenders.
3. Assess water heating:
   - Standard tank water heater: 40-50 gallon, electric or gas. Electric is ~$500/year, gas ~$250/year on average.
   - Age matters: efficiency drops 5-10% over 10 years from sediment buildup. Tank heaters over 12 years old are replacement candidates (and flood risks).
   - Tankless saves 20-30% on water heating but has high upfront cost ($2,000-4,000 installed).
4. Assess major appliances:
   - Refrigerators older than 15 years use 2-3x the electricity of current Energy Star models (old: 700+ kWh/year, new: 300-400 kWh/year).
   - Electric dryers: ~$80-120/year. Gas dryers: ~$40-60/year. Heat pump dryers: ~$30-40/year.
   - Dishwashers: modern Energy Star uses 3-4 gallons per cycle vs hand washing at 10-20 gallons.

### Output
Home efficiency profile with rated components, age-based degradation estimates, and initial opportunity flags.
### Quality Gate
Every major system is assessed. Age and efficiency ratings are documented. Obvious deficiencies are flagged.

### Phase 3: WASTE HUNT
### Entry Criteria
Home profile complete.
### Actions
1. **Thermostat waste:** Every degree above 68F in winter adds ~3% to heating costs. Every degree below 78F in summer adds ~3% to cooling costs. Calculate the user's excess: "Thermostat at 73F in winter vs 68F optimal = 15% heating excess. At $150/month peak heating = $22.50/month waste."
2. **Phantom loads:** Typical home has 20-50 devices drawing standby power: TVs (~$3/month each), game consoles (~$2/month), cable boxes (~$2/month), computer monitors, phone chargers, smart speakers. Total phantom load averages 5-10% of electric bill.
3. **Lighting waste:** Incandescent bulbs still in use cost ~$7/bulb/year to operate. LED equivalent: ~$1/bulb/year. Count remaining incandescents. Lights left on in empty rooms: estimate based on habits (3 hours/day x 60W = $8/year per bulb).
4. **Hot water waste:** Showers account for ~17% of residential water heating. A 10-minute shower at 2.5 GPM uses 25 gallons. Dropping to 7-minute showers saves 30% on water heating. Tank temperature above 120F wastes energy and scalding risk.
5. **HVAC waste:** Dirty filter (calculate months since last change; should be every 30-90 days depending on type). Duct leakage in unconditioned spaces. Thermostat not using setback schedules (no away/sleep modes).
6. **Envelope leaks:** If home is pre-1980 and never had energy retrofit, estimate 30% heating/cooling loss through air infiltration. Post-1990 with builder-grade insulation: estimate 15%.
7. **Appliance vintage waste:** For each appliance over 10 years old, calculate the efficiency gap vs current models in dollars per year.
8. **Behavioral waste:** Leaving exterior doors open (15 seconds of open door in winter loses ~1% of a room's heat), running exhaust fans for more than 20 minutes, leaving ceiling fans on in empty rooms (fans cool people, not rooms).

### Output
Ranked waste source list with monthly dollar estimates, organized by category.
### Quality Gate
Every waste source has a dollar estimate, not just "wastes energy." Estimates use the user's actual rate and climate, not national averages.

### Phase 4: SAVINGS PLAN
### Entry Criteria
Waste sources identified and quantified.
### Actions
1. **No-cost behavior changes** (ROI: immediate):
   - Adjust thermostat: 68F winter day, 62F sleep, 60F away. 78F summer day, 82F away. Estimated savings: $ calculated from Phase 3.
   - Shorter showers (7 min target), lower tank temp to 120F.
   - Unplug phantom loads or use smart power strips ($0 if strips already owned).
   - Run dishwasher and laundry with full loads only. Air-dry dishes.
   - Close blinds on sunny windows in summer, open them in winter (passive solar gain).
2. **Low-cost fixes ($0-50, payback under 3 months):**
   - LED bulb replacement: $2-3/bulb, pays for itself in 2-4 months.
   - HVAC filter: $5-20, do it now if overdue.
   - Door/window weatherstripping: $10-20 per door, saves $20-40/year in drafty homes.
   - Outlet and switch plate insulation gaskets: $10 for a pack, reduces air infiltration.
   - Water heater blanket (for old tanks in unconditioned spaces): $20-30, saves $30-45/year.
   - Low-flow showerheads: $10-20, saves 2,700 gallons/year and the energy to heat it.
3. **Medium investments ($50-500, payback under 2 years):**
   - Smart thermostat: $100-250, saves 10-15% on heating/cooling ($100-200/year).
   - Attic insulation top-up (DIY blown-in): $200-500, pays back in 1-3 years if current R-value is below target.
   - Smart power strips for entertainment centers: $25-40 each, eliminate phantom loads automatically.
   - Duct sealing (DIY with mastic): $50-100 in materials, can recover 20-30% of lost conditioned air.
   - Ceiling fans in main rooms: $75-200 each, allows thermostat 4F higher in summer.
4. **Major upgrades ($500+, payback 3-10 years):**
   - HVAC replacement (if over 15 years old): $5,000-12,000, but 30-50% efficiency gain.
   - Window replacement (if single pane): $300-700/window, payback 10-20 years (prioritize by exposure: south/west facing first).
   - Heat pump water heater: $1,200-2,500, saves 60% vs standard electric tank.
   - Solar panels: $15,000-25,000 before incentives, payback 7-12 years depending on rate and sun.
   - Whole-home air sealing (professional): $1,500-3,000, reduces infiltration 25-40%.
5. Generate a prioritized action plan with total estimated annual savings and cumulative payback timeline.

### Output
Four-tier savings plan with dollar amounts, payback periods, and prioritized action list. Total potential savings per month and per year.
### Quality Gate
Every recommendation has a cost estimate, savings estimate, and payback period. No-cost items are listed first. Total annual savings is calculated. No recommendations for systems that are already efficient.


---

## Worked Example

Illustrative only.

Given typical inputs for Analyzes household energy usage to find waste and rank savings opportunities by , the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) baseline usage is quantified with monthly breakdown, (2) home profile identifies at least 3 efficiency deficiencies, (3) waste sources are ranked by dollar impact, (4) savings plan covers all four tiers with specific dollar estimates, (5) total potential annual savings is calculated.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| BASELINE | Less than 3 months of utility data | Adjust -- use available months plus regional averages for missing seasons. Flag lower confidence on seasonal estimates |
| BASELINE | User only has dollar amounts, not kWh | Adjust -- back-calculate using local utility rate. Accuracy drops ~10% but is still useful |
| HOME PROFILE | User doesn't know insulation R-value or HVAC SEER rating | Adjust -- estimate from home age. Pre-1980: R-11 walls, R-19 attic, SEER 8-10. 1990-2005: R-13 walls, R-30 attic, SEER 10-13. 2006+: R-15+ walls, R-38+ attic, SEER 13-16 |
| WASTE HUNT | Usage is already efficient (5-8 kWh/sqft/year) | Report that home is performing well. Focus on behavioral fine-tuning and appliance end-of-life planning rather than overhaul recommendations |
| SAVINGS PLAN | User is renting and can't make structural changes | Filter out upgrades requiring landlord approval. Focus on behavioral, portable (smart plugs, LED bulbs, showerheads), and negotiation ("ask landlord to seal ducts -- reduces their maintenance costs too") |
| ACT | User rejects a recommendation as impractical | Remove it, recalculate total savings, note the gap |

## State Persistence
- Utility bill history (track month-over-month and year-over-year trends after changes)
- Completed improvements log (what was done, when, actual vs estimated savings)
- Home inventory updates (new appliance, new insulation, HVAC replaced)
- Seasonal comparison (did this winter cost less than last winter after changes?)

## Reference

### Energy Cost Reference (US Average, 2024)

| Category | Typical Annual Cost | % of Total |
|---|---|---|
| Heating (gas) | $600-1,200 | 29% |
| Cooling (electric) | $300-600 | 13% |
| Water heating | $300-600 | 14% |
| Lighting | $150-300 | 10% |
| Appliances | $400-800 | 20% |
| Electronics/phantom | $150-300 | 10% |
| Other | $100-200 | 4% |

### Insulation R-Value Targets by Climate Zone

| Climate Zone | Attic | Wall | Floor |
|---|---|---|---|
| Zone 1 (FL, HI) | R-30 to R-49 | R-13 | R-13 |
| Zone 2 (Gulf Coast, S. TX) | R-30 to R-60 | R-13 to R-15 | R-13 |
| Zone 3 (SE, S. Plains) | R-30 to R-60 | R-13 to R-15 | R-19 |
| Zone 4 (Mid-Atlantic, Midwest) | R-38 to R-60 | R-13 to R-21 | R-19 to R-25 |
| Zone 5-6 (N. Plains, NE) | R-49 to R-60 | R-13 to R-21 | R-25 to R-30 |
| Zone 7 (MN, WI, ME) | R-49 to R-60 | R-21 | R-25 to R-30 |

### HVAC Efficiency by Era

| Era | AC SEER | Furnace AFUE | Heat Pump HSPF |
|---|---|---|---|
| Pre-1992 | 6-10 | 65-80% | 5-7 |
| 1992-2005 | 10-13 | 78-82% | 6.8-8 |
| 2006-2014 | 13-16 | 80-92% | 7.7-9 |
| 2015-2022 | 14-21 | 90-98% | 8.2-10 |
| 2023+ | 15-26 (SEER2) | 92-98% | 8.8-13 |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
