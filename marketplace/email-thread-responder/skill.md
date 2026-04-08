# Email Thread Responder

**One-line description:** Analyze an email thread, extract unresolved points, and draft a response that matches tone, addresses all points, and moves the conversation toward resolution.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `email_thread`: object[] -- Array of email messages in chronological order. Each message has: `sender` (string), `recipient` (string), `timestamp` (ISO 8601), `subject` (string), `body` (string).
- `responder_role`: string (optional) -- Role or context of the person responding (e.g., "project manager", "customer support", "colleague"). Defaults to "colleague". Used to calibrate tone and authority level.
- `responder_relationship_to_sender`: string (optional) -- Relationship context (e.g., "manager", "peer", "direct report", "external partner", "unknown"). Defaults to "unknown". If unknown, response will include clarifying statement.
- `resolution_goal`: string (optional) -- Explicit goal for the response (e.g., "close the issue", "request clarification", "provide update", "decline request"). If omitted, inferred from thread. Inferred goal is documented in tone_analysis output.
- `tone_override`: string (optional) -- Force a specific tone ("formal", "semi-formal", "casual", "empathetic", "urgent"). If omitted, inferred from thread. Override is noted in tone_analysis.

## Outputs

- `response_draft`: string -- Complete email response body, ready to send. Includes opening, body addressing all must-address points, and closing with clear next steps.
- `addressed_points`: object[] -- Array of points extracted from the thread, each with: `point` (string), `type` ("question", "request", "concern", "statement"), `addressed_in_response` (boolean), `response_section` (string), `deferred` (boolean), `deferral_reason` (string or null).
- `tone_analysis`: object -- Detected tone profile: `formality_level` ("formal", "semi-formal", "casual"), `urgency` ("high", "medium", "low"), `style` ("directive", "collaborative", "consultative"), `emotional_trajectory` ("escalating", "stable", "de-escalating"), `inferred_resolution_goal` (string), `tone_override_applied` (boolean), `justification` (string).
- `resolution_status`: object -- Assessment of whether response moves conversation forward: `closes_loops` (boolean), `provides_clarity` (boolean), `advances_next_steps` (boolean), `overall_resolution_score` (0-100), `score_methodology` (string), `confidence` ("high", "medium", "low").
- `validation_notes`: object[] -- Array of observations with structure: `category` ("info", "warning", "flag"), `note` (string), `phase` (string), `recommendation` (string or null).
- `follow_up_suggestion`: object -- Recommended follow-up action: `suggested_date` (ISO 8601 or null), `reason` (string), `action` (string).

---

## Execution Phases

### Phase 1: Parse and Structure the Email Thread

**Entry Criteria:**
- Email thread is provided as an array of message objects.
- Each message contains sender, recipient, timestamp, subject, and body.
- Thread is non-empty (at least one message).

**Actions:**
1. Validate that the thread is non-empty and chronologically ordered by timestamp. If out of order, reorder before proceeding.
2. Identify the primary conversation participants (most frequent senders/recipients). Flag if sender is unknown or role is ambiguous.
3. Detect thread structure: linear (A→B→A→B) vs. branched (multiple recipients or reply-all patterns). Note branching complexity.
4. Extract the conversation subject and any explicit metadata (labels, flags, urgency markers if present).
5. Verify that all messages have required fields (sender, body, timestamp). Flag any missing fields.
6. Count total messages and calculate thread span (time from first to last message).

**Output:**
- Structured thread with validated message sequence.
- Participant map with identified roles (or "unknown" if not identifiable).
- Thread structure classification (linear or branched).
- Thread metadata (subject, span, message count).

**Quality Gate:**
- Thread is chronologically ordered (verified by timestamp comparison).
- All messages have required fields (sender, body, timestamp); missing fields are flagged.
- Participant roles are identified or explicitly marked as "unknown".
- Thread structure is classified as linear or branched with complexity level noted.

---

### Phase 2: Extract Unresolved Points and Context

**Entry Criteria:**
- Structured thread from Phase 1 is available.
- Participant map is complete.

