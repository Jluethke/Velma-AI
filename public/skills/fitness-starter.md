# Fitness Starter

Builds a beginner-friendly, 4-week exercise plan for people who have not worked out in years, have never exercised regularly, or are restarting after injury, illness, or a long break. Takes age, current activity level, physical limitations (bad knees, back problems, shoulder issues), available equipment (none, home basics, full gym), and realistic time commitment. Produces a gradual ramp-up plan designed so the user will not get injured, will not be so sore they quit, and will actually feel good enough to keep going. Every exercise includes plain-English form cues -- no gym jargon, no assumed knowledge. Progression milestones are built in so the user can see they are making progress even when it does not feel like it. This is for the "I know I should exercise but I don't know where to start" crowd.

## Execution Pattern: ORPA Loop

## Inputs
- age_range: string -- Approximate age bracket (e.g., "30s," "mid-50s," "early 70s") -- affects exercise selection and recovery expectations
- current_activity: string -- Honest assessment of current activity level: "completely sedentary," "I walk sometimes," "active job but no exercise," "used to be fit, haven't done anything in years"
- limitations: array -- Physical issues that affect exercise: bad knees, lower back pain, shoulder injury, arthritis, balance concerns, recent surgery, chronic conditions (diabetes, heart condition -- recommend doctor clearance). Be specific: "left knee hurts going down stairs" is more useful than "bad knees"
- equipment: string -- What they have access to: "nothing" (bodyweight only), "home basics" (resistance bands, light dumbbells, yoga mat), "full gym," or specific items they own
- time_commitment: object -- How many days per week they can realistically commit (not aspirationally) and how many minutes per session. Honest answers only: "3 days, 20 minutes" beats "every day for an hour" that will never happen
- goals: array -- (Optional) What they want from exercise: "feel less tired," "lose weight," "be able to play with my grandkids," "stop my back from hurting," "just get moving." Vague is fine

## Outputs
- four_week_plan: object -- Week-by-week plan with specific daily workouts, rest days, and progression notes
- exercise_library: array -- Every exercise used in the plan with name, plain-English description, form cues, common mistakes, and modifications for limitations
- warm_up_routine: object -- Standard warm-up sequence used before every workout
- cool_down_routine: object -- Standard cool-down and stretch sequence used after every workout
- progress_milestones: array -- Measurable markers at week 1, 2, 3, and 4 so the user can see improvement
- what_comes_next: object -- Brief guidance for week 5 and beyond so the plan does not end in a cliff

## Execution

### OBSERVE: Understand the Starting Point
**Entry criteria:** Age range and current activity level are provided.
**Actions:**
1. Assess the true starting point without judgment. "Completely sedentary for 5 years" is just data -- it tells us where to begin, not what someone is worth. The plan must start below where the user thinks they should start. If someone says "I can probably handle 30 minutes," plan for 15.
2. Map all physical limitations to specific movement categories:
   - **Knee issues:** Avoid deep squats, lunges, jumping, excessive stair work. Substitute: chair sits, wall sits, leg extensions, swimming.
   - **Back pain:** Avoid heavy loading of the spine, crunches, toe touches. Substitute: bird-dogs, dead bugs, bridges, planks (modified).
   - **Shoulder problems:** Avoid overhead pressing, behind-the-neck movements. Substitute: front raises within pain-free range, resistance band pulls.
   - **Balance concerns:** All standing exercises near a wall or sturdy chair. No single-leg work initially.
   - **Arthritis:** Emphasize range-of-motion work, low-impact movement, avoid high-repetition joint stress.
3. Build the equipment-based exercise pool:
   - **No equipment:** Walking, chair exercises, wall push-ups, bodyweight squats (or sit-to-stand), step-ups on a stair, floor stretches.
   - **Home basics:** Add resistance band exercises, light dumbbell work (2-8 lbs to start), yoga mat floor work.
   - **Full gym:** Add machines (excellent for beginners -- they guide your form), cable exercises, recumbent bike, elliptical.
4. Set realistic time blocks. If the user has 20 minutes: 3-minute warm-up, 12-14 minutes of work, 3-4 minutes cool-down. Every second is planned.
5. If the user has a heart condition, diabetes, is over 65, or has had recent surgery, include a note: "Check with your doctor before starting. Show them this plan -- they can adjust anything that needs adjusting."

**Output:** Starting fitness profile: true baseline, limitation map with exercise substitutions, exercise pool filtered by equipment, time blocks, medical clearance note if applicable.
**Quality gate:** Every listed limitation has at least 2 safe alternative exercises. The starting intensity is deliberately easy -- the user should finish week 1 thinking "that wasn't so bad."

