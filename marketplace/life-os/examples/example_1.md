# Example: Rebalancing an Overworked Founder

## Input
```
life_domains: ["health", "career", "finances", "relationships", "learning", "projects"]
current_state: {
  "health": { "score": 3, "notes": "Haven't exercised in 2 months, eating fast food, sleeping 5-6 hours, back pain starting" },
  "career": { "score": 9, "notes": "Startup growing 20% MoM, just closed Series A, working 70-hour weeks" },
  "finances": { "score": 7, "notes": "Good salary + equity, saving 15%, no debt, but haven't reviewed investments in months" },
  "relationships": { "score": 4, "notes": "Partner frustrated by work hours, haven't seen friends in 6 weeks, missed nephew's birthday" },
  "learning": { "score": 5, "notes": "Learning on the job but no deliberate skill building outside of work" },
  "projects": { "score": 2, "notes": "Used to play guitar and work on a personal blog. Haven't touched either in 4 months" }
}
goals: {
  "health": "Get back to exercising 3x/week, fix sleep",
  "career": "Maintain growth trajectory, delegate more",
  "relationships": "Weekly date night, monthly friend hangout",
  "learning": "Learn fundraising/board management (new skills for Series A stage)"
}
schedule_constraints: { "work": "8am-6pm weekdays (often extends to 9pm)", "commute": "15 min each way" }
active_skills: ["daily-planner", "workout-planner", "habit-builder"]
```

## OBSERVE Output

**Domain Scorecard:**
| Domain | Score | Trend | Status |
|---|---|---|---|
| Health | 3/10 | DOWN | CRITICAL (below floor) |
| Career | 9/10 | UP | Thriving (possible overinvestment) |
| Finances | 7/10 | STABLE | Healthy |
| Relationships | 4/10 | DOWN | CRITICAL (at floor) |
| Learning | 5/10 | STABLE | Below par |
| Projects/Hobbies | 2/10 | DOWN | CRITICAL (below floor) |

**Balance ratio:** Standard deviation = 2.6 (HIGH imbalance. Healthy target: <1.5)
**Composite life satisfaction:** 5.0/10 (despite career being 9/10)

**Pattern detection:**
- **Overinvestment:** Career is absorbing ~70% of waking hours. Classic founder trap.
- **Floor violations:** Health (3), Projects (2) below floor. Relationships (4) at floor.
- **Cascade risk:** Health at 3 is unsustainable. Back pain + sleep deprivation will eventually crash career performance.
- **Zero-sum pattern:** Career UP correlates perfectly with Relationships DOWN and Health DOWN.

## REASON Output

**Priority diagnosis:**
1. **Health is the highest-leverage intervention.** Fixing sleep and exercise will improve energy, cognitive function, and mood -- which improves career performance, relationship quality, and everything else. Health is the foundation domain.
2. **Relationships need immediate triage.** Partner frustration is approaching a breaking point. One weekly date night is a small time investment with enormous return.
3. **Career needs boundaries, not more time.** At 70 hours/week, the founder is past the point of diminishing returns. Going from 70 to 55 hours probably produces the same output with better decision-making (due to sleep and reduced burnout).
4. **Projects can stay low for now.** Guitar and blogging are nice but not urgent. Flag for attention once health and relationships stabilize.

**Sub-skill activations:**
- workout-planner: 3x/week, 30-minute sessions (founder doesn't have time for more), home workouts (no commute to gym), morning slot before work
- habit-builder: Target habit = "sleep by 11 PM." Cue: 10:30 PM alarm. Two-minute version: put phone in another room at 10:30.
- daily-planner: Build a schedule that hard-blocks: sleep 11PM-7AM, exercise 7-7:30 AM M/W/F, date night Thursday 7-9 PM

## PLAN Output: This Week's Plan

**Time allocation (35 hrs discretionary, reclaimed by setting work boundary at 6 PM):**
| Domain | Hours | Micro-goals |
|---|---|---|
| Health | 5 hrs | Exercise 3x (M/W/F 7-7:30 AM). Sleep by 11 PM every night. Cook dinner 3 nights (not fast food). |
| Career | 8 hrs (above work hours) | Identify 2 tasks to delegate this week. Leave by 6 PM at least 3 days. |
| Relationships | 4 hrs | Thursday date night 7-9 PM. Call one friend this week (20 min). Text nephew (5 min). |
| Learning | 2 hrs | Read one chapter of fundraising book (Saturday morning). |
| Finances | 1 hr | 30-min investment review Saturday. |
| Projects | 0 hrs | Paused this week. Revisit in 2 weeks. |
| Buffer/Rest | 15 hrs | Weekend downtime, evening wind-down |

**Domain day map:**
- Monday: Health (morning workout) + Career
- Tuesday: Career + Relationships (text/call)
- Wednesday: Health (morning workout) + Career
- Thursday: Career + Relationships (date night)
- Friday: Health (morning workout) + Career (leave at 5 PM)
- Saturday: Learning (morning) + Finances (afternoon) + Rest
- Sunday: Rest + Weekly review (30 min)

**Sub-skill integration:**
- workout-planner output: 3x30min bodyweight home workout (push-ups, squats, planks, pull-ups). No gym commute needed.
- habit-builder output: "After the 10:30 PM alarm sounds, I will place my phone on the charger in the kitchen and go to the bedroom."
- daily-planner output: Receives the above time blocks and builds a detailed daily schedule.

## ACT Output

### Daily Check-in (takes 2 minutes)
```
Date: ___
Today's domain priorities: _____, _____
[ ] Exercise done? (if scheduled)
[ ] Left work by 6 PM?
[ ] Sleep by 11 PM?
[ ] Relationship action? (what: ___)
Energy level (1-5): ___
One thing that went well: ___
One thing to adjust: ___
```

### Weekly Review Template (Sunday, 30 min)
1. **Score update:**
   | Domain | Last Week | This Week | Trend |
   |---|---|---|---|
   | Health | 3 | ? | |
   | Career | 9 | ? | |
   | Relationships | 4 | ? | |
   | ... | | | |

2. **Micro-goal completion:**
   - Health: exercised ___/3 times, slept by 11 ___/7 nights, cooked ___/3 dinners
   - Career: delegated ___/2 tasks, left by 6 PM ___/3 days
   - Relationships: date night (Y/N), called friend (Y/N), texted nephew (Y/N)
   - Learning: read chapter (Y/N)
   - Finances: reviewed investments (Y/N)

3. **Reflection:** What domain improved the most? What still needs attention? Am I actually leaving work at 6 PM? If not, what's blocking me?

4. **Next week adjustments:** (feed into next ORPA cycle)

### First Month Projection
If the founder executes this plan for 4 weeks:
- Health: 3 -> 5 (regular exercise, better sleep, back pain reducing)
- Career: 9 -> 8 (slightly less time but delegation improves leverage)
- Relationships: 4 -> 6 (weekly date night + monthly friend hangout restores connection)
- Balance ratio: 2.6 -> ~1.8 (significant improvement)
- Composite: 5.0 -> 6.0+ (20%+ life satisfaction improvement by reallocating ~15 hours from career to other domains)
