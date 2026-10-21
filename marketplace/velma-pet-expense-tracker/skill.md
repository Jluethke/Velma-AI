# the system Pet Expense Tracker

Tracks every dollar you spend on your pets across vet bills, food, grooming, medications, insurance, toys, boarding, and supplies, then shows you monthly and annual totals by category, budget vs actual, and whether pet insurance is actually saving you money. Takes your pet inventory and spending data, then produces a financial picture that answers the question every pet owner secretly wonders: "How much do the pets actually cost?" Designed for the person who knows pets are expensive but has never added it all up and doesn't want to be surprised by a $3,000 vet bill they didn't save for.

## Execution Pattern: Phase Pipeline

```
PHASE 1: COST BASELINE  --> Establish typical annual cost per pet by category
PHASE 2: EXPENSE LOG    --> Track actual spending against expected costs
PHASE 3: INSURANCE MATH --> Calculate whether pet insurance is net positive or negative
PHASE 4: BUDGET PLAN    --> Create a monthly pet budget with emergency fund target
```

## Inputs
- `pets`: array -- Per pet: name, species, breed, age, known medical conditions, special dietary needs
- `expenses`: object -- Known spending by category: vet (routine visits, emergency, dental), food (brand, monthly cost), grooming (frequency, cost per visit), medications (monthly cost), `insurance` (premium, deductible, reimbursement rate), boarding/daycare (frequency, cost), toys/supplies (annual estimate)
- insurance: object -- (Optional) Per pet: provider, monthly premium, annual deductible, reimbursement percentage, annual max payout, claims filed in last 12 months with amounts, conditions excluded
- `budget_target`: number -- (Optional) How much you want to spend per month on all pets combined

## Outputs
- `cost_summary`: object -- Annual and monthly cost per pet, broken down by category, with running totals
- `insurance_analysis`: object -- Premium paid vs claims reimbursed, break-even analysis, recommendation
- `budget`: object -- Monthly pet budget with line items, emergency fund target, and variance tracking
- `forecast`: object -- Projected costs for next 12 months based on age, health trends, and known upcoming needs

## Execution

### Phase 1: COST BASELINE
### Entry Criteria
Pet info provided.
### Actions
1. Establish expected annual cost by species, breed, and age:
   - **Dogs (annual average):**
     - Food: $250-700 (small breed) to $500-1,200 (large breed). Premium/raw diets 2-3x more.
     - Routine vet: $200-400 (annual exam, vaccines, heartworm test, flea/tick).
     - Dental: $300-800 per professional cleaning (recommended annually for most dogs).
     - Grooming: $0 (DIY short-coat) to $600-1,200 (professional grooming every 6-8 weeks for breeds that need it).
     - Medications: $0 (healthy) to $50-200/month (chronic conditions: arthritis, allergies, thyroid, diabetes).
     - Preventives (heartworm, flea/tick): $200-400/year.
     - Toys/supplies: $50-200/year.
     - Boarding/daycare: $0 to $3,000-6,000/year (2-3 trips at $40-75/day boarding, or regular daycare at $25-40/day).
   - **Cats (annual average):**
     - Food: $200-500 (dry) to $400-800 (wet/premium).
     - Routine vet: $150-300.
     - Dental: $300-800 per cleaning (less frequent than dogs, typically every 1-3 years).
     - Litter: $100-250/year (clumping clay) to $300-500 (premium/automatic litter systems).
     - Medications: $0 to $50-150/month.
     - Preventives: $100-200/year (indoor cats less).
   - **Senior pets (7+ dogs, 10+ cats):** Add 30-50% to vet costs for bloodwork, more frequent visits, medication increases.
2. Flag breed-specific cost risks:
   - Bulldogs/Frenchies: respiratory issues, skin fold infections, $1,000-5,000 in breed-specific care.
   - German Shepherds: hip dysplasia, $3,000-7,000 for surgery if it develops.
   - Golden Retrievers: cancer rates of 60%+, potential chemotherapy costs $5,000-10,000+.
   - Cavalier King Charles: heart disease (mitral valve disease) nearly universal, ongoing cardiac meds.
   - Maine Coons/Ragdolls: hypertrophic cardiomyopathy risk, echocardiograms $300-500.
