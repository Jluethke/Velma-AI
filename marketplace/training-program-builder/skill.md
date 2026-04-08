# Training Program Builder

**One-line description:** Converts fitness goals and current fitness level into a progressive 12-week periodized training program with deload weeks, phase-specific objectives, and measurable progress markers.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `fitness_goals` (string, required): Primary training objective(s) in plain language (e.g., "increase squat 1RM by 10%", "build muscle mass", "improve cardiovascular endurance", "prepare for competition"). Multiple goals may be listed; skill will prioritize them.
- `current_fitness_level` (object, required):
  - `training_age_years` (number): Years of consistent structured training (0 = beginner, <1 = novice, 1-3 = intermediate, 3+ = advanced).
  - `baseline_metrics` (object): Current performance data. Include any of: `max_squat_lbs`, `max_deadlift_lbs`, `max_bench_lbs`, `max_reps_pullups`, `body_weight_lbs`, `body_fat_percent`, `vo2_max_mlkg`, `mile_time_minutes`. At least 2 metrics required.
  - `movement_competency` (string): Self-assessed or tested movement quality. Options: "beginner" (learning movement patterns), "intermediate" (solid form, consistent execution), "advanced" (efficient, load-ready).
  - `injury_history` (string, required): Any past or current injuries, mobility limitations, or contraindicated movements (e.g., "lower back pain with heavy deadlifts", "shoulder impingement with overhead press", or "none" if no restrictions).
- `training_frequency` (number, required): Days per week available for training (3-6 typical range).
- `equipment_access` (string, required): Available equipment. Options: "full_gym" (barbell, dumbbells, machines, cables), "home_gym" (dumbbells, resistance bands, bodyweight), "minimal" (bodyweight only).
- `program_duration_weeks` (number, optional, default: 12): Length of program in weeks. Skill is optimized for 12-week cycles.
- `competition_date` (string, optional): ISO 8601 date (YYYY-MM-DD) if program is peaking toward a specific event. If provided, skill will structure periodization to peak on this date.
- `lifestyle_factors` (object, optional):
  - `sleep_quality` (string): "poor" (<6 hrs/night), "fair" (6-7 hrs), "good" (7-9 hrs), "excellent" (9+ hrs).
  - `stress_level` (string): "low", "moderate", "high".
  - `job_demands` (string): "sedentary", "moderate_activity", "physically_demanding".
  - `recovery_priority` (string): "low", "moderate", "high" (informs deload frequency).

---

## Outputs

- `program_overview` (object):
  - `title` (string): Name of the program (e.g., "12-Week Strength Hypertrophy Block").
  - `goal_summary` (string): Concise restatement of primary and secondary goals.
  - `periodization_model` (string): Model selected ("linear", "undulating", "block", "conjugate").
  - `training_age_classification` (string): Beginner, Intermediate, or Advanced.
  - `total_duration_weeks` (number): Program length.
  - `training_days_per_week` (number): Frequency.
  - `deload_schedule` (string): When deload weeks occur (e.g., "weeks 4, 8, 12").

- `phase_breakdown` (object[]): Array of 3-4 phases, each containing:
  - `phase_number` (number): 1, 2, 3, or 4.
  - `phase_name` (string): Descriptive name (e.g., "Anatomical Adaptation", "Hypertrophy", "Strength", "Peaking").
  - `weeks` (string): Week range (e.g., "Weeks 1-3").
  - `primary_adaptation` (string): Main training stimulus (e.g., "muscle growth", "strength development", "power", "endurance").
  - `rep_range` (string): Target rep range per set (e.g., "8-12", "3-5", "12-15").
  - `intensity_zone` (string): RPE or % 1RM range (e.g., "70-80% 1RM", "RPE 7-8").
  - `volume_per_week` (string): Approximate total reps or sets per week (e.g., "120-150 reps", "18-24 sets").
  - `session_structure` (string): How sessions are organized (e.g., "Upper/Lower split", "Full-body 3x/week", "Push/Pull/Legs").
  - `key_exercises` (string[]): 4-6 primary exercises for the phase (e.g., ["Barbell Back Squat", "Barbell Bench Press", "Barbell Rows"]).
  - `progression_rule` (string): How to progress within the phase (e.g., "Add 5 lbs to main lifts each week", "Increase reps by 1-2 per week, then reset and add weight").
  - `deload_week` (boolean): True if this phase includes a deload week.

