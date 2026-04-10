# Meeting Prep

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Takes a meeting topic, attendees, your role, and desired outcome, then builds a complete prep package: agenda suggestion, talking points, questions to ask, potential objections and responses, desired commitments to secure, and follow-up email template. Works for sales calls, 1:1s, board meetings, job interviews, and difficult conversations.

## Execution Pattern: Phase Pipeline

```
PHASE 1: CONTEXT    --> Understand the meeting dynamics and stakes
PHASE 2: STRATEGY   --> Define the desired arc from open to close
PHASE 3: MATERIALS  --> Build the prep package (agenda, talking points, questions, objections)
PHASE 4: FOLLOWUP   --> Draft the post-meeting follow-up template
```

## Inputs

- `meeting_topic`: string -- What the meeting is about.
- `attendees`: object[] -- Who will be there: name, role/title, relationship to you (boss, client, peer, report, unknown).
- `your_role`: string -- Your role and what authority you have in this meeting.
- `desired_outcome`: string -- What you want to walk away with (decision, commitment, information, alignment).
- `meeting_type`: string (optional) -- "sales_call", "one_on_one", "board_meeting", "job_interview", "difficult_conversation", "brainstorm", "status_update" (default: inferred from context).
- `background`: string (optional) -- Any relevant history, prior meetings, unresolved issues.
- `time_limit`: number (optional) -- Meeting duration in minutes (default: 30).

## Outputs

- `prep_package`: object -- Complete meeting preparation with all sections below.
- `agenda`: object -- Suggested time-boxed agenda items.
- `cheat_sheet`: string -- One-page quick reference to glance at during the meeting.

---

## Execution

### Phase 1: CONTEXT -- Understand the Dynamics

**Entry criteria:** Meeting topic, attendees, your role, and desired outcome are provided.

**Actions:**

1. Classify the meeting type if not provided. Use these signals:
   - Sales call: attendee is a prospect/client, outcome involves a deal
   - 1:1: two people, one is a manager
   - Board/exec: multiple senior stakeholders, outcome is approval or funding
   - Interview: one party is evaluating the other for a role
   - Difficult conversation: topic involves conflict, feedback, termination, or disagreement
2. Map the power dynamics: who has decision authority? Who is an influencer? Who might be an obstacle?
3. Identify each attendee's likely priorities: what do THEY want from this meeting? (Not what you want — what they want.)
4. Assess the stakes: what happens if the meeting goes well? What happens if it goes badly? What happens if it accomplishes nothing?
5. Identify the elephant in the room: is there an unspoken issue that will affect the meeting even if nobody mentions it?

**Output:** Meeting classification, power map, attendee priority estimates, stakes assessment, elephant identification.

**Quality gate:** Every attendee has an estimated priority. Stakes are defined for success, failure, and stalemate. Meeting type is classified.

---

### Phase 2: STRATEGY -- Design the Arc

**Entry criteria:** Context analysis is complete.

**Actions:**

1. Define the opening: how to set the right tone in the first 2 minutes. For sales: establish credibility. For 1:1s: create psychological safety. For difficult conversations: name the topic directly.
2. Define the core ask: the single most important thing to communicate or request. This must happen even if the meeting runs short.
3. Define the supporting points: 2-3 pieces of evidence, data, or narrative that support the core ask.
4. Define the desired commitments: specific, actionable things you want attendees to agree to by the end. Each commitment has a clear owner and deadline.
5. Define the concessions: what are you willing to give up or flex on? What is non-negotiable?
6. Define the closing: how to end the meeting with clear next steps, not a vague "let's follow up."
7. Time-box the strategy: allocate minutes to opening, core discussion, Q&A, and closing based on the time_limit.

**Output:** Meeting arc with opening, core ask, supporting points, commitments, concessions, closing, and time allocation.

**Quality gate:** Core ask is a single clear sentence. At least 2 supporting points exist. Commitments are specific (not "think about it"). Time allocation sums to the time_limit.

---

### Phase 3: MATERIALS -- Build the Prep Package

**Entry criteria:** Strategy is defined.

**Actions:**

1. **Agenda suggestion**: time-boxed items with owner and purpose for each block. Include a 2-minute buffer.
2. **Talking points**: 5-8 bullet points you want to make, ordered by priority. Each point is one sentence. Mark the must-says vs. nice-to-says.
3. **Questions to ask**: 5-7 questions, categorized:
   - Discovery questions (learn what you do not know)
   - Confirmation questions (validate your assumptions)
   - Commitment questions (move toward the desired outcome)
   - For each question: the best time to ask it and what to do with the answer.
