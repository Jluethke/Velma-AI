# Fitness Progress

Analyzes your training data over 4, 8, and 12-week windows to show whether you're actually getting stronger, faster, or leaner -- or just going through the motions. Takes lift logs, run times, body measurements, and energy/sleep ratings, then calculates trend lines, detects plateaus, estimates your 1-rep maxes, compares you to strength standards by bodyweight, and tracks running pace progression. Not a workout planner -- a progress auditor. Designed for the person who trains consistently but isn't sure if it's working.

## Execution Pattern: Phase Pipeline

```
PHASE 1: DATA INTAKE    --> Collect and normalize training logs across formats
PHASE 2: TRENDS         --> Calculate rate of change for every tracked metric
PHASE 3: PLATEAUS       --> Detect stalls and identify likely causes
PHASE 4: BENCHMARKS     --> Compare strength and cardio to population standards
PHASE 5: SUMMARY        --> One-page progress report with actionable findings
```

## Inputs
- `training_history`: array -- Workout logs. Each entry: date, exercise name, sets x reps x weight (lbs or kg), RPE (1-10) if tracked, workout duration. Minimum 4 weeks of data. Can be a paste from a training app, spreadsheet, or plain text.
- `body_measurements`: object -- (Optional) Logged at consistent intervals. Bodyweight (daily or weekly average), body fat % (if measured), waist circumference, chest, arms, thighs. Scale weight alone is noisy -- a 7-day rolling average is the useful signal.
- cardio_log: array -- (Optional) Running/cycling/rowing entries: date, distance, time, average heart rate if available, perceived effort (easy/moderate/hard).
- energy_sleep: array -- (Optional) Daily ratings: sleep hours, sleep quality (1-5), energy level (1-5), soreness level (1-5). Useful for correlating recovery with performance.
- `time_window`: string -- "4w" (last 4 weeks), "8w" (last 8 weeks), or "12w" (last 12 weeks). Default: "8w".

## Outputs
- `strength_trends`: object -- For each tracked lift: estimated 1RM progression, volume trend (sets x reps x weight per week), rate of change per week, direction (improving/stalling/declining)
- `body_composition_trends`: object -- Weight trend (7-day rolling average slope), measurement changes, rate of weight change per week, body fat trend if available
- `cardio_trends`: object -- Pace progression per distance, heart rate trends at same effort, estimated VO2max progression if heart rate data available
- `progress_summary`: object -- Overall direction, top 3 wins, top 3 concerns, specific recommendations

## Execution

### Phase 1: DATA INTAKE
### Entry Criteria
At least 4 weeks of training data with 2+ sessions per week.
### Actions
1. Parse all training entries into a normalized format: date, exercise, sets, reps, weight, estimated 1RM per set.
2. Calculate estimated 1RM for each working set using the Epley formula: `1RM = weight x (1 + reps / 30)`. This is reasonably accurate for sets of 1-10 reps. Above 10 reps, the estimate becomes less reliable -- note this when it applies.
3. Identify the "big compound lifts" for primary tracking:
   - **Squat** (back squat, front squat, leg press as proxy at 70% equivalence)
   - **Bench press** (flat barbell, dumbbell bench at 80% barbell equivalence)
   - **Deadlift** (conventional, sumo, trap bar at 90% conventional equivalence)
   - **Overhead press** (standing barbell, seated dumbbell at 80% barbell equivalence)
   - **Row** (barbell row, cable row, as accessory tracking)
   - **Pull-up/chin-up** (bodyweight + added weight)
4. Calculate weekly training volume per muscle group: total sets x reps x weight. Volume is the primary driver of hypertrophy -- track it.
5. For bodyweight data: calculate 7-day rolling average to smooth daily fluctuations. Day-to-day weight can swing 2-5 lbs from water, sodium, and food volume. The rolling average reveals the actual trend.
6. For cardio: normalize to pace (minutes per mile or km) and distance. Group by effort level.

### Output
Normalized training database with estimated 1RMs, weekly volume totals, rolling average bodyweight, and pace data.
### Quality Gate
Every lift has a 1RM estimate. Bodyweight is smoothed to rolling average. At least 8 data points per tracked lift.

### Phase 2: TRENDS
### Entry Criteria
Normalized data covers the requested time window.
### Actions
1. For each compound lift, calculate the linear trend of estimated 1RM over the time window:
   - Use the best set (highest estimated 1RM) per session as the data point. Don't average all sets -- your top set reflects your actual strength.
   - Calculate slope: lbs gained (or lost) per week.
   - Realistic benchmarks for rate of strength gain:
     - Beginner (first year): 5-10 lbs/month on squat and deadlift, 2.5-5 lbs/month on bench and OHP.
     - Intermediate (1-3 years): 2-5 lbs/month on squat and deadlift, 1-2.5 lbs/month on bench and OHP.
     - Advanced (3+ years): 1-2 lbs/month on lower body, 0.5-1 lb/month on upper body.
