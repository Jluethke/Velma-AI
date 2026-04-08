# Stress Audit & Action Plan Generator

**One-line description:** Guide a user through a structured stress audit to identify stressors, categorize them by controllability, assess impact, and generate a prioritized stress management action plan.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `user_context` (string, optional): Brief background on the user (role, life stage, current situation) to tailor language and examples. Default: "General adult".
- `stressor_collection_method` (string, optional): How to elicit stressors: "open-ended", "guided-prompts", or "checklist". Default: "open-ended".
- `include_physical_health` (boolean, optional): Whether to explicitly ask about physical health stressors (sleep, exercise, nutrition). Default: true.
- `action_plan_detail_level` (string, optional): Depth of generated actions: "brief" (1-2 lines per action), "detailed" (3-5 lines with sub-steps). Default: "detailed".
- `baseline_stress_rating` (integer, optional): User's self-reported stress level (1-10) before the audit, for comparison. Default: null (will be collected in Phase 1).

---

## Outputs

- `stressor_list` (object[]): Array of stressors, each with: `id` (string), `description` (string), `category` ("controllable" | "partially_controllable" | "uncontrollable"), `impact_score` (1-5), `urgency_score` (1-5).
- `action_plan` (object): Structured plan with three sections:
  - `immediate_actions` (object[]): Actions for high-impact, high-urgency stressors (0-3 days). Each: `stressor_id`, `action`, `timeline_days` (integer), `success_metric`, `barrier_mitigation` (string, how to overcome obstacles).
  - `short_term_actions` (object[]): Medium-priority actions (1-4 weeks). Same structure.
  - `ongoing_strategies` (object[]): Resilience and coping strategies for uncontrollable stressors. Each: `stressor_id`, `strategy`, `frequency` (daily/weekly/as-needed), `expected_benefit`, `values_alignment_score` (1-5).
- `quick_wins` (object[]): 1-2 actions completable in next 24 hours. Each: `action`, `timeline_hours` (integer), `success_metric`.
- `audit_summary` (string): Human-readable narrative summary of the audit, key insights, and plan overview.
- `one_page_plan` (string): Printable one-page summary (markdown or plain text) with stressors, immediate actions, coping strategies, review date, and accountability partner.
- `baseline_to_post_stress_rating` (object): `baseline` (1-10), `post_audit` (1-10), `change` (integer), `interpretation` (string describing shift in perspective or sense of agency).
- `next_review_date` (string, ISO 8601): Recommended date to revisit and reassess the plan.

---

## Execution Phases

### Phase 1: Baseline Assessment & Stressor Elicitation

**Entry Criteria:**
- User is available and willing to engage in a 25-35 minute audit.
- User context (if provided) is understood.

**Actions:**

1. If `baseline_stress_rating` is not provided, ask: "On a scale of 1-10, how would you rate your overall stress level right now? 1 = calm, 10 = overwhelmed." Record the response as `baseline_stress_rating`.
2. Introduce the audit: "We're going to identify what's causing you stress, understand which stressors you can influence, and build a concrete action plan. This takes about 25-35 minutes. At the end, we'll see if your sense of control and clarity has shifted."
3. Based on `stressor_collection_method`:
   - If "open-ended": Ask "What's stressing you out right now? Think about work, relationships, health, finances, personal goals. List everything that comes to mind. Don't filter—just say it."
   - If "guided-prompts": Ask about specific domains in order: "Let's go through some life areas. For each, tell me if there's stress: (1) Work or career, (2) Relationships or family, (3) Health or physical wellbeing, (4) Finances, (5) Personal growth or goals, (6) Environment or living situation, (7) Time management or overwhelm."
   - If "checklist": Provide a pre-built checklist of common stressors (see Reference section) and ask user to select and add custom items.
4. If `include_physical_health` is true, explicitly ask: "How are you sleeping, exercising, and eating right now? Any physical health concerns or changes?"
5. Record all stressors as a raw list (no filtering yet). Assign each a temporary ID (S1, S2, etc.).
6. Ask: "Anything else? Take a moment to think. Sometimes people remember something when they pause." Wait 10 seconds.
7. Ask: "Are there any stressors you're hesitant to mention? Sometimes people hold back on relationship or health issues. This is confidential and just for you."

**Output:**
- `raw_stressor_list` (object[]): Unfiltered list with `id`, `description`.
- `baseline_stress_rating` (integer, 1-10).

