# the system Run Planner

Builds a training plan for any running race -- 5K, 10K, half marathon, or full marathon. Starts by figuring out where you are right now (current fitness, weekly mileage, recent race times) and builds a week-by-week plan that gets you to the start line prepared and uninjured. Includes pace targets for different workout types, taper instructions, race day strategy, and a gear checklist. Works for first-timers and experienced runners looking to PR.

## Execution Pattern: Phase Pipeline

```
PHASE 1: ASSESS       --> Current fitness level and running background
PHASE 2: PLAN         --> Week-by-week training schedule
PHASE 3: WORKOUTS     --> Pace targets and workout descriptions
PHASE 4: TAPER        --> Pre-race preparation and taper protocol
PHASE 5: RACE         --> Race day strategy and logistics
```

## Inputs
- `race_goal`: object -- Target race: distance (5K, 10K, half marathon, marathon), date (or "no race, just training"), time goal (specific time, or "just finish", or "PR").
- `current_fitness`: object -- Current state: weekly mileage (or "I don't run yet"), longest recent run (miles), recent race time if any, how long you've been running.
- `schedule_constraints`: object -- (Optional) Days per week available for running (3-6), preferred rest days, time available per session (30 min, 60 min, unlimited), morning/evening preference.
- `injury_history`: object -- (Optional) Past running injuries: IT band, shin splints, plantar fasciitis, knee pain, Achilles tendonitis. Current niggles or concerns.

## Outputs
- `fitness_assessment`: object -- Current estimated fitness level, predicted race time at current fitness, training age classification
- `training_plan`: object -- Week-by-week schedule with daily runs, cross-training, and rest days. Mileage progression.
- `pace_targets`: object -- Easy pace, tempo pace, interval pace, race pace, long run pace with heart rate zones
- `race_day_strategy`: object -- Pacing plan (negative split or even), fueling, warmup, mental approach
- `gear_checklist`: array -- Shoes, hydration, nutrition, clothing, and race-day logistics

## Execution

### Phase 1: ASSESS
### Entry Criteria
Race goal and current fitness provided.
### Actions
1. Classify the runner:
   - **Beginner:** Under 10 miles/week or running for less than 3 months. Focus: build aerobic base, avoid injury.
   - **Novice:** 10-20 miles/week, running 3-12 months. Can handle structured workouts.
   - **Intermediate:** 20-40 miles/week, running 1-3 years. Can handle speed work and longer long runs.
   - **Advanced:** 40+ miles/week, 3+ years, prior race experience. Can handle high volume and intensity.
2. Estimate current race fitness using available data:
   - If recent race time exists, use Riegel formula to predict other distances: T2 = T1 x (D2/D1)^1.06
   - If no race but know easy pace: race pace is roughly easy pace minus 60-90 seconds/mile for 5K, minus 30-60 for half marathon, minus 15-45 for marathon.
   - If truly no data: start conservative. First 2 weeks are assessment weeks.
3. Calculate weeks available until race day. Minimum training periods:
   - 5K: 6-8 weeks (beginner), 4-6 weeks (experienced)
   - 10K: 8-12 weeks (beginner), 6-8 weeks (experienced)
   - Half marathon: 10-14 weeks (beginner), 8-10 weeks (experienced)
   - Marathon: 16-20 weeks (beginner), 12-16 weeks (experienced)
   - If fewer weeks available than minimum, adjust expectations: "finish" not "PR."
4. Check injury risk factors: sudden mileage increases in history, recurring injuries, BMI above 30 (higher impact stress), running in worn-out shoes (over 400 miles).
5. Set training paces using current fitness:
   - Easy/recovery pace: can hold a conversation, 60-70% max HR
   - Tempo pace: "comfortably hard," sustainable for 40-60 minutes, 80-85% max HR
   - Interval pace: hard, sustainable for 3-5 minutes, 90-95% max HR
   - Race pace: target pace for the goal race
   - Long run pace: easy pace or slightly slower, 65-75% max HR

