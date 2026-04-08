# Conflict Resolution Strategy Recommender

**One-line description:** Analyzes a conflict using the Thomas-Kilmann framework and recommends resolution strategies matched to relationship type and stakes.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `conflict_description` (string, required): Narrative description of the conflict including parties involved, the core disagreement, what each party wants, and any relevant history.
- `relationship_type` (string, optional): Category of relationship (e.g., "professional peer", "manager-report", "personal", "vendor", "client"). If omitted, will be inferred from conflict description.
- `relationship_importance` (number, optional): How important is maintaining this relationship? Scale 1-5 (1=disposable, 5=critical). If omitted, inferred from context.
- `stakes_level` (string, optional): Severity of consequences if unresolved: "low", "medium", or "high". If omitted, inferred from conflict description.
- `your_assertiveness_preference` (number, optional): Your natural tendency to assert your own needs (1-5 scale). If omitted, will be assessed from conflict description.

## Outputs

- `conflict_summary` (object): Structured summary with keys: parties (array), core_issue (string), relationship_type (string), stakes (string), urgency (string).
- `thomas_kilmann_analysis` (object): Keys: assertiveness_score (1-5), cooperativeness_score (1-5), recommended_mode (string), secondary_mode (string or null), mode_rationale (string).
- `recommended_strategies` (array of objects): Each object contains: strategy_name (string), description (string), when_to_use (string), expected_outcome (string), risks (string).
- `implementation_guidance` (object): Keys: timing (string), communication_approach (string), potential_obstacles (array), success_indicators (array).
- `confidence_level` (string): "high", "medium", or "low" based on clarity of input and fit to framework.

---

## Execution Phases

### Phase 0: Pre-Flight Information Check

**Entry Criteria:**
- User is ready to analyze a conflict.

**Actions:**
1. Confirm that conflict_description is provided and contains at least: two parties, one core disagreement, and what each party wants.
2. If any of these elements is missing, ask the user to provide specifics before proceeding.
3. Note any optional inputs that are missing (relationship_type, relationship_importance, stakes_level) and plan to infer them in Phase 2.
4. Flag any information that would improve confidence (e.g., "Have you attempted any resolution yet?", "How long has this conflict existed?").

**Output:**
- Confirmation that conflict_description is sufficient to proceed, or a list of clarifying questions.
- List of missing optional inputs and inference plan.

**Quality Gate:**
- Conflict description contains at least 2 parties and 1 core disagreement.
- If critical information is missing, the user is asked to provide it before Phase 1 begins.
- If user chooses to proceed with incomplete information, this is documented and confidence level is flagged as "low" in the final output.

---

### Phase 1: Parse and Validate Conflict Description

**Entry Criteria:**
- Conflict description is provided and contains at least 2 parties and 1 core disagreement.

**Actions:**
1. Extract parties involved (names, roles, or descriptors).
2. Identify the core issue: what specifically are they disagreeing about? State in one sentence.
3. Note any stated positions, interests, or constraints from each party.
4. Identify any prior attempts to resolve or escalations.
5. Flag any missing information (e.g., "unclear what party B actually wants") and note assumptions made.

**Output:**
- Structured conflict summary with parties, core issue, stated positions, prior attempts, and information gaps.

**Quality Gate:**
- At least 2 parties are identified and named or described.
- Core issue is stated in one sentence.
- All stated positions from each party are captured.
- If critical information is missing, assumptions are documented.

---

### Phase 2: Assess Relationship Context, Power Dynamics, and Stakes

**Entry Criteria:**
- Conflict summary is complete.

**Actions:**
1. Classify relationship type: professional (peer/hierarchical), personal, transactional, or mixed.
2. Assess relationship importance: will this relationship exist after the conflict is resolved? How much does it matter? Assign score 1-5.
3. Assess power dynamics: do you have authority, expertise, or leverage over the other party? Do they have leverage over you? Classify as: balanced, you have advantage, other party has advantage, or highly asymmetric.
4. Assess stakes: what are the consequences of unresolved conflict? (career impact, financial, emotional, operational disruption, etc.) Classify as low/medium/high.
5. Determine urgency: must this be resolved immediately, soon, or is it ongoing?

**Output:**
- Relationship classification (type, importance score 1-5).
- Power dynamics assessment (balance, who has advantage, specific sources of power).
- Stakes assessment (level: low/medium/high, specific consequences).
- Urgency classification (immediate/soon/ongoing).

