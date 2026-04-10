# Relocation Comparator

**One-line description:** Generate a weighted-scoring decision matrix comparing candidate cities across cost of living, job market, quality of life, climate, and personal priorities.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `candidate_cities`: string[] -- List of 2-10 cities to compare (e.g., ["Austin, TX", "Denver, CO", "Portland, OR"]). **Required.**
- `evaluation_criteria`: object[] -- Array of criterion objects, each with `name` (string), `weight` (number 0-100), `description` (string), and `type` (string: "hard_constraint", "weighted_preference", or "informational"). Examples: {"name": "Cost of Living", "weight": 25, "description": "Monthly expenses and affordability", "type": "weighted_preference"}, {"name": "Visa Sponsorship Required", "weight": null, "description": "Employer visa sponsorship available", "type": "hard_constraint"}. Weights for "weighted_preference" criteria must sum to 100. **Required.**
- `user_profession`: string -- User's job title or industry (e.g., "Software Engineer", "Healthcare"). Used to contextualize job market data. **Optional; default: "General".**
- `climate_preference`: string -- User's climate preference (e.g., "Warm year-round", "Four seasons", "Low humidity"). **Optional; default: "No preference".**
- `budget_range`: object -- Optional budget constraints: `{"min_monthly": number, "max_monthly": number}`. Used to filter or flag cities. **Optional.**
- `data_sources`: string[] -- Preferred data sources (e.g., ["Numbeo", "Glassdoor", "Niche", "user_research"]). Sources should be current within 6 months. **Optional; default: ["public_indices"].**
- `hard_constraints`: object[] -- Optional array of must-have criteria that eliminate cities if not met. Example: {"criterion": "Visa Sponsorship Required", "required_value": true}. Cities failing any hard constraint are excluded before scoring. **Optional.**

## Outputs

- `ranked_cities`: object[] -- Array of cities ranked by composite score (highest first). Each object: `{"rank": number, "city": string, "composite_score": number, "criterion_scores": {"Cost of Living": number, ...}, "summary": string, "strengths": string[], "weaknesses": string[]}`.
- `comparison_matrix`: object -- Detailed matrix with all normalized scores: `{"cities": [...], "criteria": [...], "scores": [[...], ...], "weights": {...}, "normalization_formulas": {...}}`.
- `trade_offs_summary`: string -- Narrative summary of key trade-offs (e.g., "City A has the lowest cost of living but weakest job market. City B balances all factors but is most expensive.").
- `sensitivity_analysis`: object[] -- Array of sensitivity scenarios: `{"scenario": string, "affected_criterion": string, "weight_change_percent": number, "new_ranking": string[], "interpretation": string}`.
- `recommendation`: string -- Top-level recommendation with caveats (e.g., "Austin ranks highest overall, but if job market is more important than initially weighted, Denver becomes competitive. Consider a 3-6 month trial period before permanent relocation.").
- `validation_checklist`: object -- Checklist of in-person validation items for top 3 cities (e.g., commute times, neighborhood feel, local food scene, proximity to personal network).

---

## Execution Phases

### Phase 1: Define, Validate, and Categorize Criteria

**Entry Criteria:**
- `evaluation_criteria` input is provided.
- At least 2 criteria are defined.

**Actions:**
1. Separate criteria into three categories: hard_constraints (must-have, no weight), weighted_preferences (scored and weighted), and informational (data-only, no weight).
2. For hard_constraints, validate that each has a clear required_value (e.g., "Visa Sponsorship Required: true").
3. For weighted_preferences, validate that criterion weights sum to 100. If not, normalize them proportionally and document the adjustment.
4. For each weighted_preference criterion, confirm it is one of the five core categories (Cost of Living, Job Market, Quality of Life, Climate, Personal Priorities) or a sub-category thereof.
5. Document the weight distribution and user's stated priorities.
6. Flag any criteria with weight < 5 as "minimal influence" for user awareness.
7. Create a summary of hard constraints that will eliminate cities (e.g., "Cities without visa sponsorship will be excluded").

**Output:**
- Validated `criteria_list`: array of {name, type, normalized_weight (if weighted_preference), description}.
- `weight_distribution_summary`: string describing the priority balance among weighted_preferences.
- `hard_constraints_summary`: string listing constraints that will filter cities.

**Quality Gate:**
- Weighted_preference weights sum to exactly 100.
- Each criterion has a clear definition and type.
- Hard constraints have measurable required values.
- User can articulate why each weight was chosen.