- `weekly_microcycle_template` (object[]): One template per phase, showing a sample week:
  - `phase_number` (number).
  - `sample_week_structure` (object[]): Array of training sessions, each with:
    - `session_number` (number): 1, 2, 3, etc.
    - `session_name` (string): e.g., "Upper A", "Lower B", "Full Body", "Deload".
    - `exercises` (object[]): Array of exercises, each with:
      - `exercise_name` (string).
      - `sets_x_reps` (string): e.g., "4x5", "3x8-10".
      - `intensity` (string): e.g., "85% 1RM", "RPE 8", "moderate difficulty".
      - `rest_seconds` (number): Rest between sets.
      - `notes` (string, optional): Cues, tempo, or modifications.

- `progress_markers` (object):
  - `weekly_tracking` (string[]): Metrics to log each week (e.g., ["Total weight lifted per session", "RPE per main lift", "Reps at target weight", "Bodyweight"]).
  - `assessment_points` (object[]): Formal testing at weeks 4, 8, 12:
    - `week` (number).
    - `tests` (string[]): Specific assessments (e.g., ["1RM squat test", "max reps at 185 lbs", "body composition"]).
    - `success_criteria` (string): What constitutes progress (e.g., "Squat increases by 5+ lbs, or reps increase by 2+").
  - `final_assessment` (string): End-of-program evaluation protocol.

- `nutrition_protocol` (object):
  - `caloric_target` (string): Daily calorie recommendation (e.g., "2500-2700 calories/day") with rationale.
  - `macronutrient_targets` (object):
    - `protein_g_per_lb_bw` (number): e.g., 0.8-1.0.
    - `carbs_g_per_lb_bw` (number): e.g., 4-6.
    - `fats_g_per_lb_bw` (number): e.g., 0.3-0.4.
  - `meal_template` (string): Sample daily meal structure (e.g., "Breakfast: 40g protein, 60g carbs; Lunch: 40g protein, 80g carbs; Dinner: 50g protein, 100g carbs; Snacks: 20g protein, 40g carbs").
  - `hydration_target` (string): Daily water intake recommendation (e.g., "0.5-1 oz per lb bodyweight").
  - `supplementation_optional` (string[]): Optional supplements with rationale (e.g., ["Creatine monohydrate: 5g/day for strength", "Whey protein: convenience only, not necessary if whole foods available"]).

- `deload_protocol` (object):
  - `frequency` (string): When deloads occur (e.g., "Every 3-4 weeks").
  - `structure` (string): How deload weeks are built (e.g., "50-60% of normal volume, same intensity, 2-3 min rest between sets").
  - `recovery_recommendations` (string[]): Sleep, nutrition, mobility, and stress management guidance.

- `adjustment_rules` (object):
  - `stalled_progress` (string): If no progress for 2+ weeks, reduce weight by 10% and rebuild, or increase calories by 200-300 if hypertrophy goal.
  - `missed_sessions` (string): If 1-2 sessions missed, resume next scheduled session. If 1 week missed, repeat the previous week, then resume normal progression.
  - `injury_or_pain` (string): If sharp pain (not soreness) occurs, stop the exercise immediately. Consult a medical professional before resuming. Substitute with pain-free alternative or deload for 1 week.
  - `exceeding_targets` (string): If consistently hitting reps with 3+ reps in reserve, increase weight by 5-10 lbs or add 1-2 reps per set next week.

- `program_document` (string, markdown format): Complete 12-week program in markdown format, ready to print or share. Includes all phases, weekly breakdowns, exercise descriptions, progression rules, recovery guidelines, nutrition protocol, and adjustment rules. Minimum 15 pages, maximum 25 pages.

- `program_completion_report_template` (string, markdown format): Template for users to fill out at week 12, including: actual results vs. goals, lessons learned, adherence rate, biggest challenges, recommendations for next 12 weeks.

- `notes_and_caveats` (object[]):
  - `category` (string): e.g., "Safety", "Nutrition", "Consistency", "Adaptation".
  - `note` (string): Specific guidance.

---

## Execution Phases

### Phase 1: Assess Fitness Profile and Constraints

**Entry Criteria:**
- All required inputs provided: fitness goals, current fitness level, training frequency, equipment access.