**Quality Gate:**
- At least 3 stressors identified and recorded with IDs.
- Each stressor is a concrete description (e.g., "unclear project deadlines", "tension with my partner"), not vague (e.g., "work is hard", "life is stressful").
- No duplicates in raw list.
- Baseline stress rating is recorded (1-10, integer).

---

### Phase 2: Stressor Validation, Deduplication & Barrier Identification

**Entry Criteria:**
- Raw stressor list is complete (user confirmed "nothing else").
- Baseline stress rating is recorded.

**Actions:**

1. Review the list with the user: "Here's what I heard. Let me read it back to make sure I got it right."
2. For each stressor, ask: "Is this accurate? Anything to add or clarify?" Accept only yes/no or specific clarifications; if user says "yes, that's right", mark as validated.
3. Merge similar stressors (e.g., "deadline pressure" and "too many projects" → "workload and deadline management"). Ask user: "These sound related. Should we combine them?"
4. Remove exact duplicates.
5. Ask: "Are there any stressors you're hesitant to mention? Relationship or health issues are common ones people hold back on. This is confidential."
6. Finalize the list. Confirm: "So we have [number] stressors. Does this feel complete?"

**Output:**
- `validated_stressor_list` (object[]): Deduplicated, clarified stressors with `id`, `description`, `user_confirmed` (boolean).

**Quality Gate:**
- User explicitly confirms (yes/no) that the list is accurate and complete.
- Each stressor is distinct (no duplicates or near-duplicates).
- Each stressor description is specific and concrete, verified by user.
- List size is 4-12 stressors. If >12, ask user to group or prioritize top concerns. If <3, loop back to Phase 1 with guided-prompts method.

---

### Phase 3: Controllability Categorization

**Entry Criteria:**
- Validated stressor list is finalized and user-confirmed.

**Actions:**

1. Introduce the framework: "For each stressor, we'll ask: Can you directly influence this? Can you partially influence it? Or is it outside your control? This matters because we'll handle each type differently. Controllable stressors get action plans. Uncontrollable ones get coping strategies."
2. Explain the decision rule: "Ask yourself: If I took action on this, would the outcome change? If yes, significantly → controllable. If yes, somewhat → partially controllable. If no, not really → uncontrollable."
3. For each stressor, ask: "Can you directly change or reduce this stressor? Yes, no, or partially?"
4. Provide examples for each category:
   - **Controllable** (you can directly act): "I'm disorganized" → organize systems; "I'm not exercising" → schedule workouts; "I'm not speaking up in meetings" → practice assertiveness.
   - **Partially controllable** (you can influence but not fully control): "My boss is demanding" → set boundaries, communicate needs; "My teenager is struggling" → provide support, seek resources; "My team is unmotivated" → improve communication, provide clarity.
   - **Uncontrollable** (outside your direct influence): "Economic recession" → cannot control; "Aging parent's health decline" → cannot control the decline itself, but can control your response and support.
5. If user is uncertain, ask: "If you took action on this, would the outcome change?" If yes → controllable/partially. If no → uncontrollable.
6. Assign each stressor to exactly one category. Record the category.
7. Confirm: "Does this categorization feel right? Any you want to reconsider?"

**Output:**
- `categorized_stressors` (object[]): Each stressor with `id`, `description`, `category` (string: "controllable", "partially_controllable", or "uncontrollable"), `user_confirmed` (boolean).

**Quality Gate:**
- Every stressor is assigned to exactly one category, verified by user.
- User explicitly confirms (yes/no) that categorizations feel right.
- At least one stressor in each category present, OR user confirms that absence is accurate (e.g., "I have no uncontrollable stressors right now").
- No stressor changes category after this phase (if user wants to reconsider, do so now).

---

### Phase 4: Impact & Urgency Assessment

**Entry Criteria:**
- Stressors are categorized and user-confirmed.

**Actions:**

1. Introduce the scoring: "Now we'll rate each stressor on two dimensions: Impact (how much does it affect your wellbeing, productivity, relationships?) and Urgency (how time-sensitive is it?). Both on a scale of 1-5, where 1 = minimal and 5 = severe/critical."
2. For each stressor, ask:
   - "On a scale of 1-5, how much does this stressor affect your life right now? 1 = minimal impact, 5 = severe impact on wellbeing, work, or relationships."
   - "On a scale of 1-5, how urgent is this? 1 = can wait weeks, 5 = needs immediate attention (days)."
