# Pet Care Guide

Takes your pet type (dog, cat, bird, fish, reptile, small animal), breed, age, and living situation, then provides a comprehensive care schedule covering feeding, exercise, grooming, vet visits, vaccinations, dental care, and behavioral milestones. Answers common questions: "Is this behavior normal?" "What should I feed them at this age?" "When do they need shots?" Designed for new pet owners and people who inherited a pet and don't know the basics.

## Execution Pattern: ORPA Loop

## Inputs
- pet: object -- Species, breed (or "mixed/unknown"), age (or estimate), weight, sex, spayed/neutered status
- living_situation: object -- Home type (apartment, house with yard, rural property), climate, other pets in household, children in household (with ages)
- experience: string -- Owner's pet experience level: first-time owner, had pets as a kid, experienced owner new to this species, lifelong pet person
- concerns: array -- (Optional) Specific worries or questions: behavioral issues, dietary uncertainty, upcoming life changes (baby, moving, new pet), health symptoms
- history: object -- (Optional) Known medical history, vaccination records, previous diet, rescue/shelter background, known trauma or behavioral flags

## Outputs
- care_schedule: object -- Daily, weekly, monthly, and annual care tasks organized as a calendar-friendly schedule
- feeding_plan: object -- What to feed, how much, how often, treats policy, foods to absolutely avoid
- health_roadmap: object -- Vaccination schedule, vet visit timeline, dental care plan, parasite prevention, spay/neuter guidance if applicable
- behavior_guide: object -- What's normal at this age/breed, warning signs, socialization milestones, training priorities
- emergency_reference: object -- Poison hotline, emergency vet criteria (when to go NOW vs. monitor), first aid basics

## Execution

### OBSERVE: Build the Pet Profile
**Entry criteria:** Pet species, approximate age, and living situation provided.
**Actions:**
1. Identify the pet's life stage: neonatal, puppy/kitten/juvenile, adolescent, adult, senior. Each stage has radically different needs. A 10-week-old puppy and a 10-year-old dog are completely different care situations.
2. Research breed-specific characteristics: energy level, common health predispositions, temperament norms, size expectations, coat type and grooming needs. For mixed breeds, identify likely dominant traits.
3. Assess the living environment: apartment dogs need more structured exercise than yard dogs. Indoor cats need environmental enrichment. Fish tank size determines stocking limits. Climate affects outdoor time for all species.
4. Identify household dynamics: other pets may require introduction protocols. Children under 6 need supervision rules. Multiple pets means feeding management to prevent resource guarding.
5. Flag any immediate concerns: if the pet is newly adopted, very young, showing symptoms, or has unknown history, prioritize a vet visit recommendation before anything else.
6. For rescue/shelter pets: acknowledge the decompression period (3-3-3 rule for dogs: 3 days overwhelm, 3 weeks settling, 3 months true personality). Adjust expectations accordingly.

**Output:** Complete pet profile with life stage, breed characteristics, environment assessment, household dynamics, and priority flags.
**Quality gate:** Life stage is correctly identified. Breed predispositions are noted. Immediate vet needs are flagged.

### REASON: Design the Care Plan
**Entry criteria:** Pet profile complete.
**Actions:**
1. **Feeding plan** by life stage:
   - Puppies/kittens: 3-4 meals/day, specific caloric needs by weight and expected adult size, when to transition to adult food.
   - Adults: 2 meals/day for dogs (1 for some breeds), measured portions based on weight and activity, quality indicators for commercial food.
   - Seniors: adjusted portions for lower metabolism, joint-support ingredients, softer food if dental issues.
   - Species-specific: fish feeding frequency and amount, reptile feeding schedules (some eat weekly), bird seed vs. pellet ratios.
