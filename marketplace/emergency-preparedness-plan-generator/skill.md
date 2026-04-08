# Emergency Preparedness Plan Generator

**One-line description:** Transform a home description into a comprehensive emergency preparedness plan with supply lists, evacuation routes, communication protocols, and insurance review checklist.

**Execution Pattern:** Phase Pipeline (6 sequential phases)

---

## Inputs

- `home_description` (string, required): Plain-text description of the home including location, size, number of occupants, pets, medical needs, mobility constraints, and any special considerations.
- `local_hazards` (string[], optional): List of relevant local hazards (e.g., "flooding", "wildfires", "hurricanes", "earthquakes"). Defaults to common hazards for region if not provided.
- `existing_insurance_info` (object, optional): Current insurance policy details including coverage type, limits, and gaps. If not provided, checklist will recommend review of all policies.
- `include_pet_supplies` (boolean, optional): Whether to include pet-specific emergency supplies. Defaults to true if pets mentioned in home_description.

---

## Outputs

- `home_profile` (object): Validated and structured home information with fields: location, occupant_count, occupant_types (adults/children/elderly), pets, medical_needs, mobility_constraints, home_type, square_footage, clarification_needed (array of missing fields).
- `supply_list` (object): Categorized emergency supplies with quantities. Categories: water_food, first_aid_medications, documents_valuables, tools_equipment, pet_supplies, special_needs, accessibility_aids. Each item includes: name, quantity, unit, notes, expiration_date_if_applicable.
- `evacuation_plan` (object): Routes and procedures with fields: primary_route (text directions with landmarks), secondary_route (text directions with landmarks), meeting_points (array of locations with addresses and GPS coordinates if available), shelter_locations (array with distance/drive time/accessibility notes), accessibility_notes (specific accommodations for mobility/sensory/cognitive constraints), transportation_needs (array of required assistance), pet_evacuation_plan (shelter locations, veterinary contacts, carrier requirements).
- `communication_protocol` (object): Contact procedures with fields: household_contact_list (array of name/phone/role/accessibility_needs), out_of_area_contact (name/phone/relationship), check_in_method (text with specific procedures), communication_tools (array: phone/text/email/radio with reliability notes), special_communication_needs (text with specific accommodations for children/elderly/non-English speakers/hearing-impaired), wallet_card_data (simplified contact info for printing).
- `insurance_checklist` (object): Review items with fields: coverage_gaps (array with specific policy type and gap description), documentation_needed (array with item and deadline), policy_review_items (array with action and responsible party), high_risk_recommendations (array if applicable), financial_preparedness_items (emergency cash, account numbers, claim procedures), next_steps (array with priority and due date).
- `final_plan_document` (string): Formatted, printable emergency preparedness plan combining all sections above with introduction, instructions, action items, appendices (contact cards, pet ID forms, medical info sheets, supply inventory tracker, drill checklist).

---

## Execution Phases

### Phase 1: Collect and Validate Home Description

**Entry Criteria:**
- home_description input is provided and non-empty
- Skill execution has been triggered

**Actions:**
1. Parse home_description text to extract: location (address/region), home type (house/apartment/mobile home), size (rooms/square footage if mentioned), occupant count and types (adults/children/elderly/infants).
2. Identify pets mentioned and their types/sizes.
3. Extract medical needs, mobility constraints, or special considerations (pregnancy, chronic conditions, disabilities, sensory impairments, cognitive conditions).
4. Validate that minimum required information is present: location and occupant count. If location is missing, add to clarification_needed array and note "Cannot map evacuation routes without specific address". If occupant count is missing, use conservative estimate of 4 and note assumption.
5. For any vague medical information (e.g., "health issues" without specifics), add to clarification_needed array with request for: medication names, dosages, equipment needed, storage requirements.
6. Structure extracted data into home_profile object with all fields populated or marked "not specified". Include clarification_needed array listing any missing critical information.

**Output:**
- home_profile (object with all fields populated or marked "not specified"; clarification_needed array)

**Quality Gate:**
- home_profile contains at least: location (or "not specified" with clarification flag), occupant_count (or conservative estimate with assumption noted), occupant_types (or "not specified"), home_type (or "not specified")
- All extracted information matches the source text exactly (verify by re-reading description)
- clarification_needed array is complete and specific (e.g., "Occupant count unclear: description says 'a few people'; using estimate of 4" rather than "missing info")

---

### Phase 2: Generate Emergency Supply List

**Entry Criteria:**
- home_profile is complete and validated
- local_hazards are known (provided or inferred)
- occupant_count is known or estimated

