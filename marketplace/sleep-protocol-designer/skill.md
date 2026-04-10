# Sleep Protocol Designer

**One-line description:** Analyze a user's sleep habits and generate a personalized sleep hygiene protocol with specific environmental and behavioral changes tailored to their constraints and goals.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `sleep_habits_description` (string, required): User's detailed description of current sleep patterns, problems, schedule, and context. Must include at least 3 of the following: typical sleep/wake times, sleep quality issues (1-10 rating), bedroom environment (temperature, light, noise), daily habits affecting sleep (caffeine, alcohol, exercise timing, screen use), stress levels, health conditions affecting sleep. Minimum 100 characters.
- `user_constraints` (object, optional): User's limitations and preferences. Fields: `budget_level` (low/medium/high), `time_to_implement` (weeks, integer 1-12), `physical_limitations` (string), `living_situation` (shared/private), `flexibility_score` (1-10 integer, how willing to change habits). If not provided, inferred from description.
- `priority_goals` (array, optional): User's primary sleep goals. Examples: "fall asleep faster", "sleep through night", "feel more rested", "regulate schedule". If not provided, inferred from description.
- `medical_context` (string, optional): Relevant medical history, medications, or conditions affecting sleep (sleep apnea, insomnia diagnosis, etc.). If provided, cross-referenced with sleep profile for red flags.

## Outputs

- `sleep_profile` (object): Structured assessment of current sleep state with dimensions scored 1-10: sleep_onset_latency, sleep_duration_adequacy, sleep_continuity, daytime_function, environmental_quality, behavioral_consistency. Each dimension includes: score (1-10 integer), evidence (direct quote or inferred fact from description), confidence (high/medium/low).
- `problem_analysis` (object): Identified root causes and contributing factors organized by category: environmental (array), behavioral (array), physiological (array), psychological (array). Each problem includes: description, severity_rank (1-10), modifiability_rank (1-10), evidence_from_profile (string).
- `environmental_recommendations` (array of objects): Specific changes to bedroom/sleep environment. Each object contains: recommendation (string, specific action), rationale (string, sleep science principle), implementation_steps (array of strings, ordered sub-steps), cost_estimate (low/medium/high with dollar range), timeline (immediate/1-2 weeks/1 month), success_indicator (measurable outcome), priority_rank (1-10).
- `behavioral_recommendations` (array of objects): Specific habit and lifestyle changes. Each object contains: recommendation (string, specific action), rationale (string, sleep science principle), implementation_strategy (string, how to adopt), timeline (phase_1/phase_2/phase_3), difficulty_level (1-10), success_indicator (measurable outcome), sequence_order (integer, 1 = first to implement).
- `implementation_protocol` (object): Phased rollout plan with: phase_1 (object with recommendations array, timeline, daily_actions array, expected_improvements array), phase_2 (same structure), phase_3 (same structure), success_metrics (array of measurable targets), tracking_template (string, daily/weekly log structure), checkpoint_schedule (array of dates and review prompts).
- `protocol_document` (string): Complete formatted sleep hygiene protocol ready for user consumption, 2000-3500 words, including: executive summary, sleep assessment, environmental changes, behavioral changes, 4-week implementation plan, daily tracking log, success metrics, troubleshooting guide, sleep science reference, personalization notes.

---

## Execution Phases

### Phase 1: Sleep Profile Elicitation and Parsing

**Entry Criteria:**
- `sleep_habits_description` is provided and contains at least 3 distinct pieces of information from this list: (1) current sleep/wake times, (2) sleep quality rating, (3) identified sleep problems, (4) bedroom environment details, (5) caffeine/alcohol/exercise timing, (6) stress level, (7) health conditions.
- Description length is at least 100 characters (approximately 15-20 words).
- If description is shorter or missing required information, **Adjust** per error handling Phase 1.

**Actions:**
1. Parse the sleep habits description to extract explicit facts: current sleep/wake times (record as HH:MM format if provided), reported sleep duration (hours), identified problems (list each complaint separately), environmental details (temperature, light, noise, bed quality), behavioral patterns (caffeine timing, alcohol use, exercise timing, screen use, schedule regularity).
2. Identify implicit information: infer schedule regularity from described patterns (consistent/variable/highly variable), infer stress levels from language cues (calm/moderate/high), infer environmental quality from mentioned factors (ideal/acceptable/problematic).
3. Cross-reference with `medical_context` if provided: flag any conditions that affect sleep (sleep apnea, insomnia, restless leg syndrome, narcolepsy, depression, anxiety) and note medications mentioned.
4. Structure findings into a sleep profile object with fields: current_sleep_time (HH:MM or "not specified"), current_wake_time (HH:MM or "not specified"), reported_duration_hours (number or "not specified"), reported_quality_1_10 (1-10 or "not specified"), primary_complaints (array of strings, max 3), secondary_complaints (array of strings), bedroom_environment (object with: temperature_estimate, light_level, noise_level, bed_quality, air_quality), daily_schedule_regularity (consistent/variable/highly_variable), stress_level_perceived (low/moderate/high), caffeine_timing (string or "not specified"), alcohol_use (yes/no/not specified), exercise_timing (string or "not specified"), screen_use_evening (yes/no/not specified).
5. Flag any missing critical information (e.g., "no mention of caffeine use", "sleep/wake times not provided") in a `clarification_flags` array for Phase 1 quality gate.
6. Assign confidence level (high/medium/low) to each extracted data point based on explicitness in description.

**Output:**
- `sleep_profile` (preliminary): Structured object with extracted sleep facts, confidence levels, and flagged gaps.
- `clarification_flags` (array): List of information gaps (max 5) that may affect recommendations. Example: "Sleep/wake times not provided; assuming typical adult schedule."

**Quality Gate:**
- Every explicit statement from the description appears in the structured profile with exact quote or paraphrase.
- No assumptions are made without flagging them in clarification_flags.
- Profile contains at least 5 distinct data points with confidence levels assigned.
- If confidence is low for any critical field (sleep/wake times, duration, quality, primary complaint), flag for clarification.

---