2. **Toxic food list** for the species: dogs (chocolate, grapes, xylitol, onions), cats (lilies, onions, raw fish), birds (avocado, chocolate, caffeine), reptiles and fish by species.
3. **Exercise requirements** by breed and age: daily walk duration and frequency for dogs, play session needs for cats, flight time for birds, swimming enrichment for fish (current flow, tank decor).
4. **Grooming schedule**: coat brushing frequency, bathing cadence (most dogs: monthly, cats: rarely, reptiles: habitat cleaning), nail trimming intervals, ear cleaning, dental brushing.
5. **Health calendar**: core vaccinations by age (DHPP and rabies for dogs, FVRCP and rabies for cats), booster schedule, annual exam timing, parasite prevention (flea, tick, heartworm by region), dental cleaning recommendations.
6. **Behavioral milestones**: what to expect at each life stage. Puppy teething at 3-6 months, adolescent regression at 6-18 months, cat territorial behavior at maturity, senior cognitive changes. When behavior is normal development vs. when it's a problem.

**Output:** Complete care plan organized by daily, weekly, monthly, and annual tasks. Feeding specifics, health calendar, exercise plan, grooming schedule, and behavioral expectations.
**Quality gate:** Feeding amounts are specific to weight and age, not generic. Vaccination schedule matches species and regional norms. Exercise plan is realistic for the owner's living situation.

### PLAN: Anticipate and Prevent
**Entry criteria:** Care plan designed.
**Actions:**
1. **Pet-proofing checklist** for the home: toxic plants to remove, chemicals to secure, small objects to pick up (puppies and birds), window and balcony safety (cats), electrical cord management, trash can security.
2. **Training priorities** ranked by urgency:
   - Dogs: potty training (immediate), bite inhibition (immediate), name response, leash walking, basic commands (sit, stay, come), crate training.
   - Cats: litter box orientation (day 1), scratch post training, carrier desensitization.
   - Birds: step-up command, cage return, bite pressure training.
3. **Socialization windows**: dogs have a critical socialization period (3-16 weeks) that shapes lifetime behavior. Missing it has permanent consequences. Cats are similar (2-9 weeks). Outline what exposure is needed and how to do it safely before vaccinations are complete.
4. **Upcoming life stage transitions**: when the pet will hit adolescence (regression is normal), when to switch food, when to schedule spay/neuter, when senior screening should begin.
5. **Cost forecasting**: estimated annual cost breakdown: food, routine vet care, vaccinations, parasite prevention, grooming, supplies, emergency fund recommendation. Breed-specific costs (bulldogs have higher vet bills, long-haired cats need more grooming).
6. **Emergency preparedness**: identify nearest emergency vet (24-hour), save poison control number (ASPCA: 888-426-4435 in US), build a pet first-aid kit list, know the signs that mean "go to the vet now" vs. "monitor and call in the morning."

**Output:** Pet-proofing checklist, training priority list, socialization plan, upcoming milestones, annual cost estimate, and emergency reference card.
**Quality gate:** Pet-proofing covers species-specific hazards. Training priorities are age-appropriate. Emergency vet is identified.

### ACT: Deliver the Guide
**Entry criteria:** Full care plan, prevention plan, and emergency reference assembled.
**Actions:**
1. Organize the care schedule as a practical daily routine:
   - Morning: feed, walk/exercise, fresh water.
   - Midday: check in, play session (if home), potty break (puppies).
   - Evening: feed, walk/exercise, grooming, training session (5-10 min).
   - Weekly: nail check, ear check, toy rotation, habitat cleaning.
   - Monthly: flea/tick/heartworm prevention, full grooming session, weight check.
   - Annually: vet exam, vaccination boosters, dental assessment, blood work (seniors).
2. Present feeding instructions in dead-simple terms: "[this brand or type], [this much], [this many times per day], [in this kind of bowl], [at these times]."
3. Answer any specific concerns from the input: behavioral questions get explanation of why plus what to do. Health symptoms get urgency assessment (vet now, vet this week, monitor at home).
4. Provide the "new owner FAQ" for the species: the 10 most common panicked-Google-at-midnight questions and their answers (puppy breathing fast while sleeping is normal, cat knocking things off tables is normal, fish at the top of tank may need water change).
5. Include a "things your vet should know" prep sheet: list of questions to ask at the first visit, what records to bring, what to observe before the appointment.

**Output:** Complete, actionable pet care guide with daily routine, feeding specifics, health calendar, behavior guide, emergency reference, and vet visit prep.
**Quality gate:** Every instruction is specific enough to follow without googling. Urgency levels are clear on health concerns. Schedule is realistic for the owner's experience level.

