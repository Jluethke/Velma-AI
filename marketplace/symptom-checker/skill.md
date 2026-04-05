# Symptom Checker

Takes plain-language descriptions of how someone feels ("my knee hurts when I go up stairs and it's swollen," "I've had a headache for three days and I feel dizzy"), asks targeted clarifying questions to narrow things down, suggests possible causes ranked by likelihood, recommends the appropriate level of care (wait and monitor, schedule a doctor visit, go to urgent care, or call 911), and prepares a clear symptom summary to bring to the appointment. Designed to help people who are not sure whether their symptoms are "worth calling the doctor about" and who want to walk into an appointment prepared, not panicked. Uses everyday language, never medical jargon without explanation.

**THIS TOOL IS NOT A DOCTOR. IT DOES NOT DIAGNOSE. IT DOES NOT REPLACE MEDICAL CARE. SEE FULL DISCLAIMERS BELOW.**

## Execution Pattern: ORPA Loop

## Inputs
- symptoms: array -- Plain-language descriptions of what the person is experiencing. Can be vague ("I don't feel right") or specific ("sharp pain in my lower right abdomen that started 6 hours ago")
- duration: string -- How long symptoms have been present ("since yesterday," "about 2 weeks," "just started an hour ago")
- severity: string -- Self-rated severity ("mild annoyance," "can't ignore it," "worst pain I've ever felt")
- context: object -- (Optional) Age range, biological sex (relevant for some conditions), relevant medical history (diabetes, heart disease, recent surgery), current medications, recent activities or events (travel, new food, injury, stress)
- what_tried: array -- (Optional) What they have already tried ("took ibuprofen, didn't help," "rested for two days, still hurts," "iced it")

## Outputs
- clarifying_questions: array -- Targeted follow-up questions to narrow the differential (only asked when needed, not an interrogation)
- possible_causes: array -- Ranked list of plausible explanations with plain-language descriptions, from most likely to less likely
- care_recommendation: object -- Recommended level of care with reasoning: self-care at home, schedule doctor appointment, visit urgent care today, or go to ER / call 911
- appointment_summary: object -- Pre-written symptom summary to show the doctor, organized and complete
- self_care_guidance: object -- (If appropriate) What to do at home while waiting for an appointment or monitoring symptoms

## Execution

### OBSERVE: Listen and Understand
**Entry criteria:** At least one symptom described in any level of detail.
**Actions:**
1. Parse the symptom description without judgment. Accept vague descriptions ("something feels off") as valid starting points. Never dismiss or minimize.
2. Identify what is known vs. what needs clarification. For each symptom, try to establish:
   - **Location:** Where exactly? ("knee" is good, "leg" needs narrowing)
   - **Character:** What does it feel like? (sharp, dull, burning, throbbing, pressure, tingling)
   - **Timing:** When did it start? Constant or comes and goes? Getting better, worse, or staying the same?
   - **Triggers:** What makes it worse? What makes it better? Does it happen after specific activities?
   - **Associated symptoms:** Anything else happening at the same time? (fever, nausea, fatigue, swelling, redness, numbness)
3. Generate clarifying questions -- but only the ones that will actually change the assessment. Limit to 3-5 questions maximum. No one wants to answer 20 questions when they feel bad.
4. Note any red-flag symptoms that require immediate attention regardless of other context:
   - Chest pain or pressure with shortness of breath
   - Sudden severe headache ("worst headache of my life")
   - Sudden numbness or weakness on one side of the body
   - Difficulty breathing or speaking
   - Uncontrolled bleeding
   - Signs of allergic reaction (throat swelling, difficulty swallowing)
   - High fever (over 103F/39.4C) that is not responding to medication

**Output:** Parsed symptom profile, list of clarifying questions (if needed), any red-flag alerts.
**Quality gate:** Red-flag symptoms are identified immediately and trigger an urgent care recommendation before continuing. Clarifying questions are specific and limited to what matters.

### REASON: Evaluate Possible Causes
**Entry criteria:** Symptom profile is sufficiently detailed (either from initial description or after clarifying questions are answered).
**Actions:**
1. Generate a ranked list of possible causes, from most common/likely to less common. For each possible cause:
   - **Name:** Use the common name first, medical term in parentheses if helpful. "Tennis elbow (lateral epicondylitis)" not "lateral epicondylitis."
   - **Why it fits:** Which of the user's symptoms match this cause. "Your knee pain going up stairs plus the swelling is typical of..."
   - **What would make it less likely:** Factors that argue against this cause.
   - **Typical course:** What usually happens -- does it resolve on its own, does it need treatment, how long does recovery take?
2. Limit the list to 3-5 most plausible causes. Do not overwhelm with rare possibilities. If a rare but serious condition is possible, include it but clearly label it as "less likely but worth ruling out."
3. For each cause, note what a doctor would typically do to confirm or rule it out (physical exam, X-ray, blood test, etc.) so the user knows what to expect at the appointment.
4. Determine the recommended level of care:
   - **Self-care at home:** Symptoms are mild, common, and self-limiting. Provide monitoring instructions and "go to the doctor if" thresholds.
   - **Schedule a doctor appointment (this week):** Symptoms warrant professional evaluation but are not urgent. Nothing dangerous is likely happening right now.
   - **Visit urgent care (today):** Symptoms need same-day evaluation but are not life-threatening. Waiting for a regular appointment is not ideal.
   - **Emergency room / call 911:** Red-flag symptoms are present, or the combination of symptoms suggests something that needs immediate intervention.