### Phase 2: Sleep Quality Assessment and Problem Identification

**Entry Criteria:**
- Sleep profile from Phase 1 is complete and passes quality gate.
- At least 5 distinct data points are present in profile.
- User has not explicitly stated "I have no sleep problems" (if so, proceed to Phase 7 for optimization mode).

**Actions:**
1. Score sleep quality across six dimensions on a 1-10 scale using this rubric:
   - **Sleep Onset Latency**: How quickly user falls asleep. 10 = <10 min, 9 = 10-15 min, 7 = 15-30 min, 5 = 30-45 min, 3 = 45-60 min, 1 = >60 min. Evidence: explicit time mentioned or inferred from "takes forever to fall asleep" language.
   - **Sleep Duration Adequacy**: Whether reported duration meets user's needs. 10 = feels rested on current duration, 7 = mostly rested, 5 = sometimes rested, 3 = often tired, 1 = chronically sleep deprived. Evidence: explicit statement of feeling rested or complaints of fatigue.
   - **Sleep Continuity**: Frequency of nighttime awakenings. 10 = no awakenings, 8 = 1 per week, 6 = 2-3 per week, 4 = 4-5 per week, 2 = multiple per night, 1 = cannot stay asleep. Evidence: explicit mention of awakenings or "fragmented sleep" language.
   - **Daytime Function**: Energy, alertness, mood during day. 10 = excellent energy and focus, 7 = good with occasional dips, 5 = moderate, variable, 3 = frequently fatigued, 1 = severely impaired. Evidence: explicit statement of daytime symptoms or inferred from sleep complaints.
   - **Environmental Quality**: Bedroom conditions supporting sleep. 10 = ideal (cool, dark, quiet, comfortable bed), 7 = mostly good with 1 minor issue, 5 = mixed (some good, some problematic), 3 = multiple issues, 1 = highly disruptive. Evidence: explicit mention of bedroom conditions.
   - **Behavioral Consistency**: Regularity of sleep schedule and habits. 10 = very consistent (sleep/wake within 30 min daily), 7 = mostly consistent (within 1 hour), 5 = variable (1-2 hour variance), 3 = highly variable (2+ hour variance), 1 = chaotic schedule. Evidence: explicit mention of schedule or inferred from "irregular" language.
2. For each dimension scoring <6, identify contributing factors from the sleep profile with specific evidence.
3. Categorize problems by root cause: environmental (bedroom temp, light, noise, bed quality, air quality), behavioral (caffeine, alcohol, screens, exercise timing, schedule irregularity, napping), physiological (age, health conditions, medications, sleep apnea symptoms), psychological (stress, anxiety, racing thoughts, depression).
4. For each problem, assign severity_rank (1-10: how much it impacts sleep quality) and modifiability_rank (1-10: how changeable it is). Example: "Noise from roommate" = severity 8, modifiability 4 (hard to change roommate behavior).
5. Cross-reference with evidence-based sleep science: match identified problems to known interventions using the Reference Section.
6. Screen for red flags requiring medical referral: insomnia >3 months, suspected sleep apnea (snoring, gasping, daytime sleepiness), narcolepsy, restless leg syndrome, severe mood disturbance. If present, flag in output.

**Output:**
- `sleep_assessment` (object): Scores for all six dimensions with format: {dimension_name: {score: 1-10, evidence: "quote or fact", contributing_factors: ["factor1", "factor2"]}}.
- `problem_analysis` (object): Problems organized by category (environmental, behavioral, physiological, psychological). Each problem: {description: string, severity_rank: 1-10, modifiability_rank: 1-10, evidence: string, suggested_interventions: [string array]}.
- `intervention_candidates` (array): List of evidence-based interventions matched to identified problems. Format: {intervention: string, addresses_problem: string, evidence_strength: "strong/moderate/weak", difficulty_level: 1-10}.
- `medical_referral_flags` (array): Any red flags identified (empty array if none).

**Quality Gate:**
- Every problem identified has a specific cause traced to the sleep profile with direct evidence (quote or inferred fact).
- Scores are justified by explicit evidence from the description, not assumptions. If assumption is made, it is flagged.
- At least one intervention candidate exists for each problem scoring <6.
- If any red flags are present, they are listed in medical_referral_flags.
- Total problems identified: 3-8 (if <3, proceed to optimization mode; if >8, consolidate related problems).

---

### Phase 3: Constraint and Feasibility Analysis

**Entry Criteria:**
- Problem analysis from Phase 2 is complete.
- `user_constraints` provided or inferred from description.
- At least 3 intervention candidates identified.

**Actions:**
1. Extract or infer user constraints: budget_level (low = <$100 total, medium = $100-500, high = >$500), time_to_implement (weeks available, 1-12), living_situation (shared bedroom/private/other), physical_limitations (mobility, health conditions affecting what changes are possible), flexibility_score (1-10 willingness to change habits). If not provided, infer from description (e.g., "I can't afford new mattress" = low budget; "I work night shift" = low flexibility).
2. For each intervention candidate from Phase 2, assess feasibility using this rubric:
   - **Cost**: Does it fit budget level? low = <$50, medium = $50-200, high = >$200. Assign cost_estimate (low/medium/high) and dollar_range (e.g., "$30-60").
   - **Time to Implement**: How quickly can it be adopted? immediate = today/this week, short = 1-2 weeks, medium = 1 month, long = >1 month.
   - **Effort Required**: How much behavior change or discipline? 1-10 scale (1 = passive, just buy something; 10 = requires major daily discipline).
   - **Compatibility**: Does it conflict with user's lifestyle or constraints? yes/no/partial. If partial, note the conflict (e.g., "Shared bedroom limits white noise volume").
   - **Feasibility Score**: Calculate as (Impact_Potential × 0.5) + (Ease_of_Implementation × 0.3) + (Cost_Affordability × 0.2), where Ease = 11 - Difficulty. Result: 1-10 score.