2. Calculate weekly training volume trend: total tonnage (sets x reps x weight) per week, per lift and per muscle group. Volume should generally trend up over a training block, then reset on a deload.
3. For bodyweight: calculate rate of change per week from the rolling average.
   - Healthy weight loss: 0.5-1.0 lbs/week (1% of bodyweight per week max to preserve muscle).
   - Healthy weight gain (muscle building): 0.25-0.5 lbs/week for intermediates, 0.5-1.0 for beginners.
   - Faster than these rates means losing muscle (if cutting) or gaining excess fat (if bulking).
4. For body measurements: calculate change over the window. Arms growing while waist stays flat = good recomp. Waist growing faster than everything else = excess fat gain.
5. For cardio: calculate pace improvement at the same distance and effort level. If heart rate data exists, calculate cardiac drift: same pace at lower heart rate over time = improved cardiovascular fitness.
6. Correlation check: if energy/sleep data exists, correlate low-sleep weeks with performance dips. A pattern of poor performance after <6 hours of sleep is common and actionable.

### Output
Trend lines for every tracked metric with direction, rate, and contextual benchmarks.
### Quality Gate
Trends use best-set per session (not average). Rate of change has context (is this fast/slow for training level?). Bodyweight trend uses rolling average, not single readings.

### Phase 3: PLATEAUS
### Entry Criteria
Trend data calculated.
### Actions
1. Detect strength plateaus: if a lift's estimated 1RM has not increased for 2+ consecutive weeks, flag it.
2. Classify plateau type:
   - **Volume plateau:** Weekly training volume for that movement has been flat or declining. Fix: add 1-2 sets per week.
   - **Intensity plateau:** Working weight hasn't increased but rep counts are also flat. Fix: attempt a small weight increase (2.5-5 lbs) with the same rep target.
   - **Recovery plateau:** Performance correlates with poor sleep or high soreness ratings. Fix: add a deload week (reduce volume 40-50%, maintain intensity).
   - **Technique plateau:** Volume and recovery are fine, but the lift stalls. Fix: add a variation that targets the weak portion (pause squat for squat stall, close-grip bench for lockout weakness).
   - **Bodyweight plateau:** Weight hasn't changed in 2+ weeks despite tracking intake. Fix: adjust calories by 200-300/day in the direction of the goal.
3. Check for systemic plateau: if 3+ lifts stall simultaneously, it's likely a recovery issue, not a programming issue. Common causes: accumulated fatigue (needs deload), caloric deficit too aggressive, sleep debt, life stress.
4. Check for regression: if any lift's estimated 1RM is declining, flag as high priority. Possible causes: overreaching (too much volume without deload), undereating, illness, injury, form degradation.

### Output
Plateau list with type classification, probable cause, and specific fix for each stalled metric.
### Quality Gate
Each plateau has a specific type and actionable fix. Systemic plateaus are identified. Regression is flagged separately from stalls.

### Phase 4: BENCHMARKS
### Entry Criteria
Current estimated 1RMs available.
### Actions
1. Calculate strength-to-bodyweight ratios for compound lifts:
   - Squat 1RM / bodyweight
   - Bench 1RM / bodyweight
   - Deadlift 1RM / bodyweight
   - OHP 1RM / bodyweight
2. Compare to population standards (see Reference table below). Classify as untrained, beginner, intermediate, advanced, or elite.
3. Identify relative weaknesses: if squat is intermediate but bench is beginner level, upper body pressing is the weak link. If deadlift is advanced but squat is intermediate, quad strength may lag posterior chain.
4. For cardio: estimate VO2max from running data if heart rate is available (use the Cooper formula for a 12-minute run, or pace-to-VO2max tables). Classify by age and sex norms.
5. Calculate Wilks score or DOTS score if bodyweight and all three powerlifting totals are available. This normalizes strength across weight classes.
6. Total strength score: squat + bench + deadlift estimated 1RM. Compare to strength level databases by bodyweight class.

### Output
Strength classification per lift, relative weakness analysis, cardio fitness classification, and total strength score.
### Quality Gate
Ratios use estimated 1RM from best recent session, not stale data. Classifications use the correct bodyweight standard (male/female tables differ significantly).

### Phase 5: SUMMARY
### Entry Criteria
All analysis complete.
### Actions
1. Generate the progress headline: overall direction in one sentence.
   - Example: "Strength is progressing at an intermediate rate, bodyweight is trending down 0.6 lbs/week, bench press has plateaued for 3 weeks."
2. List the top 3 wins: biggest improvements in the time window. Quantify each.
   - Example: "Squat estimated 1RM up 15 lbs (315 -> 330), bodyweight down 4 lbs without strength loss, 5K pace improved 20 seconds."
3. List the top 3 concerns: stalls, regressions, or red flags.
   - Example: "Bench 1RM flat for 3 weeks (likely volume plateau), sleep averaging 5.8 hours (below 7 hr target), deadlift volume declined 20% in weeks 6-8."
