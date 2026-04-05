# Family Emergency Plan

Builds a household emergency preparedness plan covering natural disasters (earthquake, hurricane, tornado, flood, wildfire), power outages, medical emergencies, and evacuation scenarios. Takes your location, household members (including elderly, children, pets, disabled), home type, and local risks, then generates: emergency contact list, go-bag checklist, meeting points, evacuation routes, important document inventory, 72-hour supply list, communication plan (if cell networks are down), and insurance documentation checklist. Designed for families who know they should have a plan but keep putting it off.

## Execution Pattern: Phase Pipeline

```
PHASE 1: RISK PROFILE  --> Assess household, location, and specific threats
PHASE 2: CONTACTS      --> Build emergency contact and communication tree
PHASE 3: SUPPLIES      --> 72-hour kit, go-bag, and home stockpile checklists
PHASE 4: EVACUATION    --> Routes, meeting points, and shelter-in-place procedures
PHASE 5: DOCUMENTS     --> Critical document inventory and secure storage plan
PHASE 6: DRILLS        --> Practice schedule, household training, and plan maintenance
```

## Inputs
- location: object -- City/region, home type (house, apartment, condo, mobile home), proximity to flood zones, fault lines, coastline, wildfire-prone areas, tornado alley
- household: object -- All members: adults (names, medical conditions, medications), children (names, ages, schools), elderly (mobility, cognitive needs), pets (species, count, carrier needs), anyone with disabilities or special medical equipment
- vehicles: object -- (Optional) Number of cars, fuel type, whether everyone can drive, alternative transportation available
- existing_prep: object -- (Optional) What you already have: smoke detectors, fire extinguishers, first aid kit, stored water, generator, weather radio
- concerns: array -- (Optional) Specific fears or past experiences: been through a hurricane, worried about earthquakes, live near a chemical plant, elderly parent lives alone nearby

## Outputs
- risk_assessment: object -- Top threats ranked by likelihood and severity for your specific location, with seasonal timing
- contact_card: object -- Wallet-sized emergency contact list with local and out-of-area contacts, ICE numbers, and communication tree
- supply_checklists: object -- 72-hour go-bag checklist (per person), home supply stockpile, vehicle emergency kit, pet emergency kit
- evacuation_plan: object -- Primary and alternate routes, meeting points (neighborhood and out-of-area), shelter-in-place procedures by disaster type
- document_inventory: object -- Critical documents list, secure storage recommendations, digital backup plan
- maintenance_calendar: object -- Quarterly supply rotation, annual plan review, drill schedule

## Execution

### Phase 1: RISK PROFILE
**Entry criteria:** Location and household composition provided.
**Actions:**
1. Identify location-specific natural disaster risks ranked by likelihood:
   - **Coastal areas:** Hurricane, storm surge, flooding, coastal erosion.
   - **Seismic zones:** Earthquake, tsunami (if coastal), landslide.
   - **Central plains:** Tornado, severe thunderstorm, hail, blizzard.
   - **Western regions:** Wildfire, drought, extreme heat, mudslide.
   - **River/low-lying areas:** Flooding (flash and gradual), dam failure.
   - **All locations:** Power outage, winter storm, extreme heat, house fire, medical emergency.
2. Assess home-specific vulnerabilities: mobile homes are high-risk for tornadoes and high winds. Apartments above the 4th floor complicate evacuation. Older homes may lack earthquake retrofitting. Basements are assets for tornadoes but flood risks.
3. Map household vulnerability factors:
   - Children under 5: can't self-evacuate, need formula/diapers in supply kit, emotional management during crisis.
   - Elderly members: mobility limitations affect evacuation speed, medications must be tracked, may need powered medical equipment.
   - Disabled members: wheelchair accessibility of evacuation routes, service animal needs, communication accommodations (hearing, visual).
   - Pets: cannot go to most public shelters, need carriers, food supply, vaccination records.
   - Medical dependencies: oxygen, dialysis, insulin refrigeration, powered mobility devices -- all fail in power outages.
4. Identify seasonal timing: hurricane season (June-November), tornado season (March-June), wildfire season (varies by region), winter storm season. Your readiness calendar should peak before these windows.
5. Check proximity to industrial hazards: chemical plants, nuclear facilities, rail lines carrying hazmat, major highways (tanker accidents). These require shelter-in-place protocols specific to chemical exposure.

**Output:** Ranked threat list, home vulnerability assessment, household member needs matrix, seasonal risk calendar, and industrial hazard check.
**Quality gate:** Threats are specific to the actual location, not generic. Every household member's special needs are documented. Seasonal timing is noted.

