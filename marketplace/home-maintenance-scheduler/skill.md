# Home Maintenance Scheduler

Builds a month-by-month home maintenance calendar based on your home type, age, climate zone, and systems installed. Tracks what's due, what's overdue, and estimates costs. Designed for homeowners who know they should be maintaining things but have no idea what or when.

## Execution Pattern: ORPA Loop

## Inputs
- home_profile: object -- Home type (house/condo/townhouse), approximate age, square footage, number of stories, foundation type (slab/crawl space/basement)
- systems: object -- HVAC type (central/mini-split/window), water heater (tank/tankless), roof material (asphalt/metal/tile), major appliances with approximate ages
- climate: string -- Climate zone or zip code (determines seasonal maintenance timing)
- last_maintenance: object -- (Optional) What was last done and when (e.g., "HVAC serviced March 2025", "gutters cleaned never")

## Outputs
- annual_calendar: object -- Month-by-month maintenance tasks organized by season
- overdue_items: array -- Tasks that should have been done already based on system ages and last maintenance
- cost_estimates: object -- Estimated cost per task (DIY vs professional)
- priority_ranking: array -- Tasks ranked by consequence of neglect (what breaks first if ignored)

## Execution

### OBSERVE: Home Assessment
**Entry criteria:** Basic home profile provided.
**Actions:**
1. Catalog all maintainable systems: HVAC, plumbing, electrical, roof, gutters, foundation, appliances, exterior paint/siding, landscaping, pest control, chimney, garage door, water softener, septic/sewer, deck/patio.
2. Estimate system ages from home age if not provided. Flag anything over 75% of expected lifespan.
3. Map climate zone to seasonal patterns: when does heating season start, when to winterize, freeze risk months, hurricane/tornado season, wildfire season.
4. Identify what's overdue based on last maintenance dates and recommended intervals.

**Output:** System inventory with ages, conditions, and climate-adjusted maintenance intervals.
**Quality gate:** Every major system is inventoried. Climate zone is mapped. Overdue items are flagged.

### REASON: Build the Schedule
**Entry criteria:** System inventory complete.
**Actions:**
1. Assign each task to optimal month based on:
   - **Before you need it:** Service HVAC in spring (before summer) and fall (before winter).
   - **When weather allows:** Exterior paint, roof inspection, gutter cleaning in dry months.
   - **When it's cheapest:** HVAC off-season, tree trimming in winter (arborists are less busy).
2. Set frequencies: monthly (HVAC filter), quarterly (check smoke detectors), biannual (gutter cleaning), annual (roof inspection), multi-year (exterior paint every 5-7 years).
3. Flag tasks the homeowner can DIY vs. tasks needing a professional (e.g., HVAC filter = DIY, HVAC service = pro).
4. Estimate time per task: change HVAC filter (5 min), clean gutters (2-3 hours), service furnace (1 hour pro visit).
5. Rank by consequence of neglect: water damage from clogged gutters > cosmetic issues from faded paint.

**Output:** Month-by-month calendar with tasks, frequency, DIY/pro designation, time estimate, and priority.
**Quality gate:** Every month has at least one task. Critical systems (HVAC, roof, water heater) have scheduled maintenance.

### PLAN: Cost and Resource Prep
**Entry criteria:** Calendar built.
**Actions:**
1. Estimate costs per task: DIY material cost vs professional service cost. Use regional averages.
2. Calculate annual maintenance budget (rule of thumb: 1-2% of home value per year, but itemize it).
3. Identify tasks that can be bundled (e.g., when the HVAC tech is there, also check the water heater).
4. Note seasonal sales: buy furnace filters in bulk during summer, exterior paint at end-of-season sales.
5. Create a vendor contact list template: HVAC company, plumber, electrician, roofer, pest control, landscaper.

**Output:** Cost estimates per task, annual budget projection, bundling opportunities, vendor list template.
**Quality gate:** Every professional task has a cost estimate. Annual total is calculated.

### ACT: Deliver the Calendar
**Entry criteria:** Calendar and costs are complete.
**Actions:**
1. Format as a 12-month calendar with tasks organized by month.
2. Highlight overdue items at the top with recommended action timeline.
3. Include a "quick reference" card: the 10 most important maintenance tasks and their intervals.
4. Write task instructions at a homeowner level (not a contractor level). Include what to look for during inspections.
5. Add a "red flag" guide: signs something is failing and needs immediate attention (water stains on ceiling = roof leak, strange HVAC smells = potential carbon monoxide, foundation cracks wider than 1/4 inch).

**Output:** Complete annual maintenance calendar with instructions, costs, priorities, and red flag warnings.
**Quality gate:** Calendar is actionable (tells you what to do, not just what to check). Red flags are safety-focused.

## Exit Criteria
Done when: (1) 12-month calendar covers all major home systems, (2) overdue items are identified, (3) costs are estimated for each task, (4) tasks are ranked by priority, (5) red flag guide is included.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Home age unknown | Adjust -- estimate from neighborhood era, note increased uncertainty in system age estimates |
| OBSERVE | Condo/townhouse with HOA | Adjust -- exclude exterior maintenance handled by HOA, focus on interior systems |
| REASON | Climate zone ambiguous | Adjust -- use nearest major city's climate pattern, note assumption |
| PLAN | Budget constraint is very tight | Adjust -- prioritize safety-critical tasks (carbon monoxide, water damage, fire risk), defer cosmetic maintenance |

## State Persistence
- Maintenance log (what was done, when, by whom, cost)
- System replacement dates and warranty info
- Vendor contacts and service history
- Cost history (actual vs estimated, to improve future estimates)
- Seasonal reminders (what's coming up next month)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
