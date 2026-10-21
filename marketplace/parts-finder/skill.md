# Parts Finder

Takes a DTC code, a symptom, or a component name and traces it to the exact part that needs replacing on your vehicle. Provides OEM part numbers (Mopar for Stellantis/FCA vehicles), compatible aftermarket alternatives from major brands, price ranges, where to source (dealer, auto parts store, online), and an installation difficulty rating. Cross-references supersession chains so you get the current number even if the original part was replaced by a newer revision. Designed for the owner who knows what's broken but doesn't know the 10-digit part number.

## Execution Pattern: Phase Pipeline

```
PHASE 1: IDENTIFY   --> Map the DTC or symptom to a specific component
PHASE 2: CATALOG    --> Look up OEM part numbers and supersessions
PHASE 3: CROSS-REF  --> Find aftermarket equivalents and compatibility
PHASE 4: SOURCE     --> Price comparison and availability across channels
PHASE 5: INSTALL    --> Difficulty rating, special tools, and common pitfalls
```

## Inputs
- `vehicle`: object -- Year, make, model, engine, trim level, drive type (4WD/2WD). VIN preferred (encodes exact build options). For target vehicle: model year 2011-2021, engine options include 3.6L Pentastar V6, 5.7L Hemi V8, 3.0L EcoDiesel V6, 6.4L SRT V8.
- `dtc_or_symptom`: string -- Either a DTC code (e.g., "P0420", "C0035", "B1A54") or a plain-language symptom (e.g., "grinding noise when braking", "AC blows warm on passenger side", "left headlight out"). One or the other is required.
- `component`: string -- (Optional) If the user already knows the part name (e.g., "right rear wheel speed sensor", "blend door actuator", "oil filter"), skip the diagnosis and go straight to part lookup.

## Outputs
- `component_id`: object -- Identified component: name, system (braking, engine, electrical, HVAC, body), location on the vehicle (with reference to factory service manual zones), and the evidence that pointed to it (the DTC, the symptom pattern, or direct user input).
- `oem_parts`: array -- OEM part numbers for the identified component. Each entry: Mopar number, description, current supersession (if the number was replaced), MSRP or dealer price range, and whether it's dealer-only or available through regular parts channels.
- `aftermarket_options`: array -- Compatible aftermarket parts. Each entry: brand, part number, price, quality tier (economy, mid-grade, premium/OE-equivalent), warranty length, and any known fitment notes.
- `sourcing_plan`: object -- Where to buy, sorted by total cost (part + shipping): dealer parts counter, AutoZone/O'Reilly/NAPA/Advance, RockAuto, Amazon, Mopar online. Includes estimated delivery time for each.
- `install_notes`: object -- Difficulty rating (1-5), estimated time, special tools required, torque specs if applicable, common mistakes, and whether this is a DIY-friendly job or shop-recommended.

## Execution

### Phase 1: IDENTIFY
### Entry Criteria
At least one of dtc_or_symptom or component provided.
### Actions
1. If a DTC code is provided, decode it to identify the monitored component:
   - **P-codes (powertrain):**
     - P0001-P0099: Fuel and air metering / auxiliary emission.
     - P0100-P0199: Fuel and air metering.
     - P0200-P0299: Fuel and air metering (injectors).
     - P0300-P0399: Ignition / misfire.
     - P0400-P0499: Auxiliary emission (EGR, EVAP, catalyst). P0420 = catalyst efficiency below threshold = catalytic converter or upstream O2 sensor.
     - P0500-P0599: Vehicle speed / idle control.
     - P0600-P0699: ECU internal faults.
     - P0700-P0799: Transmission.
   - **C-codes (chassis):**
     - C0035-C0050: Wheel speed sensors (per wheel). C0035 = left front, C0040 = right front, C0045 = left rear, C0050 = right rear.
     - C1095: ABS pump motor.
     - C2100-C2200: Electric power steering.
   - **B-codes (body):**
     - B1A54: Rain/light sensor. B2204: Driver door module. B1B00-B1BFF: HVAC actuators.
   - **U-codes (network):**
     - U0001: High-speed CAN bus off. U0100: Lost communication with PCM. U0121: Lost communication with ABS. U0141: Lost communication with BCM.
2. If a symptom is provided instead of a DTC, use a symptom-to-component decision tree:
   - "Grinding when braking" → brake pads (if constant grinding, pads worn to backing plate) or brake rotor (if pulsating).
   - "AC warm on one side" → blend door actuator on the affected side.
   - "Headlight out" → bulb first, then socket, then BCM output if both sides fail.
   - "Clunking over bumps" → sway bar end links (most common target vehicle suspension complaint), then control arm bushings, then strut mounts.
