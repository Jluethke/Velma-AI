# Meal Plan Generator

**One-line description:** Generate a complete 7-day meal plan with grocery list, prep schedule, and macro breakdown from dietary preferences, restrictions, and goals.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `dietary_preferences` (object, required)
  - `cuisine_types` (string[], required): Preferred cuisines (e.g., "Mediterranean", "Asian", "American")
  - `favorite_foods` (string[], required): Foods the user enjoys (e.g., "chicken", "quinoa", "broccoli")
  - `disliked_foods` (string[], optional): Foods to avoid (e.g., "mushrooms", "cilantro")

- `dietary_restrictions` (object, required)
  - `allergies` (string[], optional): Food allergies (e.g., "peanuts", "shellfish", "gluten")
  - `intolerances` (string[], optional): Food intolerances (e.g., "lactose", "soy")
  - `ethical_restrictions` (string[], optional): Dietary philosophy (e.g., "vegetarian", "vegan", "halal", "kosher")

- `fitness_goals` (object, required)
  - `primary_goal` (string, required): One of "weight_loss", "muscle_gain", "maintenance", "athletic_performance"
  - `target_daily_calories` (number, required): Target caloric intake (e.g., 2000)
  - `macro_targets` (object, required)
    - `protein_grams` (number, required): Daily protein target (e.g., 150)
    - `carbs_grams` (number, required): Daily carbs target (e.g., 200)
    - `fat_grams` (number, required): Daily fat target (e.g., 65)
  - `macro_flexibility` (object, optional): Specifies which macros are strict vs. flexible
    - `protein_flexibility_percent` (number, optional, default: 5): Acceptable variance for protein (e.g., 5 = ±5%)
    - `carbs_flexibility_percent` (number, optional, default: 10): Acceptable variance for carbs
    - `fat_flexibility_percent` (number, optional, default: 10): Acceptable variance for fat

- `lifestyle_constraints` (object, optional)
  - `available_prep_time_minutes_per_day` (number, optional, default: 60): Time available for meal prep
  - `cooking_skill_level` (string, optional, default: "intermediate"): One of "beginner", "intermediate", "advanced"
  - `equipment_available` (string[], optional): Cooking equipment (e.g., "oven", "slow_cooker", "blender")
  - `budget_per_week_usd` (number, optional): Maximum weekly grocery budget
  - `pantry_staples` (string[], optional): Ingredients already on hand (e.g., "olive oil", "salt", "garlic"); these will be excluded from grocery list

- `meal_variety_preference` (string, optional, default: "high"): One of "low" (allow up to 3 repeats), "medium" (allow up to 2 repeats), "high" (all unique)

---

## Outputs

- `meal_plan` (object)
  - `days` (object[]): Array of 7 day objects, each containing:
    - `day_number` (number): 1-7
    - `date` (string, ISO 8601): Planned date (if provided)
    - `meals` (object[]): Breakfast, lunch, dinner, snacks
      - `meal_type` (string): "breakfast", "lunch", "dinner", "snack"
      - `recipe_name` (string): Name of the dish
      - `recipe_id` (string): Unique identifier for recipe (enables substitution tracking)
      - `ingredients` (object[]): List of ingredients with quantities
        - `ingredient_name` (string)
        - `quantity` (number)
        - `unit` (string): "g", "ml", "cup", "tbsp", "tsp", "whole"
      - `cooking_time_minutes` (number): Prep + cook time
      - `macros` (object): Per-serving breakdown
        - `calories` (number)
        - `protein_g` (number)
        - `carbs_g` (number)
        - `fat_g` (number)
        - `fiber_g` (number)
      - `servings` (number): Number of servings per recipe
      - `substitution_options` (object[], optional): 2-3 alternative recipes with same macro targets
        - `recipe_name` (string)
        - `recipe_id` (string)
        - `macros` (object): Identical to primary recipe