### Output
Runner classification, predicted race time, weeks to train, injury risk factors, training paces.
### Quality Gate
Classification is justified. Race prediction uses actual data or clear assumptions. Paces are specific (min:sec per mile).

### Phase 2: PLAN
### Entry Criteria
Fitness assessed, weeks calculated, schedule constraints known.
### Actions
1. Build the training structure:
   - **Beginner (3-4 days/week):** 2 easy runs, 1 long run, 1 optional cross-train day
   - **Novice (4-5 days/week):** 2 easy runs, 1 workout (tempo or intervals), 1 long run, 1 optional easy/cross-train
   - **Intermediate (5-6 days/week):** 2 easy runs, 1 tempo, 1 interval/speed session, 1 long run, 1 easy/recovery
   - **Advanced (5-6 days/week):** similar to intermediate but higher volume and more specific workouts
2. Apply the 10% rule for weekly mileage progression: increase total weekly mileage by no more than 10% per week. Every 3rd or 4th week, reduce mileage by 20-30% (recovery week).
   - Beginner starting at 10 mi/wk: 10 -> 11 -> 12 -> 9 (recovery) -> 13 -> 14 -> 15 -> 12 (recovery) ...
   - The long run should be roughly 20-30% of total weekly mileage (e.g., 8-mile long run in a 30-mile week).
3. Set long run progression:
   - 5K training: longest run 5-8 miles
   - 10K training: longest run 8-10 miles
   - Half marathon: longest run 12-14 miles (beginner), 14-16 miles (experienced)
   - Marathon: longest run 18-22 miles (the debate between 20 and 22 is less important than getting 3-4 runs of 16+ miles)
4. Schedule runs around the user's availability. Key rules:
   - Never put two hard days back-to-back (tempo day followed by interval day = injury risk)
   - Long run should have an easy or rest day before and after
   - At least 1 full rest day per week for beginners, 1-2 for all levels
5. Build the week-by-week plan as a table: Week number, Monday through Sunday with run type and target mileage/duration, weekly total.

### Output
Complete week-by-week training plan with daily detail, mileage progression table, recovery week schedule.
### Quality Gate
10% rule followed for progression. Recovery weeks every 3-4 weeks. Hard days have easy days around them. Long run caps are race-appropriate.

### Phase 3: WORKOUTS
### Entry Criteria
Training plan structure built.
### Actions
1. Define each workout type with specific pacing:
   - **Easy run:** [easy pace] per mile. Should be able to talk in full sentences. This is where most runners go too fast. If in doubt, slow down. 80% of training should be at this effort.
   - **Long run:** [long run pace] per mile. Slower than easy pace for the last 4-6 miles. Practice fueling every 30-45 minutes on runs over 90 minutes.
   - **Tempo run:** 15-20 minutes at [tempo pace] per mile with 10-minute warmup and cooldown. Should feel "comfortably hard." Also called threshold or lactate threshold runs.
   - **Intervals:** 4-8 x [distance] at [interval pace] with equal rest. Examples:
     * 5K training: 8 x 400m at 5K pace with 200m jog recovery
     * 10K training: 5 x 1000m at 10K pace with 400m jog recovery
     * Half marathon: 4 x 1 mile at half marathon pace with 90 seconds rest
     * Marathon: 3 x 2 miles at marathon pace with 3 minutes rest
   - **Strides:** 4-6 x 100m accelerations (not sprints) at the end of easy runs. Build to 90% effort, decelerate. Rest 60 seconds between. Improve running economy.
   - **Hill repeats:** 6-10 x 30-60 second hill at hard effort. Walk/jog down for recovery. Builds strength and power.
2. Progression within the plan:
   - Weeks 1-4: base building. All easy runs plus long run. Introduce strides in week 3.
   - Weeks 5-8: introduce one quality session per week (tempo or intervals).
   - Weeks 9-12+: two quality sessions per week (one tempo, one speed).
   - Final 2-3 weeks: taper (covered in Phase 4).