---

### Phase 2: Identify, Validate, and Pre-Filter Candidate Cities

**Entry Criteria:**
- `candidate_cities` input is provided.
- At least 2 cities are listed.
- Hard constraints from Phase 1 are available.

**Actions:**
1. Validate that each city name is recognized (city, state/country format).
2. Check for duplicates; remove if found.
3. Confirm that 2-10 cities are in scope (abort if <2 or >10; suggest narrowing or splitting into multiple comparisons).
4. For each hard constraint, evaluate whether each city meets the constraint (e.g., does the city have visa sponsorship available?). Flag cities that fail any hard constraint.
5. Remove cities that fail hard constraints from the candidate list. Document which cities were eliminated and why.
6. If all cities are eliminated by hard constraints, abort and ask user to relax constraints or add new cities.
7. Document geographic diversity of remaining cities (e.g., "3 West Coast, 2 Midwest, 2 Northeast").

**Output:**
- Validated `city_list`: array of {city_name, region, country} for cities passing hard constraints.
- `eliminated_cities`: array of {city_name, failed_constraint, reason}.
- `geographic_summary`: string.

**Quality Gate:**
- All remaining cities are valid and distinct.
- Remaining city count is within 2-10 range.
- Hard constraint filtering is documented.
- Geographic diversity is noted.

---

### Phase 3: Gather Cost of Living Data

**Entry Criteria:**
- `city_list` is validated (post-hard-constraint filtering).
- Data sources are identified.

**Actions:**
1. For each city, retrieve or estimate cost of living index (e.g., Numbeo, Expatica, or local research). Data must be from within the past 6 months.
2. If available, break down by category: housing (rent/mortgage), food, transportation, utilities, entertainment.
3. If `budget_range` is provided, flag cities outside the range as "over budget" or "under budget" with variance in percentage.
4. Normalize all costs to a common baseline (e.g., USD per month, or index 100 = national average).
5. Document data freshness (e.g., "Q4 2024") and source reliability (e.g., "Numbeo user-reported, n=150 samples").
6. If data is unavailable for a city, use regional average and flag as "estimated".
7. Calculate cost-of-living trend (if historical data available): note whether each city's cost is rising, stable, or declining over the past 12 months.

**Output:**
- `cost_of_living_data`: object with per-city cost index, breakdown by category, data freshness, source reliability, and trend.
- `budget_compliance`: array of {city, in_budget: boolean, variance_percent: number, status: "within_budget"|"over_budget"|"under_budget"}.
- `cost_trend_analysis`: object with per-city trend (rising/stable/declining) and annual change percentage.

**Quality Gate:**
- All cities have a cost of living estimate.
- Data is from the same time period (within 6 months).
- Any estimates are flagged as such.
- Cost trends are documented where available.
- Budget compliance is clear.

---

### Phase 4: Gather Job Market Data

**Entry Criteria:**
- `city_list` is validated.
- `user_profession` is provided or defaulted.

**Actions:**
1. For each city, research job availability in user's field (e.g., via Glassdoor, LinkedIn, Indeed, local job boards). Data must be from within the past 6 months.
2. Estimate: number of open positions, median salary, unemployment rate, industry presence, and career growth potential (is the industry growing or declining?).
3. If `user_profession` is "General", use overall employment metrics.
4. Normalize job market strength to a 0-100 scale (0 = very weak, 100 = very strong).
5. Document data source, recency, and sample size (e.g., "Glassdoor: 245 open positions as of Nov 2024").
6. For each city, assess career growth potential: is the industry growing (>2% annual growth), stable (0-2%), or declining (<0%)? Document the growth rate.
7. If job market data is unavailable for user's specific profession, use general employment metrics and note the limitation.

**Output:**
- `job_market_data`: object with per-city job availability, median salary, unemployment rate, industry presence, normalized score, and career growth potential.
- `career_growth_analysis`: object with per-city industry growth rate and trend.

**Quality Gate:**
- All cities have job market data.
- Salary data is from the same time period.
- Job availability is contextualized to user's profession (or noted as general if profession-specific data unavailable).
- Career growth potential is documented for each city.

---

### Phase 5: Gather Quality of Life Data

**Entry Criteria:**
- `city_list` is validated.

