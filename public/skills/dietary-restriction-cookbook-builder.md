# Dietary Restriction Cookbook Builder

Helps you eat well within your dietary restrictions instead of just surviving them. Whether it's allergies, intolerances, ethical choices, religious requirements, or medical diets -- this builds a personalized system for adapting recipes, navigating restaurants without being "that person," and actually enjoying food instead of treating meals like a problem to solve. Covers ingredient substitutions that actually work (not the ones that technically work but taste terrible), recipe adaptation that preserves the soul of the dish, and strategies for eating out, traveling, and cooking for mixed-diet households. For people who are tired of sad salads and "allergy-friendly" food that nobody would eat by choice.

## Execution Pattern: Phase Pipeline

```
PHASE 1: MAP          --> Document all restrictions, severity levels, and hidden triggers
PHASE 2: SUBSTITUTE   --> Build a substitution library that actually tastes good
PHASE 3: ADAPT        --> Learn to convert any recipe to fit your restrictions
PHASE 4: NAVIGATE     --> Master restaurants, social eating, and travel
PHASE 5: BUILD        --> Create your personalized cookbook of reliable go-to recipes
```

## Inputs
- restrictions: array -- Every dietary restriction: allergies (and severity -- anaphylaxis vs. discomfort), intolerances (lactose, gluten sensitivity), ethical (vegan, vegetarian), religious (halal, kosher, fasting periods), medical (low-sodium, diabetic, renal, low-FODMAP, anti-inflammatory)
- severity: object -- For each restriction: strict avoidance (trace amounts matter), moderate (small amounts okay), or preference (avoid when convenient). This changes everything about the approach
- current_diet: object -- What you eat now, what you miss most, what "restriction-friendly" foods you've tried and hated, cuisines you love, cooking skill level
- household_context: object -- Do you cook for others with different dietary needs? Kids? Partner who eats everything? Feeding a mixed household is its own challenge
- lifestyle_context: object -- (Optional) How often you eat out, travel frequency, work meal situations (catered lunches, business dinners), social eating frequency

## Outputs
- restriction_map: object -- Complete dietary profile with restrictions, severity levels, hidden sources, and cross-contamination risks
- substitution_library: object -- Tested replacements for every restricted ingredient, organized by use case (baking, cooking, sauces, snacking)
- recipe_adaptation_system: object -- Framework for converting any recipe with specific rules for your restrictions
- restaurant_strategy: object -- Cuisine-by-cuisine guide, communication scripts, and safe ordering patterns
- personal_cookbook: object -- 20-30 adapted recipes covering weeknight dinners, meal prep, entertaining, and comfort food

## Execution

### Phase 1: MAP
**Entry criteria:** Person has at least one dietary restriction they're actively managing.
**Actions:**
1. Document every restriction with precision:
   - Specific allergen or ingredient (not just "dairy" -- is it casein, whey, lactose, or all dairy? Not just "gluten" -- is it celiac, wheat allergy, or non-celiac gluten sensitivity? The answer changes the substitution strategy)
   - Severity level: anaphylactic (traces can be lethal, cross-contamination matters, epinephrine must be available), allergic (causes reaction but not life-threatening), intolerant (causes discomfort, small amounts might be okay), or preference (avoiding by choice, occasional exposure is fine)
   - Medical documentation if relevant: diagnosed by a doctor vs. self-identified, any testing done, symptoms experienced
2. Map the hidden sources. Every restricted ingredient hides in unexpected places:
   - Dairy: whey in bread, casein in "non-dairy" cheese, lactose in medications, butter in restaurant cooking (almost everything)
   - Gluten: soy sauce, malt vinegar, salad dressings, oat products (unless certified GF), fried food (shared fryer)
   - Soy: vegetable oil (often soybean), processed foods, Asian sauces, chocolate, baked goods
   - Nuts: pesto, marzipan, praline, curry pastes, granola, "natural flavoring"
   - Eggs: pasta, mayonnaise, baked goods, meatballs, tempura batter, some ice creams
   Build a "hidden sources" reference card for each restriction.
