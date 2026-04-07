# Medicare Enrollment Guide

Walks you through the Medicare maze without the jargon. Decodes Parts A, B, C, and D so you actually understand what you're buying, helps you pick plans that match your doctors and medications, keeps you from missing deadlines that trigger permanent penalties, and shows you how to appeal when claims get denied. Medicare is one of the most confusing systems in America and the penalties for getting it wrong last forever -- this skill makes sure you don't leave money on the table or end up with coverage that doesn't cover what you need.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DECODE      --> Understand what Medicare actually is and what each part covers
PHASE 2: TIMELINE    --> Map your enrollment windows and deadlines (miss these, pay forever)
PHASE 3: PLAN MATCH  --> Compare plans against your specific doctors, medications, and needs
PHASE 4: ENROLLMENT  --> Walk through the actual enrollment process step by step
PHASE 5: OPTIMIZE    --> Appeal denials, switch plans during open enrollment, and avoid overpaying
```

## Inputs
- personal_info: object -- Age, current insurance situation (employer, marketplace, uninsured, COBRA, VA), employment status, spouse's employment/insurance status, state of residence, estimated retirement date if applicable
- health_profile: object -- Current doctors (names and specialties), current medications (names and dosages), chronic conditions, anticipated medical needs in the next year (surgeries, treatments, regular specialist visits), preferred hospitals
- financial_info: object -- (Optional) Monthly budget for healthcare premiums, income (affects Part B premium -- higher earners pay more), whether you qualify for any assistance programs (Medicaid, Extra Help/LIS)
- current_coverage: object -- (Optional) Current plan details if switching, any retiree health benefits from former employer, VA benefits, Tricare

## Outputs
- medicare_overview: object -- Plain-English explanation of each part tailored to the person's situation, with what's relevant and what's not
- deadline_calendar: object -- Every enrollment deadline with specific dates, consequences of missing them, and actions required
- plan_comparison: array -- Side-by-side comparison of recommended plans with costs, coverage, doctor/drug network status
- enrollment_checklist: object -- Step-by-step enrollment actions with required documents and submission methods
- optimization_plan: object -- Annual review schedule, appeal process for denials, tips for reducing costs

## Execution

### Phase 1: DECODE
**Entry criteria:** Person's age, current insurance situation, and state of residence are known.
**Actions:**
1. Explain the four parts in plain English:
   - **Part A (Hospital Insurance):** Covers hospital stays, skilled nursing facility care (short-term, after a hospital stay), hospice, and some home health care. Most people pay $0 in premiums if they or their spouse paid Medicare taxes for 10+ years (40 quarters). If not, premiums can be $278-$505/month. There's still a deductible ($1,632 per benefit period in 2024) and coinsurance after 60 days.
   - **Part B (Medical Insurance):** Covers doctor visits, outpatient care, preventive services, durable medical equipment, mental health, and ambulance. Standard premium is $174.70/month (2024), but higher earners pay more (IRMAA surcharge based on income from 2 years ago). There's a $240 annual deductible, then you pay 20% of everything with no out-of-pocket maximum -- that "no cap" is why supplemental insurance exists.
   - **Part C (Medicare Advantage):** Private insurance plans that replace Parts A and B (and usually include Part D). Often lower premiums and added benefits (dental, vision, hearing, gym) BUT restricted networks, prior authorization requirements, and you can't use Medigap. Best for healthy people who stay local and want low premiums with extras.
   - **Part D (Prescription Drug):** Covers medications. Separate plan with its own premium ($0-$100+/month), deductible, formulary (list of covered drugs), and the coverage gap. Every plan has a different formulary -- the plan that covers your neighbor's drugs perfectly might not cover yours at all.
2. Explain what Medicare does NOT cover (this surprises everyone): long-term care/custodial care, most dental, most vision, hearing aids (though some Advantage plans cover these), care outside the US, and cosmetic procedures. If you need these, you need separate coverage.
3. Determine which parts this person actually needs. Working past 65 with employer coverage? You may only need Part A now and can delay Part B without penalty. Have retiree benefits? Check whether they require Medicare enrollment as primary. VA benefits? You can have both, but they work differently. Each situation has different rules.
4. Explain Medigap (Medicare Supplement) plans. These fill the gaps in Original Medicare (Parts A and B) -- the deductibles, coinsurance, and that terrifying "no out-of-pocket maximum" in Part B. Plans are standardized by letter (A, B, C, D, F, G, K, L, M, N) -- Plan G from one company covers the exact same things as Plan G from another. The difference is price. Best time to buy: during Medigap Open Enrollment (6 months after Part B starts) when they can't deny you or charge more for health conditions.
5. Clarify the Original Medicare vs. Medicare Advantage decision -- this is the biggest choice. Original Medicare + Medigap + Part D = higher premiums but freedom to see any doctor who accepts Medicare, no referrals needed, no prior authorization for most services, and predictable costs. Medicare Advantage = lower premiums but network restrictions, possible prior auth hassles, and costs can spike if you get seriously ill. Neither is universally better -- it depends on your health, doctors, and risk tolerance.

**Output:** Personalized Medicare overview showing which parts apply, what they cover, what they cost, and the Original Medicare vs. Advantage decision framework.
**Quality gate:** Explanation uses zero unexplained acronyms. Costs are current year figures. The person can explain their options to a family member in their own words.

### Phase 2: TIMELINE
**Entry criteria:** Person understands Medicare basics and their specific situation.
**Actions:**
1. Determine the Initial Enrollment Period (IEP). This is a 7-month window: 3 months before the month you turn 65, your birthday month, and 3 months after. Signing up in the first 3 months means coverage starts on your birthday month. Waiting until the last 3 months means coverage could be delayed 1-3 months. Best practice: sign up 3 months before turning 65. Period.
2. Check for Special Enrollment Period (SEP) eligibility. Common triggers: losing employer coverage (8-month window), moving to a new area, losing Medicaid, employer plan termination. COBRA does NOT count as employer coverage -- if you chose COBRA instead of enrolling in Medicare at 65, you may already owe late penalties. Check this immediately.
3. Calculate any Late Enrollment Penalties. These are permanent and they compound:
   - Part A: 10% premium surcharge for twice the number of years you could have had Part A but didn't. Lasts that duration.
   - Part B: 10% premium surcharge for every full 12-month period you were eligible but not enrolled. This lasts FOREVER. Delayed 3 years? You pay 30% more for Part B premiums for the rest of your life.
   - Part D: 1% of the national base premium for every month without creditable drug coverage. Also permanent.
4. Map the annual enrollment periods. General Enrollment Period (January 1 - March 31): for people who missed their IEP -- coverage starts July 1. Open Enrollment Period (October 15 - December 7): for switching Advantage plans, changing Part D plans, or moving between Original Medicare and Advantage. Medicare Advantage Open Enrollment (January 1 - March 31): for people already in Advantage who want to switch plans or go back to Original Medicare.
5. Create a personalized deadline calendar. List every relevant date with: what action is required, what documents are needed, where to go (online, phone, Social Security office), and what happens if the deadline is missed. Set reminders 30 days before each deadline.

**Output:** Personalized enrollment timeline, penalty assessment, deadline calendar with reminders, and SEP eligibility determination.
**Quality gate:** Every deadline is specific to this person's situation. Penalty exposure is calculated if any delays have occurred. No deadlines are within 30 days without an immediate action flag.

### Phase 3: PLAN MATCH
**Entry criteria:** Timeline established and enrollment windows identified.
**Actions:**
1. Build the doctor compatibility check. List every current doctor and check their Medicare participation status (go to Medicare.gov or call each office). For Advantage plans, check whether each doctor is in-network for the specific plans being considered. Doctors who "accept Medicare" under Original Medicare might not be in a specific Advantage plan's network. Verify every single one.
2. Build the drug compatibility check. List every current medication with exact name, dosage, and frequency. For each plan being considered, check: is the drug on the formulary? What tier is it on (tiers 1-2 are cheap, tiers 4-5 are expensive)? Are there prior authorization or step therapy requirements (you have to try a cheaper drug first)? Is there a quantity limit? Use Medicare.gov's Plan Finder tool for this -- it does the comparison automatically when you enter your drugs.
3. Calculate total annual cost for each plan option. Don't just compare premiums -- that's the trap. Calculate: monthly premium x 12 + annual deductible + estimated copays/coinsurance for your expected usage + drug costs through the coverage gap if applicable. The cheapest premium plan often has the highest total cost for people who actually use healthcare.
4. For Medigap comparison (if going Original Medicare route): get quotes from at least 3 companies for the same plan letter (G is the most popular for people newly eligible). Compare premiums, rate increase history (ask the company directly), and whether they use community-rated, issue-age-rated, or attained-age-rated pricing. Community-rated = premiums don't increase just because you age. Attained-age-rated = premiums increase every year as you get older. This matters enormously over 20+ years.
5. Create the decision matrix. Score each option on: total annual cost, doctor coverage, drug coverage, geographic flexibility (Original Medicare works everywhere, Advantage is often local), ease of use (referral requirements, prior auth hassle), and financial risk (maximum out-of-pocket exposure). Weight these based on what matters most to the person.

**Output:** Side-by-side plan comparison with total annual costs, network coverage verification, drug coverage analysis, and weighted decision matrix.
**Quality gate:** Every current doctor is verified in-network for recommended plans. Every current medication is checked on the formulary. Total cost includes all components (not just premiums). At least 3 options are compared.

### Phase 4: ENROLLMENT
**Entry criteria:** Plan selected.
**Actions:**
1. Gather required documents before starting: Social Security number, Medicare number (if already have a card), current insurance information, list of doctors and medications, bank account or payment information for premium autopay.
2. For Original Medicare (Parts A and B): Enroll through Social Security -- online at ssa.gov (fastest), by phone at 1-800-772-1213, or in person at a local Social Security office. If already receiving Social Security benefits, Part A enrollment may be automatic at 65. Part B requires active enrollment if you're still working and had been declining it.
3. For Part D: Enroll through the plan directly -- each insurance company has its own enrollment process (online, phone, or paper). You cannot enroll in Part D through Medicare.gov (you can compare plans there, but enrollment goes through the insurance company). Coverage starts the 1st of the month after enrollment.
4. For Medicare Advantage: Enroll through the plan directly or through Medicare.gov. If switching from Original Medicare to Advantage, your Medigap plan will end. WARNING: if you later switch back to Original Medicare, you may not be able to get Medigap coverage without medical underwriting (they can deny you or charge more based on health conditions). This is one of the biggest gotchas in Medicare.
5. For Medigap: Enroll through the insurance company during your Medigap Open Enrollment Period (the 6 months starting when your Part B begins). During this window, they cannot charge more or deny you based on health. After this window, they can -- and do. Do not miss this window. Apply even if you think you might not need it -- you can always cancel a Medigap plan, but you can't always get one later.
6. Confirm enrollment. After enrolling, verify: check Medicare.gov for your coverage details, confirm your plan start date, set up premium autopay to avoid accidental coverage gaps, and order your Medicare card and plan cards. Keep copies of all enrollment confirmations.

**Output:** Step-by-step enrollment checklist with specific URLs, phone numbers, required documents, and confirmation steps.
**Quality gate:** Enrollment method is specified for each plan component. All required documents are listed. Confirmation steps are included. Premium payment is set up. Start dates are verified.

### Phase 5: OPTIMIZE
**Entry criteria:** Enrolled in Medicare coverage.
**Actions:**
1. Set up the annual plan review. Every year during Open Enrollment (October 15 - December 7), plans change their formularies, networks, premiums, and copays. The plan that was perfect this year might drop your medication or your doctor next year. Check: the Annual Notice of Change (mailed in September), whether all your doctors are still in-network, whether all your drugs are still on the formulary at the same tier, and whether a competing plan is now better. Use Medicare Plan Finder every year -- it takes 30 minutes and can save thousands.
2. Know how to appeal a denial. Medicare denials are common and the appeal process actually works -- about 50% of appeals succeed. The levels: Redetermination (ask the plan to reconsider, 60 days to file), Reconsideration (independent review, 180 days), ALJ Hearing (for claims over $180), Medicare Appeals Council, Federal Court. For drug denials, you can also request an exception (asking the plan to cover a non-formulary drug) or an expedited review (if health is at risk, decision within 24 hours instead of 30 days).
3. Check for cost reduction programs. Medicare Savings Programs (MSP): if income is below 135% of federal poverty level, the state may pay your Part B premium. Extra Help/Low-Income Subsidy (LIS): reduces Part D costs dramatically if income is below 150% FPL. State Pharmaceutical Assistance Programs (SPAP): many states have additional drug assistance. Apply even if you think you don't qualify -- the thresholds are higher than people expect.
4. Avoid the common money traps: paying for a Medigap plan you don't need if you're healthy on Advantage, staying on a brand-name drug when a generic is now available (ask your doctor annually), not filing appeals for legitimate denials, not checking for Extra Help eligibility, and paying IRMAA surcharges when income has dropped (file form SSA-44 for a Life-Changing Event if income decreased due to retirement, divorce, or death of spouse).
5. Build the annual Medicare maintenance calendar: September -- review Annual Notice of Change from current plan. October 15 -- Open Enrollment begins, compare plans using current doctor and drug list. December 7 -- enrollment deadline, complete all changes. January -- verify new plan is active, test with first doctor visit or prescription fill. Year-round -- save all Explanation of Benefits (EOB) statements, track out-of-pocket spending toward maximum.

**Output:** Annual review checklist, appeal process guide, cost reduction program eligibility assessment, and maintenance calendar.
**Quality gate:** Annual review is scheduled with specific actions. Appeal rights and deadlines are documented. All eligible cost reduction programs are identified. Calendar has reminders set.

## Exit Criteria
Done when: (1) person understands their Medicare parts and options in plain English, (2) all enrollment deadlines are mapped with reminders, (3) plan is selected based on total cost and doctor/drug compatibility, (4) enrollment is complete with confirmation, (5) annual optimization and appeal process is understood.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| DECODE | Person is overwhelmed by complexity | Adjust -- focus only on the one decision that matters right now. If they're turning 65, that's "Original Medicare + Medigap + Part D" vs. "Medicare Advantage." Everything else can wait |
| TIMELINE | Person already missed a deadline and faces penalties | Escalate -- check for SEP eligibility (any qualifying event). If no SEP, calculate penalty cost and factor it into plan comparison. File for General Enrollment if available |
| TIMELINE | Person has been on COBRA thinking it protected them from penalties | Escalate -- COBRA is not creditable coverage for Medicare purposes. Calculate penalties, enroll immediately through any available window, and check if employer coverage (not COBRA) triggers an SEP |
| PLAN MATCH | Preferred doctor doesn't accept Medicare at all | Adjust -- rare but happens. Check if doctor will see them as a private-pay patient and what that costs vs. switching doctors. Some concierge/direct primary care doctors work alongside Medicare |
| PLAN MATCH | Critical medication not on any formulary | Adjust -- request a formulary exception from the plan (doctor must provide medical justification). Check manufacturer patient assistance programs. Explore therapeutic alternatives with the prescribing doctor |
| ENROLLMENT | Application is rejected or delayed | Escalate -- contact Medicare directly at 1-800-MEDICARE. If it's a paperwork issue, request expedited processing. If it's eligibility-related, contact Social Security. Document everything in writing |
| OPTIMIZE | Claim denied for expensive procedure | Escalate -- file appeal within 60 days. Request expedited review if health is at risk. Contact State Health Insurance Assistance Program (SHIP) for free counseling -- every state has one |

## State Persistence
- Medicare enrollment status (which parts active, plan names, effective dates)
- Doctor network verification results (last checked date, in-network status)
- Medication formulary status (drug, plan, tier, any restrictions, last verified)
- Premium and cost tracking (what you're paying vs. what you budgeted)
- Enrollment deadline history (what was done, when, confirmation numbers)
- Appeal history (what was denied, appeal status, outcomes)
- Annual plan comparison results (what was considered, what was chosen, why)
- Income-based premium adjustment tracking (IRMAA status, Life-Changing Event filings)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
