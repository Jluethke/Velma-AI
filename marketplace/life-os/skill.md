# Life OS

The master life management skill. Continuously monitors all life domains (health, career, finances, relationships, learning, projects), scores each domain 1-10, detects imbalances and neglected areas, generates balanced weekly plans with micro-goals per domain, provides daily check-ins and weekly/monthly reviews, and orchestrates sub-skills (daily-planner, habit-builder, workout-planner, nutrition-optimizer, skill-acquisition-engine) into a unified, sustainable life operating system.

## Execution Pattern: ORPA Loop

## Inputs
- life_domains: array -- The user's active life domains with descriptions and importance weights. Default domains: health, career, finances, relationships, learning, projects/hobbies.
- current_state: object -- Self-assessment or data-driven snapshot of each domain (what's going well, what's struggling, recent events)
- goals: object -- Per-domain goals with timeframes (e.g., health: "lose 10 lbs in 3 months", career: "get promoted this year")
- schedule_constraints: object -- Non-negotiable time commitments (work hours, family obligations, commute, sleep requirements)
- active_skills: array -- Sub-skills currently available for orchestration (daily-planner, habit-builder, workout-planner, etc.)

## Outputs
- domain_scores: object -- Per-domain score (1-10) with trend direction, evidence, and composite life score
- weekly_plan: object -- Balanced weekly plan with time allocation per domain and micro-goals
- daily_checkins: object -- Daily check-in template with domain-relevant prompts
- monthly_review: object -- Monthly assessment with trend analysis, wins, losses, and strategy adjustments
- rebalancing_plan: object -- Specific actions to bring neglected domains above minimum thresholds

## Execution

### OBSERVE: Scan All Life Domains
**Entry criteria:** At least 3 life domains defined with some current state information.
**Actions:**
1. Define and validate the domain map. Default domains with descriptions:
   - **Health:** Physical fitness, nutrition, sleep, energy, mental health, stress management
   - **Career:** Job performance, skill development, professional relationships, income trajectory, satisfaction
   - **Finances:** Savings rate, debt, investments, budget adherence, financial security runway
   - **Relationships:** Partner, family, friendships, social connection, community involvement
   - **Learning:** New skills being acquired, intellectual growth, curiosity, reading, courses, practice
   - **Projects/Hobbies:** Personal projects, creative outlets, hobbies, things done purely for enjoyment
   - User can add, remove, or rename domains. Minimum 3 domains for meaningful balance analysis.
2. Gather current state per domain:
   - Score each domain 1-10 based on:
     - **Objective indicators** (if available): fitness metrics, bank balance, project completion rate
     - **Subjective assessment:** "How satisfied am I with this domain right now?"
     - **Trajectory:** Is this domain improving, stable, or declining? For how long?
   - Identify the highest-scoring and lowest-scoring domains
3. Calculate the "balance ratio":
   - Standard deviation of domain scores. Lower = more balanced.
   - Identify any domain below the "floor" (minimum acceptable score, default: 4/10).
   - Identify any domain absorbing disproportionate time relative to its importance weight.
4. Pull data from sub-skills if active:
   - From daily-planner: schedule adherence, task completion rates
   - From workout-planner: training consistency, performance trends
   - From nutrition-optimizer: calorie adherence, weight trend
   - From habit-builder: streak data, habit completion rates
   - From skill-acquisition-engine: learning progress, proficiency changes
5. Detect patterns:
   - Chronic neglect: domain below 4/10 for 3+ weeks
   - Overinvestment: domain at 9-10/10 absorbing >40% of discretionary time
   - Correlation: does domain X suffer when domain Y improves? (zero-sum pattern)
   - Seasonal patterns: do certain domains decline at predictable times?

**Output:** Domain scorecard (scores, trends, balance ratio), pattern detection results, sub-skill data integration.
**Quality gate:** Every domain has a score (1-10) and a trend direction (up/stable/down). Balance ratio is calculated. Any domain below floor is flagged. Any domain absorbing >40% of time is flagged.

### REASON: Diagnose and Prioritize
**Entry criteria:** Domain scorecard complete.
**Actions:**
1. Classify each domain by status:
   - **Critical (score 1-3):** Requires immediate attention. This domain is in crisis or has been neglected to the point of consequences.
   - **Below par (score 4-5):** Needs investment. Not crisis but declining or unsatisfying.
   - **Healthy (score 6-7):** Maintenance mode. Doing fine with current investment.
   - **Thriving (score 8-10):** Consider whether this domain is absorbing resources better spent elsewhere.
2. Apply the "floor principle":
   - No domain should stay below 4/10 for more than 2 weeks. The cost of a floor violation compounds (health collapse affects career, career collapse affects finances, etc.)
   - Priority: raise any sub-4 domain above floor FIRST, regardless of other goals.
3. Apply diminishing returns analysis:
   - A domain at 9/10 gains very little from additional investment. The same effort spent on a 4/10 domain produces far more life satisfaction improvement.
   - Exception: domains where the user is pursuing peak performance (athlete training, startup founder) may justify sustained high investment.