**Actions:**
1. Parse and validate fitness goals. If multiple goals are listed, rank them by feasibility and alignment (e.g., strength and hypertrophy align; strength and endurance may conflict). Flag conflicts and recommend a primary goal.
2. Validate baseline metrics. Ensure at least 2 metrics are provided and are realistic (e.g., a 150 lb person claiming a 500 lb squat is flagged). If metrics are missing, infer from training age and goal (e.g., beginner with strength goal → assume ~1.0x bodyweight squat).
3. Classify training age: <1 year = beginner, 1-3 years = intermediate, 3+ years = advanced. Adjust based on movement competency (e.g., 2 years of training but "beginner" movement competency → treat as beginner).
4. Document injury history and contraindicated exercises. Create an exclusion list. If injury_history is "none" or empty, note that no restrictions apply.
5. Verify training frequency is sufficient for goal (e.g., hypertrophy typically requires 3-4 days/week minimum; 2 days/week is suboptimal but workable).
6. Map equipment access to exercise selection constraints.
7. Assess lifestyle factors (sleep, stress, job demands) if provided. If not provided, assume moderate sleep (7 hrs), moderate stress, sedentary job. Note that high stress or poor sleep may require more frequent deloads (every 2-3 weeks instead of 3-4).

**Output:**
- Validated goal profile with primary and secondary goals.
- Training age classification.
- Baseline metrics (filled in or inferred).
- Contraindicated exercises list.
- Equipment-available exercise pool.
- Lifestyle assessment and deload frequency recommendation.

**Quality Gate:**
- All inputs are validated and internally consistent, verified by: (1) baseline metrics are realistic for stated training age, (2) training frequency is documented as optimal/adequate/suboptimal with specific reasoning, (3) injury history is documented with specific contraindications, (4) no contradictions exist (e.g., "build muscle" with 1 day/week training is flagged as suboptimal with explanation).

---

### Phase 2: Select Periodization Model and Macrocycle Structure

**Entry Criteria:**
- Fitness profile is validated.

**Actions:**
1. Select periodization model based on goal, training age, and frequency:
   - **Beginner + any goal**: Linear periodization (steady progression, easy to follow).
   - **Intermediate + strength**: Block periodization (dedicated strength phase).
   - **Intermediate + hypertrophy**: Undulating periodization (varied rep ranges, higher frequency).
   - **Advanced + competition**: Conjugate or block periodization (sport-specific peaking).
   - **Endurance goal**: Undulating or block (build base, then peak).
2. Define macrocycle structure: 12 weeks divided into 3-4 phases of 3-4 weeks each.
3. Determine phase sequence:
   - If no competition date: Anatomical Adaptation (if beginner) → Hypertrophy or Strength → Peaking or Deload.
   - If competition date: Work backward from competition date to structure phases to peak on that date. Ensure final 2 weeks are not a deload.
4. Assign deload weeks: typically every 3-4 weeks (weeks 4, 8, 12 for a 12-week cycle, or weeks 3, 6, 9, 12 for more frequent deloads). Adjust frequency based on lifestyle factors: high stress or poor sleep → every 2-3 weeks; low stress and good sleep → every 4-5 weeks.
5. Define intensity and volume progression rules for each phase.

**Output:**
- Periodization model selected with justification (e.g., "Linear periodization selected because user is beginner; easy to follow and proven effective for novices").
- Macrocycle structure: phase names, weeks, primary adaptations.
- Deload schedule with frequency rationale.
- Intensity and volume progression strategy.

**Quality Gate:**
- Periodization model matches training age and goal, verified by: (1) model name is one of the four standard types, (2) justification cites training age and goal, (3) phases are sequenced logically (e.g., hypertrophy before strength, not after), (4) deload weeks are placed at natural fatigue accumulation points (every 3-4 weeks) and not in final 2 weeks before competition.

---

### Phase 3: Design Phase-Specific Objectives and Exercise Selection

**Entry Criteria:**
- Macrocycle structure is defined.

**Actions:**
1. For each phase, define:
   - Primary adaptation (muscle growth, strength, power, endurance, etc.).
   - Rep range (e.g., 8-12 for hypertrophy, 3-5 for strength, 12-15 for endurance).
   - Intensity zone (% 1RM or RPE).
   - Volume per week (total reps or sets).