- `grocery_list` (object)
  - `categories` (object[]): Organized by type
    - `category_name` (string): "Produce", "Proteins", "Grains", "Dairy", "Pantry", "Frozen"
    - `items` (object[]): Items in this category
      - `ingredient_name` (string)
      - `total_quantity` (number)
      - `unit` (string)
      - `estimated_cost_usd` (number)
      - `meals_used_in` (string[]): Which meals use this ingredient
      - `bulk_buy_opportunity` (boolean): True if ingredient appears in 3+ meals
      - `is_pantry_staple` (boolean): True if user indicated they already have it
  - `total_estimated_cost_usd` (number): Sum of all items (excluding pantry staples)
  - `cost_per_day_usd` (number): Average daily cost
  - `bulk_buy_recommendations` (string[]): Specific recommendations (e.g., "Buy 2 lbs chicken; use in 4 meals")

- `prep_schedule` (object)
  - `days` (object[]): Prep tasks organized by day
    - `day_number` (number): 1-7 (or prep day if before day 1)
    - `prep_tasks` (object[]): Tasks to complete
      - `task_name` (string): Description of prep work
      - `estimated_time_minutes` (number)
      - `ingredients_involved` (string[])
      - `storage_instructions` (string): How to store prepped items (temperature, container type, shelf life)
      - `meals_affected` (string[]): Which meals this prep supports
  - `batch_cook_opportunities` (string[]): Suggestions for cooking in bulk
  - `total_prep_time_minutes` (number): Sum across all days
  - `prep_feasibility` (string): "Feasible" (fits within daily budget), "Tight" (requires optimization), or "Requires dedicated prep day" (recommend Sunday)
  - `prep_time_buffer_applied` (number): Percentage buffer added for learning curve (0-30%)

- `macro_breakdown` (object)
  - `daily_average` (object): Average per day across the week
    - `calories` (number)
    - `protein_g` (number)
    - `carbs_g` (number)
    - `fat_g` (number)
    - `fiber_g` (number)
  - `daily_targets` (object): User's stated targets
    - `calories` (number)
    - `protein_g` (number)
    - `carbs_g` (number)
    - `fat_g` (number)
  - `variance_from_targets` (object): Percentage difference
    - `calories_percent` (number)
    - `protein_percent` (number)
    - `carbs_percent` (number)
    - `fat_percent` (number)
  - `weekly_totals` (object): Sum across 7 days
    - `calories` (number)
    - `protein_g` (number)
    - `carbs_g` (number)
    - `fat_g` (number)
  - `flagged_days` (object[]): Days where any macro exceeds user's flexibility threshold
    - `day_number` (number)
    - `variance_by_macro` (object): Variance % for each macro
    - `suggested_meal_swap` (object): Specific swap to rebalance
      - `current_meal` (string): Meal to replace
      - `suggested_replacement` (string): Meal to use instead
      - `macro_impact` (object): How swap affects daily totals

- `summary` (object)
  - `total_weekly_cost_usd` (number)
  - `average_daily_cost_usd` (number)
  - `total_prep_time_hours` (number)
  - `average_daily_macros` (object): Calories, protein, carbs, fat
  - `quick_summary` (string): One-paragraph overview
  - `shopping_checklist` (string[]): Printable shopping list
  - `prep_checklist` (string[]): Printable prep checklist

---

## Execution Phases

### Phase 1: Validate Dietary Inputs

**Entry Criteria:**
- `dietary_preferences`, `dietary_restrictions`, and `fitness_goals` objects are provided
- `target_daily_calories` and `macro_targets` are numeric and positive
- All required fields are non-null

**Actions:**
1. Verify all required fields are present. If any are missing, return error with list of missing fields and abort.
2. Normalize cuisine types and food names to a canonical list (e.g., "med" → "Mediterranean", "chix" → "chicken").
3. Cross-check restrictions against preferences: if user prefers "chicken" but has "poultry allergy", flag as contradiction and request clarification.
4. Validate macro targets using formula: (Protein g × 4) + (Carbs g × 4) + (Fat g × 9) = Expected calories. If variance exceeds 10%, auto-correct macro targets to match caloric goal proportionally and warn user.
5. Confirm ethical restrictions are compatible with macro targets using decision matrix: vegan + high protein (>1.6g/kg) requires specific foods (legumes, tofu, nuts); flag if incompatible.
6. Set macro flexibility thresholds: if not provided, use defaults (protein ±5%, carbs ±10%, fat ±10%).
7. If pantry_staples provided, validate against known ingredient list; flag unrecognized items for manual review.

