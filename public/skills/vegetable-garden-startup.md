# Vegetable Garden Startup

Takes you from "I want to grow food" to actually harvesting something edible, even if the closest you've come to gardening is keeping a grocery store basil alive for a week. Covers picking the right spot, building soil that plants actually want to grow in, timing your seeds so they don't freeze or fry, pairing plants that help each other (and separating the ones that don't), and tracking your harvest so next year is even better. No Instagram-perfect raised beds required -- this works for a backyard plot, containers on a balcony, or a community garden space.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SITE SELECTION    --> Find the best spot and figure out what you're working with
PHASE 2: SOIL PREP         --> Build soil that plants actually thrive in (not just dirt)
PHASE 3: SEED TIMING       --> Plan what to plant and exactly when to plant it
PHASE 4: COMPANION PLANT   --> Pair plants strategically for pest control and better yields
PHASE 5: GROW & HARVEST    --> Maintain the garden and track what works
```

## Inputs
- space: object -- Available area (backyard, raised bed, containers, community plot), approximate square footage, sun exposure (full sun, partial shade, mostly shade), orientation (south-facing is ideal in Northern Hemisphere)
- climate: object -- USDA hardiness zone (or location for lookup), average last frost date, average first frost date, typical summer temps, rainfall patterns
- experience_level: string -- None, tried-and-failed, some success, or experienced
- goals: object -- What you want to grow (vegetables, herbs, or both), priorities (maximum food production, easy wins for beginners, specific crops you love to eat), organic preference
- constraints: object -- Time available per week for gardening, budget for setup, water access (hose, rain barrel, hauling buckets), physical limitations, HOA or lease restrictions

## Outputs
- site_plan: object -- Garden layout with dimensions, sun mapping, water access plan, and bed/container placement
- soil_recipe: object -- Soil amendments needed, composting basics, pH targets, and fertilizer schedule
- planting_calendar: object -- Week-by-week schedule of what to plant indoors, direct sow, and transplant
- companion_map: object -- Plant pairing guide showing what grows well together and what to keep apart
- harvest_tracker: object -- Expected harvest dates, yield estimates, and season review template

## Execution

### Phase 1: SITE SELECTION
**Entry criteria:** Available space and climate information provided.
**Actions:**
1. Map the sun exposure. This is the single biggest factor in garden success. Most vegetables need 6-8 hours of direct sunlight daily. Tomatoes, peppers, squash, and cucumbers need full sun (8+). Lettuce, spinach, kale, and herbs can handle partial shade (4-6 hours). If you only get 4 hours of sun, grow leafy greens and herbs -- don't set yourself up for failure trying to grow tomatoes in shade.
2. Check water access. A garden 100 feet from the nearest hose with no rain barrel will be abandoned by July. You need convenient water -- either a hose that reaches, drip irrigation, or containers near a faucet. Budget for a soaker hose ($15-30) if running a garden bed -- it saves water, time, and keeps leaves dry (which prevents disease).
3. Evaluate drainage. Dig a hole 12 inches deep, fill it with water, and time how long it takes to drain. Under 4 hours is great. Over 12 hours means the soil is waterlogged and you'll need raised beds or significant amendment. Standing water = root rot = dead plants.
4. Size the garden to your life, not your ambition. A 4x8 foot raised bed or 4-6 large containers is plenty for a beginner. This is roughly 32 square feet and can produce surprising amounts of food. A 200 square foot garden sounds exciting in March and becomes a weed jungle by August if you don't have the time to maintain it. Start small. Expand next year.
5. Decide on garden type:
   - **In-ground:** Cheapest, most space, but requires soil amendment and more weeding
   - **Raised beds:** Best soil control, easier on the back, good drainage, but costs $50-200 per bed to build and fill
   - **Containers:** Perfect for patios and balconies, most portable, but needs more frequent watering (daily in summer) and larger containers than you think (minimum 5 gallons per plant for tomatoes/peppers)
6. Check for problems: nearby trees with aggressive roots (black walnut is toxic to many vegetables), lead contamination in urban soil (test for $15-30 through your county extension office), overhead wires that limit height, and areas where dogs frequent.

**Output:** Garden site plan with dimensions, sun map (hours of direct light by area), water access solution, drainage assessment, and recommended garden type.
**Quality gate:** Sun exposure is measured or estimated for the actual site. Garden size matches available weekly time. Water access is within 50 feet. Drainage is assessed. At least one site problem is checked.

### Phase 2: SOIL PREP
**Entry criteria:** Site selected and garden type decided.
**Actions:**
1. Test the soil. For in-ground gardens, get a soil test ($15-30 through your county extension office). This tells you pH, nutrient levels (nitrogen, phosphorus, potassium), and organic matter content. For raised beds and containers, you're building soil from scratch, but the test still matters if you're mixing in native soil.
2. Target the right pH. Most vegetables thrive between 6.0 and 7.0. Below 6.0: add garden lime. Above 7.5: add sulfur or peat moss. Don't guess -- pH determines whether plants can actually absorb nutrients. A plant in perfect soil at the wrong pH will starve.
3. Build the soil mix:
   - **In-ground:** Add 2-4 inches of compost on top and work it in 6-8 inches deep. If soil is heavy clay, add compost plus coarse sand or perlite. If soil is pure sand, add compost plus coconut coir or peat moss for water retention.
   - **Raised beds:** The classic mix is 1/3 topsoil, 1/3 compost, 1/3 aeration (perlite, vermiculite, or coarse sand). Don't use pure potting mix for large beds -- it's too expensive and too light.
   - **Containers:** Use quality potting mix (not garden soil -- it's too dense for pots), add perlite for drainage, and mix in slow-release fertilizer.
4. Set up composting if space allows. A simple bin or pile takes kitchen scraps (fruit, vegetables, coffee grounds, eggshells) and yard waste (leaves, grass clippings) and turns them into free fertilizer in 2-6 months. Avoid meat, dairy, and pet waste. Even a small countertop compost collector feeds a garden over time.
5. Plan the fertilizer schedule: compost provides slow, steady nutrition, but heavy feeders (tomatoes, peppers, squash) need supplemental feeding. Use a balanced organic fertilizer (like 5-5-5 or 10-10-10) at planting, then side-dress every 3-4 weeks during growing season. Container plants need fertilizer more frequently because nutrients wash out with watering.
6. Mulch everything. 2-3 inches of straw, shredded leaves, or wood chips on top of the soil retains moisture (30-50% less watering), suppresses weeds (90% reduction), moderates soil temperature, and breaks down into more organic matter. This single step saves more garden-hours than anything else.

**Output:** Soil test interpretation (or raised bed/container recipe), pH adjustment plan, compost setup guide, fertilizer schedule, and mulching plan.
**Quality gate:** Soil pH target is specified. Soil recipe matches garden type. Fertilizer schedule distinguishes between heavy feeders and light feeders. Mulch is included in the plan.

### Phase 3: SEED TIMING
**Entry criteria:** Soil prep plan in place, frost dates known.
**Actions:**
1. Look up your last spring frost date and first fall frost date. This defines your growing season. Everything else counts backward or forward from these two dates. Your county extension office has the most accurate local data, or use the USDA plant hardiness zone map.
2. Divide crops into three planting windows:
   - **Cool season (plant 2-4 weeks before last frost):** Lettuce, spinach, peas, radishes, kale, broccoli, carrots, beets, onions. These tolerate (and prefer) cool weather. They bolt (go to seed and taste bitter) in heat.
   - **Warm season (plant after last frost):** Tomatoes, peppers, cucumbers, squash, beans, corn, basil. These die in frost. Don't rush them -- cold soil stunts growth even if the air is warm.
   - **Succession planting (every 2-3 weeks):** Lettuce, radishes, beans, and spinach can be planted in waves so you harvest continuously instead of getting 40 heads of lettuce in one week and none for the rest of the season.
3. Decide what to start indoors vs. direct sow:
   - **Start indoors 6-8 weeks before transplant date:** Tomatoes, peppers, eggplant, broccoli, cauliflower. These need a head start because they take a long time to mature.
   - **Direct sow (plant seeds straight in the garden):** Beans, peas, carrots, radishes, corn, squash, cucumbers. These don't transplant well or grow so fast that starting indoors isn't worth the effort.
4. For beginners, recommend the easiest high-reward crops: cherry tomatoes (nearly indestructible), zucchini (you'll have more than you can eat), lettuce (ready in 30 days), radishes (ready in 25 days), green beans (set and forget), and basil (thrives in heat, useful in the kitchen).
5. Build the week-by-week planting calendar: count backward from last frost for cool-season crops and indoor starts, then forward from last frost for warm-season crops. Include transplant dates (when indoor starts go outside) and succession planting reminders.
6. Plan for fall: many cool-season crops can be planted again in late summer for a fall harvest. Count backward from your first fall frost date to find the planting window. Fall gardens are often more productive than spring because pest pressure drops and cooler weather prevents bolting.

**Output:** Customized planting calendar with specific dates for indoor starting, direct sowing, transplanting, succession planting, and fall planting. Beginner-friendly crop recommendations.
**Quality gate:** Calendar is based on actual local frost dates. Cool and warm season crops are separated. At least one succession planting crop is included. Indoor start timing accounts for hardening off period (1 week before transplant).

### Phase 4: COMPANION PLANTING
**Entry criteria:** Crop list finalized from Phase 3.
**Actions:**
1. Map the beneficial pairings for the selected crops:
   - **Tomatoes + basil:** Basil repels aphids and whiteflies, may improve tomato flavor (anecdotal but widely reported), and you'll use them together in the kitchen anyway
   - **Carrots + onions:** Each repels the other's primary pest (carrot fly and onion fly)
   - **Corn + beans + squash (Three Sisters):** Corn provides a trellis for beans, beans fix nitrogen for corn, squash leaves shade the ground to suppress weeds
   - **Lettuce under taller plants:** Lettuce benefits from afternoon shade provided by tomatoes or trellised cucumbers
   - **Marigolds everywhere:** French marigolds repel nematodes, whiteflies, and many beetles. Plant them on borders and between rows.
2. Know the bad pairings (and why):
   - **Tomatoes + fennel:** Fennel inhibits growth of most vegetables through allelopathy (chemical warfare between plants). Keep fennel in its own container.
   - **Beans + onions/garlic:** Alliums stunt bean growth
   - **Cucumbers + aromatic herbs (sage, mint):** Can inhibit cucumber growth
   - **Dill + carrots:** Same family, cross-pollinate and attract the same pests
3. Plan for vertical space: trellising cucumbers, beans, and peas saves ground space and improves air circulation (reducing disease). A $10 piece of cattle panel or a simple string trellis can double your effective garden area.
4. Include pollinator attractors: plant a few flowers that attract bees and beneficial insects -- zinnias, sunflowers, lavender, and nasturtiums (which are also edible and trap aphids away from your crops). No pollinators = no fruit on tomatoes, peppers, squash, or cucumbers.
5. Design the layout: place tall plants (corn, trellised beans, tomatoes on stakes) on the north side so they don't shade shorter plants. Put sprawling plants (squash, melons) at the edges where they can spread. Group plants with similar water needs together.

**Output:** Companion planting map showing beneficial and harmful pairings, garden layout diagram with plant placement, vertical growing plan, and pollinator planting suggestions.
**Quality gate:** At least 3 beneficial pairings are used from the selected crop list. At least 2 bad pairings are identified and avoided. Layout accounts for plant height and shade direction. Pollinator attractors are included.

### Phase 5: GROW & HARVEST
**Entry criteria:** Garden planted according to calendar and companion plan.
**Actions:**
1. Set up a watering routine: most vegetables need 1 inch of water per week (including rainfall). Water deeply and less frequently rather than a little every day -- deep watering encourages deep roots. Water in the morning so leaves dry before evening (wet leaves at night = fungal disease). Use the finger test: stick your finger 2 inches into the soil. If it's dry, water. If it's moist, wait.
2. Create a simple weekly maintenance checklist (15-30 minutes, 2-3 times per week):
   - Check for pests (look under leaves -- that's where they hide)
   - Pull weeds while they're small (2 minutes now vs. 20 minutes next week)
   - Check soil moisture and water if needed
   - Look for signs of disease (yellowing leaves, spots, wilting despite wet soil)
   - Harvest anything that's ready (picking encourages more production)
3. Handle the most common problems without panic:
   - **Aphids:** Blast with hose water. If persistent, spray diluted dish soap (1 tsp per quart of water). Ladybugs eat 50 aphids per day.
   - **Tomato hornworms:** Hand-pick (gross but effective). Look for droppings on leaves below to find them.
   - **Powdery mildew:** Improve air circulation, water at soil level, spray diluted milk (1:9 milk to water) as prevention.
   - **Blossom end rot on tomatoes:** Not a disease -- it's calcium deficiency caused by inconsistent watering. Water consistently and mulch well.
4. Know when to harvest (most people wait too long):
   - Zucchini: best at 6-8 inches (the monster ones are full of seeds and have no flavor)
   - Tomatoes: pick when fully colored and slightly soft to the touch (or pick at first blush and ripen indoors if pests are stealing them)
   - Lettuce: harvest outer leaves at any size for continuous production, or cut the whole head when it's full
   - Beans: pick when pencil-thin and snap cleanly. Check every 2 days -- they go from perfect to tough fast.
   - Peppers: can be picked green or left to ripen to full color (sweeter but takes longer)
5. Track everything in a simple garden journal: what was planted where, when it germinated, when it was harvested, how much was harvested, what problems occurred, and what you'd do differently. This journal is your most valuable gardening tool -- next year's garden will be dramatically better because of it.
6. Plan the season end: when frost threatens, harvest everything remaining. Green tomatoes ripen in a paper bag with a banana. Pull spent plants and add to compost. Plant a cover crop (winter rye, crimson clover) or add a thick layer of mulch to protect soil over winter.

**Output:** Watering guide, weekly maintenance checklist, common problem solutions, harvest timing guide for all planted crops, garden journal template, and end-of-season checklist.
**Quality gate:** Watering advice is specific (inches per week, not "keep moist"). At least 4 common problems are addressed with specific solutions. Harvest timing includes visual or physical cues (not just days). Season-end plan includes soil protection.

## Exit Criteria
Done when: (1) garden site is selected with sun mapping and water access, (2) soil is prepared with correct amendments, (3) planting calendar is customized to local frost dates, (4) companion planting layout is designed, (5) maintenance and harvest tracking system is in place.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| SITE SELECTION | Less than 4 hours of direct sun available | Adjust -- focus exclusively on shade-tolerant crops: lettuce, spinach, kale, chard, mint, cilantro, parsley. Skip fruiting vegetables entirely. |
| SITE SELECTION | No ground space available (apartment, rental) | Adjust -- container garden on a sunny balcony or patio. Use 5-gallon buckets, grow bags, or self-watering planters. Many vegetables thrive in containers with the right soil and watering. |
| SOIL PREP | Soil test shows contamination (lead, heavy metals) | Escalate -- do not grow food in contaminated soil. Use raised beds with imported soil mix, or switch to containers. This is non-negotiable for food safety. |
| SEED TIMING | Planting window was missed | Adjust -- check if a later crop is still possible (many crops have 60-80 day varieties designed for short seasons). Consider starting with transplants from a nursery instead of seeds. |
| COMPANION PLANT | Limited space forces incompatible plants close together | Adjust -- use containers to physically separate incompatible plants. A fennel plant in a pot 10 feet from the garden solves the problem. |
| GROW & HARVEST | Everything is dying despite following the plan | Troubleshoot in order: watering (most common cause of failure), pests (second most common), soil pH (third). If a specific crop fails repeatedly, stop growing it -- some crops just don't work in some conditions. |

## State Persistence
- Garden layout with plant locations (for crop rotation next year -- never plant the same family in the same spot two years running)
- Planting and harvest dates (to refine timing for subsequent years)
- Yield records by crop (to know what's worth growing again)
- Soil test results over time (to track soil improvement)
- Problem log (what pests and diseases appeared, what worked to control them)
- Seed inventory (what's on hand, viability by age -- most seeds are good for 2-5 years if stored cool and dry)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