3. Calculate the baseline expected annual cost per pet and total.

### Output
Expected annual cost per pet by category, breed risk factors, and total baseline.
### Quality Gate
Costs are specific to species, breed, and age -- not just "average dog." Breed-specific risks include cost ranges for likely conditions.

### Phase 2: EXPENSE LOG
### Entry Criteria
Baseline established, actual expense data provided.
### Actions
1. Categorize all provided expenses:
   - **Routine vet:** Wellness exams, vaccinations, heartworm tests, fecal tests.
   - **Emergency vet:** Urgent/after-hours visits, surgeries, hospitalizations.
   - **Dental:** Professional cleanings, extractions, dental X-rays.
   - **Food:** Regular food purchases including treats.
   - **Medications:** Prescriptions, supplements, OTC flea/tick/heartworm.
   - **Grooming:** Professional grooming, bath, nail trim, ear cleaning.
   - **Insurance:** Monthly premiums.
   - **Boarding/daycare:** Per-day boarding, doggy daycare, pet sitting.
   - **Supplies:** Beds, crates, leashes, collars, litter, toys, carriers.
2. Calculate monthly and annual totals per category and per pet.
3. Compare actual to baseline: flag categories where spending is >20% above expected (overspending or higher-need pet) or >20% below (possible under-care or good value).
4. Identify the top 3 cost drivers: e.g., "Emergency vet visit in March ($2,100) is 35% of your total annual pet spend."

### Output
Itemized expense log, monthly/annual totals, category comparison to baseline, top cost drivers.
### Quality Gate
Every expense is categorized. Totals are accurate. Comparison to baseline highlights genuine outliers, not noise.

### Phase 3: INSURANCE MATH
### Entry Criteria
Insurance details and claims history provided.
### Actions
1. Calculate insurance cost vs benefit over the last 12 months:
   - Total premiums paid = monthly premium x 12.
   - Total claims filed = sum of all claims submitted.
   - Total reimbursed = sum of all claim payouts.
   - Out-of-pocket despite insurance = deductible + copay portions + excluded items.
   - Net gain/loss = reimbursed - premiums paid. If positive, insurance saved you money. If negative, you paid more in premiums than you got back.
2. Calculate the break-even point: "At your current premium of $45/month ($540/year) with 80% reimbursement after $250 deductible, you need at least $937 in covered vet bills per year to break even."
   - Formula: break-even = (annual premium + deductible) / reimbursement rate.
3. Project future value based on pet's age and breed:
   - Young healthy pet: insurance is a bet against unlikely emergencies. Average emergency vet visit: $1,500-3,000. Surgery: $3,000-8,000. Cancer treatment: $5,000-15,000.
   - Senior pet: insurance value increases but premiums increase too (often 10-15% per year after age 7). Pre-existing conditions are excluded.
   - Breed at risk for expensive conditions: calculate expected cost of likely conditions and compare to remaining lifetime premiums.
4. Alternative: self-insurance fund. If you put the premium amount into a savings account instead, would you accumulate enough to cover a likely emergency? At $45/month, you'd have $2,700 after 5 years (not accounting for interest). This covers one moderate emergency but not cancer treatment or multiple surgeries.
5. Recommendation: insurance is mathematically favorable when the pet is young and you lock in a low premium, OR when the pet has breed-specific high-cost conditions. It's mathematically unfavorable for healthy mixed-breed pets with no claims history. But insurance is also about risk tolerance: "Can you write a $5,000 check tomorrow if your dog eats something it shouldn't?"

### Output
Premium-to-claims analysis, break-even calculation, future projection, self-insurance alternative, and recommendation.
### Quality Gate
Math is correct. Recommendation accounts for the pet's specific breed/age/health, not just averages. Emotional factor (risk tolerance) is acknowledged alongside the math.

### Phase 4: BUDGET PLAN
### Entry Criteria
Expense log and insurance analysis complete.
### Actions
1. Build a monthly pet budget:
   - **Fixed monthly:** Food, medications, insurance premiums, preventives (amortized monthly).
   - **Variable monthly:** Grooming (averaged across frequency), boarding (averaged if predictable), toys/supplies (averaged).
   - **Annual items amortized monthly:** Routine vet visits, dental, vaccinations. A $400 vet visit + $600 dental = $83/month set aside.
   - **Emergency fund contribution:** Target 1 major emergency reserve per pet ($2,000-5,000 depending on breed risk). If starting from zero, contribute $100-200/month until funded. Once funded, reduce to maintenance level ($25-50/month).