**Actions:**
1. Scan the thread for explicit questions (marked with "?", "please", "need", "can you", "could you", "would you"). Record exact text and message index.
2. Identify implicit requests or expectations (e.g., "waiting for your input", "let me know", "looking forward to"). Distinguish explicit from implicit.
3. Extract concerns or objections (e.g., "I'm worried about", "this won't work because", "concerned that"). Note emotional intensity.
4. Identify action items or commitments mentioned ("I will", "we should", "deadline is", "by [date]"). Extract owner and deadline if stated.
5. Determine what has been resolved vs. what remains open. Mark points as "resolved", "open", or "deferred".
6. Detect emotional tone shifts across the thread: escalating (frustration increasing), de-escalating (resolution-oriented), or stable. Flag if frustration or urgency is evident.
7. Categorize points by priority: must-address (direct questions, explicit requests, unresolved concerns) vs. nice-to-address (context, acknowledgments, secondary points).

**Output:**
- `unresolved_points`: Array of {point (string), type ("question"|"request"|"concern"|"statement"), sender (string), timestamp (ISO 8601), priority ("must-address"|"nice-to-address"), context (string)}.
- `action_items`: Array of {item (string), owner (string or "unassigned"), deadline (ISO 8601 or null), status ("open"|"in-progress"|"completed"), mentioned_in_message (integer index)}.
- `emotional_trajectory`: "escalating" | "stable" | "de-escalating".
- `must_address_count`: integer (number of must-address points).

**Quality Gate:**
- Every explicit question in the thread is captured in unresolved_points.
- Action items are listed with owners (if stated) and deadlines (if mentioned).
- Emotional trajectory is determined from at least 2 messages in the thread.
- Must-address points are clearly distinguished from nice-to-address points.

---

### Phase 3: Analyze Tone and Communication Style

**Entry Criteria:**
- Unresolved points and context from Phase 2.
- Responder role and optional tone override from inputs.
- Responder relationship to sender (if provided).
- Emotional trajectory from Phase 2.

**Actions:**
1. Examine the most recent 2-3 messages for tone cues: word choice (formal vs. casual), punctuation (exclamation marks, ellipses), sentence length (short = urgent, long = deliberate), formality markers (titles, contractions, salutations).
2. Compare tone across the thread: is it escalating, de-escalating, or stable? Use emotional_trajectory from Phase 2.
3. Identify the primary sender's communication style: direct vs. diplomatic, verbose vs. concise, technical vs. plain language. Base on message length and vocabulary.
4. If tone_override is provided, use it and note in output; otherwise, infer from thread analysis.
5. Determine formality level: formal (titles, full sentences, no contractions, structured), semi-formal (professional but conversational, some contractions), casual (contractions, informal phrases, friendly tone).
6. Assess urgency: high (deadline mentioned, repeated follow-ups, exclamation marks, "urgent", "ASAP"), medium (normal business pace, single follow-up), low (exploratory, no time pressure, open-ended).
7. Assess communication style: directive (commands, clear expectations, "must", "should"), collaborative (shared problem-solving, "we", "let's"), consultative (seeking input, deferential, "would you mind", "if you agree").
8. If responder_relationship_to_sender is "unknown", flag this and recommend a clarifying statement in the response opening.

**Output:**
- `formality_level`: "formal" | "semi-formal" | "casual".
- `urgency`: "high" | "medium" | "low".
- `communication_style`: "directive" | "collaborative" | "consultative".
- `emotional_trajectory`: "escalating" | "stable" | "de-escalating" (from Phase 2).
- `inferred_resolution_goal`: string (e.g., "close the issue", "provide clarification", "request more information").
- `tone_override_applied`: boolean.
- `responder_relationship_clarity`: "clear" | "unclear" (flag if relationship is unknown).
- `justification`: string (brief explanation of inferred tone, citing specific messages or phrases).

