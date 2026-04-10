# Presentation Architect

**One-line description:** Transform a presentation topic and audience profile into a complete narrative arc, key messages, anticipated objections, stakeholder strategies, and Q&A preparation.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `presentation_topic` (string, required): The subject matter, title, or core idea of the presentation. Examples: "Cloud Migration Strategy," "Q3 Financial Results," "Product Launch Roadmap."
- `audience_description` (string, required): A description of who will attend. Include: approximate size, role/title, expertise level (novice/intermediate/expert), key interests, pain points, and any relevant context (e.g., "50 engineering managers, mostly from Fortune 500 companies, concerned about team retention and technical debt").
- `presentation_context` (string, optional): Where, when, and how the presentation occurs. Include: venue type (in-person/virtual/hybrid), event type (conference/internal meeting/client pitch/workshop), time allocation (total minutes available), and format constraints (e.g., "30 minutes, no live demos, 100-person virtual audience"). Defaults to "internal meeting, 60 minutes, in-person, no constraints specified."
- `known_constraints` (string, optional): Additional constraints such as regulatory requirements, brand guidelines, or technical limitations (e.g., "no proprietary data, must comply with GDPR").

---

## Outputs

- `presentation_architecture` (object): A complete, structured presentation plan containing:
  - `topic` (string): The presentation topic
  - `audience_profile` (object): Audience segmentation with stakeholder types, priorities, and concerns
  - `narrative_arc` (object): Opening hook, three acts, closing call-to-action
  - `key_messages` (array of strings): 3-5 core messages tailored to the audience
  - `stakeholder_strategies` (array of objects): Message priorities and objection handling per stakeholder type
  - `anticipated_objections` (array of objects): Each with objection text, source, counter-argument, and supporting evidence
  - `qa_preparation` (object): Likely questions, concise responses, and follow-up tactics
  - `visual_strategy` (object): Visual metaphors, chart types, and design guidance mapped to key messages
  - `speaker_notes` (object): Guidance on tone, pacing, emphasis, transitions, and engagement moments
  - `post_presentation_follow_up` (object): Reinforcement strategy, resources, and next steps
  - `validation_checklist` (object): Confirms all components are present and aligned

---

## Execution Phases

### Phase 1: Validate Topic, Audience Profile, and Context

**Entry Criteria:**
- `presentation_topic` is provided and non-empty
- `audience_description` is provided and contains at least role and expertise level
- `presentation_context` is provided or will use default

**Actions:**
1. Parse the presentation topic. If it is a single word or extremely vague (e.g., "stuff"), request clarification with the prompt: "What specific aspect of [topic] will you cover? Who is the decision-maker or stakeholder you're trying to influence?"
2. Parse the audience description. Extract and document: size (if given; default to "unspecified"), role, expertise level, pain points, interests, and any stakeholder types mentioned (e.g., executive, technical, end-user).
3. If audience description is sparse, infer reasonable defaults using these rules: (a) if size is unspecified, assume 20-50 people; (b) if expertise level is unspecified, assume mixed (novice to intermediate); (c) if pain points are unspecified, infer from role (e.g., CFO pain points: cost, ROI; CTO pain points: technical risk, scalability); (d) if stakeholder types are unspecified, assume mixed audience with at least one decision-maker and one implementer.
4. Parse the presentation context. Extract: venue type, event type, time allocation, and format constraints. If context is not provided, use defaults: "internal meeting, 60 minutes, in-person, no constraints."
5. Document all assumptions made in step 3 and 4.
6. Identify if the audience contains multiple stakeholder types with potentially conflicting priorities (e.g., CFO focused on cost, CTO focused on technical risk). Flag for Phase 2.5 (Stakeholder Analysis).

**Output:**
- `topic_validated` (boolean): True if topic is actionable
- `audience_profile` (object): Keys: `size`, `role`, `expertise_level`, `pain_points`, `interests`, `context`, `stakeholder_types`, `assumptions`
- `presentation_context_parsed` (object): Keys: `venue_type`, `event_type`, `time_allocation_minutes`, `format_constraints`, `assumptions`
- `stakeholder_conflict_flag` (boolean): True if multiple stakeholder types with conflicting priorities are detected

**Quality Gate:** Audience profile is detailed enough to inform message and objection generation. Topic is specific enough to guide narrative structure. Context is clear enough to inform pacing and format decisions. All assumptions are documented.

---

### Phase 2: Analyze Stakeholders and Prioritize Messages