4. **Objections and responses**: 3-5 things an attendee might push back on. For each: the objection, why they might raise it, your response, and evidence to support your response.
5. **Red flags to watch for**: body language, phrases, or behaviors that signal the meeting is going off track, and how to redirect.
6. **Desired commitments checklist**: each commitment as a checkbox, so you can track during the meeting what you secured.

**Output:** Complete prep package with agenda, talking points, questions, objections, red flags, and commitments checklist.

**Quality gate:** Agenda fits within time_limit. At least 3 questions are discovery-type. Every objection has a prepared response. Talking points are prioritized.

---

### Phase 4: FOLLOWUP -- Draft Follow-Up Template

**Entry criteria:** Prep package is complete.

**Actions:**

1. Draft a follow-up email template with blanks for meeting-specific details:
   - Subject line that references the meeting topic and outcome
   - Opening: thank the attendees, reference one specific thing discussed
   - Commitments section: "[Name] agreed to [action] by [date]" format for each commitment slot
   - Next steps: what happens next and when
   - Closing: professional but warm, appropriate to the relationship
2. Build the cheat sheet: a single-page quick reference with:
   - Core ask (bolded)
   - Top 3 talking points
   - Top 3 questions
   - Commitment checklist
   - One-line reminder of each attendee's likely priority

**Output:** Follow-up email template and one-page cheat sheet.

**Quality gate:** Email template has placeholders clearly marked with square brackets. Cheat sheet fits on one page (under 25 lines). Both match the meeting type's tone.

---

## Exit Criteria

The skill is DONE when:
- Meeting type is classified and dynamics are mapped
- A time-boxed agenda is produced
- Talking points, questions, and objection responses are prepared
- Desired commitments are listed as a checklist
- A follow-up email template is drafted
- A one-page cheat sheet is ready

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| CONTEXT | No information about attendees beyond names | **Adjust** -- build personas from role/title only, flag assumptions as unverified |
| CONTEXT | Meeting topic is vague ("catch up", "sync") | **Adjust** -- generate a discovery-focused prep package aimed at defining the real agenda |
| STRATEGY | Desired outcome conflicts with attendee priorities | **Adjust** -- identify the overlap zone and reframe the ask to align with shared interests |
| MATERIALS | Too many objections to address (> 7) | **Adjust** -- prioritize the top 5 by likelihood, note the others as secondary |
| FOLLOWUP | Meeting type is "brainstorm" where commitments are unusual | **Adjust** -- replace commitments with "ideas to explore" and owner for each |
| ACT | User rejects final output | Targeted revision -- ask which section fell short (agenda timing, talking points, specific objection responses, or the follow-up template) and rerun only that section. Do not rebuild the full prep package. |

## Reference

### Meeting Arc Time Allocation (30-Minute Default)

| Phase | Time | Purpose |
|---|---|---|
| Opening | 2-3 min | Set tone; confirm agenda; establish shared goal |
| Core discussion | 15-18 min | Core ask + supporting points + attendee input |
| Q&A / Objections | 5-7 min | Address pushback; confirm understanding |
| Closing / Commitments | 3-5 min | Lock in specific next steps with owners and dates |

Scale proportionally for 45 or 60-minute meetings.

### Question Types by Purpose

| Type | When to Use | Example |
|---|---|---|
| Discovery | Early; learn what you don't know | "What's been your experience with [topic] so far?" |
| Confirmation | Mid-meeting; validate assumptions | "So it sounds like [X] is the main concern -- is that right?" |
| Commitment | Closing; move toward action | "Does it make sense to schedule a follow-up by [date]?" |

### Commitment Format

All commitments should follow: "[Person] will [specific action] by [date]."

Weak: "We'll think about it."
Strong: "Sarah will send the revised proposal by Thursday, April 10."

### Meeting Type Quick Adjustments

| Meeting Type | Opening Tone | Primary Risk |
|---|---|---|
| Sales call | Credibility + curiosity | Talking too much; not listening |
| 1:1 (manager/report) | Psychological safety | Agenda drift; no decisions made |
| Difficult conversation | Direct naming of topic | Avoidance; vague close without resolution |
| Board / exec | Clear ask + pre-read assumed | Over-explaining; no explicit ask |
| Job interview | Confidence + genuine interest | Failing to answer what was actually asked |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