4. Map domain interactions:
   - **Synergies:** Exercise (health) improves energy for career. Learning new skills improves career. Strong relationships reduce stress (health).
   - **Conflicts:** Career overtime steals from relationships. Socializing steals from project work. Training steals from learning time.
   - Identify the highest-leverage intervention: which domain improvement would positively impact the most other domains?
5. Determine which sub-skills to activate per domain need:
   - Health below par -> activate workout-planner + nutrition-optimizer
   - Learning below par -> activate skill-acquisition-engine
   - General time management issues -> activate daily-planner
   - Trying to build new behaviors -> activate habit-builder

**Output:** Domain status classifications, floor violations, diminishing returns analysis, domain interaction map, sub-skill activation recommendations.
**Quality gate:** Every domain has a status classification. Floor violations are prioritized. At least one domain is identified as the highest-leverage intervention. Sub-skill activations are specific (not "use the planner" but "activate workout-planner with goal: 3x/week strength training, 45 min sessions").

### PLAN: Generate Balanced Weekly Plan
**Entry criteria:** Domain priorities and sub-skill activations identified.
**Actions:**
1. Allocate discretionary time across domains:
   - Calculate total discretionary hours per week: total waking hours - work - fixed commitments - basic maintenance (cooking, cleaning, commuting).
   - Assign minimum time blocks per domain:
     - Critical domains (sub-4): 20-30% of discretionary time until above floor
     - Below-par domains: 15-20% of discretionary time
     - Healthy domains: 10-15% (maintenance)
     - Thriving domains: 5-10% (coast)
   - Ensure allocation sums to 100% of discretionary time. If over-allocated, reduce thriving domains further or accept that some domains will be in maintenance mode.
2. Set micro-goals per domain for the week:
   - Each domain gets 1-3 specific, achievable goals for the week.
   - Critical domains: 2-3 concrete actions ("go to the gym 3 times," "have a 30-minute conversation with partner," "review bank statement and make a budget")
   - Healthy domains: 1 maintenance goal ("keep workout schedule," "attend team lunch")
   - Goals must be binary (done/not done) and specific enough to verify.
3. Integrate with sub-skills:
   - If daily-planner is active: feed the weekly time allocation into daily scheduling.
   - If workout-planner is active: the health micro-goals reference the workout program.
   - If nutrition-optimizer is active: meal plan aligns with health goals and schedule.
   - If habit-builder is active: habit check-ins are embedded in the daily routine.
   - If skill-acquisition-engine is active: learning time is blocked and curriculum is followed.
