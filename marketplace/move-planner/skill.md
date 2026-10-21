# Move Planner

Builds an 8-week countdown timeline for moving to a new home, covering every task from giving notice to changing your address to unpacking the last box. Takes your move date, current and new home details, household size, distance, and budget, then generates a week-by-week checklist with deadlines, cost estimates, and the things people always forget (mail forwarding, voter registration, prescription transfers, gym membership, subscriptions with saved addresses). Designed for the person staring at a house full of stuff thinking "where do I even start."

## Execution Pattern: Phase Pipeline

```
PHASE 1: MOVE PROFILE  --> Assess scope: distance, household size, timeline, constraints
PHASE 2: ADMIN TASKS   --> Address changes, utilities, subscriptions, legal
PHASE 3: LOGISTICS     --> Packing plan, moving method, day-of timeline
PHASE 4: COUNTDOWN     --> Assemble 8-week checklist with weekly milestones
PHASE 5: SETTLE IN     --> First-week tasks at new home, unpacking priority
```

## Inputs
- `move_date`: string -- Target move date (or move window if flexible)
- `current_home`: object -- Type (house, apartment, condo), size (bedrooms, sqft estimate), own or rent, lease end date if renting, any move-out requirements (cleaning, repairs, inspection)
- `new_home`: object -- Type, size, location (city/state), own or rent, move-in date, any move-in requirements (insurance proof, key pickup, HOA registration)
- `household`: object -- Number of people, pets, anyone with mobility limitations, children's school transfer needs
- `distance`: object -- Local move (<50 miles), long distance (50-500 miles), cross-country (500+ miles), or international
- `budget`: object -- (Optional) Total moving budget, whether employer covers relocation, storage needed
- `special_items`: array -- (Optional) Piano, hot tub, gun safe, pool table, wine collection, antiques, large artwork, vehicles to transport

## Outputs
- `timeline`: object -- 8-week countdown with weekly task lists, deadlines, and responsible person
- `admin_checklist`: object -- Every address change, account transfer, and notification needed, with contact info and method
- `logistics_plan`: object -- Moving method recommendation (DIY, hybrid, full-service), packing schedule room by room, day-of timeline
- `budget_estimate`: object -- Itemized cost estimate: moving company/truck rental, packing supplies, deposits, utility setup fees, cleaning, tips, storage
- `first_week_plan`: object -- Priority unpacking order, immediate setup tasks, neighborhood orientation

## Execution

### Phase 1: MOVE PROFILE
### Entry Criteria
Move date and basic details provided.
### Actions
1. Determine move type and complexity:
   - **Local move** (<50 miles): Same-day move possible, can make multiple trips, keep same doctors/services. Typical cost: $800-2,500 (2-bedroom, professional movers).
   - **Long distance** (50-500 miles): Single-day or overnight, need to coordinate timing tightly. Typical cost: $2,000-5,000.
   - **Cross-country** (500+ miles): 3-7 day transit, need to plan interim living if dates don't align. Typical cost: $4,000-10,000+.
2. Assess timeline pressure:
   - 8+ weeks: comfortable timeline, can plan properly.
   - 4-7 weeks: tight but manageable if you start admin tasks immediately.
   - Under 4 weeks: crisis mode -- prioritize ruthlessly, hire help where possible.
3. Identify constraints: lease overlap (paying two rents?), closing dates, school year timing, pet transport, job start date at new location, special item logistics.
4. Flag if storage is needed: gap between move-out and move-in, downsizing and not sure what fits, renovation at new home.

### Output
Move profile with type, complexity, timeline assessment, constraints, and storage needs.
### Quality Gate
Timeline is realistic for the move type. Constraints are identified early enough to act on.

