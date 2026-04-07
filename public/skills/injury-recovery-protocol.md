# Injury Recovery Protocol

Gives you a structured plan for recovering from common sports and fitness injuries -- the kind that don't need surgery but do need more than "just rest." Covers identifying what you actually hurt, building a PT-style exercise progression, figuring out when you're ready to return to your sport, and preventing the same injury from coming back. Not a replacement for seeing a doctor when you need one. But for the sprains, strains, tendinitis, and overuse injuries that make up 80% of athletic injuries, this gets you from hurt to healed without guessing or Googling yourself into panic.

## Execution Pattern: Phase Pipeline

```
PHASE 1: IDENTIFY     --> Figure out what's injured and how badly
PHASE 2: PROTECT      --> Manage acute symptoms and prevent further damage
PHASE 3: REBUILD      --> Progressive exercise protocol to restore function
PHASE 4: RETURN       --> Graduated return-to-sport with objective benchmarks
PHASE 5: PREVENT      --> Address root causes so it doesn't happen again
```

## Inputs
- injury_description: object -- What happened, where it hurts, when it started, how it happened (sudden vs. gradual), current pain level (1-10), what makes it better/worse, any swelling/bruising/instability
- activity_context: object -- What sport or activity you were doing, training volume/intensity when it happened, any recent changes in training (new shoes, increased mileage, new movement)
- medical_history: object -- Previous injuries to the same area, surgeries, chronic conditions, current medications, whether you've seen a doctor for this injury
- recovery_goals: object -- What you want to get back to (specific sport, fitness level, daily activities), timeline pressure (upcoming event, season start), acceptable outcome (full return vs. modified activity)
- resources: object -- (Optional) Access to a physical therapist, gym equipment, pool, foam roller, resistance bands. Insurance coverage for PT visits

## Outputs
- injury_assessment: object -- Likely injury type, severity grade, expected recovery timeline, and red flags that mean "see a doctor now"
- acute_management: object -- First 48-72 hour protocol with specific actions, dos and don'ts
- exercise_progression: object -- Phase-by-phase rehab exercises with sets, reps, frequency, and advancement criteria
- return_to_sport_plan: object -- Graduated activity protocol with objective benchmarks at each stage
- prevention_program: object -- Root cause analysis and long-term exercises/modifications to prevent recurrence

## Execution

### Phase 1: IDENTIFY
**Entry criteria:** Person has pain, injury, or limitation from physical activity.
**Actions:**
1. Classify the injury mechanism:
   - **Acute traumatic:** Sudden onset during activity -- rolled ankle, felt a pop, fell and hit something, collision. Usually sprains, strains, or fractures.
   - **Acute on chronic:** Sudden worsening of something that's been nagging. The Achilles tendon that's been tight for weeks and now has sharp pain.
   - **Overuse:** Gradual onset with no specific incident. Gets worse with activity, may be fine at rest. Tendinitis, stress reactions, bursitis.
   Each type has a different recovery approach. Acute injuries need protection first. Overuse injuries need load management and root cause analysis.
2. Identify the likely structure involved:
   - **Muscle:** Pain during contraction or stretch, possibly with bruising. Common: hamstring strain, calf strain, quad strain.
   - **Tendon:** Pain at the muscle-bone junction, worse with load, may be stiff in the morning. Common: Achilles tendinopathy, patellar tendinitis, rotator cuff tendinopathy.
   - **Ligament:** Pain at the joint, possibly with instability or feeling of "giving way." Common: ankle sprain, ACL/MCL injury, wrist sprain.
   - **Bone:** Deep, localized pain that worsens with impact. Tender to direct pressure on the bone. Common: stress fractures (shin, foot, hip).
   - **Joint/cartilage:** Pain inside the joint, catching or locking, swelling within the joint. Common: meniscus tears, labral tears, cartilage damage.
3. Grade the severity:
   - **Grade 1 (Mild):** Pain but full function. Can still do most activities with discomfort. Minimal swelling. Recovery: 1-3 weeks.
   - **Grade 2 (Moderate):** Significant pain and reduced function. Some swelling, possible bruising. Can't do the activity that caused it. Recovery: 3-8 weeks.
   - **Grade 3 (Severe):** Unable to use the affected area. Significant swelling/bruising. Possible instability. Recovery: 8+ weeks, may need medical imaging and professional care.