## Exit Criteria
Done when: (1) daily care routine is outlined with specific feeding, exercise, and grooming instructions, (2) health calendar covers vaccinations, vet visits, and parasite prevention for at least the next 12 months, (3) behavioral expectations are set for the pet's current life stage, (4) emergency reference card is provided with poison control and vet-now criteria, (5) any specific concerns from the owner are addressed with clear next steps.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Pet species is exotic or uncommon (sugar glider, hedgehog, axolotl) | Adjust -- provide general care framework, strongly recommend finding a vet who specializes in exotics before proceeding |
| OBSERVE | Pet's age is completely unknown (rescue with no records) | Adjust -- estimate by physical indicators (teeth, coat, energy), recommend vet assessment for age confirmation |
| REASON | Owner's living situation conflicts with pet needs (husky in a studio apartment) | Escalate -- don't pretend it's fine. Explain the realistic challenges, suggest specific accommodations (doggy daycare, dog walker, extra exercise commitment), and be honest about what the pet needs |
| REASON | Multiple conflicting dietary needs (multi-pet household) | Adjust -- separate feeding stations, timed feeding instead of free-feeding, species-appropriate food for each |
| PLAN | Owner can't afford recommended care (vet visits, quality food) | Adjust -- prioritize essentials (vaccines, parasite prevention, quality food), suggest low-cost vet clinics, pet food banks, and which expenses to never skip vs. where to save |
| ACT | Pet is showing symptoms that suggest immediate medical attention | Escalate -- stop the guide, direct owner to emergency vet or poison control immediately. Health emergencies override everything |
| ACT | User rejects final output | Targeted revision -- ask which section fell short (feeding plan, health calendar, behavior guide, or emergency reference) and rerun only that section with more breed- or age-specific detail. |

## State Persistence
- Pet health record (vaccination dates, vet visits, weight history, medications, allergies)
- Feeding history (what worked, what caused digestive issues, brand preferences)
- Behavioral log (training progress, socialization milestones, incidents)
- Vet contact info (regular vet, emergency vet, specialist if applicable)
- Life stage tracking (automatically adjusts care recommendations as pet ages)

## Reference

### Vaccination Schedule Reference (US)

**Dogs (core vaccines):**
- Distemper/Parvovirus/Adenovirus (DHPP): 6-8 weeks, 10-12 weeks, 14-16 weeks, 12-16 months, then every 1-3 years
- Rabies: 12-16 weeks, then 1 year, then every 1-3 years (varies by local law)

**Cats (core vaccines):**
- FVRCP: 6-8 weeks, 10-12 weeks, 14-16 weeks, 12-16 months, then every 1-3 years
- Rabies: 12-16 weeks, then 1 year, then annually or every 3 years

### Go-to-Vet-Now Criteria

| Symptom | Species | Urgency |
|---|---|---|
| Breathing difficulty, gasping | All | Emergency now |
| Collapse or can't stand | All | Emergency now |
| Suspected ingestion of toxin | All | Emergency now or call poison control |
| Bloated, distended abdomen with retching (no vomit) | Dogs | Emergency now (GDV) |
| Urinary straining, no output | Cats (male) | Emergency now (urinary blockage) |
| Seizure lasting >5 min or recurring | All | Emergency now |
| Vomiting or diarrhea (blood) | All | Same-day vet |
| Not eating for 24 hrs (cats), 48 hrs (dogs) | All | Same-day vet |
| Eye discharge, squinting | All | Same-day vet |

### Emergency Contact Reference (US)

- ASPCA Poison Control: 888-426-4435 (fee may apply)
- Pet Poison Helpline: 855-764-7661 (fee applies)

### Common Toxic Foods by Species

| Species | Toxic Items |
|---|---|
| Dogs | Chocolate, grapes/raisins, xylitol (in sugar-free gum/candy), onions/garlic, macadamia nuts, raw yeast dough |
| Cats | All lilies (true lilies), onions/garlic, raw fish (thiaminase), xylitol, raw eggs (long-term) |
| Birds | Avocado, chocolate, caffeine, onions, xylitol, alcohol, salt |
| Rabbits | Iceberg lettuce, rhubarb, avocado, chocolate, anything from the allium family |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.