2. Select 4-6 primary exercises per phase from the available equipment pool, excluding contraindicated movements. Prioritize compound movements (squat, deadlift, bench, rows, pull-ups). For minimal equipment, use bodyweight progressions (e.g., push-ups → archer push-ups → one-arm push-ups).
3. Define exercise order within sessions: heavy/complex first, then accessory/isolation.
4. Determine session structure (full-body, upper/lower split, push/pull/legs, etc.) based on training frequency and goal.
5. Define progression rules: how to increase weight, reps, or volume each week within the phase. Rules must be specific (e.g., "add 5 lbs each week" not "add weight").

**Output:**
- Phase-specific objectives, rep ranges, intensity zones, volume targets.
- Exercise selection per phase (primary and accessory).
- Session structure template.
- Progression rules per phase (specific and testable).

**Quality Gate:**
- Each phase has 4-6 primary exercises that are achievable with available equipment, verified by: (1) no contraindicated exercises are included, (2) progression rules are specific (e.g., "add 5 lbs each week" or "increase reps by 1-2 per week"), (3) exercises are ordered logically (compound first), (4) session structure matches training frequency (e.g., 3 days/week → full-body or upper/lower, 5 days/week → push/pull/legs).

---

### Phase 4: Build Weekly Microcycles and Deload Protocols

**Entry Criteria:**
- Phase objectives and exercise selection are defined.

**Actions:**
1. For each phase, create a sample week (microcycle) showing:
   - Number of sessions (e.g., 3, 4, 5, 6 per week).
   - Session names and focus (e.g., "Upper A", "Lower B").
   - Exercises per session, sets/reps, intensity, rest periods.
   - Exercise order and rationale.
2. Design deload weeks (typically weeks 4, 8, 12, or adjusted based on lifestyle factors):
   - Reduce volume to 50-60% of normal (e.g., 3x5 becomes 2x3, or 4x8 becomes 2x5).
   - Maintain or slightly reduce intensity (e.g., 85% 1RM stays 85%, or drops to 80%).
   - Increase rest between sets (e.g., 2 min becomes 3 min).
   - Same exercises, lower fatigue.
3. Define recovery protocols for each phase:
   - Sleep recommendations (7-9 hours typical; adjust based on lifestyle factors).
   - Nutrition guidelines (caloric surplus for hypertrophy, maintenance for strength, deficit for fat loss).
   - Mobility and flexibility work (e.g., 10 min post-session, 2-3x/week dedicated).
   - Stress management and active recovery (e.g., walking, yoga, foam rolling).

**Output:**
- Weekly microcycle templates for each phase (sample weeks).
- Deload week structure and placement.
- Recovery and nutrition guidelines.

**Quality Gate:**
- Each microcycle is realistic and achievable within the training frequency, verified by: (1) total session time per week is 3-6 hours (typical), (2) deload weeks are clearly marked and structured with 50-60% volume reduction, (3) recovery recommendations are specific and actionable (e.g., "7-9 hours sleep" not "sleep well"), (4) no session exceeds 90 minutes (typical limit).

---

### Phase 5: Define Progress Markers, Nutrition, and Assessment Protocol

**Entry Criteria:**
- Microcycles and deload protocols are designed.

**Actions:**
1. Define weekly tracking metrics:
   - For strength goals: weight lifted per main lift, reps at target weight, total volume (sets × reps × weight).
   - For hypertrophy: bodyweight, body composition (if available), reps at target weight, pump/soreness (subjective).
   - For endurance: distance/time, heart rate, perceived exertion.
   - General: session RPE, sleep quality, appetite, mood.
2. Schedule formal assessments at weeks 4, 8, and 12:
   - Week 4: Mid-phase check-in (reps at target weight, bodyweight, subjective progress).
   - Week 8: Mid-program assessment (retest a key lift or metric, adjust if needed).
   - Week 12: Final assessment (full retest of baseline metrics, body composition, performance).
3. Define success criteria for each assessment (e.g., "Squat increases by 5+ lbs, or reps increase by 2+").
4. Create a simple tracking template (spreadsheet or checklist format).
5. Calculate nutrition targets based on goal and baseline metrics:
   - Strength: maintenance to slight surplus (0-300 cal surplus), 0.8-1.0 g protein/lb, 3-5 g carbs/lb.
   - Hypertrophy: moderate surplus (300-500 cal), 0.8-1.0 g protein/lb, 4-6 g carbs/lb.
   - Endurance: maintenance to slight deficit (0-300 cal deficit), 0.6-0.8 g protein/lb, 5-7 g carbs/lb.