4. Schedule "domain days" -- each day has 1-2 priority domains:
   - Not every domain gets attention every day. That's unsustainable.
   - Example: Monday = Career + Health. Tuesday = Career + Learning. Wednesday = Career + Relationships. Thursday = Career + Health. Friday = Career + Projects. Weekend = Relationships + Health + Projects.
   - Career gets daily attention (it's typically the largest time commitment). Other domains rotate.
5. Schedule the weekly review: 30 min on Sunday. Non-negotiable. This is the ORPA loop re-entry point.

**Output:** Weekly plan with daily domain priorities, micro-goals per domain, time allocation, sub-skill integration map, review schedule.
**Quality gate:** Every active domain has at least one micro-goal. Time allocation sums to available discretionary hours. No domain below floor is scheduled for less than 15% of discretionary time. Weekly review is scheduled.

### ACT: Execute, Check In, and Review
**Entry criteria:** Weekly plan generated.
**Actions:**
1. Produce the daily check-in template (takes <3 minutes):
   - "Today's domain priorities: [domain 1], [domain 2]"
   - "Micro-goal progress: [list with checkboxes]"
   - "Energy level (1-5): ___"
   - "What went well today?"
   - "What got neglected and why?"
   - "Tomorrow's focus: ___"
2. Produce the weekly review template (30 min, Sunday):
   - Domain scorecard update: re-score each domain. Which went up? Which went down?
   - Micro-goal completion rate: how many of this week's goals were achieved?
   - Time allocation accuracy: did you actually spend time on what you planned?
   - Biggest win of the week (celebrate this)
   - Biggest miss of the week (understand why, not punish)
   - Next week's adjustments: which domain needs more/less attention?
   - Sub-skill data review: check fitness progress, nutrition adherence, learning milestones, habit streaks
3. Produce the monthly review template (60 min, last Sunday of month):
   - Domain score trends (4-week graph or table). Which domains improved? Which declined?
   - Goal progress: are you on track for longer-term goals (quarterly, annual)?
   - Pattern identification: do the same domains always score low? Why?
   - Life satisfaction composite: average of all domain scores weighted by importance
   - Quarterly goal setting: adjust 90-day goals based on what you've learned
   - Sub-skill evaluation: are the active skills helping? Should any be changed?
4. Re-enter OBSERVE: the weekly review naturally triggers the next ORPA cycle with updated data.

**Output:** Daily check-in template, weekly review template, monthly review template, or (on loop re-entry) updated domain scores and adjusted weekly plan.
**Quality gate:** Daily check-in takes <3 minutes. Weekly review covers all active domains. Monthly review includes trend analysis (not just point-in-time scores). Re-entry to OBSERVE has fresh data from the review.

## Exit Criteria
Life OS is a continuous loop -- it never fully exits while active. Each ORPA cycle completes when: (1) domain scores are updated, (2) a balanced weekly plan is produced, (3) daily check-in and review templates are delivered. The user may pause Life OS at any time; it resumes from the last known domain scores.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User hasn't scored domains (no self-assessment data) | Adjust -- provide guided self-assessment questions per domain to generate scores |
| OBSERVE | Sub-skill data unavailable (skills not active) | Skip sub-skill integration -- use self-reported data only |
| REASON | All domains are below floor (everything is in crisis) | Adjust -- pick the ONE domain that would most improve all others (usually health or finances) and focus entirely on it for 1-2 weeks |
| REASON | All domains are thriving (no imbalances) | Skip rebalancing -- focus on growth goals and peak performance optimization |
| PLAN | Insufficient discretionary time for all critical domains | Adjust -- audit commitments. Are any "non-negotiable" commitments actually negotiable? If truly no time: triage to 1-2 critical domains, let others coast |
| ACT | User stops doing check-ins after 1 week | Escalate -- simplify check-in to a single question ("What domain did you invest in today?") to reduce friction. Any data is better than no data |
| ACT | User rejects final output | **Targeted revision** -- ask which life domain assessment, priority ranking, or action plan fell short and rerun only that section. Do not regenerate the full life OS. |

## Reference

### The Wheel of Life Framework
A coaching tool that scores life domains 1-10 and visualizes them as a wheel. An unbalanced wheel (high scores in some areas, low in others) produces a bumpy ride -- even if the average score is decent.

**Key insight:** Life satisfaction correlates more with balance across domains than with the peak score in any single domain. A life scored [6,6,6,6,6,6] feels better than [10,10,2,2,3,3] despite a similar average.

### Domain Floor Theory
Every life domain has a minimum viable level below which consequences cascade:
- **Health below 3:** Energy drops, cognitive function declines, everything else suffers.
- **Finances below 3:** Stress about money dominates mental bandwidth, impairing all other domains.
- **Relationships below 3:** Loneliness and conflict create emotional drain.
- **Career below 3:** Financial pressure + identity crisis compound.

The floor is non-negotiable: no domain should stay below 4/10 for more than 2 weeks.

### Diminishing Returns in Life Domains
Going from 3 to 6 in any domain produces massive life satisfaction improvement. Going from 7 to 10 produces moderate improvement. Going from 9 to 10 produces minimal improvement at very high cost.

**Implication:** Stop optimizing domains at 8/10 and redirect effort to domains below 6/10. Exception: domains where you're pursuing excellence (professional athlete, startup founder).

### The Compound Effect of Small Daily Actions
- 1% improvement per day = 37x improvement over a year (compound growth)
- 1% decline per day = nearly zero after a year
- The micro-goals in Life OS harness this: small, daily actions in each domain compound into transformative change over months.

### Time Allocation Benchmarks (Discretionary Hours)
For a typical working adult with ~35 hours/week of discretionary time (after work, sleep, maintenance):

| Domain | Healthy Allocation | Crisis Allocation |
|---|---|---|
| Health | 5-7 hrs (exercise, cooking, self-care) | 8-10 hrs |
| Career (above work hours) | 3-5 hrs (learning, networking, side projects) | 2-3 hrs |
| Relationships | 5-8 hrs (partner, family, friends) | 3-5 hrs |
| Learning | 3-5 hrs | 2-3 hrs |
| Projects/Hobbies | 3-5 hrs | 1-2 hrs |
| Finances | 1-2 hrs (monthly budgeting, planning) | 3-5 hrs |
| Buffer/Rest | 5-7 hrs | 3-5 hrs |

### Sub-Skill Orchestration Map
```
Life OS (master)
  |
  +-- daily-planner: Receives weekly time allocation, outputs daily schedule
  |     Input from Life OS: domain priorities, micro-goals, time blocks
  |
  +-- habit-builder: Receives new behaviors to build, tracks streaks
  |     Input from Life OS: behaviors identified in REASON phase
  |
  +-- workout-planner: Receives fitness goals, outputs training program
  |     Input from Life OS: health domain goals + schedule constraints
  |
  +-- nutrition-optimizer: Receives health goals, outputs meal plan
  |     Input from Life OS: health domain goals + body stats
  |
  +-- skill-acquisition-engine: Receives learning goals, outputs curriculum
        Input from Life OS: learning domain goals + available time
```

Each sub-skill runs semi-independently but reports data back to Life OS for the weekly review. Life OS adjusts sub-skill parameters based on domain score changes.

### State Persistence
Life OS maintains a persistent life dashboard tracking:
- Domain scores over time (weekly snapshots) -- the core longitudinal dataset
- Micro-goal completion rates per domain per week
- Time allocation planned vs actual per domain
- Balance ratio trend (standard deviation of domain scores over time)
- Monthly composite life satisfaction score
- Sub-skill metrics aggregated (workout adherence, nutrition compliance, habit streaks, learning progress)
- Annual pattern data (which months/seasons show which domain declines)
