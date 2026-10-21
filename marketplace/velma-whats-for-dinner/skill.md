# the system What's For Dinner

Answers the 6 PM question: "What should I eat?" Takes what you have in the fridge and pantry, factors in dietary preferences and how much time you have, checks what you've eaten recently to avoid repetition, and gives you a complete recipe with steps. Not a generic recipe search -- it works backward from what you already have to minimize waste and shopping. Scales from a 15-minute emergency meal to a proper dinner when you have the time.

## Execution Pattern: Phase Pipeline

```
PHASE 1: INVENTORY    --> What do you have to work with?
PHASE 2: MATCH        --> Find the best recipe for your situation
PHASE 3: RECIPE       --> Full recipe with step-by-step instructions
PHASE 4: EXTRAS       --> Nutrition, leftovers plan, and quick shopping if needed
```

## Inputs
- `available_ingredients`: array -- What's in the fridge and pantry. Doesn't need to be exhaustive -- list proteins, vegetables, starches, and anything expiring soon. Assumed pantry staples (salt, pepper, oil, butter, garlic, onion) unless told otherwise.
- `preferences`: object -- (Optional) Dietary style: omnivore, vegetarian, vegan, keto, paleo, gluten-free, dairy-free, etc. Cuisine preferences: Italian, Mexican, Asian, American, Mediterranean, anything. Spice tolerance: mild, medium, hot.
- `constraints`: object -- (Optional) Time available: 15 minutes (emergency), 30 minutes (quick), 45-60 minutes (normal), unlimited (project meal). Skill level: beginner (one pot, simple techniques), intermediate (can follow a recipe), advanced (comfortable with any technique). Equipment available: just stovetop, oven available, grill, instant pot, air fryer.
- `recent_meals`: array -- (Optional) What you've eaten in the last 3-5 days. Used to avoid repetition (chicken three nights in a row gets old).

## Outputs
- `recipe`: object -- Complete recipe: name, cuisine, servings, prep time, cook time, ingredients with amounts, step-by-step instructions
- `shopping_needs`: array -- Ingredients you need but don't have (zero items if the recipe uses only what's available)
- `nutrition_estimate`: object -- Approximate calories, protein, carbs, fat per serving
- `leftovers_plan`: string -- Whether it stores well, how to reheat, and what to do with leftover ingredients

## Execution

### Phase 1: INVENTORY
### Entry Criteria
At least a partial ingredient list provided.
### Actions
1. Catalog available ingredients by category:
   - **Proteins:** chicken, beef, pork, fish, tofu, eggs, beans, lentils
   - **Vegetables:** fresh (use first), frozen (reliable backup), canned
   - **Starches:** rice, pasta, potatoes, bread, tortillas, grains
   - **Dairy:** milk, cheese, cream, yogurt, butter
   - **Pantry:** canned goods, sauces, spices, oils, vinegars, broth
2. Flag ingredients expiring soon -- these get priority in recipe selection. A sad bell pepper in the crisper drawer is the starting point, not an afterthought.
3. Assume standard pantry staples unless told otherwise: salt, black pepper, olive oil, vegetable oil, butter, garlic (fresh or powder), onion (fresh or powder), flour, sugar, soy sauce, hot sauce. If the user says "bare pantry," don't assume these.
4. Note missing staples: if the user has chicken and rice but no soy sauce or broth, that limits the options.
5. Assess the ingredient set: is this a "full kitchen" situation (protein + starch + vegetables + seasonings) or a "what can I possibly make with this" situation (random leftovers)?

### Output
Categorized inventory, expiring items flagged, staple assumptions, overall assessment of what's available.
### Quality Gate
Every listed ingredient categorized. Expiring items identified. Staple assumptions stated.