3. Record both scores as integers (1-5).
4. Calculate a composite priority score: `(impact + urgency) / 2` for ranking later. Record this.
5. If scores seem inconsistent (e.g., high urgency but low impact), clarify: "You said this is urgent but not very impactful. Help me understand—why is it urgent if it doesn't affect you much?" Rescore if needed.

**Output:**
- `scored_stressors` (object[]): Each stressor with `id`, `description`, `category`, `impact_score` (1-5, integer), `urgency_score` (1-5, integer), `composite_priority` (float, (impact+urgency)/2).

**Quality Gate:**
- Every stressor has both scores recorded as integers (1-5).
- Scores are internally consistent (if user gives inconsistent scores, clarify and rescore).
- Composite priority is calculated for all stressors.
- User confirms scores are accurate (spot-check: "The highest-impact stressor is [name]. Does that feel right?").

---

### Phase 5: Barriers to Action Identification

**Entry Criteria:**
- Stressors are scored and prioritized.

**Actions:**

1. Introduce the phase: "Before we build your action plan, let's identify what might get in the way. Common barriers are: time, money, motivation, lack of support, unclear how to start, or conflicting priorities. For each controllable stressor, I'll ask: What might prevent you from taking action?"
2. For each controllable and partially controllable stressor, ask: "What might get in the way of addressing this? Time? Money? Not knowing how to start? Lack of support? Something else?"
3. Record the barrier(s) for each stressor.
4. For each barrier, ask: "How could we work around this?" Brainstorm 1-2 mitigation strategies (e.g., "I don't have time" → "Start with 10 minutes, not 1 hour"; "I don't know how to start" → "Ask a friend for advice or find a tutorial").
5. Record the mitigation strategy for each barrier.

**Output:**
- `stressors_with_barriers` (object[]): Each controllable/partially controllable stressor with `id`, `description`, `barriers` (string[]), `barrier_mitigations` (object[], each with `barrier`, `mitigation`).

**Quality Gate:**
- Every controllable/partially controllable stressor has at least one barrier identified.
- Every barrier has a mitigation strategy.
- Mitigations are concrete and actionable (not "try harder" or "be more motivated").
- User confirms mitigations are realistic.

---

### Phase 6: Action Plan Generation for Controllable Stressors

**Entry Criteria:**
- Stressors are scored and barriers are identified.
- Controllable and partially controllable stressors are identified.

**Actions:**

1. Filter stressors by category: focus on controllable and partially controllable.
2. Sort by composite priority score (highest first).
3. For each controllable/partially controllable stressor, generate 1-3 specific, actionable interventions:
   - Ask: "What's one concrete step you could take to address this? Be specific—not 'reduce stress' but 'schedule 3 workouts per week'."
   - If user struggles, offer 2-3 suggestions from the Reference section based on stressor type.
   - Ensure each action is: (a) specific (has a concrete deliverable), (b) measurable (has a success metric), (c) time-bound (has a realistic timeline).
4. For each action, ask: "How long would this take to complete? Days? Weeks?" Assign to timeline: immediate (0-3 days), short-term (1-4 weeks), or ongoing (weekly/daily).
5. Define a success metric for each action (e.g., "Schedule 3 workouts per week", "Have one boundary-setting conversation with manager", "Set up a filing system for documents").
6. Include the barrier mitigation from Phase 5 in the action description (e.g., "Start with 10-minute walks, not 1-hour gym sessions").

**Output:**
- `action_items` (object[]): Each with `stressor_id`, `action` (string, specific and concrete), `timeline` (string: "immediate", "short-term", or "ongoing"), `timeline_days` (integer, estimated days to complete), `success_metric` (string, testable), `barrier_mitigation` (string, how to overcome obstacles).

**Quality Gate:**
- Every controllable/partially controllable stressor has at least one action.
- Actions are specific and measurable, not vague (e.g., "Schedule 3 workouts per week" not "exercise more").
- Timelines are realistic and user confirms they can commit.
- Success metrics are testable and observable.
- Barrier mitigations are included and realistic.

---

### Phase 7: Coping Strategies for Uncontrollable Stressors

**Entry Criteria:**
- Uncontrollable stressors are identified and scored.

**Actions:**