6. Create a sample meal template showing daily macronutrient distribution.
7. List optional supplements with rationale (e.g., creatine for strength, whey protein for convenience).

**Output:**
- Weekly tracking metrics and template.
- Assessment schedule (weeks 4, 8, 12) with specific tests.
- Success criteria per assessment.
- Final program evaluation protocol.
- Nutrition targets (calories, macros, hydration).
- Sample meal template.
- Optional supplementation list.

**Quality Gate:**
- Metrics are objective and measurable (not "feel stronger"), verified by: (1) each metric has a unit (lbs, reps, minutes, etc.), (2) assessments are scheduled at logical points (weeks 4, 8, 12), (3) success criteria are realistic and aligned with the goal, (4) nutrition targets are specific (e.g., "2500-2700 calories/day" not "eat enough"), (5) meal template shows daily macronutrient distribution.

---

### Phase 6: Generate Adjustment Rules and Contingency Protocols

**Entry Criteria:**
- Progress markers and nutrition are defined.

**Actions:**
1. Define adjustment rules for common scenarios:
   - **Stalled progress (no improvement for 2+ weeks)**: Reduce weight by 10% and rebuild, or increase calories by 200-300 if hypertrophy goal. Retest in 1 week.
   - **Missed sessions (1-2 sessions)**: Resume next scheduled session. Do not skip ahead.
   - **Missed week (5+ sessions)**: Repeat the previous week, then resume normal progression.
   - **Injury or pain (sharp pain, not soreness)**: Stop the exercise immediately. Consult a medical professional before resuming. Substitute with pain-free alternative or deload for 1 week.
   - **Exceeding targets (3+ reps in reserve consistently)**: Increase weight by 5-10 lbs or add 1-2 reps per set next week.
2. Create contingency protocols:
   - **Life disruption (job change, family emergency)**: Deload for 1 week, then resume. If disruption lasts 2+ weeks, restart the current phase.
   - **Motivation loss**: Review goals and progress to date. Consider switching to a different exercise variation for novelty. Ensure sleep and nutrition are adequate.
   - **Plateau after 8 weeks**: Increase training frequency by 1 day/week, or switch to a different periodization model for the final 4 weeks.
3. Document all adjustment rules with specific triggers and responses.

**Output:**
- Adjustment rules object with stalled_progress, missed_sessions, injury_or_pain, exceeding_targets.
- Contingency protocols for life disruption, motivation loss, plateau.

**Quality Gate:**
- Each adjustment rule has a specific trigger (e.g., "2+ weeks no progress") and a specific response (e.g., "reduce weight by 10%"), verified by: (1) no rule uses vague language like "adjust as needed", (2) each rule includes a retest or follow-up point, (3) contingency protocols address common real-world scenarios.

---

### Phase 7: Generate Complete Program Document

**Entry Criteria:**
- All previous phases are complete and validated.

**Actions:**
1. Assemble the complete 12-week program in markdown format:
   - Program title and overview (goal, periodization, duration).
   - Phase breakdown (1-2 pages per phase).
   - Weekly breakdowns for each phase (sample week + progression notes).
   - Exercise descriptions and form cues (1-2 sentences per exercise).
   - Deload week structure.
   - Progress tracking template.
   - Nutrition protocol (targets, meal template, supplementation).
   - Recovery and nutrition guidelines.
   - Adjustment rules and contingency protocols.
   - Troubleshooting and adjustment rules (e.g., "If you miss reps, repeat the weight next week").
   - Notes and caveats.
2. Review the generated document against the original inputs:
   - Does it address the stated goals? ✓
   - Is it appropriate for the training age? ✓
   - Does it use only available equipment? ✓
   - Are contraindicated exercises excluded? ✓
3. Create a program completion report template for week 12 feedback.
4. Ensure document is 15-25 pages and self-contained.

**Output:**
- Complete program document (markdown format, 15-25 pages).
- Program completion report template (markdown format).
- Notes and caveats (structured as array of objects with category and note).

