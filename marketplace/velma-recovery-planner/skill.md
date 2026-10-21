# the system Recovery Planner

You're sore, tired, or something hurts. This flow figures out whether you need to rest, do something light, or can actually train today with modifications. Assesses your soreness, sleep quality, stress level, recent training load, and nutrition to determine your recovery status. Then recommends the best course of action -- not just "take a rest day" but specifically what to do and how to get back to full training as fast as possible without making things worse. Not a replacement for medical advice if something is actually injured.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSESS       --> Map soreness, fatigue, sleep, and stress
PHASE 2: DIAGNOSE     --> Distinguish muscle soreness from injury warning signs
PHASE 3: PRESCRIBE    --> Rest, active recovery, or modified training
PHASE 4: RECOVER      --> Specific recovery protocol
PHASE 5: RETURN       --> Plan to get back to full training
```

## Inputs
- `symptoms`: object -- What you're feeling: sore muscles (which ones, severity 1-10), joint pain (which joints, sharp or dull), general fatigue level (1-10), any specific injury concerns (stiffness, swelling, decreased range of motion).
- `recent_training`: array -- Last 7 days of training: what was done, volume, intensity. This contextualizes whether the soreness makes sense given what was trained.
- `sleep_data`: object -- (Optional) Hours of sleep per night over the last 3-5 days. Quality rating (1-10: restless, broken, or deep).
- `stress_level`: object -- (Optional) Life stress rating (1-10), sources (work, family, financial, health). Stress directly impairs recovery.

## Outputs
- `recovery_assessment`: object -- Recovery status rating (1-10), contributing factors ranked by impact
- `day_recommendation`: string -- "full rest", "active recovery", "modified training", or "train as planned" with reasoning
- `recovery_protocol`: object -- Specific actions to accelerate recovery today
- `return_to_training_plan`: object -- When and how to resume full training

## Execution

### Phase 1: ASSESS
### Entry Criteria
Symptoms reported.
### Actions
1. Build a soreness map: which muscles are sore and at what level (1-10):
   - 1-3: mild, feel it during warmup but goes away. Normal DOMS (delayed onset muscle soreness).
   - 4-6: moderate, affects daily movement (hard to sit down, arms tired when reaching overhead). Usually peaks 24-48 hours post-training.
   - 7-8: severe, significantly limited range of motion. May indicate overtraining or inadequate recovery between sessions.
   - 9-10: extreme, sharp pain or inability to move normally. Possible injury. Flag for medical evaluation.
2. Check soreness timing: DOMS typically peaks at 24-72 hours after training and resolves by day 4-5. Soreness persisting beyond 5 days in the same muscle group is abnormal and may indicate:
   - Insufficient protein (below 0.6g per lb body weight)
   - Insufficient sleep (below 6 hours consistently)
   - Excessive volume for current fitness level
   - Actual tissue damage beyond normal micro-tears
3. Assess sleep deficit: calculate average sleep over the last 5 nights. Sleep debt accumulates:
   - 7-9 hours average: full recovery capacity
   - 6-7 hours: recovery impaired by ~20%
   - 5-6 hours: recovery impaired by ~40%
   - Below 5 hours: recovery severely impaired, training may cause more harm than good
4. Assess life stress: rate 1-10. High life stress (7+) impairs recovery as much as poor sleep. The body doesn't distinguish between types of stress -- cortisol from a bad day at work affects muscle recovery the same way.
5. Calculate a composite recovery score (1-10): weighted average of fatigue level, soreness severity, sleep quality, and stress level.

### Output
Soreness map, sleep deficit assessment, stress impact, composite recovery score.
### Quality Gate
Every reported symptom is cataloged. Soreness is rated by severity and timed relative to last training session. Recovery score calculated.

### Phase 2: DIAGNOSE
### Entry Criteria
Assessment complete.
### Actions
1. Cross-reference soreness with recent training: does the soreness match what was trained?
   - Quads sore after a squat session = expected DOMS
   - Shoulder pain after a leg session = not DOMS, investigate
   - Lower back pain after deadlifts = check form, may be normal, may be disc/muscle issue
2. Distinguish muscle soreness from injury warning signs:
   - **Normal DOMS:** diffuse ache across the muscle belly, improves with light movement, no swelling, symmetrical (both legs sore, not just one)
   - **Strain warning:** sharp pain in a specific spot, pain at rest, worsens with movement, swelling or bruising, unilateral (one side only)
   - **Joint issue:** pain IN the joint (not around it), clicking/catching, instability, swelling at the joint line, pain during specific ROM
   - **Tendon issue:** pain at muscle-tendon junction, worst at the beginning of movement (then warms up), gradually worsening over weeks
3. If injury warning signs are present:
   - Acute sharp pain, significant swelling, loss of function: recommend professional evaluation. Do not train through it.
   - Chronic nagging pain that's been worsening: recommend seeing a sports physiotherapist or orthopedic specialist.
   - Mild tendon irritation: usually manageable with load modification (covered in Phase 3).
4. If pure DOMS or general fatigue (no injury signs): proceed to training recommendation.

### Output
Diagnosis per area (DOMS, possible strain, joint concern, tendon issue, or general fatigue), red flags for medical referral if any.
### Quality Gate
Every reported sore area has a diagnosis. Injury signs separated from normal soreness. Medical referral recommended if warranted.

### Phase 3: PRESCRIBE
### Entry Criteria
Diagnosis complete, no acute injury requiring medical attention.
### Actions
1. Based on recovery score and diagnosis, recommend one of four levels:
   - **Full rest (recovery score 1-3, or injury signs present):** No training today. Recovery activities only. This is the right call when the body is genuinely depleted or something hurts beyond normal soreness.
   - **Active recovery (score 3-5, or severe DOMS):** Light movement to promote blood flow: walking 20-30 minutes, easy cycling, swimming at conversation pace, yoga or stretching. No weights, no intensity. Keep heart rate below Zone 2 (60% max HR).
   - **Modified training (score 5-7):** Can train but reduce load. Options:
     * Avoid sore muscle groups entirely and train something else
     * Same exercises at 50-60% of normal working weight, higher reps (15-20), slower tempo
     * Cardio at reduced intensity (Zone 2 only, no intervals)
   - **Train as planned (score 7-10):** Recovery is adequate. Proceed with the planned session. The mild soreness will likely resolve during warmup.
2. For modified training, provide a specific session outline based on what muscle groups are available and what equipment the person uses.
3. For active recovery, provide a specific protocol: walking route, stretching sequence (10-15 minutes), or mobility routine.
4. Note: if the user wants to train regardless of the recommendation, provide the safest way to do so. "Do not train" is less useful than "if you insist on training, here's how to minimize risk."

### Output
Day recommendation with reasoning, specific session outline if training, active recovery protocol if resting.
### Quality Gate
Recommendation is one of four clear levels. Reasoning explains why. If modified training, the specific session is outlined.

### Phase 4: RECOVER
### Entry Criteria
Prescription issued.
### Actions
1. Immediate recovery protocol (today):
   - **Nutrition:** Protein within 2 hours of the last training session (0.25-0.4g per kg body weight). Anti-inflammatory foods: berries, fatty fish, turmeric, green leafy vegetables. Hydration target: 0.5-1 oz per lb of body weight.
   - **Sleep:** Target 8+ hours tonight. Sleep is the single most effective recovery tool. Dim lights 1 hour before bed, avoid screens, room temperature 65-68F. If sleep has been poor, a 20-minute afternoon nap helps without disrupting nighttime sleep.
   - **Tissue work:** Foam rolling sore muscles, 60-90 seconds per muscle group. Apply moderate pressure -- it should feel like a 5-6/10 discomfort, not pain. Massage gun if available: 30-60 seconds per area, let the tool do the work.
   - **Temperature:** Contrast therapy (alternate hot/cold) promotes blood flow. Hot shower 2-3 minutes, cold 30-60 seconds, repeat 3 cycles. Cold-only (ice bath, cold shower) for acute inflammation. Heat-only for tight/stiff muscles without inflammation.
2. Supplement considerations (backed by evidence, not bro-science):
   - Creatine monohydrate: 3-5g daily. Improves recovery between sessions. The most well-studied supplement in sports nutrition.
   - Magnesium: 200-400mg before bed. Supports sleep quality and muscle relaxation.
   - Tart cherry juice: 8-12 oz daily during heavy training blocks. Shown to reduce DOMS and inflammation markers.
   - Vitamin D: 1000-2000 IU if not getting regular sun exposure. Deficiency impairs recovery.
3. What NOT to do:
   - Do not take NSAIDs (ibuprofen, naproxen) routinely for DOMS. Occasional use is fine, but chronic use blunts the adaptive response to training (the inflammation IS the adaptation signal).
   - Do not stretch aggressively into pain. Gentle movement only.
   - Do not "push through" sharp, acute, or worsening pain. That's not toughness, it's how 2-week recoveries become 6-month recoveries.

### Output
Same-day recovery protocol (nutrition, sleep, tissue work, temperature), supplement notes, what to avoid.
### Quality Gate
Protocol is actionable today. Supplement recommendations cite evidence level. "Do not" list addresses common mistakes.

### Phase 5: RETURN
### Entry Criteria
Recovery protocol issued.
### Actions
1. Set a return-to-training timeline:
   - Mild DOMS (score 6-8): resume next planned session. Use a longer warmup (10-15 minutes instead of 5).
   - Moderate DOMS/fatigue (score 4-6): 1-2 days of active recovery, then resume at 80% volume/intensity for one session before returning to full load.
   - Severe DOMS/fatigue (score 2-4): 2-3 days of rest/active recovery. First session back at 60% volume and intensity. Build back to 100% over 3-4 sessions.
   - Possible injury: return depends on professional evaluation. Do not set a timeline.
2. First session back protocol:
   - Extended warmup: 15 minutes minimum, including general (5 min cardio) and specific (movement prep for the exercises planned)
   - Start every working set 10-20% lighter than the last full-effort session
   - If pain returns during any exercise, stop that exercise immediately. Pain-free alternatives only.
   - Reduce volume by 2-3 sets per muscle group for the first session back
3. Deload check: if this is the 3rd or more recovery event in 4 weeks, recommend a programmed deload week:
   - Keep all exercises the same
   - Reduce weight to 50-60% of normal working sets
   - Reduce sets by 40-50%
   - Maintain frequency (still go to the gym same number of days)
   - Duration: 1 week. Resume full programming the following week.
4. Prevention for next cycle: identify the most likely cause of excessive fatigue/soreness and recommend one adjustment:
   - Volume too high -> reduce weekly sets by 10-15%
   - Insufficient sleep -> set a non-negotiable bedtime
   - Nutrition gaps -> increase daily protein or total calories
   - No deload weeks -> program a deload every 4-6 weeks

### Output
Return timeline, first session protocol, deload recommendation if needed, prevention adjustment.
### Quality Gate
Timeline is specific (days). First session has concrete weight and volume reductions. Prevention identifies a single root cause.


---

## Worked Example

Illustrative only.

Given typical inputs for I'm sore, tired, or injured. Assess recovery status, recommend rest vs. active r, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) symptoms assessed and mapped, (2) DOMS vs. injury differentiated, (3) today's recommendation issued, (4) recovery protocol provided, (5) return-to-training timeline set.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | User only says "I'm tired" with no specifics | Ask: which muscles are sore (if any), hours of sleep last night, and energy on a 1-10 scale. These three data points are the minimum |
| DIAGNOSE | Symptoms sound like possible injury but user insists on training | Provide the modified training option with explicit risk warning. Note that training through genuine injury extends recovery time by 3-10x |
| DIAGNOSE | Symptoms are inconsistent with recent training | Flag that the soreness source is unclear. Could be non-training related (sleeping position, carrying heavy objects, stress-related tension). Recommend monitoring for 48 hours |
| PRESCRIBE | User has a competition/event coming soon | Adjust prescription to prioritize readiness for the event. More aggressive recovery protocols, earlier return to specific training |
| RECOVER | User can't access recovery tools (no foam roller, no ice) | Scale to available tools. Walking, stretching, and sleep are free and available to everyone |
| RETURN | Soreness persists beyond 5 days | Recommend medical evaluation. Persistent soreness beyond 5 days from a single session is not normal DOMS |

## State Persistence
- Recovery event history (dates, causes, severity, time to return)
- Pattern detection (recurring issues suggest chronic problem)
- Sleep and stress averages over time
- Deload schedule tracking (weeks since last deload)
- Injury log if applicable

## Reference

### Recovery Timeline by Severity

| Severity | Description | Expected Resolution | Return to Full Training |
|---|---|---|---|
| Mild DOMS (1-3) | Noticeable but doesn't limit movement | 1-2 days | Next session |
| Moderate DOMS (4-6) | Limits some movements, stiffness | 2-4 days | 1-2 sessions at reduced load |
| Severe DOMS (7-8) | Significantly limited ROM | 4-6 days | 3-4 sessions graded return |
| Muscle strain (grade 1) | Mild pain, no loss of strength | 1-3 weeks | Gradual over 1-2 weeks |
| Muscle strain (grade 2) | Moderate pain, some strength loss | 3-8 weeks | Gradual over 2-4 weeks |

### Sleep and Recovery Relationship

| Average Sleep | Recovery Capacity | Training Recommendation |
|---|---|---|
| 8-9 hours | 100% | Train as planned |
| 7-8 hours | 85-90% | Normal training, may need slightly longer warmup |
| 6-7 hours | 65-75% | Reduce intensity or volume by 10-20% |
| Under 6 hours | Below 60% | Active recovery or rest day strongly recommended |

### Stress Multiplier

Composite recovery = base recovery score x stress modifier
- Life stress 1-3: modifier 1.0 (no impact)
- Life stress 4-6: modifier 0.85 (15% impairment)
- Life stress 7-8: modifier 0.70 (30% impairment)
- Life stress 9-10: modifier 0.50 (50% impairment)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