**Actions:**
1. Determine baseline water supplies: calculate 1 gallon per person per day × occupant_count × 14 days. Document calculation (e.g., "4 occupants × 1 gallon/day × 14 days = 56 gallons").
2. Calculate food supplies: 2,000 calories per person per day × occupant_count × 14 days. Select specific non-perishable, no-cook items (canned beans, peanut butter, granola bars, crackers, dried fruit, nuts). Include manual can opener. Document total calorie count.
3. Add first aid and medication supplies: standard first aid kit (list specific items: tweezers, pain reliever, antihistamine, antacid, anti-diarrhea, antibiotic ointment, hydrocortisone cream, elastic bandages, triangular bandages, non-adherent pads, medical tape, gloves, hand sanitizer) plus 30-day supply of all prescription medications in original bottles with labels.
4. For each medical need identified in home_profile, add specialized supplies: if diabetes mentioned, add glucose monitor + test strips + lancets + glucose tablets; if asthma mentioned, add rescue inhalers + spacers; if mobility constraint mentioned, add mobility aids (crutches, cane, walker, wheelchair batteries); if hearing impairment mentioned, add hearing aid batteries + backup communication device; if cognitive condition mentioned, add comfort items and ID bracelet.
5. Add critical documents list: insurance policies, ID, birth certificates, medical records, financial account info, property deeds, photos of home/contents, vehicle registration, pet medical records, vaccination records.
6. Add tools and equipment: flashlight (with extra batteries), battery-powered radio (NOAA weather radio preferred), phone chargers (car and wall), fire extinguisher, manual can opener, duct tape, plastic sheeting, N95 masks, work gloves, rope, first aid kit (if not already listed).
7. If pets present: add pet food (30-day supply in airtight containers), water (1 gallon per pet per day × 14 days), carriers/crates (one per pet, labeled with pet name and owner contact), leashes, collar with ID tag, microchip information, pet medical records, recent photos of each pet for identification, litter box + litter (if applicable), medications (30-day supply).
8. If medical needs identified: verify all specialized supplies are listed with quantities and expiration dates. If storage space is limited, add to clarification_needed: "Medical supplies require X cubic feet of storage; verify available space."
9. If local_hazards include wildfires: add N95 masks (minimum 10 per occupant), plywood sheets (if home has large windows), sandbags (if flood risk also present), fire-resistant clothing.
10. If local_hazards include hurricanes: add plywood sheets, sandbags, battery-powered radio, extra water (increase to 1.5 gallons per person per day for 2 weeks).
11. If local_hazards include earthquakes: add earthquake straps for furniture, gas shut-off wrench, water shut-off tool, sturdy shoes, goggles.
12. Organize all items into categories with quantities, units, and notes. For each item, include: name, quantity, unit (gallons/cans/boxes/etc.), notes (expiration date, storage location, rotation schedule).

**Output:**
- supply_list (object with categories and itemized lists; includes calculation documentation and storage space estimate)

**Quality Gate:**
- Supply list accounts for all occupants and pets (verify occupant_count and pet count match home_profile)
- Quantities are documented with calculations (e.g., "4 occupants × 1 gallon/day × 14 days = 56 gallons water")
- Special medical and dietary needs are reflected with specific items (not generic "medical supplies")
- Hazard-specific items are included based on local_hazards array
- List is organized by category and actionable (can be used as shopping checklist)
- Total storage space estimate is provided (e.g., "Estimated 45 cubic feet for all supplies")

---

### Phase 3: Map Evacuation Routes and Safe Zones

**Entry Criteria:**
- home_profile is validated
- Location information is specific enough to map (address or neighborhood, not just "California")
- local_hazards are known
- mobility_constraints and accessibility_needs from home_profile are documented