2. Compare budget to target: if the user has a budget target, show the gap and identify where to adjust.
3. Cost reduction opportunities:
   - Food: switch from premium to vet-recommended mainstream (saves 30-50% with no health impact for most pets). Or: buy in bulk, subscribe-and-save options.
   - Grooming: learn basic grooming at home (nail trimming, bathing) and reduce professional visits to every other time.
   - Medications: ask vet for generic alternatives, use GoodRx for pet prescriptions (yes, it works for many pet meds), buy preventives online (Chewy, PetCareRx) instead of through the vet.
   - Boarding: pet sitter or house-sitting swap with other pet owners instead of kennel boarding.
4. Forecast next 12 months:
   - Known upcoming: annual vet visit ($X due in [month]), dental if overdue, vaccination boosters.
   - Age-based projections: if pet is approaching senior status, budget for biannual exams and bloodwork.
   - Breed-based: if breed is at high risk for a condition, include a probability-weighted cost.

### Output
Monthly budget with line items, emergency fund plan, cost reduction opportunities, and 12-month forecast.
### Quality Gate
Budget is realistic and accounts for both predictable and emergency costs. Emergency fund target matches the pet's risk profile. Forecast includes known upcoming expenses.


---

## Worked Example

Illustrative only.

Given typical inputs for Tracks all pet spending by category, analyzes insurance ROI with break-even math, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) annual cost per pet is calculated by category, (2) insurance math shows clear gain/loss and break-even, (3) monthly budget is built with emergency fund target, (4) 12-month forecast includes known and projected expenses, (5) at least 2 cost reduction opportunities are identified.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| COST BASELINE | Unusual breed or exotic pet (parrot, snake, rabbit) | Use species-specific baselines. Parrots: $200-500/year routine, $1,000+ avian vet emergencies. Rabbits: $300-600/year, dental issues common. Snakes: $100-300/year, vet visits less frequent |
| EXPENSE LOG | User doesn't track expenses | Estimate from memory: "How many vet visits this year? How much does a bag of food cost and how long does it last?" Build approximate totals and note margin of error |
| INSURANCE MATH | Pet has pre-existing conditions excluded from coverage | Factor exclusions into analysis. If the most likely expensive condition is excluded, the insurance value drops significantly. Consider whether remaining coverage justifies the premium |
| BUDGET PLAN | Budget target is unrealistically low | Show the minimum responsible care cost (food, preventive vet, parasite prevention). If target is below this floor, explain what gets cut and what the consequences are. Never recommend skipping vaccines or heartworm prevention to save money |

## State Persistence
- Expense log by pet and category (running ledger, updated per expense)
- Insurance claims history with outcomes (approved, denied, amounts)
- Budget vs actual monthly tracking
- Emergency fund balance
- Annual cost trend (year-over-year comparison)

## Reference

### Average Annual Pet Costs (2024 US)

| Category | Dog (small) | Dog (large) | Cat (indoor) |
|---|---|---|---|
| Food | $250-500 | $500-1,000 | $200-500 |
| Routine vet | $200-400 | $200-400 | $150-300 |
| Dental | $300-700 | $300-800 | $300-700 |
| Preventives | $200-350 | $200-400 | $100-200 |
| Grooming | $0-600 | $0-600 | $0-100 |
| Insurance | $300-600 | $400-700 | $200-400 |
| Boarding (2 trips) | $300-600 | $400-800 | $200-400 |
| Supplies/toys | $50-150 | $75-200 | $50-150 |
| **TOTAL** | **$1,600-3,900** | **$2,075-4,900** | **$1,200-2,850** |

### Insurance Break-Even Calculator

| Monthly Premium | Annual Premium | Deductible | Reimburse % | Break-Even Vet Bills |
|---|---|---|---|---|
| $30 | $360 | $200 | 80% | $700/year |
| $45 | $540 | $250 | 80% | $988/year |
| $60 | $720 | $250 | 90% | $1,078/year |
| $80 | $960 | $500 | 80% | $1,825/year |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