**Output:**
- `validated_profile` (object): Cleaned, normalized dietary profile with all fields populated
- `validation_warnings` (string[]): Any contradictions, unusual combinations, or auto-corrections applied
- `macro_flexibility_thresholds` (object): Final flexibility settings for use in Phase 5

**Quality Gate:**
- All required fields are present and valid (pass if all fields non-null and types correct)
- No contradictions between preferences and restrictions (pass if no conflicts flagged, or user clarifies)
- Macro targets are physiologically reasonable: protein 0.8-2.2 g/kg body weight (estimated from calories), carbs 2-7 g/kg, fat 0.5-1.5 g/kg (pass if within ranges or user confirms)
- Macro targets sum to within ±10% of caloric goal (pass if variance ≤10% after auto-correction)

---

### Phase 2: Generate 7-Day Meal Plan

**Entry Criteria:**
- Validated dietary profile from Phase 1
- `meal_variety_preference` is set (default: "high")
- `cooking_skill_level` is known (default: "intermediate")
- Recipe database is accessible with macro data for each recipe

**Actions:**
1. Select 7 breakfast options using decision matrix: (a) meets macro targets ±10%, (b) respects all restrictions, (c) matches cuisine/skill level, (d) uses favorite foods where possible. Store recipe_id for each.
2. Select 7 lunch options applying same matrix. If `meal_variety_preference` is "low", allow up to 3 repeats; if "medium", allow up to 2 repeats; if "high", all unique.
3. Select 7 dinner options (primary meals) ensuring variety in protein sources (poultry, beef, fish, plant-based) and cooking methods (bake, sauté, slow-cook, grill).
4. Add 1-2 snack options per day to bridge macro gaps. Snacks should be <200 calories and <10g protein each.
5. For each meal, retrieve recipe with ingredient list, quantities (per serving), cooking time, and macro breakdown (calories, protein, carbs, fat, fiber).
6. For each day, sum all meals' macros. If any macro deviates >flexibility threshold from daily target, apply rebalancing algorithm: (a) identify meal with largest macro surplus/deficit, (b) find substitution option from same meal type with opposite macro profile, (c) swap and recalculate. Repeat until all macros within thresholds or max 3 iterations.
7. Assign meals to specific days. Verify no meal appears more than allowed by variety preference.
8. For each meal, generate 2-3 substitution options (same meal type, similar macros ±5%, different recipe) and store recipe_ids.

**Output:**
- `meal_plan` (object): 7-day plan with all meals, recipes, macros, and substitution options (see Outputs section)
- `macro_daily_summary` (object[]): Daily totals for each of 7 days with variance from targets
- `rebalancing_notes` (string[]): Meals swapped to meet macro targets, with before/after macro impact
- `substitution_matrix` (object): Map of recipe_id to substitution options for quick reference

**Quality Gate:**
- All 7 days have breakfast, lunch, dinner, and at least 1 snack (pass if 4 meal types present for each day)
- Each meal respects all dietary restrictions: no allergens, no intolerances, no prohibited foods (pass if restrictions_check returns true for each meal)
- Daily macro totals are within flexibility thresholds for all 7 days (pass if all days: protein within ±5%, carbs within ±10%, fat within ±10%)
- No meal appears more than allowed by variety preference (pass if count(meal_x) ≤ threshold for all meals)
- All recipes are appropriate for stated cooking skill level: beginner recipes ≤5 ingredients and ≤20 min prep, intermediate 5-10 ingredients and ≤45 min prep, advanced 10+ ingredients and ≤90 min prep (pass if all recipes meet skill criteria)

---

### Phase 3: Aggregate Ingredients and Build Grocery List