3. Filter out interventions with feasibility score <5 or marked as incompatible (yes).
4. Prioritize remaining interventions by feasibility score (highest first).
5. Identify any constraints that fundamentally limit options (e.g., "shared bedroom" eliminates some environmental changes, "night shift work" eliminates schedule changes). Note these in constraint_notes.
6. If filtering eliminates all interventions for a problem, flag for Phase 3 error handling.

**Output:**
- `feasibility_assessment` (object): Constraints extracted with format: {constraint_name: value, inferred_from: "description quote or 'provided'"}.
- `prioritized_interventions` (array): Interventions ranked by feasibility_score (descending). Format: {intervention: string, feasibility_score: 1-10, cost_estimate: "low/medium/high", cost_range: "$X-Y", time_to_implement: "immediate/short/medium/long", effort_required: 1-10, compatibility: "yes/no/partial", compatibility_note: string if partial, impact_potential: 1-10}.
- `constraint_notes` (string): Summary of limiting factors and workarounds (e.g., "Shared bedroom limits white noise volume; suggest earplugs as alternative.").
- `filtered_out_interventions` (array): Interventions removed due to low feasibility, with reason (for transparency).

**Quality Gate:**
- Every constraint is explicitly stated in user_constraints or clearly inferred from description with citation.
- Feasibility scores are calculated using the formula (not subjective).
- At least 3 feasible interventions remain after filtering (feasibility_score ≥5).
- If fewer than 3 remain, flag for Phase 3 error handling (Adjust).
- Constraint_notes explicitly addresses how each major constraint affects recommendations.

---

### Phase 4: Environmental Recommendations Generation

**Entry Criteria:**
- Prioritized interventions from Phase 3 are available.
- Environmental problems identified in Phase 2.
- At least 1 environmental intervention has feasibility_score ≥5.

**Actions:**
1. Filter prioritized interventions to those addressing environmental factors: bedroom temperature, light, noise, bed quality, air quality, mattress/pillow, room layout.
2. For each environmental intervention, generate a specific, actionable recommendation:
   - **Recommendation**: Concrete action with specific target (e.g., "Lower bedroom temperature to 65-68°F using a programmable thermostat or by opening windows" NOT "Make room cooler"). Include specific product names or methods if applicable.
   - **Rationale**: Why this helps, citing sleep science principle from Reference Section (e.g., "Core body temperature must drop 2-3°F to initiate sleep; 65-68°F is optimal for most adults.").
   - **Implementation Steps**: Ordered sub-steps to execute the recommendation. Example: (1) Measure current bedroom temperature with thermometer, (2) Identify heat sources, (3) Adjust thermostat or use fans/windows, (4) Verify temperature stays in target range for 3 nights.
   - **Cost Estimate**: Specific cost range (e.g., "Free if using fans; $200-400 if installing programmable thermostat") or "Free".
   - **Timeline**: When to implement (immediate = this week, 1-2 weeks, 1 month).
   - **Success Indicator**: How to know if it's working (measurable outcome, e.g., "Fall asleep within 15 minutes on nights when room is 67°F" NOT "Sleep better").
   - **Priority Rank**: 1-10 (1 = highest priority, 10 = nice-to-have optimization).
3. Group recommendations by implementation phase: Phase 1 (immediate quick wins, low cost, high impact), Phase 2 (medium-term changes, moderate cost), Phase 3 (longer-term investments, higher cost).
4. For shared bedrooms or constrained environments, suggest workarounds (e.g., "If partner prefers warmer room, use individual cooling pad or lighter blanket for yourself" instead of "Lower room temperature").
5. Ensure recommendations don't conflict with each other (e.g., don't recommend both blackout curtains and keeping windows open for air flow without addressing the conflict).
6. Limit to 5-7 environmental recommendations total to avoid overwhelm.

**Output:**
- `environmental_recommendations` (array of objects): Each with fields: recommendation (string), rationale (string with sleep science principle), implementation_steps (array of strings, 3-5 steps), cost_estimate (string with range), timeline (immediate/1-2 weeks/1 month), success_indicator (measurable outcome), priority_rank (1-10), phase_assignment (phase_1/phase_2/phase_3).
- `environmental_quick_wins` (array): Subset of recommendations implementable immediately with minimal cost (<$50) and effort. Minimum 1, maximum 3.
- `environmental_conflicts_resolved` (array): Any conflicts identified and how they were resolved (e.g., "Conflict: blackout curtains vs. natural light. Resolution: Use blackout curtains for sleep; open during morning for light exposure.").

**Quality Gate:**
- Every recommendation is specific enough that a user could execute it without further clarification (includes specific targets, products, or methods).
- Cost and timeline estimates are realistic and justified (not vague like "affordable" or "soon").
- No recommendation contradicts user constraints from Phase 3 (e.g., no expensive recommendations if budget_level = low).
- At least one quick win is available (if not, flag for Phase 4 error handling).
- Success indicators are measurable (not subjective like "feel better").
- Total environmental recommendations: 2-7 (if <2, note that environmental factors are not primary problem; if >7, consolidate or deprioritize).

---

### Phase 5: Behavioral Recommendations Generation

**Entry Criteria:**
- Prioritized interventions from Phase 3 are available.
- Behavioral problems identified in Phase 2.
- At least 1 behavioral intervention has feasibility_score ≥5.