### Phase 2: ADMIN TASKS
### Entry Criteria
Move profile complete.
### Actions
1. **Address change master list** (the part everyone underestimates):
   - USPS mail forwarding: submit online or at post office, takes 7-10 business days to activate. Cost: $1.10 for online identity verification. Do this 2 weeks before move.
   - Driver's license: most states require update within 30-60 days of moving. Check new state's DMV requirements.
   - Vehicle registration: if changing states, typically 30-90 day deadline. May need new state inspection and emissions.
   - Voter registration: update within 30 days. Register at new address if changing precincts.
   - IRS: file Form 8822 for address change if moving after filing taxes, or update on next tax return.
   - Bank and credit cards: update mailing address and contact info.
   - Insurance: auto (rate changes by ZIP code), renters/homeowners (new policy if changing providers), health (network changes if changing states).
   - Subscriptions with physical delivery: magazines, meal kits, pet food delivery, Amazon, pharmacy auto-refills.
   - Online accounts with saved addresses: Amazon, online shopping accounts, food delivery apps, ride-share apps.
   - Employer: update address for payroll, tax withholding (state income tax may change), benefits.
   - Schools: transfer records, request transcripts, register at new school.
   - Medical: request medical records transfer, find new doctors (primary care, dentist, specialists, vet), transfer prescriptions to new pharmacy.
   - Professional: update bar registration, medical license, professional memberships, business registration if applicable.
2. **Utility management:**
   - Schedule disconnect at current home: electric, gas, water, sewer, trash. Align with move-out date.
   - Schedule connect at new home: same utilities. Some require deposits ($100-300) or credit checks. Schedule 2 weeks ahead.
   - Internet/cable: schedule disconnect and new install. New installs often have 1-2 week lead time.
   - Security system: if owned, coordinate transfer. If monitored, cancel and set up new.
3. **Lease/property tasks:**
   - Renters: give notice per lease terms (typically 30-60 days). Schedule move-out inspection. Document condition with photos on move-out day.
   - Sellers: coordinate with closing. Ensure all fixtures stay per contract. Final walkthrough accommodations.
   - Buyers: confirm closing date, get copies of all keys/codes/garage remotes, get home warranty info.
4. **Cancel/transfer memberships:** Gym, library card, community pool, CSA share, co-op membership, parking permit.

### Output
Complete admin checklist with deadlines, contact methods, and completion status.
### Quality Gate
Every subscription and account is listed. Deadlines are specific dates based on move date. Nothing requires same-day scrambling.

### Phase 3: LOGISTICS
### Entry Criteria
Admin tasks listed.
### Actions
1. **Choose moving method:**
   - DIY (truck rental): cheapest, most work. Budget 2-3x longer than you think. Good for local moves and people with help available. Truck rental: $30-100/day local, $1,000-3,000 one-way long distance (26-foot truck).
   - Hybrid (rent truck + hire loading/unloading labor): middle ground. $200-400 for 2-3 hours of labor per end.
   - Full-service movers: quote based on weight and distance. Get 3 in-home estimates (not phone estimates). Red flags: no physical inspection, requires large cash deposit, no DOT number (long distance).
   - Portable containers (PODS, etc.): good for flexible timelines. $200-500/month storage, $1,500-5,000 transport.