**Entry Criteria:**
- Complete meal plan from Phase 2
- All recipes have ingredient lists with quantities and units
- Cost database is accessible (or default baseline prices provided)

**Actions:**
1. Extract all ingredients from all recipes across 7 days. For each ingredient, record: name, quantity, unit, recipe source.
2. Aggregate quantities by ingredient using unit conversion (e.g., 1 cup = 240 ml, 1 lb = 453.6 g). Sum total quantity needed for the week.
3. Organize ingredients into categories: Produce, Proteins, Grains, Dairy, Pantry, Frozen. Use canonical category mapping.
4. For each ingredient, look up cost from database using formula: cost_per_unit × total_quantity. If ingredient not in database, use baseline price from Reference section and mark as "estimated".
5. If user provided pantry_staples, mark those ingredients as "is_pantry_staple: true" and exclude from cost calculation.
6. Identify bulk-buy opportunities: ingredients appearing in 3+ meals. For each, calculate savings if purchased in bulk (e.g., "Buy 2 lbs chicken at $10/lb = $20; use in 4 meals") and add to recommendations.
7. Identify single-use ingredients (appearing in only 1 meal). For each, suggest substitution with ingredient already in plan (same meal type, similar macro impact) or note as potential waste.
8. Calculate total estimated cost (excluding pantry staples), cost per day, and cost per meal.
9. Cross-reference each ingredient back to meals it supports for shopping and meal prep.

**Output:**
- `grocery_list` (object): Organized by category with quantities, costs, meal references, bulk-buy flags (see Outputs section)
- `single_use_ingredients` (object[]): Ingredients appearing in only 1 meal
  - `ingredient_name` (string)
  - `used_in_meal` (string)
  - `suggested_substitution` (string): Alternative ingredient already in plan
  - `waste_risk` (string): "Low" (shelf-stable), "Medium" (refrigerated), "High" (perishable)
- `cost_summary` (object): Total, per-day, per-meal costs
- `bulk_buy_recommendations` (string[]): Specific recommendations with savings estimates

**Quality Gate:**
- All ingredients from all recipes are included (pass if ingredient_count matches sum of all recipe ingredients)
- Quantities are sufficient for all servings across the week (pass if total_quantity ≥ sum of recipe quantities × servings)
- Categories are logical and complete (pass if all ingredients assigned to exactly one category)
- Cost estimates are reasonable: within ±20% of typical grocery prices (pass if cost_per_unit for each ingredient is within baseline ±20%)
- Single-use ingredients are flagged and substitutions suggested (pass if all single-use items have substitution_suggested or waste_risk noted)

---

### Phase 4: Create Meal Prep Schedule

**Entry Criteria:**
- Complete meal plan from Phase 2
- `available_prep_time_minutes_per_day` is known (default: 60)
- `cooking_skill_level` is known (default: "intermediate")
- `equipment_available` is provided (or assume standard kitchen)

**Actions:**
1. Identify all prep tasks for each meal: chopping, marinating, cooking, portioning, storing. Use task taxonomy: prep (chopping, mixing), cook (baking, sautéing, simmering), portion (dividing into containers), store (refrigerate, freeze).
2. For each recipe, estimate prep time using lookup table based on skill level and recipe complexity:
   - Beginner: add 50% buffer to recipe time (e.g., 20 min recipe = 30 min estimate)
   - Intermediate: add 20% buffer (e.g., 30 min recipe = 36 min estimate)
   - Advanced: add 10% buffer (e.g., 45 min recipe = 50 min estimate)
   - If first meal plan for user, add additional 20-30% learning curve buffer