4. Check for red flags that require immediate medical evaluation:
   - Visible deformity (bone looks wrong)
   - Can't bear weight at all on a leg injury
   - Numbness or tingling below the injury
   - Rapid, significant swelling (within minutes)
   - Heard a loud pop with immediate loss of function
   - Pain that's getting worse despite rest and basic care
   - Suspected stress fracture (deep bone pain with impact)
   If any red flag is present: stop the protocol and see a sports medicine doctor or go to urgent care.
5. Set realistic recovery expectations based on the injury type and grade. Under-promising and over-delivering beats the reverse. A grade 2 ankle sprain takes 4-6 weeks to return to sport, not the "I'll be fine by next week" most people assume.

**Output:** Injury classification (mechanism, structure, grade), recovery timeline estimate, red flag screening results, and referral recommendation if needed.
**Quality gate:** Injury mechanism is categorized. Specific structure is identified (not just "my knee hurts"). Red flags are explicitly checked. Timeline is based on injury grade, not wishful thinking.

### Phase 2: PROTECT
**Entry criteria:** Injury identified, red flags screened, severity is Grade 1 or 2 (Grade 3 should be under medical supervision).
**Actions:**
1. Apply the PEACE protocol for the first 48-72 hours (this replaced RICE):
   - **P - Protect:** Avoid activities that increase pain. Use crutches, brace, or sling if needed. This isn't permanent -- just the first few days.
   - **E - Elevate:** Raise the injured area above heart level when possible. Helps reduce swelling through gravity.
   - **A - Avoid anti-inflammatories:** Controversial but evidence-based. Inflammation is part of healing. Avoid NSAIDs (ibuprofen) for the first 48 hours unless pain is unmanageable. Ice is fine for pain relief but isn't accelerating healing.
   - **C - Compress:** Wrap with an elastic bandage to manage swelling. Snug but not tight -- if you feel numbness or throbbing, it's too tight.
   - **E - Educate:** Understand that recovery takes time and early loading (not rest) is usually better than complete immobilization.
2. Pain management that doesn't undermine healing:
   - Ice: 15-20 minutes on, 40 minutes off. Good for pain relief and swelling management. Don't ice directly on skin.
   - Acetaminophen (Tylenol) for pain if needed -- it doesn't interfere with inflammation the way NSAIDs do.
   - Gentle movement within pain-free range. A completely immobilized joint heals slower than one that's gently moved.
3. After the first 72 hours, transition to the LOVE protocol:
   - **L - Load:** Begin gentle, pain-guided loading. Walk on a sprained ankle if you can tolerate it. Move a strained muscle through its range.
   - **O - Optimism:** Sounds soft, but research shows that people who expect to recover fully actually recover faster. Catastrophizing slows healing measurably.
   - **V - Vascularization:** Get blood flowing to the area with gentle cardiovascular exercise that doesn't stress the injury. Pool walking, cycling, upper body work for leg injuries.
   - **E - Exercise:** Begin the early-stage rehab exercises (Phase 3).
4. Define the "loading boundary": what you can do without increasing pain. The rule of thumb: activity that keeps pain at or below 3/10 during and doesn't cause increased pain the next morning. If it does, you did too much. Scale back.
5. Maintain fitness without aggravating the injury. Runners with ankle sprains can cycle or swim. Lifters with shoulder injuries can do lower body work. Staying active during recovery maintains mental health and cardiovascular fitness, and speeds return to sport.

**Output:** 72-hour acute management protocol, pain management strategy, loading boundary definition, and cross-training options.
**Quality gate:** PEACE protocol is specific with timing and methods. Loading boundary is defined with clear "too much" indicators. Cross-training maintains fitness without stressing the injury. NSAIDs guidance is evidence-based.

### Phase 3: REBUILD
**Entry criteria:** Acute phase passed (72+ hours), pain is decreasing, ready for progressive loading.
**Actions:**
1. Design the exercise progression in three stages:
   - **Stage 1 (Early rehab):** Isometric exercises (muscle contraction without movement). These reduce pain and begin tendon/muscle loading safely. Example for knee: wall sit holds, straight-leg raises. Example for ankle: towel scrunches, alphabet tracing with foot. Hold for 30-45 seconds, 3-5 reps, 2x daily.
   - **Stage 2 (Mid rehab):** Isotonic exercises (movement through range against gravity or light resistance). Eccentric (lowering) emphasis -- this is where tendons rebuild strongest. Example for Achilles: slow heel drops off a step. Example for shoulder: slow-lowering dumbbell raises. 3 sets of 10-15 reps, daily.
   - **Stage 3 (Late rehab):** Functional exercises that mimic your sport. Plyometrics, direction changes, sport-specific movements at submaximal effort. Example for runners: single-leg hops, lateral bounds. Example for lifters: the injured movement pattern at 50% then 70% then 85% of normal weight.