**Output:** Ranked possible causes with plain-language explanations, care level recommendation with reasoning.
**Quality gate:** The most likely cause is listed first. Serious conditions that need ruling out are included even if unlikely. The care recommendation matches the severity. No cause is presented as a definitive diagnosis.

### PLAN: Prepare for the Appointment
**Entry criteria:** Possible causes and care recommendation are determined.
**Actions:**
1. Build the appointment summary card. This is the single most useful thing the skill produces. Format it so the user can show it to a doctor on their phone or print it. Include:
   - **Main complaint:** One-sentence summary ("Right knee pain and swelling for 2 weeks, worse going up stairs").
   - **Symptom timeline:** When it started, how it has changed, any pattern.
   - **What makes it better/worse:** Specific triggers and relief measures.
   - **What you have tried:** Medications, rest, ice, etc. and whether they helped.
   - **Other symptoms:** Anything else happening, even if it seems unrelated.
   - **Current medications:** (If provided) Full list.
   - **Relevant history:** (If provided) Past injuries, surgeries, chronic conditions.
   - **Questions to ask the doctor:** 2-3 suggested questions based on the possible causes ("Could this be related to my diabetes?" "Should I get imaging?" "Is physical therapy an option?").
2. Write self-care guidance for the interim (between now and the appointment):
   - What is safe to take for symptom relief (and what to avoid).
   - Activity modifications ("avoid stairs if possible, use the elevator").
   - Warning signs that mean "stop waiting and go to urgent care/ER now."
3. If the recommendation is self-care at home, provide a clear monitoring plan: what to watch for, how long to give it, and specific thresholds that should trigger a doctor visit ("if it's not improving after 5 days," "if you develop a fever above 100.4F").

**Output:** Appointment summary card, self-care guidance, monitoring plan (if applicable).
**Quality gate:** The appointment summary is concise enough to read in 60 seconds. Self-care advice does not contradict any known medications. Warning signs for escalation are specific, not vague.

### ACT: Deliver with Appropriate Context
**Entry criteria:** All outputs are prepared.
**Actions:**
1. If red-flag symptoms were detected, lead with the urgent recommendation. Do not bury it after a list of possible causes. "Based on what you described, I recommend going to urgent care today. Here's why..."
2. Present possible causes clearly, with the most likely first. Use reassuring but honest framing: "The most common cause of what you're describing is X, which is very treatable."
3. For each cause, be clear about what it is NOT: "This is not a diagnosis. Only a doctor can determine what's causing your symptoms after examining you."
4. Deliver the appointment summary card and explain how to use it: "Show this to your doctor at the start of the visit. It saves time and makes sure nothing gets forgotten."
5. Provide the self-care guidance with clear boundaries: "These are things you can do while you wait for your appointment. If anything changes -- especially [specific warning signs] -- don't wait, go to urgent care."
6. Close with the disclaimer. Every single time.

**Output:** Complete symptom assessment package with care recommendation, possible causes, appointment summary, and self-care guidance.
**Quality gate:** Disclaimers are prominent. No language suggests certainty of diagnosis. Urgent situations are flagged immediately. The tone is calm, helpful, and respectful.

## Exit Criteria
Done when: (1) symptoms are documented and organized, (2) possible causes are presented with appropriate uncertainty, (3) a care-level recommendation is made with reasoning, (4) an appointment summary card is generated, (5) disclaimers are clearly stated.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Symptoms are extremely vague ("I just don't feel good") | Adjust -- ask 3 targeted questions: where does it feel wrong, how long, and what is different from your normal? |
| OBSERVE | Red-flag symptoms detected | Escalate immediately -- skip to care recommendation, advise ER or 911, do not continue with differential |
| OBSERVE | User describes symptoms in a child under 2 | Escalate -- recommend calling the pediatrician immediately; infant symptoms have different thresholds |
| REASON | Symptoms do not clearly match any common pattern | Adjust -- say so honestly: "Your combination of symptoms doesn't point to one obvious cause, which is exactly why seeing a doctor is the right call." Recommend appointment |
| REASON | User has multiple complex conditions that interact | Escalate -- recommend seeing their primary care doctor who knows their full history, rather than providing a generic assessment |
| PLAN | User says they cannot afford a doctor visit | Adjust -- provide information about community health centers, telehealth options, and urgent care vs ER cost differences. Still recommend care |
| ACT | User asks "so do I have X?" wanting a definitive answer | Redirect -- "I can't diagnose conditions. What I can tell you is that your symptoms are consistent with X, and a doctor can confirm with [test/exam]." |

## Prominent Disclaimers

**THIS IS NOT MEDICAL ADVICE.** This tool helps you organize your symptoms and prepare for a conversation with a healthcare professional. It does not diagnose, treat, or prescribe. The possible causes listed are educational suggestions based on common patterns, not a clinical assessment of your specific situation.

**THIS IS NOT A SUBSTITUTE FOR A DOCTOR.** If you are experiencing a medical emergency, call 911 (or your local emergency number) immediately. Do not use this tool to decide whether an emergency is "real enough" -- when in doubt, call.

**ALWAYS SEEK PROFESSIONAL CARE.** Even if this tool suggests self-care, you know your body best. If something feels seriously wrong, trust that instinct and see a doctor.

## State Persistence
- Symptom history (past entries with dates for tracking patterns over time)
- User health profile (age, known conditions, medications -- avoids re-entering every time)
- Past assessments and outcomes (if the user reports back: "doctor said it was X" -- improves future relevance)
- Red-flag history (symptoms that previously triggered urgent recommendations)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.