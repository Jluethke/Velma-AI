# the system Pet Sitter Brief

Generates a complete care sheet for anyone watching your pets while you're away: feeding schedule with exact portions and brands, medication administration instructions, vet contact and emergency protocol, behavioral notes and quirks, house rules, daily routine, and "if something goes wrong" decision tree. Takes your pet profiles and trip details, then produces a document clear enough that someone who's never met your pets can keep them alive, healthy, and un-stressed. Designed for the pet owner who writes half a page of instructions on a sticky note, realizes it's not enough, and then worries the entire trip.

## Execution Pattern: Phase Pipeline

```
PHASE 1: PET SNAPSHOT  --> Consolidate each pet's critical info for a caretaker
PHASE 2: DAILY ROUTINE --> Build the minute-by-minute care schedule
PHASE 3: EMERGENCY     --> Create the "if something goes wrong" protocol
PHASE 4: BRIEF DOC     --> Assemble the complete care sheet document
```

## Inputs
- `pets`: array -- Per pet: name, species, breed, age, weight, photo description (color, markings for ID), temperament summary
- `feeding`: object -- Per pet: food brand and type (dry, wet, raw), portion size per meal, number of meals per day, feeding times, treats (what's allowed, what's off-limits), food allergies, where food is stored
- `medications`: object -- Per pet: medication name, dose, frequency, administration method (pill in food, liquid syringe, topical, injection), time of day, what to do if pet refuses medication, refill location
- `routines`: object -- Per pet: walk schedule (dogs: times, duration, leash type, routes), litter box routine (cats: scoop frequency, litter type), outdoor access rules, play preferences, sleep location and bedtime routine
- `house_rules`: object -- Rooms pets are/aren't allowed in, furniture rules, door policies (must keep closed/open), alarm system codes, trash can precautions, hazard zones (garage chemicals, houseplants toxic to pets)
- `trip_details`: object -- Departure and return dates, sitter type (friend, professional sitter, boarding), contact method while away, decision-making authority (can sitter authorize emergency vet treatment?)
- `vet_info`: object -- Regular vet name, address, phone, hours. Emergency/after-hours vet name, address, phone. Pet insurance info if applicable (policy number, coverage phone)

## Outputs
- `care_sheet`: object -- Complete daily care document organized for quick reference
- `feeding_chart`: object -- Visual feeding schedule with portions, times, and special instructions
- `emergency_card`: object -- One-page emergency protocol with contacts, authorization, and decision tree
- `house_guide`: object -- Home access, rules, and hazard warnings

## Execution

### Phase 1: PET SNAPSHOT
### Entry Criteria
Pet information provided.
### Actions
1. Create a quick-reference card per pet:
   - Name, photo description, age, weight.
   - Personality in 2-3 sentences: "Max is friendly with people but reactive to other dogs on leash. He'll bark at the mail carrier but it's just noise. He loves belly rubs once he trusts you -- give him 10 minutes."
   - Medical conditions that affect daily care: "Diabetes -- insulin injection 2x daily, see medication section." "Arthritis -- can't do stairs, needs help onto the couch." "Epilepsy -- seizure protocol on emergency card."
   - Known triggers and fears: "Thunder -- hides in the bathtub, let him. Don't force him out." "Vacuum cleaner -- put him in the bedroom first." "Cats: laser pointer makes her obsessed for hours after, avoid."
2. Note identification info: microchip number, collar tag details, distinguishing markings. If pet escapes, sitter needs this immediately.
3. Note veterinary preference: "Only take to [vet name] unless it's after hours, then [emergency vet]."

### Output
Quick-reference card per pet with personality, medical alerts, triggers, and ID info.
### Quality Gate
Every pet has enough description that a stranger could identify them. Medical conditions that require sitter action are highlighted. Triggers are specific and actionable.