2. Define advancement criteria between stages. Don't advance by calendar -- advance by function:
   - Stage 1 to Stage 2: Can perform isometrics pain-free. Swelling is minimal. Range of motion is at least 75% of normal.
   - Stage 2 to Stage 3: Full range of motion. Strength is at least 70% of uninjured side. Can perform exercises without compensating (limping, shifting weight, guarding).
   - Stage 3 to Return: Strength at 90%+ of uninjured side. Can perform sport-specific movements at full speed without pain or hesitation.
3. Address flexibility and range of motion alongside strength. Gentle stretching after warm-up (not before), joint mobilization exercises, and foam rolling of surrounding muscles (not directly on the injury site in early stages).
4. Monitor the response to exercise using the "next morning" test: if pain or swelling is worse the morning after an exercise session than it was the morning before, you did too much. Drop the intensity or volume by 25% and try again.
5. If progress stalls for 2+ weeks despite consistent exercise, something is wrong. Either the diagnosis needs updating (missed a more severe injury), the exercises need modification, or there's a biomechanical issue that rehab alone won't fix. This is when to see a physical therapist if you haven't already.

**Output:** Three-stage exercise progression with specific exercises, sets, reps, and frequency for the identified injury. Advancement criteria between stages. Troubleshooting guidance for stalled progress.
**Quality gate:** Exercises are specific to the injured structure (not generic "rehab exercises"). Advancement is based on function, not time. The "next morning" test is used for load management. Stalled progress has a clear escalation path.

### Phase 4: RETURN
**Entry criteria:** Late-stage rehab exercises completed with pain-free sport-specific movement.
**Actions:**
1. Build the graduated return-to-sport protocol. This is not "I feel better, so I'm going 100%." That's how re-injury happens. Instead:
   - **Week 1:** 50% of normal volume/intensity. If you normally run 30 miles/week, run 15. If you normally squat 300lbs, squat 150.
   - **Week 2:** 70% of normal volume/intensity.
   - **Week 3:** 85% of normal volume/intensity.
   - **Week 4:** Full activity with monitoring.
   If any stage increases pain above 3/10 during or the next morning, stay at that level for another week before advancing.
2. Establish objective return-to-sport benchmarks:
   - **Strength:** Within 90% of uninjured side (test with single-leg press, grip strength, or specific movement)
   - **Range of motion:** Full and equal bilaterally
   - **Functional tests:** Single-leg hop for distance (within 90% of other side), Y-balance test, sport-specific movement screen
   - **Confidence:** Can perform the movement that caused the injury without hesitation or guarding. Psychological readiness matters as much as physical.
3. Plan the first few return sessions specifically:
   - First session: controlled environment, low stakes, focus on movement quality not performance
   - Avoid competition or high-intensity for the first 2 weeks
   - Have a bail-out plan: if something feels wrong during the session, you stop. No negotiation.
4. Maintain rehab exercises during the return phase. The exercises that got you here don't stop when you return to sport. Keep the strength and mobility work in your routine at reduced frequency (2-3x/week instead of daily) for at least 4-6 weeks after full return.
5. Track symptoms for 4 weeks post-return. Log pain levels (before, during, after activity), any swelling, and functional quality. If symptoms are trending up, pause and reassess. If they're stable or decreasing, you're clear.

**Output:** Week-by-week return-to-sport protocol, objective benchmarks for each stage, first-session plan, ongoing maintenance exercise schedule, and 4-week monitoring log.
**Quality gate:** Return is graduated (not binary). Benchmarks are objective and measurable. Maintenance exercises continue post-return. Monitoring period catches late regression.