3. If the component is provided directly, validate it against the vehicle's parts catalog and proceed to Phase 2.
4. Confirm the component with the user before looking up part numbers. "The DTC C0050 points to the right rear wheel speed sensor. Does that match where you're seeing the issue?"

### Output
Identified component with evidence chain (DTC → component or symptom → component).
### Quality Gate
Component is specific (not "something in the braking system" but "right rear wheel speed sensor"). Evidence is traced back to the input.

### Phase 2: CATALOG
### Entry Criteria
Specific component identified.
### Actions
1. Look up the OEM Mopar part number for the identified component on the target vehicle:
   - Mopar numbers follow the format: 5-digit group + 3-digit sequence + 2-character revision (e.g., 68302899AA).
   - For target vehicle, many parts are shared across Grand Cherokee (target vehicle) and Durango (WD). Note compatibility.
2. Check for supersession: Mopar frequently revises part numbers. The original number may point to a newer replacement.
   - Example: original oil filter 68191349AA was superseded by 68191349AB, then by 68302899AA (current).
   - Always provide the most current number. Note the full supersession chain for reference.
3. Identify if the part has multiple variants:
   - Left vs right side (many sensors, actuators, and trim pieces differ by side).
   - Engine-specific (3.6L vs 5.7L have different intake manifolds, exhaust manifolds, spark plugs, oil filters).
   - Trim-specific (SRT parts differ from Laredo/Limited).
   - 4WD vs 2WD (transfer case, front driveshaft, front differential are 4WD only).
4. Note dealer pricing: Mopar MSRP is the list price, but dealer markup varies. Typical dealer cost is 70-80% of MSRP for parts counter sales. Some dealers offer online pricing that beats counter pricing.
5. Check if the part is dealer-only or available through general parts channels. Common dealer-only items: body control module, instrument cluster, key fobs, certain interior trim pieces. Common general-availability items: filters, brake pads, sensors, bulbs.

### Output
OEM part number(s) with supersession history, variants, and dealer price range.
### Quality Gate
Part number is current (not superseded). Vehicle-specific variant is selected. Price range is realistic.

### Phase 3: CROSS-REF
### Entry Criteria
OEM part number known.
### Actions
1. Cross-reference the OEM number to aftermarket equivalents from major brands:
   - **Brakes:** Akebono (OE-grade ceramic), Wagner (ThermoQuiet line = mid, OEX = premium), Bosch (QuietCast), Raybestos (R-Line = economy, Element3 = premium), StopTech (performance).
   - **Filters:** Wix, Purolator, Fram (economy tier), K&N (reusable, performance), Mann (OE-grade).
   - **Sensors:** Dorman (widest coverage, mid-grade), Standard Motor Products / Four Seasons (OE-quality), Delphi, Denso.
   - **Ignition:** NGK, Denso (OE suppliers for many Stellantis engines), Champion, Autolite.
   - **Suspension:** Moog (premium replacement), TRW, Mevotech (Supreme line), Sensen (economy).
   - **Electrical:** Dorman, Standard Motor Products, ACDelco (cross-platform OE).
2. For each aftermarket option, note:
   - Quality tier: economy (cheapest, 1-year warranty typical), mid-grade (reliable, 2-3 year warranty), premium/OE-equivalent (matches or exceeds OE spec, lifetime warranty common).
   - Fitment confidence: "direct fit confirmed" vs "application listed but fitment reports vary."
   - Warranty: length and what's covered (defects only vs defects + labor reimbursement).
3. Flag any component where aftermarket quality is known to be problematic:
   - Wheel speed sensors: OE or premium aftermarket strongly recommended. Cheap sensors are the #1 reason for repeat ABS faults.
   - Catalytic converters: must meet federal emissions standards. California-legal (CARB) vs federal-only affects registration in CARB states.
   - Oxygen sensors: Denso and NGK are OE suppliers. Generic sensors often have slower response times.
4. If the part is a simple consumable (filter, spark plug, brake pad), aftermarket is fine and often better value. If the part is an electronic module or precision sensor, OE or premium aftermarket is safer.

### Output
Aftermarket options table: brand, part number, price, quality tier, warranty, fitment confidence, notes.
### Quality Gate
At least 2 aftermarket options per quality tier where available. Fitment confirmed for the specific vehicle. Quality warnings included where applicable.

