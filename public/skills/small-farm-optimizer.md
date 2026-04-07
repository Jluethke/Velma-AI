# Small Farm Optimizer

Optimizes small farm production from land assessment through harvest tracking -- selecting climate-matched crops scored by yield, nutrition, and market value, building planting and rotation calendars with companion planting, allocating water and labor resources across plots, and monitoring yields with soil health indicators season over season.

## Execution Pattern: Phase Pipeline

## Inputs
- land_area: object -- Total cultivable area, plot divisions, topography (flat, sloped, terraced), sun exposure
- climate_zone: string -- USDA hardiness zone or equivalent, frost dates (last spring, first fall), annual rainfall, temperature range
- soil_type: string -- Primary soil type (clay, loam, sandy, silt) and any available soil test results (pH, NPK, organic matter %)
- water_availability: object -- Source (well, municipal, rain catchment, irrigation canal), volume (gallons/week or liters/day), reliability (year-round vs seasonal)
- labor_hours: number -- Available person-hours per week for farm work (planting, maintenance, harvesting, processing)
- goals: object -- Primary objectives ranked: maximum yield, maximum nutrition, market revenue, self-sufficiency, soil building, minimum input cost

## Outputs
- crop_selection: array -- Recommended crops with scoring matrix (yield x nutrition x market value x climate fit x labor requirement)
- planting_calendar: object -- Month-by-month planting and harvest schedule with succession planting timing
- rotation_plan: object -- Multi-year crop rotation by plot, with cover crop integration
- resource_allocation: object -- Water, fertilizer, and labor budget per plot per month
- yield_tracking: object -- Expected vs actual yield comparison with soil health indicators

## Execution

### Phase 1: ASSESS -- Land and Resource Inventory
**Entry criteria:** Land area and climate zone provided.
**Actions:**
1. Map the farm: divide total area into logical plots based on sun exposure, soil variation, water access, and topography.
   - South-facing slopes: warm-season crops, earliest planting
   - North-facing or shaded: cool-season crops, shade-tolerant species
   - Low areas: water-loving crops, avoid frost pockets
   - Near water source: high-water crops, nursery/seedling area
2. Assess soil per plot:
   - If soil test available: record pH, nitrogen (N), phosphorus (P), potassium (K), organic matter %, cation exchange capacity (CEC).
   - If no soil test: assess by type:
     - Clay: nutrient-rich, poor drainage, compacts easily. Amend with compost, gypsum.
     - Sandy: drains fast, low nutrients, warms quickly. Amend with compost, mulch heavily.
     - Loam: ideal balance. Maintain with compost and cover crops.
     - Silt: fertile, moderate drainage. Watch for compaction.
   - Target pH: 6.0-7.0 for most vegetables. Blueberries need 4.5-5.5. Brassicas tolerate up to 7.5.
3. Calculate growing season: days between last spring frost and first fall frost. This determines which crops are viable.
4. Inventory water: calculate total weekly water budget. Estimate crop water needs (rule of thumb: 1 inch of water per week per 100 sq ft during growing season = ~62 gallons).
5. Inventory labor: map person-hours to seasonal demands. Spring planting and fall harvest are 2-3x normal maintenance labor.

**Output:** Farm map with plots, soil profiles per plot, growing season length, water budget, labor calendar.
**Quality gate:** Every plot has a soil assessment. Growing season is calculated from frost dates. Water budget is sufficient for at least 60% of cultivable area. If not, flag water as primary constraint.

### Phase 2: PLAN -- Crop Selection and Scoring
**Entry criteria:** Farm map and resource inventory complete.
**Actions:**
1. Build a candidate crop list filtered by climate zone and growing season length.
   - Only include crops whose "days to maturity" fits within the growing season.
   - For short seasons: prioritize fast-maturing varieties or transplant-started crops.
2. Score each candidate crop across five dimensions (each 1-10):
   - **Yield per area:** lbs produced per 100 sq ft. Tomatoes (10), lettuce (7), corn (3).
   - **Nutritional density:** calories, protein, vitamins per lb. Kale (9), potatoes (8), lettuce (3).
   - **Market value:** $/lb at local market or farmstand. Herbs (10), tomatoes (7), squash (4).
   - **Climate fit:** how well it thrives in local conditions (temp, humidity, rainfall). Native/adapted crops score highest.
   - **Labor efficiency:** hours of work per lb of harvest. Squash (9, plant and forget), tomatoes (5, staking + pruning), strawberries (3, intensive).
3. Weight scores by user goals:
   - Self-sufficiency: weight yield + nutrition highest
   - Market revenue: weight market value + yield highest
   - Minimum labor: weight labor efficiency highest