**Actions:**
1. Filter prioritized interventions to those addressing behavioral factors: caffeine timing, alcohol use, exercise timing, screen time, sleep schedule, napping habits, stress management, sleep rituals, relaxation techniques.
2. For each behavioral intervention, generate a specific, actionable recommendation:
   - **Recommendation**: Concrete behavior change with specific target (e.g., "Stop caffeine intake after 2 PM; switch to herbal tea or water after that time" NOT "Reduce caffeine"). Include specific times, quantities, or methods.
   - **Rationale**: Why this helps, citing sleep science principle (e.g., "Caffeine has a half-life of 5-6 hours; consuming it after 2 PM means 25% remains in your system at 10 PM, delaying sleep onset by 30+ minutes.").
   - **Implementation Strategy**: How to adopt the behavior. For easy changes: "Start immediately." For difficult changes: gradual implementation (e.g., "Week 1: Move bedtime 15 min earlier. Week 2: Move 30 min earlier. Week 3: Target bedtime achieved."). Include triggers (e.g., "When you reach for coffee at 3 PM, drink water instead") and replacement behaviors (e.g., "If reducing evening screens, read a physical book instead").
   - **Timeline**: When to introduce (phase_1 = week 1-2, phase_2 = week 3-4, phase_3 = week 5+).
   - **Difficulty Level**: Estimated effort (1-10 scale: 1 = trivial, 10 = extremely difficult). Justify with reason (e.g., "Difficulty 8: Requires changing long-standing habit and may cause caffeine withdrawal headaches.").
   - **Success Indicator**: How to track adherence and impact (measurable outcome, e.g., "Fall asleep within 20 minutes on nights when no caffeine after 2 PM" NOT "Feel less jittery").
   - **Sequence Order**: Integer (1 = first to implement, 2 = second, etc.). Sequence respects: (a) difficulty (easier first to build momentum), (b) dependencies (some changes enable others, e.g., consistent schedule before optimizing caffeine timing).
3. Sequence behavioral changes: introduce easiest/highest-impact changes first (Phase 1), medium-difficulty changes second (Phase 2), hardest changes last (Phase 3).
4. For high-difficulty changes (difficulty ≥7), suggest gradual implementation with weekly milestones.
5. Suggest replacement behaviors for habits being eliminated (e.g., if reducing evening screens, suggest reading, meditation, journaling, or conversation).
6. Include stress management and relaxation techniques if psychological factors are present (e.g., anxiety, racing thoughts). Examples: progressive muscle relaxation, 4-7-8 breathing, meditation, journaling.
7. Limit to 5-7 behavioral recommendations total to avoid overwhelm.

**Output:**
- `behavioral_recommendations` (array of objects): Each with fields: recommendation (string), rationale (string with sleep science principle), implementation_strategy (string with gradual steps if needed), timeline (phase_1/phase_2/phase_3), difficulty_level (1-10 with justification), success_indicator (measurable outcome), sequence_order (integer), replacement_behavior (string if applicable).
- `behavioral_quick_wins` (array): Subset of recommendations easiest to adopt immediately (difficulty ≤3) with high impact. Minimum 1, maximum 3.
- `difficult_changes` (array): High-difficulty recommendations (difficulty ≥7) with detailed gradual implementation plans. Format: {recommendation: string, difficulty_level: 1-10, gradual_plan: {week_1: string, week_2: string, ...}, expected_challenges: [string array], mitigation_strategies: [string array]}.
- `replacement_behaviors` (object): Map of eliminated habits to suggested replacement behaviors (e.g., {"evening screens": ["reading", "meditation", "conversation"]}).

**Quality Gate:**
- Every recommendation is specific and measurable (includes specific times, quantities, or methods).
- Sequence order respects difficulty (easier first) and dependencies (some changes enable others).
- Replacement behaviors are suggested for all eliminated habits.
- At least one quick win is available (if not, flag for Phase 5 error handling).
- Success indicators are measurable (not subjective).
- Difficult changes (difficulty ≥7) have detailed gradual implementation plans with weekly milestones.
- Total behavioral recommendations: 2-7 (if <2, note that behavioral factors are not primary problem; if >7, consolidate or deprioritize).

---

### Phase 6: Implementation Protocol and Timeline Design

**Entry Criteria:**
- Environmental recommendations from Phase 4 (may be empty if no environmental problems).
- Behavioral recommendations from Phase 5 (may be empty if no behavioral problems).
- User constraints and flexibility_score from Phase 3.
- At least 3 total recommendations (environmental + behavioral).

**Actions:**
1. Create a phased rollout plan based on user's flexibility_score and time_to_implement:
   - If flexibility_score ≥7 and time_to_implement ≥4 weeks: Create full 3-phase plan (Phase 1: 2-4 changes, Phase 2: 2-4 changes, Phase 3: remaining changes).
   - If flexibility_score 4-6 or time_to_implement 2-3 weeks: Create 2-phase plan (Phase 1: 2-3 easiest changes, Phase 2: remaining changes).
   - If flexibility_score ≤3 or time_to_implement 1 week: Create minimal protocol with 1-2 highest-impact changes only (Phase 1). Note that results will be limited without more changes.
2. For each phase, specify:
   - **Recommendations to implement**: List by name, in sequence_order.
   - **Start date and target completion date**: Specific calendar dates (e.g., "Start: Monday, Jan 15. Target completion: Sunday, Jan 28").
   - **Daily/weekly actions required**: Specific actions per day or week (e.g., "Monday-Friday: No caffeine after 2 PM. Saturday-Sunday: Flexible but try to maintain.").
   - **Expected sleep improvements by end of phase**: Specific, measurable targets (e.g., "Fall asleep within 20 minutes (currently 45 min). Sleep through night 4+ nights per week (currently 2).").
3. Ensure phases are not overloaded: max 4-5 simultaneous changes per phase to avoid overwhelm. If more recommendations exist, spread across phases or deprioritize.
4. Define success metrics: specific, measurable targets for overall protocol success. Examples: "Fall asleep within 20 minutes on 80% of nights", "Sleep 7+ hours nightly", "Wake up ≤1 time per night", "Rate daytime energy 7+/10". Avoid subjective targets like "Sleep better".
5. Create a tracking template: daily sleep log with fields for: date, sleep_time (HH:MM), wake_time (HH:MM), total_duration (hours), quality_rating (1-10), awakenings_count (number), adherence_to_recommendations (yes/no for each recommendation), notes (optional observations). Format as table or checklist for easy daily use.
6. Suggest checkpoints: weekly reviews (every Sunday evening) to assess progress, identify obstacles, and adjust as needed. Provide review prompts (e.g., "Which recommendations did you follow? Which were hardest? Did sleep improve?").
7. Create a contingency plan: if a recommendation isn't working after 2 weeks, suggest alternatives (e.g., "If blackout curtains don't help, try sleep mask instead").