**Entry Criteria:**
- Topic is validated
- Audience profile is complete
- Stakeholder conflict flag is available

**Actions:**
1. If stakeholder_conflict_flag is False (single stakeholder type), proceed to Phase 3.
2. If stakeholder_conflict_flag is True, identify each stakeholder type present in the audience. For each type, document: (a) role/title, (b) primary success metric (what they care about: cost, speed, risk, innovation, etc.), (c) likely objections, (d) decision-making authority (high/medium/low).
3. For each stakeholder type, draft a priority ranking of key messages (to be refined in Phase 3). Example: CFO prioritizes "cost reduction" and "ROI timeline"; CTO prioritizes "technical risk mitigation" and "team capability."
4. Identify overlapping interests across stakeholder types. These become the "universal messages" that appeal to all segments.
5. Identify conflicting interests. For each conflict, draft a bridging message that acknowledges both concerns. Example: "Cloud migration requires upfront investment (CFO concern) but reduces long-term operational risk and frees engineering time for innovation (CTO concern)."
6. Document the stakeholder map and message priorities for use in Phase 3.

**Output:**
- `stakeholder_map` (array of objects): Each object contains: `stakeholder_type`, `role`, `success_metric`, `likely_objections`, `decision_authority`, `message_priorities` (array ordered by importance)
- `universal_messages` (array of strings): Messages that resonate across all stakeholder types
- `bridging_messages` (array of objects): Each contains: `conflict_description`, `bridging_message`, `stakeholder_types_addressed`

**Quality Gate:** Stakeholder types are distinct and grounded in the audience profile. Message priorities are specific to each stakeholder type. Bridging messages acknowledge and synthesize conflicting interests without being contradictory.

---

### Phase 3: Generate Narrative Arc

**Entry Criteria:**
- Topic is validated
- Audience profile is complete
- Stakeholder analysis is complete (if applicable)

**Actions:**
1. Design an opening hook tailored to the audience's primary pain points or interests. The hook should be a question, surprising fact, or relatable scenario that captures attention within 30 seconds. If multiple stakeholder types exist, the hook should appeal to the most senior or decision-making stakeholder type.
2. Outline Act 1 (Setup): Establish the problem, context, or opportunity. Why should the audience care? Reference the audience's pain points explicitly. Allocate time based on presentation_context: for 30-minute presentations, 3-5 minutes; for 60-minute presentations, 5-10 minutes; for 90+ minute presentations, 10-15 minutes.
3. Outline Act 2 (Development): Present the core content, evidence, or solution. Build credibility and understanding. Address each stakeholder type's success metric. Allocate time: for 30-minute presentations, 15-20 minutes; for 60-minute presentations, 30-40 minutes; for 90+ minute presentations, 45-60 minutes.
4. Outline Act 3 (Climax): Synthesize the key insight or call-to-action. What is the audience meant to do or believe? If multiple stakeholder types exist, the call-to-action should specify what each type should do. Allocate time: for 30-minute presentations, 3-5 minutes; for 60-minute presentations, 5-10 minutes; for 90+ minute presentations, 10-15 minutes.
5. Design a closing statement that reinforces the call-to-action and leaves a lasting impression. The closing should be memorable and actionable (e.g., "By next quarter, we'll have migrated 30% of our infrastructure. Your role is to ensure your team is ready.").
6. Verify that the arc is coherent, audience-relevant, and progresses logically from hook to close. Each act serves a clear purpose and respects the time allocation from presentation_context.

**Output:**
- `narrative_arc` (object):
  - `opening_hook` (string): 1-2 sentences, specific to audience pain points
  - `act_1_setup` (string): 2-3 sentences describing the problem or context, with explicit reference to audience pain points
  - `act_1_time_allocation_minutes` (number): Time to allocate to Act 1 based on presentation_context
  - `act_2_development` (string): 3-4 sentences outlining the core content and evidence, addressing each stakeholder type's success metric
  - `act_2_time_allocation_minutes` (number): Time to allocate to Act 2 based on presentation_context
  - `act_3_climax` (string): 2-3 sentences synthesizing the insight or call-to-action, with specific actions per stakeholder type if applicable
  - `act_3_time_allocation_minutes` (number): Time to allocate to Act 3 based on presentation_context
  - `closing_statement` (string): 1-2 sentences reinforcing the message and call-to-action
  - `total_time_minutes` (number): Sum of all act allocations plus Q&A buffer