### Phase 2: DAILY ROUTINE
### Entry Criteria
Pet snapshots complete.
### Actions
1. Build a timeline for a typical day:
   - **Morning (6-8 AM):** Let dog out first thing (or clean litter box). Feed breakfast: [Pet Name] gets 1 cup [brand] dry food in the blue bowl, [Pet 2 Name] gets 1/2 can [brand] wet food on the plate by the fridge. Wait 15 minutes, pick up uneaten food (prevents overeating and ants). Give medications: [details].
   - **Mid-morning (9-11 AM):** Walk dog: 20-30 minutes, use the red leash, avoid the house on the corner with the loose dog. Bring bags (drawer by the front door). Cat: this is nap time, leave her alone.
   - **Afternoon (12-2 PM):** Optional: midday walk for puppies or high-energy dogs. Refill water bowls (check twice daily minimum). Treats: up to 3 [brand] biscuits, nothing from the table.
   - **Evening (5-7 PM):** Feed dinner: same portions as morning. Walk dog: 15-20 minutes. Play time: [Pet Name] likes fetch in the backyard for 10 minutes. Cat: feather wand toy for 10 minutes (it's in the hall closet).
   - **Night (9-10 PM):** Final potty break for dog. [Pet Name] sleeps in the crate in the bedroom (close the door, he'll whine for 2 minutes then settle). Cat sleeps wherever she wants. Lock doggy door if applicable.
2. Note deviations from routine that matter:
   - "If you skip the morning walk, he'll be destructive. Non-negotiable."
   - "She gets anxious if dinner is more than 30 minutes late."
   - "The cat will scream at 5 AM. This is normal. Do not feed her before 7 AM or she'll keep doing it."
3. Note multi-pet dynamics:
   - "Feed them in separate rooms -- Max will steal Luna's food."
   - "They play rough but it's normal. Intervene only if there's yelping."
   - "The cat and dog are fine together. The cat is in charge."

### Output
Hour-by-hour daily care schedule with specific instructions, portions, and behavioral notes.
### Quality Gate
Feeding times and portions are exact. Walk requirements are specific (duration, route, equipment). Multi-pet interactions are addressed.

### Phase 3: EMERGENCY
### Entry Criteria
Routine and medical info complete.
### Actions
1. Build the emergency contact hierarchy:
   - **First call:** Owner (your number, partner's number, best contact method while traveling).
   - **Second call:** Designated backup decision-maker if owner is unreachable (family member, close friend).
   - **Veterinarian:** [Name, phone, address, hours].
   - **Emergency vet:** [Name, phone, address, open 24/7 or specific hours].
   - **Poison control for pets:** ASPCA Poison Control 1-888-426-4435 ($95 consultation fee, charge to owner's card).
2. Define decision-making authority:
   - "You are authorized to approve emergency veterinary treatment up to $[amount]. My credit card is on file at [vet clinic]."
   - OR "Call me before any treatment. If you can't reach me, call [backup person] who can authorize."
   - Insurance: "[Company] policy #[number]. Call [number] for pre-authorization if possible, but don't delay emergency treatment for insurance approval."
3. Emergency decision tree:
   - **Not eating for 24+ hours:** Call owner. If can't reach, call vet for phone consult.
   - **Vomiting/diarrhea once:** Monitor. If it continues past 12 hours, or there's blood, call vet.
   - **Limping:** Restrict activity. If not bearing weight, call vet same day.
   - **Seizure:** Time it. Don't restrain the pet. Clear area of objects. If longer than 3 minutes, emergency vet immediately. If under 3 minutes and pet recovers, call owner then call vet.
   - **Difficulty breathing:** Emergency vet immediately. Don't wait.
   - **Ingested something toxic:** Call poison control or emergency vet immediately. Common toxins: chocolate, grapes/raisins, xylitol (sugar-free gum), lilies (cats), onions/garlic, antifreeze, rat poison.
   - **Escaped:** Search immediate area first. Then check microchip is registered and call local animal control. Post on neighborhood social media.
4. Location of supplies: first aid kit, carrier (for emergency vet transport), extra leash, towels.

### Output
Emergency protocol with contact hierarchy, authorization level, decision tree, and supply locations.
### Quality Gate
Emergency vet contact is verified. Authorization level is explicit. Decision tree covers the 6 most common emergencies. Poison control number is included.

### Phase 4: BRIEF DOC
### Entry Criteria
All sections complete.
### Actions
1. Assemble the complete care sheet in this order:
   - **Page 1: Quick Reference** -- Pet names with photos/descriptions, vet contacts, emergency vet, owner contact, emergency authorization level.
   - **Page 2: Daily Routine** -- Timeline from morning to night with all feeding, walking, medication, and play details.
   - **Page 3: Feeding & Medication** -- Exact brands, portions, times, medication administration details with "if they refuse" backup plans.
   - **Page 4: House Rules** -- Rooms, furniture, doors, alarm codes, hazards, trash, where to find supplies.
   - **Page 5: Emergency Protocol** -- Decision tree, contacts, authorization, supply locations.
   - **Page 6: Personality & Quirks** -- The fun stuff that makes care easier: "He'll bring you a shoe when you come home. Just take it and say thank you." "She likes to sit on the bathroom rug while you shower. Let her."
2. Format for usability: large text, headers that scan, checkboxes for daily tasks the sitter can mark off.
3. Include the trip dates and owner return time: "We'll be back Sunday 10/27 around 6 PM. You're done when we walk in the door."

### Output
Complete multi-page care brief document ready to hand to the pet sitter.
### Quality Gate
Document is usable by someone who has never met the pets. Emergency info is on the first page. Daily routine is specific enough to follow without guessing. No critical info is buried.


---

## Worked Example

Illustrative only.

Given typical inputs for Generates a complete pet sitter care sheet: daily routine, feeding chart, medica, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) every pet has a quick-reference card, (2) daily routine covers feeding, walking, medication, and play with exact times and portions, (3) emergency protocol has contacts, authorization, and decision tree, (4) house rules and hazards are documented, (5) complete brief is assembled and ready to share.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| PET SNAPSHOT | Owner can't describe pet's personality | Ask three questions: "What would a stranger notice in the first 5 minutes?", "What scares them?", "What makes them happiest?" These surface the essentials |
| DAILY ROUTINE | Schedule varies day to day | Build a weekday and weekend version. Identify the non-negotiables (feeding times, medication times) vs flexible items (walk duration, play time) |
| EMERGENCY | Owner doesn't have a backup decision-maker | Recommend designating one before the trip. If truly no one, set a higher pre-authorized vet treatment amount so the sitter can act without calling |
| BRIEF DOC | Too much information, sitter won't read it | Keep Page 1 (quick reference) to essentials only. The rest is reference material -- sitter reads it once, then refers back as needed. Bold the non-negotiables |

## State Persistence
- Pet profiles (updated as health or behavior changes)
- Sitter feedback log (what went well, what was confusing, what was missing from the brief)
- Trip history (dates, sitter used, any issues that arose)
- Emergency event log (if something happened, what was the outcome, update the protocol)

## Reference

### Common Pet Toxins

| Substance | Species | Danger Level | Symptoms |
|---|---|---|---|
| Chocolate (dark/baker's) | Dogs | High | Vomiting, tremors, seizures, death |
| Grapes/raisins | Dogs | High | Kidney failure |
| Xylitol (sugar-free gum) | Dogs | Critical | Liver failure, hypoglycemia, death |
| Lilies (all parts) | Cats | Critical | Kidney failure within 24-72 hours |
| Onions/garlic | Dogs, cats | Moderate | Anemia (damage may be delayed 3-5 days) |
| Antifreeze | All | Critical | Kidney failure, lethal in small amounts |
| Ibuprofen/acetaminophen | Dogs, cats | High | Kidney/liver failure |
| Marijuana/edibles | Dogs, cats | Moderate-High | Lethargy, vomiting, seizures, coma |

### Emergency Vet Visit Triggers

| Symptom | Urgency | Action |
|---|---|---|
| Difficulty breathing | IMMEDIATE | Emergency vet now |
| Seizure >3 minutes | IMMEDIATE | Emergency vet now |
| Ingested known toxin | IMMEDIATE | Poison control then emergency vet |
| Bloated abdomen (large dogs) | IMMEDIATE | Possible GDV, emergency vet now |
| Not eating 24+ hours | Same day | Call vet for guidance |
| Vomiting/diarrhea with blood | Same day | Vet visit |
| Limping, not bearing weight | Same day | Vet visit |
| Lethargy lasting 24+ hours | Same day | Vet visit |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
