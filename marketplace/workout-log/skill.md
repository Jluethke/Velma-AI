# Workout Log

Logs your exercise session with enough detail to track progress but not so much that logging becomes a chore. Records what you did, calculates volume, checks whether you're progressing (progressive overload), and flags when your body might need a rest day. Works for lifting, running, cycling, swimming, sports, or any combination. The goal is to have a training history that actually tells you something useful, not just a list of exercises.

## Execution Pattern: Phase Pipeline

```
PHASE 1: RECORD       --> Log the session details
PHASE 2: CALCULATE    --> Compute volume, intensity, and work metrics
PHASE 3: COMPARE      --> Check against recent history for progression
PHASE 4: SIGNAL       --> Flag overtraining, recovery needs, or PRs
```

## Inputs
- `exercise_data`: object -- What you did today. For strength: exercise name, sets, reps, weight. For cardio: activity type, duration, distance, average heart rate or perceived effort. For sports/classes: activity name, duration, intensity (easy/moderate/hard).
- `body_metrics`: object -- (Optional) Body weight, hours of sleep last night, perceived energy level (1-10), any soreness or pain notes.
- `goals`: object -- (Optional) Current training goals: strength (increase lifts), hypertrophy (muscle growth), endurance (cardio improvement), weight loss, general fitness.

## Outputs
- `workout_record`: object -- Structured log of today's session with all exercises, sets, reps, weights, and durations
- `weekly_volume`: object -- Running 7-day total: sets per muscle group (strength), total miles/minutes (cardio), training frequency
- `progressive_overload_check`: object -- Comparison to same exercises from prior sessions. Did you add weight, reps, or sets?
- `recovery_signal`: object -- Based on training frequency, volume trend, sleep, and soreness: rest day recommendation

## Execution

### Phase 1: RECORD
### Entry Criteria
At least one exercise or activity reported.
### Actions
1. Parse the exercise data into structured records:
   - **Strength exercises:** exercise name (standardize -- "bench" = "barbell bench press"), muscle group targeted (chest, back, shoulders, legs, arms, core), sets x reps x weight. If bodyweight, record as "BW" plus any added weight.
   - **Cardio:** activity type, duration (minutes), distance (miles or km), average pace or speed, heart rate zone if available (Zone 2 = 60-70% max HR, Zone 3 = 70-80%, Zone 4 = 80-90%, Zone 5 = 90-100%).
   - **Flexibility/mobility:** type (stretching, yoga, foam rolling), duration. Counts as active recovery.
2. Record session metadata: date, time of day, session duration, location (gym, home, outdoor).
3. Calculate estimated calories burned:
   - Strength training: ~3-6 calories per minute depending on intensity
   - Running: ~80-120 calories per mile (depends on body weight and pace)
   - Cycling: ~30-50 calories per mile
   - Swimming: ~200-300 calories per 30 minutes
   - These are rough estimates. The actual number depends on body weight, fitness level, and intensity.
4. If body metrics provided, log: body weight, sleep hours, energy level, soreness notes. These are more useful than calories for tracking recovery status.

### Output
Structured workout record with all exercises, metrics, and metadata.
### Quality Gate
Every exercise has enough data to calculate volume. Session duration is recorded. Muscle groups tagged for each strength exercise.

### Phase 2: CALCULATE
### Entry Criteria
Workout record complete.
### Actions
1. Calculate strength volume per muscle group:
   - Volume = sets x reps x weight for each exercise. Sum by muscle group.
   - Effective sets per muscle group (sets taken to within 2-3 reps of failure count; warmup sets below 60% of working weight do not count as effective).
   - Weekly volume targets by muscle group for hypertrophy: 10-20 effective sets per muscle group per week. Below 10 is likely insufficient for growth. Above 20 rarely produces additional benefit and may impair recovery.
2. Calculate cardio volume:
   - Total weekly minutes by zone: Zone 2 (aerobic base), Zone 3-4 (threshold), Zone 5 (max effort)
   - Weekly mileage for runners/cyclists
   - For general health: target 150 minutes moderate or 75 minutes vigorous per week (AHA guideline)
3. Calculate session intensity:
   - Strength: average weight as percentage of estimated 1RM (one-rep max). Below 60% = light. 60-75% = moderate. 75-85% = heavy. Above 85% = maximal.
   - Cardio: average heart rate zone or RPE (rate of perceived exertion, 1-10 scale).
4. Calculate training density: total volume divided by session duration. Higher density = more work in less time = conditioning benefit.

### Output
Volume by muscle group, weekly running totals, session intensity, training density.
### Quality Gate
Volume is expressed in both total (sets x reps x weight) and effective sets. Weekly totals are updated. Intensity is benchmarked.

### Phase 3: COMPARE
### Entry Criteria
Volume and intensity calculated. Prior session data available (if not first session).
### Actions
1. Progressive overload check: for each exercise done today, compare to the most recent session where the same exercise was performed:
   - Did weight increase? (Even 2.5 lbs counts)
   - Did reps increase at the same weight?
   - Did sets increase?
   - If none of the above: was form or tempo improved? (Slower eccentrics, fuller range of motion, shorter rest periods)
   - Mark each exercise as: PROGRESSED, MAINTAINED, or REGRESSED