**Quality Gate:**
- Tone is inferred from at least 2 messages in the thread, with specific phrases cited.
- If tone_override is provided, it is noted and applied without modification.
- Formality, urgency, and communication style are explicitly stated, not assumed.
- If responder_relationship_to_sender is unknown, this is flagged in output.
- Emotional trajectory is consistent with Phase 2 analysis.

---

### Phase 4: Map Points to Response Elements

**Entry Criteria:**
- Unresolved points from Phase 2 (prioritized as must-address vs. nice-to-address).
- Tone profile from Phase 3.
- Resolution goal from inputs (or inferred from Phase 3).

**Actions:**
1. For each must-address point, determine the response type: answer (direct response to question), clarification (explain ambiguity), commitment (promise action), constraint (explain why not possible), escalation (refer to another person/team), or acknowledgment (recognize concern without resolving).
2. Identify any points that conflict or require trade-off decisions; note these as "decision points" with options and recommended approach.
3. Determine if the response should include: apology or acknowledgment of delay/issue, summary of what was discussed, explicit commitments or timelines, questions for clarification, suggestions or alternatives.
4. Map the response structure: opening (greeting, acknowledgment, relationship clarification if needed), body (point-by-point responses organized logically), closing (next steps, call to action, follow-up timeline).
5. For each must-address point, draft a brief response snippet (1-2 sentences) to test tone and completeness.
6. Estimate response length based on must-address point count: 1-3 points = 100-200 words, 4-6 points = 200-350 words, 7+ points = 350-500 words. Flag if draft will exceed 500 words.

**Output:**
- `response_outline`: Structured outline with sections: {opening (string), body_sections (array of {point (string), response_type (string), snippet (string)}), closing (string)}.
- `decision_points`: Array of {point (string), options (array of strings), recommended_approach (string), rationale (string)}.
- `response_structure`: {opening_elements (array), body_organization (string), closing_elements (array)}.
- `estimated_word_count`: integer.
- `length_flag`: boolean (true if estimated >500 words).

**Quality Gate:**
- Every must-address point is mapped to a response section with explicit response type.
- Decision points are identified and options are documented.
- Response structure is clear and logical, with opening, body, and closing defined.
- Estimated word count is calculated and flagged if exceeding 500 words.

---

### Phase 5: Draft the Response

**Entry Criteria:**
- Response outline from Phase 4.
- Tone profile from Phase 3.
- All prior analysis complete.
- If length_flag is true, prioritize must-address points and defer nice-to-address points.

**Actions:**
1. Write the opening: greet the sender by name if known, acknowledge the thread or specific message, set the tone. If responder_relationship_clarity is "unclear", include a brief clarifying statement (e.g., "I want to make sure I understand your role in this project"). Adjust formality and warmth based on tone profile.
2. Address each must-address point in the body, using the response type determined in Phase 4. Use imperative, clear language. For questions: provide direct answers; for requests: confirm or explain constraints; for concerns: acknowledge and address; for statements: acknowledge or provide context.
3. Organize body sections logically: by priority (must-address first), by thread order (follow conversation flow), or by topic (group related points). Choose organization that best matches communication_style (directive = priority order, collaborative = thread order, consultative = topic grouping).
4. For each point, use the tone profile: formality_level (formal = full sentences, no contractions; semi-formal = conversational but professional; casual = contractions, friendly), urgency (high = short sentences, action-oriented; medium = balanced; low = exploratory, open-ended), communication_style (directive = clear commitments; collaborative = shared language; consultative = deferential).
5. Include necessary context or background to make the response self-contained. Avoid jargon unless the sender used it first.
6. Write the closing: summarize next steps, provide a clear call to action, or offer further assistance. If action items are deferred, state when they will be addressed. If follow-up is needed, suggest a timeline.
7. Proofread for clarity: each paragraph should have 1-3 sentences; each sentence should be <25 words if possible; avoid ambiguous pronouns or references.
8. Verify tone consistency: read aloud to check for jarring shifts in formality or urgency.

**Output:**
- `response_draft`: string (complete email body text, ready to send).
- `draft_word_count`: integer.
- `tone_consistency_check`: {consistent (boolean), notes (string or null)}.

