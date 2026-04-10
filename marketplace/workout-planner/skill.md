# Workout Planner

Designs evidence-based workout programs using progressive overload and periodization principles, outputs structured daily workouts with sets, reps, rest periods, and RPE targets, tracks performance metrics, detects plateaus, and auto-adjusts training volume.

## Execution Pattern: ORPA Loop

## Inputs
- fitness_goals: array -- Primary goals ranked: strength, hypertrophy (muscle growth), endurance, fat loss, athletic performance, general fitness
- available_equipment: array -- Gym type: full gym, home gym (specify equipment), bodyweight only
- schedule: object -- Available training days per week, session duration, time constraints
- current_fitness_level: string -- Beginner (<1 year consistent training), intermediate (1-3 years), advanced (3+ years)
- injuries_limitations: array -- Current injuries, mobility restrictions, exercises to avoid

## Outputs
- weekly_program: object -- Full week structure with training split, muscle group assignments, rest days
- daily_workout: object -- Specific exercises with sets, reps, weight/intensity, rest periods, RPE targets
- progress_tracking: object -- Metrics to log per session (weight, reps, RPE, notes)
- deload_recommendations: object -- When and how to deload based on fatigue accumulation

## Execution

### OBSERVE: Assess Training Context
**Entry criteria:** Fitness goals and schedule provided.
**Actions:**
1. Classify primary goal to select training methodology:
   - **Strength:** Low reps (1-5), high intensity (>80% 1RM), long rest (3-5 min), compound focus.
   - **Hypertrophy:** Moderate reps (8-12), moderate intensity (65-80% 1RM), moderate rest (60-90s), volume focus.
   - **Endurance:** High reps (15-25+), low intensity (<65% 1RM), short rest (30-60s), circuit style.
   - **Fat loss:** Moderate-high reps, superset pairings, minimal rest, caloric output focus.
2. Assess training frequency: map available days to optimal split:
   - 2 days/week: Full body x2
   - 3 days/week: Full body x3 or Push/Pull/Legs
   - 4 days/week: Upper/Lower x2 or Push/Pull/Legs/Upper
   - 5-6 days/week: Push/Pull/Legs x2 or Bro split
3. Inventory available equipment to determine exercise selection pool.
4. Note injuries and contraindicated movements. Identify safe alternatives.
5. If training history exists: review recent performance data (weights, reps, RPE trends).

**Output:** Training profile: methodology, split selection, exercise pool, contraindications, baseline performance.
**Quality gate:** Selected split matches available days. Exercise pool contains at least 3 options per muscle group. All contraindicated movements are flagged with alternatives.

### REASON: Design Programming Variables
**Entry criteria:** Training profile complete.
**Actions:**
1. Set volume targets per muscle group per week (evidence-based ranges):
   - Beginners: 10-12 sets per muscle group per week
   - Intermediate: 12-18 sets per muscle group per week
   - Advanced: 16-22+ sets per muscle group per week
   - Prioritized muscle groups get +20-30% volume
2. Set intensity targets based on goal:
   - Strength: 75-90% 1RM, RPE 7-9
   - Hypertrophy: 60-80% 1RM, RPE 7-8.5
   - Mix: periodize between phases
3. Design progressive overload scheme:
   - **Linear progression** (beginners): add weight every session (2.5kg upper, 5kg lower)
   - **Double progression** (intermediate): increase reps within range, then increase weight (e.g., 3x8 -> 3x10 -> 3x12, then add weight and restart at 3x8)
   - **Undulating periodization** (advanced): vary rep ranges across the week (heavy Monday, moderate Wednesday, light Friday)
4. Plan mesocycle structure:
   - 3-5 week accumulation phase (increasing volume)
   - 1 week deload (50-60% volume, same intensity)
   - Repeat with increased baseline

**Output:** Programming variables: volume per muscle group, intensity ranges, progression scheme, mesocycle structure.
**Quality gate:** Weekly volume falls within evidence-based ranges. Progression scheme matches training level. Mesocycle includes a deload.

### PLAN: Build the Program
**Entry criteria:** Programming variables defined.
**Actions:**
1. Assign exercises to each training day following the split:
   - **Compound movements first:** Squat, deadlift, bench press, overhead press, row, pull-up. These are the foundation.
   - **Accessory movements second:** Target weak points, smaller muscle groups, single-joint work.
   - **Order:** Large muscle groups -> small, multi-joint -> single-joint, higher skill -> lower skill.
2. For each exercise, specify:
   - Sets x Reps (e.g., 4x8-10)
   - RPE target (e.g., RPE 8 = 2 reps in reserve)
   - Rest period (e.g., 2-3 min for compounds, 60-90s for accessories)
   - Tempo if relevant (e.g., 3-1-1-0 for hypertrophy emphasis)
3. Ensure weekly volume targets are met by distributing sets across sessions.
4. Build in deload triggers:
   - **Scheduled:** Every 4th week (beginners), every 5th-6th week (intermediate/advanced)
   - **Performance-based:** 2+ sessions where target reps not met at same weight, or RPE consistently >9.5 on working sets
5. Add warm-up protocol: 5 min general (bike/row), 2-3 sets of first exercise at ascending weights (50%, 70%, 85% of working weight).

**Output:** Complete weekly program with daily workouts, exercise selection, set/rep schemes, rest periods, warm-up protocol, deload schedule.
**Quality gate:** Volume per muscle group matches targets. No muscle group trained on consecutive days without 48h rest. Compound movements appear before isolation. Session duration fits user's time constraints.