2. Weekly volume trend: compare this week's total volume to last week's. General guideline:
   - Volume increase of 5-10% week-over-week is sustainable
   - Increase of 10-20% is aggressive, monitor recovery
   - Increase of 20%+ is a red flag for overtraining
   - Decrease of 10%+ may be a deload week (intentional or a recovery signal)
3. Identify exercises that have stalled: same weight and reps for 3+ consecutive sessions. Flag these with suggestions:
   - Try a different rep range (switch from 8 reps to 5 reps with more weight)
   - Add a pause at the bottom
   - Switch to a variation (flat bench -> incline, squat -> front squat)
   - Micro-load with fractional plates (1.25 lb increments)
4. Personal record detection: if any exercise today exceeded all prior recorded weights/reps/volumes, flag it as a PR.

### Output
Progressive overload report per exercise, weekly volume trend, stall detection with suggestions, PR flags.
### Quality Gate
Every exercise compared to prior session if data exists. Trend direction (up/flat/down) is clear. Stalls flagged after 3 sessions.

### Phase 4: SIGNAL
### Entry Criteria
Comparison complete.
### Actions
1. Recovery assessment based on available data:
   - Sleep: below 6 hours = recovery impaired. 7-9 hours = optimal. Track trend over 3 days.
   - Training frequency: if same muscle group was trained within 48 hours without a split that accounts for it, flag overlap.
   - Volume trend: increasing for 4+ weeks without a deload = recommend a deload week (reduce volume by 40-50% while maintaining intensity).
   - Soreness: persistent soreness in the same area for 3+ days may indicate insufficient recovery or injury risk.
   - Energy level below 4/10 for 3+ consecutive training days = accumulated fatigue.
2. Recovery recommendation:
   - Green light: recovery metrics are good, proceed with planned training
   - Yellow: one or more recovery signals elevated. Can train but consider lower volume or easier session.
   - Red: multiple recovery signals flagged. Recommend a rest day or light active recovery (walk, stretch, foam roll).
3. Suggest tomorrow's focus based on training split and recovery:
   - If push was today, suggest pull or legs tomorrow
   - If full body, suggest rest or light cardio
   - If heavy strength, suggest lighter assistance work or cardio
4. Weekly frequency check: for the stated goal:
   - Strength/hypertrophy: 3-6 sessions/week, each muscle group 2x/week
   - Endurance: 3-5 sessions/week with 80% at Zone 2, 20% at Zone 4+
   - General fitness: 3-4 sessions/week mixing strength and cardio
   - Weight loss: 3-5 sessions/week, prioritize strength + steps over pure cardio

### Output
Recovery status (green/yellow/red), tomorrow's suggestion, weekly frequency assessment, deload recommendation if applicable.
### Quality Gate
Recovery signal uses at least 2 data points (not just one metric). Tomorrow suggestion is specific. Deload timing tracked.


---

## Worked Example

Illustrative only.

Given typical inputs for Log your workout, track weekly volume, check progressive overload, and get recov, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) workout recorded with all exercises and metrics, (2) volume and intensity calculated with weekly totals, (3) progressive overload checked against prior sessions, (4) recovery signal issued with tomorrow's recommendation.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| RECORD | User provides minimal data ("did chest today") | Ask for at least: which exercises, how many sets, rough weight range. Minimum viable log is exercise + sets + weight |
| RECORD | Unknown exercise name | Accept it as-is, ask which muscle group it targets, and add to the exercise dictionary |
| CALCULATE | No weight data (bodyweight workout) | Calculate volume as sets x reps. Track progression by reps and sets only |
| COMPARE | First session, no history | Establish baseline. Mark everything as "first record." Begin tracking from here |
| COMPARE | Exercise performed with different equipment than prior (dumbbell vs. barbell) | Track separately. Dumbbell bench and barbell bench are different exercises with different weight norms |
| SIGNAL | No sleep or soreness data | Issue recovery signal based on training frequency and volume trend only. Note that the signal is less reliable without recovery metrics |

## State Persistence
- Exercise history per session (complete log with date, exercises, sets, reps, weight)
- Personal records per exercise (highest weight, most reps at a given weight, highest volume)
- Weekly volume by muscle group (rolling 7-day)
- Body weight and sleep history
- Deload cycle tracking (weeks since last deload)

## Reference

### Weekly Volume Targets by Goal

| Goal | Sets per Muscle Group/Week | Rep Range | Intensity (% 1RM) |
|---|---|---|---|
| Strength | 6-10 | 1-5 | 80-95% |
| Hypertrophy | 10-20 | 6-12 | 65-80% |
| Endurance | 15-25 | 12-20+ | 50-65% |
| General fitness | 8-15 | 8-15 | 60-75% |

### Estimated 1RM Formula

1RM = weight x (1 + reps / 30)  (Epley formula, accurate within ~5% for 1-10 reps)

Example: 185 lbs x 8 reps -> estimated 1RM = 185 x (1 + 8/30) = 234 lbs

### Recovery Time by Muscle Group

| Muscle Group | Minimum Recovery | Optimal Recovery |
|---|---|---|
| Large (quads, glutes, back) | 48 hours | 72 hours |
| Medium (chest, shoulders, hamstrings) | 48 hours | 48-72 hours |
| Small (biceps, triceps, calves, abs) | 24-48 hours | 48 hours |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
