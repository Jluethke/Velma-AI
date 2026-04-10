# Medication Tracker

Helps people manage multiple medications, supplements, and refill schedules. Takes a list of medications with dosages and frequencies, builds a personalized daily schedule with timing guidance, tracks when refills are due, flags potentially dangerous drug interactions, and generates a clean medication summary card to bring to doctor visits. Designed for people juggling 3 or more daily medications who lose track of what to take when -- especially older adults managing chronic conditions, post-surgical recovery, or complex vitamin regimens. Uses plain language throughout, avoids medical jargon, and prioritizes safety above all else.

## Execution Pattern: ORPA Loop

## Inputs
- medications: array -- Each entry includes: drug name (brand or generic), dosage (e.g., "50mg"), frequency ("twice a day," "every morning"), prescribing doctor (optional), pharmacy (optional), what it's for in plain language (e.g., "blood pressure")
- supplements: array -- (Optional) Vitamins, herbal supplements, OTC medications taken regularly (e.g., "fish oil 1000mg," "Tylenol as needed")
- meal_schedule: object -- (Optional) Approximate meal times -- some medications must be taken with food or on an empty stomach
- pharmacy_info: object -- (Optional) Pharmacy name, phone number, whether they offer auto-refill or delivery
- concerns: array -- (Optional) Any known allergies, past bad reactions, trouble swallowing pills, cost concerns

## Outputs
- daily_schedule: object -- Hour-by-hour medication schedule organized by morning, midday, evening, bedtime, with food/empty-stomach notes
- refill_calendar: object -- When each prescription needs to be refilled, with lead time so you never run out
- interaction_flags: array -- Any potentially dangerous combinations flagged with severity level and plain-language explanation
- doctor_card: object -- One-page medication summary formatted for printing or showing on a phone at appointments
- simplification_suggestions: array -- (Optional) Ideas to reduce pill burden: medications that could be combined, doses that could be synchronized

## Execution

### OBSERVE: Gather the Full Picture
**Entry criteria:** At least one medication with name and dosage provided.
**Actions:**
1. List every medication and supplement with its name, dosage, frequency, and purpose. If the user gives a brand name, note the generic equivalent (and vice versa) so there is no confusion at the pharmacy.
2. Ask clarifying questions for anything incomplete: "You mentioned lisinopril -- do you know the dosage? Is it once a day or twice?" Keep questions simple and conversational.
3. Note timing requirements for each medication: must be taken with food, on an empty stomach, at bedtime, away from certain other drugs, or at a specific time (e.g., thyroid medication 30-60 minutes before eating).
4. Record refill information: how many pills per bottle, date last filled, days supply. If the user does not know, estimate based on standard dispensing (typically 30 or 90 days).
5. Note any concerns: difficulty swallowing (suggest asking doctor about liquid or crushable forms), cost issues (suggest asking about generics), side effects the user has noticed.

**Output:** Complete medication inventory with dosages, frequencies, timing constraints, refill status, and user concerns.
**Quality gate:** Every medication has a name and dosage. Timing constraints (food, empty stomach, spacing) are identified for each drug. No medication is listed without its purpose -- if unknown, flag for the user to ask their doctor.

### REASON: Build the Schedule and Check Safety
**Entry criteria:** Medication inventory is complete.
**Actions:**
1. Check for known drug interactions across all medications and supplements. Flag three severity levels:
   - **Serious (red):** Combinations that can cause dangerous effects (e.g., certain blood thinners with NSAIDs, multiple serotonin-affecting drugs). These get a prominent warning: "Talk to your doctor before taking these together."
   - **Moderate (yellow):** Combinations that may reduce effectiveness or increase side effects (e.g., calcium supplements interfering with thyroid medication absorption). Include timing workaround if possible: "Take these at least 4 hours apart."
   - **Minor (gray):** Low-risk interactions worth knowing about but not urgent.
2. Build time blocks around the user's meal schedule and daily routine:
   - **Morning (wake-up):** Medications that must be taken on an empty stomach (thyroid, certain osteoporosis drugs).
   - **With breakfast:** Medications that should be taken with food.
   - **Midday/lunch:** Twice-daily medications due for their second dose.
   - **Evening/dinner:** Medications that are taken with the evening meal.
   - **Bedtime:** Medications that cause drowsiness or are specified for nighttime.
3. Space medications that interact or interfere with each other's absorption. Calcium and iron should be separated from many other drugs by 2-4 hours.
4. Identify refill dates by calculating remaining supply. Add a 5-day lead time so the user calls the pharmacy before running out, not after.
5. Look for simplification opportunities: two medications from the same class that might be consolidated, doses that could be moved to the same time of day (ask the doctor), or supplements with weak evidence that could be dropped.

**Output:** Daily schedule with time blocks, interaction report with severity levels, refill timeline, simplification suggestions.
**Quality gate:** No serious interactions left unaddressed -- each one has a clear action item. No two medications that need spacing are scheduled at the same time. Refill dates include lead time.

### PLAN: Format for Daily Use
**Entry criteria:** Schedule and safety checks complete.
**Actions:**
1. Organize the daily schedule into a simple, readable format anyone can follow:
   - Use clock times, not medical shorthand ("8:00 AM" not "q.d." or "BID").
   - Group by time of day with clear headers: "When you wake up," "With breakfast," "Lunchtime," "With dinner," "Before bed."
   - For each time block: list the medication name, dosage, number of pills, and any special note ("take with a full glass of water," "do not crush").
2. Create the refill calendar as a simple list sorted by next refill date:
   - Medication name, pharmacy, last filled date, estimated run-out date, "call pharmacy by" date.
   - Highlight any that are due within the next 7 days.