**Quality Gate:** The arc is coherent, audience-relevant, and progresses logically from hook to close. Each act serves a clear purpose. Time allocations sum to presentation_context time_allocation_minutes (with 10-15% buffer for Q&A). If multiple stakeholder types exist, each type's success metric is addressed in Act 2 and each type's action is specified in Act 3.

---

### Phase 4: Identify Key Messages

**Entry Criteria:**
- Narrative arc is complete
- Audience profile is available
- Stakeholder analysis is complete (if applicable)

**Actions:**
1. Extract 3-5 distinct, memorable messages from the narrative arc. Each message should be a single sentence or short phrase (under 15 words).
2. Ensure each message is relevant to the audience's role, interests, or pain points. If multiple stakeholder types exist, ensure each message addresses at least one stakeholder type's success metric.
3. Verify that messages are mutually supporting and non-contradictory. No two messages should overlap in meaning.
4. Prioritize messages by importance: (a) messages addressing the most senior stakeholder type first, (b) messages addressing universal interests second, (c) messages addressing specific stakeholder types third.
5. For each message, identify which stakeholder type(s) it addresses. Example: "Cloud migration reduces infrastructure costs by 30-40%" addresses CFO (cost metric).

**Output:**
- `key_messages` (array of objects): 3-5 messages, ordered by priority. Each object contains:
  - `message` (string): The message (under 15 words)
  - `stakeholder_types_addressed` (array of strings): Which stakeholder types this message resonates with
  - `supporting_evidence` (string): Brief evidence or example (1-2 sentences)

**Quality Gate:** Each message is distinct, actionable, and defensible. Messages align with the narrative arc and audience needs. If multiple stakeholder types exist, all stakeholder types are addressed by at least one message. No message is vague or jargon-heavy.

---

### Phase 5: Anticipate Objections and Develop Counter-Arguments

**Entry Criteria:**
- Key messages are identified
- Audience profile is available
- Stakeholder analysis is complete (if applicable)

**Actions:**
1. For each key message, identify 1-2 objections the audience might raise based on their role, expertise, pain points, or past experience. If multiple stakeholder types exist, identify objections specific to each type.
2. For each objection, determine the likely source: skepticism, competing priority, budget constraints, past failed experience, technical concern, risk aversion, etc.
3. Develop a substantive counter-argument supported by evidence, example, or logic. The counter-argument should be 2-3 sentences and non-defensive.
4. For each counter-argument, identify supporting evidence: data, case study, expert quote, or logical reasoning.
5. Ensure counter-arguments are concise and do not introduce new objections. Test each counter-argument by asking: "Does this response make the objection go away, or does it raise new concerns?"

**Output:**
- `anticipated_objections` (array of objects). Each object contains:
  - `objection_text` (string): The objection as the audience might voice it
  - `stakeholder_type` (string): Which stakeholder type is likely to raise this
  - `likely_source` (string): Why the audience might raise this (e.g., "past failed migration", "budget constraints")
  - `counter_argument` (string): A substantive response (2-3 sentences, non-defensive)
  - `evidence_or_example` (string): Data, case study, or example supporting the counter-argument
  - `follow_up_question` (string): A question to redirect the conversation back to key messages (e.g., "Does that address your concern about timeline?")

**Quality Gate:** Objections are realistic and grounded in the audience's context. Counter-arguments are evidence-based, not dismissive. Each counter-argument is 2-3 sentences and does not introduce new objections. If multiple stakeholder types exist, objections and counter-arguments are tailored to each type.

---

### Phase 6: Prepare Q&A Responses and Follow-Up Tactics

**Entry Criteria:**
- Key messages are identified
- Anticipated objections are documented

**Actions:**
1. Generate 5-8 likely questions the audience will ask, based on the topic, narrative, key messages, and anticipated objections. If multiple stakeholder types exist, generate at least one question per stakeholder type.
2. For each question, write a concise response (2-3 sentences) that is on-message and directly addresses the question. Each response should reference or reinforce at least one key message.
3. Identify follow-up tactics: (a) how to redirect an off-topic question back to key messages, (b) how to defer an out-of-scope question with a promise to follow up, (c) how to invite deeper discussion on an important topic, (d) how to handle a hostile or skeptical question without becoming defensive.
4. Prepare 2-3 bridging statements to transition from Q&A back to key messages (e.g., "That's a great question, and it ties back to our first message: ...").
5. Prepare a closing statement for Q&A that reinforces the call-to-action and invites next steps (e.g., "Thank you for these questions. Our next step is to form a working group to plan the migration. I'll send a calendar invite this week.").