1. Introduce the approach: "For stressors outside your control, we'll focus on resilience, acceptance, and managing your response. You can't change the situation, but you can change how you relate to it and build your ability to cope."
2. For each uncontrollable stressor, generate 1-2 coping strategies:
   - Ask: "How do you want to relate to this? What would help you cope? (Examples: acceptance practice, talking to someone, physical activity, meaning-making, self-care)"
   - If user struggles, offer a menu: "Some people find it helpful to [acceptance practice / talk to a therapist / exercise / volunteer / journal]. What resonates with you?"
   - Ensure strategies are concrete and actionable (e.g., "Practice 5-minute breathing exercise daily" not "be more mindful").
3. For each strategy, ask: "How often would you do this? Daily? Weekly? As-needed?" Record frequency.
4. Ask: "What benefit do you expect? (e.g., emotional relief, clarity, reduced rumination, better sleep)"
5. Ask: "How does this strategy align with your core values? (1-5, where 1 = not at all, 5 = very much)" Record values alignment score. Prioritize strategies with higher alignment scores.
6. Sort by impact score (highest first) and values alignment (highest first).

**Output:**
- `coping_strategies` (object[]): Each with `stressor_id`, `strategy` (string, specific and actionable), `frequency` (string: "daily", "weekly", "as-needed"), `expected_benefit` (string), `values_alignment_score` (1-5, integer).

**Quality Gate:**
- Every uncontrollable stressor has at least one coping strategy.
- Strategies are concrete and actionable, not vague.
- Frequency is realistic and sustainable (user confirms).
- Values alignment scores are recorded.
- User confirms strategies are relevant and helpful.

---

### Phase 8: Quick Wins Identification

**Entry Criteria:**
- Action items and coping strategies are generated.

**Actions:**

1. Introduce quick wins: "Before we prioritize everything, let's identify 1-2 actions you can complete in the next 24 hours. These build momentum and confidence."
2. Review immediate actions (0-3 days). Ask: "Which of these could you start today or tomorrow? Something small that would take 15-60 minutes?"
3. Examples: "Schedule a 20-minute walk tomorrow", "Send one email setting a boundary", "Write down 3 things you're grateful for", "Call a friend for 15 minutes".
4. Select 1-2 quick wins. Record with timeline in hours (not days).
5. Confirm: "Can you commit to doing this in the next 24 hours?"

**Output:**
- `quick_wins` (object[]): Each with `action` (string, specific), `timeline_hours` (integer, 1-24), `success_metric` (string, testable).

**Quality Gate:**
- 1-2 quick wins identified.
- Each is completable in 24 hours (user confirms).
- Success metrics are clear and observable.
- User expresses confidence in completing them.

---

### Phase 9: Action Plan Prioritization & Structuring

**Entry Criteria:**
- Action items, coping strategies, and quick wins are generated.

**Actions:**

1. Combine all actions and strategies into a single list (excluding quick wins, which are separate).
2. Sort by timeline: immediate (0-3 days), short-term (1-4 weeks), ongoing (weekly/daily).
3. Within each timeline, sort by composite priority score (impact + urgency, highest first).
4. Review with user: "Here's your prioritized plan. Does this order make sense? Are there any actions you want to move up or down?"
5. Adjust based on user feedback (e.g., "I want to tackle the relationship issue first, even though the work deadline is more urgent").
6. Assign realistic start dates for immediate and short-term actions (e.g., "Start Monday", "Begin next week").
7. Recommend a review date: 2-4 weeks out, depending on the number of immediate actions. Formula: If >3 immediate actions, review in 2 weeks. If 1-3 immediate actions, review in 3-4 weeks. If 0 immediate actions, review in 4-6 weeks.
8. Ask user to identify an accountability partner: "Is there someone (friend, family, therapist, coach) you could share this plan with and check in with weekly? Accountability increases follow-through."

**Output:**
- `prioritized_action_plan` (object): Structured with:
  - `immediate_actions` (object[], sorted by priority).
  - `short_term_actions` (object[], sorted by priority).
  - `ongoing_strategies` (object[], sorted by priority and values alignment).
- `next_review_date` (string, ISO 8601).
- `accountability_partner` (string, optional): Name or role of accountability partner.

**Quality Gate:**
- Plan is ordered by timeline and priority.
- User explicitly confirms (yes/no) the prioritization makes sense.
- User can commit to the timeline (not overwhelmed).
- Review date is realistic (2-6 weeks out).
- Accountability partner is identified (optional but encouraged).

---

### Phase 10: Audit Summary, One-Page Plan & Closure

**Entry Criteria:**
- Prioritized action plan is finalized.
- Accountability partner is identified (optional).

**Actions:**

