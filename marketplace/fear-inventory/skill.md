# Fear Inventory

> **Starter Skill** -- Free to use. Royalties to original creator on derivatives. Build on this.

Name your fears so they stop running your decisions. You pick any area of your life and we systematically identify what you're afraid of, separate real risks from imagined catastrophes, calculate the actual probability and cost of each fear, and figure out which fears are protecting you vs. which are holding you back. Most fears lose their power when you write them down and do the math. "What's the worst that actually happens? Not the movie version -- the realistic version."

## Execution Pattern: ORPA Loop

```
OBSERVE --> Pick the area. Dump every fear on the table.
REASON  --> Separate real from imagined. Do the math.
PLAN    --> Sort: which fears to listen to, which to override, which to dissolve.
ACT     --> You pick one fear to face this week and one to stop feeding.
     \                                                              /
      +--- New area? Or fear list evolved? --- loop OBSERVE --------+
```

## Inputs

- `life_area`: string -- Where are the fears? Career, relationships, money, health, creative work, a specific decision, starting a business, having a conversation. Pick one.
- `decision_context`: string -- (Optional) Is there a specific decision you're stuck on because of fear? Sometimes the fears are diffuse. Sometimes they're blocking one specific thing.
- `stuck_duration`: string -- (Optional) How long have you been stuck or anxious about this? Days, months, years? Duration reveals how much power the fear has accumulated.

## Outputs

- `fear_inventory`: array -- Every fear named, described, and categorized.
- `reality_scores`: object -- Each fear scored for probability, actual impact, and recoverability.
- `fear_classification`: object -- Each fear sorted: protective (keep), limiting (override), or phantom (dissolve).
- `action_plan`: object -- One fear to face, one to stop feeding, and the specific next step.

---

## Execution

### OBSERVE: Name the Fears

**Actions:**

1. **Open the door.** Ask: "What's the area of life where fear is running the show? Not just 'I'm a little nervous' -- where is fear actually making decisions for you? Where are you NOT doing something because you're afraid?" The distinction matters. Everyone has fears. The question is where fear has become the decision-maker.

2. **Dump them all.** Ask: "Let's get every fear on the table. Don't filter, don't judge, don't rank. Just list them. What are you afraid will happen? What are you afraid people will think? What are you afraid you'll find out about yourself?" Three categories of fear to probe:
   - **External fears:** Things that might happen TO you (rejection, failure, loss, judgment)
   - **Internal fears:** Things you're afraid are true ABOUT you (not good enough, not smart enough, don't deserve it, will be exposed)
   - **Phantom fears:** Inherited fears you've never questioned (things your parents feared, things your culture says to fear, fears you absorbed from the news)

3. **Find the hidden ones.** After the initial dump, ask: "What fear did you almost say but didn't? The one that felt too silly, too dramatic, or too revealing to mention?" That's usually the most important one. Also ask: "What's the fear behind the fear? If [surface fear] happened, what are you REALLY afraid it would mean?"

4. **Name the avoidance.** Ask: "What specific actions are you not taking because of these fears? What conversations, applications, launches, emails, phone calls are sitting undone?" The avoidance behavior is the real cost of fear. Fear itself is free -- it's the avoidance that charges you.

**Quality gate:** At least 5 fears named. At least one from each category (external, internal, phantom). At least one hidden/behind-the-fear layer explored. Avoidance behaviors identified.

---

### REASON: Do the Math

**Actions:**

1. **The probability question.** For each fear, ask: "What's the actual probability this happens? Not the feeling of probability -- the actual likelihood. Has it happened to anyone you know? How often does this actually occur in reality?" Most fears live at emotional 90% probability but actual 10% probability. Putting a number on it -- even a rough one -- breaks the spell.

2. **The realistic worst case.** For each fear, ask: "If this fear came true -- the realistic version, not the disaster movie version -- what ACTUALLY happens next? Describe the Tuesday after the worst case. You wake up. What's your day like?" The movie version of fear is dramatic and final. The realistic version usually involves a bad week, some discomfort, and then life continuing. Walk them through the specific next day.

3. **The recoverability question.** Ask: "If the worst realistic case happens, how long would it take you to recover? Weeks? Months? Years? And have you recovered from something this bad before?" Most people have survived worse than what they're currently afraid of and have forgotten they're capable of recovery.

4. **The cost of inaction.** Ask: "Forget the fear for a second. What's the cost of staying where you are? Not the risk of acting -- the GUARANTEED cost of not acting. What do you lose by playing it safe for another year?" This is the question most people skip. They calculate the risk of action but never calculate the cost of inaction. Inaction has a price. It's just quieter.

5. **The 10-10-10 test.** Ask: "How will you feel about this decision in 10 minutes, 10 months, and 10 years? If the 10-year answer is 'I wish I'd done it,' then the 10-minute discomfort is a small price."

6. **Score each fear.** Build a simple matrix:
   - **Probability:** Low (< 20%), Medium (20-50%), High (> 50%)
   - **Impact if true:** Low (uncomfortable), Medium (painful but recoverable), High (life-altering)
   - **Recovery time:** Quick (weeks), Moderate (months), Long (years)
   - **Cost of avoidance:** Low, Medium, High

**Quality gate:** Every fear has probability, impact, recovery, and avoidance cost scores. At least one fear has been revealed as lower-probability than it felt. The cost of inaction is quantified.

---

### PLAN: Sort the Fears

**Actions:**

