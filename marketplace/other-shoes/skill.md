# Other Shoes

> **Starter Skill** -- Free to use. Royalties to original creator on derivatives. Build on this.

See your situation from everyone else's perspective. You bring a situation -- a decision, a conflict, an email you're about to send -- and we walk through it from the viewpoint of every person involved. Each perspective surfaces concerns, objections, and opportunities you literally cannot see from where you're standing.

## Execution Pattern: ORPA Loop

```
OBSERVE --> You describe the situation. We map every stakeholder.
REASON  --> You step into each person's shoes. What do THEY see?
PLAN    --> We find the gaps: what you missed, what they need, what changes.
ACT     --> You revise your approach with every perspective accounted for.
     \                                                              /
      +--- New stakeholder identified? --- loop OBSERVE ------------+
```

## Inputs

- `situation`: string -- What's happening. A decision, a conversation, a conflict, a plan that involves other people.
- `your_position`: string -- What you currently think, feel, or plan to do about it.
- `stakeholders`: list[string] -- (Optional) The people involved. If not provided, we'll map them together.

## Outputs

- `stakeholder_map`: array -- Every person affected, their likely perspective, and what they care about.
- `blind_spot_report`: array -- Things you're not seeing because you're you.
- `revised_approach`: object -- Your original position updated with stakeholder awareness.
- `conversation_prep`: object -- What to say (and not say) to each key person.

---

## Execution

### OBSERVE: Map the Human Terrain

**Actions:**

1. **Get the situation.** Ask: "What's going on? Tell me like you're venting to a friend. Don't filter it -- I want your unedited version first." The unfiltered version reveals biases and emotional charge that the polished version hides.

2. **Map every stakeholder.** Ask: "Who are all the people affected by this? Not just the obvious ones. Who's going to feel the ripple?" Build the full list:
   - Direct players (people in the room, on the email, making the decision)
   - Indirect players (people who'll feel the consequences but aren't at the table)
   - Future players (your future self, future customers, future team members)
   - The person they haven't thought of (ask: "Who's missing from this list that probably shouldn't be?")

3. **Rank by influence and impact.** For each stakeholder: "How much power do they have over the outcome? And how much does the outcome affect them?" The people with high impact but low power are usually the ones being forgotten.

4. **Surface your story.** Ask: "What's the story you're telling yourself about why your position is right?" Get it explicit. This is the narrative they need to hold up against other perspectives.

**Quality gate:** At least 3 stakeholders identified. At least one is non-obvious (future self, indirect party, or someone they initially forgot).

---

### REASON: Walk in Their Shoes

**Actions:**

1. **One perspective at a time.** For each stakeholder, ask: "Put yourself in [name]'s position. You wake up as them tomorrow. What does this situation look like from their side? What are they worried about? What do they want?"

2. **Find their logic.** Ask: "Even if you disagree with them -- what's the version of this where they're not wrong? Where they're acting rationally given what THEY know and what THEY care about?" This is the hardest question. People dismiss others' perspectives as irrational when they're actually just operating from different information or different values.

3. **Surface their unspoken concerns.** Ask for each key stakeholder:
   - "What are they afraid of in this situation that they probably won't say out loud?"
   - "What do they need from you that they haven't asked for?"
   - "What's the worst thing you could do from their perspective? Are you doing any version of that?"

4. **Check the empathy gap.** Ask: "Which person on this list is hardest for you to empathize with right now? That's probably the perspective you need to understand most." The person you most want to dismiss is the one hiding your biggest blind spot.

5. **Your future self.** Always include this one: "It's a year from now. Future-you is looking back at how you handled this. What do they wish you'd done differently? What are they grateful you did?"

**Quality gate:** Every stakeholder has a fleshed-out perspective. At least one perspective genuinely surprised the user. The hardest-to-empathize-with person has been fully explored.

---

### PLAN: Find What You're Missing

**Actions:**

1. **Identify the blind spots.** Ask: "Now that you've seen all these perspectives -- what were you not seeing before? What changes about your understanding of the situation?"

