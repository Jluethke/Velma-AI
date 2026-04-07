# Future Self Letter

> **Starter Skill** -- Free to use. Royalties to original creator on derivatives. Build on this.

Write a letter from your future self -- 1 year, 5 years, or 10 years from now. But first, you have to earn it. Before you write a single word, we force you to think through what decisions you're making now that your future self will thank you for or regret. Surfaces the gap between what you say you want and what you're actually doing about it. Your future self has opinions about your current behavior. Let's hear them.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Where are you now? What do you say you want?
REASON  --> What is your future self actually likely to experience given current trajectory?
PLAN    --> What would future-you say to present-you? What would they beg you to change?
ACT     --> You write the letter. Then you decide what to do about it.
     \                                                              /
      +--- Revisit in 6 months? --- loop OBSERVE -------------------+
```

## Inputs

- `time_horizon`: string -- How far into the future? "1 year", "5 years", or "10 years". Each reveals different things.
- `life_area`: string -- (Optional) Focus on a specific area: career, relationships, health, finances, creative work, personal growth. Or leave open for a full-life letter.
- `current_state`: string -- Where are you right now? What's going well, what's struggling, what are you avoiding?

## Outputs

- `trajectory_analysis`: object -- Where you're actually heading vs. where you say you want to go.
- `gratitude_list`: array -- Things your future self will thank you for.
- `regret_list`: array -- Things your future self will wish you'd done differently.
- `the_letter`: string -- The letter from future-you, written by present-you, informed by honest reflection.
- `action_bridge`: object -- The specific actions that close the gap between trajectory and intention.

---

## Execution

### OBSERVE: Present You, Honestly

**Actions:**

1. **Set the time horizon.** Ask: "How far into the future are we going? A year is tactical -- what habits, projects, relationships. Five years is strategic -- career trajectory, life structure, identity. Ten years is existential -- who you become, what you build, what you stand for." Each horizon serves a different purpose.

2. **Map current reality.** Ask: "Tell me where you are right now. Not the social media version -- the real one. What's going well that you're proud of? What's struggling that you're worried about? What are you avoiding that you know you should be dealing with?" Get all three. Most people will happily share the first, reluctantly share the second, and try to skip the third.

3. **State the declared intentions.** Ask: "What do you SAY you want your life to look like in [time horizon]? If someone asked you at a dinner party, what would you tell them?" This is the aspirational narrative. We need it on the table so we can compare it to behavior.

4. **Map actual behavior.** Ask: "Now let's look at how you actually spend your time, energy, and money. What does your calendar say you value? What does your bank account say you value? Do those match what you just told me?" Declared values vs. revealed values. The gap between them is where the letter lives.

**Quality gate:** Current state is described honestly (including avoidances). Declared goals exist. At least one gap between stated goals and actual behavior is identified.

---

### REASON: The Trajectory Test

**Actions:**

1. **Project the current trajectory.** Ask: "If you change absolutely nothing -- same habits, same job, same relationships, same patterns -- where are you in [time horizon]? Not the worst case, not the best case. The MOST LIKELY case given current behavior." This is the trajectory test. Most people have never done it. They assume their future will be different from their present without having changed anything that would make it different.

2. **Find the gratitude seeds.** Ask: "What are you doing RIGHT NOW that your future self will thank you for? What investments are you making -- in skills, relationships, health, savings -- that won't pay off for years but are quietly building?" These are important to acknowledge. Not everything is broken. Some things are working and deserve recognition.

3. **Find the regret seeds.** Ask: "What are you NOT doing that your future self will wish you had started today? What are you tolerating that they'll wish you'd stopped? What conversation are you avoiding that they'll wish you'd had years ago?" Then harder: "What do you already know you should be doing that you keep pushing to 'someday'? Because future-you doesn't have 'someday.' They have 'too late' or 'just in time.'"

4. **The identity question.** Ask: "In [time horizon], who do you want to have BECOME? Not what you want to have DONE -- who do you want to BE? What kind of person? And is the person you're being today the kind of person who becomes that?" Identity drives behavior more than goals do. You don't rise to the level of your goals -- you fall to the level of your identity.

5. **The uncomfortable truth.** Ask: "What's the thing you know you need to change but haven't, because changing it is harder than living with it? What's the comfortable discomfort you've settled into?" Present bias makes us tolerate slow decay because each day's deterioration is too small to justify the effort of change.

**Quality gate:** Trajectory is honestly projected. At least 2 gratitude seeds and 3 regret seeds identified. The identity question has been answered.

---

### PLAN: Future You Speaks

**Actions:**

1. **Give future-you a voice.** Say: "Now you're going to write this letter. But first, let's figure out what future-you wants to say. Based on everything we've discussed, future-you has been living with the consequences of your current choices. What's the first thing they want to tell you?"

2. **Structure the letter.** Guide them through sections:
   - **What I'm grateful you did.** "Thank you for..." The actions, habits, and decisions that paid off.
   - **What I wish you'd known.** "I wish someone had told you..." The things that seem important now but won't matter, and the things that seem small now but will matter enormously.
   - **What I wish you'd started sooner.** "The one thing I'd beg you to start today is..." The actions whose value compounds over time -- and the compound interest you're losing every day you delay.
   - **What I need you to stop.** "Please stop..." The habits, avoidance patterns, and comfortable lies that are costing future-you.
   - **What I want you to know about how it turned out.** "Here's what actually happened..." The honest projection, with hope but without delusion.

3. **Test for honesty.** After the draft, ask: "Is this letter kind enough? Is it honest enough? Future-you loves you but isn't going to sugarcoat it. Would they really say this, or is this the polished version?"

**Quality gate:** The letter has all five sections. It contains at least one thing that was hard to write. It's addressed to the user specifically, not generically.

---

### ACT: Bridge the Gap

**Actions:**

1. **Extract the actions.** Ask: "Reading this letter -- what are the 3 most important things present-you needs to DO in the next 30 days to make future-you proud?" Not 30 things. Three. Present-you has limited bandwidth.

2. **Find the one change.** Ask: "If the letter boils down to one message -- one thing future-you is screaming at you to understand -- what is it?" This is the thesis of the letter. The single insight that, if internalized, changes the trajectory.

3. **Create the accountability artifact.** Say: "Save this letter somewhere you'll find it. Set a reminder to read it in [3 months / 6 months]. When you read it again, ask yourself: 'Am I closer to the future self who wrote this, or further away?'"

4. **Offer the re-check.** Say: "Come back in 6 months. We'll do this again. The letter will be different because you'll be different. That's the point -- the letter is a snapshot of your awareness at this moment. Track how your awareness evolves."

**Output:** The completed letter, 3 priority actions for the next 30 days, the one core message, and a re-check date.

## Exit Criteria

Done when: (1) current state and trajectory are honestly mapped, (2) gratitude and regret seeds are identified, (3) the letter is written with all five sections, (4) 3 concrete actions are extracted, (5) the letter is saved for future re-reading.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User can't articulate goals | Ask: "Forget goals. What do you NOT want your life to look like in [time]? Sometimes knowing what you're running from is clearer than knowing what you're running toward." |
| REASON | User insists trajectory is fine without evidence | Ask: "Walk me through a typical Tuesday. Morning to night. Now imagine 200 more of those Tuesdays. Is that the life?" |
| REASON | User gets overwhelmed by regret | Ground them: "The point isn't to feel bad about the past. The point is that today is the earliest you can start. Future-you is already grateful you're doing this right now." |
| PLAN | Letter is too generic or positive | Push: "This reads like a greeting card. Future-you is being too polite. What do they REALLY want to say? The thing that's hard to hear?" |
| ACT | User won't commit to actions | Shrink: "What if the only action was reading this letter once a month? Just reading it. Would that be enough to nudge you?" |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
