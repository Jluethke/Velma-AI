# Home Repair Diagnosis Guide

Helps you figure out what's actually wrong with your house, whether you can fix it yourself or need to call someone, and how to not get ripped off by contractors. Covers the most common home problems -- leaks, cracks, electrical weirdness, HVAC issues, appliance failures -- and gives you a framework for diagnosing them before you panic or spend money. Not a substitute for a licensed professional when things are serious. But most homeowners call a pro too late (after the water damage) or too early (for a $3 fix they could handle). This helps you get the timing right.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SYMPTOMS     --> Identify what you're actually seeing, hearing, or smelling
PHASE 2: DIAGNOSIS    --> Narrow down the likely cause using systematic elimination
PHASE 3: TRIAGE       --> Decide: emergency, DIY fix, or call a professional
PHASE 4: DIY PATH     --> Step-by-step repair guidance for fixable issues
PHASE 5: PRO PATH     --> How to find, vet, and negotiate with contractors
```

## Inputs
- problem_description: object -- What's happening: water somewhere it shouldn't be, weird noise, something stopped working, visible damage, smell. Be specific -- where exactly, when it started, what changed recently, does it come and go
- home_details: object -- Home type (house, condo, apartment, rental), approximate age, construction type if known, last major renovation or repair, known existing issues
- urgency_level: string -- Is this an emergency (active leak, no heat in winter, gas smell, electrical sparking), urgent (getting worse, affecting daily life), or monitoring (noticed something, not sure if it matters)
- skill_comfort: object -- Your comfort level with basic tools, plumbing, electrical, and physical repairs. Have you fixed things before? Do you own basic tools?
- location_context: object -- (Optional) Climate zone (affects common issues), rental vs. owned (affects what you're responsible for), HOA restrictions, home warranty status

## Outputs
- diagnosis_report: object -- Most likely cause of the problem, how confident the diagnosis is, and what additional checks would confirm it
- severity_assessment: object -- How serious this is on a scale from cosmetic to structural/safety emergency, and what happens if you wait
- action_recommendation: object -- DIY fix with steps, or professional referral with specialty type and urgency
- diy_repair_guide: object -- (If applicable) Tools, materials, steps, time estimate, and common mistakes
- contractor_guide: object -- (If applicable) What type of pro to call, what to ask, red flags, and how to evaluate quotes

## Execution

### Phase 1: SYMPTOMS
**Entry criteria:** Person has noticed something wrong or different about their home.
**Actions:**
1. Gather the full symptom picture. The first thing someone reports is often a secondary symptom, not the root cause. "The ceiling has a water stain" is a symptom. The problem could be a roof leak, a plumbing leak from upstairs, condensation from an HVAC issue, or an ice dam. Don't jump to solutions yet.
2. Establish the timeline:
   - When did you first notice it?
   - Has it gotten worse?
   - Does it happen all the time or only during specific conditions (rain, when the heat runs, when a specific appliance is used, at certain times of day)?
   - Did anything change before it started (new appliance, recent work, weather event, landscaping)?
3. Map the location precisely. "The bathroom" isn't specific enough. Which wall? Near the floor or ceiling? Near a fixture? Above or below another water source? Location is the single most important diagnostic clue for water, structural, and electrical issues.
4. Engage all senses:
   - **See:** Stains, cracks, discoloration, warping, bubbling, mold
   - **Hear:** Dripping, running water when nothing is on, humming, clicking, banging pipes
   - **Smell:** Musty (mold), rotten eggs (gas leak or sewer), burning (electrical), sweet (coolant leak)
   - **Touch:** Dampness, unusual warmth or cold spots on walls, soft spots in flooring
5. Check for related symptoms in adjacent areas. Water travels -- a leak on the first floor might originate on the second floor or in the attic. An electrical issue in one room might trace back to a shared circuit. Look up, down, and sideways from the obvious symptom.

**Output:** Complete symptom profile with location, timeline, conditions, sensory details, and related observations.
**Quality gate:** Location is specific (not room-level, but wall/fixture/area-level). Timeline is established. At least 3 senses are checked. Adjacent areas are examined.

### Phase 2: DIAGNOSIS
**Entry criteria:** Symptom profile complete.
**Actions:**
1. Use the common-cause matrix to narrow possibilities. For the most frequent home problems:
   - **Water stain on ceiling:** Roof leak (check attic), plumbing leak from above (check fixtures), HVAC condensation (check drain line), ice dam (check in winter after cold snaps)
   - **Crack in wall:** Settling (normal if hairline and not growing), foundation issue (if growing, if doors/windows stick, if floors slope), thermal expansion, or water damage behind the wall
   - **Circuit keeps tripping:** Overloaded circuit (too many devices), short circuit (damaged wire), ground fault (moisture in outlet area), failing breaker
   - **No hot water:** Pilot light out (gas), heating element failure (electric), thermostat issue, sediment buildup, or broken dip tube
   - **HVAC not heating/cooling:** Thermostat setting, dirty filter (check first -- always), refrigerant leak, compressor failure, ductwork issue
2. Apply the "most common cause first" rule. Don't chase rare explanations when common ones haven't been ruled out. A running toilet is almost always a flapper valve ($5 fix), not a cracked tank. A tripping breaker is usually an overloaded circuit, not a wiring fire.
3. Perform safe diagnostic tests:
   - Water issues: place paper towels or dry cardboard to trace where water is coming from. Turn off specific water sources one at a time to isolate
   - Electrical: check if the issue is on one circuit (test other outlets on the same breaker) or whole-house
   - HVAC: check the filter, check the thermostat, check the breaker -- these three solve 40% of HVAC complaints
   - Structural: measure cracks with a pencil mark at each end, photograph them, check again in 2-4 weeks to see if they're growing
4. Rate diagnostic confidence: high (clear cause-effect relationship, common problem, consistent symptoms), medium (likely cause but other possibilities exist), or low (multiple possible causes, need more information or professional assessment).
5. Identify what additional information would increase diagnostic confidence. Sometimes the answer is "open the wall" or "get on the roof" -- and that's fine. Knowing what you don't know is a diagnostic result.

**Output:** Ranked list of likely causes with confidence ratings, diagnostic tests performed, and additional investigation recommendations.
**Quality gate:** Most common causes are checked first. Diagnosis is ranked by likelihood, not scariness. Confidence level is honest. Unsafe diagnostic steps are flagged as "professional only."

### Phase 3: TRIAGE
**Entry criteria:** Diagnosis complete with at least medium confidence.
**Actions:**
1. Categorize the severity:
   - **Emergency (act now):** Active water intrusion, gas smell, electrical sparking or burning smell, no heat when below freezing, sewage backup, structural collapse risk. Stop reading and call the appropriate emergency number.
   - **Urgent (act this week):** Slow leaks, failing water heater, malfunctioning HVAC in extreme weather, recurring electrical trips, growing cracks, active mold
   - **Important (act this month):** Cosmetic water damage, minor fixtures not working, drafty windows, running toilet, minor cracks, aging appliances showing signs
   - **Monitor (track and reassess):** Hairline cracks that aren't growing, minor cosmetic issues, appliances working but nearing end of life, small drafts
2. Assess the "what happens if you wait" trajectory:
   - A slow leak becomes mold in 24-48 hours and structural damage in weeks
   - A running toilet wastes 200+ gallons per day ($$$)
   - A failing appliance might die at the worst moment (water heater on Christmas)
   - A crack that's growing could indicate foundation problems that cost 10x more if ignored
3. Determine DIY feasibility based on the specific repair, not just general comfort level:
   - **Almost always DIY:** Replacing toilet flapper, changing HVAC filter, unclogging drains (if accessible), replacing light switches/outlets (if comfortable with electrical safety), patching small drywall holes, re-caulking
   - **Maybe DIY:** Replacing faucets, fixing running toilets beyond the flapper, installing ceiling fans (if wiring exists), minor drywall repair, replacing garbage disposals
   - **Almost never DIY:** Anything involving the electrical panel, gas lines, main sewer line, roof work above one story, structural modifications, HVAC refrigerant, foundation repair
4. For rental properties: determine what the landlord is responsible for (almost everything structural, plumbing, electrical, and HVAC) vs. what's on you (things you broke, minor maintenance). Document everything with photos and written communication before spending money.
5. Make the explicit recommendation: "This is a DIY fix" (proceed to Phase 4) or "Call a professional" (proceed to Phase 5) or "Monitor this" (set a check-in schedule).

**Output:** Severity rating, "what happens if you wait" timeline, DIY vs. professional recommendation, and for rentals, landlord responsibility assessment.
**Quality gate:** Emergency items are flagged immediately with no hedge language. DIY recommendation accounts for skill level, not just theoretical fixability. "Wait" trajectory has specific time-based consequences.

### Phase 4: DIY PATH
**Entry criteria:** Issue triaged as DIY-appropriate and person is comfortable attempting it.
**Actions:**
1. Write the repair steps in the order you'll actually do them. Start with "turn off the water/power/gas to the affected area" -- every repair starts with making the work area safe.
2. List exact tools and materials needed. Be specific: "adjustable wrench (10-inch)" not "wrench." "Teflon tape (yellow for gas, white for water)" not "Teflon tape." Include things people forget: bucket, rags, flashlight, penetrating oil for stuck bolts.
3. Estimate time honestly. A YouTube video showing a 10-minute faucet replacement takes an experienced person 10 minutes. It takes you 45-60 minutes including the trip under the sink to discover the shut-off valve is stuck, the 20 minutes loosening corroded nuts, and the second trip to the hardware store for the part you didn't know you needed.
4. Flag common mistakes for this specific repair:
   - Overtightening (cracks fittings, strips threads -- hand tight plus a quarter turn is usually enough)
   - Not turning off the water/power (obvious but people still skip it)
   - Using the wrong sealant/adhesive for the application
   - Not having a backup plan if the old part breaks during removal (old shut-off valves, especially)
5. Define the "I made it worse" escape plan. If the repair goes sideways, what do you do? For plumbing: turn off the main water supply. For electrical: flip the breaker. Know how to stop the damage before you start the repair.
6. Specify how to verify the fix worked. Don't just turn the water back on and walk away. Run the fixture for 5 minutes while checking for leaks. Flip the breaker and test multiple outlets. Run the HVAC for a full cycle. Check again 24 hours later.

**Output:** Step-by-step repair guide with tool/material list, realistic time estimate, common mistake warnings, escape plan, and verification steps.
**Quality gate:** Steps are in executable order. Tools list is complete and specific. Time estimate is realistic for the person's experience level. Escape plan exists for the worst-case scenario.

### Phase 5: PRO PATH
**Entry criteria:** Issue triaged as needing professional help, or DIY attempt failed.
**Actions:**
1. Identify the right type of professional. This matters more than people think:
   - Plumber for water supply, drains, water heater, gas lines
   - Electrician for wiring, panel, circuits, grounding
   - HVAC technician for heating, cooling, ductwork, ventilation
   - General contractor for multi-trade work, renovations, structural
   - Roofer for roof leaks (not a general contractor or handyman)
   - Foundation specialist for structural/foundation issues (not a general contractor)
   Using the wrong trade wastes time and often means you pay for a referral visit that accomplishes nothing.
2. Get 3 quotes. Not 1, not 5 -- 3 is the sweet spot. Ask each contractor the same questions:
   - What's the problem and what's your proposed fix?
   - What's included in the price (parts, labor, cleanup, warranty)?
   - How long will it take?
   - What permits are needed and who pulls them (the answer should be: the contractor)?
   - What could go wrong and how would that change the price?
3. Know the red flags:
   - Demands cash only or full payment upfront (normal: deposit of 10-30%, balance on completion)
   - Can't or won't provide a written estimate
   - Pressures you to decide immediately ("I can only hold this price today")
   - No license, no insurance, or won't show proof (ask -- it's not rude)
   - Doesn't pull permits for work that requires them
   - Dramatically lower than other quotes (either cutting corners or planning to upsell)
4. Negotiate intelligently:
   - Ask if they offer discounts for flexible scheduling (letting them fit you in between bigger jobs)
   - Ask what reducing the scope would save (fix just the leak vs. replace all the pipes)
   - Ask about material options (mid-grade vs. premium for things where it doesn't matter)
   - Don't negotiate labor rates -- that's insulting and counterproductive. Negotiate scope and materials
5. Protect yourself:
   - Get the estimate in writing with specific scope, timeline, and payment terms
   - Check their license and insurance (your state licensing board has an online lookup)
   - Read 3-5 recent reviews (ignore the 5-star and 1-star outliers, read the 3-4 star ones for real information)
   - For work over $1,000: written contract before any work begins
   - Take photos of the area before work starts

**Output:** Professional type recommendation, quote-getting checklist, red flag list, negotiation strategies, and self-protection steps.
**Quality gate:** Correct trade specialty is identified. Quote questions are specific to the problem. Red flags are specific and actionable. Protection steps include documentation.

## Exit Criteria
Done when: (1) problem is diagnosed with at least medium confidence, (2) severity is assessed with wait-time consequences, (3) clear DIY or professional recommendation is made, (4) if DIY: complete repair guide with verification steps exists, (5) if professional: type of pro is identified with quote-getting and vetting guidance.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| SYMPTOMS | Person can't pinpoint the problem location | Adjust -- use the elimination method: turn off systems one by one, check rooms systematically, use moisture meters or thermal cameras (rentable at hardware stores) |
| DIAGNOSIS | Multiple possible causes with low confidence | Adjust -- recommend the cheapest diagnostic step first. If it could be a $5 flapper or a $500 fill valve, try the $5 fix first |
| DIAGNOSIS | Symptoms suggest something dangerous (gas, electrical burning, structural) | Escalate -- skip to emergency protocol. Evacuate if gas smell. Kill power at panel if electrical. Don't enter rooms with sagging ceilings or floors |
| TRIAGE | Person wants to DIY something that's clearly professional territory | Adjust -- be direct about the risk. "You can try to fix your own electrical panel, but the consequences of getting it wrong are fire and death, not just a bigger repair bill." Some things aren't worth the savings |
| DIY PATH | Repair attempt reveals a bigger problem | Adjust -- stop the repair, stabilize (shut off water/power), and re-enter the process at Phase 1 with the new information |
| PRO PATH | All quotes are higher than expected or budget allows | Adjust -- ask about phased approaches (fix the urgent issue now, defer cosmetic work), payment plans, or whether a less experienced tradesperson (journeyman vs. master) could handle it at lower rates |
| PRO PATH | Person is a renter and landlord is unresponsive | Adjust -- document everything in writing (email, not phone). Know tenant rights in your state. Most states allow "repair and deduct" for habitability issues after proper notice |

## State Persistence
- Home issue log (every problem diagnosed, when, what was done, outcome)
- Home systems inventory (age and condition of major systems: roof, HVAC, water heater, appliances)
- Contractor contact list (vetted pros with specialty, rating, and past experience)
- Maintenance schedule (what needs checking or replacing on a regular cycle)
- Warranty and insurance documentation (what's covered, claim procedures, expiration dates)
- Repair cost history (what things actually cost for this specific home -- better estimates over time)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