### Phase 2: MATCH
### Entry Criteria
Inventory complete. Preferences and constraints known.
### Actions
1. Generate 3 recipe options that maximize use of available ingredients, ranked by:
   - Ingredients already on hand (fewer missing items = better)
   - Fits time constraint
   - Matches dietary preferences
   - Avoids recent meals (no chicken stir-fry if stir-fry was eaten 2 days ago)
   - Uses expiring ingredients first
2. For each option, note:
   - Name and cuisine
   - Estimated prep + cook time
   - How many ingredients you already have vs. need to buy
   - Difficulty level (easy / moderate / challenging)
3. Apply time-based filtering:
   - 15 minutes: stir-fry, quesadillas, fried rice, omelets, pasta with sauce, wraps
   - 30 minutes: sheet pan meals, skillet dinners, soup from scratch, tacos, curry
   - 45-60 minutes: roasted proteins, baked dishes, risotto, casseroles, stew
   - Unlimited: braised meats, slow cooker meals, fresh pasta, complex multicourse
4. Apply skill-based filtering:
   - Beginner: one-pot or one-pan, under 10 steps, no techniques beyond sauteing and boiling
   - Intermediate: standard recipe following, may include roasting, searing, deglazing
   - Advanced: no restrictions, can include braising, emulsifying, tempering, or multitasking
5. Present the top recommendation with a one-line pitch and note what makes it the best fit.

### Output
3 recipe options ranked, top recommendation highlighted, fit justification for each.
### Quality Gate
Top option uses 80%+ of ingredients on hand. All options fit the time and skill constraints. Recent meals avoided.

### Phase 3: RECIPE
### Entry Criteria
Recipe selected (user picks or top recommendation used).
### Actions
1. Write the full recipe:
   - **Name:** descriptive, appetizing, not pretentious
   - **Servings:** default 2-4, adjustable
   - **Prep time / Cook time / Total time**
   - **Ingredients:** listed in order of use, with exact measurements. Note which items come from the user's inventory and which need purchasing.
2. Step-by-step instructions:
   - Number each step
   - Start with prep work (mise en place): chop, measure, season before turning on heat
   - Temperature and time for every cooking step (not "cook until done" -- say "cook 4-5 minutes until golden brown")
   - Visual and sensory cues alongside times: "sear the chicken for 3-4 minutes per side until the outside is golden and releases easily from the pan"
   - Point out where timing matters: "add the garlic now -- it burns in 60 seconds so have the next ingredient ready"
   - Note parallel steps where possible: "while the pasta boils, prepare the sauce in a separate pan"
3. Technique tips for beginners where needed:
   - How to know when oil is hot enough (shimmer, not smoke)
   - How to check meat doneness (internal temp: chicken 165F, beef medium 145F, pork 145F)
   - How to taste and adjust seasoning before serving
4. Serving suggestion: what to serve it with, garnish, side options if it's a standalone protein.

### Output
Complete recipe with ingredients, step-by-step instructions, technique notes, serving suggestions.
### Quality Gate
Every step has a time and a doneness cue. Temperatures are specified. Ingredients are listed in order of use.

### Phase 4: EXTRAS
### Entry Criteria
Recipe written.
### Actions
1. Nutrition estimate per serving:
   - Calories (range, not false precision: "450-550 calories" not "487 calories")
   - Protein (grams)
   - Carbohydrates (grams)
   - Fat (grams)
   - Quick assessment: high-protein, balanced, carb-heavy, etc.
   - Compare to general targets: a dinner should be roughly 25-35% of daily caloric intake (500-800 cal for most adults)
2. Leftovers plan:
   - Does this dish store well? How long in the fridge (most cooked meals: 3-4 days)?
   - Best reheating method (microwave with a damp paper towel, oven at 350F for 10-15 min, stovetop with a splash of water/broth)
   - Can it be frozen? How long (most: 2-3 months)?
   - Can leftovers transform into a different meal? (e.g., leftover roast chicken -> chicken salad, soup, quesadillas)