1. Ask user to rate their stress level now: "On that same 1-10 scale, how would you rate your stress level now, after this audit?" Record as `post_audit_stress_rating`.
2. Calculate change: `post_audit_stress_rating - baseline_stress_rating`. Interpret: If negative (stress decreased), note shift in perspective or sense of agency. If positive or zero, note that clarity and action plan may help even if stress rating hasn't changed yet.
3. Generate a narrative summary:
   - Overview: "You identified X stressors. Y are controllable, Z are partially controllable, W are uncontrollable."
   - Key insights: "Your highest-impact stressors are [list top 3]. These are [mostly controllable / mixed / mostly uncontrollable], which means [you have agency / you'll need resilience strategies / a mix of action and acceptance]."
   - Plan overview: "Your immediate priorities are [list 1-3]. Over the next 4 weeks, you'll also [short-term actions]. And you'll practice [1-2 key ongoing strategies] to build resilience."
   - Momentum: "You have [number] quick wins to complete in the next 24 hours. These will build confidence and momentum."
4. Generate a one-page plan summary in markdown or plain text format:
   ```
   # Stress Audit & Action Plan
   **Date:** [today]
   **Review Date:** [next_review_date]
   **Accountability Partner:** [name/role]
   
   ## Stressors Identified
   [Table or list: Stressor | Category | Impact | Urgency]
   
   ## Quick Wins (Next 24 Hours)
   - [Action 1] (Timeline: [hours] hours)
   - [Action 2] (Timeline: [hours] hours)
   
   ## Immediate Actions (0-3 Days)
   - [Action 1]: [Success Metric]
   - [Action 2]: [Success Metric]
   
   ## Short-Term Actions (1-4 Weeks)
   - [Action 1]: [Success Metric]
   - [Action 2]: [Success Metric]
   
   ## Ongoing Strategies (Daily/Weekly)
   - [Strategy 1] ([Frequency]): [Expected Benefit]
   - [Strategy 2] ([Frequency]): [Expected Benefit]
   
   ## Key Insights
   [2-3 sentences from narrative summary]
   
   ## Next Steps
   1. Complete quick wins in next 24 hours.
   2. Start immediate actions this week.
   3. Check in with [Accountability Partner] weekly.
   4. Review plan on [next_review_date].
   ```
5. Ask: "How does this plan feel? Doable? Overwhelming? Anything you want to adjust?"
6. Make final adjustments if needed (e.g., move an action to short-term if immediate feels too much).
7. Confirm commitment: "Are you willing to start with the quick wins in the next 24 hours and the immediate actions this week?"
8. Provide the complete audit report (stressor list, action plan, summary, one-page plan, review date).
9. Suggest a follow-up: "Let's reconnect on [review date] to see how it's going and adjust as needed. In the meantime, share this plan with [Accountability Partner] and check in weekly."

**Output:**
- `audit_summary` (string): Narrative summary with overview, key insights, plan overview, and momentum note.
- `one_page_plan` (string): Printable one-page summary in markdown or plain text.
- `baseline_to_post_stress_rating` (object): `baseline` (integer, 1-10), `post_audit` (integer, 1-10), `change` (integer, post - baseline), `interpretation` (string, 1-2 sentences).
- `final_action_plan` (object): Complete, user-confirmed plan.
- `next_review_date` (string, ISO 8601): Confirmed review date.
- `accountability_partner` (string, optional): Name or role.

**Quality Gate:**
- User rates post-audit stress level (1-10, integer).
- Baseline-to-post change is calculated and interpreted.
- Narrative summary is clear and specific (not generic).
- One-page plan is formatted and printable.
- User confirms the plan is clear, actionable, and realistic.
- User expresses willingness to begin (yes/no).
- All outputs are documented and provided to user.

---

## Exit Criteria