**Quality Gate:**
- Relationship type is explicit.
- Importance score is justified by at least one factor (e.g., "ongoing working relationship").
- Power dynamics are assessed and tied to specific factors (e.g., "other party has budget authority").
- Stakes are tied to concrete outcomes, not vague concerns.
- Urgency is specific (not "soon" but "within 48 hours" or "ongoing for 3 months").

---

### Phase 3: Assess Your Position on Assertiveness-Cooperativeness Matrix

**Entry Criteria:**
- Relationship and stakes context is clear.

**Actions:**
1. Determine assertiveness: how much do you need your concerns, interests, or position to be satisfied? (1=not at all, 5=absolutely critical). Consider: is this a core value, a preference, or a negotiable point?
2. Determine cooperativeness: how much do you care about the other party's satisfaction and the relationship outcome? (1=not at all, 5=very much). Consider: do you want them to feel heard? Do you value their continued goodwill?
3. Cross-reference with relationship importance and stakes: high-stakes + important relationship typically increases cooperativeness; core values typically increase assertiveness.
4. Document any tensions (e.g., "I care about the relationship but my core value is at stake").
5. Validate scores for internal consistency: if relationship importance is 4-5, cooperativeness should not be 1-2; if stakes are high, assertiveness should not be 1.

**Output:**
- Assertiveness score (1-5) with justification tied to specific factors from the conflict.
- Cooperativeness score (1-5) with justification tied to relationship importance and stakes.
- Tension summary (if any).
- Consistency check result (pass/flag).

**Quality Gate:**
- Scores are justified by specific factors from the conflict (not generic reasoning).
- Scores are internally consistent: if relationship importance is 4-5, cooperativeness is 3-5; if stakes are high and relationship is important, both assertiveness and cooperativeness are 3+.
- If scores are contradictory (e.g., both 1), this is flagged as Avoiding mode and confirmed with user.

---

### Phase 4: Map to Thomas-Kilmann Mode(s)

**Entry Criteria:**
- Assertiveness and cooperativeness scores are determined and validated.

**Actions:**
1. Plot scores on the Thomas-Kilmann matrix:
   - **Competing** (high assertiveness 4-5, low cooperativeness 1-2): You want your way; relationship is secondary.
   - **Collaborating** (high assertiveness 4-5, high cooperativeness 4-5): You want both your needs met and the relationship preserved; seek win-win.
   - **Compromising** (medium assertiveness 3, medium cooperativeness 3): Both parties give up something; split the difference.
   - **Avoiding** (low assertiveness 1-2, low cooperativeness 1-2): You don't engage; let it sit or let the other party decide.
   - **Accommodating** (low assertiveness 1-2, high cooperativeness 4-5): You prioritize the relationship; yield your position.
2. Identify primary mode (closest match to scores).
3. Identify secondary mode if scores are near a boundary (e.g., assertiveness 3.5 could be Compromising or Collaborating).
4. Document why this mode fits the situation better than others, referencing relationship type, power dynamics, and stakes.
5. Note any mismatches between natural tendency (your_assertiveness_preference) and recommended mode (e.g., "You naturally avoid, but this situation calls for collaboration"). If mismatch exists, suggest a specific tactic to help shift modes (e.g., "Set a reminder to stay engaged", "Practice the opening statement", "Bring a trusted advisor to the conversation").

**Output:**
- Primary mode (string: Competing, Collaborating, Compromising, Avoiding, or Accommodating).
- Secondary mode (string or null).
- Mode rationale (2-3 sentences explaining the fit, referencing relationship and stakes context).
- Mismatch warnings with mode-shift tactics (if any).

**Quality Gate:**
- Mode is justified by assertiveness and cooperativeness scores.
- Rationale references relationship type, power dynamics, and stakes context.
- If secondary mode exists, the boundary is explained (e.g., "Assertiveness is 3.5, so Compromising and Collaborating are both viable; Collaborating is recommended if the other party is willing to engage openly").
- If mismatch exists, a specific tactic is provided, not generic advice.

---

### Phase 5: Generate Mode-Specific Strategies

**Entry Criteria:**
- Primary (and secondary, if applicable) mode is identified.