3. Remaining ingredient plan: for ingredients opened but not fully used:
   - Half a bell pepper: use within 3 days in eggs, salad, or snacking
   - Extra herbs: dry them (microwave method: 1 minute between paper towels) or freeze in ice cube trays with oil
   - Opened canned goods: transfer to airtight container, use within 3 days
4. If shopping is needed, list only the missing items with quantities needed for this recipe.

### Output
Nutrition estimate, leftover storage and reheating instructions, remaining ingredient plan, shopping list if needed.
### Quality Gate
Nutrition uses ranges, not false precision. Storage times are specific. Remaining ingredient plan prevents waste.


---

## Worked Example

Illustrative only.

Given typical inputs for What should I eat tonight? Generates a recipe based on what's in your fridge, yo, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) recipe selected based on available ingredients, (2) full recipe with steps, times, and temps written, (3) nutrition estimated, (4) leftover and remaining ingredient plan provided.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| INVENTORY | User lists only 2-3 random items | Work with what's available. Suggest the simplest possible meal (eggs + anything = omelet, bread + anything = sandwich/toast, pasta + butter = dinner). Note what one item would unlock more options |
| INVENTORY | All ingredients are frozen and user needs food in 15 minutes | Suggest: microwave defrost priority protein, pair with rice or pasta (fast starch), frozen vegetables steam in 5 minutes. Alternatively: eggs are the 10-minute protein |
| MATCH | No recipe fits all constraints simultaneously | Relax constraints in order: recent meal avoidance first, then cuisine preference, then time (suggest prepping now and cooking later), then dietary (only relax if user agrees) |
| RECIPE | User is a true beginner and the recipe requires searing or roasting | Add a "technique mini-lesson" for the unfamiliar step. 2-3 sentences on what to look for and common mistakes |
| EXTRAS | Nutrition data unreliable for a specific ingredient | Use "approximately" language and note which ingredient introduced uncertainty. Home cooking nutrition is always an estimate anyway |
| EXTRAS | User has dietary restrictions that conflict with available ingredients | Be direct: "you don't have a protein source that fits vegan/keto/etc. with what's on hand." Suggest the one item to buy that opens the most options |

## State Persistence
- Recent meals log (to avoid repetition across sessions)
- Dietary preferences (so the user doesn't repeat them)
- Pantry staple assumptions (once established, carry forward)
- Favorite recipes (mark for easy repeat)
- Ingredient waste log (track what gets thrown away to adjust future suggestions)

## Reference

### Quick Meal Templates (15 minutes or less)

| Template | Protein Options | Base | Flavor |
|---|---|---|---|
| Stir-fry | Chicken, shrimp, tofu, egg | Rice, noodles | Soy sauce, garlic, ginger |
| Quesadilla | Chicken, beans, cheese | Tortilla | Salsa, cumin, lime |
| Omelet | Eggs, cheese | None (self-contained) | Any vegetable, herb, cheese |
| Fried rice | Egg, any leftover protein | Day-old rice | Soy sauce, sesame oil |
| Pasta + pantry sauce | Canned tuna, pancetta, egg | Pasta | Olive oil, garlic, red pepper flake |
| Wrap/sandwich | Deli meat, canned fish, beans | Bread, tortilla | Mustard, mayo, lettuce |

### Internal Temperature Guide

| Protein | Safe Internal Temp | Ideal for Taste |
|---|---|---|
| Chicken (any cut) | 165F (74C) | 165F |
| Ground beef/pork | 160F (71C) | 160F |
| Beef steak (medium-rare) | 130F (54C) | 130-135F |
| Pork chop/tenderloin | 145F (63C) | 145F |
| Fish (salmon, cod, etc.) | 145F (63C) | 125-140F (preference) |

### Pantry Staples (Assumed Available Unless Stated)

Salt, black pepper, olive oil, vegetable/canola oil, butter, garlic (fresh or powder), onion (fresh or powder), all-purpose flour, sugar, soy sauce, hot sauce, dried Italian seasoning, cumin, paprika, chicken or vegetable broth/bouillon.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