**Output:**
- `qa_preparation` (object):
  - `likely_questions` (array of objects): 5-8 questions, each with: `question_text`, `stakeholder_type`, `question_category` (e.g., "timeline", "cost", "risk")
  - `responses` (object): Keys are question_text; values are concise answers (2-3 sentences each) with key message reference
  - `follow_up_tactics` (array of objects): Each contains: `tactic_name` (e.g., "redirect to key message"), `trigger` (when to use), `example_response`
  - `bridging_statements` (array of strings): 2-3 phrases to reconnect Q&A to key messages
  - `qa_closing_statement` (string): A closing statement for Q&A that reinforces call-to-action and invites next steps

**Quality Gate:** Responses are concise (2-3 sentences), on-message, and anticipatory. Each response references a key message. Follow-up tactics are practical and non-evasive. If multiple stakeholder types exist, at least one question per type is addressed. Q&A closing statement is actionable and invites next steps.

---

### Phase 7: Design Visual Strategy

**Entry Criteria:**
- Key messages are identified
- Narrative arc is complete

**Actions:**
1. For each key message, identify a visual metaphor, chart type, or design element that reinforces the message. Examples: "Cost reduction" → bar chart showing cost over time; "Risk mitigation" → risk matrix or timeline; "Team capability" → skills matrix or learning curve.
2. For each act of the narrative arc, identify visual anchors: opening hook (image or video), Act 1 setup (problem visualization), Act 2 development (evidence charts, case study visuals), Act 3 climax (call-to-action visual), closing (memorable image or quote).
3. Specify design guidance: color scheme (brand colors), typography (readable from 20+ feet away), animation (minimal, purposeful), and accessibility (high contrast, alt text for images).
4. Map visuals to time allocations: ensure visual density matches pacing (more visuals in longer acts, fewer in short acts).
5. Identify any visuals that require live data or updates (e.g., real-time metrics). Flag these for speaker preparation.

**Output:**
- `visual_strategy` (object):
  - `key_message_visuals` (array of objects): Each contains: `message`, `visual_type` (e.g., "bar chart", "metaphor", "image"), `description`, `design_notes`
  - `narrative_arc_visuals` (object): Keys are acts (opening_hook, act_1, act_2, act_3, closing); values are visual descriptions and design guidance
  - `design_guidance` (object): Keys: `color_scheme`, `typography`, `animation_approach`, `accessibility_requirements`
  - `live_data_flags` (array of strings): Visuals that require real-time updates or speaker preparation

**Quality Gate:** Each key message has a corresponding visual. Visual density matches pacing. Design guidance is specific and actionable. All live data flags are documented.

---

### Phase 8: Assemble and Validate Presentation Architecture

**Entry Criteria:**
- All prior phases are complete

**Actions:**
1. Combine narrative arc, key messages, stakeholder strategies, anticipated objections, Q&A preparation, and visual strategy into a single, coherent architecture object.
2. Add speaker notes: guidance on tone (formal/conversational/energetic), pacing (time per act), emphasis (which phrases to repeat or highlight), transitions between acts, and engagement moments (where to pause for questions or reflection).
3. Add post-presentation follow-up strategy: (a) email summary reinforcing key messages, (b) resources for deeper learning, (c) next steps and timeline, (d) contact information for follow-up questions.
4. Verify internal consistency: (a) do all components align with the audience profile and topic? (b) is every key message supported by the narrative arc? (c) is every anticipated objection addressed in Q&A? (d) does every visual reinforce a key message? (e) if multiple stakeholder types exist, is each type addressed in key messages, objection handling, and Q&A?
5. Verify completeness: all required components are present and populated.
6. Format the output for speaker use: clear structure, easy to scan during presentation prep, with time allocations and emphasis cues.
7. Generate a validation checklist confirming all components are present and aligned.

**Output:**
- `presentation_architecture` (object):
  - `topic` (string): The presentation topic
  - `audience_profile` (object): From Phase 1
  - `presentation_context` (object): From Phase 1
  - `stakeholder_map` (array): From Phase 2 (if applicable)
  - `narrative_arc` (object): From Phase 3
  - `key_messages` (array): From Phase 4
  - `anticipated_objections` (array): From Phase 5
  - `qa_preparation` (object): From Phase 6
  - `visual_strategy` (object): From Phase 7
  - `speaker_notes` (object): Guidance on tone, pacing, emphasis, transitions, and engagement moments
  - `post_presentation_follow_up` (object): Email summary template, resources, next steps, contact info
  - `validation_checklist` (object): Confirms all components are present and aligned