1. **Classify each fear into three buckets.**
   - **Protective fears (keep):** High probability AND high impact AND low recoverability. These fears are doing their job. They're protecting you from genuinely dangerous situations. Listen to them. Examples: "Don't invest money you can't afford to lose," "Don't ignore health symptoms."
   - **Limiting fears (override):** Low-to-medium probability, medium impact, reasonable recoverability, HIGH cost of avoidance. These fears are holding you back from things that would improve your life. The risk is real but manageable, and the cost of not acting is higher than the cost of acting. Examples: "Asking for a raise," "Starting the business," "Having the hard conversation."
   - **Phantom fears (dissolve):** Low probability, impact is vague or imagined, fear is inherited or habitual rather than evidence-based. These fears are ghosts. They consume energy and produce nothing. They need to be named and released. Examples: "Everyone will laugh at me," "I'll be exposed as a fraud" (without any evidence), "What will people think?"

2. **For protective fears:** Ask: "How can you respect this fear without letting it paralyze you? What's the smart, measured response?" Smart caution is not avoidance. It's calculated risk management.

3. **For limiting fears:** Ask: "What would you do if this fear magically disappeared tomorrow? That action -- what's the smallest version of it you could take THIS WEEK?" The action doesn't have to be big. It has to happen.

4. **For phantom fears:** Ask: "Where did this fear come from? Who taught you to be afraid of this? Is their experience relevant to your actual situation?" Phantom fears often dissolve when you trace them to their source and realize the source doesn't apply to you.

**Quality gate:** Every fear is classified as protective, limiting, or phantom. At least one limiting fear has a specific next action. At least one phantom fear has been traced to its origin.

---

### ACT: Face One, Starve One

**Actions:**

1. **Face one.** Ask: "Which limiting fear are you going to take one small step into this week? Not conquer -- just step into. What's the smallest action that makes the fear slightly less powerful?" Define the specific action, the specific day, and the specific first physical move ("open the laptop and type the first sentence," "pick up the phone and dial").

2. **Starve one.** Ask: "Which phantom fear are you going to stop feeding? What are you going to stop doing that feeds this fear -- the googling, the catastrophizing, the asking for reassurance, the avoidance ritual?" Fears are like organisms. They eat attention. Starve them and they shrink.

3. **The evidence journal.** Say: "This week, when a fear speaks up, write down what it told you would happen. Then, after you act (or after the event passes), write down what ACTUALLY happened. Over time, you build a record of your fear's track record. Spoiler: it's a terrible predictor."

4. **The re-inventory.** Say: "In a month, do this again. Your fear landscape will have shifted. Some fears will have dissolved from exposure. Some new ones will have appeared. Some protective fears will have been revealed as phantom, and vice versa. The inventory is alive."

**Output:** Classified fear inventory with scores, one fear to face (with specific action and date), one fear to starve (with specific behavior to stop), evidence journal prompt, 30-day re-inventory date.

## Exit Criteria

Done when: (1) at least 5 fears are named and scored, (2) each is classified as protective, limiting, or phantom, (3) one limiting fear has a specific action this week, (4) one phantom fear has been identified for starvation, (5) the cost of inaction is clear.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User says "I'm not really afraid of anything" | Reframe: "What would you do if you knew you couldn't fail? The gap between that answer and what you're actually doing -- that gap is made of fear." |
| OBSERVE | User can only name one big fear | Decompose: "That's the umbrella fear. What are the specific scenarios underneath it? Break the big fear into its component parts." |
| REASON | Probability genuinely is high | Acknowledge: "This is a real risk, not a phantom fear. Let's focus on preparation and contingency, not on pretending it won't happen." |
| PLAN | All fears classified as protective | Challenge gently: "Is it possible that some of these are disguised as protective when they're actually just comfortable? What would [person you admire] classify them as?" |
| ACT | User won't commit to facing any fear | Start smaller: "What if the action was just writing the fear down and reading it out loud? Just naming it with your voice. That's a step." |
| ACT | User rejects final output | Targeted revision -- ask which fear classification felt wrong or which section lacked depth and rerun only that analysis. Do not restart the full inventory. |

## Reference

### Fear Scoring Matrix

For each fear, score these four dimensions:

| Dimension | Low | Medium | High |
|---|---|---|---|
| Probability | < 20% likely | 20-50% likely | > 50% likely |
| Impact if true | Uncomfortable, passes quickly | Painful but recoverable in months | Life-altering, long recovery |
| Recovery time | Weeks | Months | Years |
| Cost of avoidance | Minor inconvenience | Meaningful lost opportunity | Life-defining loss |

### Fear Classification Rules

| Classification | Criteria | What to Do |
|---|---|---|
| Protective (keep) | High probability + high impact + slow recovery | Respect it; plan around it with smart precautions |
| Limiting (override) | Low-medium probability + medium impact + recoverable + HIGH cost of avoidance | Identify the smallest step in; take it this week |
| Phantom (dissolve) | Low probability + vague or inherited + no real evidence base | Trace to origin; name the source; starve by stopping avoidance behaviors |

### The 10-10-10 Decision Test

Ask for any feared action:
- How will you feel about this in 10 minutes? (short-term discomfort)
- How will you feel about this in 10 months? (medium-term consequence)
- How will you feel about this in 10 years? (long-term cost of avoidance)

If the 10-year answer is "I wish I'd done it," the 10-minute discomfort is the price of admission.

### Fear Behind the Fear Probe

Surface fear → "What does it mean if this happens?" → Deeper fear → "What does that mean about you?" → Core fear

Example: "I'm afraid of failing the presentation" → "It means I'm not competent" → "It means I don't belong here" → Core fear: identity threat (imposter syndrome)

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
