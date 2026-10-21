# the system New Pet Prep

Walks you through everything you need to know and buy before bringing a new pet home: species and breed research matched to your lifestyle, a complete supply checklist, vet selection and first-appointment planning, home pet-proofing by room, a first-week schedule to minimize stress, a training plan for the first 30 days, and if you have existing pets, a structured introduction protocol. Takes your living situation, schedule, experience level, and what kind of pet you're considering, then produces an honest assessment of whether the match is right and a complete preparation plan if it is. Designed for the person who's been thinking about getting a pet and wants to do it right, not wing it.

## Execution Pattern: Phase Pipeline

```
PHASE 1: MATCH ASSESSMENT --> Evaluate lifestyle fit for the species/breed
PHASE 2: SUPPLY LIST      --> Complete checklist of everything needed before arrival
PHASE 3: HOME PREP        --> Pet-proof the home room by room
PHASE 4: FIRST WEEK       --> Day-by-day schedule for stress-free transition
PHASE 5: INTRODUCTIONS    --> Protocol for existing pets meeting the new one
```

## Inputs
- `pet_interest`: object -- Species (dog, cat, bird, reptile, small mammal, fish), breed preferences (if any), age preference (puppy/kitten, adult, senior), source (breeder, shelter/rescue, pet store)
- `lifestyle`: object -- Home type (house with yard, apartment, condo), hours away from home daily, activity level (sedentary, moderate, active, very active), children in home (ages), allergies in household, travel frequency
- `experience`: string -- First-time pet owner, experienced with this species, experienced with a different species
- `existing_pets`: array -- (Optional) Current pets: species, breed, age, temperament, how they've reacted to new animals before
- `budget`: object -- (Optional) Monthly budget for ongoing pet costs, one-time setup budget

## Outputs
- `match_report`: object -- Honest assessment of the lifestyle-pet fit, with green flags, yellow flags, and dealbreakers
- `supply_checklist`: object -- Itemized list of everything needed with estimated costs and where to buy
- `home_prep_plan`: object -- Room-by-room pet-proofing checklist
- `first_week_schedule`: object -- Day-by-day plan for the first 7 days
- `training_plan`: object -- 30-day training roadmap with milestones
- `introduction_protocol`: object -- (If existing pets) Step-by-step introduction plan with timeline

## Execution

### Phase 1: MATCH ASSESSMENT
### Entry Criteria
Pet interest and lifestyle provided.
### Actions
1. Evaluate lifestyle fit:
   - **Time commitment:** Puppies need 2-4 hours of active attention daily, plus potty breaks every 2-3 hours. Adult dogs: 1-2 hours of exercise plus companionship. Cats: 30-60 minutes of interactive play daily. Birds: 2-4 hours of social interaction. If you're gone 10+ hours daily, a puppy is a bad match. An adult cat or a pair of cats is a better fit.
   - **Space:** Large active dogs (Labs, GSDs, Huskies) need a yard or committed daily park visits. Small dogs and cats can thrive in apartments with proper enrichment. Reptiles and fish need space for appropriate enclosures, not floor space.
   - **Activity match:** High-energy breeds (Border Collies, Australian Shepherds, Huskies) need 1-2 hours of vigorous exercise daily. If you run or hike, great. If you don't, this breed will destroy your furniture out of boredom. Low-energy breeds (Basset Hound, Bulldog, Shih Tzu) are better for less active households.
   - **Children:** Breeds known for child tolerance: Golden Retrievers, Labradors, Beagles, Cavaliers. Breeds that may not tolerate young children: Chihuahuas (fragile, nippy), Dalmatians (high energy, can knock kids over), Akitas (can be possessive). Cats: temperament varies more by individual than breed, but Ragdolls and Maine Coons are generally tolerant.
   - **Allergies:** No pet is truly hypoallergenic. Low-shedding dogs (Poodles, Bichon Frise, Portuguese Water Dog) produce less dander. Cats: Siberian and Balinese produce less Fel d1 protein. Spend time with the breed before committing.
   - **Budget reality:** Dogs cost $1,500-5,000/year minimum. Cats $1,000-3,000/year. If the monthly budget is under $100 for a dog, the math doesn't work for responsible care.
2. Generate the match report:
   - **Green flags:** Lifestyle factors that support this pet choice.
   - **Yellow flags:** Adjustable concerns -- "You're in an apartment, but you have a dog park 2 blocks away and work from home. That works."
   - **Dealbreakers:** "You're allergic to cats and want a cat. That's not a yellow flag, that's a wall."