### Phase 4: SOURCE
### Entry Criteria
OEM and aftermarket options cataloged.
### Actions
1. List sourcing channels sorted by total cost (part + tax + shipping):
   - **Dealer parts counter:** Walk in, get OE part. Highest price but immediate availability for most items. Good for: modules, dealer-only items, or when you need it today.
   - **Auto parts stores (AutoZone, O'Reilly, NAPA, Advance):** Mid-range pricing, same-day pickup for stocked items. Store-to-store transfer usually next-day. Good for: brake pads, filters, sensors, bulbs, fluids.
   - **RockAuto:** Lowest online pricing, wide selection across quality tiers, ships from regional warehouses. Typical delivery: 3-7 business days. Good for: planned maintenance, non-urgent repairs, bulk orders.
   - **Amazon:** Competitive pricing, Prime shipping, but counterfeit risk for popular parts. Verify "ships from and sold by" for genuine parts. Good for: tools, fluids, accessories. Risky for: sensors, filters (counterfeits).
   - **Mopar online (parts.mopar.com):** Factory pricing, ships to door or dealer pickup. Genuine OE only. Good for: OE parts when the dealer counter markup is excessive.
2. Estimate total cost for each channel: part price + tax (estimate 7% if local rate unknown) + shipping. Note that dealer and store-counter have zero shipping but may have higher base prices.
3. Check for core charges: some parts (alternator, starter, brake caliper, catalytic converter) have a core deposit ($20-150) refunded when you return the old part.
4. Note warranty redemption ease: dealer warranty goes through the dealer. Store warranty is exchanged on the spot. Online warranty requires shipping the part back. For parts with higher failure rates, local sourcing has a convenience advantage.

### Output
Sourcing comparison table: channel, brand/number, price, tax, shipping, total, delivery time, warranty, core charge if any.
### Quality Gate
At least 3 sourcing options compared. Total cost includes all charges. Delivery time noted.

### Phase 5: INSTALL
### Entry Criteria
Part selected and sourced.
### Actions
1. Rate installation difficulty on a 1-5 scale:
   - **1 (Parking lot):** No tools or basic tools only. Under 15 minutes. Examples: windshield wipers, cabin air filter, headlight bulb (some vehicles), fuses.
   - **2 (Driveway):** Basic hand tools (socket set, screwdrivers). Under 1 hour. Examples: air filter, oil change, battery replacement, brake pads (if experienced).
   - **3 (Garage):** Full tool set, jack and stands required. 1-3 hours. Examples: brake pads and rotors, spark plugs, wheel speed sensor, sway bar end links.
   - **4 (Experienced):** Specialty tools, shop manual reference needed, multiple systems involved. 3-6 hours. Examples: blend door actuator (dashboard partial removal), alternator, starter, catalytic converter.
   - **5 (Shop recommended):** Requires alignment, programming, calibration, or specialized equipment. Examples: control arms (needs alignment after), BCM replacement (needs programming), transmission work, anything involving airbag components.
2. List required tools specific to the job:
   - Torque wrench and specific torque values (e.g., "wheel speed sensor bolt: 12 Nm / 106 in-lb").
   - Special tools if any (e.g., "spark plug socket with rubber insert for Pentastar coil-on-plug, 5/8 inch / 16mm").
   - Penetrating oil recommendation for rust-prone fasteners (wheel speed sensor bolts on target vehicle are notorious for seizing in the knuckle).
3. Common mistakes for this specific job:
   - Wheel speed sensor: over-torquing the bolt snaps the sensor ear. Do not use an impact driver.
   - Brake pads: forgetting to compress the caliper piston before installing new pads. Need a C-clamp or caliper piston tool. On electronic parking brake vehicles, the rear caliper requires a scan tool to retract.
   - Oil filter: the 3.6L Pentastar uses a cartridge filter (housing on top of the engine, 24mm socket or oil filter wrench), not a spin-on. Do not forget to replace the O-ring on the housing cap.
   - Spark plugs: Pentastar plugs are deep-set in the aluminum head. Anti-seize on threads is debated. Torque to 13 ft-lbs, not hand-tight.
4. Estimate time for a first-timer vs experienced:
   - First timer: add 50-100% to the experienced time.
   - YouTube reference: note if a specific video walkthrough exists for this vehicle and job (without linking to it).
5. Safety warnings where applicable:
   - Brake work: use jack stands, never work under a vehicle supported only by a jack.
   - Airbag-related: disconnect battery and wait 2 minutes before working near SRS components.
   - Exhaust: let the vehicle cool completely before working on catalytic converter or exhaust manifold.

### Output
Difficulty rating, tool list with torque specs, common mistakes, time estimate, safety warnings.
### Quality Gate
Difficulty rating justified by the actual steps required. Torque specs are included where applicable. At least one common mistake is listed.


---

## Worked Example

Illustrative only.

Given typical inputs for Translates a DTC code or symptom into the exact component that needs replacement, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) component is identified and traced to the input DTC or symptom, (2) OEM part number is current (checked for supersession), (3) at least 2 aftermarket alternatives are listed per quality tier, (4) sourcing comparison covers 3+ channels with total cost, (5) installation difficulty is rated with specific tools and common mistakes.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| IDENTIFY | DTC code is manufacturer-specific and not in the database | Decode the code structure (P1xxx = manufacturer-specific powertrain), provide the system category (fuel, ignition, transmission), and recommend running the troubleshooter flow for symptom-based diagnosis |
| IDENTIFY | Symptom is vague ("car makes a noise") | Ask qualifying questions: when (speed, braking, turning, idle), where (front, rear, left, right, under hood, under car), what kind (grinding, clicking, humming, rattling), when did it start |
| CATALOG | Part number not found for the specific vehicle | Broaden the search to the vehicle platform (target vehicle parts often cross-reference with WD Durango). Check model year range (some parts span 2011-2021, others changed mid-cycle) |
| CATALOG | Part is discontinued with no supersession | Check aftermarket-only availability. Note that the dealer may still have NOS (new old stock) inventory. Salvage yards are an option for discontinued body/interior parts |
| CROSS-REF | No aftermarket equivalent exists | Note as dealer-only. This is common for electronic modules (BCM, PCM, TCM), key fobs, and specialized trim. Remanufactured units may be available |
| SOURCE | Part is backordered everywhere | Check Mopar backorder status. Suggest used/salvage from a reputable yard (car-part.com). For safety-critical items, do not recommend used |
| INSTALL | Job requires a tool the user is unlikely to own | List the tool, its approximate cost, and whether it can be rented (many auto parts stores loan specialty tools for free with a deposit) |