**Quality Gate:**
- Response addresses all must-address points from Phase 2.
- Tone is consistent throughout (formality, urgency, style do not shift unexpectedly).
- Response is clear and actionable (no vague statements like "we'll figure it out").
- No jargon or unclear references without explanation.
- Paragraphs are short (2-3 sentences) for readability.
- If responder_relationship_clarity was "unclear", a clarifying statement is included in opening.
- Draft word count is ≤500 words (or justified if exceeding).

---

### Phase 6: Validate Response Against Resolution Criteria

**Entry Criteria:**
- Response draft from Phase 5.
- Original thread and unresolved points from Phase 2.
- Resolution goal from Phase 3.
- Tone profile from Phase 3.

**Actions:**
1. Check completeness: for each must-address point, verify that the response addresses it. Mark each as "addressed", "deferred", or "not addressed". If any must-address point is not addressed or deferred, flag as critical issue.
2. Check clarity: read each response section and identify any ambiguous statements, unclear commitments, or references that require context. For each ambiguity, suggest a clarification.
3. Check tone match: compare response tone (formality, urgency, style) against inferred tone from Phase 3. Identify any jarring shifts or mismatches. If tone_override was applied, verify that response matches override.
4. Check resolution progress: for each must-address point, determine if the response closes the loop (answers question, resolves concern), provides clarity (explains decision, removes ambiguity), or advances next steps (proposes action, assigns owner, sets timeline). Assign each point a resolution indicator: 0 (not addressed), 1 (acknowledged but not resolved), 2 (partially resolved), 3 (fully resolved).
5. Calculate overall resolution score: (sum of resolution indicators / (must_address_count * 3)) * 100. Score ≥70 indicates response meaningfully advances conversation. Score <70 indicates iteration needed.
6. Check for unintended consequences: could the response be misinterpreted? Are there any commitments that may be difficult to keep? Are there any statements that could escalate the conversation?
7. If emotional_trajectory from Phase 2 is "escalating", verify that response includes empathetic opening and addresses concerns directly (not dismissively).
8. Assign confidence level: "high" if score ≥80, "medium" if 60-79, "low" if <60.

**Output:**
- `addressed_points`: Array of {point (string), type (string), addressed (boolean), deferred (boolean), deferral_reason (string or null), response_section (string), resolution_indicator (0|1|2|3)}.
- `clarity_check`: {ambiguous_statements (array of strings), suggestions (array of strings)}.
- `tone_match`: {matches_inferred_tone (boolean), notes (string or null), override_applied (boolean)}.
- `resolution_status`: {closes_loops (boolean), provides_clarity (boolean), advances_next_steps (boolean), overall_resolution_score (0-100), score_methodology (string), confidence ("high"|"medium"|"low")}.
- `validation_notes`: Array of {category ("info"|"warning"|"flag"), note (string), phase (string), recommendation (string or null)}.
- `iteration_needed`: boolean (true if score <70 or critical issues flagged).

**Quality Gate:**
- All must-address points are marked as addressed, deferred, or flagged as not addressed.
- Tone match is confirmed or flagged for revision.
- Resolution score is calculated using documented methodology.
- If iteration_needed is true, specific feedback is provided for Phase 5 revision.
- If emotional_trajectory is "escalating", empathetic tone is verified.

---

### Phase 7: Finalize and Output

**Entry Criteria:**
- Validation results from Phase 6.
- Response draft from Phase 5.
- iteration_needed flag from Phase 6.

**Actions:**
1. If iteration_needed is true (score <70 or critical issues flagged), return to Phase 5 with specific feedback: which points are unaddressed, which tone mismatches exist, which ambiguities need clarification. Repeat Phase 5 and Phase 6 until score ≥70 or two iteration loops completed.
2. If iteration_needed is false, proceed to finalization.
3. Finalize the response: proofread for grammar, spelling, and formatting. Verify no placeholder text or internal notes remain.
4. Compile all outputs: response_draft, addressed_points, tone_analysis, resolution_status, validation_notes, follow_up_suggestion.
5. Generate follow_up_suggestion: if response defers action items or requires follow-up, calculate suggested follow-up date (e.g., 3 business days after response send date, or on stated deadline). Provide reason and recommended action.
6. Add final validation: all outputs are complete, consistent, and ready for delivery.