3. Identify batch-cook opportunities using pattern matching: (a) meals sharing same protein (cook all chicken together), (b) meals sharing same cooking method (roast all vegetables), (c) meals sharing same grain (cook rice in bulk). For each opportunity, calculate time savings (e.g., "Roast all vegetables together: 45 min vs. 60 min separately = 15 min saved").
4. Check equipment compatibility: for each recipe, verify required equipment is in `equipment_available`. If not, flag as "Equipment unavailable" and trigger error handling.
5. Distribute prep tasks across 7 days to balance daily workload. Algorithm: (a) calculate total prep time needed, (b) divide by 7 to get target per day, (c) assign tasks to days keeping daily total ≤ available_prep_time_minutes_per_day, (d) prioritize batch-cook tasks to earlier days.
6. For each task, specify storage instructions using template: "Store in [container type] at [temperature] for [shelf life]. Use by [date]."
7. If total prep time exceeds available time spread across week, recommend dedicated prep day (e.g., Sunday) and recalculate schedule.
8. Generate prep checklist with tasks, times, and dependencies.

**Output:**
- `prep_schedule` (object): Day-by-day tasks with time estimates and storage instructions (see Outputs section)
- `batch_cook_suggestions` (string[]): Opportunities to cook in bulk with time savings estimates
- `total_prep_time_minutes` (number): Sum of all prep across the week
- `prep_feasibility` (string): "Feasible" (total ≤ available time × 7), "Tight" (total ≤ available time × 7 + 20%), or "Requires dedicated prep day" (total > available time × 7 + 20%)
- `prep_time_buffer_applied` (number): Percentage buffer added for skill level and learning curve
- `equipment_gaps` (string[]): Equipment needed but not available (if any)

**Quality Gate:**
- All meals have prep tasks assigned (pass if every meal_type has at least one task)
- Daily prep time does not exceed available time, or user is warned (pass if all days ≤ available_prep_time_minutes_per_day, or feasibility = "Requires dedicated prep day")
- Batch-cook opportunities are identified and explained (pass if batch_cook_suggestions.length > 0 or no opportunities exist)
- Storage instructions are specific and food-safe: specify container type (airtight, glass, plastic), temperature (fridge 35-40°F, freezer 0°F), and shelf life (fridge 3-5 days, freezer 3 months) (pass if all storage_instructions follow template)
- Prep schedule is chronologically logical: perishables prepped 1-2 days before use, shelf-stable items prepped earlier (pass if no perishable item prepped >2 days before use)

---

### Phase 5: Calculate and Verify Macro Breakdown

**Entry Criteria:**
- Complete meal plan from Phase 2 with all recipes and portions
- User's macro targets and flexibility thresholds from Phase 1
- All meals have macro data (calories, protein, carbs, fat, fiber)

**Actions:**
1. For each meal in the 7-day plan, retrieve macros (calories, protein, carbs, fat, fiber) from recipe data.
2. For each day, sum all meals' macros: daily_total = sum(breakfast + lunch + dinner + snacks).
3. For each day, calculate variance from targets using formula: variance_percent = |actual - target| / target × 100. Calculate for each macro separately.
4. Calculate weekly average: weekly_avg = sum(7 days) / 7. Calculate variance from targets.
5. Calculate weekly totals: weekly_total = sum(7 days).
6. Identify flagged days: any day where any macro exceeds user's flexibility threshold (e.g., protein >±5%, carbs >±10%, fat >±10%).
7. For each flagged day, generate meal swap suggestion using algorithm: (a) identify macro(s) out of range, (b) find meal with largest surplus/deficit in that macro, (c) search substitution_matrix for alternative recipe with opposite macro profile, (d) calculate impact of swap on daily totals, (e) suggest swap if it brings all macros within thresholds.
8. If flagged days exist and swaps cannot resolve them, suggest recipe regeneration for that day (trigger Phase 2 loop).
9. Generate summary table: rows = days 1-7 + weekly avg + targets, columns = calories, protein, carbs, fat, variance %.

**Output:**
- `macro_breakdown` (object): Daily averages, targets, variances, and weekly totals (see Outputs section)
- `flagged_days` (object[]): Days where macros deviate beyond flexibility thresholds
  - `day_number` (number)
  - `variance_by_macro` (object): Variance % for each macro
  - `suggested_meal_swap` (object): Specific swap to rebalance (or null if no swap available)
- `macro_summary_table` (string): Markdown table for easy reference
- `regeneration_needed` (boolean): True if flagged days cannot be resolved by swaps alone