**Quality Gate:**
- Document is self-contained and readable by someone unfamiliar with the original workflow, verified by: (1) every phase, exercise, and progression rule is explained, (2) no ambiguity (e.g., "do some cardio" is replaced with "30 min steady-state running, 2x/week"), (3) document is 15-25 pages, (4) all outputs from previous phases are included, (5) adjustment rules and contingency protocols are present.

---

## Exit Criteria

The skill is DONE when:
1. ✓ All inputs are validated and internally consistent.
2. ✓ A periodization model is selected with clear justification citing training age and goal.
3. ✓ 12-week macrocycle is structured into 3-4 phases with defined objectives, rep ranges, intensity zones, and volume targets.
4. ✓ Each phase has a sample microcycle (weekly breakdown) with exercises, sets, reps, intensity, and rest periods.
5. ✓ Deload weeks are scheduled (every 3-4 weeks, adjusted for lifestyle factors) and structured (50-60% volume reduction).
6. ✓ Progress markers and assessment protocols are defined with objective, measurable success criteria.
7. ✓ Nutrition protocol is provided with specific caloric targets, macronutrient ratios, and sample meal template.
8. ✓ Adjustment rules and contingency protocols are documented with specific triggers and responses.
9. ✓ Recovery and nutrition guidelines are provided (sleep, mobility, stress management, supplementation).
10. ✓ Complete program document is generated in markdown format (15-25 pages) and is self-contained.
11. ✓ Program completion report template is provided for week 12 feedback.
12. ✓ A person unfamiliar with the user's training history could follow the program, track progress using the provided template, and achieve the stated goals within 12 weeks.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Fitness goals are vague (e.g., "get fit") | **Adjust** -- Ask for specificity: "Increase squat by X lbs?", "Gain X lbs of muscle?", "Run a 5K in X time?" Provide default goal if user cannot specify (e.g., "Build muscle mass over 12 weeks"). |
| Phase 1 | Baseline metrics are missing or unrealistic | **Adjust** -- Infer from training age and goal using population averages. Document assumptions in program_overview. |
| Phase 1 | Training frequency is very low (<2 days/week) | **Adjust** -- Note that goal achievement will be slower. Recommend full-body sessions to maximize stimulus. Flag as suboptimal in output. |
| Phase 1 | Injury history indicates severe restrictions (e.g., "cannot do any lower body exercises") | **Adjust** -- Recommend consulting a physical therapist before proceeding. Offer to design upper-body-only program if appropriate. |
| Phase 2 | Periodization model cannot be determined (conflicting goals) | **Adjust** -- Recommend prioritizing one goal and treating others as secondary. Suggest undulating periodization as a compromise. |
| Phase 3 | Available equipment is too limited (e.g., bodyweight only, beginner strength goal) | **Adjust** -- Recommend progression using bodyweight variations (e.g., push-ups → archer push-ups → one-arm push-ups) or resistance bands. Note that strength gains will plateau without external load. |
| Phase 4 | Deload placement conflicts with competition date | **Adjust** -- Move deload earlier or later to avoid deloading in the final 2 weeks before competition. |
| Phase 5 | User cannot track metrics (no scale, no gym equipment for testing) | **Adjust** -- Recommend subjective metrics (reps at perceived effort, soreness, energy level) and visual progress (photos). Provide simplified tracking template. |
| Phase 6 | User abandons program mid-way (missed 2+ weeks) | **Adjust** -- Provide contingency protocol: repeat the previous week, then resume normal progression. Do not skip ahead. |
| Phase 7 | Generated program exceeds 25 pages | **Adjust** -- Condense exercise descriptions to 1 sentence each, combine similar phases, and offer a "quick reference" version (5-page summary). |
| Phase 7 | User reports injury during program execution | **Adjust** -- Provide injury modification protocol: stop the problematic exercise, substitute with pain-free alternative, deload for 1 week, then resume. Recommend consulting a medical professional. |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Periodization Models

**Linear Periodization:**
- Intensity increases, volume decreases over time (e.g., weeks 1-3: 3x10 at 70%, weeks 4-6: 4x6 at 80%, weeks 7-9: 5x3 at 90%).
- Best for: Beginners, strength-focused goals, simple to follow.
- Drawback: Boredom, plateau risk.

