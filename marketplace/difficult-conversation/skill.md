# Difficult Conversation

**One-line description:** Both people submit what they actually think and feel before a hard conversation — AI finds the shared ground, names the real tension, and writes the opening lines so neither person has to figure out how to start.

**Execution Pattern:** Phase Pipeline

**Fabric Flow:** Both people must submit before synthesis runs. Neither sees the other's input until the synthesis is shared.

---

## Inputs

### Shared (visible to both before submitting)
- `shared_relationship_type` (string, required): What is this relationship? e.g., "Manager and employee," "Two friends," "Romantic partners," "Siblings," "Business partners."
- `shared_conversation_topic` (string, required): One sentence on what the conversation is about. Neither party has to agree on framing — just name the topic.

### Each Person Submits Privately
- `your_perspective` (string, required): What's your honest view of the situation? What actually happened, from your side?
- `what_you_need` (string, required): What do you actually need from this conversation or from this person? Not what you want to say — what you need.
- `what_you_fear` (string, required): What are you afraid will happen? What's the worst realistic outcome?
- `what_you_wish_they_understood` (string, required): The one thing you most want the other person to understand that you don't think they do.
- `your_ideal_outcome` (string, required): What does a good outcome look like? Not winning — a genuinely good outcome for both of you.
- `what_you_are_willing_to_do_differently` (string, optional): What are you actually willing to change or do differently? Be honest.

## Outputs
- `shared_ground` (object): What both people actually agree on — even if they don't know it yet. The real foundation under the conflict.
- `core_tension` (string): The single most precise statement of what this conversation is actually about, underneath the surface topic.
- `each_sides_fear` (object): What each person is most afraid of, surfaced plainly. Often the fears are more similar than either person expects.
- `bridge_statement` (string): A one or two sentence synthesis that holds both sides' needs at once — not a compromise, a genuine bridge.
- `conversation_agenda` (array): The 3-4 things to actually address, in order, with time guidance.
- `opening_lines` (object): A suggested opening for each person — what they could say first, in their own voice, to start without attacking or defending.
- `guardrails` (array): Specific things to avoid in this conversation that are likely to derail it based on both sides' fears.

---

## Execution Phases

### Phase 0: Pre-Flight Check
**Entry Criteria:** Both people have submitted their Fabric session.

**Actions:**
1. Confirm `your_perspective`, `what_you_need`, and `what_you_fear` are present from both sides.
2. Note if either side's responses suggest high emotional volatility — this affects the tone of the synthesis.
3. Flag if the shared topic description and either side's perspective are so misaligned that the two people may not be describing the same conversation.

**Output:** Readiness confirmation or missing fields.

**Quality Gate:** Both sides submitted. Core emotional inputs (`what_you_need`, `what_you_fear`) present from both sides.

---

### Phase 1: Extract the Real Positions
**Entry Criteria:** Both submissions confirmed sufficient.

**Actions:**
1. Extract each person's core position — what they actually believe happened and why.
2. Extract each person's core need — what they're really asking for underneath what they said.
3. Extract each person's core fear — what they're most afraid this conversation will do.
4. Note the gap between what each person says they want (ideal outcome) and what they're actually willing to do differently. This gap is where the conversation will get stuck.
5. Look for hidden agreement: do both people secretly want the same thing, just framed differently?

**Output:** Core position, need, and fear for each person. Hidden agreement map.

**Quality Gate:** Needs are distinguished from positions. Fears are specific (not just "it'll go badly").

---

### Phase 2: Find the Shared Ground and Name the Real Tension
**Entry Criteria:** Core positions extracted.

**Actions:**
1. Identify everything both sides genuinely agree on — values, facts, desired outcomes. Even in the worst conflicts there is shared ground.
2. Name the core tension in one sentence. Not the surface topic — the underlying thing. Example: not "who does the dishes" but "whether I feel seen as a partner in this home."
3. Compare the fears. Often both people fear the same thing (rejection, disrespect, loss of the relationship) and their conflict is two expressions of the same fear.
4. Identify what each person most needs to feel heard on. This is the thing to address first.

**Output:** Shared ground list, core tension statement, fear comparison, "needs to feel heard" priority for each person.

**Quality Gate:** Core tension is stated at the level of the underlying dynamic, not the surface topic. Shared ground is real, not platitudes.

---

### Phase 3: Build the Conversation Architecture
**Entry Criteria:** Shared ground and core tension identified.

**Actions:**
1. Draft the bridge statement: a sentence that holds both people's core need at once without collapsing either. This is the hardest part. It should not be a compromise ("you're both a little right") — it should be a genuine synthesis that makes both people feel understood.
2. Build the conversation agenda: 3-4 items in order.
   - Start with shared ground (2 minutes) — establish what both people agree on before anything else.
   - Move to what each person needs to feel heard on (5-7 minutes each).
   - Address the core tension directly.
   - End with what each person is willing to do differently.
3. Write opening lines for each person: how they could start the conversation in their own voice. The lines should be honest, non-attacking, and signal that they're there to understand, not to win.
4. Write the guardrails: the specific moves that are likely to derail this conversation based on both sides' stated fears. Name them explicitly so both people can catch themselves.

**Output:** Bridge statement, conversation agenda, opening lines for each person, guardrails.

**Quality Gate:** Bridge statement holds both sides. Opening lines don't begin with "you." Guardrails are specific behaviors, not generic advice.

---

### Phase 4: Deliver the Synthesis
**Entry Criteria:** Conversation architecture complete.

**Actions:**
1. Open with shared ground — let both people see what they already agree on.
2. Present each side's perspective honestly and briefly — not to judge, but to make each person feel accurately represented.
3. Present each side's fear. This is often the most powerful moment: both people see that the other person is afraid too.
4. Present the bridge statement.
5. Deliver the conversation agenda.
6. Deliver the opening lines for each person.
7. Deliver the guardrails.
8. Close: "You don't have to have this conversation perfectly. You just have to start it."

**Output:** Full synthesis — shared ground, perspective summaries, fear comparison, bridge statement, agenda, opening lines, guardrails.

**Quality Gate:** Both people feel accurately understood. The tone is warm and direct. Nothing is clinical.

---

## Exit Criteria
Done when: (1) shared ground is identified with at least 2 genuine agreements, (2) core tension is named at the underlying level, (3) both fears are surfaced and compared, (4) bridge statement holds both needs, (5) opening lines exist for both people, (6) guardrails name at least 3 specific derailment risks.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | One person's submission is much angrier or more guarded than the other's | Note the asymmetry. Adjust tone of synthesis — the guarded person needs to feel safe before the conversation starts. |
| Phase 2 | The two people appear to be describing completely different events | Name this explicitly. "Both of you experienced this situation very differently. The conversation may need to start with establishing shared facts before addressing the core tension." |
| Phase 3 | One person has stated they are unwilling to change anything | Don't soften this. Note it in the synthesis: "One side has not identified anything they're willing to do differently. This conversation may clarify whether that's still true." |
| Phase 4 | Content suggests potential for escalation or safety concern | Add a note: "If this conversation becomes heated, it's okay to pause and return to it. You don't have to resolve everything in one sitting." |

## State Persistence
- Conversation history (track how the relationship evolves over time)
- Resolution tracking (what was agreed to and whether it held)
- Pattern recognition (recurring tensions in this relationship)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