**Quality Gate:**
- All meals' macros are accounted for (pass if sum(meal macros) = day total for all days)
- Daily totals are within flexibility thresholds for all 7 days (pass if all days: protein within ±5%, carbs within ±10%, fat within ±10%), OR flagged days have suggested swaps (pass if flagged_days.length = 0 OR all flagged_days have suggested_meal_swap)
- Flagged days have suggested corrections (pass if suggested_meal_swap is provided for each flagged day)
- Macro breakdown is mathematically consistent with meal plan (pass if daily_total = sum(meal macros) for all days)

---

### Phase 6: Compile and Format Final Deliverables

**Entry Criteria:**
- Meal plan from Phase 2 (complete with substitution options)
- Grocery list from Phase 3 (complete with bulk-buy recommendations)
- Prep schedule from Phase 4 (complete with batch-cook suggestions)
- Macro breakdown from Phase 5 (complete with flagged days and swaps)
- All components are complete and internally consistent

**Actions:**
1. Cross-check all four components for consistency using validation matrix:
   - For each ingredient in grocery_list, verify it appears in at least one meal in meal_plan
   - For each meal in meal_plan, verify it has a corresponding prep task in prep_schedule
   - For each meal's macros in meal_plan, verify they are reflected in macro_breakdown daily totals
   - For each flagged day in macro_breakdown, verify suggested_meal_swap references valid recipe_id from substitution_matrix
   If any inconsistency found, log error and abort with specific inconsistency details.
2. Compile all sections into a single output object with structure: { meal_plan, grocery_list, prep_schedule, macro_breakdown, summary }.
3. Generate user-friendly summary using template: "Your 7-day plan totals [X] calories/day, [Y] g protein, [Z] g carbs, [W] g fat. Estimated cost: $[C]/week. Total prep time: [T] hours. Feasibility: [F]."
4. Add a quick-reference checklist for shopping: list all items by category, with quantities and checkboxes.
5. Add a prep checklist: list all tasks by day, with time estimates and checkboxes.
6. Format output as JSON (for programmatic use). Optionally generate markdown version for human readability.
7. Validate JSON structure: parse output and verify all required fields are present and types are correct.

**Output:**
- `meal_plan` (object): Complete 7-day plan (see Outputs section)
- `grocery_list` (object): Complete grocery list (see Outputs section)
- `prep_schedule` (object): Complete prep schedule (see Outputs section)
- `macro_breakdown` (object): Complete macro analysis (see Outputs section)
- `summary` (object):
  - `total_weekly_cost_usd` (number)
  - `average_daily_cost_usd` (number)
  - `total_prep_time_hours` (number)
  - `average_daily_macros` (object): Calories, protein, carbs, fat
  - `quick_summary` (string): One-paragraph overview
  - `shopping_checklist` (string[]): Printable shopping list with checkboxes
  - `prep_checklist` (string[]): Printable prep checklist with checkboxes
- `consistency_check` (object): Results of cross-validation
  - `all_ingredients_in_meals` (boolean): True if all grocery items used
  - `all_meals_have_prep_tasks` (boolean): True if all meals have prep
  - `macros_consistent` (boolean): True if meal macros match breakdown
  - `substitutions_valid` (boolean): True if all swaps reference valid recipes

**Quality Gate:**
- All four components are present and complete (pass if meal_plan, grocery_list, prep_schedule, macro_breakdown all non-null and have required fields)
- No inconsistencies between components (pass if consistency_check all true)
- Summary statistics are mathematically correct (pass if total_weekly_cost = sum(grocery_list costs), total_prep_time = sum(prep_schedule times), average_daily_macros = weekly_totals / 7)
- Checklists are actionable and printable (pass if shopping_checklist and prep_checklist are non-empty string arrays with clear formatting)
- Output is valid JSON (pass if JSON.parse(output) succeeds)

---

## Exit Criteria