The audit is COMPLETE when:
1. All 10 phases are executed in order.
2. User has identified and validated a list of stressors (4-12 items).
3. Each stressor is categorized by controllability, scored on impact and urgency, and barriers are identified.
4. A prioritized action plan is generated with immediate, short-term, ongoing, and quick-win components.
5. User confirms the plan is clear, actionable, and realistic.
6. A narrative summary, one-page plan, and stress rating comparison are provided.
7. User expresses commitment to begin with quick wins in 24 hours and immediate actions this week.
8. Accountability partner is identified (optional but encouraged).
9. Next review date is confirmed (2-6 weeks out).

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | User identifies fewer than 3 stressors | **Adjust** -- Use guided-prompts method. Ask about specific life domains (work, relationships, health, finances, personal growth, environment, time management). Reassure user that small stressors count. If still <3, ask: "What's one thing that's been on your mind lately?" |
| Phase 1 | Stressors are too vague (e.g., "life is hard", "I'm stressed") | **Adjust** -- Ask clarifying questions: "What specifically about life? Work? Relationships? Health? Can you give me an example?" Break vague stressors into concrete components. |
| Phase 2 | User identifies >15 stressors | **Adjust** -- Ask: "Which 8-10 are most pressing right now?" Offer to group related stressors (e.g., "work stress" umbrella: deadlines, boss, team dynamics). Suggest a follow-up audit for secondary stressors. |
| Phase 2 | User is reluctant to share certain stressors | **Adjust** -- Normalize: "Many people find relationship or health stressors hard to discuss. You don't have to share details, but naming it helps." Offer anonymous framing: "You don't have to tell me what it is. Just say 'personal relationship issue' if that's easier." |
| Phase 3 | User cannot decide if a stressor is controllable | **Adjust** -- Ask: "If you took action on this, would the outcome change?" If uncertain, default to "partially controllable" and proceed. Note: "We can revisit this if it doesn't feel right." |
| Phase 3 | User wants to change a stressor's category after Phase 4 | **Adjust** -- Allow recategorization. Ask: "What changed your mind?" Rescore if needed. Note: Changing categories mid-audit is normal; flexibility is important. |
| Phase 4 | User gives inconsistent scores (e.g., high urgency but low impact) | **Adjust** -- Clarify: "You said this is urgent but not very impactful. Help me understand—why is it urgent if it doesn't affect you much?" Rescore based on clarification. |
| Phase 5 | User cannot identify barriers | **Adjust** -- Ask: "What would make this hard to do? Time? Money? Not knowing how? Motivation? Lack of support?" Offer a menu of common barriers. |
| Phase 6 | User cannot generate actions for a controllable stressor | **Adjust** -- Offer suggestions from the Reference section (common interventions by stressor type). If still stuck, ask: "What have you tried before? What worked?" Build from past success. If no ideas, mark as "requires expert support" and suggest professional help (therapist, coach, mentor). |
| Phase 6 | User wants to take action on an uncontrollable stressor | **Adjust** -- Clarify: "This stressor is outside your control. But you can influence how you respond. Would you like a coping strategy instead, or is there a controllable aspect we can address?" |
| Phase 7 | User rejects coping strategies as unhelpful | **Adjust** -- Ask: "What has helped you cope with stress in the past?" Build strategies from user's own experience. Offer a menu of options (acceptance, distraction, social support, meaning-making, self-care) and let user choose. |
| Phase 8 | User cannot identify a quick win | **Adjust** -- Offer examples: "Could you schedule a 20-minute walk tomorrow? Send one text to a friend? Write down 3 things you're grateful for?" Start very small. |
| Phase 9 | User feels the plan is overwhelming | **Adjust** -- Reduce immediate actions to 1-2 items. Move others to short-term. Emphasize: "You don't have to do everything at once. Start small. We'll review in 2-3 weeks and adjust." |
| Phase 9 | User cannot identify an accountability partner | **Adjust** -- Normalize: "It's optional. But if you think of someone later, reach out." Suggest alternatives: therapist, coach, online community, or even a journal. |
| Phase 10 | User expresses doubt or low commitment | **Adjust** -- Revisit the plan. Ask: "What would make this feel more doable?" Reduce scope, adjust timelines, or identify barriers. Offer support (accountability partner, professional help). |
| Phase 10 | Post-audit stress rating is higher than baseline | **Adjust** -- Normalize: "Sometimes naming stressors makes stress feel bigger at first. But now you have a plan. Let's see how you feel after you start the quick wins." Emphasize the action plan as a path forward. |
| General | User discloses a mental health crisis (suicidal ideation, severe anxiety, self-harm, substance abuse) | **Abort** -- Pause the audit. Provide crisis resources (crisis hotline, emergency services). Recommend professional mental health support before continuing. Do not attempt to resolve the crisis within this skill. |
| General | User is in acute distress during the audit | **Adjust** -- Pause. Ask: "Do you need a break? Would you like to continue or reschedule?" Offer grounding techniques (5-4-3-2-1 sensory exercise, breathing). Proceed only if user is ready. |

---

## Reference Section

### Common Controllable Stressors & Interventions

