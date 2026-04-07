# Relationship Check

> **Starter Skill** -- Free to use. Royalties to original creator on derivatives. Build on this.

The relationship health questions nobody asks until it's too late. Works for romantic partners, business partners, friendships, family, client relationships. Not therapy -- a structured check-in that surfaces drift, resentment, unspoken expectations, and appreciation gaps before they become crises. Think of it as a relationship oil change. You don't wait until the engine seizes.

## Execution Pattern: ORPA Loop

```
OBSERVE --> You pick a relationship. We map its current state honestly.
REASON  --> We ask what's going unsaid, unnoticed, and unappreciated.
PLAN    --> We identify the gaps and what to do about them.
ACT     --> You leave with one conversation to have and one habit to build.
     \                                                              /
      +--- New relationship or re-check? --- loop OBSERVE ----------+
```

## Inputs

- `relationship`: string -- Who is this about? Partner, co-founder, friend, parent, sibling, client, manager, direct report.
- `relationship_type`: string -- Romantic, business, friendship, family, professional.
- `current_state`: string -- How would you describe where things are right now? "Fine" is an answer, but we'll dig into it.
- `concern`: string -- (Optional) The specific thing that prompted this check-in, if any.

## Outputs

- `health_snapshot`: object -- Honest assessment across key relationship dimensions.
- `unsaid_inventory`: array -- Things that need to be said but haven't been.
- `appreciation_gaps`: array -- What's going unacknowledged on both sides.
- `one_conversation`: object -- The most important conversation to have, with guidance on how.
- `maintenance_habit`: object -- One recurring practice to prevent future drift.

---

## Execution

### OBSERVE: Map the Relationship

**Actions:**

1. **Get the overview.** Ask: "Tell me about this relationship. How long have you known each other? What's the foundation -- what brought you together and what keeps you connected?" The origin story reveals the values the relationship was built on. Drift happens when people move away from those original values without noticing.

2. **Take the temperature.** Ask: "On a scale of 1-10, how healthy is this relationship right now? And here's the harder question: what number do you think THEY would give it?" The gap between those two numbers is the first signal. If you think it's a 7 and they'd say 4, you have a blind spot.

3. **Check the five dimensions.** Walk through each one:
   - **Communication:** "When was the last time you had a real conversation -- not logistics, not small talk -- a genuine exchange about something that matters?"
   - **Trust:** "Is there anything you're not telling them because you're afraid of their reaction? Is there anything you suspect they're not telling you?"
   - **Reciprocity:** "Who's giving more right now? Who's taking more? Is it balanced, and does it need to be?"
   - **Growth:** "Are you both growing, or has one of you changed while the other stayed the same? Is that creating distance?"
   - **Appreciation:** "When was the last time you told them specifically what you appreciate about them? When was the last time they told you?"

4. **Find the drift.** Ask: "What's different about this relationship now compared to a year ago? Two years ago? Is the change gradual enough that you almost didn't notice it?"

**Quality gate:** All five dimensions addressed. The "their perspective" question has been attempted. At least one area of concern is identified.

---

### REASON: Surface What's Unsaid

**Actions:**

1. **The resentment check.** Ask: "Is there anything you're tolerating that you haven't addressed? Something they do -- or don't do -- that bothers you, but you've decided it's 'not worth bringing up'?" Resentment is the compound interest of unaddressed small issues. It always comes due.

2. **The expectation audit.** Ask: "What do you expect from them that you've never explicitly stated? And what do they probably expect from you that they haven't said?" Unspoken expectations are premeditated disappointments. Most relationship conflicts are about expectations that were never agreed to.

3. **The appreciation inventory.** Ask: "Name three things they do for you or the relationship that you've never thanked them for. Things you've come to take for granted." Then flip it: "What do you do that you feel goes unnoticed? What would it mean to you if they acknowledged it?"

4. **The change question.** Ask: "What would they say is the #1 thing they wish you'd change? And be honest -- do they have a point?" Follow up: "What's the #1 thing you wish THEY'D change? Have you ever told them in a way they could actually hear?"

5. **The loyalty test.** Ask: "When they're not in the room, how do you talk about them? Do you defend them, complain about them, or not mention them at all?" How you represent someone in their absence reveals how you actually feel about them.

6. **The future question.** Ask: "Where is this relationship heading if nothing changes? Not where you want it to go -- where is the current trajectory actually taking you?"

**Quality gate:** At least 2 unsaid things surfaced. The expectation gap is identified. The trajectory question is answered honestly.

---

### PLAN: Close the Gaps

**Actions:**

1. **Prioritize the unsaid things.** Ask: "Of everything that came up -- what's the ONE thing that would matter most to address? Not the easiest, not the most dramatic -- the one that would create the most positive change?"

2. **Design the conversation.** Help them think through:
   - "What's the opening? How do you bring this up in a way that doesn't put them on the defensive?"
   - "What's the ask? Not a complaint -- what do you actually want them to DO differently?"
   - "What are you willing to offer in return? Relationships are bilateral negotiations."
   - "What's your backup if the conversation doesn't go well? What's the minimum acceptable outcome?"

3. **Build the appreciation practice.** Ask: "What if you told them one specific thing you appreciate about them, once a week, unprompted? Not generic ('you're great') -- specific ('I noticed you did X and it made me feel Y'). Could you do that?" Appreciation is the cheapest, most effective relationship maintenance tool that almost nobody uses consistently.

4. **Set the re-check cadence.** Ask: "How often should you do this check-in -- with yourself, or with them? Monthly? Quarterly? What feels like the right rhythm before drift sets in again?"

**Quality gate:** One priority conversation identified with approach designed. A recurring maintenance habit is defined. Re-check date is set.

---

### ACT: Move Toward Repair

**Actions:**

1. **Deliver the health snapshot.** Summarize the five dimensions with honest assessments, the perception gap (their rating vs. estimated partner rating), and the trajectory.

2. **Deliver the unsaid inventory.** List what needs to be said, ranked by importance, with notes on timing and approach.

3. **Provide the conversation starter.** Not a script -- a starting point. "Something like: 'I've been thinking about us, and there's something I want to talk about. Not because anything is wrong, but because I want us to be intentional about this.'"

4. **Define the maintenance habit.** One practice, once a week, that takes less than 5 minutes. Weekly appreciation, a 10-minute check-in, a shared activity, a question ritual. Small and sustainable beats ambitious and abandoned.

5. **Close with the real question.** Ask: "Is this relationship one you're actively choosing, or one you're passively staying in? There's honor in both answers, but you should know which one it is."

**Output:** Health snapshot, unsaid inventory, conversation guide, weekly maintenance habit, re-check date.

## Exit Criteria

Done when: (1) all five relationship dimensions are assessed, (2) unsaid things are surfaced and prioritized, (3) one conversation is designed with approach guidance, (4) a maintenance habit is defined, (5) the user has clarity about the relationship's trajectory.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User says "everything is fine" | Ask: "If everything is fine, what prompted you to do this check-in? What's the thing that's 'fine' but could be better?" |
| REASON | User only focuses on the other person's faults | Redirect: "That's real. Now let's flip it -- what would THEY say about you if they were sitting here?" |
| REASON | User realizes the relationship may need to end | Don't push either direction: "That's a big realization. You don't have to decide that today. But let's be honest about what you're seeing." |
| PLAN | User is afraid to have the conversation | Normalize: "Most important conversations feel scary beforehand. What's the worst realistic outcome of having it vs. the cost of never having it?" |
| ACT | User wants to fix everything at once | Focus: "Pick one thing. The relationship didn't get here overnight and it won't get better overnight. One conversation. One habit. Start there." |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