**Actions:**
1. Identify primary evacuation route from home: determine safest direction away from likely hazards based on local_hazards array. For each hazard type, specify direction: floods (away from water bodies, toward higher ground), wildfires (away from fire-prone areas, toward open areas), hurricanes (inland and away from coast), earthquakes (away from structures that may collapse). Document reasoning (e.g., "Primary route heads north away from flood zone mapped in FEMA flood maps").
2. Identify secondary evacuation route: alternative path in case primary is blocked. Verify secondary route avoids same hazards as primary. Document both routes with street names, landmarks, and estimated travel times (e.g., "Primary: Oak Street north to Highway 101, 15 minutes by car. Secondary: Maple Street east to Highway 280, 20 minutes by car").
3. Identify meeting points: specify 2-3 locations where household members can reunite. Include: one nearby location (within walking distance, e.g., "Park at corner of Main and 5th Street"), one out-of-area location (outside disaster zone, e.g., "Aunt Mary's house at 456 Oak Lane, Springfield, 30 miles away"), one public location (e.g., "Red Cross shelter at Lincoln High School, 123 School Road"). For each meeting point, provide: full address, GPS coordinates if available, landmarks, distance from home, estimated travel time.
4. Identify shelter locations: research nearest emergency shelters, Red Cross facilities, or safe public buildings. For each shelter, document: name, address, GPS coordinates, distance from home, drive time, phone number, whether it accepts pets, accessibility features (wheelchair accessible, accessible parking, accessible restrooms), capacity, and whether it requires pre-registration.
5. Assess accessibility for all occupants with mobility constraints: for each constraint identified in home_profile (wheelchair user, walker, crutches, limited mobility, etc.), verify primary and secondary routes are passable. If routes include stairs, narrow passages, or other barriers, identify accessible alternatives. Document specific accommodations needed (e.g., "Primary route has 2 steps at Oak Street intersection; accessible alternative is to use Maple Street which has ramp").
6. Assess accessibility for occupants with sensory impairments: if hearing-impaired occupants present, identify visual alert systems or text-based communication for evacuation warnings. If vision-impaired occupants present, identify tactile landmarks and audio cues along routes. Document specific accommodations (e.g., "Hearing-impaired occupant will receive text alert; visual alert system installed at home").
7. Identify transportation needs: determine if any occupants require assistance evacuating (young children, elderly, mobility-impaired). For each person needing assistance, specify: who will provide assistance, what transportation is needed (personal vehicle, public transit, accessible van, wheelchair accessible vehicle), backup plan if primary transportation unavailable. Document (e.g., "Child age 5 will be transported by Parent A in personal vehicle; backup is to call neighbor for ride").
8. Identify pet evacuation logistics: research pet-friendly shelters, veterinary emergency clinics, and boarding facilities that accept emergency evacuees. For each pet, document: pet name, type, size, special needs (medications, dietary restrictions, behavioral issues), carrier/crate requirements, microchip number, recent photo, veterinary clinic contact, pet-friendly shelter locations with addresses and phone numbers. Include note: "Many households abandon pets because they don't know where to take them; identify pet-friendly options in advance."
9. Document all routes with street names, landmarks, and estimated travel times. Create simple text directions (not requiring maps) that can be followed by someone unfamiliar with the area (e.g., "From home at 123 Main Street: head north on Main Street for 0.5 miles, turn right on Oak Street, continue for 1 mile, turn left on Highway 101 heading north").

**Output:**
- evacuation_plan (object with primary/secondary routes, meeting points, shelter locations, accessibility notes, transportation needs, pet evacuation plan)

**Quality Gate:**
- Primary and secondary routes are distinct and realistic (verified by checking that they use different streets and avoid same hazard zones)
- Meeting points are specific locations with full addresses and GPS coordinates (not vague like "somewhere safe")
- Shelter locations are verified to exist, accept emergency evacuees, and have documented accessibility features
- Accessibility constraints are addressed for each occupant with mobility/sensory/cognitive needs (not generic "accessible routes")
- All routes avoid known hazard zones based on local_hazards array (e.g., if flooding is hazard, routes do not cross flood-prone areas)
- Pet evacuation plan includes at least 2 pet-friendly shelter options with contact info
- Transportation needs are documented for each occupant requiring assistance (not generic "transportation available")

---

### Phase 4: Define Communication Protocol

**Entry Criteria:**
- home_profile is validated (occupant list is complete with names, ages, roles)
- local_hazards are known (may affect communication infrastructure)

**Actions:**
1. Create household contact list: for each occupant in home_profile, document: full name, age, phone number (personal cell if available), role (parent/child/caregiver/elderly), accessibility needs (hearing-impaired, non-English speaker, cognitive condition). Include note: "Update this list whenever phone numbers change or household composition changes."
2. Identify out-of-area contact: specify a trusted person outside the disaster zone who can serve as message relay point. Document: full name, phone number, relationship to household, address (outside disaster zone), email. Verify this person has agreed to the role and understands their responsibility. Include note: "Out-of-area contact should be someone outside the likely disaster zone; if household is in California, choose contact in different state."
3. Determine primary communication method: based on local_hazards, select most reliable method. Document reasoning: if cell networks likely to be overloaded (major disaster), recommend text (more reliable than voice calls) or out-of-area contact relay. If power outages likely, recommend battery-powered radio for receiving emergency broadcasts. If internet unreliable, avoid email as primary method. Specify: method name, how to use it, when to use it, expected reliability.
4. Identify backup communication methods: specify at least 2 additional methods in case primary fails. For each method, document: name, how to use it, when to use it, expected reliability. Example: "Primary: text message to out-of-area contact. Backup 1: call out-of-area contact if text fails. Backup 2: listen to NOAA weather radio for emergency broadcasts and instructions."
5. If children present (under age 13): ensure they know out-of-area contact phone number. Recommend: teach phone number through repetition, create laminated contact card for child to carry, identify adult who will help child communicate (e.g., teacher, neighbor). Document: "Child age 7 knows to call Aunt Mary at 555-1234 if separated from parents."
6. If children present (age 13+): ensure they have contact list on phone and understand check-in procedures. Document: "Teenager has contact list saved in phone and knows to text out-of-area contact within 1 hour of evacuation."
7. If non-English speakers present: identify translation resources or multilingual contacts. Document: "Spanish-speaking occupant will receive instructions in Spanish; neighbor Maria (555-5678) speaks Spanish and can help translate emergency broadcasts."
8. If hearing-impaired occupants present: identify TTY (text telephone), video relay service, or text-based communication options. Document: "Hearing-impaired occupant has TTY device; emergency services can be contacted via TTY at 711. Household will use text messages for internal communication."
9. If speech-impaired occupants present: identify alternative communication methods (writing, communication board, speech-to-text app). Document: "Speech-impaired occupant will use speech-to-text app on phone to communicate with out-of-area contact."
10. Document check-in procedures: specify how often to check in (e.g., "within 1 hour of evacuation, then every 4 hours"), what to communicate (e.g., "location, status, needs"), when to assume someone is safe (e.g., "if no contact within 24 hours, assume person is safe unless told otherwise"). Include note: "During major disasters, communication networks may be overloaded; be patient and try multiple methods."
11. Create wallet card data: generate simplified contact info (out-of-area contact, meeting points, key phone numbers) formatted for printing on credit-card-sized card. Include: out-of-area contact name and phone, meeting point addresses, household contact list (names and phone numbers), medical allergies or critical info.