### REASON: Design the Progression
**Entry criteria:** Fitness profile complete with exercise pool and limitations mapped.
**Actions:**
1. Design the 4-week progression. The principle: start embarrassingly easy, build so gradually the user barely notices. Soreness and failure kill motivation for beginners.
   - **Week 1 -- Just Show Up:** 2-3 sessions, 15-20 minutes each. Goal is to establish the routine, not challenge the body. Intensity should feel like 3-4 out of 10. The user should finish feeling "I could have done more." That is the point.
   - **Week 2 -- Build Confidence:** 3 sessions, 20-25 minutes. Add one new exercise per session. Slightly increase reps or duration. Intensity 4-5 out of 10. Introduce the concept of tracking (write down what you did).
   - **Week 3 -- Find a Rhythm:** 3-4 sessions, 25-30 minutes. Increase to moderate effort on half the exercises. Add light resistance if using bodyweight only (water bottles, canned goods as weights). Intensity 5-6 out of 10.
   - **Week 4 -- See Progress:** 3-4 sessions, 25-30 minutes. Milestone assessment: compare to week 1. Can you do more reps? Hold a plank longer? Walk further? This is where motivation converts from "I should" to "I can."
2. Select exercises for each session. Every session follows the same structure:
   - Warm-up (always the same -- predictability reduces anxiety)
   - 4-6 exercises covering: legs, upper body push, upper body pull, core, and one "move your whole body" exercise (walking, marching, stepping)
   - Cool-down and stretch (always the same)
3. For each exercise, determine starting volume:
   - Bodyweight: 8-10 reps or 15-20 seconds holds. 1-2 sets. Rest as long as needed.
   - Resistance: lightest available weight, 8-10 reps, 1-2 sets.
   - Cardio: start at comfortable pace for 5-10 minutes. No breathlessness targets.
4. Build in rest days. Beginners need more recovery. Never schedule more than 2 consecutive days of exercise. At least 2 full rest days per week in weeks 1-2.
5. Design the milestone checkpoints:
   - **End of Week 1:** "I completed 2-3 sessions." (The milestone IS showing up.)
   - **End of Week 2:** "I can do X reps of [exercise] vs Y reps in week 1." (First measurable improvement.)
   - **End of Week 3:** "My [limitation] feels a bit better during exercise." or "I recovered faster today."
   - **End of Week 4:** Side-by-side comparison of week 1 vs week 4 numbers. Include non-exercise wins: sleeping better, more energy, less stiffness in the morning.

**Output:** Complete 4-week plan structure with weekly goals, session outlines, exercise selections, volume targets, rest days, milestones.
**Quality gate:** Week 1 is genuinely easy (a fit person would find it trivial -- that is correct). No week increases volume by more than 20-25% from the previous week. Every exercise respects the limitation map. Rest days are adequate.

### PLAN: Write the Exercise Instructions
**Entry criteria:** 4-week plan structure is finalized with exercise selections.
**Actions:**
1. Write the universal warm-up routine (used before every session):
   - 30 seconds gentle marching in place
   - 30 seconds arm circles (small to big)
   - 30 seconds torso twists (hands on hips, rotate gently)
   - 30 seconds hip circles
   - 30 seconds knee lifts (hold a chair if needed)
   - Modify for limitations: skip any movement that aggravates a known issue, replace with gentle range-of-motion for that area.
2. Write each exercise with this format:
   - **Name:** Plain English. "Chair Sit-to-Stand" not "Box Squats."
   - **What it works:** In simple terms. "Strengthens your legs and helps you get up from chairs more easily."
   - **How to do it:** Step by step, assuming zero gym knowledge.
     - Starting position: exactly where to put your feet, hands, body.
     - The movement: what moves and what stays still. Use visual cues: "imagine you're sitting down into a chair, then standing back up."
     - Breathing: "breathe out as you push up, breathe in as you lower down."
   - **Form cues (the important part):**
     - What correct form looks like: "Your knees should point the same direction as your toes."
     - What to avoid: "Don't let your knees cave inward. Don't lean way forward."
     - The one thing to focus on: "Think about pushing through your heels, not your toes."
   - **Common mistakes:** The things beginners always get wrong, and why they matter.
   - **Easier version:** How to make it less challenging if the standard version is too hard. Every exercise must have an easier option.
   - **Harder version:** How to progress when ready (but labeled "for later -- not yet").