2. **Find the overlaps.** Ask: "Where do multiple stakeholders want the same thing? That's your leverage point -- the move that makes several people happy at once."

3. **Find the conflicts.** Ask: "Where are stakeholders' needs genuinely in conflict -- where you can't make everyone happy? Which conflicts are real tradeoffs, and which ones just feel like conflicts because you haven't found the creative solution yet?"

4. **Test your original position.** Ask: "Knowing what you now know about everyone's perspective -- does your original plan still hold? What would you change?" If nothing changes, either the exercise didn't go deep enough or they were already right (rare but possible).

5. **Prepare for the hard conversations.** For each key stakeholder: "What does [name] need to hear from you? And what should you absolutely NOT say, even if you're thinking it?"

**Quality gate:** At least one blind spot identified. Original position has been updated or consciously re-confirmed with new awareness.

---

### ACT: Move With Awareness

**Actions:**

1. **Deliver the perspective map.** Summarize each stakeholder's view, their core need, and the gap between what they need and what the user was originally planning.

2. **Provide conversation scripts.** For the 2-3 most important stakeholders, offer: "Here's how to open the conversation in a way that shows you've thought about their side." Not manipulation -- genuine acknowledgment.

3. **Flag the relationship risks.** Ask: "Is there anyone in this situation where your relationship with them is more important than being right? If so, what does that mean for how you handle this?"

4. **Set a check-in.** Ask: "After you have the key conversations or make the decision -- come back and tell me: were the perspectives accurate? What did you miss? What surprised you?" Building the muscle of perspective-taking requires feedback loops.

**Output:** Stakeholder perspective map, blind spot report, revised approach, conversation preparation for key relationships.

## Exit Criteria

Done when: (1) every identified stakeholder has a fleshed-out perspective, (2) at least one blind spot has been surfaced and addressed, (3) the user's approach has been updated with stakeholder awareness, (4) conversation prep is provided for key relationships.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | User insists only one person is involved | Ask: "Who else feels the consequences? Who finds out about this later? Who does [person] go home and talk to about it?" |
| REASON | User can't get past their own perspective | Try: "Pretend you're their lawyer. Build the best case for their side. You don't have to agree -- just argue it." |
| REASON | User demonizes a stakeholder | Gently: "I hear that you're frustrated with them. But right now we need to understand them, not judge them. What's driving them?" |
| PLAN | No blind spots found | Probe harder: "If I asked [most critical stakeholder] what you're getting wrong, what would they say?" |
| ACT | User won't adjust their approach | Respect it, but ask: "Are you choosing not to change because you've considered the perspectives, or because you don't want to?" |
| ACT | User rejects final output | Targeted revision -- ask which stakeholder perspective felt inaccurate or superficial and rerun only that perspective with deeper prompting. Do not restart the full exercise. |

## Reference

### Stakeholder Mapping Categories

| Category | Who belongs here | Why they're often missed |
|---|---|---|
| Direct players | People in the room, on the email, making the decision | Usually identified immediately |
| Indirect players | People who feel the consequences but aren't at the table | Easy to overlook when focused on the immediate conflict |
| Future players | Future self, future customers, future team members | Abstract; not yet present |
| Invisible stakeholders | People with power but low visibility (HR, legal, silent partners) | Their reactions can derail what seems like a bilateral decision |

### Stakeholder Influence / Impact Matrix

| Quadrant | High Power | Low Power |
|---|---|---|
| High Impact | Manage closely -- their buy-in is critical | Advocate for -- they're affected most but have least voice |
| Low Impact | Keep informed -- don't neglect but don't over-invest | Monitor -- lowest priority but note for completeness |

### Perspective Shift Prompts

When a stakeholder perspective is hard to access:

1. "You're their lawyer. Build the best case for their side."
2. "What does this look like from their job title, not their personality?"
3. "What is this person afraid of losing? That's usually the core of their position."
4. "What would they tell their spouse or friend about this situation tonight?"

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
