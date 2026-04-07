# Marathon Training Plan

Builds a complete marathon (or half-marathon) training program tailored to your current fitness, schedule, and race goals -- from couch-to-finish-line through competitive time targets. Covers periodized training phases, nutrition timing that actually works on long runs, injury prevention that goes beyond "stretch more," and a race-day strategy so you don't blow up at mile 20. Not a generic 16-week plan from a running magazine. This accounts for your life, your body, and the specific race you're running.

## Execution Pattern: Phase Pipeline

```
PHASE 1: BASELINE     --> Assess current fitness, running history, and race goals
PHASE 2: PERIODIZE    --> Build the training calendar with structured phases
PHASE 3: FUEL         --> Design nutrition and hydration strategy for training and race day
PHASE 4: BULLETPROOF  --> Injury prevention, recovery protocols, and strength work
PHASE 5: RACE DAY     --> Pacing strategy, logistics, and mental game plan
```

## Inputs
- running_background: object -- Current weekly mileage, longest recent run, years running, any race history (times, distances), current pace for easy runs and hard efforts
- race_details: object -- Target race (marathon or half), specific race name/date if known, course profile (flat, hilly, altitude), weather expectations, and time goal (or just finish)
- available_time: object -- Days per week available for running (be honest), longest run day (usually Saturday or Sunday), available time per weekday session, cross-training availability
- health_status: object -- Current injuries or pain, injury history (especially knees, IT band, plantar fascia, shin splints), any medical conditions affecting training, current body weight if relevant to goals
- lifestyle_context: object -- (Optional) Work schedule, family commitments, travel frequency, stress level, sleep quality. Training doesn't happen in a vacuum

## Outputs
- training_calendar: object -- Week-by-week plan with daily workouts, mileage targets, workout types, and rest days across all training phases
- nutrition_plan: object -- Daily fueling guidelines, long-run nutrition protocol, race-day nutrition timeline, and hydration strategy
- injury_prevention: object -- Strength exercises, mobility work, warning signs, and adjustment protocols
- race_strategy: object -- Mile-by-mile pacing plan, fueling schedule, mental checkpoints, and contingency plans
- recovery_protocol: object -- Post-run recovery, adaptation week structure, and post-race recovery plan

## Execution

### Phase 1: BASELINE
**Entry criteria:** Person has decided to train for a marathon or half-marathon and has a realistic timeline.
**Actions:**
1. Assess current running fitness honestly:
   - **Beginner (0-10 miles/week):** Can run 3 miles continuously. Needs 20-24 weeks minimum for a marathon, 12-16 for a half. Goal is finishing, not time.
   - **Intermediate (15-25 miles/week):** Runs regularly, has completed shorter races. 16-20 weeks for marathon. Can target a specific time.
   - **Experienced (30+ miles/week):** Consistent training history, previous race experience. 12-18 weeks for a PR-focused plan.
   If someone can't currently run 3 miles without stopping, they need a pre-training base-building phase before starting a marathon plan.
2. Establish current pace benchmarks:
   - Easy run pace (conversational, could talk in full sentences)
   - Tempo pace (comfortably hard, could say a few words)
   - Race pace estimate (use a recent 5K or 10K time and a pace calculator, or use the "add 60-90 seconds to tempo pace" rule for marathon pace)
   Don't skip this -- training without pace zones is just running randomly.
3. Calculate the training timeline. Count backwards from race day:
   - 2-3 week taper before the race (non-negotiable)
   - 10-16 weeks of build phase
   - 2-4 weeks of base building if current mileage is low
   If the math doesn't work (race is in 8 weeks and you run 10 miles/week), be honest: you're not ready for this race. Pick a later one or switch to the half-marathon.
4. Identify risk factors: previous injuries (they tend to come back under increased mileage), age-related recovery needs (runners over 40 need more recovery between hard efforts), schedule constraints that create back-to-back hard days, and any history of overtraining.
5. Set the specific goal: "finish the marathon" is a valid goal. "Break 4 hours" is a valid goal. "Run the whole thing without walking" is a valid goal. Make it specific, because the training plan is built backwards from this goal.

**Output:** Fitness assessment with pace zones, training timeline, risk profile, and specific race goal.
**Quality gate:** Pace zones are based on actual running data, not aspiration. Timeline is realistic for current fitness. Risk factors are documented. Goal is specific and achievable within the timeline.