**Workload/Time Management:**
- Prioritize tasks using Eisenhower Matrix (urgent/important).
- Break large projects into smaller milestones with deadlines.
- Set boundaries: "I will not check email after 6 PM" or "I will not work weekends."
- Delegate or say no to non-essential tasks. Practice: "I appreciate the opportunity, but I can't take this on right now."
- Time-block your calendar: schedule focused work, breaks, and personal time.
- Use a task management tool (to-do list, Asana, Notion, etc.).

**Disorganization:**
- Create a simple filing system (digital or physical). Start with one area (desk, email, documents).
- Use a task management tool (to-do list, project management app, calendar).
- Establish a daily planning ritual (5 minutes each morning or evening).
- Declutter one area per week (15-30 minutes).
- Set a "home" for important items (keys, wallet, documents).

**Lack of Exercise/Movement:**
- Schedule 3 workouts per week (calendar blocking). Start small: 10-minute walks, not 1-hour gym sessions.
- Find an activity you enjoy (not punishment): walking, dancing, yoga, sports, gardening.
- Join a class or find an accountability partner (friend, trainer, app).
- Set a specific time (e.g., "6 AM walk every Monday, Wednesday, Friday").
- Track progress (steps, minutes, workouts completed).

**Poor Sleep:**
- Set a consistent bedtime and wake time (even on weekends).
- Reduce screen time 1 hour before bed (blue light disrupts sleep).
- Create a bedtime routine (reading, stretching, meditation, warm bath).
- Avoid caffeine after 2 PM and alcohol before bed.
- Keep bedroom cool, dark, and quiet.
- Limit naps to 20 minutes before 3 PM.

**Relationship Conflict:**
- Schedule a conversation with the person (not in the heat of the moment). "Can we talk about this tonight after dinner?"
- Use "I" statements: "I feel frustrated when..." not "You always..."
- Listen to understand, not to win. Ask: "Help me understand your perspective."
- Identify one specific behavior to change (not personality).
- Consider couples therapy or mediation if needed.

**Financial Stress:**
- Create a simple budget (income vs. expenses). Use a spreadsheet or app (YNAB, Mint).
- Identify one area to cut (subscriptions, dining out) or increase income (side gig, raise).
- Set a financial goal (emergency fund, debt payoff, savings target).
- Automate savings (transfer to savings account automatically).
- Seek financial advice if needed (financial advisor, nonprofit credit counseling).

**Lack of Clarity/Direction:**
- Define your top 3 goals for the next 3 months. Write them down.
- Break each goal into 3-5 concrete steps.
- Schedule time weekly to work toward goals.
- Seek mentorship or coaching if needed.

**Perfectionism/High Self-Criticism:**
- Set "good enough" standards for non-critical tasks. Ask: "Does this need to be perfect, or just done?"
- Practice self-compassion: "I'm doing my best. This is hard, and I'm learning."
- Celebrate small wins and progress, not just perfection.
- Identify one area to lower standards (e.g., "My house doesn't need to be spotless").

### Common Uncontrollable Stressors & Coping Strategies

**Health Issues (self or loved one):**
- Acceptance practice: "I cannot control this, but I can control my response." Journaling, meditation.
- Seek support: join a support group, talk to a therapist, connect with others facing similar challenges.
- Focus on what you can control: treatment adherence, lifestyle, emotional support, advocacy.
- Practice self-compassion: "This is hard, and I'm doing my best."
- Meaning-making: "What can I learn from this? How can I grow?"

**Economic/Job Market Uncertainty:**
- Meaning-making: "What can I learn from this? How can I grow? What's in my control?"
- Emotional regulation: breathing exercises, journaling, meditation, physical activity.
- Social support: talk to friends, family, or a therapist. Join a community or professional group.
- Action on what you can control: upskill, network, update resume, explore new opportunities.
- Limit news consumption: check news 1x daily, not constantly.

**Aging Parent/Family Member Decline:**
- Acceptance: "I cannot stop aging or prevent decline, but I can be present and supportive."
- Boundary-setting: "I will visit 2x per week, but I cannot be available 24/7. I need to care for myself too."
- Self-care: maintain your own health, relationships, and interests.
- Seek support: family meetings, professional caregiving, therapy, support groups.
- Meaning-making: "How can I make the most of our time together?"

**Societal/Global Events:**
- Limit news consumption: check news 1x daily, not constantly. Unfollow doomscrolling feeds.
- Focus on local action: volunteer, support your community, donate to causes you care about.
- Meaning-making: "How can I contribute to positive change? What's in my control?"
- Acceptance: "I cannot control global events, but I can control my response and my community."
- Social connection: talk to others, join groups, build community.