**Actions:**
1. For the primary mode, generate 2-3 specific, actionable strategies tailored to the conflict and relationship:
   - **Competing strategies:** Assert your position clearly, set boundaries, escalate if needed, use authority or leverage.
   - **Collaborating strategies:** Propose joint problem-solving, explore underlying interests, brainstorm options that satisfy both parties, involve mediator if needed.
   - **Compromising strategies:** Identify what each party can concede, propose a middle ground, trade-offs, phased solutions.
   - **Avoiding strategies:** Delay action, let time resolve it, redirect focus, accept the status quo.
   - **Accommodating strategies:** Yield on your position, support the other party's solution, express understanding, rebuild trust.
2. For each strategy, specify: what you would say or do, when to use it, what outcome to expect, what could go wrong.
3. If secondary mode exists, generate 1 strategy for it as a fallback.
4. Review each strategy to confirm it specifies concrete actions (not "communicate better" but "schedule a 30-minute meeting to discuss X").
5. Order strategies by likelihood of success or by recommended sequence.

**Output:**
- Array of 2-4 strategies, each with: strategy_name (string), description (string with concrete actions), when_to_use (string), expected_outcome (string), risks (string).

**Quality Gate:**
- Each strategy is specific enough to act on immediately (includes what to say or do, not just intent).
- Each strategy is matched to the mode and the conflict (not generic).
- Risks are realistic, not catastrophic.
- Strategies are ordered by likelihood of success or by recommended sequence.

---

### Phase 6: Develop Implementation Guidance

**Entry Criteria:**
- Strategies are generated.

**Actions:**
1. Determine timing: when should the first strategy be initiated? (immediately, after cooling off, after gathering information, etc.) Be specific (e.g., "within 48 hours", "after the next team meeting").
2. Specify communication approach: how should you initiate the conversation? (in person, email, meeting request, informal chat, etc.) What tone? What opening? Provide a sample opening statement.
3. Identify potential obstacles: what could derail each strategy? (other party refuses to engage, emotions escalate, misunderstandings, power imbalance, etc.)
4. For each obstacle, suggest a contingency (e.g., if they refuse to meet, offer a phone call or written exchange).
5. Define success indicators: how will you know the strategy is working? Specify both short-term indicators (e.g., "they agree to discuss") and long-term indicators (e.g., "the issue is resolved and the relationship is intact").
6. Note any preparation needed (gather data, calm down, consult an expert, etc.).

**Output:**
- Timing recommendation (string, specific not vague).
- Communication approach (string with specific opening or format, including sample opening statement).
- Potential obstacles (array of strings).
- Contingencies (array of strings, paired with obstacles).
- Success indicators (array of objects with short_term and long_term indicators).
- Preparation steps (array of strings, if any).

**Quality Gate:**
- Timing is specific (not "soon" but "within 48 hours").
- Communication approach includes a concrete opening statement.
- Obstacles are realistic and tied to the conflict.
- Each obstacle has a corresponding contingency.
- Success indicators are observable and testable, not subjective.
- Short-term and long-term indicators are distinguished.

---

### Phase 7: Validate and Deliver Recommendation

**Entry Criteria:**
- All prior phases are complete.

**Actions:**
1. Review the full recommendation: does it cohere? Do the strategies align with the mode? Does the implementation guidance support the strategies?
2. Check for contradictions (e.g., "avoid the conflict" but "schedule an immediate meeting").
3. Assess confidence: how clear was the input? How well does the conflict fit the Thomas-Kilmann framework? (high/medium/low). Consider: was Phase 0 information check passed? Were any critical assumptions made? Is the conflict interpersonal or structural?
4. If confidence is low, flag assumptions and suggest gathering more information or consulting a mediator.
5. Add a cultural context note: if the conflict involves parties from cultures that prioritize harmony, hierarchy, or collective decision-making, note that the Thomas-Kilmann framework is Western-centric and may need adaptation. Suggest consulting a cultural mediator if this applies.
6. Assemble the final output object with all sections.

**Output:**
- Complete recommendation package (all outputs from prior phases).
- Confidence level (high/medium/low) with justification.
- Assumptions and caveats (if any).
- Cultural context note (if applicable).

**Quality Gate:**
- No contradictions between phases.
- Confidence level is justified by specific factors (e.g., "low: conflict description was vague about party B's interests").
- All outputs are populated and coherent.
- If cultural context applies, a note is included.

---

### Phase 8 (Optional): Post-Implementation Feedback Loop

**Entry Criteria:**
- User has attempted one or more strategies and wishes to assess effectiveness.