**Output:**
- `implementation_protocol` (object): Structured plan with phase_1, phase_2, phase_3 (each containing: recommendations (array of strings), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), daily_actions (array of strings), expected_improvements (array of measurable targets)). If only 1-2 phases, include only those.
- `success_metrics` (array): Measurable targets for overall protocol success. Format: {metric: string, target: string, baseline: string (current state), measurement_method: string}. Example: {metric: "Sleep onset latency", target: "<20 minutes", baseline: "45 minutes", measurement_method: "Record time from lights out to sleep using sleep tracking app or manual log"}.
- `tracking_template` (string): Daily/weekly log format (as markdown table or text template) for user to track progress. Include fields: date, sleep_time, wake_time, duration, quality_1_10, awakenings, adherence_checklist, notes.
- `checkpoint_schedule` (array): Dates for weekly reviews. Format: {date: YYYY-MM-DD, day_of_week: string, review_prompts: [string array]}. Example: {date: "2024-01-21", day_of_week: "Sunday", review_prompts: ["Which recommendations did you follow this week?", "Which were hardest?", "Did sleep improve?", "Any obstacles to address?"]}.
- `contingency_plan` (object): If recommendation not working after 2 weeks, suggest alternatives. Format: {recommendation: string, alternative_1: string, alternative_2: string}.

**Quality Gate:**
- No phase has more than 5 simultaneous changes.
- Every recommendation from Phases 4-5 appears in exactly one phase (none missing, none duplicated).
- Success metrics are testable and measurable (not subjective like "feel better").
- Tracking template is simple enough for daily use (<2 minutes per day to complete).
- Checkpoint schedule includes at least 4 weekly reviews (if protocol spans 4+ weeks).
- Contingency plan addresses at least 50% of recommendations with alternatives.
- If flexibility_score ≤3, protocol includes explicit note: "This minimal protocol addresses only the highest-impact changes. Results may be limited without additional behavior changes. Consider expanding protocol in future weeks."

---

### Phase 7: Protocol Document Compilation

**Entry Criteria:**
- Implementation protocol from Phase 6 is complete.
- All recommendations, assessments, and timelines are finalized.
- Sleep profile, problem analysis, and success metrics are available.

**Actions:**
1. Compile a comprehensive sleep hygiene protocol document with these sections in order:
   - **Executive Summary** (200-300 words): User's sleep profile (current sleep/wake times, duration, quality), key problems identified (2-3 main issues), expected improvements from protocol (specific targets), timeline (e.g., "4-week protocol"), and personalization note (e.g., "This protocol is tailored to your shared bedroom and low budget; recommendations prioritize low-cost, non-disruptive changes.").
   - **Your Sleep Assessment** (300-400 words): Scores and analysis from Phase 2 in user-friendly language (avoid jargon; explain each dimension). Example: "Sleep Onset Latency (7/10): You typically fall asleep in 20-30 minutes, which is slightly longer than ideal (<15 min) but not severe. This is likely due to [specific factors from problem analysis]."
   - **Environmental Changes** (400-500 words): Recommendations from Phase 4 with implementation steps and success indicators. Format: For each recommendation, include: (1) What to do (specific action), (2) Why it helps (sleep science), (3) How to do it (step-by-step), (4) Cost and timeline, (5) How to know if it's working (success indicator). Use clear headings and bullet points.
   - **Behavioral Changes** (400-500 words): Recommendations from Phase 5 with implementation strategies and difficulty levels. Format: For each recommendation, include: (1) What to do (specific action), (2) Why it helps (sleep science), (3) How to start (gradual steps if needed), (4) Timeline (when to introduce), (5) How to track (success indicator). Use clear headings and bullet points.
   - **Your 4-Week Implementation Plan** (300-400 words): Phased timeline from Phase 6 with specific actions per week. Format: For each phase, include: (1) Week range, (2) Recommendations to implement, (3) Daily/weekly actions, (4) Expected improvements. Use a table or timeline format for clarity.
   - **Daily Sleep Tracking Log** (200 words + template): Explanation of tracking template and how to use it. Include blank template (1-2 weeks of examples) for user to copy and use.
   - **Success Metrics & Checkpoints** (200-300 words): Targets from Phase 6 and weekly review prompts. Format: For each metric, include: (1) What to measure, (2) Current baseline, (3) Target, (4) How to measure. Include weekly checkpoint dates and review prompts.
   - **Troubleshooting Guide** (300-400 words): Common obstacles and solutions. Format: For each obstacle, include: (1) Problem (e.g., "I can't stick to the new bedtime"), (2) Why it happens (e.g., "Evening activities run late"), (3) Solutions (2-3 specific strategies). Examples: "I can't fall asleep even with all changes" → "Try sleep restriction therapy or consult a sleep specialist for CBT-I"; "I can't stick to the schedule" → "Start with just one change; add others gradually."
   - **Sleep Science Reference** (300-400 words): Brief explanations of why each recommendation works, citing sleep science principles from Reference Section. Format: For each major recommendation category (temperature, light, caffeine, schedule, etc.), include: (1) The principle (e.g., "Core body temperature must drop to initiate sleep"), (2) How it applies to user (e.g., "Your bedroom is 72°F, which is too warm"), (3) Expected impact (e.g., "Lowering to 67°F should reduce sleep onset latency by 15-20 minutes").
   - **Personalization Notes** (200-300 words): Reminders of user's specific constraints and how recommendations were tailored. Example: "You mentioned a shared bedroom and low budget. We prioritized recommendations that don't require expensive equipment or affect your partner (e.g., earplugs instead of soundproofing, personal cooling pad instead of room temperature change). We also sequenced changes to start with quick wins (caffeine cutoff, consistent bedtime) before longer-term changes (mattress upgrade)."
   - **When to Seek Professional Help** (100-150 words): Red flags requiring medical evaluation (insomnia >3 months, suspected sleep apnea, narcolepsy, restless leg syndrome, severe mood disturbance). Include: (1) What to watch for, (2) When to contact a doctor, (3) What to mention to your doctor (e.g., "I've tried sleep hygiene changes for 4 weeks without improvement").