**Relationship Loss/Grief:**
- Acceptance: "This is painful, and it's normal to grieve."
- Emotional expression: cry, journal, talk to someone, create art.
- Social support: spend time with loved ones, join a grief group, see a therapist.
- Self-care: sleep, nutrition, movement, rest.
- Meaning-making: "What did this person/relationship mean to me? How can I honor it?"

**Discrimination/Injustice:**
- Validation: "This is real, and your feelings are justified."
- Community: connect with others facing similar challenges, join advocacy groups.
- Emotional regulation: breathing, movement, creative expression.
- Action on what you can control: set boundaries, seek supportive environments, advocate.
- Therapy: work with a therapist experienced in trauma and discrimination.

### Coping Strategy Categories

1. **Acceptance Practices:** Meditation, mindfulness, journaling, self-compassion exercises, breathing exercises.
2. **Emotional Regulation:** Breathing exercises (4-7-8 breath, box breathing), progressive muscle relaxation, cold water immersion, physical activity, creative expression.
3. **Social Support:** Talk to friends/family, join a support group, therapy, mentorship, community involvement.
4. **Meaning-Making:** Journaling, therapy, spiritual practice, volunteer work, creative expression, gratitude practice.
5. **Self-Care:** Sleep, nutrition, exercise, hobbies, time in nature, rest, massage, warm bath.

### Decision Framework: Controllable vs. Uncontrollable

**Ask:** "If I took action on this, would the outcome change?"

- **Yes, significantly** → Controllable. Generate action items.
- **Yes, somewhat** → Partially controllable. Generate action items + coping strategies.
- **No, not really** → Uncontrollable. Generate coping strategies only.

### Review Cadence

- **High-stress audit (>3 immediate actions):** Review in 2 weeks.
- **Moderate-stress audit (1-3 immediate actions):** Review in 3-4 weeks.
- **Low-stress audit (0 immediate actions, mostly ongoing strategies):** Review in 4-6 weeks.

### Domain-Specific Stressor Examples

**Parents:**
- Balancing work and childcare.
- Managing children's behavior or school performance.
- Parental guilt or perfectionism.
- Lack of personal time or self-care.
- Financial pressure to provide.
- Co-parenting conflict.

**Caregivers (aging parents, ill family members):**
- Emotional burden of caregiving.
- Time constraints and exhaustion.
- Financial costs of care.
- Guilt about not doing enough.
- Isolation from social life.
- Anticipatory grief.

**Students:**
- Academic pressure and grades.
- Workload and time management.
- Social anxiety or peer pressure.
- Financial stress (tuition, loans).
- Career uncertainty.
- Perfectionism.

**Entrepreneurs/Self-Employed:**
- Financial uncertainty and cash flow.
- Overwork and lack of boundaries.
- Imposter syndrome.
- Isolation and lack of support.
- Pressure to succeed.
- Lack of work-life balance.

**Healthcare Workers:**
- Compassion fatigue and burnout.
- Exposure to trauma or suffering.
- Long hours and shift work.
- Moral injury (ethical conflicts).
- Lack of support or resources.
- Secondary trauma.

---

## State Persistence (Optional)

If conducting multiple audits over time, track:
- **Stressor trends:** Which stressors recur? Which have been resolved? Which are new?
- **Action effectiveness:** Which interventions worked? Which didn't? Why?
- **Coping strategy effectiveness:** Which strategies became habits? Which were abandoned? Why?
- **Overall stress trajectory:** Is stress decreasing, stable, or increasing? What's driving the trend?
- **Barrier evolution:** Did barriers change? Were mitigations effective?
- **Values alignment:** Did actions align with values? Did this increase follow-through?

Use this data to refine future audits, celebrate progress, and adjust strategies.

---

## Companion Skills

Consider linking to or building:
- **Habit Formation Skill:** Turn action items into sustainable habits (e.g., "Exercise 3x per week" → 30-day habit formation plan).
- **Boundary-Setting Skill:** For partially controllable stressors involving relationships (e.g., "My boss is demanding").
- **Financial Planning Skill:** For financial stressors (budgeting, debt payoff, emergency fund).
- **Sleep Optimization Skill:** For sleep-related stressors.
- **Grief & Loss Skill:** For stressors involving loss or major life transitions.