**Actions:**
1. For each city, research quality of life metrics: safety (crime rate per 100k), schools (education quality index), healthcare (hospital availability, quality rating), culture (museums, arts venues, dining options), recreation (parks, outdoor activities).
2. Use sources like Niche, Numbeo, local government data, or user research. Data must be from within the past 12 months.
3. Normalize each sub-metric to 0-100 scale (0 = worst, 100 = best).
4. If user has specified sub-metric priorities (e.g., "schools are most important"), weight the sub-metrics accordingly when aggregating. Otherwise, aggregate into a composite "Quality of Life" score using equal weighting (average of sub-metrics).
5. Document data sources, recency, and any subjective elements (e.g., "based on Niche user reviews, n=500 reviews").
6. If a sub-metric is unavailable for a city, note it and use available sub-metrics only; do not estimate.

**Output:**
- `quality_of_life_data`: object with per-city scores for safety, schools, healthcare, culture, recreation, composite QoL score, and data sources.
- `qol_sub_metric_weights`: object showing how sub-metrics were weighted (equal or user-specified).

**Quality Gate:**
- All cities have QoL data for at least 4 of 5 sub-metrics.
- Data is current (within 12 months).
- Any subjective ratings are sourced and sample sizes are documented.
- Missing sub-metrics are noted, not estimated.

---

### Phase 6: Gather Climate Data

**Entry Criteria:**
- `city_list` is validated.
- `climate_preference` is provided or defaulted.

**Actions:**
1. For each city, retrieve climate data: average high/low temperatures (by season), precipitation (annual and monthly), humidity (average and range), sunshine hours (annual), extreme weather frequency (hurricanes, tornadoes, earthquakes, blizzards).
2. Use sources like NOAA, Weather Underground, or climate databases. Data should be 10-year averages (e.g., "1990-2020 average").
3. If `climate_preference` is provided, score each city's climate alignment (0-100 scale, where 100 = perfect match). Use explicit scoring rules: e.g., "Warm year-round: score 100 if avg winter low >= 50F and avg summer high <= 95F; score 50 if avg winter low >= 40F and avg summer high <= 100F; score 0 otherwise."
4. If no preference is stated, provide climate data without scoring (informational only).
5. Document any extreme weather risks and their frequency (e.g., "Hurricanes: 1 major hurricane every 5 years on average").
6. For each city, note the best and worst seasons for weather.

**Output:**
- `climate_data`: object with per-city temperature ranges (by season), precipitation, humidity, sunshine hours, climate score (if preference given), extreme weather risks, and best/worst seasons.
- `climate_scoring_rules`: string documenting the explicit rules used to score climate alignment (if preference given).

**Quality Gate:**
- All cities have climate data.
- Climate scoring is transparent and reproducible (explicit rules documented).
- Extreme weather risks are documented with frequency.
- Data is based on multi-year averages (not single-year anomalies).

---

### Phase 7: Normalize Scores Across Criteria

**Entry Criteria:**
- Data from Phases 3-6 is complete.
- All raw data is in different units (cost in USD, job market as count, QoL as index, climate as temperature).

**Actions:**
1. For each weighted_preference criterion, identify the raw data range (e.g., cost of living: $1,500-$3,500/month; job market: 50-500 open positions).
2. Apply min-max normalization: `normalized_score = ((value - min) / (max - min)) * 100`.
3. For criteria where lower is better (cost of living), invert the scale: `normalized_score = 100 - ((value - min) / (max - min)) * 100`.
4. For criteria where higher is better (job market, QoL, climate), use standard normalization without inversion.
5. Document the normalization formula for each criterion, including the min/max values used.
6. Validate that all normalized scores are 0-100. If any score is outside this range, review the formula and recalculate.
7. Round normalized scores to 1 decimal place.

**Output:**
- `normalized_scores`: object with per-city, per-criterion normalized scores (0-100).
- `normalization_formulas`: object documenting the formula applied to each criterion, including min/max values and inversion logic.
- `normalization_validation`: object confirming all scores are 0-100 and no errors occurred.

**Quality Gate:**
- All normalized scores are between 0 and 100.
- Inversion logic is correct (lower cost = higher score).
- Formulas are reproducible and documented.
- All formulas use the same min/max values across all cities (no per-city adjustments).

---

### Phase 8: Calculate Weighted Composite Scores

**Entry Criteria:**
- Normalized scores from Phase 7 are complete.
- Validated criteria weights from Phase 1 are available.