3. Identify cross-contamination risks based on severity:
   - Shared kitchen equipment (toasters, fryers, cutting boards, colanders)
   - Shared cooking oil (restaurant fryers especially)
   - Manufacturing facilities (read "may contain" labels -- for severe allergies, these matter)
   - Bulk bin products (cross-contact is virtually guaranteed)
4. Map current safe foods -- what you already eat and enjoy that naturally fits your restrictions. This is the foundation. You don't need to reinvent every meal; you need to expand from a core of foods you already know work.
5. Identify the "miss most" foods -- the specific dishes or ingredients you crave but can't have in their standard form. These are the adaptation priorities. If you miss pizza, we'll figure out great pizza within your restrictions. If you miss baking, we'll build a baking substitution system.

**Output:** Complete restriction map with hidden sources, cross-contamination risk assessment, safe food inventory, and "miss most" priority list.
**Quality gate:** Every restriction has a specific ingredient and severity level. Hidden sources are documented for each restriction. Safe food list has at least 20 items. "Miss most" list drives the recipe adaptation priorities.

### Phase 2: SUBSTITUTE
**Entry criteria:** Restriction map complete.
**Actions:**
1. Build substitution entries for each restricted ingredient, organized by cooking function (because a dairy substitute in baking is different from a dairy substitute in a sauce):
   - **Dairy in baking:** Oat milk (most neutral flavor), coconut cream (rich, adds slight sweetness), vegan butter (1:1 swap for butter). Avoid almond milk in baking -- too thin, affects structure.
   - **Dairy in sauces:** Cashew cream (blends smooth, neutral flavor), coconut cream (for richness), nutritional yeast (adds umami/cheesy flavor). Full-fat versions always -- low-fat alternatives break in sauces.
   - **Dairy in eating (cheese, yogurt):** Coconut yogurt (best texture), oat-based cheese (best melt), nutritional yeast + cashew for parmesan substitute. Be honest: vegan cheese is getting better but isn't cheese. Set expectations accordingly.
   - **Gluten in baking:** 1:1 GF flour blends (Bob's Red Mill, King Arthur) for most recipes. Add xanthan gum if the blend doesn't include it (1/4 tsp per cup of flour). GF baking is a different beast -- results improve dramatically after the 5th attempt.
   - **Gluten in cooking:** Tamari instead of soy sauce, rice noodles instead of pasta (or GF pasta for shape-specific dishes), cornstarch or arrowroot instead of flour for thickening, GF breadcrumbs or crushed rice cereal for coating.
   - **Eggs in baking:** Flax eggs (1 tbsp ground flax + 3 tbsp water per egg, let sit 5 minutes) for binding. Aquafaba (chickpea liquid, 3 tbsp per egg) for whipping. Applesauce (1/4 cup per egg) for moisture. Each substitute works in different contexts -- there's no universal egg replacement.
   - **Eggs in cooking:** Tofu scramble (firm tofu + turmeric + nutritional yeast + black salt for eggy flavor), Just Egg for closest egg experience.
2. Rate every substitution on the honesty scale:
   - **Seamless:** Nobody would know (tamari for soy sauce, oat milk in coffee, vegan butter in cookies)
   - **Good enough:** Different but satisfying (GF pasta, coconut yogurt, cauliflower rice)
   - **Functional:** Gets the job done but you'll notice (vegan cheese, egg-free meringue, GF bread)
   - **Don't bother:** The substitute is worse than just making something different (fat-free cheese, carob instead of chocolate, cauliflower "steak" as a steak replacement -- just make cauliflower its own delicious thing)
3. For each restriction, identify cuisines that are naturally friendly:
   - Dairy-free: Most East Asian, Middle Eastern, and many Mexican dishes
   - Gluten-free: Indian (rice + lentil based), Thai, Mexican (corn-based), Japanese (rice-based, but watch soy sauce)
   - Vegan: Indian, Ethiopian, Middle Eastern, Thai -- these cuisines have centuries of delicious plant-based cooking
   - Nut-free: Most East Asian, Italian, Southern US
4. Build a "pantry essentials" list for the specific restrictions. Stock these and you can always make something good:
   - GF pantry: rice, GF pasta, tamari, cornstarch, GF flour blend, rice noodles
   - Dairy-free pantry: oat milk, coconut cream, nutritional yeast, vegan butter, good olive oil
   - Egg-free pantry: ground flax, canned chickpeas (for aquafaba), applesauce, firm tofu
5. Test and document substitution ratios precisely. "Use oat milk instead of milk" isn't enough. "Use oat milk 1:1 for milk in baking. Use full-fat oat milk or add 1 tbsp oil per cup for recipes calling for whole milk. For cream, use coconut cream from a chilled can (solid part only)."

**Output:** Substitution library organized by ingredient and cooking function, honesty ratings, naturally-friendly cuisine list, pantry essentials, and precise ratios.
**Quality gate:** Every substitution has a specific ratio and context. Honesty ratings set appropriate expectations. At least 3 naturally-friendly cuisines are identified. Pantry essentials list is stocked in one grocery trip.

### Phase 3: ADAPT
**Entry criteria:** Substitution library built.
**Actions:**
1. Teach the recipe adaptation framework:
   - **Step 1:** Read the entire recipe before changing anything. Understand what each ingredient does (structure, flavor, moisture, leavening, binding).
   - **Step 2:** Identify which ingredients need substitution.
   - **Step 3:** For each, choose the substitute that matches the ingredient's FUNCTION in this specific recipe, not just its category. Butter in a cookie is fat + flavor + structure. Butter in a sauce is fat + emulsification. Different subs for different jobs.
   - **Step 4:** Adjust one thing at a time. Don't swap dairy, gluten, AND eggs simultaneously on the first attempt. Each swap changes the outcome, and if the result is wrong, you won't know which substitute caused it.
   - **Step 5:** Take notes. Write down what you changed and how it turned out. Your personal adaptation notes are worth more than any cookbook.
2. Master the structural adjustments:
   - **GF baking:** Gluten-free batters are often wetter and stickier. Don't add more flour -- that's the wrong instinct. Let the batter rest 15-30 minutes (lets starches hydrate). Bake slightly longer at slightly lower temperature. Add an extra egg (or egg substitute) for structure.
   - **Egg-free baking:** Expect a denser result. Counteract with slightly more leavening (add 1/2 tsp extra baking powder). Flax eggs work for cookies and muffins but struggle in airy cakes -- use aquafaba for those.
   - **Dairy-free cooking:** Fat content matters. If a recipe calls for butter and you use oil, you lose the water content in butter (butter is ~18% water). This affects baking structure. In cooking, it usually doesn't matter.
3. Build a "recipe conversion cheat sheet" specific to the person's restrictions -- a single reference card with the most common swaps and ratios they'll use. Laminate it and keep it in the kitchen.
4. Adapt the "miss most" recipes first. Take the top 5 dishes from Phase 1 and convert them:
   - Attempt 1: Follow the adaptation framework, document everything
   - Taste test honestly: is this satisfying? Not "is this as good as the original" but "would I happily eat this again?"
   - Attempt 2: Adjust based on results
   - If a dish can't be adapted well, acknowledge it and find a different dish that fills the same craving
5. Learn to adapt recipes on the fly -- the real-world skill for when you're cooking from someone else's recipe, following a meal kit, or improvising. The conversion cheat sheet and substitution library make this possible without planning every meal in advance.

**Output:** Recipe adaptation framework, structural adjustment rules for each restriction, conversion cheat sheet, adapted versions of top 5 "miss most" recipes, and on-the-fly adaptation guidance.
**Quality gate:** Framework is systematic (not just "swap things and hope"). Structural adjustments address the science of why subs work differently. At least 5 specific recipes are adapted and tested. Cheat sheet fits on one page.

### Phase 4: NAVIGATE
**Entry criteria:** Substitution library and adaptation skills established.
**Actions:**
1. Build the restaurant strategy by cuisine:
   - **Italian:** Risotto and polenta dishes are naturally GF. Ask about dairy in sauces. GF pasta is increasingly available -- call ahead. Avoid: breaded items, most pasta unless GF, cream sauces (dairy), pesto (nuts/dairy).
   - **Asian (Chinese/Thai/Japanese):** Rice-based dishes are naturally GF (but soy sauce contains wheat -- ask for tamari). Many dishes are dairy-free. Watch for: peanuts/tree nuts in Thai and Chinese, hidden egg in fried rice, shared fryer oil. Sushi is often safe for many restrictions.
   - **Mexican:** Corn tortillas, rice, beans, grilled meats, and salsas are naturally GF and dairy-free. Watch for: flour tortillas, cheese and sour cream on everything (ask to hold them), lard in beans (varies by restaurant).
   - **Indian:** Many naturally vegan dishes (dal, chana masala, aloo gobi). Naan contains gluten -- stick to rice. Watch for: ghee (dairy) in many dishes, cream in curries, hidden dairy in breads.
2. Develop the restaurant communication script. Direct, clear, and non-apologetic:
   - "I have a [allergy/restriction] to [specific ingredient]. Can you tell me which dishes don't contain it?"
   - "Can this be made without [ingredient]? I'm not asking for a flavor preference -- it's a medical issue." (For severe allergies only -- don't overuse this)
   - "Is the fryer shared with items containing [allergen]?" (For severe allergies)
   - Call ahead for serious allergies. Busy dinner service is not when you want the kitchen learning about your anaphylactic nut allergy.
3. Social eating strategy -- the part nobody talks about:
   - Eat something small before events where food options are uncertain
   - At dinner parties, tell the host your restrictions when you RSVP, not when you arrive. Offer to bring a dish that fits your needs AND is delicious enough that everyone wants some
   - Have a script for the inevitable "oh come on, a little won't hurt you" comment. For allergies: "Actually, it will -- my body treats it like poison." For ethical/religious: "I appreciate the thought, but this is non-negotiable for me."
   - Don't make your restriction everyone else's problem, but don't apologize for having it either
4. Travel eating strategy:
   - Research restaurants before the trip using allergy-specific apps (AllergyEats, Find Me Gluten Free, HappyCow for vegan)
   - Pack emergency snacks: protein bars, nuts (if safe), dried fruit, shelf-stable items
   - Learn key phrases in the local language: "I am allergic to [ingredient]" and "Does this contain [ingredient]?" Translation cards exist for severe allergies -- carry one
   - Hotel rooms with mini-kitchens solve 80% of travel eating problems
5. Work and social situations:
   - Catered lunches: ask the organizer about allergen info in advance, not at the table
   - Business dinners: suggest the restaurant (so you know the menu) or review the menu online and call with questions before the dinner
   - Potlucks: bring something amazing that fits your restrictions. You eat your own dish plus whatever else is safe. Nobody notices or cares if you skip the casserole.

**Output:** Cuisine-by-cuisine restaurant guide, communication scripts, social eating strategies, travel eating plan, and work situation handling.
**Quality gate:** Restaurant guide covers at least 5 cuisines with specific safe and unsafe items. Communication scripts are tested and non-awkward. Social strategies address the emotional/social side, not just logistics. Travel plan includes preparation steps.

### Phase 5: BUILD
**Entry criteria:** All skills developed -- ready to build the personal cookbook.
**Actions:**
1. Create the recipe collection organized by real-life need:
   - **Weeknight dinners (15):** Under 30 minutes, minimal dishes, feeds the household. These are the backbone.
   - **Meal prep (5):** Recipes that store well, reheat well, and work for lunches.
   - **Comfort food (5):** The adapted versions of the "miss most" dishes plus new favorites.
   - **Entertaining (5):** Dishes impressive enough for guests that happen to be restriction-friendly (don't announce the restrictions -- let the food speak).
   - **Breakfast/snacks (5):** Quick options that aren't just fruit or rice cakes.
2. For each recipe, include:
   - Complete ingredient list with restriction-safe versions specified
   - Step-by-step instructions with any special notes for the substitutions
   - "Make it better" tips (optional upgrades that take it from good to great)
   - "Make it faster" tips (shortcut versions for busy nights)
   - Storage and reheating instructions
   - What to serve it with (complete meal suggestions)
3. Build a weekly meal rotation system:
   - Plan 2 weeks of dinners (14 meals from the weeknight dinner collection)
   - Generate the shopping list automatically from the recipes
   - Build in 1-2 "leftover nights" and 1 "easy night" (eggs, sandwiches, whatever your restriction-friendly version of zero-effort food is)
   - Rotate the 2-week plan monthly, swapping in new recipes as you develop them
4. Create a "crowd-pleaser" sub-collection: 5-7 recipes that people without dietary restrictions genuinely love. These are your dinner party weapons. The goal is food so good that "oh, it's also gluten-free" is an afterthought, not the headline.
5. Set up a recipe testing and rating system: try each recipe at least twice before it earns a permanent spot. Rate on taste (would you make this by choice, not just necessity?), ease (is this realistic on a Wednesday?), and reliability (does it work every time?). Drop anything below 7/10 on all three.

**Output:** 30-recipe personal cookbook organized by use case, weekly meal rotation with shopping lists, crowd-pleaser collection, and recipe rating system.
**Quality gate:** All 30 recipes are tested and rated. Every recipe includes restriction-safe ingredients, not generic "use your substitute." Weeknight dinners are genuinely under 30 minutes. Crowd-pleasers are verified with non-restricted eaters.

## Exit Criteria
Done when: (1) complete restriction map with hidden sources and severity levels exists, (2) substitution library covers every restricted ingredient with ratios and context, (3) recipe adaptation framework enables converting any standard recipe, (4) restaurant and social eating strategies are practical and tested, (5) personal cookbook has at least 20 rated and tested recipes.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| MAP | Person has multiple overlapping restrictions (GF + dairy-free + low-FODMAP) | Adjust -- prioritize by severity. Address the strictest restriction first, then layer others. Identify cuisines and recipes that naturally satisfy all restrictions simultaneously |
| MAP | Person isn't sure about all their triggers | Adjust -- recommend a structured elimination diet with medical supervision. In the meantime, build the system around confirmed restrictions and expand as new ones are identified |
| SUBSTITUTE | Substitutions taste bad | Adjust -- not all subs are equal. Try a different brand or type (oat milk varies wildly by brand). Sometimes the answer isn't substituting -- it's making a different dish that doesn't need the restricted ingredient |
| ADAPT | A treasured recipe can't be adapted satisfactorily | Adjust -- accept it honestly. Not every dish converts well. Grieve the loss (it's real), then invest energy in discovering new favorites rather than chasing an imitation that disappoints |
| NAVIGATE | Restaurant staff don't take restrictions seriously | Adjust -- for severe allergies, this is dangerous. Stick to restaurants with allergen training. For less severe restrictions: order simple dishes with fewer components (grilled fish, steamed rice, roasted vegetables) where you can see what's in the food |
| NAVIGATE | Travel to a region with limited safe options | Adjust -- lean heavily on self-catering. Grocery stores and markets are everywhere. Simple meals from fresh ingredients you control are safer than restaurant guessing |
| BUILD | Person gets bored eating the same safe recipes | Adjust -- expand the cuisine range. If you've been cooking Italian, try Thai. If you've been cooking Thai, try Ethiopian. Every new cuisine adds 5-10 naturally safe dishes to the rotation |

## State Persistence
- Complete restriction profile with severity levels and hidden sources
- Substitution library with brand preferences and ratio notes
- Adapted recipe collection with ratings and personal notes
- Restaurant safe-order reference by cuisine and specific restaurants tried
- Shopping list templates for weekly meal rotations
- New recipe test results and queue (what to try next)
- Trigger/reaction log (if still identifying sensitivities)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