**Output:**
- `response_draft`: string (final, ready-to-send email response).
- `addressed_points`: Complete mapping of thread points to response (from Phase 6).
- `tone_analysis`: Confirmed tone profile (from Phase 3).
- `resolution_status`: Final resolution assessment (from Phase 6).
- `validation_notes`: Final observations (from Phase 6).
- `follow_up_suggestion`: {suggested_date (ISO 8601 or null), reason (string), action (string)}.
- `iteration_count`: integer (number of Phase 5/6 loops completed).
- `ready_to_send`: boolean (true if all validation passed).

**Quality Gate:**
- Response is grammatically correct and ready to send.
- All outputs are complete and consistent.
- No internal notes or placeholders remain in the response.
- If iteration was needed, it was completed and score ≥70 achieved or two loops completed.
- Follow-up suggestion is provided if response defers action items.
- ready_to_send flag is true.

---

## Exit Criteria

The skill is complete when:
1. A response draft has been generated that addresses all must-address points from the email thread (verified in Phase 6).
2. The response tone matches the inferred or overridden tone profile (verified in Phase 6 tone_match).
3. Validation confirms that the response moves the conversation toward resolution: overall_resolution_score ≥70 OR two iteration loops completed with documented feedback (verified in Phase 6 and Phase 7).
4. All outputs (response_draft, addressed_points, tone_analysis, resolution_status, validation_notes, follow_up_suggestion) are populated and consistent.
5. The response is ready to send without further editing (ready_to_send = true).
6. If responder_relationship_to_sender was unknown, a clarifying statement is included in the response opening.
7. If emotional_trajectory was escalating, response includes empathetic opening and direct concern addressing.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Email thread is empty or malformed (no recognizable messages) | **Abort** -- request a valid email thread with at least one message containing sender, recipient, timestamp, subject, and body |
| Phase 1 | Messages are not chronologically ordered | **Adjust** -- reorder messages by timestamp before proceeding; document reordering in validation_notes |
| Phase 2 | No unresolved points are identified (thread is purely informational) | **Adjust** -- treat the response as an acknowledgment; set resolution_goal to "acknowledge and summarize"; focus on tone match and brief summary in Phase 5 |
| Phase 3 | Tone is ambiguous or contradictory across messages | **Adjust** -- use the most recent message's tone as the primary signal; note the ambiguity in validation_notes with category "warning"; if emotional_trajectory is escalating, default to empathetic tone |
| Phase 3 | responder_relationship_to_sender is unknown | **Adjust** -- flag in tone_analysis with responder_relationship_clarity = "unclear"; require clarifying statement in response opening (Phase 5 quality gate) |
| Phase 4 | Resolution goal is unclear | **Adjust** -- infer from the most recent message or the primary sender's intent; document the assumption in tone_analysis.inferred_resolution_goal |
| Phase 5 | Response exceeds 500 words | **Adjust** -- condense by removing nice-to-address points or deferring secondary issues to a follow-up; prioritize must-address points; document deferral in addressed_points with deferred = true and deferral_reason |
| Phase 5 | Tone conflict detected during drafting (response tone does not match inferred tone) | **Adjust** -- revise response to match tone; if conflict persists after revision, flag in validation_notes with category "flag" and let user decide |
| Phase 6 | Validation score is <70 | **Retry** -- return to Phase 5 with specific feedback on which points are unaddressed, which tone mismatches exist, which ambiguities need clarification. Repeat Phase 5 and Phase 6 until score ≥70 or two iteration loops completed |
| Phase 6 | Response tone conflicts with inferred tone after Phase 5 revision | **Adjust** -- revise response again; if conflict persists, flag in validation_notes with category "flag" and confidence = "low"; document in iteration_count |
| Phase 6 | Response commits to something that conflicts with prior commitments in thread | **Adjust** -- flag in validation_notes with category "flag" and recommendation to review before sending; do not block finalization but alert user |
| Phase 7 | Two iteration loops completed but score still <70 | **Adjust** -- finalize response with iteration_count = 2 and ready_to_send = false; include detailed validation_notes explaining remaining issues; recommend user review and manual revision |