2. **Packing schedule** (start 4-6 weeks before move):
   - **Week 6-5:** Declutter. Go room by room. Four piles: keep, donate, sell, trash. Moving costs are by weight -- every box you don't move saves money. A 2-bedroom costs roughly $1,000 less to move if you declutter 20% of possessions.
   - **Week 4-3:** Pack non-essentials: books, decor, out-of-season clothes, garage items, guest room.
   - **Week 2:** Pack most of remaining items. Leave out only daily essentials: toiletries, work clothes, kid school supplies, pet essentials, chargers, bedding, cleaning supplies, basic kitchen.
   - **Week 1:** Pack remaining items except move-day essentials bag.
   - **Move-day essentials bag** (don't pack this in the truck): medications, phone chargers, toiletries, change of clothes, important documents, snacks, water, pet supplies, kids' comfort items, first-night bedding, basic tools (screwdriver, utility knife, pliers for reassembly).
3. **Packing supplies estimate:**
   - Studio/1BR: 10-20 small, 5-10 medium, 3-5 large boxes, 1 wardrobe box. Cost: $50-100.
   - 2BR: 20-30 small, 10-15 medium, 5-10 large, 2-3 wardrobe. Cost: $100-150.
   - 3BR+: 30-50 small, 15-25 medium, 10-15 large, 3-5 wardrobe. Cost: $150-250.
   - Plus: packing paper, bubble wrap, tape (way more than you think -- buy 6 rolls minimum), markers.
4. **Special items:** Piano ($200-600 to move professionally, never DIY), hot tub (drain 24h ahead, $300-500 to move), gun safe ($200-500 depending on weight), pool table ($300-450 to disassemble and reassemble).
5. **Day-of timeline:**
   - 7 AM: Final walkthrough of packed home, confirm nothing left in cabinets/closets/attic/garage/shed.
   - 8 AM: Movers arrive (or truck pickup). Direct loading order: large furniture first, boxes by room label, fragile items last on top.
   - Load time: 2-4 hours for 2BR, 4-6 hours for 3BR+.
   - Transit: drive time + buffer for gas, food, traffic.
   - Unload: direct boxes to correct rooms immediately. Unloading is 30-50% faster than loading.
   - Move-out: take photos, return keys, confirm with landlord or lock up.

### Output
Moving method recommendation with cost, packing schedule, supplies list, and day-of timeline.
### Quality Gate
Packing schedule starts early enough. Day-of timeline has buffer time. Special items have specific plans.

### Phase 4: COUNTDOWN
### Entry Criteria
All plans assembled.
### Actions
1. Assemble the complete 8-week countdown:
   - **Week 8:** Declutter begins. Research movers/truck rental, get quotes. Give notice to landlord if renting.
   - **Week 7:** Book movers or reserve truck. Begin packing non-essentials. Start selling/donating decluttered items.
   - **Week 6:** Submit USPS mail forwarding. Start address change list (bank, insurance, employer). Request school records transfer. Schedule utility disconnects.
   - **Week 5:** Continue packing non-essentials. Schedule utility connects at new home. Transfer prescriptions. Find new doctors/dentist/vet.
   - **Week 4:** Pack most rooms except daily-use areas. Confirm mover booking. Schedule new internet install. Cancel/transfer gym and memberships.
   - **Week 3:** Finish packing except essentials. Confirm all utility dates. Update DMV if changing states (research requirements). Arrange pet transport if needed.
   - **Week 2:** Pack remaining items except move-day bag. Deep clean current home (or schedule cleaners, $150-300 for apartment, $200-400 for house). Confirm all bookings. Defrost freezer.
   - **Week 1:** Final packing. Pack essentials bag. Pick up truck if DIY. Final walkthrough. Hand off keys.
   - **Move day:** Execute day-of timeline. Photos for condition documentation. Tip movers ($20-50 per person for half-day, $40-80 for full day).
2. Assign each task a specific date and responsible person if multiple household members.
3. Include reminder triggers: "If you haven't done X by this date, it becomes urgent."

### Output
Week-by-week countdown calendar with every task dated and assigned.
### Quality Gate
No task is scheduled for move week that could have been done earlier. Deadlines respect lead times (USPS needs 10 days, utility connects need 2 weeks, movers book 3-4 weeks out in summer).

### Phase 5: SETTLE IN
### Entry Criteria
Move complete.
### Actions
1. **Day 1 at new home:**
   - Verify all utilities are on. Test every faucet, flush every toilet, run HVAC.
   - Change locks (or rekey -- $10-25/lock for rekey, $50-200/lock for new hardware). You don't know who has keys from previous owners/tenants.
   - Locate main water shutoff, gas shutoff, and electrical panel.
   - Set up beds first (you will be exhausted).
   - Unpack kitchen essentials (coffee maker, basic dishes, soap).
   - Connect internet (if install is scheduled, verify appointment).
2. **First week:**
   - Unpack priority: kitchen (you need to eat), bathrooms (function), bedrooms (sleep), then living areas.
   - Introduce yourself to immediate neighbors. It matters for packages, emergencies, and borrowing a ladder.
   - Register kids at new school, transfer records.
   - Update driver's license and vehicle registration if required.
   - Test smoke and CO detectors. Replace batteries if unknown age.
   - Locate nearest hospital, pharmacy, grocery store, hardware store.
3. **First month:**
   - Complete all address changes from Phase 2 admin list.
   - Register to vote at new address.
   - Find and schedule new primary care doctor, dentist, vet.
   - Set up recurring services: trash collection, lawn care, snow removal.
   - File change of address with IRS if not done via tax return.
   - Unpack remaining boxes. The 80/20 rule: the last 20% of boxes contain things you probably don't need. If a box is still sealed after 6 months, donate its contents.

### Output
First-week priority list, 30-day settlement checklist, neighborhood orientation guide.
### Quality Gate
Safety items are first-day priorities (locks, shutoffs, detectors). Essential rooms are unpacked within 3 days. All admin deadlines are tracked.


---

## Worked Example

Illustrative only.

Given typical inputs for 8-week moving countdown: admin tasks, packing schedule, logistics plan, cost est, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) 8-week countdown calendar is complete with dated tasks, (2) admin checklist covers every address and account, (3) logistics plan includes moving method, packing schedule, and day-of timeline, (4) budget estimate is itemized, (5) first-week plan ensures functional household within 3 days.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| MOVE PROFILE | Less than 4 weeks until move | Compress timeline: do admin and logistics in parallel, declutter aggressively (donate instead of sell), prioritize booking movers immediately (availability is the constraint) |
| ADMIN TASKS | Moving across state lines | Flag state-specific requirements: new driver's license deadline, vehicle inspection, state income tax registration, professional license transfer. Check if health insurance network changes |
| LOGISTICS | Can't afford professional movers | DIY plan with truck rental. Recruit help (offer pizza and beer, or $15-20/hour for friends). Rent furniture dollies ($15/day). Schedule over two days if needed |
| COUNTDOWN | Dates slip (closing delayed, lease extension needed) | Rebuild timeline from new date. Adjust utility dates. If movers are booked, call immediately to reschedule (penalties may apply if <72 hours notice) |
| SETTLE IN | New home has unexpected issues (no hot water, pest problem, appliance missing) | Landlord: document and notify in writing within 24 hours. Owner: prioritize by habitability (water/heat are emergencies, cosmetic can wait). Keep receipts for any emergency repairs |