**Actions:**
1. Validate that weighted_preference weights sum to exactly 100. If not, abort and return to Phase 1.
2. For each city, calculate: `composite_score = sum(normalized_score[criterion] * weight[criterion] / 100)` for all weighted_preference criteria only (exclude hard_constraints and informational criteria).
3. Round composite scores to 1 decimal place.
4. Rank cities by composite score (highest first).
5. Calculate score gaps between adjacent cities (e.g., "Austin leads Denver by 3.2 points").
6. Identify any ties (composite scores identical to 1 decimal place). If ties exist, note them and prepare tie-breaking criteria (e.g., "Both score 78.5; City A has better job market, City B is cheaper").

**Output:**
- `composite_scores`: object with per-city composite score, rank, and tie status (if applicable).
- `score_gaps`: array of {rank_1: string, rank_2: string, gap: number}.
- `tie_breaking_criteria`: array of {tied_cities: [city1, city2], tie_breaker_1: string, tie_breaker_2: string} (if ties exist).

**Quality Gate:**
- Composite scores are between 0 and 100.
- Weights were correctly applied (sum = 100).
- Ranking is correct (highest score = rank 1).
- Ties are identified and documented.

---

### Phase 9: Generate Comparison Matrix, Visualizations, and Validation Checklist

**Entry Criteria:**
- Composite scores and normalized scores from Phases 7-8 are complete.

**Actions:**
1. Build a detailed comparison matrix: rows = cities, columns = criteria + composite score. Cells = normalized scores.
2. Include a summary row showing criterion weights.
3. Highlight the highest and lowest scores in each column (for quick visual scanning).
4. Generate a narrative summary for each city (e.g., "Austin excels in job market (92) and cost of living (78) but lags in climate preference (65)").
5. For each city, identify top 2-3 strengths (highest-scoring criteria) and top 2-3 weaknesses (lowest-scoring criteria).
6. Create a ranked list with composite scores, strengths, and weaknesses.
7. For the top 3 ranked cities, generate a validation checklist of in-person items to verify: commute times (by car, public transit, bike), neighborhood feel (walkability, safety, noise), local food scene (restaurants, markets, cuisine diversity), proximity to personal network (family, friends, professional contacts), cost of living reality check (actual rent, groceries, dining prices), job market reality check (company presence, networking opportunities), climate reality check (seasonal weather, extreme weather events), and cultural fit (community vibe, diversity, values alignment).

**Output:**
- `comparison_matrix`: structured object with cities, criteria, normalized scores, weights, and composite scores.
- `city_summaries`: object with per-city narrative summary, strengths, and weaknesses.
- `ranked_list`: array of {rank, city, composite_score, strengths: string[], weaknesses: string[]}.
- `validation_checklist`: object with per-city (top 3 only) checklist of in-person validation items.

**Quality Gate:**
- Matrix is complete (no missing cells).
- Summaries are accurate and actionable.
- Ranked list matches composite score order.
- Validation checklist covers all major decision factors.

---

### Phase 10: Sensitivity Analysis, Trade-Offs, and Final Recommendation

**Entry Criteria:**
- Composite scores and ranking from Phase 8 are complete.
- Criterion weights from Phase 1 are available.

**Actions:**
1. Identify the top 3 ranked cities.
2. For each weighted_preference criterion with weight >= 15, simulate a ±10% weight adjustment and recalculate rankings. Document scenarios where the ranking changes (e.g., "If job market weight increases from 30% to 40%, Denver moves from rank 2 to rank 1").
3. For each sensitivity scenario, provide an interpretation: what does this tell the user about the importance of that criterion? (e.g., "Denver's ranking is sensitive to job market weight, suggesting that if job market is more important than you initially thought, Denver becomes the top choice.").
4. Identify trade-offs between top cities (e.g., "Austin vs. Denver: Austin is cheaper, Denver has better job market").
5. Highlight any cities that are "close competitors" (composite score within 5 points of a higher-ranked city).
6. Note any criteria where cities have extreme differences (e.g., one city scores 95 in climate, another 40).
7. Generate a final recommendation that: (a) names the top-ranked city, (b) acknowledges key trade-offs, (c) notes which cities are close competitors and under what conditions they might be better, (d) recommends a 3-6 month trial period (renting short-term) before permanent relocation, and (e) suggests using the validation checklist to verify data-based conclusions in person.

**Output:**
- `sensitivity_scenarios`: array of {scenario_name, criterion, weight_change_percent, new_ranking: [city1, city2, ...], interpretation: string}.
- `trade_offs`: array of {city_pair: [city1, city2], trade_off_description: string}.
- `close_competitors`: array of {city, rank, score, competitor, competitor_score, gap} (if any cities are within 5 points).
- `extreme_differences`: array of {criterion, highest_city, highest_score, lowest_city, lowest_score, difference} (if difference >= 30 points).
- `recommendation`: string (multi-paragraph, addressing points a-e above).

