# Meal Planner

Takes dietary preferences, household size, budget, and what's already in your fridge, then generates a week of meals with a consolidated grocery list sorted by store aisle. Adapts to allergies, picky eaters, and leftover reuse.

## Execution Pattern: ORPA Loop

## Inputs
- household: object -- Number of people, ages, dietary restrictions (vegetarian, gluten-free, halal, etc.), allergies, and picky-eater notes
- budget: string -- Weekly grocery budget (e.g., "$80", "as cheap as possible", "no limit")
- pantry: array -- Ingredients already on hand (what's in your fridge/cupboard right now)
- preferences: object -- Cuisine preferences (comfort food, Mediterranean, quick meals), cooking skill level (beginner/intermediate/advanced), max prep time per meal
- schedule: object -- (Optional) Which days are busy (need 15-min meals) vs. relaxed (can spend an hour cooking)

## Outputs
- weekly_menu: object -- 7 days of breakfast, lunch, dinner, and snacks with portion sizes
- grocery_list: object -- Consolidated shopping list sorted by store section (produce, dairy, meat, pantry, frozen) with quantities and estimated cost
- prep_instructions: array -- Step-by-step cooking instructions for each meal, written for the stated skill level
- leftover_plan: object -- How leftovers from one meal feed into another (cook once, eat twice)
- cost_estimate: object -- Estimated total cost with per-meal breakdown

## Execution

### OBSERVE: Take Inventory
**Entry criteria:** Household info and at least one dietary preference or constraint provided.
**Actions:**
1. Catalog all pantry items with approximate quantities remaining.
2. Identify hard constraints: allergies (life-threatening, non-negotiable), religious dietary laws, medical diets (diabetic, low-sodium, renal).
3. Identify soft constraints: preferences, dislikes, cuisine fatigue ("we had pasta three times last week").
4. Map the weekly schedule: busy nights get 15-minute meals or slow-cooker dumps. Weekends allow batch cooking.
5. Set budget guardrails: calculate per-meal budget from weekly total divided by (people x meals x 7).

**Output:** Constraint profile, pantry inventory, schedule map, per-meal budget target.
**Quality gate:** All allergies and medical diets are flagged as hard constraints. Per-meal budget is calculated.

### REASON: Design the Menu
**Entry criteria:** Constraint profile complete.
**Actions:**
1. Generate 7 dinner anchors first (dinner drives grocery volume). Ensure variety: no protein repeated on consecutive days, at least 2 cuisine types across the week.
2. Design lunches that reuse dinner leftovers where possible (roast chicken Monday dinner becomes chicken salad Tuesday lunch).
3. Plan breakfasts by category rotation: hot (eggs, oatmeal), cold (yogurt, cereal), grab-and-go (smoothie, toast).
4. Add 2-3 snack options that use ingredients already in the grocery list (no one-off purchases for snacks).
5. Cross-check every recipe ingredient against pantry inventory. Only add to grocery list what's actually needed.
6. Validate against budget: if over budget, swap expensive proteins (steak to chicken thighs), reduce meat portions, add one meatless day.
7. Validate against time constraints: busy-day meals must be under 20 minutes active prep.

**Output:** Complete 7-day menu with all meals and snacks. Each meal tagged with prep time, cost estimate, and which leftovers it produces or consumes.
**Quality gate:** No allergens present. Budget within 10% of target. No protein repeated consecutively. Busy-day meals are under 20 min prep.

### PLAN: Build the Grocery List
**Entry criteria:** Menu finalized.
**Actions:**
1. Extract all ingredients from all recipes. Combine duplicates (if 3 recipes need onions, list total onion count once).
2. Subtract pantry items already on hand.
3. Sort by store section: Produce, Dairy & Eggs, Meat & Seafood, Bread & Bakery, Canned & Dry Goods, Frozen, Condiments & Spices, Beverages.
4. Add quantities in practical units (e.g., "2 lbs chicken thighs" not "907g chicken thighs", unless metric is preferred).
5. Estimate cost per item using typical grocery store pricing. Sum for total estimate.
6. Flag any specialty items that might not be at a regular supermarket.

**Output:** Grocery list sorted by store section, with quantities, estimated per-item cost, and total.
**Quality gate:** Every ingredient in every recipe is accounted for. No pantry items re-purchased. Total cost is within budget.

### ACT: Deliver the Plan
**Entry criteria:** Menu and grocery list are complete and validated.
**Actions:**
1. Format the weekly menu as a clean daily schedule (Monday through Sunday).
2. Write cooking instructions for each meal at the user's skill level:
   - Beginner: every step explicit, explain terms ("dice" means cut into small cubes), include temperatures in both F and C.
   - Intermediate: standard recipe format with timing cues.
   - Advanced: ingredient list and technique notes only.
3. Highlight the leftover reuse plan: "Monday's roast chicken becomes Tuesday's chicken Caesar wraps."
4. Add meal prep tips: what can be prepped on Sunday to save time during the week.
5. Deliver grocery list in a format ready to take to the store (or copy into a shopping app).

**Output:** Complete meal plan with recipes, grocery list, leftover plan, and prep tips.
**Quality gate:** All meals have instructions. Grocery list is store-ready. Leftover connections are explicit.

## Exit Criteria
Done when: (1) 7 days of meals are planned covering breakfast, lunch, dinner, and snacks, (2) grocery list is consolidated and sorted by store section, (3) total estimated cost is within budget, (4) no allergens or dietary violations, (5) cooking instructions match stated skill level.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No dietary info provided | Adjust -- use "no restrictions" default, confirm with user |
| OBSERVE | Budget unrealistically low | Escalate -- explain minimum realistic budget for household size, suggest adjustments |
| REASON | Cannot meet all constraints simultaneously (e.g., keto + vegan + $30/week for 4 people) | Adjust -- prioritize medical > religious > preference, explain tradeoffs |
| REASON | Pantry items are expired or questionable | Flag -- note which items to check before using |
| PLAN | Specialty ingredients unavailable locally | Adjust -- suggest substitutions, note which recipes are affected |
| ACT | Skill level mismatch detected mid-plan | Adjust -- default to beginner instructions with optional "shortcut" notes for experienced cooks |
| ACT | User rejects final output | Targeted revision -- ask which meals, which days, or which part of the grocery list fell short and rebuild only those sections. Do not regenerate the full week. |

## State Persistence
- Household profile (dietary needs, preferences, skill level)
- Meal history (what was planned/cooked recently -- avoid repetition)
- Ingredient price memory (actual costs vs estimates -- improves budget accuracy over time)
- Favorite meals (meals the household rated positively -- reuse in future plans)
- Seasonal adjustments (produce availability and pricing by month)

## Reference

### Per-Meal Budget Calculator

Weekly budget ÷ (household_size × meals_per_day × 7) = per-meal target

Example: $100/week ÷ (2 people × 2 meals × 7 days) = $3.57/meal

### Protein Cost per Serving (Approximate US Averages)

| Protein | Cost/Serving | Notes |
|---|---|---|
| Eggs | $0.25-0.50 | Versatile, quick |
| Canned beans/lentils | $0.25-0.50 | High fiber, no prep |
| Chicken thighs | $0.75-1.25 | Cheaper than breast, more forgiving to cook |
| Ground turkey | $1.00-1.50 | Swaps for ground beef at lower cost |
| Canned tuna/salmon | $1.00-1.75 | Quick protein, minimal prep |
| Chicken breast | $1.25-2.00 | Lean, widely used |
| Ground beef (80/20) | $1.50-2.50 | Flavorful; higher fat |
| Steak / salmon fillet | $4.00-8.00+ | Reserve for weekends if budget-constrained |

### Meal Prep Time Categories

| Category | Active Prep Time | Examples |
|---|---|---|
| Express | < 15 minutes | Scrambled eggs, grain bowls, wraps, pasta with jar sauce |
| Quick | 15-30 minutes | Stir-fry, tacos, simple soups, sheet-pan veggies |
| Standard | 30-60 minutes | Roast chicken, casseroles, stews |
| Batch cook | 1-2 hours on Sunday | Grains, roasted veggies, protein -- assembles into 3+ meals |

### Leftover Reuse Patterns

| Sunday Cook | Monday Lunch | Tuesday Dinner |
|---|---|---|
| Roast chicken | Chicken salad sandwich | Chicken tacos |
| Ground beef tacos | Burrito bowl (add rice + beans) | Stuffed peppers |
| Roasted vegetables | Grain bowl with eggs | Veggie frittata |
| Cooked pasta | Pasta salad (cold) | Baked pasta |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
