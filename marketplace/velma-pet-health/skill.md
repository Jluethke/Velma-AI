# the system Pet Health

Maintains a full health profile for every pet in your household: vaccination schedule, vet visit history, medication reminders, weight tracking, behavioral change log, dental cleaning schedule, and parasite prevention timeline. Takes your pet's species, breed, age, weight, and medical history, then generates a care calendar that tells you exactly what's due, what's coming up, and when something in the weight or behavior log suggests a vet visit. Designed for the pet owner who keeps the vet's fridge magnet but can't remember if the rabies shot was last year or two years ago.

## Execution Pattern: Phase Pipeline

```
PHASE 1: PET PROFILES    --> Build health profile for each pet
PHASE 2: CARE CALENDAR   --> Map all preventive care, vaccinations, and checkups
PHASE 3: TRACKING        --> Set up weight, behavior, and medication logs
PHASE 4: ALERTS          --> Flag overdue items, abnormal trends, and upcoming needs
```

## Inputs
- `pets`: array -- For each pet: name, species (dog, cat, bird, reptile, small mammal), breed, age or DOB, weight, sex (intact or spayed/neutered), indoor/outdoor/both
- `medical_history`: object -- Per pet: known conditions (allergies, arthritis, diabetes, seizures, heart disease), current medications (name, dose, frequency), past surgeries, last vet visit date and reason
- `vaccinations`: object -- Per pet: last known vaccination dates (rabies, DHPP/FVRCP, bordetella, leptospirosis, Lyme, FeLV, etc.), vaccination records if available
- `preventives`: object -- Per pet: current flea/tick product (brand, last applied), heartworm prevention (brand, last given), deworming history
- `vet_info`: object -- (Optional) Veterinary clinic name, phone, address, emergency/after-hours vet contact

## Outputs
- `pet_profiles`: array -- Complete health profile per pet with all medical data consolidated
- `care_calendar`: object -- 12-month calendar with all preventive care dates: vaccinations, checkups, dental, parasite prevention, grooming
- `medication_schedule`: object -- Daily/weekly medication reminders with dose, timing, and refill dates
- `health_alerts`: array -- Overdue vaccinations, weight trend concerns, medication refill warnings, age-based screening recommendations

## Execution

### Phase 1: PET PROFILES
### Entry Criteria
At least one pet's basic info provided.
### Actions
1. Build a health profile for each pet:
   - **Species/breed baseline:** Expected lifespan (e.g., Labrador Retriever 10-12 years, domestic shorthair cat 12-18 years), breed-specific health predispositions (Labs: hip dysplasia, obesity, ear infections; Boxers: cancer, heart conditions; Persians: kidney disease, breathing issues).
   - **Life stage classification:**
     - Dogs: puppy (<1 year), young adult (1-3), adult (3-7), senior (7-10 for large breeds, 10+ for small breeds).
     - Cats: kitten (<1 year), young adult (1-6), adult (7-10), senior (11-14), geriatric (15+).
   - **Weight assessment:** Compare to breed standard range. Flag if >10% over ideal (overweight) or >20% over (obese). Dogs: body condition score 1-9 scale (4-5 ideal). Cats: ideal body condition shows ribs palpable with slight fat cover.
   - **Spay/neuter status:** If intact, note age-appropriate timing for procedure if owner is considering it. Dogs: breed-dependent, typically 6-12 months (large breeds may benefit from waiting to 12-18 months per recent studies). Cats: 4-6 months.
2. Consolidate medical history into a single timeline: surgeries, diagnoses, medication changes, vet visits.
3. Identify information gaps: missing vaccination dates get estimated based on age and typical vet schedules.

### Output
Complete health profile per pet with life stage, weight assessment, breed risks, and medical timeline.
### Quality Gate
Every pet has species, breed, age, weight, and spay/neuter status documented. Breed-specific risks are noted. Life stage determines care frequency.

### Phase 2: CARE CALENDAR
### Entry Criteria
Pet profiles complete.
### Actions
1. **Vaccination schedule by species:**
   - **Dogs (core vaccines):**
     - Rabies: first at 12-16 weeks, booster at 1 year, then every 1 or 3 years depending on state law and vaccine type.
     - DHPP (distemper, hepatitis, parainfluenza, parvovirus): puppy series at 6-8, 10-12, 14-16 weeks, booster at 1 year, then every 3 years.
     - Bordetella (kennel cough): if dog goes to daycare, boarding, grooming, or dog parks. Every 6-12 months.
   - **Dogs (non-core, risk-based):**
     - Leptospirosis: annual, especially if exposure to wildlife, standing water, or rural areas.
     - Lyme disease: annual if in tick-endemic area (northeast US, upper midwest).
     - Canine influenza: if boarding or high-exposure lifestyle. Initial two doses 2-4 weeks apart, then annual.
   - **Cats (core vaccines):**
     - Rabies: first at 12-16 weeks, booster at 1 year, then every 1 or 3 years.
     - FVRCP (feline viral rhinotracheitis, calicivirus, panleukopenia): kitten series at 6-8, 10-12, 14-16 weeks, booster at 1 year, then every 3 years.
   - **Cats (non-core):**
     - FeLV (feline leukemia): recommended for outdoor cats or multi-cat households with outdoor access. Kitten series, then annual or as recommended.