4. Specific recommendations (max 3, actionable):
   - Example: "Add 2 sets of bench accessories (incline DB press) per week to break the volume plateau. Prioritize 7+ hours of sleep -- performance correlated with sleep in weeks 3 and 7. Schedule a deload next week (week 9) before fatigue compounds."
5. Set benchmarks for the next review: "By week 12, bench 1RM should reach 225 if volume plateau is addressed. Bodyweight should be 182-184 at current rate."

### Output
One-page progress report: headline, wins, concerns, recommendations, and benchmarks for next review.
### Quality Gate
Every recommendation is specific and actionable. Wins are quantified. Next review has measurable targets.


---

## Worked Example

Illustrative only.

Given typical inputs for Am I getting stronger? Trend analysis of lift PRs, body measurements, run times,, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) every tracked lift has a trend line with rate of change, (2) plateaus are identified and typed, (3) strength ratios are calculated and classified, (4) top 3 wins and top 3 concerns are listed with numbers, (5) recommendations are specific and limited to 3.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| DATA INTAKE | Less than 4 weeks of data | Run the analysis on what exists, but flag that trends are unreliable with this sample size. Recommend logging consistently for 8 weeks before the next review |
| DATA INTAKE | Inconsistent exercise names (e.g., "squat" vs "back squat" vs "BB squat") | Attempt to normalize common variations. Flag ambiguous entries and ask user to confirm which exercise |
| DATA INTAKE | No rep/weight data, only "did chest day" | Cannot calculate 1RM or volume. Recommend switching to structured logging (exercise, sets, reps, weight). Provide a simple template |
| TRENDS | Fewer than 8 data points for a lift in the window | Trend line is unreliable. Report the raw numbers but caveat the slope. More data needed |
| PLATEAUS | User never deloads | Flag accumulated fatigue risk. Recommend programming a deload every 4-6 weeks (reduce volume 40-50%, maintain intensity at 85-90%) |
| BENCHMARKS | Bodyweight unknown, can't calculate ratios | Report absolute numbers only. Note that strength-to-bodyweight ratios require a weigh-in |
| ACT | User disputes a finding | Adjust. If they know their bench isn't actually stalling (e.g., they were sick for a week), exclude that data and recalculate |

## State Persistence
- Training log (cumulative, grows over time -- the longer the history, the better the trends)
- PR board (personal records for each lift, date achieved, bodyweight at time of PR)
- Body measurement history (weight, circumferences, body fat %, logged dates)
- Plateau history (which lifts stalled when, what fix was applied, did it work)
- Review history (previous progress summaries, to compare review-over-review direction)

## Reference

### Strength Standards by Bodyweight Ratio (Estimated 1RM / Bodyweight)

| Lift | Untrained | Beginner | Intermediate | Advanced | Elite |
|---|---|---|---|---|---|
| Squat (male) | 0.5 | 1.0 | 1.5 | 2.0 | 2.5+ |
| Bench (male) | 0.4 | 0.75 | 1.25 | 1.5 | 2.0+ |
| Deadlift (male) | 0.6 | 1.25 | 1.75 | 2.5 | 3.0+ |
| OHP (male) | 0.25 | 0.5 | 0.75 | 1.0 | 1.25+ |
| Squat (female) | 0.35 | 0.75 | 1.0 | 1.5 | 2.0+ |
| Bench (female) | 0.25 | 0.5 | 0.75 | 1.0 | 1.5+ |
| Deadlift (female) | 0.5 | 1.0 | 1.25 | 2.0 | 2.5+ |
| OHP (female) | 0.2 | 0.35 | 0.5 | 0.75 | 1.0+ |

### Epley 1RM Formula

`1RM = weight x (1 + reps / 30)`

Accurate for sets of 1-10 reps. Examples:
- 225 lbs x 5 reps = 225 x (1 + 5/30) = 225 x 1.167 = **263 lbs estimated 1RM**
- 185 lbs x 8 reps = 185 x (1 + 8/30) = 185 x 1.267 = **234 lbs estimated 1RM**
- 135 lbs x 12 reps = 135 x (1 + 12/30) = 135 x 1.4 = **189 lbs estimated 1RM** (less accurate above 10 reps)

### Healthy Rate of Body Composition Change

| Goal | Rate per Week | Red Flag |
|---|---|---|
| Fat loss | 0.5-1.0 lbs (1% BW max) | Losing more than 1% BW/week = losing muscle |
| Muscle gain (beginner) | 0.5-1.0 lbs | Gaining faster = excess fat |
| Muscle gain (intermediate) | 0.25-0.5 lbs | Gaining faster = excess fat |
| Recomposition | ~0 lbs (weight stable) | Strength going up while weight is flat = working |

### Recovery Indicators

| Metric | Green | Yellow | Red |
|---|---|---|---|
| Sleep (hours) | 7-9 | 6-7 | <6 |
| Soreness (1-5) | 1-2 | 3 | 4-5 |
| Energy (1-5) | 4-5 | 3 | 1-2 |
| Resting heart rate | Baseline +/- 3 bpm | +4-6 bpm | +7+ bpm above baseline |

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