**Output:**
- communication_protocol (object with contact list, methods, procedures, wallet card data)

**Quality Gate:**
- All household members are listed with contact info and accessibility needs (verify count matches home_profile occupant_count)
- Out-of-area contact is identified, has agreed to role, and is outside likely disaster zone (verify by checking address against local_hazards)
- At least 2 communication methods are specified with reliability notes (not generic "phone and email")
- Special communication needs are addressed for each occupant requiring accommodation (children, non-English speakers, hearing-impaired, speech-impaired)
- Check-in procedures are clear and realistic (specify frequency, what to communicate, when to assume safe)
- Wallet card data is complete and can be printed on 3.5" × 2" card

---

### Phase 5: Create Insurance Review Checklist

**Entry Criteria:**
- home_profile is validated (home type, location, contents estimate if available)
- local_hazards are known

**Actions:**
1. Identify insurance types needed based on home_profile and local_hazards: homeowners or renters insurance (required), auto insurance (if vehicles present), health insurance (verify all occupants have coverage), life insurance (recommended if occupants have dependents), pet insurance (optional but recommended if pets present), flood insurance (required if in flood zone), earthquake insurance (recommended if in seismic zone), umbrella liability insurance (optional but recommended for additional protection).
2. For each insurance type, create checklist items: verify coverage limits are adequate (not just minimum), check deductibles (higher deductible = lower premium but higher out-of-pocket cost), confirm exclusions (what is NOT covered), review replacement cost vs. actual cash value (replacement cost is better but more expensive), verify policy is current and active.
3. Identify coverage gaps specific to household: common gaps include flood (often excluded from homeowners), earthquake, valuable items (jewelry, art, collectibles often have low limits of $1,000-2,500; require scheduled personal property rider), business property (home-based business equipment often excluded; requires business property rider), water damage from internal sources (burst pipes, water heater failure), mold damage.
4. Create documentation checklist: home inventory with photos/video of all rooms and contents (verify by walking through home with camera), receipts for high-value items (keep in safe place), policy documents (store copies in safe deposit box and at home), proof of ownership (receipts, credit card statements, photos), property deeds, mortgage documents, vehicle titles, pet medical records, vaccination records.
5. If home is in high-risk location (flood zone, wildfire zone, hurricane zone, earthquake zone, tornado zone): flag additional coverage recommendations and premium implications. For each hazard, specify: required coverage (e.g., flood insurance required in flood zone), recommended coverage (e.g., earthquake insurance recommended in seismic zone), typical premium increase (e.g., "flood insurance adds $500-2000/year depending on risk level"), action item (e.g., "Contact insurance agent within 30 days to add flood insurance").
6. Add financial preparedness items: emergency cash (keep $500-1000 at home in small bills for when ATMs are unavailable), important financial account numbers (bank account, credit card, investment accounts), credit card contacts (phone numbers to call if cards are lost), insurance claim procedures (how to file claim, what documentation is needed, claim phone number), mortgage/rent payment procedures (how to make payments if normal channels unavailable).
7. Create action items with priority and due date: high priority items (due within 30 days, e.g., "Add flood insurance if in flood zone"), medium priority items (due within 90 days, e.g., "Update home inventory with photos"), low priority items (due within 1 year, e.g., "Review umbrella liability coverage"). For each action item, specify: what to do, who is responsible, deadline, how to verify completion.

**Output:**
- insurance_checklist (object with coverage review, gaps, documentation needs, financial preparedness items, action items with priority and due date)