### Phase 5: PREVENT
**Entry criteria:** Successfully returned to sport with stable symptoms.
**Actions:**
1. Conduct a root cause analysis. Why did this injury happen?
   - **Training error:** Too much, too fast, too soon. Increasing volume or intensity beyond the body's adaptation rate. Most common cause of overuse injuries.
   - **Biomechanical issue:** Weakness, imbalance, or movement pattern flaw that overloads the injured structure. Weak glutes causing knee valgus, tight hip flexors causing back strain.
   - **Equipment:** Worn-out shoes, improper bike fit, wrong racquet grip size, bad desk ergonomics.
   - **Recovery deficit:** Inadequate sleep, poor nutrition, high life stress, not enough rest days.
   Usually it's a combination. Identify the top 2-3 contributing factors.
2. Build a long-term prevention program targeting the root causes:
   - If training error: create a progressive loading plan with built-in recovery weeks and hard ceilings on weekly volume increases
   - If biomechanical: ongoing strength and mobility exercises (the rehab exercises that worked -- keep doing a maintenance version forever)
   - If equipment: replace, adjust, or upgrade the specific item
   - If recovery: address sleep, nutrition, and rest day scheduling
3. Create a "body check" routine: a 5-minute pre-training self-assessment.
   - Any lingering soreness from last session?
   - Full range of motion in the previously injured area?
   - Energy level and sleep quality (training hard on poor sleep is an injury risk)
   - If anything flags, modify today's training rather than pushing through.
4. Set up a maintenance exercise schedule: 2-3 sessions per week of targeted strength and mobility for the previously injured area. This takes 15-20 minutes. Think of it like brushing your teeth -- boring but non-negotiable because the alternative is painful and expensive.
5. Know the early warning signs specific to your injury. Every injury type has a recognizable early-stage pattern. Document what yours felt like at the very beginning. When you feel that again, implement Phase 2 immediately instead of waiting until it's a full injury again. Catching it early makes it a 3-day setback instead of a 6-week rehab.

**Output:** Root cause analysis, long-term prevention program, pre-training body check routine, maintenance exercise schedule, and early warning sign list.
**Quality gate:** Root causes are specific and actionable (not "be more careful"). Prevention exercises target the identified weaknesses. Early warning signs are documented from the actual injury experience. Maintenance is realistic and sustainable.

## Exit Criteria
Done when: (1) injury is identified with type, structure, and severity grade, (2) acute management protocol covers the first 72 hours, (3) three-stage exercise progression exists with advancement criteria, (4) return-to-sport protocol has objective benchmarks and graduated loading, (5) prevention program addresses root causes with ongoing maintenance.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| IDENTIFY | Can't determine injury type from symptoms | Adjust -- when in doubt, treat conservatively (as if it's the more serious possibility) and get professional imaging (X-ray, MRI) if symptoms persist beyond 2 weeks |
| IDENTIFY | Red flags are present | Escalate -- stop the protocol. This needs medical evaluation. Possible fracture, complete tear, or nerve damage requires imaging and professional diagnosis |
| PROTECT | Pain is not improving after 72 hours of PEACE protocol | Adjust -- re-evaluate the severity grade. May be more severe than initially assessed. If pain is same or worse at 72 hours, see a sports medicine doctor |
| REBUILD | Exercises cause increased pain | Adjust -- drop back one stage. If Stage 2 exercises hurt, return to Stage 1 until they don't. If Stage 1 exercises hurt, the injury needs more rest or professional evaluation |
| REBUILD | Progress plateaus for 2+ weeks | Adjust -- something is missing. Common culprits: the exercises aren't targeting the right structure, there's a secondary injury, or a biomechanical issue is preventing healing. See a PT for assessment |
| RETURN | Re-injury occurs during return to sport | Adjust -- back to Phase 2. Re-evaluate: was the return too aggressive? Were the benchmarks actually met? Was there a root cause not addressed? Adjust the prevention plan before returning again |
| PREVENT | Person doesn't maintain prevention exercises | Adjust -- simplify. If 20 minutes 3x/week isn't happening, find the 3 most important exercises and do them in 5-10 minutes. Some prevention beats no prevention |

## State Persistence
- Injury log (type, date, severity, mechanism, recovery timeline for each injury)
- Exercise progression tracking (current stage, exercises, advancement dates)
- Pain and function monitoring (daily or session-based tracking)
- Return-to-sport benchmarks and test results
- Prevention program exercises and adherence
- Root cause analysis findings (to look for patterns across injuries)
- Provider contacts (sports medicine doctor, physical therapist, massage therapist)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