**Quality Gate:** The architecture is complete, internally consistent, and ready for speaker use. A speaker unfamiliar with the topic could deliver a coherent, audience-resonant presentation using this architecture. All stakeholder types (if multiple) are addressed. All time allocations sum to presentation_context time_allocation_minutes (with 10-15% buffer for Q&A). All visuals are mapped to key messages.

---

## Exit Criteria

The skill is complete when:
1. All eight phases have been executed in order.
2. The `presentation_architecture` object contains all required components: narrative arc, key messages, stakeholder strategies (if applicable), anticipated objections, Q&A preparation, visual strategy, speaker notes, and post-presentation follow-up.
3. Internal consistency check passes: (a) narrative arc supports key messages; (b) key messages are addressed in Q&A; (c) anticipated objections have counter-arguments; (d) all visuals reinforce key messages; (e) if multiple stakeholder types exist, all types are addressed in key messages, objection handling, and Q&A.
4. Speaker notes provide actionable guidance on tone, pacing, emphasis, transitions, and engagement moments.
5. Time allocations sum to presentation_context time_allocation_minutes (with 10-15% buffer for Q&A).
6. Post-presentation follow-up strategy is documented and actionable.
7. The output is formatted for immediate speaker use (clear structure, scannable, with time cues and emphasis markers).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Topic is a single word or extremely vague (e.g., "presentation") | **Adjust** -- Request clarification: "What specific aspect of [topic] will you cover? Who is the decision-maker or stakeholder you're trying to influence?" Do not proceed until topic is clarified. |
| Phase 1 | Audience description is missing or generic (e.g., "business people") | **Adjust** -- Infer reasonable defaults using the rules in Phase 1 Action 3. Document all assumptions. Ask for follow-up detail if available. Proceed with documented assumptions. |
| Phase 1 | Presentation context is missing | **Adjust** -- Use default context: "internal meeting, 60 minutes, in-person, no constraints." Document this assumption. |
| Phase 2 | Stakeholder types have fundamentally conflicting goals (e.g., cost-cutting vs. innovation investment) | **Adjust** -- Generate separate message priorities for each stakeholder type. Identify bridging messages that acknowledge both concerns. If no bridging message is possible, flag for speaker review and recommend addressing each stakeholder type separately in different sections of the presentation. |
| Phase 3 | Narrative arc feels disconnected from audience pain points | **Adjust** -- Revise the opening hook and Act 1 setup to directly reference audience concerns from audience_profile. Revalidate against audience profile. |
| Phase 4 | Key messages are too numerous (>5) or too vague | **Adjust** -- Consolidate messages by theme. Ensure each message is a single, concrete claim (under 15 words). Remove messages that do not directly address audience pain points or stakeholder success metrics. |
| Phase 5 | Cannot identify realistic objections | **Adjust** -- Review audience profile and stakeholder map for implicit concerns (budget, timeline, risk, capability gaps). If still unclear, generate speculative objections based on common objections in the domain (e.g., for technology presentations: "Will this work with our legacy systems?", "Do we have the skills to implement this?"). Document that objections are speculative. |
| Phase 6 | Q&A responses are too long (>3 sentences) or off-message | **Adjust** -- Trim to 2-3 sentences. Rewrite to directly address the question while reinforcing a key message. |
| Phase 7 | Visual strategy exceeds 10 distinct visuals | **Adjust** -- Consolidate visuals by theme. Ensure each visual reinforces a key message. Remove decorative visuals that do not support the narrative. |
| Phase 8 | Architecture exceeds 3000 words | **Adjust** -- Consider splitting into a primary presentation architecture (core narrative, key messages, Q&A) and a detailed reference document (full stakeholder analysis, extended objection handling, visual design specs). Ensure speaker notes are concise (under 500 words). |
| Phase 8 | Internal consistency check fails (e.g., a key message is not addressed in Q&A, or a stakeholder type is not addressed in objection handling) | **Adjust** -- Identify the missing component. Loop back to the relevant phase (Phase 4, 5, or 6) to add the missing content. Re-run the consistency check. |
| Phase 8 | User rejects final output | **Targeted revision** -- ask which slide structure, narrative arc, or objection-handling section fell short and rerun only that phase. Do not rebuild the full architecture. |

---

## Reference Section

### Narrative Arc Template

