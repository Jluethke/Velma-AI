# Moving Assistant

Generates a personalized moving checklist starting 8 weeks before move day, covering utilities transfer, address changes, packing schedule, day-of timeline, and post-move setup. Adapts to apartment vs. house, renting vs. buying, local vs. long-distance, and family size.

## Execution Pattern: Phase Pipeline

```
PHASE 1: PROFILE   --> Gather move details (dates, distance, household, budget)
PHASE 2: TIMELINE  --> Build week-by-week checklist from 8 weeks out to move day
PHASE 3: LOGISTICS --> Utilities, address changes, insurance, subscriptions, mail forwarding
PHASE 4: PACKING   --> Room-by-room packing plan with supply estimates
PHASE 5: DAY-OF    --> Hour-by-hour move day schedule
PHASE 6: SETTLE    --> Post-move setup checklist (first week in new place)
```

## Inputs
- move_date: string -- Target move date
- origin: object -- Current address, type (apartment/house/condo), renting or owning
- destination: object -- New address, type, renting or owning, distance from current
- household: object -- Number of adults, children, pets. Approximate home size (studio, 1BR, 2BR, 3BR+)
- budget: string -- Moving budget (DIY, mid-range, full-service movers)
- special_items: array -- (Optional) Piano, aquarium, gun safe, antiques, vehicles, plants

## Outputs
- master_checklist: object -- Week-by-week checklist from 8 weeks out through 1 week post-move
- logistics_tracker: object -- Utilities, subscriptions, and address changes with status tracking
- packing_plan: object -- Room-by-room packing order with supply list and box estimates
- day_of_schedule: object -- Hour-by-hour move day timeline
- budget_tracker: object -- Estimated costs by category with running total

## Execution

### Phase 1: PROFILE
**Entry criteria:** Move date and basic origin/destination info provided.
**Actions:**
1. Calculate weeks until move day. If less than 4 weeks, compress timeline and flag urgency.
2. Classify move type: local (<50 mi), long-distance (50-500 mi), cross-country (>500 mi), international.
3. Estimate home contents volume by home size (studio ~1,500 lbs, 1BR ~3,500 lbs, 2BR ~5,000 lbs, 3BR ~7,500 lbs).
4. Identify move method based on budget: DIY (rental truck), hybrid (portable container), full-service movers.
5. Flag special considerations: lease termination notices, closing dates, school enrollment deadlines, pet transport requirements.

**Output:** Move profile with timeline, type classification, volume estimate, method, and special flags.
**Quality gate:** Move date is confirmed. Method matches budget. All lease/closing deadlines identified.

### Phase 2: TIMELINE
**Entry criteria:** Move profile complete.
**Actions:**
1. Build week-by-week master checklist:
   - **8 weeks out:** Research movers/truck rentals, get quotes, declutter room by room, start packing rarely-used items
   - **6 weeks out:** Book movers or reserve truck, begin collecting boxes, notify landlord/start closing process
   - **4 weeks out:** File mail forwarding (USPS), update address with bank/insurance/subscriptions, pack seasonal items
   - **3 weeks out:** Confirm mover booking, arrange utility transfers, pack room by room starting with guest rooms/storage
   - **2 weeks out:** Pack most rooms except kitchen and daily essentials, donate/sell decluttered items, confirm all address changes
   - **1 week out:** Pack kitchen except essentials, clean current home, prepare "open first" boxes, confirm everything with movers
   - **Move week:** Final cleaning, defrost freezer, disassemble furniture, label every box with room and contents
   - **Move day:** See day-of schedule
   - **Post-move week:** See settle checklist

**Output:** Week-by-week checklist with specific action items, deadlines, and responsible person.
**Quality gate:** Every week has actionable items. Critical deadlines (lease notice, utility transfer, mail forwarding) have specific dates.

### Phase 3: LOGISTICS
**Entry criteria:** Timeline built.
**Actions:**
1. Generate utilities transfer list: electric, gas, water/sewer, internet, cable/streaming, trash/recycling, security system.
2. Generate address change list: USPS mail forwarding, DMV/driver's license, voter registration, bank accounts, credit cards, insurance (auto, home/renter's, health, life), employer/payroll, doctors/dentists, pharmacy, subscriptions, Amazon, online shopping accounts.
3. If renting current place: security deposit documentation, move-out inspection scheduling, cleaning requirements.
4. If buying new place: closing coordination, home inspection, insurance binder, key handoff.
5. If pets: vet records transfer, new vet search, pet transport arrangements, updated tags/microchip.
6. If children: school enrollment/withdrawal, records transfer, activity registration.

**Output:** Comprehensive logistics tracker with every item, status (not started / in progress / done), and deadline.
**Quality gate:** All utilities accounted for. Address changes cover financial, medical, government, and subscription categories.

### Phase 4: PACKING
**Entry criteria:** Logistics tracker created.
**Actions:**
1. Estimate supplies needed: boxes (small, medium, large, wardrobe), tape rolls, bubble wrap, packing paper, markers.
2. Create room-by-room packing order (pack least-used rooms first, kitchen and bathroom last).
3. For each room: list what to pack, what to donate/trash, what needs special handling.
4. Design labeling system: room name + content category + priority (1 = open first, 2 = open first week, 3 = open when settled).
5. Create "essentials box" list: toiletries, medications, phone chargers, change of clothes, important documents, snacks, paper plates/cups, basic tools.
6. Flag fragile and high-value items requiring special packing.
7. If special items exist: research specific handling (piano movers, aquarium transport, plant care during move).