### Phase 2: CONTACTS
**Entry criteria:** Risk profile complete.
**Actions:**
1. Build the primary emergency contact list:
   - **911 and local equivalents** (obvious but must be explicit for kids).
   - **Local police non-emergency line** (for situations that aren't 911 but need police).
   - **Fire department non-emergency line.**
   - **Poison control:** 1-800-222-1222 (US).
   - **Nearest hospital emergency room** with address and directions.
   - **Family doctor and pediatrician** with after-hours numbers.
   - **Pharmacy** (for emergency prescription refills).
   - **Utility companies:** electric, gas, water (to report outages and leaks).
2. Designate an **out-of-area contact**: a friend or family member in a different region who serves as the communication hub. During local disasters, local phone lines jam but long-distance often works. Everyone calls or texts the out-of-area contact with their status.
3. Build the **household communication tree**: if separated during an emergency, who contacts whom, in what order, using what method. Primary: cell phone call. Backup: text message (texts often get through when calls don't). Tertiary: out-of-area contact relay.
4. For each child: ensure school emergency contacts are current, know the school's emergency procedures, know where the reunification point is if school evacuates.
5. If elderly family members live separately: establish a check-in protocol for storms and outages. Who calls them, how often, and what triggers sending someone to physically check.
6. Create a wallet-sized contact card for every household member, including children old enough to carry one. Include: home address (kids may not know it by heart), parent phone numbers, out-of-area contact, medical conditions, allergies, and blood type.

**Output:** Complete contact list, communication tree, school emergency info, elderly check-in protocol, and printable wallet cards.
**Quality gate:** Out-of-area contact is designated and has agreed to the role. Every household member has a wallet card. Communication plan has a backup method for when phones don't work.

### Phase 3: SUPPLIES
**Entry criteria:** Contact plan complete, risk profile identified.
**Actions:**
1. **72-hour go-bag** (one per person, grabs-and-goes in 5 minutes):
   - Water: 1 gallon per person per day (3 gallons per person, minimum).
   - Food: 3 days of non-perishable, no-cook food (granola bars, peanut butter, dried fruit, canned goods with pull-top lids).
   - First aid kit: bandages, antiseptic, pain relievers, personal medications (3-day supply rotated quarterly), prescription copies.
   - Clothing: one change of clothes, sturdy shoes, rain poncho, season-appropriate layers.
   - Documents: copies of IDs, insurance cards, medical records (see Phase 5).
   - Tools: flashlight with extra batteries, multi-tool, whistle, dust mask, work gloves.
   - Hygiene: toothbrush, soap, hand sanitizer, menstrual products, diapers if applicable.
   - Cash: $200 in small bills (ATMs don't work without power).
   - Phone charger: portable battery bank, kept charged.
   - Comfort items for kids: one small toy or stuffed animal, familiar snack.
2. **Home supply stockpile** (shelter-in-place for 7-14 days):
   - Water: 1 gallon per person per day for 14 days, plus water purification tablets.
   - Food: 14 days of shelf-stable food, manual can opener, cooking fuel (camp stove with fuel canisters).
   - Light: flashlights, lanterns, batteries, candles with holders (fire safety!), matches/lighters.
   - Power: battery-powered or hand-crank weather radio (NOAA), battery bank, car charger adapter.
   - Sanitation: garbage bags, zip ties, bucket with lid (emergency toilet if plumbing fails), toilet paper, bleach (water purification and disinfection).
   - Warmth: blankets, sleeping bags, hand warmers (for cold-climate power outages).
3. **Vehicle emergency kit**: jumper cables, tire repair kit, blanket, water, granola bars, flashlight, first aid kit, phone charger, reflective triangle, ice scraper (cold climates).
4. **Pet emergency kit**: 3-day food and water supply, medications, vaccination records (many shelters require proof), leash and carrier, recent photo (in case of separation), litter and bags.
5. **Medical-specific supplies**: extra supply of life-sustaining medications, battery backup for powered medical equipment, manual alternatives (manual wheelchair if power chair fails), medical information card on the person at all times.
6. **Supply rotation calendar**: water every 6 months, food by expiration date, medications quarterly, batteries annually, documents reviewed annually.

**Output:** Go-bag checklist per person, home stockpile list, vehicle kit, pet kit, medical supplies, and rotation calendar.
**Quality gate:** Water calculations match household size. Medications are included with rotation schedule. Every household member (including pets) has supplies allocated.

### Phase 4: EVACUATION
**Entry criteria:** Supply plan complete.
**Actions:**
1. Identify **two meeting points**:
   - **Neighborhood meeting point:** a specific, easily identifiable location near your home (not "the corner" but "the mailbox at 142 Oak Street" or "the big oak tree in the park on Elm"). This is where you meet if you evacuate the house but the neighborhood is safe.
   - **Out-of-neighborhood meeting point:** a specific location outside your immediate area (library, church, relative's house, school). This is where you meet if the neighborhood itself is dangerous.
2. Map **two evacuation routes** from your home:
   - Primary route: the fastest way to leave your area by car, heading toward your out-of-area meeting point or designated shelter.
   - Alternate route: a different direction in case the primary route is blocked (fallen trees, flooding, road closure). Avoid routes that cross bridges, low-lying areas, or narrow roads prone to traffic jams.
3. Create **disaster-specific procedures**:
   - **Fire:** Get out, stay out, call 911. Meet at neighborhood point. Never go back inside.
   - **Earthquake:** Drop, cover, hold. After shaking stops, check for gas leaks, evacuate if structural damage. Be prepared for aftershocks.
   - **Tornado:** Go to interior room on lowest floor (basement ideal, bathroom or closet if no basement). Stay away from windows. Mobile homes: evacuate to sturdy building or designated shelter.
   - **Flood:** Never drive through standing water. 6 inches sweeps a person, 12 inches moves a car. If ordered to evacuate, go immediately. Move to higher ground.
   - **Wildfire:** Close all windows and doors, turn off gas, move flammable items away from house, connect garden hoses. Evacuate when ordered -- don't wait.
   - **Power outage:** Check if it's your house or the neighborhood. Report to utility. Preserve refrigerator cold (keep doors closed, food safe for 4 hours). Use flashlights, not candles.
4. **Shelter-in-place procedures**: seal windows and doors with plastic sheeting and duct tape (chemical spill scenario), turn off HVAC, move to interior room, monitor weather radio.
5. For households with mobility challenges: pre-plan how to evacuate members who can't self-evacuate. Identify neighbors who can help. If in a multi-story building, know whether elevators shut down in emergencies (they do in fires).
6. **Know your shelters**: identify the nearest public emergency shelter (Red Cross, school, community center). Check pet policies. Pack shelter go-bags accordingly.

**Output:** Meeting points with exact locations, two evacuation routes mapped, disaster-specific procedure cards, shelter-in-place instructions, and public shelter locations.
**Quality gate:** Meeting points are specific landmarks, not vague descriptions. Both evacuation routes avoid known hazard zones. Every disaster type relevant to the location has a procedure. Mobility-limited members have evacuation assistance planned.

### Phase 5: DOCUMENTS
**Entry criteria:** Evacuation plan complete.
**Actions:**
1. **Critical document inventory** (these must be protected and portable):
   - Identification: passports, driver's licenses, birth certificates, Social Security cards, green cards/visa documents.
   - Financial: bank account numbers, credit card numbers and company phone numbers, investment account info, property deeds, vehicle titles.
   - Insurance: homeowner's/renter's policy number and agent contact, auto insurance, health insurance cards, life insurance.
   - Medical: medication list with dosages, physician contacts, immunization records, medical device serial numbers, power of attorney for healthcare.
   - Legal: wills, trusts, power of attorney, custody documents, divorce decrees, adoption papers.
   - Property: mortgage documents, lease agreement, home inventory (for insurance claims).
2. **Home inventory for insurance**: photograph or video every room, open every closet and drawer. Store this footage off-site. This is the single most valuable thing you can do for an insurance claim after a disaster. Most people forget until it's too late.
3. **Storage strategy -- three layers**:
   - **Fireproof safe at home**: originals of documents you need physical copies of (passports, birth certificates, deeds).
   - **Digital copies**: scan everything, store in encrypted cloud storage (Google Drive, iCloud, or dedicated service like Dropbox Vault). Share access with your out-of-area contact.
   - **Physical copies in go-bag**: photocopies of IDs, insurance cards, medication lists in a waterproof bag inside the go-bag.
4. **Financial emergency prep**: have one credit card with available credit reserved for emergencies. Know your insurance deductibles. Understand your coverage: does it cover flood? Earthquake? (Usually not -- these require separate policies.)
5. **Digital accounts**: list critical online accounts (banking, insurance portals, medical records) with login information stored in a password manager. Ensure at least one trusted person has access to the password manager's master password.

**Output:** Document inventory checklist, home inventory guide, three-layer storage plan, financial preparedness notes, and digital access plan.
**Quality gate:** Every critical document category is addressed. Three storage layers are established. Home inventory is completed or scheduled. Insurance gaps (flood, earthquake) are flagged.

### Phase 6: DRILLS
**Entry criteria:** Complete plan assembled.
**Actions:**
1. **Family meeting**: sit down with every household member and walk through the plan. This is not optional. A plan nobody knows about is not a plan. Keep it simple for kids: "If there's an earthquake, we do this. If there's a fire, we do this. We meet here."
2. **Practice drills by disaster type**:
   - **Fire drill:** Every household member exits the house and meets at the neighborhood meeting point. Time it. Do it at night at least once (fires don't wait for daytime). Test smoke detectors during the drill.
   - **Earthquake drill:** Practice drop, cover, hold in different rooms of the house.
   - **Evacuation drill:** Everyone grabs their go-bag and gets in the car. Drive the primary evacuation route. Then drive the alternate route. Note landmarks.
   - **Communication drill:** Everyone texts the out-of-area contact with their status. Confirm the system works.
3. **Drill frequency**: fire drill twice per year, full evacuation drill once per year, communication tree test quarterly.
4. **Maintenance schedule**:
   - **Quarterly:** Rotate medications in go-bags, test flashlight batteries, charge battery banks, test smoke and CO detectors.
   - **Biannually:** Rotate stored water, review food expiration dates, update contact cards if numbers changed.
   - **Annually:** Full plan review -- has the household changed (new baby, elderly parent moved in, kid started driving)? Have local risks changed? Update everything.
   - **After any actual emergency:** Debrief. What worked? What didn't? Update the plan based on real experience.
5. **Age-appropriate training**:
   - Kids 3-5: know full name, address, and how to call 911. Practice with a disconnected phone.
   - Kids 6-10: know the plan, can identify meeting points, can pack their own go-bag with guidance.
   - Kids 11+: can execute the plan independently if home alone, know alternate routes, can help younger siblings.
   - Teenagers: can drive evacuation route, know how to shut off gas and water, can administer basic first aid.
6. **Neighbor coordination**: introduce yourself to immediate neighbors if you haven't. In a real emergency, neighbors are your first responders. Share the knowledge that you have a plan -- they might make one too.

**Output:** Family briefing guide, drill schedule by disaster type, quarterly/biannual/annual maintenance calendar, age-appropriate training milestones, and neighbor coordination notes.
**Quality gate:** Every household member has been briefed. At least one fire drill is scheduled. Maintenance calendar has specific dates. Kids have age-appropriate knowledge.

## Exit Criteria
Done when: (1) risk assessment identifies top threats for the specific location, (2) emergency contact card is complete with out-of-area contact and communication tree, (3) supply lists are generated for go-bags, home stockpile, vehicle, and pets, (4) evacuation plan has two routes and two meeting points with disaster-specific procedures, (5) document inventory is complete with a three-layer storage plan, (6) drill and maintenance schedule is established.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| RISK PROFILE | Location is in a multi-hazard zone (coastal + seismic + wildfire) | Adjust -- prioritize by likelihood and warning time. Earthquakes get no warning (prep must be in place). Hurricanes give days of warning (evacuation plan is key). Wildfire depends on proximity and wind |
| CONTACTS | No out-of-area contact available | Adjust -- designate the most geographically distant family member or friend. If truly no one, use a shared cloud document as the status board (Google Doc link memorized by all members) |
| SUPPLIES | Budget constraints prevent full supply stockpile | Adjust -- prioritize in this order: water, medications, flashlight and batteries, first aid kit, food. Build the stockpile over 3-6 months by adding one category per paycheck |
| EVACUATION | Household member cannot self-evacuate (wheelchair, infant, dementia) | Adjust -- assign a specific evacuation buddy for that person, pre-stage equipment (wheelchair ramp, car seat), register with local fire department's special needs registry if available |
| DOCUMENTS | Important documents are missing or lost | Adjust -- provide replacement process for each document type (passport: State Department, birth certificate: vital records office in birth state/county, Social Security card: ssa.gov) |
| DRILLS | Family won't take drills seriously | Adjust -- make it low-pressure and practical. Time the fire drill and challenge the family to beat their time. Reward kids for completing go-bag packing. Frame it as "this is what smart families do" not "here's something scary" |

## State Persistence
- Household roster (members, medical needs, medications, schools -- updated when household changes)
- Supply inventory (what's stocked, expiration dates, what needs rotation or replacement)
- Drill log (when drills were conducted, results, improvements identified)
- Document storage status (which documents are secured, which need updating, renewal dates for passports and IDs)
- Plan version history (when the plan was last reviewed and what changed -- ensures the plan evolves with the household)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.