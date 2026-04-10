# Premortem

> **Starter Skill** -- Free to use. Royalties to original creator on derivatives. Build on this.

Before you start, imagine it already failed. What went wrong? You describe your plan, then we walk through the future where it collapsed and work backward to figure out why. Your optimism is hiding failure modes from you. Let's find them before they find you.

## Execution Pattern: ORPA Loop

```
OBSERVE --> You tell me the plan. I ask what "success" actually looks like.
REASON  --> We time-travel. It failed. You write the autopsy.
PLAN    --> We sort the wreckage: what was preventable, what was a real risk, what was denial.
ACT     --> You leave with a kill list of vulnerabilities and what to do about each one.
     \                                                              /
      +--- Plan changed? New fears surfaced? --- loop OBSERVE -----+
```

## Inputs

- `plan`: string -- The thing you're about to do. A project, a launch, a conversation, a life change. Anything with stakes.
- `timeline`: string -- When you expect to be "done" or see results.
- `confidence_level`: string -- How confident you feel right now, honestly. (This gets revisited at the end.)

## Outputs

- `failure_autopsy`: object -- The story of how it failed, written by you, with prompting.
- `vulnerability_map`: array -- Every failure mode categorized: preventable, mitigatable, or acceptable risk.
- `revised_plan`: object -- Your original plan with specific patches for the top vulnerabilities.
- `confidence_recalibration`: object -- Your new honest confidence level after seeing the full picture.

---

## Execution

### OBSERVE: Lay Out the Plan

**Actions:**

1. **Get the plan on the table.** Ask: "What are you about to do? Walk me through it like you're explaining it to someone who wants to invest in it." Let them sell it. The selling reveals what they think matters.

2. **Pin down success.** Ask: "If this goes perfectly -- best realistic case, not fantasy -- what does that look like in specific terms? What's the number, the date, the outcome you'd point to and say 'it worked'?" Vague success = vague planning.

3. **Surface the confidence.** Ask: "On a gut level, how confident are you this works? Give me a percentage. Don't think about it too hard -- first number that comes to mind." Write it down. We're coming back to it.

4. **Find the unspoken assumptions.** Ask: "What has to go RIGHT for this to work? Not what you're doing -- what has to happen that you don't fully control?" This surfaces dependencies they've internalized as certainties.

**Quality gate:** The plan is specific enough to fail in specific ways. "Make more money" can't be premortemed. "Launch the course by June and get 200 signups" can.

---

### REASON: The Failure Autopsy

**Actions:**

1. **Set the scene.** Say: "It's [their timeline]. The plan failed. Not a little -- it really didn't work. You're sitting there looking at the wreckage. I want you to tell me the story of what happened. What went wrong first?"

2. **Keep pulling the thread.** After each failure they name, ask: "And then what happened? What did that cause?" Follow the cascade. Most plans don't die from one blow -- they die from a chain reaction the planner never traced.

3. **Probe the blind spots.** After they've told their story, ask:
   - "What's the failure you're most embarrassed to admit you're worried about?"
   - "What's the version where YOU are the reason it failed -- not circumstances, not other people -- you?"
   - "What would your biggest critic say was obviously going to go wrong?"
   - "What happened last time you tried something like this? What rhymes?"

4. **Check for the comfortable lie.** Ask: "Is there a part of this plan where you're telling yourself 'it'll probably be fine' without actually having a reason to believe that?" The comfortable lie is the #1 killer of plans.

**Quality gate:** At least 5 distinct failure modes identified. At least one is about the person, not the circumstances. At least one was uncomfortable to say out loud.

---

### PLAN: Sort the Wreckage

**Actions:**

1. **Categorize each failure mode.** For every failure they surfaced, ask: "Is this something you can prevent, something you can prepare for, or something you just have to accept might happen?" Three buckets:
   - **Preventable:** You can take action NOW to eliminate this risk entirely.
   - **Mitigatable:** You can't prevent it, but you can reduce the damage or have a backup plan.
   - **Acceptable risk:** This could happen and you're choosing to move forward anyway -- eyes open.

2. **Kill the preventable ones.** For each preventable failure: "What's the specific action you'd need to take this week to make this impossible?" Not someday. This week.