The skill is DONE when:
1. All 6 phases have executed successfully without abort conditions
2. The meal plan contains 7 complete days with breakfast, lunch, dinner, and at least 1 snack per day
3. All meals respect dietary restrictions (no allergens, intolerances, or prohibited foods) and incorporate favorite foods where possible
4. Daily macro totals are within user's flexibility thresholds for all 7 days (protein ±5%, carbs ±10%, fat ±10% by default, or user-specified thresholds)
5. The grocery list is complete, organized by category, and costed
6. The prep schedule is feasible within available time per day, or user is warned that a dedicated prep day is needed
7. The macro breakdown is mathematically consistent with the meal plan (daily totals = sum of meal macros)
8. All four deliverables (meal_plan, grocery_list, prep_schedule, macro_breakdown) are compiled, cross-validated, and formatted
9. A user unfamiliar with the workflow could execute the plan using the shopping checklist and prep checklist, and achieve the stated fitness goals
10. No inconsistencies exist between components (all ingredients used, all meals have prep tasks, all macro swaps reference valid recipes)

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Required field missing (e.g., `target_daily_calories`) | **Abort** -- Return error listing missing fields with specific paths (e.g., "fitness_goals.target_daily_calories") and request resubmission |
| Phase 1 | Macro targets sum to >20% variance from caloric target | **Adjust** -- Auto-correct macro targets proportionally to match caloric goal; warn user with before/after values |
| Phase 1 | Restriction contradicts preference (e.g., "loves chicken" + "poultry allergy") | **Adjust** -- Flag contradiction with specific conflict (e.g., "chicken in favorite_foods conflicts with poultry in allergies") and request clarification; do not proceed until resolved |
| Phase 2 | Cannot generate 7 unique meals within restrictions (e.g., too many allergies) | **Adjust** -- Reduce meal_variety_preference from "high" to "medium" (allow 2 repeats) or "low" (allow 3 repeats); notify user of change; if still cannot generate, reduce flexibility thresholds by 5% and retry |
| Phase 2 | Daily macros cannot be balanced within flexibility thresholds after 3 rebalancing iterations | **Adjust** -- Relax flexibility thresholds by 5% (e.g., protein ±10% instead of ±5%); regenerate; flag for user review with note "Macro targets may be difficult to achieve; consider adjusting goals" |
| Phase 3 | Ingredient cost data unavailable for >20% of items | **Adjust** -- Use default baseline prices from Reference section; mark estimates as "approximate" and note "Cost estimates based on average prices; actual costs may vary by region" |
| Phase 3 | Single-use ingredient identified | **Adjust** -- Suggest substitution with ingredient already in plan (same meal type, similar macro impact); if no substitution available, note as "potential waste" and let user decide |
| Phase 4 | Total prep time exceeds available time per day across all 7 days | **Adjust** -- Recommend dedicated prep day (e.g., "Prep on Sunday for 3 hours"); recalculate schedule with prep day; if user cannot accommodate, suggest simplifying recipes (swap for lower-complexity alternatives) |
| Phase 4 | Equipment unavailable for a recipe (e.g., no oven) | **Adjust** -- Swap recipe for one using available equipment from substitution_matrix; if no substitution available, flag as "Equipment gap: [equipment] required" and request user to either acquire equipment or provide alternative recipe |
| Phase 5 | Macro variance >15% on any day after Phase 2 rebalancing | **Adjust** -- Suggest specific meal swaps using substitution_matrix; if swaps cannot resolve, flag day for regeneration and loop back to Phase 2 for that day only |
| Phase 6 | Inconsistency detected (ingredient in plan but not in grocery list, or vice versa) | **Abort** -- Log specific inconsistency (e.g., "Chicken breast in 3 meals but not in grocery_list") and rerun Phase 3 |
| Phase 6 | Output exceeds 500 KB | **Adjust** -- Split into separate JSON files (meal_plan.json, grocery_list.json, prep_schedule.json, macro_breakdown.json) and provide index file with references |

---

## Reference Section