---

## Reference Section

### Domain Knowledge: Email Communication Patterns

**Point Types:**
- **Question**: Requires a direct answer or clarification. Response type: answer or clarification.
- **Request**: Requires a commitment, timeline, or explanation of constraints. Response type: commitment or constraint.
- **Concern**: Requires acknowledgment and reassurance or problem-solving. Response type: acknowledgment or escalation.
- **Statement**: May require acknowledgment or context; often informational. Response type: acknowledgment or no response needed.

**Tone Dimensions:**
- **Formality**: Formal (titles, no contractions, structured) → Semi-formal (professional, conversational) → Casual (contractions, informal).
- **Urgency**: High (deadline, repeated follow-ups, "ASAP", exclamation marks) → Medium (normal business pace, single follow-up) → Low (exploratory, no time pressure).
- **Style**: Directive (commands, clear expectations, "must", "should") → Collaborative (shared problem-solving, "we", "let's") → Consultative (seeking input, deferential, "would you mind").
- **Emotional Trajectory**: Escalating (frustration increasing, tone sharpening) → Stable (consistent tone) → De-escalating (resolution-oriented, tone softening).

**Resolution Indicators (per point):**
- **0**: Point not addressed in response.
- **1**: Point acknowledged but not resolved (e.g., "I understand your concern").
- **2**: Point partially resolved (e.g., answer provided but timeline unclear).
- **3**: Point fully resolved (e.g., question answered, commitment made with timeline, concern addressed with solution).

**Resolution Score Methodology:**
- Sum resolution indicators across all must-address points.
- Divide by (must_address_count × 3) to normalize to 0-1 scale.
- Multiply by 100 to get 0-100 score.
- Score ≥70 indicates response meaningfully advances conversation.
- Score 60-69 indicates partial resolution, may need iteration.
- Score <60 indicates insufficient resolution, iteration required.

**Best Practices:**
- Address the most recent or most urgent point first (unless thread order is more natural).
- Use the sender's name if known; use formal title if relationship is unclear.
- Mirror the sender's level of formality (slightly more formal is safer).
- Provide specific timelines for commitments ("by Friday, 5pm" not "soon").
- Offer a clear next step or call to action ("Please let me know by [date]").
- Keep paragraphs short (2-3 sentences) for readability.
- Avoid jargon unless the sender used it first.
- If emotional_trajectory is escalating, open with empathy and address concerns directly.
- If responder_relationship_to_sender is unknown, include a clarifying statement ("I want to make sure I understand your role...").

### Decision Criteria for Response Type

**When to answer directly:** The question has a factual answer and no ambiguity. Provide the answer in 1-2 sentences.
**When to clarify:** The question is ambiguous or requires context to answer. Ask for clarification or provide context before answering.
**When to commit:** The request is within scope and feasible. Provide a clear commitment with timeline ("I will [action] by [date]").
**When to explain constraints:** The request is out of scope or not feasible; explain why and offer alternatives ("I can't [action] because [reason], but I can [alternative]").
**When to escalate:** The issue is beyond your authority or expertise; identify the right person or team ("This is outside my area; I'll connect you with [person/team]").
**When to acknowledge:** The point is a statement or concern that doesn't require action. Acknowledge the point and provide context if helpful ("I understand your concern about [topic]").

### Follow-Up Scheduling Logic

- If response defers action items: suggest follow-up 1-3 business days after stated deadline or 3 business days after response send date, whichever is later.
- If response requests information from sender: suggest follow-up 5-7 business days after response send date.
- If response is urgent (urgency = "high"): suggest follow-up 1-2 business days after response send date.
- If response is exploratory (urgency = "low"): suggest follow-up 10-14 business days after response send date or null if no follow-up needed.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.