**Quality Gate:**
- Sensitivity scenarios are realistic (±10% is a reasonable adjustment).
- Trade-offs are specific and actionable.
- Close competitors are correctly identified (gap <= 5 points).
- Recommendation is actionable and acknowledges uncertainty.
- Recommendation includes trial period suggestion.

---

## Exit Criteria

The skill is complete when:
1. All 10 phases have been executed in order.
2. `ranked_cities`, `comparison_matrix`, `trade_offs_summary`, `sensitivity_analysis`, `recommendation`, and `validation_checklist` outputs are populated.
3. The ranking is justified by the weighted scoring model with transparent formulas.
4. Sensitivity analysis reveals which criteria most influence the ranking.
5. Hard constraints have been applied and eliminated cities are documented.
6. A person unfamiliar with the user's situation could read the outputs and understand: (a) why each city ranked where it did, (b) what trade-offs exist between top cities, (c) which cities are close competitors and under what conditions, and (d) what to verify in person before deciding.
7. The recommendation is actionable, acknowledges trade-offs, and includes a trial period suggestion.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| 1 | Criterion weights do not sum to 100 | **Adjust** -- Normalize weights proportionally. Document the adjustment and confirm with user. |
| 1 | Hard constraint has no measurable required value | **Abort** -- Ask user to specify the required value (e.g., "Visa sponsorship: yes/no"). |
| 2 | Fewer than 2 cities provided | **Abort** -- Request at least 2 cities for comparison. |
| 2 | More than 10 cities provided | **Adjust** -- Suggest narrowing to top 10 or splitting into multiple comparisons. Proceed with top 10 if user approves. |
| 2 | All cities eliminated by hard constraints | **Abort** -- Ask user to relax constraints or add new cities. |
| 3 | Cost of living data unavailable for a city | **Adjust** -- Use regional average or estimate based on similar cities. Flag as estimated. |
| 3 | Cost of living data is older than 6 months | **Adjust** -- Use available data but flag as outdated. Recommend user verify current prices. |
| 4 | Job market data unavailable for user's profession | **Adjust** -- Use general employment metrics. Note that profession-specific data is unavailable. |
| 4 | Job market data is older than 6 months | **Adjust** -- Use available data but flag as outdated. Recommend user verify current job market. |
| 5 | Quality of life data incomplete (missing sub-metrics) | **Adjust** -- Use available data (minimum 4 of 5 sub-metrics required); note missing sub-metrics in output. If fewer than 4 sub-metrics available, flag city as "insufficient data" and consider excluding from ranking. |
| 5 | Quality of life data is older than 12 months | **Adjust** -- Use available data but flag as outdated. |
| 6 | Climate preference is vague (e.g., "nice weather") | **Adjust** -- Ask for clarification (e.g., "Do you prefer warm or cool? Dry or humid?"). Proceed with informational climate data if user declines to clarify. |
| 7 | Normalized scores are outside 0-100 range | **Abort** -- Review normalization formula. Likely cause: incorrect min-max calculation. Recalculate and validate. |
| 8 | Composite scores are identical for two cities | **Adjust** -- Note the tie. Provide tie-breaking criteria (e.g., "Both score 78.5; City A has better job market, City B is cheaper"). |
| 8 | Weights do not sum to 100 | **Abort** -- Return to Phase 1 and recalculate weights. |
| 9 | Comparison matrix is too large to display (>10 cities) | **Adjust** -- This should not occur (Phase 2 limits to 10 cities). If it does, split matrix into sub-tables by criterion. |
| 10 | Sensitivity analysis shows ranking is unstable (changes with small weight adjustments) | **Adjust** -- Flag this in recommendation: "Top cities are close competitors; final choice depends on which criteria matter most to you." Recommend trial period to reduce risk. |
| 10 | User rejects final output | **Targeted revision** -- ask which city comparison, criterion weight, or cost estimate fell short and rerun only that section. Do not re-run the full comparison matrix. |

---

## Reference Section

### Domain Knowledge: Weighted Scoring Model

The skill uses a **weighted linear scoring model**:

```
Composite Score = Σ (Normalized Score[criterion] × Weight[criterion] / 100)
```