## State Persistence
- Master task checklist with completion status (percentage moved, what's left)
- Address change tracker (which accounts updated, which still pending)
- Moving expenses log (actual vs budget, receipts for tax deduction if work-related move)
- New home setup log (services connected, accounts opened, registrations completed)

## Reference

### Moving Cost Estimates (2024 US Average)

| Move Type | DIY Cost | Full-Service Cost |
|---|---|---|
| Studio/1BR local | $100-300 (truck) | $400-800 |
| 2BR local | $150-400 | $800-2,500 |
| 3BR local | $200-600 | $1,500-4,000 |
| 2BR long distance (500mi) | $1,000-2,000 | $2,500-5,000 |
| 3BR cross-country | $2,000-4,000 | $4,500-10,000+ |

### Address Change Deadlines

| Account/Registration | Deadline | Method |
|---|---|---|
| USPS mail forwarding | 2 weeks before move | Online or post office |
| Driver's license | 30-60 days (varies by state) | State DMV |
| Vehicle registration | 30-90 days if changing states | State DMV |
| Voter registration | 30 days before next election | Online or county registrar |
| IRS address change | With next filing or Form 8822 | Mail or with tax return |
| Employer | Immediately (payroll/tax impact) | HR department |
| Insurance (auto, home) | Before move date | Agent or online |
| Bank/credit cards | Within 1 week | Online or branch |
| Schools | 2-4 weeks before start | New school registrar |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