### ACT: Deliver and Track
**Entry criteria:** Complete program built.
**Actions:**
1. Output the weekly program in a scannable format:
   - Day | Exercise | Sets x Reps | Weight/RPE | Rest | Notes
2. Provide a tracking template for each session (what to log).
3. Define progression rules in plain language:
   - "If you hit all reps at the top of the range with good form (RPE <9), increase weight next session by [amount]."
   - "If you miss reps for 2 consecutive sessions, keep the weight the same. If 3 sessions, reduce by 10% and rebuild."
4. On re-entry (ongoing tracking):
   - Analyze logged data: are weights going up? Is RPE creeping toward 10?
   - Detect plateaus: same weight x reps for 3+ sessions on a lift.
   - Recommend adjustments: increase volume, change exercise variation, add a deload, modify rep range.
   - Detect recovery issues: declining performance across all lifts = systemic fatigue (sleep, nutrition, stress).

**Output:** Formatted program, tracking template, progression rules, or (on re-entry) adjustment recommendations.
**Quality gate:** Every exercise has clear progression criteria. Deload triggers are specific and measurable. If adjustments are recommended, they cite the specific data point that triggered them.

## Exit Criteria
Initial run: complete when a full weekly program is delivered with tracking templates and progression rules. Ongoing: the loop continues as long as the user logs data and seeks adjustments. Exit when user transitions to a new goal (triggers a fresh OBSERVE).

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No equipment specified | Adjust -- default to bodyweight program, ask for equipment details |
| OBSERVE | Goals conflict (e.g., "maximize strength AND run a marathon") | Escalate -- explain concurrent training interference, ask user to prioritize |
| REASON | Insufficient training days for volume targets | Adjust -- use full-body sessions with higher per-session volume, or reduce target volume |
| PLAN | Injury prevents key compound movements | Adjust -- substitute with safe alternatives (e.g., leg press instead of squat, floor press instead of bench) |
| ACT | No training log data for adjustments | Skip -- deliver generic progression rules, emphasize the importance of logging |
| ACT | All lifts declining simultaneously | Abort current mesocycle -- recommend immediate deload + sleep/nutrition review |
| ACT | User rejects final output | **Targeted revision** -- ask which exercise selection, set/rep scheme, or progression plan fell short and rerun only that phase. Do not regenerate the full training program. |

## Reference

### Progressive Overload Principle
The fundamental driver of adaptation. The body only grows stronger/bigger in response to increasing demands. Methods of overload:
1. **Increase weight** (most direct)
2. **Increase reps** (same weight, more work)
3. **Increase sets** (more volume)
4. **Decrease rest** (higher density)
5. **Improve technique** (more effective force production)
6. **Increase range of motion** (harder variation)

### Rep Range Continuum
| Reps | Primary Adaptation | % 1RM |
|---|---|---|
| 1-3 | Maximal strength (neural) | 90-100% |
| 4-6 | Strength + some hypertrophy | 80-90% |
| 8-12 | Hypertrophy (mechanical tension + metabolic stress) | 65-80% |
| 12-15 | Hypertrophy + muscular endurance | 60-70% |
| 15-25+ | Muscular endurance | <60% |

Note: hypertrophy occurs across all rep ranges when taken close to failure (RPE 7+). The 8-12 range is optimal for time efficiency, not biological necessity.

### RPE Scale (Rate of Perceived Exertion)
| RPE | Meaning |
|---|---|
| 10 | Maximum effort, no more reps possible |
| 9 | Could do 1 more rep |
| 8 | Could do 2 more reps |
| 7 | Could do 3 more reps |
| 6 | Light effort, speed work |

Most working sets should be RPE 7-9. RPE 10 should be rare (test days, competition).

### Volume Landmarks (Dr. Mike Israetel)
- **MV (Maintenance Volume):** Minimum sets to maintain muscle. ~6-8 sets/muscle/week.
- **MEV (Minimum Effective Volume):** Minimum to grow. ~8-12 sets/muscle/week.
- **MAV (Maximum Adaptive Volume):** Sweet spot for most growth. ~12-20 sets/muscle/week.
- **MRV (Maximum Recoverable Volume):** Upper limit before recovery fails. ~20-25+ sets/muscle/week. Individual.

### Deload Protocols
- **Volume deload:** Same exercises, same weight, 50% fewer sets. Best for most people.
- **Intensity deload:** Same exercises, same sets/reps, 60% of working weight. Good for joint recovery.
- **Active rest deload:** Different activities entirely (hiking, swimming, yoga). Good for mental recovery.
- **Full rest:** No training for 5-7 days. Reserve for injury or severe burnout.

### Plateau-Breaking Strategies
1. **Deload first** -- fatigue masking fitness is the #1 cause of plateaus.
2. **Change exercise variation** -- different stimulus to the same muscle (e.g., incline bench instead of flat).
3. **Add volume** -- if recovery supports it, add 1-2 sets per muscle group per week.
4. **Change rep range** -- if stuck at 5x5, try 3x8-10 for 4 weeks, then return.
5. **Improve technique** -- video review, coaching cues, tempo work.
6. **Address weak links** -- if lockout is weak, add close-grip bench or tricep work.

### State Persistence
Tracks over time:
- Weight x reps x RPE per exercise per session
- Estimated 1RM trends per lift (Epley formula: 1RM = weight x (1 + reps/30))
- Volume per muscle group per week
- Deload history and post-deload performance changes
- Plateau detection per exercise