3. Build the doctor card -- a single-page summary containing:
   - Patient name (if provided), date generated.
   - Full medication list: name, dosage, frequency, prescribing doctor, purpose.
   - Supplement list with dosages.
   - Known allergies or past bad reactions.
   - Format for easy reading: table layout, large-ish text, no abbreviations.
4. Write all interaction warnings in plain language: "Your blood thinner (warfarin) and your pain reliever (ibuprofen) can increase bleeding risk when taken together. Ask your doctor if acetaminophen (Tylenol) would be a safer option for pain."

**Output:** Formatted daily schedule, refill calendar, doctor card, plain-language interaction warnings.
**Quality gate:** A non-medical person can read the schedule and know exactly what to take and when. The doctor card fits on one page. All warnings use everyday words.

### ACT: Deliver and Support Ongoing Use
**Entry criteria:** All documents are formatted and validated.
**Actions:**
1. Present the daily schedule first -- this is what the user needs most. Walk through each time block briefly.
2. Present interaction flags prominently. For any serious interactions, repeat the recommendation to discuss with their doctor. Do not minimize these.
3. Deliver the refill calendar with the soonest refill highlighted.
4. Deliver the doctor card and suggest printing it or saving it to their phone's photo gallery for easy access.
5. Offer reminders for common pitfalls:
   - "If you miss a dose, take it as soon as you remember unless it's close to your next dose -- then skip the missed one. Never double up."
   - "Keep a backup list in your wallet in case of emergency."
   - "When you start a new medication, bring this card to the pharmacy so they can check for interactions."
6. If re-entering the loop with updates (new medication added, one discontinued), regenerate the full schedule and re-check all interactions from scratch.

**Output:** Complete medication management package delivered. Ongoing support notes provided.
**Quality gate:** User has a clear daily schedule, knows about any interactions, has refill dates tracked, and has a doctor-ready summary card.

## Exit Criteria
Done when: (1) every medication and supplement is accounted for in the daily schedule, (2) all drug interactions are identified and explained in plain language, (3) refill dates are calculated with lead time, (4) a doctor card is generated, (5) the user understands any serious warnings.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User cannot remember dosage or frequency | Adjust -- use common default dosages as placeholder, flag with "VERIFY WITH YOUR PHARMACIST" in bold |
| OBSERVE | Medication name is misspelled or ambiguous | Adjust -- suggest likely matches ("Did you mean metformin or metoprolol?"), do not guess |
| REASON | Serious drug interaction detected | Escalate -- present warning prominently, recommend calling prescribing doctor before next dose, never suggest stopping a medication |
| REASON | Cannot determine if supplement interacts with prescription | Flag -- note the uncertainty, recommend mentioning the supplement to the pharmacist |
| PLAN | Too many medications for simple time blocks | Adjust -- split into a morning routine and evening routine with numbered steps |
| ACT | User wants to stop a medication based on interaction info | Escalate -- strongly advise against stopping any prescription without doctor approval, explain that this tool provides information, not medical advice |
| ACT | User rejects final output | Targeted revision -- ask which section fell short (schedule timing, interaction flags, refill calendar, or doctor card format) and rerun only that section. Do not regenerate the full tracker. |

## Important Disclaimers
This skill provides organizational support for medication management. It is NOT a substitute for professional medical advice, diagnosis, or treatment. Drug interaction information is general and may not account for your specific health conditions. Always consult your doctor or pharmacist before making changes to your medication regimen. Never stop, start, or change the dose of a medication based solely on information from this tool.

## State Persistence
- Medication list with dosages, frequencies, and purposes
- Refill history and upcoming refill dates
- Known interactions already discussed with doctor (cleared flags)
- Doctor card version history (track when medications were added or removed)
- User preferences: preferred pharmacy, medication format (pill vs liquid), time zone for scheduling

## Reference

### Common Medication Timing Requirements

| Medication Type | Timing Rule | Why |
|---|---|---|
| Thyroid medications (levothyroxine) | 30-60 min before eating | Food impairs absorption |
| Bisphosphonates (alendronate for bone) | 30 min before breakfast; remain upright | Esophageal irritation if lying down |
| Metformin (diabetes) | With meals | Reduces nausea |
| Iron supplements | On empty stomach or 1 hr before meals | Best absorption; away from calcium |
| Statins (cholesterol) | Evening preferred | Cholesterol synthesis peaks at night |
| ACE inhibitors (lisinopril) | Consistent time daily; OK with food | Timing consistency matters more than fasting |
| Proton pump inhibitors (omeprazole) | 30-60 min before meals | Must activate before acid is produced |

### Common Drug-Supplement Interactions

| Combination | Risk | Workaround |
|---|---|---|
| Warfarin + fish oil / vitamin E | Increased bleeding risk | Discuss dose with doctor |
| Thyroid meds + calcium or iron | Reduced absorption | Space 4+ hours apart |
| SSRIs + St. John's Wort | Serotonin syndrome risk | Avoid combination |
| ACE inhibitors + potassium supplements | Dangerous potassium levels | Avoid; discuss with doctor |
| Blood thinners + NSAIDs (ibuprofen) | Increased bleeding | Use acetaminophen instead |
| Statins + grapefruit | Increased statin concentration | Avoid grapefruit with many statins |

### Refill Lead Time Formula

Refill date = (Fill date + days supply) - 5 days lead time

Example: Filled Jan 1, 30-day supply → Refill date = Jan 26

Always call pharmacy at least 5 days before running out. Auto-refill enrollment eliminates this risk.

### Doctor Card Required Fields

Patient name, date generated, medication name, dosage, frequency, prescribing doctor, purpose (plain language), known allergies, supplements with dosages

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.