Where:
- **Normalized Score** is the criterion score scaled to 0-100 (0 = worst, 100 = best).
- **Weight** is the user-defined importance of the criterion (0-100, summing to 100 for weighted_preference criteria).
- **Composite Score** is the final ranking metric (0-100).

**Assumptions:**
- All criteria are independent (no interaction effects).
- Linear weighting is appropriate (doubling a criterion's weight doubles its influence).
- Normalized scores are comparable across criteria (achieved via min-max normalization).
- Hard constraints are binary (pass/fail) and eliminate cities before scoring.

### Core Criteria Definitions

1. **Cost of Living**: Monthly expenses for housing, food, transportation, utilities, and entertainment. Lower is better. Includes trend analysis (rising/stable/declining).
2. **Job Market**: Availability of jobs in user's profession, median salary, employment rate, and career growth potential. Higher is better. Includes industry growth rate.
3. **Quality of Life**: Safety, schools, healthcare, culture, and recreation. Higher is better. Sub-metrics are weighted equally unless user specifies priorities.
4. **Climate**: Temperature, precipitation, humidity, and alignment with user preference. Higher is better (if preference given). Includes extreme weather risks.
5. **Personal Priorities**: User-defined criteria (e.g., proximity to family, cultural community, outdoor activities). Customizable.

### Data Sources and Freshness Requirements

- **Cost of Living**: Numbeo, Expatica, local real estate/rental sites, Bureau of Labor Statistics. **Freshness: within 6 months.**
- **Job Market**: Glassdoor, LinkedIn, Indeed, Bureau of Labor Statistics, local chambers of commerce. **Freshness: within 6 months.**
- **Quality of Life**: Niche, Numbeo, local government data, crime databases, school ratings. **Freshness: within 12 months.**
- **Climate**: NOAA, Weather Underground, climate.org, local weather services. **Freshness: 10-year averages (e.g., 1990-2020).**

### Sensitivity Analysis Interpretation

If a city's rank changes when a criterion's weight is adjusted by ±10%, that city is **sensitive** to that criterion. Example:
- "If job market weight increases from 30% to 40%, Denver moves from rank 2 to rank 1."
- This means Denver's job market score is significantly higher than Austin's, and increasing the weight of that criterion favors Denver.

**Use case**: If you are uncertain about a criterion's importance, sensitivity analysis shows which cities are most affected by that uncertainty. Cities that are NOT sensitive to weight changes are robust choices regardless of your priorities.

### Trade-Off Examples

- **Cost vs. Job Market**: A city may have low cost of living but weak job market (or vice versa). User must decide which matters more.
- **Climate vs. Culture**: A city may have ideal climate but limited cultural amenities (or vice versa).
- **Overall Score vs. Specific Strength**: A city may rank 3rd overall but have the best job market. If job market is the user's top priority, that city may be the best choice despite lower overall score.
- **Current Cost vs. Cost Trend**: A city may have moderate current cost of living but rapidly rising prices, making it less attractive than a slightly more expensive city with stable prices.

### Trial Period Recommendation

Before committing to a permanent move, consider a 3-6 month trial period (e.g., renting short-term) in the top-ranked city. This allows you to:
- Verify data-based conclusions in person (use the validation checklist).
- Experience seasonal variations (if moving during off-season).
- Test commute times, neighborhood feel, and cost of living reality.
- Assess cultural fit and personal network opportunities.
- Reduce the risk of a poor decision based on incomplete or outdated data.

### Checklist for User Input

Before running the skill, user should:
- [ ] List 2-10 candidate cities.
- [ ] Define 3-5 evaluation criteria with weights summing to 100.
- [ ] Specify any hard constraints (e.g., visa sponsorship required).
- [ ] Specify profession/industry (for job market data).
- [ ] State climate preference (optional).
- [ ] Provide budget range (optional).
- [ ] Identify preferred data sources (optional; defaults to public indices).
- [ ] Reflect on personal network importance (family, friends, professional contacts nearby).

---

## State Persistence (Optional)

If the user runs this skill multiple times (e.g., comparing different city sets or adjusting weights), consider storing:
- Previous comparisons and rankings.
- User's stated priorities and weights (to avoid re-entry).
- Data snapshots (to track how rankings change over time).
- Trial period outcomes (if user reports back after visiting top cities).

This enables:
- Quick re-runs with adjusted weights.
- Comparison of "old ranking vs. new ranking" as cities change or data updates.
- Trend analysis (e.g., "Austin's job market has improved 5 points since last month").
- Learning from user feedback (e.g., "User chose City A despite lower score; what did we miss?").