3. **Build contingencies for the mitigatable ones.** Ask: "If [mitigatable failure] happens, what's your Plan B? And when would you need to trigger Plan B -- what's the tripwire that tells you it's happening?"

4. **Own the acceptable risks.** Ask: "For the risks you're accepting -- are you accepting them because you've thought about them, or because you don't want to think about them? There's a difference."

5. **Recalibrate confidence.** Ask: "Now that you've seen all of this -- the preventable stuff, the contingencies, the real risks -- what's your confidence percentage now? Higher or lower than before?"

**Quality gate:** Every failure mode is categorized. Preventable ones have specific actions. Mitigatable ones have tripwires and Plan Bs. Acceptable risks are consciously chosen.

---

### ACT: Walk Out Stronger

**Actions:**

1. **Deliver the vulnerability map.** List every failure mode with its category, the specific action or contingency, and a deadline.

2. **Highlight the top 3.** Ask: "If you could only protect against three of these, which three would you choose?" This forces prioritization when everything feels urgent.

3. **Create the pre-commitment.** Ask: "What's the one thing from this conversation you're going to do before you go to sleep tonight?" Not next week. Tonight. The premortem is worthless if it doesn't produce immediate action.

4. **Plant the re-check.** Say: "In [reasonable timeframe], revisit this list. The failures you predicted -- did any of them start happening? The ones you didn't predict -- did something else come up? Update the map."

5. **Close the loop.** If confidence went up after the exercise, validate it: seeing risks clearly often increases real confidence because you're no longer fighting unnamed anxiety. If confidence went down, that's valuable too -- better to know now than after you've committed resources.

**Output:** Vulnerability map, top 3 priorities, tonight's action, re-check date.

## Exit Criteria

Done when: (1) at least 5 failure modes are identified and categorized, (2) preventable risks have specific actions with deadlines, (3) the user has committed to at least one immediate action, (4) confidence has been honestly recalibrated.

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | Plan is too vague to premortem | Ask for specifics: "What would you need to see to call this a success? Give me a number or a date." |
| REASON | User can only think of external failures | Prompt: "What's the version where everything external goes fine but it still fails because of something you did or didn't do?" |
| REASON | User resists imagining failure | Normalize it: "This isn't pessimism. Surgeons walk through complications before every operation. It's how they save lives." |
| PLAN | Everything feels unpreventable | Challenge: "If someone offered you $1M to prevent this specific failure, what would you do differently? That's the action." |
| ACT | User won't commit to immediate action | Shrink it: "What's the smallest version of this you could do in 10 minutes?" |
| ACT | User rejects final output | **Targeted revision** -- ask which section fell short (failure autopsy depth, vulnerability categorization, or action commitments) and rerun only that section. Do not restart the full premortem. |

---

## Reference

### Failure Mode Categories

| Category | Description | Example |
|---|---|---|
| Preventable | Eliminable with action NOW | Not having a backup contact list |
| Mitigatable | Can't prevent; can limit damage | Market downturn — maintain 3-month runway |
| Acceptable risk | Eyes-open choice to proceed | Competitor may copy the idea |

### Premortem Question Bank

**Blind spot probes:**
- "What failure are you most embarrassed to admit you're worried about?"
- "What would your most critical stakeholder say was obviously going to go wrong?"
- "What happened last time you tried something like this?"

**Comfortable lie detector:**
- "Where in this plan are you saying 'it'll probably be fine' without evidence?"
- "What assumption are you treating as certain that isn't?"

**Self-failure probe:**
- "What's the version where circumstances go fine but YOU are why it failed?"

### Confidence Recalibration Guide

| Direction | Interpretation |
|---|---|
| Confidence went UP after premortem | Naming fears reduces ambient anxiety; real confidence increased |
| Confidence stayed same | Risks already consciously accounted for; well-calibrated |
| Confidence went DOWN | Previously unexamined risks surfaced; valuable — better now than later |

### Top-3 Priority Forcing Question

When everything feels urgent: "If you could only protect against three of these, which three would you choose?" Forces triage before decision fatigue sets in.

### Tripwire Formula

For each mitigatable risk: "If [leading indicator], then [response action] within [timeframe]."
Example: "If signups drop below 10 in week 3, then reduce ad spend and pivot messaging within 48 hours."

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