### Phase 2: PERIODIZE
**Entry criteria:** Baseline assessment complete with pace zones and timeline.
**Actions:**
1. Structure the training into distinct phases:
   - **Base Phase (3-6 weeks):** Build weekly mileage gradually. Increase total weekly volume by no more than 10% per week. All runs at easy pace. Focus: teach the body to handle consistent running volume without breaking.
   - **Build Phase (6-10 weeks):** Introduce workout variety: one long run, one speed/tempo session, one medium-effort run per week. Continue increasing total mileage. This is where fitness actually develops.
   - **Peak Phase (2-4 weeks):** Highest mileage weeks. Longest long runs (18-22 miles for marathon, 12-15 for half). Race-specific workouts. This is the hardest period -- fatigue is high, confidence might be low. That's normal.
   - **Taper Phase (2-3 weeks):** Reduce volume by 20-25% per week. Maintain intensity but cut duration. The body is absorbing all the training. You'll feel sluggish, cranky, and convinced you're losing fitness. You're not.
2. Design the weekly structure. For a 4-day/week runner:
   - Monday: Rest
   - Tuesday: Easy run
   - Wednesday: Rest or cross-train
   - Thursday: Quality workout (tempo, intervals, or race-pace)
   - Friday: Rest
   - Saturday: Long run
   - Sunday: Easy recovery run or rest
   For 5-6 day runners, add easy mileage, not more hard days. Never schedule hard efforts on consecutive days.
3. Program the long run progression. The long run is the cornerstone of marathon training:
   - Start at current longest comfortable distance
   - Add 1-2 miles every 1-2 weeks
   - Every 3rd or 4th week, cut the long run back by 20-30% (recovery week)
   - Peak long run: 20-22 miles for marathon (3-4 weeks before race), 13-15 miles for half
   - Long runs should be 60-90 seconds per mile SLOWER than goal race pace. Running long runs too fast is the most common training mistake.
4. Design key workouts for the build and peak phases:
   - **Tempo runs:** 20-40 minutes at tempo pace (comfortably hard). Builds lactate threshold.
   - **Intervals:** 800m-1600m repeats at faster-than-race-pace with recovery jogs. Builds speed and VO2max.
   - **Marathon-pace runs:** 8-14 miles at goal race pace. Teaches the body what race day feels like. Include these starting 8 weeks out.
   - **Progression runs:** Start easy, finish at tempo or race pace. Simulates the late-race effort on tired legs.
5. Build in recovery weeks. Every 3rd or 4th week, reduce total mileage by 20-30%. Same workout types, just shorter. This is where adaptation actually happens -- you get stronger during recovery, not during hard efforts. Skipping recovery weeks leads to breakdown.

**Output:** Complete week-by-week training calendar with daily workouts, pace targets, mileage totals, recovery weeks, and phase transitions.
**Quality gate:** Mileage never increases more than 10% week-over-week. Recovery weeks are scheduled every 3-4 weeks. No consecutive hard days. Long run peaks 3-4 weeks before race. Taper is included and non-negotiable.

### Phase 3: FUEL
**Entry criteria:** Training calendar built.
**Actions:**
1. Establish daily nutrition baselines:
   - Running burns approximately 80-100 calories per mile (varies by body weight and efficiency)
   - Training days need 300-600 additional calories above maintenance, depending on mileage
   - Carbohydrates: 3-5 grams per kg of body weight on easy days, 5-7 g/kg on hard/long days, 7-10 g/kg during peak training weeks
   - Protein: 1.4-1.7 grams per kg for recovery and muscle maintenance
   - Don't restrict calories during marathon training. Now is not the time to diet. You need fuel.
2. Design the long-run fueling protocol:
   - Runs under 60 minutes: water only (no fuel needed)
   - Runs 60-90 minutes: water plus optional sports drink
   - Runs over 90 minutes: 30-60 grams of carbs per hour from gels, chews, or real food (dates, gummy bears, pretzels work fine)
   - Practice fueling on EVERY long run. Race day is not the time to try a new gel brand. Your stomach needs training just like your legs.
3. Build the pre-run eating schedule:
   - 2-3 hours before: moderate meal with carbs and some protein (oatmeal, toast with peanut butter, rice bowl)
   - 30-60 minutes before: small carb snack if needed (banana, few crackers)
   - Nothing new on race day. Eat what you've practiced.