**Undulating (Daily/Weekly) Periodization:**
- Intensity and volume vary within each week (e.g., Monday: 3x5 heavy, Wednesday: 3x10 moderate, Friday: 3x15 light).
- Best for: Intermediate/advanced, hypertrophy, muscle retention during cuts.
- Drawback: More complex, requires more planning.

**Block Periodization:**
- Phases focus on one adaptation (e.g., 4 weeks hypertrophy, 4 weeks strength, 4 weeks peaking).
- Best for: Advanced, sport-specific peaking, competition prep.
- Drawback: Requires expertise to sequence correctly.

**Conjugate Periodization:**
- Multiple adaptations trained in parallel (e.g., max effort, dynamic effort, repetition effort on different days).
- Best for: Advanced, powerlifting/strength sports.
- Drawback: Complex, requires deep knowledge.

### Rep Ranges and Adaptations

| Rep Range | Primary Adaptation | Secondary Adaptations | Intensity |
|---|---|---|---|
| 1-5 | Strength | Neural, some hypertrophy | 85-95% 1RM |
| 6-8 | Strength + Hypertrophy | Power, some endurance | 80-85% 1RM |
| 8-12 | Hypertrophy | Strength, some endurance | 70-80% 1RM |
| 12-15 | Hypertrophy + Endurance | Muscular endurance | 65-75% 1RM |
| 15+ | Muscular Endurance | Metabolic stress, some hypertrophy | 50-65% 1RM |

### Deload Frequency and Structure

- **Frequency**: Every 3-4 weeks for intermediate/advanced; every 4-6 weeks for beginners. Adjust to every 2-3 weeks if high stress or poor sleep.
- **Structure**: 50-60% of normal volume, same or slightly reduced intensity, increased rest.
- **Duration**: 1 week typical; 2 weeks if severely fatigued.
- **Benefits**: Nervous system recovery, joint recovery, hormonal rebalancing, injury prevention.

### Progression Rules

- **Strength focus**: Add 5-10 lbs per week to main lifts (or 1-2 reps at same weight).
- **Hypertrophy focus**: Add 1-2 reps per week, then reset weight and repeat (e.g., 4x8 → 4x9 → 4x10 → add 5 lbs, back to 4x8).
- **Endurance focus**: Increase distance/time by 5-10% per week, or decrease time for same distance.
- **Rule of thumb**: If you hit all reps with 2+ reps in reserve, increase weight/difficulty next session. If you miss reps, repeat the weight.

### Training Age Benchmarks

**Beginner (<1 year):**
- Focus: Movement quality, work capacity, consistency.
- Frequency: 3 days/week optimal.
- Progression: Rapid (can add weight every session initially).
- Periodization: Linear or simple undulating.

**Intermediate (1-3 years):**
- Focus: Strength and hypertrophy balance, specialization.
- Frequency: 4-5 days/week optimal.
- Progression: Moderate (weekly or bi-weekly increases).
- Periodization: Undulating or block.

**Advanced (3+ years):**
- Focus: Peaking, sport-specific, advanced techniques.
- Frequency: 5-6 days/week optimal.
- Progression: Slow (bi-weekly or monthly increases).
- Periodization: Block or conjugate.

### Nutrition Guidelines by Goal

**Strength:**
- Calories: Maintenance to slight surplus (0-300 surplus).
- Protein: 0.8-1.0 g per lb bodyweight.
- Carbs: 3-5 g per lb bodyweight (fuel for heavy lifting).

**Hypertrophy:**
- Calories: Moderate surplus (300-500 surplus).
- Protein: 0.8-1.0 g per lb bodyweight.
- Carbs: 4-6 g per lb bodyweight (volume support).

**Endurance:**
- Calories: Maintenance to slight deficit (0-300 deficit).
- Protein: 0.6-0.8 g per lb bodyweight.
- Carbs: 5-7 g per lb bodyweight (fuel for long sessions).

### Recovery Checklist

- Sleep: 7-9 hours per night (non-negotiable); adjust based on lifestyle factors.
- Nutrition: Adequate protein, carbs, and fats; hydration (0.5-1 oz per lb bodyweight).
- Mobility: 10-15 min post-session, 2-3x/week dedicated.
- Stress: Manage external stressors; training is a stressor too. High stress may require more frequent deloads.
- Active recovery: Light walking, yoga, swimming on off-days.
- Deload: Every 3-4 weeks as planned (adjust to 2-3 weeks if high stress or poor sleep).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.