**Output:** Room-by-room packing plan with supply list, quantities, labeling instructions, and essentials box contents.
**Quality gate:** Every room has a packing plan. Essentials box is defined. Special items have handling instructions.

### Phase 5: DAY-OF
**Entry criteria:** Packing plan complete.
**Actions:**
1. Build hour-by-hour move day schedule based on move type:
   - Morning: final walkthrough of current home, meet movers/pick up truck, supervise loading
   - Midday: drive to new location (adjust for distance), lunch break
   - Afternoon: unload at new home, direct boxes to correct rooms, reassemble essential furniture
   - Evening: set up beds, bathroom, kitchen essentials, order dinner
2. Assign roles if multiple adults: who supervises loading, who does final cleaning, who meets movers at new place.
3. Prepare contingency notes: what to do if movers are late, if weather is bad, if truck breaks down.
4. List emergency contacts: moving company, real estate agent, landlord, locksmith, local emergency services.

**Output:** Hour-by-hour move day timeline with roles, contingencies, and emergency contacts.
**Quality gate:** Timeline covers morning through evening. Roles assigned. Contingencies documented.

### Phase 6: SETTLE
**Entry criteria:** Move day schedule built.
**Actions:**
1. First 24 hours: set up beds, bathrooms, kitchen basics, test all utilities, locate breaker box and water shutoff.
2. First week: unpack priority 1 and 2 boxes, childproof if needed, set up internet, update GPS/maps apps.
3. First month: unpack everything, hang pictures, meet neighbors, find new grocery store/pharmacy/gas station, register to vote at new address, get new driver's license if required.
4. If renting old place: follow up on security deposit return (typically 30-60 days).
5. If buying: file homestead exemption, set up lawn care/snow removal, learn home systems (HVAC filters, sprinklers, etc.).

**Output:** Post-move checklist organized by first day, first week, first month.
**Quality gate:** Essential setup (beds, bathroom, kitchen, utilities) is in first 24 hours. Address-dependent tasks have deadlines.

## Exit Criteria
Done when: (1) master checklist covers 8 weeks pre-move through 1 month post-move, (2) logistics tracker lists all utilities and address changes, (3) packing plan covers every room with supply estimates, (4) move day has hour-by-hour schedule, (5) budget estimate is provided.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| PROFILE | Move date is less than 2 weeks away | Adjust -- compress to emergency timeline, flag that movers may charge rush fees |
| PROFILE | International move | Adjust -- add customs, visa, shipping container sections. Note: significantly more complex |
| LOGISTICS | Unknown utility providers at new address | Adjust -- provide generic checklist, recommend calling new landlord or checking city website |
| PACKING | Hoarding situation (extreme volume) | Escalate -- recommend professional organizer before packing, adjust timeline |
| DAY-OF | No help available (solo move) | Adjust -- extend timeline to 2 days, prioritize essentials-only for day 1 |
| ACT | User rejects final output | Targeted revision -- ask which section fell short (timeline, logistics tracker, packing plan, day-of schedule) and rerun only that section adjusted to the actual move situation. |

## State Persistence
- Move progress (which checklist items are done vs pending)
- Address change tracker (which accounts have been updated)
- Box inventory (what's in each labeled box -- invaluable for unpacking)
- Vendor contacts (mover info, real estate agent, utility account numbers)
- Budget actuals (what was spent vs estimated per category)

## Reference

### Move Volume Estimates by Home Size

| Home Size | Estimated Weight | Small Truck | Full Truck |
|---|---|---|---|
| Studio / 1BR | 1,500-3,500 lbs | 10-ft truck | May fit |
| 2BR | 4,000-5,500 lbs | 15-ft truck | Comfortable |
| 3BR | 6,000-8,000 lbs | 20-ft truck | Comfortable |
| 4BR+ | 8,000+ lbs | 26-ft truck or 2 trips | |

### Address Change Master List

**Government / Legal:** USPS mail forwarding, driver's license/DMV, voter registration, Social Security Administration, IRS (Form 8822), passport (next renewal)

**Financial:** All bank accounts, credit cards, investment accounts, PayPal/Venmo, HSA/FSA

**Insurance:** Auto, home/renters, health, life, umbrella

**Medical:** All doctors, dentists, specialists, pharmacy, health insurance portal

**Subscriptions:** Amazon, streaming services, gym membership, magazines, news, meal kits, software

**Other:** Employer/payroll, loyalty programs, online shopping accounts, attorney or accountant

### USPS Mail Forwarding Timeline

- File online at usps.com/move at least 1 week before move date
- Forwarding starts within 7-10 business days of start date
- First-class mail forwarded for 12 months; magazines for 60 days
- Update permanent addresses promptly -- forwarding is a bridge, not a solution

### Essentials Box Contents

Items to pack last and access first: toiletries, medications, phone chargers, change of clothes, important documents (IDs, lease, closing docs), snacks, paper plates/cups, a few cooking basics, basic tools (screwdriver, Allen key set), toilet paper, first aid kit

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