2. Format for readability: use clear headings (H2 and H3), bullet points, tables where appropriate (e.g., implementation timeline), bold for key terms, numbered lists for step-by-step instructions.
3. Ensure tone is encouraging and non-judgmental. Use "you" language (e.g., "You mentioned...") to personalize. Acknowledge difficulty of behavior change (e.g., "Changing sleep habits is challenging; be patient with yourself.").
4. Include visual elements if possible: simple diagrams (e.g., "Caffeine timeline: 2 PM cutoff"), tables (e.g., "Weekly implementation plan"), or checklists (e.g., "Daily tracking log").
5. Add a "Next Steps" section at the end: (1) Print or save this document, (2) Start with Phase 1 on [specific date], (3) Track daily using the log, (4) Review weekly on [specific day], (5) Adjust as needed based on progress.
6. Ensure document is self-contained: user can follow it without external guidance or additional resources (except for professional help if needed).

**Output:**
- `protocol_document` (string): Complete formatted sleep hygiene protocol, 2500-3500 words, ready for user consumption. Include all sections listed above with proper formatting (markdown or plain text with clear structure).

**Quality Gate:**
- Document is readable by a non-expert (no unexplained jargon; if technical terms used, explain them).
- Every recommendation from Phases 4-5 appears in the document with full context (what, why, how, when, success indicator).
- Document is actionable: user can follow it without external guidance (all steps are explicit).
- Tone is supportive and realistic (acknowledges difficulty of behavior change, celebrates small wins).
- Personalization notes explicitly reference user's constraints and how recommendations were tailored.
- Document includes red flags and guidance on when to seek professional help.
- Word count: 2500-3500 words (if <2500, add more detail to troubleshooting or sleep science sections; if >3500, move advanced content to separate document).

---

## Exit Criteria

The skill is DONE when:
1. Sleep profile has been parsed and structured with at least 5 distinct data points and confidence levels assigned (Phase 1 complete).
2. Sleep quality has been assessed across six dimensions (each scored 1-10 with evidence) and problems identified and categorized (Phase 2 complete).
3. User constraints have been analyzed and interventions prioritized by feasibility score (Phase 3 complete).
4. At least 2 environmental recommendations have been generated with specific implementation details, cost estimates, timelines, and success indicators (Phase 4 complete).
5. At least 2 behavioral recommendations have been generated with sequencing, difficulty levels, and implementation strategies (Phase 5 complete).
6. A phased implementation protocol spanning 2-4+ weeks has been created with success metrics, tracking template, and checkpoint schedule (Phase 6 complete).
7. A comprehensive protocol document (2500-3500 words) has been compiled and formatted for user use with all required sections (Phase 7 complete).
8. All outputs match the specified output schema: sleep_profile (with confidence levels), problem_analysis (with severity and modifiability ranks), environmental_recommendations (array with all required fields), behavioral_recommendations (array with all required fields), implementation_protocol (with phases, dates, and metrics), protocol_document (string, formatted).
9. All outputs are internally consistent: recommendations in protocol_document match those in environmental_recommendations and behavioral_recommendations arrays; implementation_protocol phases include all recommendations; success_metrics are testable and appear in tracking_template.
10. If medical referral flags are present, they are explicitly noted in problem_analysis and protocol_document.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Sleep habits description is too vague (e.g., "I sleep badly") or <100 characters | **Adjust** -- Request elaboration on: (1) What time do you currently go to bed and wake up? (2) How long does it take you to fall asleep? (3) How many times do you wake during the night? (4) What do you think is causing the problem? (5) Describe your bedroom (temperature, light, noise, bed quality). Provide a structured questionnaire if needed. |
| Phase 1 | Description contains contradictions (e.g., "I sleep 8 hours but feel exhausted") | **Adjust** -- Flag contradiction and ask for clarification: "You mentioned sleeping 8 hours but feeling exhausted. Can you clarify: (a) Do you feel rested when you wake, or do you feel tired? (b) Does the exhaustion improve after a few hours, or does it last all day?" Proceed with both interpretations if necessary, noting the contradiction in clarification_flags. |
| Phase 1 | Medical context provided contradicts sleep description (e.g., "diagnosed with sleep apnea" but "no nighttime awakenings mentioned") | **Adjust** -- Flag contradiction and ask: "You mentioned sleep apnea diagnosis. Do you experience loud snoring, gasping awake, or daytime sleepiness?" Note that sleep apnea requires medical treatment; sleep hygiene alone may not be sufficient. |
| Phase 2 | No problems identified (user reports sleeping well on all dimensions) | **Adjust** -- Shift to optimization mode. Generate recommendations for sleep enhancement and performance optimization (e.g., "Your sleep is already good; here's how to optimize further for peak daytime performance"). Proceed to Phase 4-5 but reframe as "optimization" rather than "problem-solving." |
| Phase 2 | Problems are too severe or suggest medical condition (e.g., "I haven't slept in 3 days", "I have severe sleep apnea", "I have narcolepsy") | **Adjust** -- Add prominent disclaimer in problem_analysis and protocol_document: "These recommendations are for sleep hygiene optimization. Your symptoms suggest a medical condition that may require professional evaluation and treatment. Please consult a sleep specialist or physician before implementing this protocol. Sleep hygiene alone may not be sufficient." Proceed with protocol but emphasize medical referral. |
| Phase 2 | User reports severe psychological distress (e.g., "I have severe anxiety", "I'm depressed") affecting sleep | **Adjust** -- Flag in medical_referral_flags and add note in protocol_document: "Your sleep problems appear to be related to [anxiety/depression/other]. While sleep hygiene can help, addressing the underlying condition with a mental health professional (therapist, psychiatrist) may be necessary. Consider consulting a mental health provider in addition to implementing this protocol." |
| Phase 3 | User constraints eliminate all feasible interventions (feasibility_score <5 for all) | **Adjust** -- Identify the most limiting constraint (e.g., "very low budget", "shared bedroom", "inflexible schedule"). Suggest creative workarounds or lower-cost alternatives (e.g., "If you can't afford a new mattress, try a mattress topper ($30-50) or sleep on the floor for a week to test if mattress is the problem"). If no viable path exists after workarounds, recommend professional sleep coaching or CBT-I. |
| Phase 3 | User has very low flexibility_score (≤2) and is unwilling to change | **Adjust** -- Create a minimal protocol with only 1-2 highest-impact changes (Phase 1 only). Add explicit note: "You indicated low willingness to change habits. This minimal protocol addresses only the highest-impact, easiest changes. Results will be limited without additional behavior changes. Consider revisiting this protocol when you're ready to make more changes." |
| Phase 4 | User has no environmental problems (e.g., already has ideal bedroom: cool, dark, quiet, comfortable bed) | **Adjust** -- Minimize environmental section. Include only 1-2 optimization recommendations (e.g., "Your bedroom is already good; consider blackout curtains for even darker environment if you're sensitive to light"). Focus remaining effort on behavioral and physiological interventions. |
| Phase 5 | Behavioral change required is extremely difficult or impossible for user (e.g., "I work night shift and can't change schedule", "I have a medical condition that prevents exercise") | **Adjust** -- Acknowledge constraint explicitly. Suggest harm-reduction strategies (e.g., "If you can't change your night shift schedule, optimize sleep quality during available hours: keep bedroom cool/dark, use blackout curtains, avoid caffeine 6+ hours before sleep, maintain consistent sleep schedule even if shifted"). Note that results may be limited by the constraint. |
| Phase 5 | User reports no behavioral problems (e.g., "I already have perfect sleep hygiene") | **Adjust** -- Minimize behavioral section. Include only 1-2 optimization recommendations (e.g., "Your habits are already good; consider adding meditation for stress management"). Focus remaining effort on environmental and physiological interventions. |
| Phase 6 | Generated protocol exceeds 5000 words | **Adjust** -- Split into main protocol (2500-3500 words) and supplementary guides (e.g., "Advanced Sleep Optimization", "Detailed Troubleshooting Guide") as separate documents. Link them in the main protocol. |
| Phase 6 | User's time_to_implement is very short (1 week) and flexibility_score is low | **Adjust** -- Create a minimal 1-phase protocol with 1-2 highest-impact changes only. Add note: "You have limited time and flexibility. This protocol focuses on the highest-impact changes you can implement in one week. After one week, reassess and consider expanding to additional changes." |
| Phase 7 | Generated protocol document is difficult to read or contains jargon | **Adjust** -- Simplify language, add explanations for technical terms, break long paragraphs into bullet points, add visual elements (tables, checklists). Test readability by ensuring a non-expert could follow it. |
| Phase 7 | User's constraints are not adequately reflected in protocol | **Adjust** -- Expand "Personalization Notes" section to explicitly address each constraint and how recommendations were tailored. Example: "You mentioned a shared bedroom. We prioritized recommendations that don't disturb your partner: earplugs instead of white noise machine, personal cooling pad instead of room temperature change, etc." |
| Phase 7 | User rejects final output | **Targeted revision** -- ask which protocol phase, sleep intervention, or schedule timing fell short and rerun only that section. Do not regenerate the full sleep protocol. |

