# the system Fitness Progress

Answers the question "am I actually getting better?" with data instead of feelings. Analyzes your training history over 4, 8, and 12 week windows to show real trends: are your lifts going up, are your run times improving, is your body composition changing, and is your energy level stable or declining. The mirror and the scale are unreliable day-to-day. This gives you the trend lines that tell the actual story.

## Execution Pattern: Phase Pipeline

```
PHASE 1: GATHER       --> Collect training history and body data
PHASE 2: STRENGTH     --> Analyze lift progression and estimated maxes
PHASE 3: CARDIO       --> Analyze endurance and speed trends
PHASE 4: BODY         --> Track weight, measurements, and composition
PHASE 5: VERDICT      --> Overall progress assessment with trajectory
```

## Inputs
- training_history: array -- Workout logs from the the system Workout Log flow or manual entry. Needs at least 4 weeks of data for meaningful trends.
- body_measurements: array -- (Optional) Periodic body measurements: weight, waist circumference, chest, arms, thighs. Date-stamped entries.
- time_window: string -- (Optional) "4 weeks", "8 weeks", "12 weeks", or "all". Defaults to 8 weeks. Shorter windows show recent momentum. Longer windows show true trajectory.

## Outputs
- strength_trends: object -- Estimated 1RM trend for major lifts, volume progression by muscle group, PR timeline
- body_composition_trends: object -- Weight trend (daily noise removed), measurement changes, estimated body fat direction if data supports it
- cardio_trends: object -- Pace improvement, distance progression, heart rate efficiency (same pace at lower HR = improved fitness)
- progress_summary: object -- Overall verdict by goal, areas improving, areas stalled, and specific recommendations

## Execution

### Phase 1: GATHER
### Entry Criteria
At least 4 weeks of training data available.
### Actions
1. Aggregate all workout records in the time window. Count total sessions, average sessions per week, training consistency (percentage of planned sessions completed).
2. Group exercises by type: compound lifts (squat, bench, deadlift, overhead press, row), isolation lifts, cardio sessions, flexibility/mobility.
3. Collect body metrics if available: weight readings (daily or weekly), body measurements, progress photos (note dates), energy ratings, sleep averages.
4. Identify data gaps: weeks with fewer than 2 sessions, missing body measurements, exercises that were tracked inconsistently. Note gaps but don't let them invalidate the analysis -- partial data is still useful.
5. Establish the baseline (first week of the window) and the current state (most recent week) for each metric.

### Output
Aggregated training data, consistency metrics, baseline vs. current state, data gap notes.
### Quality Gate
At least 4 weeks of data with 2+ sessions per week in most weeks. Baseline and current state established for at least one metric category.

### Phase 2: STRENGTH
### Entry Criteria
Training data aggregated. At least some strength training records.
### Actions
1. For each major compound lift, calculate estimated 1RM at baseline and current:
   - 1RM = weight x (1 + reps / 30) (Epley formula)
   - Plot the e1RM trend week by week. Upward slope = getting stronger. Flat = plateau. Downward = regression (may be fatigue, deload, or actual loss).
2. Calculate rate of progress:
   - Beginner (under 1 year training): expect 5-10 lbs/month on compound lifts
   - Intermediate (1-3 years): expect 2-5 lbs/month
   - Advanced (3+ years): expect 1-2 lbs/month or less
   - Compare actual rate to expected rate for training level
3. Volume trends by muscle group: weekly sets plotted over time. Increasing volume is a form of progressive overload, but beyond a point it causes diminishing returns and fatigue.
4. Identify personal records set in the window: new weight PRs, new rep PRs at a given weight, new volume PRs (most total work in a session).
5. Flag stalled lifts: exercises where e1RM has been flat or declining for 3+ weeks. Provide specific strategies:
   - Stalled at low reps (1-5): add a higher-rep phase (8-12 reps for 3-4 weeks) to build muscle
   - Stalled at higher reps: add a heavier phase (3-5 reps) to build neural strength
   - Persistent stall: check sleep, calories, and stress. Training variables may not be the problem.

### Output
Estimated 1RM trend per lift, rate of progress vs. expected, volume trends, PR list, stall analysis.
### Quality Gate
E1RM calculated for at least 3 compound lifts. Rate benchmarked against training age. Stalls identified with actionable suggestions.

### Phase 3: CARDIO
### Entry Criteria
Cardio session data available.
### Actions
1. Pace trends: for runners/cyclists, calculate average pace per mile/km at baseline vs. current. Improvement benchmarks:
   - New runners: expect 15-30 seconds/mile improvement per month
   - Intermediate: expect 5-15 seconds/mile per month
   - Advanced: expect 1-5 seconds/mile per month
2. Distance trends: total weekly mileage or time at baseline vs. current. Mileage increase should follow the 10% rule -- no more than 10% increase per week to avoid injury.
3. Heart rate efficiency (aerobic decoupling): if heart rate data is available, compare HR at the same pace over time. Same pace at a lower HR means improved cardiovascular fitness. This is one of the most reliable fitness indicators.
4. Zone distribution: what percentage of cardio time was spent in each heart rate zone? The 80/20 rule for endurance: 80% of training should be easy (Zone 2), 20% should be hard (Zone 4-5). Most recreational athletes do too much at Zone 3 ("no-man's land" -- too hard to recover from, too easy to improve speed).
5. VO2max estimate (if data supports it): based on pace and heart rate, estimate VO2max trend. Average adult male: 35-40 ml/kg/min. Average female: 27-31 ml/kg/min. Elite runners: 70+.

### Output
Pace trend, distance trend, heart rate efficiency, zone distribution, VO2max estimate if applicable.
### Quality Gate
At least one cardio metric shows a clear trend direction. Zone distribution analyzed if HR data exists. Rate of improvement benchmarked.