2. **Wellness exam schedule:**
   - Puppies/kittens: every 3-4 weeks until 16 weeks (vaccine series), then at 6 months.
   - Adults: annual wellness exam.
   - Seniors: biannual exams (every 6 months). Add bloodwork panel (CBC, chemistry, thyroid for cats over 10).
3. **Dental care:**
   - Professional dental cleaning: first by age 2-3 for most dogs, then annually or as recommended. Small breed dogs often need cleaning every 6-12 months (more prone to dental disease). Cats: first cleaning by age 3-4, then as indicated.
   - Home dental care: brush teeth 3x/week minimum (daily is ideal). Dental chews supplement but don't replace brushing.
4. **Parasite prevention:**
   - Heartworm: monthly prevention year-round in most of the US (skip only if vet recommends seasonal in very cold climates). Annual heartworm test (blood test).
   - Flea/tick: monthly or as product directs, year-round in warm climates, seasonal in cold climates (but year-round is safest). Options: oral (NexGard, Simparica, Bravecto), topical (Frontline, Advantage), collar (Seresto).
   - Intestinal parasites: fecal test at annual exam. Deworming per vet recommendation, especially if pet is outdoor or hunts.
5. **Grooming schedule** (varies heavily by breed):
   - Bathing: most dogs every 4-8 weeks (more for skin conditions, less for dry skin). Cats: rarely unless medically needed.
   - Nail trimming: every 3-4 weeks for dogs, every 4-6 weeks for cats.
   - Ear cleaning: weekly for floppy-eared dogs (Cocker Spaniels, Basset Hounds, Labs). Monthly for erect-eared breeds. Watch for redness, odor, head shaking.
   - Coat: brush long-haired breeds 2-3x/week, short-haired weekly. Double-coat breeds (Huskies, Goldens) need extra attention during spring/fall blowout.

### Output
12-month care calendar per pet with all dates, vaccination and prevention reminders, and exam scheduling.
### Quality Gate
Core vaccinations are scheduled with correct intervals. Senior pets have biannual exams. Parasite prevention is year-round unless climate justifies seasonal.

### Phase 3: TRACKING
### Entry Criteria
Care calendar established.
### Actions
1. **Weight log:** Record weight at every vet visit and monthly at home (use a bathroom scale: weigh yourself, then weigh yourself holding the pet, subtract). Flag trends:
   - Gaining >5% in a month without diet change: investigate (thyroid in dogs, diabetes in cats, overfeeding, decreased activity).
   - Losing >5% in a month: vet visit recommended (dental disease, kidney disease, hyperthyroidism in cats, cancer screening in seniors).
   - Steady within 2% of ideal: healthy, continue current plan.
2. **Behavior log:** Track notable changes:
   - Eating: appetite increase or decrease, picky eating, vomiting after meals.
   - Drinking: increased water consumption (polydipsia) is a red flag for kidney disease, diabetes, Cushing's in dogs.
   - Energy: lethargy, reluctance to climb stairs or jump (arthritis), excessive panting.
   - Elimination: changes in frequency, straining, blood in urine or stool, accidents in house-trained pets.
   - Behavior: aggression changes, hiding (cats in pain often hide), excessive grooming or licking one spot, nighttime vocalization in senior pets (cognitive decline).
3. **Medication tracker:**
   - For each medication: name, dose, frequency, prescribing vet, start date, refill date.
   - Calculate refill reminders: 7 days before running out for monthly prescriptions, 14 days for mail-order pharmacy.
   - Track missed doses: one missed heartworm dose may require restarting the test cycle. One missed seizure medication dose can trigger a breakthrough seizure.
4. **Expense tracking** (optional): vet visits, medications, food, grooming, insurance premiums. Typical annual costs: dogs $1,000-3,000, cats $800-1,500 (excluding emergencies).

### Output
Tracking templates for weight, behavior, medications, and expenses, with alert thresholds set.
### Quality Gate
Weight thresholds are set for each pet based on breed standard. Behavior tracking captures the five key categories. Medication refill dates are calculated.