---

## Reference Section: Sleep Science Principles and Decision Criteria

### Core Sleep Hygiene Principles

**Environmental Factors:**
- **Temperature**: 65-68°F (18-20°C) is optimal for most people. Core body temperature must drop 2-3°F to initiate sleep. Each 1°F increase above 68°F can delay sleep onset by 5-10 minutes.
- **Light**: Darkness triggers melatonin production. Blue light (screens, bright lights) suppresses melatonin by 50-80%. Aim for <5 lux in bedroom (near-complete darkness). Exposure to bright light (>500 lux) in morning advances circadian rhythm; in evening, delays it.
- **Noise**: Continuous noise >30 dB disrupts sleep. Sudden noises >50 dB cause awakenings. Silence or consistent white noise (50-60 dB) is ideal. Individual sensitivity varies; some sleep better with white noise, others with silence.
- **Bed Quality**: Mattress and pillow support affect sleep continuity. Replace mattress if >7 years old, showing visible sagging, or causing discomfort. Pillow should support neck alignment; replace if >2 years old or flattened.

**Behavioral Factors:**
- **Caffeine**: Half-life of 5-6 hours (varies by individual, genetics, medications). 100 mg at 2 PM = 25 mg at 8 PM (still affecting sleep). Cutoff time of 2 PM recommended for 10 PM bedtime. Some individuals are sensitive to caffeine even 12+ hours before bed.
- **Alcohol**: Sedating initially (reduces sleep onset latency by 10-20 min) but disrupts sleep architecture. Suppresses REM sleep by 20-30%, reducing sleep quality. Causes 2-3 awakenings per night. Avoid within 3 hours of bedtime.
- **Exercise**: Promotes sleep but timing matters. Vigorous exercise (heart rate >120 bpm) increases core body temperature; takes 3-4 hours to return to baseline. Ideal: morning or early afternoon (2-4 PM). Moderate exercise (30 min, 3-5x/week) improves sleep quality by 20-30%.
- **Screen Time**: Blue light (400-500 nm wavelength) suppresses melatonin by 50-80% for 1-2 hours after exposure. Cutoff 30-60 minutes before bed recommended. Use blue light filters if evening screen use is unavoidable.
- **Sleep Schedule**: Consistency (same sleep/wake time daily) regulates circadian rhythm. Variance >1 hour disrupts circadian alignment; variance >2 hours causes social jet lag (equivalent to 1-2 time zones). Consistent schedule improves sleep quality by 15-25%.
- **Napping**: Naps >30 min or after 3 PM reduce sleep pressure at bedtime, delaying sleep onset. Optimal nap: 20-30 min in early afternoon (1-3 PM). Naps >90 min can cause sleep inertia (grogginess upon waking).