### Phase 4: BODY
### Entry Criteria
Body measurement data available (even if only weight).
### Actions
1. Weight trend: plot all weight readings over the window. Apply a 7-day rolling average to remove daily fluctuations (water, sodium, glycogen can cause 2-5 lb swings day-to-day). The rolling average is the real trend.
   - Weight loss goal: 0.5-1% of body weight per week is sustainable. Faster = likely losing muscle.
   - Weight gain goal (muscle building): 0.5-1 lb/month for intermediates, 2-4 lbs/month for beginners is realistic. Faster = gaining excessive fat.
   - Recomposition (same weight, more muscle, less fat): weight may stay flat while body changes. Measurements and photos are more useful than the scale.
2. Measurement trends: compare waist, chest, arm, and thigh circumference at baseline vs. current.
   - Waist decreasing + weight stable or increasing = losing fat and gaining muscle (ideal for recomposition)
   - Waist increasing + weight increasing = gaining fat along with muscle (cut caloric surplus)
   - Everything flat = body composition isn't changing (adjust nutrition or training)
3. Body fat estimate (rough): if waist and weight are known, use Navy Method or BMI-adjusted estimate. These are approximations (+/- 3-5%), useful for trend, not for absolute numbers.
4. Caloric implications: if weight is trending down, the person is in a caloric deficit. If up, surplus. If flat, maintenance. Rate of change implies the size of the deficit/surplus: ~3,500 calories = ~1 lb of fat.
5. Visual progress: note if progress photos are available. Side-by-side comparison with same lighting and pose is more motivating and informative than any number.

### Output
Weight trend (raw and rolling average), measurement changes, body fat trend estimate, caloric implication, visual progress notes.
### Quality Gate
Weight trend uses rolling average, not single readings. At least 2 data points for comparison. Changes expressed in both absolute and percentage terms.

### Phase 5: VERDICT
### Entry Criteria
All available data analyzed.
### Actions
1. Issue an overall progress verdict for each active goal:
   - **Progressing:** clear positive trend in the relevant metrics. Current approach is working.
   - **Plateaued:** metrics flat for 3+ weeks. Need a change -- adjustment suggestions provided.
   - **Regressing:** metrics declining. Possible causes: under-recovery, insufficient calories, excessive volume, life stress, illness.
2. Rank areas by progress: strongest area first, weakest last. This helps the user decide where to focus.
3. Generate a "highlight reel": top 3 best moments in the window (PRs, consistency streaks, milestone body metrics). Positive reinforcement matters for long-term adherence.
4. Generate a "focus area": the single most impactful thing to change in the next training block. One change, not five. Examples:
   - "Add one more set per muscle group per week (from 12 to 14 effective sets)"
   - "Drop your easy run pace by 30 seconds -- you're running too hard on easy days"
   - "Increase protein to 0.7-1g per pound of body weight"
   - "Get sleep to 7+ hours consistently -- this is the single biggest limiter right now"
5. Set a specific, measurable target for the next 4 weeks: a weight to hit on a lift, a pace to achieve, a body weight milestone.

### Output
Goal-by-goal verdict, progress ranking, highlight reel, single focus area recommendation, 4-week target.
### Quality Gate
Verdict is specific, not vague. Focus area is one thing, not a list. 4-week target is measurable and achievable.

## Exit Criteria
Done when: (1) strength trends analyzed with e1RM progression, (2) cardio trends analyzed if applicable, (3) body composition trends tracked, (4) overall verdict issued per goal, (5) specific 4-week target set.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| GATHER | Less than 4 weeks of data | Run with available data but flag that trends are unreliable with short windows. Set a note to rerun at 4 weeks |
| STRENGTH | Exercises done inconsistently (different exercises each week) | Group by muscle group instead of individual exercise. Volume trend per group is still valid |
| CARDIO | No heart rate data | Use pace and perceived effort only. Skip HR efficiency analysis |
| BODY | Only weight data, no measurements | Use weight trend only. Note that without measurements, body composition changes are invisible |
| BODY | Weight fluctuating wildly | Likely water/sodium. Ensure rolling average is used. If variance exceeds 4 lbs day-to-day, weight should be taken at the same time (morning, fasted) |
| VERDICT | Mixed signals (strength up but weight increasing faster than expected) | Note the trade-off explicitly. Strength gains while gaining fat is a sign that calories are too high for the training volume |

## State Persistence
- Estimated 1RM history per exercise by date
- Body measurement history by date
- Weekly volume totals by muscle group
- PR records with dates
- 4-week targets (for tracking against next run)
- Focus area recommendations (for checking follow-through)

## Reference

### Strength Standards (Male, approximate, lbs)

| Lift | Beginner | Intermediate | Advanced | Elite |
|---|---|---|---|---|
| Squat | 135 | 225 | 315 | 405+ |
| Bench Press | 95 | 185 | 275 | 345+ |
| Deadlift | 185 | 315 | 405 | 500+ |
| Overhead Press | 65 | 135 | 185 | 225+ |

Female standards are roughly 55-65% of these numbers. Standards scale with body weight.

### Expected Rate of Strength Progress

| Training Age | Monthly e1RM Increase (compound lifts) |
|---|---|
| Beginner (0-1 year) | 5-10 lbs/month |
| Intermediate (1-3 years) | 2-5 lbs/month |
| Advanced (3-5 years) | 1-2 lbs/month |
| Elite (5+ years) | 0.5-1 lb/month |

### Protein Targets by Goal

| Goal | Protein (g per lb body weight) |
|---|---|
| Muscle gain | 0.7-1.0 |
| Maintenance | 0.6-0.8 |
| Fat loss (preserve muscle) | 0.8-1.2 |
| Endurance athlete | 0.5-0.7 |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