3. Cross-training options for non-running days:
   - Cycling: 30-45 minutes easy. Good aerobic training without impact.
   - Swimming: any duration. Zero impact, full-body conditioning.
   - Strength training: 2x/week, focus on single-leg work (lunges, step-ups), hip stability (clamshells, bridges), and core. Avoid heavy squats within 48 hours of hard running.
   - Yoga/stretching: supports mobility and recovery.

### Output
Workout descriptions with paces, progression schedule, cross-training recommendations.
### Quality Gate
Every workout type has a specific pace range. Progression is gradual. Cross-training supports running rather than competing with it.

### Phase 4: TAPER
### Entry Criteria
Training plan covers the full period. Now preparing the final 1-3 weeks before race day.
### Actions
1. Taper duration by race distance:
   - 5K: 5-7 days of reduced volume (not really a "taper" -- just rest before the race)
   - 10K: 7-10 days
   - Half marathon: 10-14 days
   - Marathon: 14-21 days (3 weeks for first-timers, 2 weeks for experienced runners)
2. Taper protocol:
   - Week 1 of taper: reduce mileage by 20-25%. Keep one quality session but reduce the volume of it (e.g., 3 x 1 mile instead of 5 x 1 mile).
   - Week 2 of taper (marathon): reduce mileage by 40-50%. One short tempo or race-pace session. Long run drops to 8-10 miles.
   - Final week: 3-4 easy runs of 3-5 miles. One session with 4-6 strides at race pace to keep legs sharp. 2-3 rest days before race.
3. Taper madness: warn that during taper, the runner will feel sluggish, heavy, and convinced they're losing fitness. This is normal. It takes 10 days to lose aerobic fitness. The taper is loading the body with stored glycogen and repairing micro-damage. Trust the process.
4. Pre-race nutrition:
   - Week before: increase carbohydrate intake to 3-5g per lb of body weight (carb loading is for races over 90 minutes, primarily marathon and half marathon).
   - 2-3 days before: reduce fiber intake to minimize GI issues on race day.
   - Night before: familiar meal, moderate portion, early dinner. Pasta is traditional but not required.
   - Morning of: 2-3 hours before start. Toast with peanut butter, banana, oatmeal, or whatever has worked during training long runs. No new foods.
5. Pre-race checklist: lay out all race gear the night before. Pin the bib to the shirt. Charge the watch. Set two alarms.

### Output
Taper schedule by week, nutrition protocol, pre-race checklist, taper madness warning.
### Quality Gate
Taper duration matches race distance. Mileage reduction is specific. Nutrition is practical and timed.

### Phase 5: RACE
### Entry Criteria
Training complete, taper complete, race day approaching.
### Actions
1. Pacing strategy:
   - **5K:** Start at race pace, build into it. First mile 3-5 seconds slower than target pace. Miles 2-3 at pace or slightly faster. Final 0.1: all-out kick.
   - **10K:** Even splits or slight negative split. First 2 miles at target pace. Miles 3-5 at pace. Mile 6 to finish: push the pace if legs allow.
   - **Half marathon:** Negative split. First 5 miles 5-10 seconds SLOWER than target pace. Miles 5-10 at target pace. Miles 10-13.1: push. It's better to feel strong at mile 10 than to feel spent.
   - **Marathon:** Conservative start is everything. First 10 miles 10-15 seconds SLOWER than target pace. Miles 10-20 at target pace. Miles 20-26.2: survive and push when possible. The marathon doesn't start until mile 20 -- everything before that is the warm up.
2. Fueling during the race:
   - 5K/10K: water only at aid stations if needed. No gels needed.
   - Half marathon: 1-2 gels or equivalent (100-200 calories), first at mile 5-6, second at mile 9-10. Water at every other aid station.
   - Marathon: 4-6 gels (200-400 calories total), one every 30-45 minutes starting at mile 4-5. Water at every aid station. Electrolytes every hour. Practice this in training long runs.