**Quality Gate:**
- All relevant insurance types are addressed (verify against home_profile and local_hazards)
- Coverage gaps are specific and actionable (e.g., "Flood insurance not included in homeowners policy; required if in FEMA flood zone" rather than generic "coverage gaps exist")
- Documentation checklist is comprehensive and includes specific items (photos, receipts, deeds, etc.)
- High-risk location recommendations are included if applicable (verify against local_hazards array)
- Action items are prioritized with specific due dates (not vague "soon")
- Financial preparedness items are included (emergency cash, account numbers, claim procedures)

---

### Phase 6: Compile and Format Final Plan

**Entry Criteria:**
- All previous phases are complete
- All outputs are validated and consistent (verify occupant count, location, hazards are same across all phases)
- No conflicting information between sections (e.g., different meeting points, different contact info)

**Actions:**
1. Validate consistency across all phases: verify occupant_count is same in home_profile, supply_list, communication_protocol, and evacuation_plan. Verify location is same in home_profile and evacuation_plan. Verify local_hazards are referenced consistently in supply_list, evacuation_plan, and insurance_checklist. If conflicts found, abort and return to Phase 1 to re-validate home_profile.
2. Create document structure: title page (household name, date created, last updated), table of contents, introduction, sections for each component (home profile summary, supply list, evacuation plan, communication protocol, insurance checklist), appendices (contact cards, pet ID forms, medical info sheets, supply inventory tracker, drill checklist).
3. Add introduction: explain purpose of plan (to prepare household for emergency and ensure all members know what to do), how to use it (review before emergency, practice procedures, update annually), when to review/update it (annually, after major life changes, after local emergency, before hazard season), how to practice (conduct household drill at least twice yearly using drill checklist).
4. Compile home profile section: summarize key household information (occupant names and ages, pets, medical needs, mobility constraints, home type and location). Include note: "Review this section annually and update if household composition changes."
5. Compile supply list section: organize by category with shopping checklist format (checkbox for each item). Include: quantities, units, storage location, expiration dates, rotation schedule. Add note: "Check supplies every 6 months; rotate water and food; replace expired medications and first aid items."
6. Compile evacuation plan section: include primary and secondary routes with text directions (not requiring maps), meeting point details with addresses and GPS coordinates, shelter information with phone numbers and accessibility notes, accessibility accommodations for each occupant with constraints, transportation assistance plan, pet evacuation plan. Add note: "Practice evacuation routes at least twice yearly; time how long it takes to reach each meeting point."
7. Compile communication protocol section: include contact list template (name, phone, role, accessibility needs), communication tree diagram (showing how messages will be relayed), out-of-area contact info, check-in procedures with specific timing, wallet card template (for printing). Add note: "Update contact list whenever phone numbers change; teach children out-of-area contact number."
8. Compile insurance checklist section: organize by policy type with action items, coverage gaps, documentation needs. Include: high-priority items (due within 30 days), medium-priority items (due within 90 days), low-priority items (due within 1 year). Add note: "Contact insurance agent to review coverage and fill gaps; store policy documents in safe place."
9. Add appendices: (a) Contact card template (credit-card-sized, printable, with out-of-area contact, meeting points, key phone numbers); (b) Pet identification form (pet name, type, size, microchip number, recent photo, veterinary clinic contact); (c) Medical information sheet (occupant name, allergies, medications, medical conditions, healthcare provider contact); (d) Supply inventory tracker (spreadsheet with item name, quantity, location, expiration date, last checked date); (e) Household drill checklist (step-by-step instructions for practicing evacuation, communication, and supply access).
10. Format for printing: use clear headings (Arial or similar sans-serif font, 12pt minimum), bullet points for lists, tables for checklists and contact info, page breaks between sections. Ensure readability on standard 8.5" × 11" paper. Include page numbers and date on each page. Add note: "Print this plan and keep copies at home, in car, at work, and with out-of-area contact. Update and reprint annually."
11. Validate completeness: confirm all sections from phases 2-5 are included and cross-references are accurate (e.g., if supply list mentions "pet food", verify pet evacuation plan addresses pet needs). Verify no conflicting information (e.g., same meeting points, same contact info throughout). Verify document is organized logically and easy to navigate.
12. Final quality check: have someone unfamiliar with the household read the plan and verify they could understand and execute it in an emergency. Specifically verify: (a) evacuation routes are clear without requiring maps, (b) contact list is complete and phone numbers are correct, (c) supply list is actionable as shopping checklist, (d) meeting points are specific locations with addresses, (e) communication procedures are clear and realistic, (f) insurance action items are specific and have due dates.

**Output:**
- final_plan_document (formatted, printable string with all sections, appendices, and instructions)