4. Select top 8-15 crops that cover nutritional diversity and maximize weighted score.
5. Identify companion planting combinations among selected crops:
   - The Three Sisters: corn + beans + squash (nitrogen fixing + shade + ground cover)
   - Tomato + basil + marigold (pest repellent + pollinator attraction)
   - Carrots + onions (each repels the other's pest fly)
   - Avoid antagonistic pairings: tomatoes near brassicas, onions near beans, fennel near most crops.

**Output:** Scored crop list with selections, companion planting map, per-plot crop assignments.
**Quality gate:** Selected crops span at least 3 plant families (for rotation). Companion pairings have no antagonistic conflicts. Total water requirement of selected crops does not exceed water budget.

### Phase 3: SCHEDULE -- Planting and Harvest Calendar
**Entry criteria:** Crop selections and plot assignments complete.
**Actions:**
1. Build month-by-month planting calendar:
   - Calculate planting dates by working backward from harvest and forward from last frost:
     - Direct sow date = last frost date + (days after frost safe to plant)
     - Indoor start date = direct sow date - transplant lead time (typically 6-8 weeks)
   - Sequence: cool-season crops (lettuce, peas, spinach) go out 2-4 weeks before last frost. Warm-season (tomatoes, peppers, squash) go out 1-2 weeks after.
2. Plan succession planting for continuous harvest:
   - Fast crops (lettuce, radish, beans): plant a new batch every 2-3 weeks through the season.
   - One-harvest crops (garlic, potatoes, winter squash): single planting, timed for optimal maturity.
3. Plan fall/winter crops:
   - Count backward from first fall frost to determine latest planting dates.
   - Cold-hardy crops for late season: kale, carrots, beets, garlic (planted in fall for spring harvest).
4. Schedule cover crops for fallow plots:
   - Summer cover: buckwheat (pollinator attractant, quick biomass)
   - Winter cover: crimson clover (nitrogen fixer), winter rye (erosion prevention, weed suppression)
5. Build harvest calendar: expected harvest windows per crop, storage/preservation needs.

**Output:** Month-by-month planting calendar with indoor start dates, direct sow dates, succession plantings, harvest windows, and cover crop timing.
**Quality gate:** No crop is planted outside its safe temperature window. Succession plantings don't exceed plot capacity. Cover crops are scheduled for every fallow period.

### Phase 4: OPTIMIZE -- Resource Allocation
**Entry criteria:** Planting calendar complete.
**Actions:**
1. **Water allocation by plot:**
   - Calculate weekly water needs per plot based on crops, growth stage, and weather.
   - Seedling/transplant stage: higher frequency, lower volume (keep soil moist, not saturated).
   - Fruiting stage: highest water demand (tomatoes, squash, melons).
   - Maturation stage: reduce water (improves flavor concentration in tomatoes, prevents rot in squash).
   - Prioritization if water is limited: fruiting crops > leafy greens > root vegetables > established perennials.
   - Efficiency measures: drip irrigation (90% efficiency) > soaker hose (80%) > sprinkler (60%) > hand watering (varies).
   - Mulch all beds 2-4 inches deep (reduces water needs 25-50%, suppresses weeds, moderates soil temperature).
2. **Fertilizer allocation:**
   - Heavy feeders (tomatoes, corn, squash): compost + side-dress with nitrogen mid-season.
   - Moderate feeders (peppers, brassicas, roots): compost at planting, one side-dress.
   - Light feeders (beans, peas, herbs): compost only. Legumes fix their own nitrogen -- do NOT fertilize with nitrogen.
   - Organic options: compost (balanced NPK), blood meal (nitrogen), bone meal (phosphorus), wood ash (potassium), fish emulsion (quick N).
3. **Labor allocation:**
   - Weekly maintenance: weeding (largest time sink), watering, pest scouting, harvesting.
   - Peak periods: spring planting (bed prep + transplant), fall harvest (picking + preservation).
   - Labor-saving investments ranked by ROI: mulching (#1), drip irrigation (#2), raised beds (#3), season extension (row cover).

**Output:** Weekly resource budget: water (gallons/plot), fertilizer (type/amount/timing), labor (hours/task), efficiency recommendations.
**Quality gate:** Total water allocation does not exceed budget. Nitrogen-fixing crops are not over-fertilized. Labor hours fit within user's availability (with 20% buffer for unexpected tasks).

### Phase 5: MONITOR -- Yield Tracking and Soil Health
**Entry criteria:** Growing season is underway or complete.
**Actions:**
1. Track yield per crop per plot:
   - Record: lbs harvested, harvest date, quality rating (1-5).
   - Calculate: actual yield per 100 sq ft vs expected yield.
   - Compare season-over-season: is yield trending up (soil improving), flat (maintaining), or down (soil depleting)?
2. Monitor soil health indicators:
   - **Biological:** Earthworm count (dig 1 cubic foot, count worms. Target: 10+ in healthy soil). Visible fungal activity in compost/mulch.
   - **Physical:** Water infiltration rate (pour 1 inch of water, measure time to absorb. >1 hour = compaction issue). Soil aggregation (crumbles, not clods).
   - **Chemical:** Annual soil test for pH, NPK, organic matter %. Track trends.
3. Diagnose yield declines:
   - Same crop, declining yield: soil depletion, disease buildup (rotate!), pest pressure increase.
   - All crops declining: soil organic matter dropping, pH drifting, water issues.
   - Single-year drop: weather anomaly (compare to regional averages), new pest/disease.
4. Generate season report:
   - Top performers (best yield, best ROI, best nutritional output)
   - Underperformers (why? actionable fixes)
   - Soil health trends
   - Recommendations for next season (crop swaps, rotation adjustments, soil amendments)

**Output:** Season yield report, soil health indicators, crop performance ranking, next-season recommendations.
**Quality gate:** Every planted crop has a yield record. At least one soil health metric is tracked. Recommendations are specific and actionable ("add 2 inches of compost to plot B to restore organic matter" not "improve soil").

## Exit Criteria
One cycle completes when a season report with yield data and next-season recommendations is delivered. The pipeline restarts for each new growing season with updated soil data and adjusted crop selections.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | Climate zone unknown | Adjust -- estimate from latitude, elevation, and user-reported frost dates |
| ASSESS | No soil test data | Adjust -- use soil type defaults, strongly recommend a soil test ($15-30 through agricultural extension) |
| PLAN | Water budget insufficient for selected crops | Adjust -- substitute drought-tolerant varieties, add mulching requirement, reduce planted area |
| SCHEDULE | Growing season too short for desired crops | Adjust -- recommend season extension (row cover, cold frame, greenhouse) or substitute fast-maturing varieties |
| OPTIMIZE | Labor hours insufficient for farm size | Adjust -- reduce cultivated area to match labor, prioritize highest-ROI crops, recommend labor-saving infrastructure |
| MONITOR | No yield data collected | Skip -- deliver generic rotation plan, emphasize importance of record-keeping for next season |

## Reference

### USDA Hardiness Zones (Condensed)
| Zone | Avg Min Temp (F) | Example Regions | Key Crops |
|---|---|---|---|
| 3-4 | -40 to -20 | Northern plains, mountains | Cold-hardy roots, brassicas, short-season crops |
| 5-6 | -20 to 0 | Upper Midwest, Northeast | Wide variety with season extension |
| 7-8 | 0 to 20 | Mid-Atlantic, Pacific NW, Southeast | Long season, some overwintering |
| 9-10 | 20 to 40 | Deep South, coastal California | Year-round growing, tropical options |

### Crop Yield Benchmarks (per 100 sq ft)
| Crop | Expected Yield (lbs) | Days to Maturity | Water Need |
|---|---|---|---|
| Tomatoes | 50-100 | 70-85 | High |
| Potatoes | 50-80 | 80-120 | Moderate |
| Zucchini/Squash | 40-80 | 50-65 | Moderate |
| Green beans | 15-25 | 50-60 | Moderate |
| Lettuce | 10-15 | 30-45 | Moderate |
| Kale | 15-25 | 55-75 | Low-Moderate |
| Carrots | 20-40 | 60-80 | Low |
| Peppers | 15-30 | 65-85 | Moderate |
| Garlic | 10-15 | 240 (fall planted) | Low |
| Herbs (basil) | 5-10 | 30-60 | Low |

### Four-Year Rotation Framework
- **Year 1:** Solanaceae (tomatoes, peppers, potatoes) -- heavy feeders
- **Year 2:** Legumes (beans, peas) -- nitrogen fixers, restore soil
- **Year 3:** Brassicas (cabbage, broccoli, kale) -- moderate feeders, use stored nitrogen
- **Year 4:** Alliums + roots (onions, garlic, carrots, beets) -- light feeders, break pest cycles
- **Cover crop** in any fallow slot between rotations.

### Companion Planting Quick Reference
| Crop | Good Companions | Bad Companions |
|---|---|---|
| Tomatoes | Basil, marigold, carrot, parsley | Brassicas, fennel, corn |
| Beans | Corn, squash, beets, carrots | Onions, garlic, fennel |
| Brassicas | Onions, beets, celery, dill | Tomatoes, strawberries |
| Corn | Beans, squash, sunflower | Tomatoes |
| Squash | Corn, beans, marigold, nasturtium | Potatoes |
| Carrots | Onions, leeks, rosemary, lettuce | Dill |

### Soil Amendment Guide
| Issue | Amendment | Rate |
|---|---|---|
| Low organic matter (<3%) | Compost | 2-4 inches, till or top-dress |
| Low nitrogen | Blood meal or clover cover crop | Per product label / plant as cover |
| Low phosphorus | Bone meal | 10 lbs per 100 sq ft |
| Low potassium | Wood ash or greensand | 5 lbs per 100 sq ft |
| pH too low (<6.0) | Agricultural lime | Per soil test recommendation |
| pH too high (>7.5) | Sulfur or pine needle mulch | Per soil test recommendation |
| Clay compaction | Gypsum + compost | 40 lbs gypsum + 3 inches compost per 100 sq ft |

### State Persistence
Tracks over seasons:
- Crop yields per plot per season
- Soil test results over time
- Water usage per crop
- Rotation history per plot
- Weather data (rainfall, temperature extremes, frost dates)
- Pest and disease occurrence records