4. Create the race-week carb-loading plan (marathon only):
   - 3-4 days before race: increase carb intake to 8-10 g/kg body weight
   - This doesn't mean eat pizza until you're sick. It means increasing carb proportion while keeping total calories reasonable
   - Reduce fiber 2 days before the race (you'll thank this advice at mile 15)
   - Last big meal: lunch the day before, not dinner. Dinner should be moderate and familiar.
5. Hydration strategy:
   - Daily: half your body weight in ounces as a baseline, more in heat
   - During runs: 4-8 ounces every 15-20 minutes in warm weather (practice this -- overhydration is as dangerous as dehydration)
   - Post-run: 16-24 ounces per pound of body weight lost during the run
   - Electrolytes matter for runs over 60 minutes, especially in heat. Sodium is the main one. Salt tabs or electrolyte mix, not just water.

**Output:** Daily nutrition guidelines by training phase, long-run fueling protocol with specific products and timing, pre-run and race-week eating plans, and hydration strategy.
**Quality gate:** Calorie and carb targets are specific to body weight and training volume. Long-run fueling is practiced before race day. Race-week nutrition includes carb-loading timeline. Hydration includes electrolyte strategy.

### Phase 4: BULLETPROOF
**Entry criteria:** Training calendar and nutrition plan in place.
**Actions:**
1. Build the strength routine (2x per week, 20-30 minutes). This isn't bodybuilding -- it's keeping the machine from breaking:
   - **Glutes:** Single-leg bridges, clamshells, monster walks with band. Weak glutes are behind most running injuries (IT band, knee pain, hip drop).
   - **Core:** Planks, dead bugs, bird dogs, side planks. Not crunches -- running core stability is about anti-rotation, not flexion.
   - **Calves and feet:** Single-leg calf raises (straight and bent knee), toe yoga, arch strengthening. Your calves absorb 6-8x your body weight every step.
   - **Hip stability:** Single-leg squats to a box, lateral lunges, step-downs. Control the knee tracking inward.
2. Design the mobility routine (10 minutes daily):
   - Hip flexor stretch (they get tight from sitting AND running)
   - Hamstring mobility (not static stretching before runs -- dynamic only pre-run)
   - Ankle circles and calf stretches
   - Thoracic spine rotation (upper back mobility affects breathing)
   - Foam rolling: IT band, quads, calves, glutes. Not a massage -- a maintenance tool. If it's too painful, you waited too long.
3. Establish the warning sign system. Catch injuries at the "something feels off" stage, not the "I can't run" stage:
   - **Green light:** Normal post-run soreness that fades within 24 hours. Train as planned.
   - **Yellow light:** Pain that appears during runs but goes away after, or that's present when you wake up but fades. Reduce mileage by 25%, skip the next hard workout, add extra recovery work.
   - **Red light:** Pain that gets worse during a run, that changes your gait, or that's present outside of running. Stop running. Ice, rest, see a sports medicine doctor or PT if it doesn't improve in 5-7 days.
4. Address the most common marathon training injuries proactively:
   - **Runner's knee (patellofemoral pain):** Usually weak glutes or tight quads. Strengthen glutes, foam roll quads, shorten stride slightly.
   - **IT band syndrome:** Foam roll, strengthen hip abductors, check shoe wear pattern.
   - **Plantar fasciitis:** Roll a frozen water bottle under the foot, calf raises, check shoe support, don't increase mileage too fast.
   - **Shin splints:** Usually too much too soon. Back off mileage, run on softer surfaces, strengthen calves.
5. Recovery protocol for after every run:
   - Walk 5-10 minutes to cool down (don't just stop)
   - Refuel within 30-60 minutes (carbs + protein)
   - Easy foam rolling or stretching after hard efforts
   - Sleep 7-9 hours -- this is when adaptation happens. Chronic sleep debt sabotages training more than missed workouts.

**Output:** Strength routine with exercises, sets, and frequency, mobility routine, warning sign traffic light system, common injury prevention strategies, and recovery protocols.
**Quality gate:** Strength exercises target the specific muscles that fail in runners. Warning system has clear action steps at each level. Recovery protocol is realistic (not "ice bath after every run").

### Phase 5: RACE DAY
**Entry criteria:** Training complete, taper underway or finished.
**Actions:**
1. Build the pacing strategy:
   - **Negative split (recommended):** Run the first half 30-60 seconds per mile slower than goal pace. Run the second half at or slightly faster than goal pace. This feels wrong at the start. You'll feel like you're holding back. That's exactly right. The marathon is won or lost in miles 18-24, not miles 1-8.
   - **Even split:** Run every mile at the same pace. Requires excellent self-awareness and discipline. Better for experienced racers.
   - **Never positive split:** Starting fast and slowing down. This is not a strategy -- it's what happens when you don't have one. The wall at mile 20 is mostly pacing failure, not fitness failure.
2. Create the mile-by-mile plan with expected splits, aid station locations (from the race map), fueling points, and mental checkpoint mantras. Know when to expect hard patches (miles 16-20 are almost always the toughest) and have a plan for them.
3. Race-day logistics:
   - Lay out everything the night before: race bib, pins, shoes, socks, fuel, outfit, throwaway warm layers for the start
   - Eat the planned pre-race meal 2-3 hours before start time
   - Arrive 60-90 minutes before the start for parking, port-a-potties (the line is always longer than you expect), warm-up
   - Start in the correct corral. Lining up too far forward means dodging faster runners. Too far back means weaving through crowds.
4. Weather contingency plans:
   - **Hot (above 65F/18C at start):** Slow your goal pace by 1-2 minutes per mile. Pour water on your head at aid stations. Prioritize electrolytes. Accept the adjusted goal -- fighting heat is a losing battle.
   - **Cold (below 40F/4C):** Dress for 15-20 degrees warmer than the temperature (you heat up fast). Throwaway layers at the start. Keep hands and ears warm -- they lose heat first.
   - **Rain:** Vaseline everywhere clothing meets skin (anti-chafe). Wear a billed hat. Avoid cotton. Rain actually keeps you cool -- embrace it.
   - **Wind:** Tuck behind other runners when possible. Expect slower splits into the wind and faster with it. Don't chase pace into a headwind.
5. Mental game strategy:
   - Break the race into thirds: miles 1-10 (hold back, feel easy), miles 10-20 (settle in, stay disciplined), miles 20-26.2 (this is the real race -- everything before was the warmup)
   - When it hurts (it will): count steps in sets of 100, focus on the next aid station, break remaining distance into smaller chunks ("just 10 more minutes")
   - The bad patch is temporary. Almost every marathoner hits a wall or a low point, and almost every one comes out the other side. Keep moving forward.

**Output:** Mile-by-mile pacing plan, fueling schedule mapped to aid stations, logistics checklist, weather contingency adjustments, and mental game framework.
**Quality gate:** Pacing plan starts conservatively. Fueling points match aid station locations. Logistics include a timing plan for race morning. Weather adjustments are pre-planned, not reactive. Mental strategy has specific techniques, not just "stay positive."

## Exit Criteria
Done when: (1) training calendar covers every week from now through race day with specific workouts, (2) nutrition plan covers daily eating, long-run fueling, and race-week carb loading, (3) injury prevention includes strength work, mobility, and a warning sign system, (4) race-day strategy has pacing, fueling, logistics, and weather contingencies, (5) recovery weeks and taper are built in and non-negotiable.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| BASELINE | Person's goal time is unrealistic for current fitness | Adjust -- use race pace calculators based on recent shorter race times. Set an A goal (dream), B goal (realistic), and C goal (finish and enjoy it) |
| PERIODIZE | Person can only run 3 days/week | Adjust -- 3 quality days is enough for a half-marathon and a finish-focused marathon. Make each day count: one long run, one quality workout, one easy run. Add cross-training (cycling, swimming) for aerobic benefit without impact |
| PERIODIZE | Life disrupts training (illness, travel, family emergency) | Adjust -- if you miss less than 2 weeks, pick up where you left off with slightly reduced paces. If you miss 2-4 weeks, step back one phase. If you miss 4+ weeks, reassess the race timeline |
| FUEL | Runner has GI issues during long runs | Adjust -- test different fuel types (some stomachs reject gels but handle real food). Reduce pre-run fiber and fat. Try fueling earlier in the run in smaller amounts. Seriously: practice this in training |
| BULLETPROOF | Injury develops during training | Adjust -- follow the traffic light system. Yellow: reduce volume, increase recovery work, substitute with cross-training. Red: stop running, see a professional, and be honest about whether the race timeline is still viable |
| RACE DAY | Weather conditions are extreme on race day | Adjust -- throw out the time goal. Run for finish and enjoyment. Extreme heat or cold changes everything -- accept it before the gun goes off, not at mile 18 |

## State Persistence
- Weekly mileage and workout completion log
- Pace progression over training (easy pace, tempo pace, long run pace)
- Long-run fueling notes (what worked, what didn't, GI issues)
- Injury/pain tracking with traffic light status
- Body weight and sleep data trends
- Race results and post-race analysis
- Shoe mileage tracking (replace every 300-500 miles)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