### Phase 4: ALERTS
### Entry Criteria
Tracking data available (even minimal).
### Actions
1. Check vaccination status: flag any core vaccine overdue by more than 1 month.
2. Check preventive care: flag if heartworm prevention has a gap longer than 6 weeks (requires retest before restarting in some protocols).
3. Check weight trends: alert if weight change exceeds 5% threshold.
4. Check medication supply: alert at 7-day and 3-day refill marks.
5. Check wellness exam: alert if last exam was more than 12 months ago (adults) or 6 months (seniors).
6. Generate age-based screening recommendations:
   - Dogs 7+: annual bloodwork (CBC, chemistry, urinalysis), thyroid panel, consider chest X-ray.
   - Cats 10+: biannual bloodwork with T4 (thyroid), kidney values (BUN, creatinine, SDMA), blood pressure.
   - All pets over breed-average lifespan: discuss quality-of-life assessment framework with vet.
7. Seasonal alerts: tick season starting (check prevention is current), holiday hazards (chocolate, lilies for cats, antifreeze, xylitol in sugar-free foods, cooked bones).

### Output
Priority-sorted alert list: overdue items, health trend warnings, refill reminders, and upcoming due dates.
### Quality Gate
No overdue core vaccine goes unflagged. Weight alerts use per-pet thresholds, not generic percentages. Medication alerts account for pharmacy lead time.


---

## Worked Example

Illustrative only.

Given typical inputs for Full pet health tracker: vaccination schedules, weight monitoring, medication re, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) every pet has a complete health profile, (2) 12-month care calendar is built with all vaccination and prevention dates, (3) tracking logs are set up with alert thresholds, (4) current overdue items and upcoming needs are identified.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| PET PROFILES | Unknown breed (mixed breed or rescue with no history) | Use "medium mixed breed" as baseline. Estimate age by dental condition and energy level. Note uncertainty and recommend vet confirmation |
| CARE CALENDAR | No vaccination records available | Assume no current vaccinations and schedule a full vet visit for titer testing or vaccine restart. Most vets can do titers to check existing immunity before re-vaccinating |
| TRACKING | Owner doesn't weigh pet regularly | Recommend monthly weigh-ins. Many vet clinics and pet stores have walk-in scales free of charge. At minimum, weigh at every vet visit |
| ALERTS | Multiple overdue items overwhelming the owner | Prioritize by health risk: core vaccines and heartworm prevention first, dental second, wellness exam third. Batch items into a single vet visit where possible |
| ACT | Owner disagrees with vaccination schedule | Note that vaccination protocols vary by vet philosophy. Titer testing is a valid alternative for non-rabies vaccines. Rabies vaccination is legally required in most US jurisdictions |

## State Persistence
- Vaccination dates with next-due dates (updated after each vet visit)
- Weight log with trend line (updated monthly)
- Medication inventory with refill dates
- Behavior change log (timestamped entries)
- Vet visit history (date, reason, findings, cost)
- Expense running total by category and year

## Reference

### Dog Vaccination Schedule

| Vaccine | Puppy Series | First Booster | Ongoing |
|---|---|---|---|
| Rabies | 12-16 weeks | 1 year | Every 1-3 years (state law) |
| DHPP | 6-8, 10-12, 14-16 weeks | 1 year | Every 3 years |
| Bordetella | 8-16 weeks | 1 year | Every 6-12 months |
| Leptospirosis | 12-16 weeks (2 doses, 2-4 wks apart) | 1 year | Annual |
| Lyme | 12-16 weeks (2 doses, 2-4 wks apart) | 1 year | Annual |
| Canine influenza | 2 doses, 2-4 weeks apart | 1 year | Annual |

### Cat Vaccination Schedule

| Vaccine | Kitten Series | First Booster | Ongoing |
|---|---|---|---|
| Rabies | 12-16 weeks | 1 year | Every 1-3 years |
| FVRCP | 6-8, 10-12, 14-16 weeks | 1 year | Every 3 years |
| FeLV | 8-12 weeks (2 doses, 3-4 wks apart) | 1 year | Annual (outdoor cats) |

### Weight Alert Thresholds

| Change | Timeframe | Action |
|---|---|---|
| +3% | 1 month | Monitor, adjust diet |
| +5% | 1 month | Vet consultation |
| +10% | 3 months | Urgent vet visit, bloodwork |
| -3% | 1 month | Monitor closely |
| -5% | 1 month | Vet visit recommended |
| -10% | Any timeframe | Urgent vet visit |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