3. Write the cool-down routine (used after every session):
   - 60 seconds slow walking or marching (bring heart rate down)
   - 4-5 gentle stretches held 20-30 seconds each, targeting the muscles used
   - Deep breathing: 5 slow breaths to finish
4. Write the "What Comes Next" section for after week 4:
   - Repeat week 4 for another 2 weeks if it still feels challenging.
   - When week 4 feels comfortable, increase to the "harder versions" of 1-2 exercises per session.
   - Consider adding 5 minutes of walking on rest days.
   - The next goal: "maintain this for 3 months. That's when it becomes a habit, not a chore."

**Output:** Complete exercise library with plain-English instructions, warm-up routine, cool-down routine, what-comes-next guidance.
**Quality gate:** Instructions are clear enough that someone with no fitness background can follow them without a video. Every exercise has an easier modification. No jargon is used without explanation.

### ACT: Deliver the Complete Plan
**Entry criteria:** All plan components are written and validated.
**Actions:**
1. Present the plan in a structured, non-overwhelming format. Lead with encouragement, not a wall of text:
   - Start with: "Here's your plan. Week 1 is intentionally easy. Trust the process."
   - Present one week at a time if requested, rather than dumping all 4 weeks.
2. For each workout day, show:
   - Day and session number ("Week 1, Day 1 -- Tuesday")
   - Warm-up reminder (with link/reference to the warm-up routine)
   - Exercise list with sets, reps, and rest
   - Cool-down reminder
   - Estimated total time
3. Highlight the milestone checkpoints at the end of each week.
4. Include practical tips for sticking with it:
   - "Put your workout clothes out the night before."
   - "Same time each day if possible. Routine beats motivation."
   - "If you miss a day, do the next one. Don't restart the week."
   - "Soreness the next day is normal. Pain during exercise is not. Stop if something hurts."
5. Address the inner critic directly: "You might feel silly doing 8 squats when the internet says you should be doing 50. Ignore the internet. You are building a foundation. The people doing 50 started where you are right now."
6. If re-entering the loop after week 4 (user wants to continue), assess progress and build weeks 5-8 with modest increases.

**Output:** Complete 4-week beginner fitness plan with exercise library, warm-up and cool-down routines, milestones, practical tips, and continuation guidance.
**Quality gate:** The plan feels doable, not intimidating. Every exercise is safe for stated limitations. The tone is encouraging without being condescending. The user knows exactly what to do on day 1.

## Exit Criteria
Done when: (1) a 4-week plan is generated matching the user's limitations, equipment, and time, (2) every exercise has plain-English instructions with modifications, (3) warm-up and cool-down routines are included, (4) progress milestones are defined for each week, (5) continuation guidance is provided.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User lists many serious limitations (bad knees, bad back, bad shoulders) | Adjust -- build a chair-based and floor-based routine. If limitations are severe enough to exclude most exercises, recommend starting with a physical therapist who can design a safe program |
| OBSERVE | User has a heart condition or recent surgery | Escalate -- insist on doctor clearance before starting. Provide the plan but label it "pending your doctor's approval. Show them this plan." |
| OBSERVE | User says they have "no time" (less than 10 minutes) | Adjust -- design 10-minute micro-sessions: warm-up (2 min), 3 exercises (6 min), cool-down (2 min). Something beats nothing |
| REASON | User wants to lose weight and asks for an intense program | Redirect -- explain that injury and burnout from too-hard programs are why most people quit. This plan builds the habit first; intensity comes later. Sustainable beats dramatic |
| REASON | User is over 70 with multiple limitations | Adjust -- shift focus to functional fitness: getting up from chairs, balance, walking endurance, reaching overhead. These directly improve quality of life |
| PLAN | Exercise description is hard to explain in text without video | Adjust -- use vivid analogies ("imagine you're squeezing a grapefruit between your shoulder blades"), reference familiar movements ("like picking up a grocery bag from the floor") |
| ACT | User completes week 1 and reports significant soreness | Adjust -- repeat week 1 instead of advancing. Reduce reps by 20-30%. Soreness means we started too hard, not that they are weak |

## State Persistence
- User physical profile (age, limitations, equipment, time availability)
- Exercise history (what has been done, what was too hard, what felt good)
- Progression data (reps, sets, duration over time -- tracks improvement)
- Limitation updates (knee feeling better, new shoulder issue, etc.)
- Milestone achievements (week 1 completed, first full month, etc.)
- Preferred exercises and disliked exercises (personalizes future plans)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.