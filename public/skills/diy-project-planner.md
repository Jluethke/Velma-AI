# DIY Project Planner

Takes your "I could probably build that" idea and turns it into an actual plan before you're halfway through with the wrong materials and no idea what you're doing. Covers scoping the project honestly, figuring out what skills you actually need (vs. what you have), building a real tool and materials checklist, estimating costs that account for mistakes and waste, and keeping you safe while you work. Built for people who are handy-curious to moderately experienced -- not professional contractors. If you've ever abandoned a project at 60% because you didn't plan it, this is for you.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SCOPE       --> Define exactly what you're building, why, and what "done" looks like
PHASE 2: SKILLS      --> Honestly assess what you can do vs. what you need to learn or hire out
PHASE 3: MATERIALS   --> Build the complete tool and materials list with sourcing and alternatives
PHASE 4: BUDGET      --> Estimate real costs including waste, mistakes, and the stuff you'll forget
PHASE 5: SAFETY      --> Identify hazards, required protection, and know-your-limits boundaries
PHASE 6: EXECUTION   --> Create the step-by-step build plan with milestones and checkpoints
```

## Inputs
- project_description: object -- What you want to build or do (deck, shelving, tile a bathroom, build furniture, install a fence, etc.), desired dimensions/scope, and why you're doing it (save money, learn skills, specific need, just want to)
- skill_level: object -- Honest self-assessment: tools you own and can use, projects you've completed before, biggest project attempted (even if it failed), comfort with electrical/plumbing/structural work
- workspace: object -- Where you'll work (garage, yard, apartment, rental vs. owned), available space, access to power, weather considerations if outdoor
- budget_range: object -- (Optional) How much you're willing to spend, whether that includes tool purchases, and any hard budget ceiling
- timeline: object -- (Optional) When you need it done, available hours per week, any hard deadlines (party, season change, inspection)

## Outputs
- project_scope: object -- Detailed specification of the finished project with dimensions, materials, finishes, and "done" criteria
- skills_assessment: object -- Required skills mapped against current abilities, learning resources for gaps, and recommendations for what to hire out
- materials_list: object -- Complete bill of materials with quantities, specifications, sourcing options, and substitute materials
- tool_checklist: object -- Required tools (own, borrow, rent, buy), with rental vs. purchase cost analysis
- budget_estimate: object -- Itemized cost breakdown with waste factor, contingency, and comparison to hiring a professional
- safety_protocol: object -- Hazard identification, required PPE, safe work practices, and "stop and call a pro" triggers
- build_plan: object -- Step-by-step execution plan with phase order, time estimates, and quality checkpoints

## Execution

### Phase 1: SCOPE
**Entry criteria:** Person has a project idea and a space to do it in.
**Actions:**
1. Define the project in specific, measurable terms. "Build a deck" is not a scope. "Build a 12x16 foot ground-level pressure-treated wood deck with stairs and basic railing off the back door" is a scope. Nail down: dimensions, materials, features, and finish level.
2. Identify the "done" criteria. What does finished look like? Not aspirational -- actual completion. Does it need to be painted? Does it need to pass inspection? Does it need to be weather-sealed? Write this down before you start, or "done" will keep moving on you.
3. Check for permits and codes. Many DIY projects require building permits (decks, fences over certain heights, electrical work, plumbing changes, structural modifications). Call your local building department or check their website. Skipping permits is not saving money -- it's creating a future nightmare when you sell the house or file an insurance claim.
4. Assess complexity honestly. Break the project into sub-tasks and rate each one: straightforward (you've done similar), learnable (new but reasonable with research), or specialist (requires licensed professional or significant expertise). If more than 30% of sub-tasks are specialist-level, reconsider the DIY approach.
5. Define the minimum viable version. What's the simplest version of this project that still solves the problem? Start here. You can always add features later. The deck doesn't need built-in lighting and a pergola on day one.

**Output:** Detailed project specification with dimensions, features, done criteria, permit requirements, complexity breakdown, and minimum viable version.
**Quality gate:** Dimensions are specific. Done criteria are written and testable. Permit requirements are checked (not assumed). Minimum viable version is defined as a fallback.

### Phase 2: SKILLS
**Entry criteria:** Project scope defined.
**Actions:**
1. Map every required skill against your current abilities:
   - **Measuring and layout:** Can you measure accurately, mark level lines, establish square corners? This sounds basic but sloppy measurement ruins everything.
   - **Cutting:** What tools can you operate? Circular saw, miter saw, jigsaw, hand saw? Do you know which cut type each project piece needs?
   - **Fastening:** Screws, nails, bolts, adhesives -- do you know which to use when and why? Can you drive screws straight without splitting wood?
   - **Specialty work:** Electrical connections, plumbing joints, concrete mixing, tile setting, drywall finishing -- each of these has a learning curve measured in projects, not hours.
2. For each skill gap, determine: can you learn it from YouTube and practice before starting (most cutting and fastening), does it need hands-on instruction (tile setting, drywall taping), or does it require licensing or certification (electrical panels, gas lines, structural load bearing)?
3. Identify the "YouTube-able" skills and find specific tutorial channels. Not all YouTube tutorials are equal. Look for channels where the person explains WHY, not just HOW. Someone who says "use a #8 screw here because it needs to support lateral force" teaches better than someone who says "put a screw here."
4. Flag the hire-out items. It's not failure to hire a licensed electrician for the wiring on your deck and do everything else yourself. The smartest DIYers know where their limits are. Get quotes for these items specifically.
5. Build a "practice before you start" plan: if you've never used a circular saw, buy some scrap wood and make practice cuts first. If you've never mixed concrete, do a small test batch. An hour of practice saves a day of fixing mistakes.

**Output:** Skills matrix (have vs. need), learning resources for each gap, hire-out recommendations with scope, and practice plan.
**Quality gate:** Every required skill is mapped. Specialist work is flagged for hiring. Learning resources are specific (actual channels/videos, not "search YouTube"). Practice plan has specific exercises.

### Phase 3: MATERIALS
**Entry criteria:** Skills assessment complete, project scope finalized.
**Actions:**
1. Build the complete bill of materials (BOM). Every single item -- lumber, fasteners, hardware, adhesives, finishes, connectors, flashing, shims, everything. Organize by project phase so you're not buying everything at once if the project spans weeks.
2. Specify materials precisely. Not "2x4 lumber" but "2x4x8 pressure-treated #2 Southern Yellow Pine, ground contact rated." Material specs matter -- the wrong grade of lumber or the wrong type of concrete will fail.
3. Calculate quantities with waste factor:
   - Lumber: add 10-15% for cuts, defects, and mistakes
   - Fasteners: add 20% (you'll drop them, strip them, and lose them)
   - Concrete/mortar: add 10%
   - Paint/stain: calculate coverage per gallon, then add one extra quart
   - Tile: add 15% for cuts and breakage
   First-time DIYers should use the higher end of these ranges.
4. Source materials and compare prices. Big box stores (Home Depot, Lowe's) vs. lumber yards vs. specialty suppliers. Lumber yards often have better quality for the same price. Hardware stores are cheaper for small quantities of fasteners than buying big-box packs.
5. Identify material substitutes for budget or availability constraints. Composite decking vs. wood, LVP vs. tile, pocket screws vs. mortise-and-tenon. Know what you're trading off: cost, difficulty, durability, appearance.
6. Build the tool list: tools required for each phase, what you own, what you can borrow, what you should rent (anything you'll use for less than a day), and what's worth buying (anything you'll use again). Rental costs for expensive tools (miter saw, plate compactor, nail gun) vs. purchase cost -- often 2-3 rentals equals a purchase.

**Output:** Complete bill of materials with specifications and quantities, sourcing comparison, substitute options, and tool checklist with own/borrow/rent/buy recommendations.
**Quality gate:** BOM includes waste factor. Material specs are precise enough to hand to a store employee. Tool list distinguishes rent from buy. At least one substitute is identified for expensive materials.

### Phase 4: BUDGET
**Entry criteria:** Materials and tool lists complete.
**Actions:**
1. Price every item on the BOM at current retail prices. Check prices at 2-3 sources. Materials prices fluctuate -- lumber especially can swing 30% between seasons. Use today's prices, not what you saw last year.
2. Add the tool costs: purchased tools at full price, rentals at daily/weekly rates (factor in how many days you'll actually need them), and any delivery fees for large material orders.
3. Calculate the "oops" contingency:
   - First-time DIYer: add 20-25% contingency
   - Experienced DIYer: add 10-15% contingency
   - This covers: buying the wrong thing and returning it (restocking fees), breaking something, discovering a hidden problem (rotten subfloor under the tile, fence post hits a root), and the inevitable extra trip to the hardware store
4. Compare to professional cost. Get 1-2 quotes for the same work done by a pro. If the DIY cost is more than 60% of the professional cost and you've never done this type of work before, seriously consider hiring out. The math includes your time -- if the project takes 40 hours of your weekends and a pro does it in 2 days, factor in what your time is worth.
5. Build a spending timeline: what gets purchased when, so you're not spending the entire budget upfront. Phase-based purchasing also lets you adjust if Phase 1 reveals surprises that change the plan.

**Output:** Itemized budget with material costs, tool costs, contingency buffer, professional comparison, and phased spending timeline.
**Quality gate:** Every BOM item has a current price. Contingency is included (not optional). Professional comparison uses real quotes or credible estimates. Total budget is compared against initial budget range.

### Phase 5: SAFETY
**Entry criteria:** Project scope and tool list finalized.
**Actions:**
1. Identify all hazards for this specific project:
   - **Power tools:** Kickback, blade contact, flying debris, cord hazards
   - **Heights:** Anything above 6 feet requires fall protection planning
   - **Electrical:** Even disconnected circuits can be hot. Assume live until confirmed dead with a tester
   - **Chemical:** Pressure-treated wood dust, adhesive fumes, paint/stain VOCs, concrete caustic burns
   - **Structural:** Load-bearing walls, overhead utilities, underground lines (call 811 before you dig -- always)
   - **Environmental:** Heat exhaustion, cold exposure, wet surfaces, poor lighting
2. Define required PPE for each project phase. Minimum for almost any project: safety glasses (not sunglasses), hearing protection for power tools, work gloves for material handling (never for operating rotating tools -- gloves catch and pull your hand in), dust mask for any cutting.
3. Establish the "stop rules" -- specific scenarios where you stop working immediately:
   - You discover wiring, plumbing, or structural elements you didn't expect
   - Something doesn't look right and you're not sure why
   - You're tired, frustrated, or rushing (most injuries happen in the last hour of a long day)
   - A tool is behaving differently than expected
   - The project has deviated significantly from the plan
4. Create the emergency plan: where's the nearest ER, where's the first aid kit, does someone know you're using power tools today (never use dangerous tools completely alone), and where's the circuit breaker/water shutoff if something goes wrong.
5. Review tool safety for each unfamiliar tool. Every power tool has specific safety rules. Read the manual -- genuinely. Know where the safety features are. Know what the tool CAN'T do (using a circular saw for plunge cuts without a guide, for example, is asking for kickback).

**Output:** Hazard list by project phase, PPE requirements, stop rules, emergency plan, and tool-specific safety notes.
**Quality gate:** Every hazard is specific to this project (not generic safety platitudes). PPE list is purchasable. Stop rules are clear triggers, not judgment calls. Emergency contacts and locations are documented.

### Phase 6: EXECUTION
**Entry criteria:** All previous phases complete -- scope, skills, materials, budget, and safety plan ready.
**Actions:**
1. Break the project into daily or weekend work sessions. Each session has a clear start goal, end goal, and estimated time. Overestimate time by 50% for the first session (setup always takes longer than you think).
2. Order the phases logically:
   - Site prep and layout first (always)
   - Structural/framing second
   - Systems (electrical, plumbing) third
   - Surface work (finishing, painting, tiling) last
   - Never do finish work before rough work. Never install before measuring. Never paint before sanding.
3. Build in quality checkpoints between major phases:
   - After layout: is everything level, square, and at the right dimensions? Check now, not after you've built on top of it
   - After framing: is the structure solid? Shake it. Push on it. If it moves, fix it before adding weight
   - After surface prep: is it clean, smooth, and ready for finish? Any flaw here shows through the final product
4. Create a "before you start each session" checklist: review the plan for today, gather all tools and materials, check weather (if outdoor), put on PPE, tell someone what you're doing and when you expect to finish.
5. Plan the cleanup. Seriously. Allocate 30-60 minutes at the end of each work session for cleanup, tool storage, and material protection (cover lumber from rain, seal paint cans, sweep up debris). A clean site is a safe site, and materials left exposed get ruined.

**Output:** Phased build plan with session breakdowns, time estimates, quality checkpoints, pre-session checklists, and cleanup protocols.
**Quality gate:** Each session has a specific deliverable. Quality checkpoints happen between phases, not after. Time estimates include setup and cleanup. No phase depends on a skill the builder hasn't learned or hired out.

## Exit Criteria
Done when: (1) project scope is specific and measurable with defined "done" criteria, (2) skills are assessed with gaps addressed through learning or hiring, (3) complete materials and tool lists exist with quantities and sourcing, (4) budget is itemized with contingency and professional comparison, (5) safety plan covers all identified hazards with PPE and stop rules, (6) step-by-step build plan has sessions, checkpoints, and time estimates.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| SCOPE | Project is too ambitious for skill level or budget | Adjust -- propose the minimum viable version. Build the basic deck now, add the pergola next year |
| SCOPE | Permits required but timeline is too tight for approval | Adjust -- check permit processing times. Some jurisdictions have same-day permits for simple projects. If not, start the permit process and do prep work while waiting |
| SKILLS | Multiple specialist skills required (electrical + plumbing + structural) | Adjust -- at this point, you're project managing, not DIYing. Consider hiring a general contractor and doing specific phases yourself to save money |
| MATERIALS | Key materials are out of stock or back-ordered | Adjust -- switch to documented substitutes. If no substitute exists, adjust timeline. Don't substitute structural materials without understanding the engineering implications |
| BUDGET | Costs exceed budget even at minimum viable scope | Adjust -- phase the project: do the foundation work now, finish later. Or look for salvage materials, Habitat ReStore, Facebook Marketplace for tools and materials |
| SAFETY | Project involves something genuinely dangerous (gas lines, structural load bearing, asbestos) | Escalate -- full stop. These are not DIY tasks. No amount of YouTube compensates for training and licensing in life-safety work |
| EXECUTION | Project goes sideways mid-build (discovered rot, wrong measurements, structural surprise) | Adjust -- stop. Assess the new situation. Re-scope if needed. It's cheaper to pause and replant than to build on a flawed foundation |

## State Persistence
- Project scope document and "done" criteria
- Skills inventory and learning progress
- Bill of materials with pricing and purchase tracking
- Budget vs. actual spending (updated as purchases are made)
- Build plan with session completion tracking
- Issues encountered and how they were resolved
- Photos of each phase (for reference, future projects, and proof of work for permits/insurance)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