3. If the match has dealbreakers, suggest alternatives: "Instead of a Husky in a studio apartment with 10-hour work days, consider a Greyhound (couch potato despite the speed) or a pair of cats."

### Output
Match report with green/yellow/red assessments, alternative suggestions if needed, and honest cost projection.
### Quality Gate
Assessment is specific to the actual breed and actual lifestyle, not generic. Dealbreakers are stated clearly, not softened into "something to consider."

### Phase 2: SUPPLY LIST
### Entry Criteria
Match assessment passed (or owner decided to proceed despite yellow flags).
### Actions
1. **Dog supply checklist:**
   - Food and water bowls (stainless steel, appropriate size): $10-30.
   - Food (ask the breeder/shelter what they're currently eating, transition slowly over 7-10 days): $30-80/bag.
   - Crate (sized so dog can stand, turn, lie down): $30-120. Wire crates for airflow, plastic for travel/den feel.
   - Bed: $20-60. Skip the expensive orthopedic bed for puppies -- they'll chew it.
   - Leash (6-foot standard, not retractable for training): $10-25.
   - Collar with ID tag (name, your phone number): $10-20.
   - Harness (for pulling dogs or small breeds): $15-40.
   - Poop bags: $10 for a 3-month supply.
   - Toys: one chew toy, one tug toy, one puzzle/Kong: $20-40.
   - Enzymatic cleaner (Nature's Miracle or similar, for accidents): $10-15.
   - Baby gates (to restrict access during training): $15-30 each.
   - Puppy pads (if applicable): $15-25.
   - Treats for training: $10-15.
   - Brush/grooming basics: $10-20.
   - **Total first-time setup: $200-500.**
2. **Cat supply checklist:**
   - Litter box (one per cat plus one extra, rule of thumb): $15-30 each.
   - Litter (start with what the shelter used): $15-25/month.
   - Scoop: $5-10.
   - Food and water bowls (or fountain -- cats prefer running water): $10-50.
   - Food: $20-50/month.
   - Scratching post (tall enough for full stretch, stable enough not to tip): $20-60.
   - Cat tree or perch (cats need vertical space): $40-150.
   - Carrier (for vet transport): $25-50.
   - Toys: wand toy, balls, crinkle toys: $15-30.
   - Collar with breakaway clasp and ID tag: $10-15.
   - Enzymatic cleaner: $10-15.
   - **Total first-time setup: $175-450.**
3. **Pre-arrival vet appointment:** Schedule a vet visit within 72 hours of bringing the pet home. Bring all medical records from the shelter/breeder. First visit covers: physical exam, vaccination review, parasite check (fecal test), microchip registration, spay/neuter discussion. Budget $100-250 for the first visit.

### Output
Itemized supply checklist with costs, where to buy, and priority order (essentials vs nice-to-haves).
### Quality Gate
Every essential item is listed with a cost range. Puppy-specific vs adult-specific items are distinguished. Vet appointment is scheduled.

### Phase 3: HOME PREP
### Entry Criteria
Supplies acquired or ordered.
### Actions
1. **Kitchen:** Secure trash can (locking lid or under-cabinet mount). Store cleaning products in closed cabinets. Remove accessible food from counters (dogs and cats will counter-surf). Secure dishwasher door (curious pets). Know which common foods are toxic: chocolate, grapes, onions, garlic, xylitol, macadamia nuts, avocado (dogs), lilies (cats).
2. **Living areas:** Secure or hide electrical cords (puppy chewing risk, electrocution). Remove or elevate breakable items during puppy/kitten phase. Cover or remove toxic houseplants: lilies (all varieties for cats), pothos, philodendron, sago palm, dieffenbachia, aloe vera.
3. **Bedrooms:** Decide now whether pet is allowed on beds and furniture. Easier to start with restrictions and loosen them than the reverse. Close closet doors (kittens will get trapped, puppies will eat shoes).
4. **Bathrooms:** Keep toilet lid closed (drinking water risk and drowning risk for small animals). Secure medications in closed cabinets (a single dropped pill can be lethal -- ibuprofen, acetaminophen, antidepressants are top pet poisonings). Remove accessible cotton swabs, dental floss, hair ties (linear foreign body risk if swallowed).
5. **Garage/basement:** Lock up antifreeze (lethal in tiny amounts, tastes sweet to pets), rodent poison, herbicides, fertilizers. Block access to tools, nails, small objects. Check for gaps where a pet could become trapped.
6. **Yard (if applicable):** Check fence for gaps at ground level (dogs dig, puppies fit through smaller gaps than you'd think). Identify and remove toxic plants: azaleas, oleander, foxglove, lily of the valley, sago palm, yew. Ensure pool has a pet exit ramp or fence. Secure gate latches.
7. **Balcony (apartments):** Cats can fall from balconies ("high-rise syndrome"). Screen or net the balcony, or keep the door closed.

### Output
Room-by-room pet-proofing checklist with hazards identified and mitigation steps.
### Quality Gate
Every room in the home is assessed. Toxic plants are specifically named (not just "remove toxic plants"). Poison risks are highlighted with severity.

### Phase 4: FIRST WEEK
### Entry Criteria
Home prepped, supplies in place.
### Actions
1. **Day 1 (Arrival):**
   - Keep it calm. Limit visitors. New pet needs to decompress, not perform for guests.
   - Show them water, food, bed/crate, and potty spot (dogs) or litter box (cats).
   - Dogs: take to potty spot immediately on arrival, praise success. Start crate training with door open, treats inside.
   - Cats: set up in one room only (not the whole house). Litter box, food, water, hiding spot. Let them explore at their own pace. Some cats hide for 1-3 days. This is normal.
   - Feed the same food they were eating at the shelter/breeder. Stomach upset from food change plus stress change is miserable for everyone.
2. **Days 2-3:** Establish the routine: wake time, potty/breakfast, walk/play, nap, lunch (puppies), walk/play, dinner, evening routine, bedtime. Consistency reduces anxiety.
   - Dogs: potty breaks every 2-3 hours for puppies, immediately after eating, drinking, playing, and waking from naps. Reward outside potty with treats and praise.
   - Cats: start allowing exploration of additional rooms one at a time if they seem comfortable. Keep litter box in the same spot.
3. **Days 4-5:** Begin basic training (dogs): name recognition (say name, treat when they look at you), sit (lure with treat over head), recall (come when called, high-value treat). 5-minute sessions, 3-4x daily. Cats: begin interactive play sessions (wand toy, 10-15 minutes, twice daily).
4. **Days 6-7:** Assess and adjust: Is the pet eating normally? Using the litter box/going potty in the right spot? Sleeping through the night (expect some disruption with puppies)? Showing signs of stress (excessive panting, hiding, not eating, diarrhea)? Mild stress is normal the first week. No eating for 48+ hours or severe diarrhea warrants a vet call.
5. **The 3-3-3 rule for rescue/shelter pets:** 3 days to decompress (don't expect them to show their real personality yet). 3 weeks to learn your routine and start feeling comfortable. 3 months to feel fully at home. Don't judge a shelter pet's personality in the first week.

### Output
Day-by-day first-week schedule with specific tasks, feeding times, training sessions, and behavioral expectations.
### Quality Gate
Schedule is realistic for someone who also has a job. Behavioral expectations set correctly (puppies WILL have accidents, kittens WILL climb curtains, this is not failure). The 3-3-3 rule is included for rescue pets.

### Phase 5: INTRODUCTIONS
### Entry Criteria
Existing pets in the household.
### Actions
1. **Dog meeting new dog:**
   - Meet on neutral territory first (park, neighbor's yard, NOT your home). Both on leash, parallel walking at a distance, gradually closer. Reward calm behavior.
   - First home introduction: new dog in one room, existing dog has free roam. Swap rooms after 30 minutes (scent exchange).
   - Supervised face-to-face in the home: short sessions (10-15 minutes), both leashed, lots of treats for calm behavior. Separate immediately at any stiffness, hard staring, or growling.
   - Increase time together over 1-2 weeks. Feed in separate rooms for the first month. Don't leave unsupervised until you've seen consistent relaxed body language for 2+ weeks.
2. **Cat meeting new cat:**
   - Separate rooms for 3-7 days minimum. Scent exchange: swap bedding, rub a cloth on one cat's cheeks and leave it with the other.
   - Feed on opposite sides of a closed door (associate the other cat's scent with food, a positive thing).
   - Visual introduction through a baby gate or cracked door: short sessions. If hissing, close the door and try again tomorrow.
   - Supervised same-room time: start with 15 minutes, increase gradually. Have escape routes available (cat trees, hiding spots) so neither cat feels trapped.
   - Timeline: some cats accept a new cat in 1-2 weeks. Others take 1-3 months. Some never fully bond but learn to coexist.
3. **Dog meeting cat (or cat meeting dog):**
   - Separate for the first 3-5 days (scent exchange only).
   - Dog on leash, cat has escape route (high perch, behind baby gate). Let the cat observe the dog from safety.
   - Reward the dog for calm behavior around the cat (treats for ignoring the cat, not staring or lunging).
   - Never force interaction. The cat will approach when ready.
   - High prey-drive dogs (terriers, sighthounds) may never be safe unsupervised with cats. Assess honestly.
4. **Timeline expectation management:** "Your existing pet may be upset, confused, or jealous for 2-4 weeks. This is normal. They're not 'mean' -- their world just changed. Give extra attention to the existing pet to prevent jealousy-based behavior problems."

### Output
Step-by-step introduction protocol with timeline, safety rules, and escalation/de-escalation guidance.
### Quality Gate
Protocol matches the specific species combination. Safety measures are explicit (leashes, gates, separate feeding). Timeline is realistic (weeks, not days). Warning signs that the introduction is failing are listed.


---

## Worked Example

Illustrative only.

Given typical inputs for Complete new pet preparation: lifestyle-breed matching, supply checklist, home p, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) match assessment is honest with green/yellow/red flags, (2) supply checklist is complete with costs, (3) home is pet-proofed room by room, (4) first-week schedule covers days 1-7 with specific tasks, (5) introduction protocol is provided if existing pets are present, (6) 30-day training milestones are set.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| MATCH ASSESSMENT | User's heart is set on a breed that doesn't match their lifestyle | Present the facts honestly. Offer a compromise: "If you love Huskies but live in a studio, consider a Shiba Inu -- similar look, smaller, more independent" |
| SUPPLY LIST | Budget is tight | Identify essentials vs nice-to-haves. Shelter/rescue adoption often includes first vaccines, spay/neuter, and microchip ($50-300 adoption fee vs $500-3,000 breeder price). Supplies: check Facebook Marketplace, Buy Nothing groups, dollar store for bowls |
| HOME PREP | Rental with restrictions (no fence, can't modify) | Focus on interior prep. Use baby gates instead of door modifications. Discuss breed/size restrictions in the lease. Get written landlord approval before adopting |
| FIRST WEEK | Pet isn't adjusting (not eating, extreme fear, aggression) | 48+ hours no eating: vet visit. Extreme fear: reduce stimulation, smaller space, patience. Aggression toward people: consult a veterinary behaviorist (not a trainer), this may indicate pain or a behavioral condition that needs professional assessment |
| INTRODUCTIONS | Existing pet shows aggression toward new pet after 2+ weeks of protocol | Slow down. Go back to scent-only exchange. Consider consulting an animal behaviorist. Some combinations don't work -- having a backup plan (foster-to-adopt trial period) is responsible, not failure |

## State Persistence
- Pet profiles (added when new pet joins household)
- Training progress log (commands learned, milestones reached, challenges encountered)
- Introduction progress (stages completed, timeline, behavioral observations)
- Supply inventory (what's been purchased, what still needs buying)
- Vet records from first visit and ongoing

## Reference

### First-Year Cost Estimates

| Pet Type | Adoption/Purchase | Setup Supplies | First-Year Vet | Food (Year) | Total Year 1 |
|---|---|---|---|---|---|
| Shelter dog | $50-300 | $200-500 | $300-600 | $300-800 | $850-2,200 |
| Breeder dog | $500-3,000 | $200-500 | $300-600 | $300-800 | $1,300-4,900 |
| Shelter cat | $50-200 | $175-450 | $200-400 | $200-500 | $625-1,550 |
| Breeder cat | $500-2,000 | $175-450 | $200-400 | $200-500 | $1,075-3,350 |

### Introduction Timeline Guide

| Combo | Minimum Separation | Typical Integration | Full Comfort |
|---|---|---|---|
| Dog + Dog | 3-7 days | 1-3 weeks | 1-3 months |
| Cat + Cat | 7-14 days | 2-6 weeks | 1-3 months |
| Dog + Cat | 3-7 days | 2-4 weeks | 1-4 months |
| Any + Puppy/Kitten | 3-5 days | 1-2 weeks | 2-4 weeks |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