**Physiological Factors:**
- **Sleep Pressure**: Builds throughout the day via adenosine accumulation. Insufficient daytime activity (sitting >8 hours) reduces sleep pressure. Exercise, sunlight exposure, and mental engagement increase sleep pressure.
- **Circadian Rhythm**: Peaks and troughs in alertness follow a ~24-hour cycle. Morning light exposure (6-10 AM) advances rhythm (earlier sleep/wake). Evening light exposure delays rhythm (later sleep/wake). Misalignment with schedule causes insomnia (e.g., night shift workers, jet lag).
- **Sleep Architecture**: Cycles of NREM (light, deep) and REM sleep, each 90 min. Deep sleep (stages 3-4) peaks in first 2 cycles; REM peaks in later cycles. Disruptions fragment sleep, reducing restorative benefit. Alcohol and sleep apnea suppress deep sleep and REM.

### Problem-to-Intervention Mapping

**Problem: Long Sleep Onset Latency (>30 min to fall asleep)**
- Likely causes: Racing thoughts, high arousal, caffeine, irregular schedule, bright bedroom, warm room, stress/anxiety.
- Evidence-based interventions: Relaxation techniques (progressive muscle relaxation, 4-7-8 breathing), meditation, journaling before bed, caffeine cutoff (2 PM), consistent schedule (same bedtime ±30 min daily), blackout curtains, cool room (65-68°F), anxiety management (therapy, medication if needed).
- Expected impact: 15-30 min reduction in sleep onset latency with 2-3 interventions combined.

**Problem: Frequent Nighttime Awakenings (>2 per night)**
- Likely causes: Noise, temperature fluctuations, sleep apnea, alcohol, full bladder, anxiety, sleep fragmentation from medications.
- Evidence-based interventions: White noise machine or earplugs, temperature control (65-68°F), alcohol cutoff (3+ hours before bed), limit fluids 2 hours before bed, anxiety management, medical evaluation for sleep apnea, review medications with doctor.
- Expected impact: 50-75% reduction in awakenings with 2-3 interventions combined.

**Problem: Short Sleep Duration (<6 hours)**
- Likely causes: Insufficient sleep pressure, schedule constraints, racing thoughts, environmental disruption, sleep apnea, medications.
- Evidence-based interventions: Earlier bedtime (15-30 min increments), consistent wake time, morning light exposure (30 min, 6-10 AM), afternoon exercise (30 min, 2-4 PM), reduce napping, relaxation techniques, medical evaluation if severe.
- Expected impact: 30-60 min increase in sleep duration with 2-3 interventions combined.

**Problem: Poor Sleep Quality / Feeling Unrefreshed**
- Likely causes: Fragmented sleep, insufficient deep sleep, sleep apnea, medications, stress, irregular schedule.
- Evidence-based interventions: Consistent schedule, cool room (65-68°F), exercise (30 min, 3-5x/week), stress management, reduce alcohol, medical evaluation for sleep apnea, sleep tracking to identify patterns.
- Expected impact: 20-40% improvement in sleep quality (measured by feeling rested) with 2-3 interventions combined.

**Problem: Daytime Fatigue / Poor Function**
- Likely causes: Insufficient sleep duration, poor sleep quality, circadian misalignment, sleep apnea, medications, depression/anxiety.
- Evidence-based interventions: Increase sleep duration (target 7-9 hours), improve sleep quality (via environmental/behavioral changes), morning light exposure (30 min, 6-10 AM), afternoon nap (20-30 min max, 1-3 PM), medical evaluation for sleep apnea or mood disorders.
- Expected impact: 30-50% improvement in daytime energy with 2-3 interventions combined.

### Implementation Difficulty Scoring

**1-3 (Easy)**: Requires no behavior change or minimal effort. Examples: blackout curtains ($20-50, passive), white noise machine ($30-100, passive), caffeine cutoff at 2 PM (if already consuming caffeine; just stop at earlier time).

**4-6 (Moderate)**: Requires some habit change but is achievable with motivation. Examples: moving bedtime 30 min earlier (requires discipline but no external barriers), adding 20-min evening walk (requires time management), reducing screen time by 1 hour (requires replacing habit).

**7-10 (Difficult)**: Requires significant behavior change or conflicts with lifestyle. Examples: changing work schedule (may not be possible), eliminating alcohol (if heavy drinker; withdrawal risk), moving to different bedroom (may not be possible), major exercise routine overhaul (time/motivation barrier).

### Feasibility Scoring Formula

**Feasibility Score = (Impact_Potential × 0.5) + (Ease_of_Implementation × 0.3) + (Cost_Affordability × 0.2)**

Where:
- Impact_Potential: 1-10 (how much it addresses identified problems; based on evidence strength and user's specific situation).
- Ease_of_Implementation: 1-10 (inverse of difficulty; 10 = very easy, 1 = very difficult).
- Cost_Affordability: 1-10 (10 = free or <$50, 5 = $50-200, 1 = >$200; adjusted for user's budget_level).

Result: 1-10 score. Prioritize interventions scoring >7 for Phase 1; 5-7 for Phase 2; <5 for Phase 3 or deprioritize.

### Red Flags Requiring Medical Referral

- **Insomnia lasting >3 months** despite sleep hygiene optimization (may indicate chronic insomnia requiring CBT-I or medication).
- **Suspected sleep apnea**: loud snoring, gasping awake, daytime sleepiness, witnessed breathing pauses, morning headaches, high blood pressure.
- **Narcolepsy symptoms**: sudden sleep attacks during day, cataplexy (sudden muscle weakness), sleep paralysis, hypnagogic hallucinations.
- **Restless leg syndrome**: irresistible urge to move legs at night, uncomfortable sensations (tingling, aching), worse in evening/night.
- **Periodic limb movement disorder**: involuntary leg kicks during sleep, causing awakenings.
- **Severe mood disturbance affecting sleep**: depression (insomnia or hypersomnia), anxiety (racing thoughts, panic), bipolar disorder (decreased need for sleep).
- **Medications causing sleep disruption**: stimulants (ADHD meds, decongestants), some antidepressants, corticosteroids, beta-blockers. Discuss with prescriber.
- **Sleep duration extremely short** (<4 hours) or long (>10 hours) despite optimization efforts.

---

**License:** Free to use. Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.