**Quality Gate:**
- Document is complete and includes all required sections (home profile, supply list, evacuation plan, communication protocol, insurance checklist, appendices)
- Information is consistent across sections (same occupant count, same location, same hazards, same contacts throughout)
- Document is organized logically with clear headings, table of contents, and page numbers
- Formatting is professional and printable (readable on standard 8.5" × 11" paper, no formatting errors)
- Appendices include all templates (contact cards, pet ID forms, medical info sheets, supply tracker, drill checklist)
- A household member unfamiliar with the planning process could read the plan and execute it in an emergency (verified by having someone unfamiliar review it)
- Document includes instructions for annual review and updates

---

## Exit Criteria

The skill is complete when:
1. home_profile is validated and contains all extractable information from the input description; clarification_needed array lists any missing critical information
2. supply_list is generated with documented quantities (calculations shown) for household size and hazards; includes expiration dates and storage space estimate
3. evacuation_plan includes primary/secondary routes with text directions, meeting points with addresses and GPS coordinates, shelter locations with accessibility notes, accessibility accommodations for each occupant with constraints, transportation assistance plan, and pet evacuation plan
4. communication_protocol includes all household members with accessibility needs, out-of-area contact with verification of agreement, at least 2 communication methods with reliability notes, special accommodations for children/non-English speakers/hearing-impaired/speech-impaired, check-in procedures with specific timing, and wallet card data
5. insurance_checklist identifies coverage gaps with specific policy types, documents needed with deadlines, action items with priority and due dates, high-risk location recommendations if applicable, and financial preparedness items (emergency cash, account numbers, claim procedures)
6. final_plan_document is formatted, complete, and printable with all sections, appendices, and instructions; includes annual review schedule and drill checklist
7. All outputs are internally consistent (same occupant count, same location, same hazards referenced throughout; no conflicting information between sections)
8. A person unfamiliar with the household could read the plan and execute it in an emergency (verified by having someone unfamiliar review it and confirm they understand evacuation routes, communication procedures, and action items)

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Home description is too vague (e.g., "a house with people") | **Adjust** -- Request specific details using template: location (address or neighborhood), number of occupants (exact count), types (adults/children/elderly/infants), pets (type and size), medical needs (specific conditions and medications), mobility constraints (specific limitations). Provide template in response. |
| Phase 1 | Critical information missing: location not specified | **Adjust** -- Flag in clarification_needed field: "Cannot map evacuation routes without specific address or neighborhood. Proceed with generic evacuation principles; update plan once location is provided." Continue to next phase with placeholder location. |
| Phase 1 | Critical information missing: occupant count unclear (e.g., "a few people") | **Adjust** -- Use conservative estimate (assume 4 occupants) and note assumption in home_profile: "Occupant count unclear; using estimate of 4. Update supply quantities once exact count is confirmed." Continue to next phase. |
| Phase 1 | Medical needs mentioned but not specific (e.g., "health issues") | **Adjust** -- Add generic first aid and medication storage to supply_list; add to clarification_needed: "Medical needs not specified. Request details: medication names, dosages, equipment needed (glucose monitor, inhaler, EpiPen, etc.), storage requirements. Update supply list once details provided." |
| Phase 2 | Occupant count is unclear | **Adjust** -- Use conservative estimate (4 occupants) and note assumption in supply_list calculations. Request clarification for final plan. |
| Phase 2 | Medical needs conflict with storage space (e.g., 30-day medication supply requires more space than available) | **Adjust** -- Flag in supply_list: "Medical supplies require X cubic feet; available storage is Y cubic feet. Options: (1) store some supplies at neighbor's house, (2) rotate supplies more frequently, (3) request occupant to reduce medication supply to 2 weeks instead of 4 weeks. Verify with occupant." |
| Phase 2 | Dietary restrictions not specified but medical condition suggests them (e.g., diabetes mentioned but no dietary info) | **Adjust** -- Add generic diabetic-friendly foods to supply_list; add to clarification_needed: "Dietary restrictions not specified. Request details: any food allergies, dietary preferences, special diets (diabetic, gluten-free, etc.). Update supply list once details provided." |
| Phase 3 | Location is too vague to map routes (e.g., "somewhere in California") | **Adjust** -- Request specific address or neighborhood. Proceed with generic evacuation principles; note in evacuation_plan: "Specific address not provided. Evacuation routes are generic; update with specific routes once address is confirmed. Principles: evacuate away from [hazard type], toward [safe area type]." |
| Phase 3 | Mobility constraints make standard routes inaccessible | **Adjust** -- Identify alternative routes and transportation assistance needed. Flag in evacuation_plan: "Primary route has [barrier]; accessible alternative is [route]. Verify accessibility with local emergency services and update if needed." |
| Phase 3 | Pet-friendly shelters not available in area | **Adjust** -- Recommend alternatives: (1) veterinary emergency clinic, (2) boarding facility, (3) staying with friend/family outside disaster zone, (4) pet-friendly hotel. Flag in evacuation_plan: "Pet-friendly shelters not available in area. Recommended alternatives: [list]. Contact in advance to verify they accept emergency evacuees." |
| Phase 4 | No out-of-area contact is identified | **Adjust** -- Recommend identifying one (friend/family outside region) and note as action item in communication_protocol: "Out-of-area contact not identified. Action: Identify trusted person outside disaster zone and ask if they will serve as message relay. Provide them with household contact list." Proceed with in-area meeting points. |
| Phase 4 | Occupants are too young to memorize contact info (under age 5) | **Adjust** -- Recommend: (1) laminated contact card for child to carry, (2) teach phone number through repetition, (3) identify adult who will help child communicate (teacher, neighbor, caregiver). Flag in communication_protocol: "Child age [X] cannot memorize contact info. Recommended: laminated card, adult helper, repetition practice." |
| Phase 4 | Non-English speakers present but no translation resources available | **Adjust** -- Recommend: (1) identify multilingual neighbor or friend, (2) use translation app on phone, (3) request emergency services provide translated materials. Flag in communication_protocol: "Non-English speaker present. Recommended: [resource]. Verify translation resources are available before emergency." |
| Phase 5 | Existing insurance info is incomplete or unavailable | **Adjust** -- Create comprehensive checklist for all policy types; recommend user contact insurance agent to complete review. Flag in insurance_checklist: "Insurance information not provided. Action: Contact insurance agent within 30 days to review all policies and fill out this checklist." |
| Phase 5 | Home is in high-risk zone but user has no specialized coverage (e.g., flood zone without flood insurance) | **Adjust** -- Flag prominently in insurance_checklist with high-priority action: "Home is in [hazard] zone. [Specialized insurance] is REQUIRED or STRONGLY RECOMMENDED. Action: Contact insurance agent within 30 days to add coverage. Estimated premium: $[range]/year." |
| Phase 6 | Generated document exceeds 20 pages | **Adjust** -- Split into main plan (core supplies, routes, contacts) and appendices (detailed checklists, forms). Provide both as separate documents with note: "Main plan is [X] pages; appendices are [Y] pages. Print main plan for quick reference; keep appendices at home for detailed information." |
| Phase 6 | Information conflicts between sections (e.g., different occupant count in supply_list vs. communication_protocol) | **Abort** -- Return to Phase 1 and re-validate home_profile. Do not generate final plan until conflicts are resolved. Flag: "Inconsistency found: occupant count is [X] in home_profile but [Y] in supply_list. Return to Phase 1 to correct." |
| Phase 6 | Evacuation routes reference location that doesn't exist or is inaccessible | **Abort** -- Return to Phase 3 and re-validate evacuation_plan. Flag: "Meeting point [name] at [address] does not exist or is inaccessible. Identify alternative meeting point and re-validate evacuation plan." |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Emergency Supply Quantities