**Actions:**
1. Ask: which strategy was attempted? What was the outcome?
2. Ask: did the other party respond as expected? Were there surprises?
3. Ask: is the conflict resolved, de-escalating, escalating, or unchanged?
4. If resolved: document the successful strategy and outcome for future reference.
5. If not resolved: assess whether to retry the same strategy, try a secondary strategy, escalate, or seek external mediation.
6. If escalating: recommend external mediation, escalation to authority, or a shift to Avoiding mode as a holding pattern.
7. Update the recommendation with lessons learned.

**Output:**
- Outcome assessment (resolved/de-escalating/unchanged/escalating).
- Lessons learned (what worked, what didn't, why).
- Next steps (retry, try secondary strategy, escalate, mediate, or hold).

**Quality Gate:**
- Outcome is tied to specific observable results, not subjective feelings.
- Next steps are concrete and actionable.

---

## Exit Criteria

The skill is complete when:
1. Conflict summary is structured and unambiguous.
2. Relationship and stakes context is assessed, including power dynamics.
3. Assertiveness and cooperativeness scores are assigned and justified with internal consistency check.
4. A primary Thomas-Kilmann mode is identified with rationale referencing relationship, power, and stakes.
5. 2-4 mode-specific strategies are generated with concrete descriptions and ordered by likelihood of success.
6. Implementation guidance includes timing, communication approach with sample opening, obstacles, contingencies, and both short-term and long-term success indicators.
7. Confidence level is stated and justified; cultural context note is included if applicable.
8. A user unfamiliar with the conflict could read the recommendation and execute the first strategy immediately.
9. (Optional) If user returns with feedback, Phase 8 is executed to assess effectiveness and recommend next steps.

---

## Error Handling

| Phase | Failure Mode | Response |
|-------|--------------|----------|
| Phase 0 | Conflict description is missing or too vague (e.g., "we disagree") | **Adjust** -- Ask for specifics: what is the disagreement about? What does each party want? What have you already tried? Do not proceed to Phase 1 until sufficient detail is provided. |
| Phase 0 | Only one party is described (e.g., "my boss is difficult") | **Adjust** -- Reframe as a two-party conflict: you and your boss. What does each of you want? Clarify both parties' positions before proceeding. |
| Phase 1 | Conflict description is too vague (e.g., "we disagree") | **Adjust** -- Ask for specifics: what is the disagreement about? What does each party want? What have you already tried? |
| Phase 1 | Only one party is described (e.g., "my boss is difficult") | **Adjust** -- Reframe as a two-party conflict: you and your boss. What does each of you want? |
| Phase 2 | Relationship importance and stakes are unclear | **Adjust** -- Use defaults: if ongoing professional relationship, assume importance 3-4; if one-time transaction, assume 1-2. If stakes are unclear, assume medium. Document the assumption and flag confidence as "medium" or "low". |
| Phase 2 | Power dynamics are unclear or asymmetric | **Adjust** -- If you have significantly less power than the other party, note that Competing is less viable and Accommodating or Compromising may be more realistic. If you have significantly more power, note that Collaborating requires restraint and Competing may damage the relationship. |
| Phase 3 | Assertiveness and cooperativeness scores are contradictory (e.g., both 1) | **Adjust** -- This suggests Avoiding mode. Confirm: is the user truly indifferent to both outcome and relationship? If so, Avoiding is the correct mode. If not, re-assess the scores. |
| Phase 3 | Scores are inconsistent with relationship importance and stakes | **Adjust** -- Re-assess: if relationship importance is 4-5, cooperativeness should be 3-5; if stakes are high, assertiveness should be 3-5. Ask the user to clarify their priorities. |
| Phase 4 | Conflict does not fit Thomas-Kilmann framework well (e.g., structural/systemic issue, not interpersonal) | **Adjust** -- Note that the framework is best for interpersonal conflicts. If the issue is structural (e.g., process, policy, resource allocation), recommend escalating to a manager, process redesign, or organizational change initiative instead. |
| Phase 5 | No strategies seem appropriate (e.g., conflict is intractable) | **Adjust** -- Recommend Avoiding or Accommodating as a holding pattern, and suggest external mediation, escalation to authority, or a structured conflict resolution process (e.g., mediation, arbitration). |
| Phase 6 | Implementation is blocked by external factors (e.g., other party refuses to engage) | **Adjust** -- Provide contingency strategies (written communication, third-party mediation, escalation). If the other party refuses all engagement, recommend Avoiding as a holding pattern or escalation. |
| Phase 7 | Confidence is low due to missing information | **Abort** -- Return a partial recommendation with clear caveats and ask for more details. Suggest that the user gather information (e.g., ask trusted colleagues, observe the other party's behavior, consult the other party directly) before implementing strategies. |
| Phase 7 | Conflict involves cultural differences | **Adjust** -- Add a cultural context note explaining that the Thomas-Kilmann framework is Western-centric. Recommend consulting a cultural mediator or expert if the conflict involves parties from different cultural backgrounds. |
| Phase 8 | Strategy was attempted but had no effect or made things worse | **Adjust** -- Assess whether the mode was correct, whether the strategy was executed as planned, or whether external factors intervened. Recommend trying a secondary strategy, shifting to a different mode, or seeking external mediation. |

---

## Reference Section: Thomas-Kilmann Conflict Mode Framework

**Overview:** The Thomas-Kilmann framework maps conflict resolution approaches along two dimensions:
- **Assertiveness:** The degree to which you try to satisfy your own concerns.
- **Cooperativeness:** The degree to which you try to satisfy the other party's concerns.

**The Five Modes:**

1. **Competing** (High Assertiveness, Low Cooperativeness)
   - You pursue your own goals at the expense of the other party.
   - Use when: Your position is right, time is critical, the relationship is not important, you have authority, or the other party is acting unethically.
   - Risk: Damages relationships, breeds resentment, may not be sustainable, can escalate conflict.
   - Viability: Less viable if the other party has power over you or if the relationship is important.

2. **Collaborating** (High Assertiveness, High Cooperativeness)
   - You and the other party work together to find a solution that satisfies both.
   - Use when: Both parties' concerns are important, the relationship matters, and a win-win is possible.
   - Risk: Time-consuming, requires trust and openness, may not always be possible, can be exploited by bad-faith actors.
   - Viability: Most viable when the other party is willing to engage openly and power is balanced.

3. **Compromising** (Medium Assertiveness, Medium Cooperativeness)
   - Both parties give up something to reach a middle ground.
   - Use when: Both parties have equal power, time is limited, or a quick resolution is needed.
   - Risk: Neither party is fully satisfied, may feel like a loss for both, may not address underlying interests.
   - Viability: Viable in most situations; a practical middle ground.

4. **Avoiding** (Low Assertiveness, Low Cooperativeness)
   - You do not address the conflict; you let it sit or withdraw.
   - Use when: The issue is trivial, emotions are too high, you need time to think, or the cost of engagement is too high.
   - Risk: Conflict festers, resentment builds, issues may escalate later, underlying problems are not solved.
   - Viability: A temporary holding pattern; not sustainable long-term for important conflicts.

5. **Accommodating** (Low Assertiveness, High Cooperativeness)
   - You yield your position to satisfy the other party and preserve the relationship.
   - Use when: The relationship is more important than the issue, you are wrong, the other party has a stronger claim, or you want to build goodwill.
   - Risk: Your needs are not met, may breed long-term resentment if overused, can be exploited if the other party takes advantage.
   - Viability: Viable when the issue is not critical to you and the relationship is valuable.

**Key Principle:** No mode is universally "best." The right mode depends on the situation (stakes, relationship, time, power dynamics, cultural context). Effective conflict resolution often involves using different modes at different times. The goal is not always to "win" but to choose the mode that best serves your long-term interests and values.

**Domain Knowledge Extracted from Workflow:**
- Relationship type and importance are primary drivers of cooperativeness.
- Stakes and urgency are primary drivers of assertiveness.
- Power imbalances may constrain your choice (e.g., if you have no authority, Competing is less viable; if you have significant power, Collaborating requires restraint).
- Emotional state affects mode selection; high emotions often push toward Avoiding or Competing.
- Cultural context matters: some cultures prioritize harmony (favoring Avoiding or Accommodating), others prioritize hierarchy (affecting power dynamics), others prioritize collective decision-making (affecting Collaborating).
- The goal is not always to "win" but to choose the mode that best serves your long-term interests and values.

---

## State Persistence (Optional)

If this skill is used repeatedly with the same conflict:
- Track which strategies were attempted and their outcomes.
- Note if the mode recommendation changes as new information emerges.
- Document lessons learned for future similar conflicts.
- Consider whether the conflict is escalating or de-escalating over time.
- Use Phase 8 (Post-Implementation Feedback Loop) to assess effectiveness and refine recommendations.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.