### Macro Calculation Formulas
- **Calories from macros:** (Protein g × 4) + (Carbs g × 4) + (Fat g × 9)
- **Macro balance check:** Variance % = |Actual - Target| / Target × 100
- **Daily average:** Sum of 7 days ÷ 7
- **Macro target validation:** Protein 0.8-2.2 g/kg, Carbs 2-7 g/kg, Fat 0.5-1.5 g/kg (estimated from caloric target)

### Dietary Restriction Categories
- **Allergies:** Peanuts, tree nuts, shellfish, fish, eggs, dairy, soy, wheat, sesame
- **Intolerances:** Lactose, gluten, fructose, histamine
- **Ethical:** Vegetarian (no meat/fish), vegan (no animal products), halal, kosher, pescatarian (fish OK)

### Cooking Skill Levels and Time Estimates
- **Beginner:** Recipes with ≤5 ingredients, ≤20 min prep, simple techniques (boil, bake, mix); add 50% time buffer
- **Intermediate:** Recipes with 5-10 ingredients, ≤45 min prep, moderate techniques (sauté, roast, simmer); add 20% time buffer
- **Advanced:** Recipes with 10+ ingredients, ≤90 min prep, complex techniques (braise, emulsify, sous-vide); add 10% time buffer
- **First-time meal prep:** Add additional 20-30% learning curve buffer to all estimates

### Batch-Cook Opportunities
- **Proteins:** Cook all chicken together (saves 15-20 min); cook all ground beef together (saves 10-15 min); cook all tofu together (saves 5-10 min)
- **Grains:** Cook rice, quinoa, oats in bulk on prep day; portion and refrigerate (saves 20-30 min across week)
- **Vegetables:** Roast all vegetables together on prep day; portion for multiple meals (saves 25-35 min)
- **Prep:** Chop all vegetables at once; store in airtight containers (saves 15-20 min)

### Storage Guidelines
- **Fridge (35-40°F, 3-5 days):** Cooked grains, cooked proteins, chopped vegetables, prepared salads, dairy products
- **Freezer (0°F, up to 3 months):** Cooked meals, portioned proteins, blanched vegetables, bread, prepared sauces
- **Room temp (65-75°F, 1-2 days):** Whole fruits, whole vegetables, pantry items, bread
- **Container types:** Airtight glass (best for reheating), BPA-free plastic (lightweight), silicone (flexible), stainless steel (durable)

### Cost Estimation Baseline (USD, approximate, 2024)
- Chicken breast: $8-12/lb (adjust ±30% for region)
- Ground beef: $6-10/lb
- Salmon: $12-18/lb
- Tofu: $3-5/block
- Rice/grains: $1-2/lb
- Vegetables: $1-3/lb (seasonal variation ±40%)
- Dairy: $3-8/item
- Pantry staples: $2-10/item
- Regional adjustment: Multiply baseline by regional cost-of-living index (e.g., 0.8 for rural areas, 1.3 for major cities)

### Decision Criteria for Meal Selection
1. **Restriction compliance:** Does meal avoid all allergies, intolerances, and ethical restrictions? (Binary: yes/no)
2. **Macro fit:** Does meal contribute appropriately to daily macro targets within flexibility thresholds? (Measured: variance %)
3. **Ingredient overlap:** Does meal use ingredients already in the plan? (Measured: % of ingredients already in plan)
4. **Cooking time:** Does meal fit within available prep time and skill level? (Measured: prep time vs. available time)
5. **Variety:** Is meal different from others in the week? (Measured: recipe_id uniqueness)
6. **Cost:** Is meal within budget constraints? (Measured: cost per meal vs. budget per meal)

### Substitution Matrix Logic
- For each meal, identify 2-3 alternative recipes from same meal type (breakfast → breakfast, lunch → lunch, etc.)
- Alternatives must have macros within ±5% of primary recipe (e.g., if primary = 400 cal, alternatives = 380-420 cal)
- Alternatives must respect all dietary restrictions
- Alternatives should use 50%+ of same ingredients to minimize grocery list expansion
- Store as recipe_id → [substitution_recipe_id_1, substitution_recipe_id_2, substitution_recipe_id_3]

---

**Version:** 2.0  
**Last Updated:** 2024  
**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.