**Water:** 1 gallon per person per day, minimum 2 weeks = 14 gallons per person. Store in food-grade containers, rotate every 6 months. For pets: 1 gallon per pet per day × 14 days.

**Food:** 2,000 calories per person per day, minimum 2 weeks. Prioritize: canned goods (no-cook), peanut butter, granola bars, crackers, dried fruit, nuts. Include manual can opener. For pets: 30-day supply of regular pet food in airtight containers.

**First Aid:** Standard kit plus: tweezers, pain reliever, antihistamine, antacid, anti-diarrhea, antibiotic ointment, hydrocortisone cream, elastic bandages, triangular bandages, non-adherent pads, medical tape, gloves, hand sanitizer.

**Medications:** 30-day supply of all prescription medications in original bottles with labels. Include: insulin, inhalers, EpiPens, nitroglycerin, blood pressure meds, etc. For specialized needs: glucose monitor + test strips, hearing aid batteries, mobility aid batteries.

**Documents:** Insurance policies, ID, birth certificates, medical records, financial account info, property deeds, photos of home/contents, vehicle registration, pet medical records, vaccination records.

**Tools & Equipment:** Flashlight (with extra batteries), battery-powered radio (NOAA weather radio preferred), phone chargers (car and wall), fire extinguisher, manual can opener, duct tape, plastic sheeting, N95 masks, work gloves, rope, gas shut-off wrench (if applicable), water shut-off tool (if applicable).

### Evacuation Route Selection Criteria

- **Avoid:** Flood zones, wildfire risk areas, areas downwind of hazardous facilities, bridges that may fail, areas prone to landslides, areas with heavy traffic congestion.
- **Prefer:** Higher elevation, away from water bodies, main roads with multiple exits, areas with emergency services, routes with clear landmarks.
- **Consider:** Traffic patterns, time of day, alternative routes if primary is blocked, accessibility for mobility-impaired occupants, pet-friendly routes (avoid areas with aggressive animals).

