# Example: "Get Fit and Productive" Compound Task

## Input
```
compound_task: "I want to lose 15 lbs over the next 3 months while building a daily exercise habit and restructuring my daily schedule to fit everything in. I work 9-5 and have two kids."
available_skills: ["nutrition-optimizer", "workout-planner", "habit-builder", "daily-planner"]
constraints: { "time": "3 months", "work_hours": "9:00-17:00", "family_time": "17:30-20:00", "budget": "moderate" }
```

## Phase 1: GOAL Output

**Sub-objectives:**
1. **Lose 15 lbs in 3 months** (health, 12-week horizon) -- requires ~1.25 lbs/week = ~625 cal/day deficit
2. **Build daily exercise habit** (health + behavior, ongoing) -- new habit, needs habit formation framework
3. **Restructure daily schedule** (productivity, immediate) -- fit exercise + meal prep into constrained time with work and kids
4. **Meal planning for deficit** (health, ongoing) -- supports weight loss goal

**Implicit requirements:**
- Exercise must fit into non-work, non-family windows (early morning or after 8 PM)
- Meal prep must be time-efficient (kids + work = low cooking bandwidth)
- Habit must survive weekends (different schedule)

**Priority:** nutrition-optimizer first (defines calorie targets that constrain everything else) -> workout-planner (must fit calorie targets and time windows) -> habit-builder (wraps the workout into a sustainable habit) -> daily-planner (orchestrates everything into a schedule)

## Phase 2: DECOMPOSE Output

**Skill roster:**
| Sub-objective | Assigned Skill | Role |
|---|---|---|
| Caloric deficit + meal plan | nutrition-optimizer | Calculate TDEE, set macro targets, build meal plans |
| Exercise program | workout-planner | Design 3-4x/week program fitting time windows |
| Habit formation | habit-builder | Build exercise habit with cue-routine-reward |
| Schedule integration | daily-planner | Time-block everything including work, family, exercise, meals |

**Data flow mapping:**
- nutrition-optimizer outputs -> caloric_targets, meal_plan -> feeds into daily-planner (meal timing)
- workout-planner outputs -> weekly_program, daily_workout -> feeds into daily-planner (exercise blocks) AND habit-builder (the routine to habitualize)
- habit-builder outputs -> habit_stack_design, thirty_day_plan -> feeds into daily-planner (habit triggers and check-in times)
- daily-planner receives ALL upstream outputs and integrates

## Phase 3: SEQUENCE Output

**Execution DAG:**
```
Wave 1 (parallel):  nutrition-optimizer + workout-planner
                          |                    |
                          v                    v
Wave 2:              habit-builder (needs workout-planner output as "the routine")
                          |
                          v
Wave 3:              daily-planner (needs ALL upstream outputs)
```

**Critical path:** workout-planner -> habit-builder -> daily-planner (3 sequential skills)
**Estimated time:** Wave 1 (parallel, ~10 min each) + Wave 2 (~5 min) + Wave 3 (~10 min) = ~25 min total

## Phase 4: EXECUTE Output (abbreviated)

**Wave 1 results:**
- nutrition-optimizer: TDEE 2400, target 1775 cal/day, 180g protein / 60g fat / 155g carbs, 3 sample meal plans with quick-prep options
- workout-planner: 4x/week Upper/Lower split, 45-min sessions, home-friendly options (constraint: early AM or late PM)

**Wave 2 results:**
- habit-builder: Habit stack: "After I brush my teeth in the morning, I put on workout clothes" (cue). 2-minute version: put on clothes + do 5 push-ups. 30-day progression to full 45-min session. Weekend modification: same cue but flexible timing.

**Wave 3 results:**
- daily-planner: Integrated schedule with exercise at 5:30-6:15 AM, meal prep Sunday + Wednesday, family dinner at 6 PM (aligns with nutrition plan), evening review at 8:30 PM.

## Phase 5: SYNTHESIZE Output

### Unified Deliverable: "Fit and Productive in 90 Days"

**Executive summary:** You will eat at a 625 cal/day deficit (1775 cal target), exercise 4 mornings per week (Upper/Lower split, 45 min), build the habit through a 30-day progression starting with 2 minutes, and fit everything into your schedule around work (9-5) and family time (5:30-8 PM).

**Conflicts resolved:**
- Workout-planner suggested 4x/week at 60 min. Nutrition-optimizer's deficit means recovery may be slower. **Resolution:** Reduced to 45 min sessions, added one extra rest day if performance declines.
- Daily-planner initial schedule had meal prep conflicting with kids' bedtime routine. **Resolution:** Moved meal prep to Sunday morning (1 hour) + Wednesday after kids' bedtime (30 min).

**Consolidated action items (week 1):**
1. [ ] Calculate and set calorie target: 1775 cal/day
2. [ ] Grocery shop for Week 1 meal plan (list provided)
3. [ ] Set alarm for 5:15 AM Monday/Tuesday/Thursday/Friday
4. [ ] Put workout clothes by bed tonight (habit cue)
5. [ ] Week 1 exercise: 2-minute version only (habit anchor phase)
6. [ ] Download food tracking app, log meals for 7 days
7. [ ] Sunday: 1-hour meal prep session
8. [ ] Daily: evening review at 8:30 PM (habit check-in + plan tomorrow)