A strong presentation follows a three-act structure:
- **Act 1 (Setup):** Establish the problem, opportunity, or context. Answer: "Why should I care?" Time: 5-15% of total presentation time.
- **Act 2 (Development):** Present evidence, examples, or solutions. Build credibility and understanding. Address each stakeholder type's success metric. Time: 60-70% of total presentation time.
- **Act 3 (Climax):** Synthesize the insight and call-to-action. Answer: "What should I do or believe?" Specify actions per stakeholder type if applicable. Time: 10-20% of total presentation time.

### Key Message Criteria

Each key message should be:
- **Distinct:** No two messages overlap in meaning.
- **Memorable:** Phrased in a way the audience will remember (concrete, specific, not jargon-heavy, under 15 words).
- **Actionable:** Implies something the audience should do, believe, or consider.
- **Audience-Relevant:** Directly addresses the audience's role, interests, pain points, or stakeholder success metric.
- **Defensible:** Supported by evidence or logic presented in the narrative arc.
- **Stakeholder-Mapped:** Each message addresses at least one stakeholder type's success metric.

### Stakeholder Analysis Framework

For each stakeholder type, document:
1. **Role/Title:** What is their position in the organization?
2. **Success Metric:** What do they care about? (cost, speed, risk, innovation, team capability, customer satisfaction, etc.)
3. **Decision Authority:** Can they approve, influence, or implement the proposal? (high/medium/low)
4. **Likely Objections:** What concerns might they raise?
5. **Message Priorities:** Which key messages resonate most with this stakeholder type?

Example:
- **Stakeholder Type:** CFO
- **Success Metric:** Cost reduction, ROI, financial risk mitigation
- **Decision Authority:** High (budget approval)
- **Likely Objections:** "This will cost too much", "The ROI timeline is too long", "We can't afford the upfront investment"
- **Message Priorities:** ["Cloud migration reduces infrastructure costs by 30-40%", "ROI is achieved within 18 months", "Phased approach spreads investment over time"]

### Objection Handling Strategy

When an objection arises:
1. **Acknowledge:** "That's a valid concern." (Do not dismiss or minimize.)
2. **Reframe:** Connect the objection to a key message or evidence from the narrative.
3. **Respond:** Provide the counter-argument and evidence.
4. **Bridge:** Redirect to the next key message or Q&A topic.

Example: "That's a valid concern about cost. Our research shows that while migration requires upfront investment, companies see a 30-40% reduction in infrastructure costs within 18 months. That's our first key message: cloud migration reduces costs. Let's talk about how to structure the investment to minimize risk."

### Speaker Notes Guidance

- **Tone:** Match the audience formality (formal for executive audiences, conversational for peer groups, energetic for large conferences).
- **Pacing:** Allocate time to each act proportionally based on presentation_context. Act 2 (development) typically takes 60-70% of the presentation.
- **Emphasis:** Highlight key messages with pauses, repetition, or visual emphasis. Repeat each key message at least twice during the presentation.
- **Transitions:** Use bridging statements to move between acts and to Q&A (e.g., "Now that we've established the problem, let's look at the solution.").
- **Engagement:** Plan 1-2 moments for audience interaction (questions, polls, reflection, small group discussion). For virtual presentations, use chat or polls to maintain engagement.
- **Pacing Cues:** Include time markers in speaker notes (e.g., "[5 min] Opening hook", "[15 min] Act 1 setup") to help speaker stay on track.

### Post-Presentation Follow-Up Strategy

Presentations are often the start of a conversation, not the end. Plan follow-up:
1. **Email Summary:** Send within 24 hours. Reinforce key messages, include links to resources, and specify next steps.
2. **Resources:** Provide whitepapers, case studies, or documentation for deeper learning.
3. **Next Steps:** Specify what happens next (e.g., "We'll form a working group to plan the migration. I'll send a calendar invite this week.").
4. **Contact Information:** Make it easy for audience members to follow up with questions.
5. **Timeline:** Specify when the next communication will occur (e.g., "We'll reconvene in 2 weeks to discuss implementation details.").

### Visual Design Principles

- **One Message Per Slide:** Each visual should reinforce a single key message or narrative point.
- **High Contrast:** Ensure text and visuals are readable from 20+ feet away.
- **Minimal Animation:** Use animation purposefully (e.g., to reveal data progressively), not decoratively.
- **Consistent Branding:** Use brand colors, fonts, and logo consistently.
- **Accessibility:** Include alt text for images, use high-contrast colors, avoid red-green color combinations.
- **Data Visualization:** Use chart types that match the data (bar charts for comparisons, line charts for trends, pie charts sparingly for parts of a whole).

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.