### Communication Method Reliability by Hazard

- **Cell phone:** Unreliable in major disasters (networks overloaded); text may work when calls don't. Reliability: 30-50% in major disaster.
- **Landline:** Unreliable if power is out; may work if infrastructure intact. Reliability: 40-60% in major disaster.
- **Radio:** Reliable if battery-powered; good for receiving emergency broadcasts. Reliability: 80-90% for receiving (one-way).
- **Email:** Unreliable during disaster; useful for non-urgent communication after immediate crisis. Reliability: 20-40% during disaster.
- **Out-of-area contact relay:** Most reliable method; person outside disaster zone can receive messages and relay to others. Reliability: 70-90% if contact is reachable.
- **Text message:** More reliable than voice calls during network congestion. Reliability: 50-70% in major disaster.

### Insurance Coverage Gaps (Common)

- **Flood:** Excluded from standard homeowners policies; requires separate flood insurance (NFIP or private). Cost: $500-2000/year depending on risk level.
- **Earthquake:** Excluded from standard homeowners policies; requires separate earthquake insurance. Cost: $200-1000/year depending on risk level.
- **Valuable items:** Jewelry, art, collectibles often have low limits ($1,000-2,500); require scheduled personal property rider. Cost: $100-500/year depending on value.
- **Business property:** Home-based business equipment often excluded; requires business property rider. Cost: $200-1000/year depending on business type.
- **Water damage from internal sources:** Burst pipes, water heater failure sometimes excluded; verify coverage. Cost: included in most policies.
- **Replacement cost:** Older policies may only cover actual cash value (depreciated); recommend upgrading to replacement cost. Cost increase: 10-20% of premium.

### High-Risk Location Flags and Recommendations

- **Flood zone:** Recommend flood insurance (required by mortgage lenders if in FEMA flood zone), elevation of critical items, waterproofing, sump pump, emergency supplies include sandbags and plastic sheeting.
- **Wildfire zone:** Recommend defensible space maintenance (clear vegetation within 30 feet of home), fire-resistant materials, evacuation plan, emergency supplies include N95 masks and plywood.
- **Hurricane zone:** Recommend wind/hail coverage, storm shutters, roof reinforcement, evacuation plan, emergency supplies include extra water (1.5 gallons per person per day) and plywood.
- **Earthquake zone:** Recommend earthquake insurance, securing furniture/appliances, knowing how to shut off gas/water, emergency supplies include gas shut-off wrench and water shut-off tool.
- **Tornado zone:** Recommend safe room or basement shelter, weather radio, evacuation plan, emergency supplies include sturdy shoes and goggles.

### Plan Review and Update Schedule

- **Annual review:** Update contact info, refresh supplies (rotate water/food), verify insurance coverage, review evacuation routes for changes in infrastructure.
- **After major life change:** New household member, new pet, new medical condition, moved to new home, new job location, change in mobility status.
- **After local emergency:** Update based on lessons learned, adjust routes if infrastructure changed, verify shelter locations still available.
- **Seasonal:** Before hurricane/wildfire season, before winter storms, before severe weather season.
- **Drill practice:** Conduct household evacuation drill at least twice yearly (spring and fall); time how long it takes to reach meeting points; test communication procedures; verify supplies are accessible.

### Household Drill Checklist (Practice Procedure)

1. **Announce drill:** Tell all household members "This is a drill. We will practice our emergency plan."
2. **Trigger evacuation:** Simulate emergency (e.g., "There is a fire; we must evacuate").
3. **Execute evacuation:** Each occupant follows evacuation plan; time how long it takes to reach primary meeting point.
4. **Verify assembly:** Confirm all household members reached meeting point; note any problems (blocked routes, accessibility issues, missing supplies).
5. **Test communication:** Practice using communication methods (text out-of-area contact, call meeting point, listen to emergency radio).
6. **Access supplies:** Verify emergency supplies are accessible and in good condition; check expiration dates.
7. **Debrief:** Discuss what went well and what needs improvement; update plan based on findings.
8. **Document:** Record drill date, time, participants, issues found, and improvements made.

---

## State Persistence (Recommended)

If this skill is run multiple times for the same household, track:
- Last plan update date (for annual review reminder)
- Supply inventory status (what was used, what needs replenishment, expiration dates)
- Insurance policy changes and coverage updates (new policies, coverage increases, premium changes)
- Changes in household composition or medical needs (new occupants, new pets, new medical conditions)
- Evacuation drill results (dates, times, issues found, improvements made)
- Feedback on plan usability (what worked, what didn't in drills or actual events)

This allows the skill to generate updated plans that build on previous versions rather than starting from scratch. Recommended: store state in database with household ID, last update date, and summary of changes since last plan.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.