3. Mental framework:
   - Break the race into thirds: "I feel great" (first third), "this is work" (second third), "this is why I trained" (final third).
   - Do NOT go out too fast because you feel fresh. The adrenaline of race day adds 10-20 seconds per mile in the first mile. Rein it in.
   - If the plan falls apart (bad weather, GI issue, bonking): switch from time goal to finish goal. Run/walk if needed. Finishing is always a win.
4. Post-race: walk for 10-15 minutes, stretch gently, eat within 30 minutes (protein + carbs). Take 1 day completely off per race mile (13 rest days after a half marathon, 26 after a marathon) before resuming structured training.

### Output
Mile-by-mile pacing plan, fueling schedule, mental framework, post-race recovery protocol.
### Quality Gate
Pacing is conservative in the first half. Fueling is timed to specific miles. Post-race recovery timeline is race-distance appropriate.


---

## Worked Example

Illustrative only.

Given typical inputs for Build a running training plan for any distance from 5K to marathon. Fitness asse, the pipeline produces structured outputs through each phase, with quality gates verified at every stage.

## Exit Criteria
Done when: (1) fitness assessed with predicted race time, (2) week-by-week training plan built with daily detail, (3) all workout types defined with paces, (4) taper protocol set, (5) race day strategy with pacing and fueling plan provided, (6) gear checklist included.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | User has never run before | Start with a couch-to-5K progression: alternate walk/run intervals, build to 30 minutes continuous running before starting structured training. Add 4-6 weeks to the timeline |
| ASSESS | Not enough time for the race distance | Be direct: "A marathon in 6 weeks from zero running is a serious injury risk." Suggest a shorter distance or a later race |
| PLAN | User can only run 2 days/week | Can work for 5K/10K with very gradual progression. Not enough for half/full marathon safely. Be honest about limits |
| WORKOUTS | User doesn't have a watch or HR monitor | Use perceived effort: easy = conversation pace, tempo = can say short sentences, intervals = can only say a word or two, all-out = can't talk |
| TAPER | User wants to keep training hard up to race day | Explain that performance peaks 10-14 days after the last hard workout, not during one. The taper IS the performance boost |
| RACE | User goes out too fast and bonks | Plan B should already be in the strategy: switch to run/walk intervals (run 5 min, walk 1 min) to manage remaining miles |

## State Persistence
- Training plan with completion tracking (which runs were done)
- Weekly mileage history
- Pace progression over time
- Race results for future predictions
- Injury history log

## Reference

### Race Distance Quick Reference

| Distance | Miles | Km | Beginner Plan Duration | Training Peak Mileage |
|---|---|---|---|---|
| 5K | 3.1 | 5.0 | 6-8 weeks | 15-20 mi/week |
| 10K | 6.2 | 10.0 | 8-12 weeks | 20-30 mi/week |
| Half Marathon | 13.1 | 21.1 | 10-14 weeks | 25-40 mi/week |
| Marathon | 26.2 | 42.2 | 16-20 weeks | 35-55 mi/week |

### Pace Conversion Table (min:sec per mile)

| Easy Pace | Tempo Pace | 5K Pace | 10K Pace | Half Pace | Marathon Pace |
|---|---|---|---|---|---|
| 12:00 | 10:30 | 9:40 | 10:00 | 10:45 | 11:15 |
| 11:00 | 9:30 | 8:45 | 9:05 | 9:50 | 10:15 |
| 10:00 | 8:30 | 7:50 | 8:10 | 8:50 | 9:15 |
| 9:00 | 7:40 | 7:00 | 7:20 | 7:55 | 8:20 |
| 8:00 | 6:50 | 6:15 | 6:30 | 7:05 | 7:25 |
| 7:00 | 6:05 | 5:30 | 5:50 | 6:20 | 6:40 |

### The 80/20 Rule

80% of running should be at easy pace (Zone 1-2). 20% at hard effort (Zone 4-5). Most recreational runners invert this ratio, running their easy days too fast and their hard days too easy. The result: constant moderate fatigue and slower improvement.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