## State Persistence
- Vehicle parts history (every part looked up or purchased, with date and mileage, for warranty tracking)
- Price history (track costs over time to spot deals or price increases)
- Preferred sourcing channels (if the user consistently buys from one source, prioritize it)
- Supersession chain cache (avoid re-checking numbers that were recently verified)
- DIY vs shop preference (if the user consistently sends difficulty 4+ jobs to a shop, default to "shop recommended" for future similar jobs)

## Reference

### Common target vehicle Consumable Parts (2020 3.6L V6 4WD)

| Component | Mopar Number | Aftermarket Equiv. | Price Range | Interval |
|---|---|---|---|---|
| Oil filter (cartridge) | 68302899AA | Wix 57002, Purolator L16311 | $8-15 | Every oil change |
| Air filter | 5184294AE | Wix 49018, K&N 33-2460 | $15-45 | 15,000-30,000 mi |
| Cabin air filter | 68233626AA | Wix 24013, EPAuto CP132 | $10-25 | 20,000-30,000 mi |
| Spark plugs (x6) | 68157291AA (SPLZFR5C11) | NGK 95605, Champion RE10PMC5 | $8-15 each | 100,000 mi |
| Brake pads front | 5175429AC | Akebono ACT1455, Wagner OEX1455 | $30-80 set | 30,000-60,000 mi |
| Brake pads rear | 5175436AB | Akebono ACT1456, Wagner OEX1456 | $25-65 set | 40,000-70,000 mi |
| Brake rotor front | 5175448AB | Centric 120.58012, StopTech 128.58012 | $40-90 each | 50,000-80,000 mi |
| Sway bar end link (front) | 68246532AA | Moog K750618, Mevotech GS50188 | $15-40 each | As needed |
| Wheel speed sensor | 68088953AB (example RR) | Dorman 970-325, SMP ALS2141 | $20-60 | As needed |

### Installation Difficulty Reference

| Rating | Tools | Time | Typical Jobs |
|---|---|---|---|
| 1 | None or basic | <15 min | Wipers, cabin filter, fuses, bulbs |
| 2 | Basic socket set | <1 hr | Air filter, oil change, battery |
| 3 | Full tool set, jack | 1-3 hr | Brakes, spark plugs, sensors |
| 4 | Specialty tools | 3-6 hr | Blend door, alternator, starter |
| 5 | Shop equipment | 6+ hr or requires calibration | Control arms, modules, transmission |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
