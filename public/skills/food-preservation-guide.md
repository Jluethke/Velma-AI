# Food Preservation Guide

Teaches you how to make food last -- from basic freezing techniques that don't turn everything into freezer-burnt sadness, through canning and pickling that's safe and actually delicious, to fermentation that turns cabbage into something you'd pay $12 for at a farmers market. Covers freezing, water bath canning, pressure canning, quick pickling, fermentation, and dehydrating. Not a hippie homesteading manual (though homesteaders welcome). This is for anyone who's tired of throwing away food, wants to save money on groceries, wants to eat seasonally year-round, or just thinks homemade pickles and hot sauce sound incredible. Safety first on every method -- botulism is not a flavor profile.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSESS       --> Evaluate what you want to preserve, why, and what equipment you need
PHASE 2: FREEZE       --> Master freezing techniques that maintain quality
PHASE 3: PICKLE       --> Quick pickles and fermented pickles for flavor and preservation
PHASE 4: CAN          --> Water bath and pressure canning for shelf-stable goods
PHASE 5: FERMENT      --> Lacto-fermentation, kombucha, and other living-food techniques
PHASE 6: STORE        --> Labeling, rotation, safety checks, and inventory management
```

## Inputs
- preservation_goals: object -- Why you're preserving: reduce food waste, save money, garden harvest management, eat seasonally, self-sufficiency, hobby interest, make gifts (jams, hot sauce, pickles)
- current_experience: string -- None (never done it), basic (freeze leftovers), intermediate (some canning or pickling), advanced (multiple methods, looking to expand)
- food_sources: object -- Garden produce, CSA box, bulk buying, farmers market, hunting/fishing, orchard access. What you have too much of and when
- kitchen_setup: object -- Available equipment (freezer space, stock pot, pressure canner, fermentation crocks, dehydrator), storage space (pantry, root cellar, basement, apartment closet), stove type
- priorities: array -- (Optional) Which methods interest you most, specific foods you want to preserve, dietary considerations (low-sugar jams, low-sodium pickles)

## Outputs
- preservation_plan: object -- Which methods match your goals, equipment needs, and seasonal calendar
- freezing_guide: object -- Technique guides for proteins, produce, prepared meals, and baked goods
- pickling_guide: object -- Quick pickle recipes, fermented pickle techniques, and brine ratios
- canning_guide: object -- Water bath and pressure canning procedures with safety protocols
- fermentation_guide: object -- Sauerkraut, kimchi, hot sauce, and other fermented foods
- storage_system: object -- Labeling, rotation, inventory tracking, and safety inspection protocols

## Execution

### Phase 1: ASSESS
**Entry criteria:** Person wants to preserve food and has at least a freezer.
**Actions:**
1. Match preservation methods to goals:
   - **Reduce waste:** Freezing is the easiest entry point. Pickle or ferment fresh produce before it goes bad. Quick pickles take 15 minutes.
   - **Save money:** Buy in bulk when cheap, freeze in portions. Can seasonal produce when it's abundant and affordable. Make stocks from scraps.
   - **Garden management:** Canning and freezing handle the August tomato avalanche. Ferment the cabbage. Dehydrate herbs. Pickle everything else.
   - **Hobby/gifts:** Hot sauce, jams, pickles, fermented foods, and infused vinegars make incredible gifts that cost $3 to make and look like $15.
2. Assess available equipment and what needs to be added:
   - **Freezing (minimal buy-in):** Freezer bags, freezer-safe containers, a vacuum sealer ($30-60, optional but extends freezer life 3-5x), permanent marker for dating.
   - **Quick pickling (minimal):** Mason jars (any size), vinegar, salt, spices. You already have everything.
   - **Water bath canning ($30-50 startup):** Large stock pot with a rack (or buy a canning pot), jar lifter, funnel, mason jars with two-piece lids, instant-read thermometer.
   - **Pressure canning ($80-200 startup):** Pressure canner (NOT a pressure cooker -- they're different), everything from water bath canning. This is required for low-acid foods (vegetables, meats, soups).
   - **Fermentation ($10-30 startup):** Mason jars with airlock lids (or just use a regular lid loosely), salt, vegetables. Fermentation crocks are nice but not required.
   - **Dehydrating ($40-100 startup):** Food dehydrator or an oven that goes to 170F with the door propped open.
3. Build a seasonal preservation calendar:
   - **Spring:** Rhubarb jam, pickled asparagus, herb drying begins
   - **Summer:** Tomato canning (sauce, salsa, whole), berry jams, pickled peppers, fermented hot sauce, frozen corn and green beans
   - **Fall:** Apple butter, pear preserves, sauerkraut and kimchi season, root vegetable storage, dried herbs
   - **Winter:** Citrus marmalade, meat preservation (jerky, cured), stock making from stored bones, planning for next year
4. Set realistic expectations for the first season. Don't try every method at once. Pick one:
   - Complete beginner: Start with freezing properly, then add quick pickles
   - Some experience: Add water bath canning (jams and pickled vegetables are the easiest)
   - Intermediate: Add fermentation or pressure canning
5. Address food safety upfront. Preservation is controlled science, not vibes:
   - Botulism is the primary risk in canning -- it's odorless, tasteless, and potentially fatal. Only use tested recipes from trusted sources (USDA, Ball, National Center for Home Food Preservation). Never invent canning recipes.
   - Fermentation is extremely safe when done correctly -- the acid and salt environment prevents harmful bacteria
   - Freezing is inherently safe (nothing grows at 0F) but quality degrades over time
   - When in doubt about whether something is safe to eat: throw it away. No preserved food is worth a hospital visit.

**Output:** Matched preservation methods with goal alignment, equipment checklist with costs, seasonal calendar, first-season plan, and food safety ground rules.
**Quality gate:** Methods match goals and equipment availability. Equipment costs are realistic. Seasonal calendar is region-appropriate. Safety rules are non-negotiable and clearly stated.

### Phase 2: FREEZE
**Entry criteria:** Person has freezer space and wants to reduce waste or batch-cook.
**Actions:**
1. Master the fundamentals that prevent freezer quality loss:
   - **Air is the enemy.** Air causes freezer burn (those gray, dry, leathery patches). Remove as much air as possible. Vacuum sealers are the gold standard. Without one: press air out of freezer bags before sealing, or use the water displacement method (submerge the bag slowly in water, letting the water pressure push air out, then seal at the waterline).
   - **Flash freeze before bagging.** Spread items in a single layer on a sheet pan, freeze until solid (1-2 hours), then transfer to bags. This prevents the frozen-block-of-berries problem where everything sticks together.
   - **Cool before freezing.** Never put hot food in the freezer -- it raises the temperature and partially thaws surrounding items. Cool cooked food to room temperature, then refrigerate for an hour, then freeze.
   - **Freeze in usable portions.** A 5-pound block of frozen chili is useless when you need dinner for two. Freeze in single-meal or single-recipe portions.
2. Produce freezing guide:
   - **Blanch first (most vegetables):** Boil for 1-3 minutes, then immediately plunge into ice water. This stops enzyme activity that causes color, flavor, and texture loss. Corn: 4 minutes. Green beans: 3 minutes. Broccoli: 3 minutes. Peas: 1.5 minutes.
   - **Don't blanch:** Peppers (just chop and freeze), onions, herbs (freeze in olive oil in ice cube trays), tomatoes (freeze whole, skin peels right off when thawed).
   - **Fruits:** Flash freeze on a sheet pan, then bag. No blanching needed. Add a sprinkle of sugar or lemon juice to prevent browning on light fruits (peaches, apples). Berries freeze beautifully with zero prep.
3. Protein freezing guide:
   - Wrap tightly in plastic wrap, then in a freezer bag (double protection). Or vacuum seal.
   - Portion before freezing: individual chicken breasts, one-pound ground meat packets, individual fish fillets.
   - Freeze storage times for quality (food is safe indefinitely at 0F, but quality degrades): chicken 9-12 months, beef 6-12 months, pork 4-6 months, fish 3-6 months, ground meat 3-4 months.
4. Prepared meal freezing:
   - Soups and stews: excellent freezers. Leave 1 inch of headspace in containers (liquid expands). Freeze in flat bags for faster thawing and space efficiency.
   - Casseroles: assemble but don't bake, freeze. Bake from frozen (add 30-60 minutes to bake time).
   - Sauces: freeze in ice cube trays, then transfer cubes to bags. Each cube is roughly 2 tablespoons -- perfect for adding to recipes.
   - Baked goods: most baked goods freeze well for 2-3 months. Cool completely, wrap tightly, bag. Thaw at room temperature.
   - Things that DON'T freeze well: anything cream-based (separates), raw vegetables with high water content (lettuce, cucumbers, celery), fried foods (go soggy), mayonnaise-based salads, hard-boiled eggs.
5. Thawing safely:
   - **Best:** Refrigerator overnight (plan ahead -- this takes 24 hours for large items)
   - **Good:** Cold water bath (submerged in cold water, changed every 30 minutes)
   - **Okay:** Microwave defrost (cook immediately after)
   - **Never:** Room temperature on the counter. The outside thaws and enters the danger zone (40-140F) while the inside is still frozen. This is how people get sick.

**Output:** Freezing technique guide for produce, proteins, and prepared meals. Flash freeze method. Blanching times. Storage duration chart. Thawing protocols.
**Quality gate:** Air removal methods are explained. Blanching times are specific per vegetable. Storage times are realistic (not "forever"). Thawing includes food safety rules.

### Phase 3: PICKLE
**Entry criteria:** Freezing basics understood, ready to expand methods.
**Actions:**
1. Quick pickles (refrigerator pickles) -- the gateway method:
   - Basic brine ratio: 1 cup vinegar (5% acidity, use white, apple cider, or rice vinegar) + 1 cup water + 1 tablespoon salt + 1 tablespoon sugar. Heat until dissolved. Pour over vegetables in a jar. Refrigerate. Ready in 1-24 hours depending on vegetable thickness.
   - This works for virtually any vegetable: cucumbers, onions, carrots, radishes, jalapenos, green beans, cauliflower, beets, garlic.
   - Flavor additions (add to the brine): whole peppercorns, dill, garlic, mustard seed, red pepper flakes, bay leaves, coriander, ginger, turmeric.
   - Quick pickles last 2-3 months in the refrigerator. They're not shelf-stable -- fridge only.
2. Fermented pickles (the real deal) -- naturally preserved through lacto-fermentation:
   - Salt brine method: 2 tablespoons non-iodized salt per quart of water. Submerge vegetables completely (they must stay under the brine -- use a weight). Cover loosely (fermentation produces CO2 that needs to escape). Room temperature for 3-7 days depending on taste preference.
   - These are the crunchy, complex, probiotic-rich pickles you can't buy in a regular grocery store. The flavor develops over time -- taste daily starting at day 3.
   - Signs of healthy fermentation: bubbles, slightly cloudy brine, tangy sour smell. Signs of problems: pink or black mold on surface (skim it off if small, discard if extensive), foul smell (not sour -- foul), slimy texture.
3. Build a "pickle everything" reference:
   - **Cucumbers:** Classic dill (brine + dill + garlic + peppercorn). Use small, firm cucumbers. Cut off blossom end (contains enzymes that soften pickles). Add a grape leaf or oak leaf for crunch (the tannins help).
   - **Onions:** Quick pickled red onions (vinegar + sugar + salt, 30 minutes). These go on everything -- tacos, sandwiches, salads, burgers. Make a jar every week.
   - **Jalapenos/peppers:** Quick pickle in vinegar brine with garlic. Slice into rings. Ready in 2 hours. Last months in the fridge.
   - **Carrots and radishes:** Fermented or quick pickled. Cut into sticks for snacking. Add to banh mi, grain bowls, and tacos.
   - **Kimchi-style:** Napa cabbage, salt, gochugaru (Korean red pepper flakes), garlic, ginger, fish sauce (or soy sauce for vegan). Ferment 3-5 days. Possibly the single most versatile condiment you can make.
4. Troubleshooting:
   - **Soft pickles:** Not enough salt, too warm during fermentation, or blossom end wasn't removed. Prevention: measure salt precisely, ferment below 75F.
   - **Too salty:** Dilute brine or soak pickles in plain water for 30 minutes before eating.
   - **Mold on top:** Skim it off. If the brine below is clear and smells tangy (not putrid), the pickles are fine. Mold on the surface is common and not dangerous in fermentation -- it's a sign the vegetables weren't fully submerged.
   - **Nothing happening after 3 days:** Too cold, not enough salt, or vegetables were treated with anti-microbial produce wash. Use organic vegetables for fermentation. Move to a warmer spot.
5. Storage: quick pickles in the fridge (2-3 months). Fermented pickles can be refrigerated after reaching desired tanginess (slows fermentation, lasts 6+ months). For long-term shelf storage, fermented pickles must be processed in a water bath canner.

**Output:** Quick pickle master recipe with variations, fermented pickle technique with brine ratios, vegetable-specific guides, troubleshooting, and storage protocols.
**Quality gate:** Brine ratios are precise. Fermentation signs (healthy vs. problematic) are clearly described. At least 5 vegetable-specific pickle recipes are included. Storage distinguishes fridge vs. shelf-stable methods.

### Phase 4: CAN
**Entry criteria:** Comfortable with pickling, ready for shelf-stable preservation.
**Actions:**
1. Water bath canning -- for HIGH-ACID foods only (pH below 4.6):
   - What you can water bath: fruit jams/jellies, pickles (with vinegar brine), tomatoes (with added acid), fruit butters, salsa (tested recipes only), whole fruits in syrup, marmalades.
   - What you CANNOT water bath: plain vegetables, meats, soups, stocks, low-acid sauces. These require pressure canning. No exceptions. This is a botulism safety line, not a suggestion.
   - Process: sterilize jars, fill with hot product leaving 1/4-1/2 inch headspace, remove air bubbles, wipe rims clean, apply two-piece lids (fingertip tight, not gorilla tight), process in boiling water for specified time, remove and cool on a towel for 12-24 hours, check seals.
2. Water bath technique details:
   - Jars must be submerged by at least 1 inch of water. Start timing when water returns to a full rolling boil after jars are added.
   - Processing times vary by recipe and altitude. At 1,000+ feet, add processing time (1,000-3,000 feet: add 5 minutes; 3,000-6,000 feet: add 10 minutes; 6,000+ feet: add 15 minutes).
   - Checking the seal: after cooling, press the center of the lid. If it doesn't flex, it's sealed. If it pops up and down, it didn't seal -- refrigerate and use within 2 weeks, or reprocess within 24 hours with a new lid.
   - Never reuse lids (the sealing compound is one-use). Rings and jars can be reused indefinitely if they're not cracked or chipped.
3. Starter recipes for water bath canning:
   - **Strawberry jam:** The classic first project. 4 cups crushed strawberries + 7 cups sugar + 1 package pectin. Process 10 minutes. Makes about 8 half-pint jars.
   - **Bread and butter pickles:** Sliced cucumbers + onions in vinegar/sugar/turmeric/mustard seed brine. Process 10 minutes.
   - **Whole tomatoes:** Blanch, peel, pack into jars with 2 tablespoons lemon juice per quart (required for safe acidity). Process 45 minutes for quarts.
   - **Apple butter:** Cook down applesauce with cinnamon, cloves, and sugar until thick. Process 10 minutes for half-pints.
4. Pressure canning -- for LOW-ACID foods:
   - Required for: vegetables (green beans, corn, carrots), meats (chicken, beef, pork), soups, stocks, and anything without enough acid to prevent botulism.
   - The pressure raises the temperature above 212F (boiling) to 240F, which is the temperature needed to kill botulism spores. Water bath canning cannot reach this temperature.
   - Process: follow recipe for pressure and time (typically 10-15 PSI for 20-90 minutes depending on food and jar size). The pressure gauge MUST be accurate -- have it tested annually at your county extension office (free).
   - Let the canner depressurize naturally. NEVER force-cool or open the petcock while under pressure. This is a safety requirement and also prevents jar breakage and siphoning.
5. Absolute safety rules for canning:
   - Only use tested recipes from USDA, Ball/Kerr, or the National Center for Home Food Preservation. Do not use recipes from blogs, Pinterest, or grandma's handwritten cards (unless they match tested recipes). Botulism toxin is invisible and tasteless.
   - Never can in an oven, dishwasher, or microwave. These methods don't achieve reliable, sustained temperatures.
   - Never alter canning recipes: don't reduce acid, change proportions, add thickeners, or substitute ingredients. These changes affect pH and safety.
   - If a jar has a broken seal, is bulging, smells off, or has cloudy liquid when it should be clear -- discard without tasting. Botulism can be fatal in tiny amounts.

**Output:** Water bath canning procedure, altitude adjustment chart, starter recipes, pressure canning overview, and non-negotiable safety rules.
**Quality gate:** Acid safety line is clearly drawn (what can vs. cannot be water bathed). Processing times are specific with altitude adjustments. Safety rules are unambiguous and repeated. Starter recipes are from tested sources.

### Phase 5: FERMENT
**Entry criteria:** Pickling and canning basics understood, interested in living-food preservation.
**Actions:**
1. Lacto-fermentation fundamentals:
   - The science: salt creates an environment where lactobacillus bacteria thrive and harmful bacteria can't survive. The lactobacillus converts sugars into lactic acid, which preserves the food and creates that characteristic tangy flavor. You're not adding bacteria -- they're already on the vegetables. You're just creating the conditions for them to dominate.
   - The ratio: 2-3% salt by weight for dry-salted ferments (sauerkraut, kimchi), 3.5-5% salt brine for submerged ferments (pickles, vegetables in brine). Use a kitchen scale -- this is one place where measuring by volume is unreliable.
   - Temperature: 65-75F is ideal. Warmer ferments faster (and funkier). Cooler ferments slower (and milder). Above 80F risks off-flavors and soft textures. Below 60F, fermentation may not start at all.
2. Master sauerkraut -- the best first fermentation project:
   - Shred 1 medium head of cabbage. Toss with 1 tablespoon salt (about 2% of cabbage weight). Massage and squeeze with your hands for 5-10 minutes until the cabbage releases liquid and looks wet and wilted.
   - Pack tightly into a clean jar, pressing down so the liquid rises above the cabbage. Leave 1-2 inches of headspace. Weight the cabbage down (a smaller jar filled with water works, or a purpose-made fermentation weight).
   - Cover loosely. Ferment at room temperature for 1-4 weeks, tasting starting at day 5. When it tastes the way you like it, move it to the fridge.
   - Variations: add caraway seeds (classic), juniper berries, garlic, shredded carrot, or apple for different flavors. Curtido (Salvadoran sauerkraut with oregano and hot pepper) is outstanding.
3. Fermented hot sauce:
   - Chop peppers (any kind -- habanero, jalapeno, serrano, or a mix), garlic, and optionally onion or fruit (mango, pineapple, peach).
   - Add 2-3% salt by weight. Pack into a jar, submerge under brine. Ferment 1-4 weeks.
   - Blend with vinegar to desired consistency. Strain for smooth sauce or leave chunky.
   - This is how you make hot sauce that's actually complex and interesting, not just hot. The fermentation develops flavor that vinegar-only sauces can't match.
4. Other fermentation projects ranked by difficulty:
   - **Easy:** Fermented salsa (same technique as pickles but with tomatoes, peppers, onions, and cilantro). Fermented honey garlic (garlic cloves in honey, flip daily for a month -- incredible on pizza and cheese).
   - **Moderate:** Kimchi (cabbage, gochugaru, garlic, ginger, fish sauce, scallions -- the technique is similar to sauerkraut but with a paste). Kombucha (sweetened tea + SCOBY, ferment 7-14 days, second ferment with fruit for carbonation).
   - **Advanced:** Miso (soybeans + koji + salt, ferment months to years). Tempeh (soybeans + tempeh starter, 48-hour controlled fermentation at 85-90F). Vinegar (alcohol + mother of vinegar, weeks to months).
5. Fermentation troubleshooting:
   - **Kahm yeast (white film on surface):** Not harmful but tastes bad. Skim it off. Ensure vegetables are fully submerged. More common in warmer temps.
   - **Too salty:** Use less salt next time (but never below 2% -- that's the safety floor). Rinse the fermented vegetables before eating.
   - **Too sour:** Fermented too long or too warm. Taste earlier in the process next time. Move to the fridge sooner.
   - **Nothing is happening:** Not enough salt, too cold, or chlorinated water killed the bacteria. Use non-chlorinated water (let tap water sit uncovered for 24 hours to off-gas chlorine). Use non-iodized salt (iodine inhibits fermentation).

**Output:** Lacto-fermentation technique guide, sauerkraut master recipe, fermented hot sauce recipe, project difficulty ranking, and troubleshooting guide.
**Quality gate:** Salt ratios are by weight, not volume. Temperature ranges are specific. Troubleshooting addresses the actual problems beginners encounter. Safety distinction is clear (fermentation is safe when salt levels are correct).

### Phase 6: STORE
**Entry criteria:** Preserved foods are being produced and need organization.
**Actions:**
1. Labeling system -- non-negotiable for every preserved item:
   - What it is (be specific -- "strawberry jam" not "jam")
   - Date preserved
   - Method (frozen, canned, fermented)
   - Use-by date based on method (frozen produce: 12 months, frozen meat: 6-12 months, canned goods: 12-18 months, fermented: 6-12 months refrigerated)
   - Use masking tape and permanent marker. Fancy labels are nice but not necessary. Consistent labeling IS necessary.
2. Storage conditions by method:
   - **Frozen:** 0F or below. Use a freezer thermometer to verify (many home freezers run warmer than you think). Organize by type: proteins on one shelf, vegetables on another, prepared meals on a third.
   - **Canned goods:** Cool, dark, dry location. 50-70F is ideal. Never store canned goods where they can freeze (expansion can break seals) or above 95F (accelerates quality loss). Not in direct sunlight.
   - **Fermented (refrigerated):** 35-40F. Fermented foods stay alive in the fridge -- they'll continue to develop flavor slowly. Place in a designated area to avoid cross-contamination of flavors.
   - **Dehydrated:** Airtight containers with oxygen absorbers in a cool, dark place. Vacuum-sealed bags are ideal. Properly dried food at room temperature lasts 6-12 months.
3. Rotation system (first in, first out):
   - New items go to the back, older items to the front. This is not optional -- it's how you avoid finding a mystery jar from 3 years ago.
   - Monthly inventory check: scan for expired items, check can seals, look for freezer burn on frozen items.
   - Track what you're actually using vs. what sits untouched. If you're canning 20 jars of apple butter but only eating 5 per year, scale back next season.
4. Safety inspection protocol:
   - Before opening any preserved food, check for: broken or swollen seal, off odors, unusual color, mold, cloudiness in liquid that should be clear, leaking.
   - When in doubt, throw it out. The cost of a jar of preserved food is never worth the risk.
   - Keep a log of any preservation failures (jars that didn't seal, ferments that went wrong, freezer burn). These inform better technique next time.
5. Inventory management for the preservation year:
   - Track total preserved: how many jars/bags/containers of each item
   - Track consumption rate: how fast you're going through each item
   - Plan next season's preservation based on actual consumption, not enthusiasm (everyone over-preserves in their first year -- that's okay, just adjust)
   - Keep a wish list: items you want to try preserving next season, recipes to try, equipment to add

**Output:** Labeling system, storage condition guide, rotation protocol, safety inspection checklist, and annual inventory management system.
**Quality gate:** Every item is labeled with content, date, and method. Storage conditions are specific by method. Rotation system prevents forgotten items. Safety checks are explicit and err on the side of caution.

## Exit Criteria
Done when: (1) preservation plan matches goals with equipment and seasonal calendar, (2) freezing technique covers produce, proteins, and prepared meals, (3) pickling covers both quick and fermented methods, (4) canning covers water bath with safety rules clearly stated, (5) fermentation has at least 3 starter projects, (6) storage system has labeling, rotation, and safety inspection protocols.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | Person has no freezer space and minimal equipment | Adjust -- focus on methods that don't require a freezer: quick pickling (fridge only), fermentation (counter then fridge), and dehydrating (oven works). Build from there |
| FREEZE | Severe freezer burn despite best efforts | Adjust -- check freezer temperature (must be 0F). Switch to vacuum sealing. Reduce storage time. Freezer-burnt food is safe but low quality -- use it in soups and stews where texture matters less |
| PICKLE | Fermented vegetables go soft | Adjust -- use fresher produce (picked within 24 hours if possible), ensure adequate salt, ferment at cooler temperatures, add tannin-containing leaves (grape, oak, horseradish) |
| CAN | Jars consistently fail to seal | Adjust -- check procedure: rim wiped clean? Fresh (not reused) lids? Proper headspace? Fingertip-tight bands? Processing time correct? If all correct, try a different lid brand or check the jar rim for chips |
| CAN | Person wants to can a recipe that isn't in tested sources | Escalate -- do not improvise canning recipes. Either find a tested version, modify to match a tested recipe's proportions exactly, or use a different preservation method (freeze it instead). Botulism is not worth the experiment |
| FERMENT | Person is worried about safety of fermentation | Adjust -- explain the science: properly salted ferments have been safe food preservation for thousands of years. The salt + acid environment is actively hostile to pathogens. Start with sauerkraut (simplest, most forgiving) to build confidence |
| STORE | Preserved inventory is getting out of control | Adjust -- scale back production. Give excess away. Focus next season on items with highest consumption rate. A smaller, rotating inventory beats a basement full of jars you'll never eat |

## State Persistence
- Preservation inventory (what's preserved, method, date, quantity, storage location)
- Consumption tracking (what gets used, what sits)
- Recipe log with personal notes (what worked, what to change)
- Seasonal calendar with planned preservation activities
- Equipment inventory and maintenance schedule (pressure gauge testing, seal replacements)
- Failure log (what went wrong and why -- critical for improving technique)
- Cost tracking (ingredients + equipment vs. grocery savings)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
