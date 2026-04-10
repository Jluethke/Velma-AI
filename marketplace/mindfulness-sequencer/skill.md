# Mindfulness Sequencer

**One-line description:** Generates a personalized mindfulness practice sequence tailored to user experience level, available time, and mental health goals, with safety checks and progression guidance.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `user_experience_level` (string, required) — User's mindfulness experience: "beginner", "intermediate", or "advanced"
- `available_time_minutes` (number, required) — Time available for practice: 5, 10, 15, 20, or 30+
- `primary_goals` (string[], required) — Mental health or wellness goals. Accepted values: "stress_reduction", "focus", "sleep", "anxiety", "emotional_regulation", "general_wellness". At least one required.
- `secondary_goals` (string[], optional) — Additional goals (same value set as primary_goals)
- `physical_constraints` (string[], optional) — Any physical limitations (e.g., "back_pain", "cannot_lie_down", "mobility_limited")
- `mental_health_history` (string[], optional) — Relevant mental health context for safety screening (e.g., "trauma", "dissociation", "grief", "depression"). Used to filter contraindicated techniques.
- `practice_environment` (string, optional) — Where practice will occur: "quiet_room", "office", "public_transit", "home_with_distractions". Default: "quiet_room"
- `preference_style` (string, optional) — Preferred guidance style: "guided_narrative" (rich imagery, external structure), "minimal_cues" (sparse, internal focus), or "technical" (anatomical/physiological detail). Default: "guided_narrative"
- `previous_sequence_id` (string, optional) — ID of previously completed sequence to avoid repetition and enable progression tracking

---

## Outputs

- `sequence_title` (string) — Personalized name for the practice (e.g., "5-Minute Calm Focus")
- `sequence_phases` (object[]) — Ordered list of practice phases, each with:
  - `phase_name` (string) — Name of phase (e.g., "Opening", "Core Practice", "Closing")
  - `duration_minutes` (number) — Time allocated
  - `techniques` (object[]) — Array of techniques, each with:
    - `technique_name` (string)
    - `duration_minutes` (number)
    - `instructions` (string) — Step-by-step guidance (numbered, specific, actionable)
    - `cues` (string[]) — Verbal or mental cues to use during practice
    - `modifications` (object[]) — Alternative versions, each with `name`, `instructions`, `when_to_use`
- `total_duration_minutes` (number) — Total practice time
- `goal_alignment` (object) — Maps each goal to techniques addressing it and the mechanism of benefit
- `practice_tips` (string[]) — 3-5 tips for successful practice, specific to user profile (not generic)
- `progression_notes` (object[]) — Suggestions for advancing or adapting over time, each with `timeframe` (e.g., "after 2 weeks"), `action`, and `rationale`
- `safety_notes` (string[]) — Any contraindications or cautions based on mental health history or constraints
- `validation_status` (string) — "pass" or "adjust_required" with details if adjustments were made

---

## Execution Phases

### Phase 1: Assessment & Safety Screening

**Entry Criteria:**
- User experience level is provided and valid (beginner, intermediate, or advanced)
- Available time is provided and is one of: 5, 10, 15, 20, 30+
- At least one primary goal is provided

**Actions:**
1. Validate user experience level against accepted values (beginner, intermediate, advanced). If invalid, default to "beginner" and log assumption in validation_status output.
2. Validate available time against accepted durations (5, 10, 15, 20, 30+). If outside range, round to nearest valid duration and log adjustment.
3. Validate primary goals against accepted goal set. Remove any unrecognized goals; abort if no valid goals remain after filtering.
4. If physical constraints are provided, validate each constraint against known constraint types and store for use in Phase 2.
5. If mental_health_history is provided, validate against known mental health contexts (trauma, dissociation, grief, depression, anxiety_disorder, bipolar, psychosis, substance_use_history) and flag for contraindication checking in Phase 2.
6. If practice_environment is provided, validate against accepted environments (quiet_room, office, public_transit, home_with_distractions). If invalid, default to "quiet_room".
7. If preference_style is provided, validate against accepted styles (guided_narrative, minimal_cues, technical). If invalid, default to "guided_narrative".
8. If previous_sequence_id is provided, retrieve user's practice history (if available in state persistence layer) to inform Phase 3 technique selection and avoid recent repetition.
9. Record user profile summary: experience_level, time_minutes, primary_goals, secondary_goals, physical_constraints, mental_health_history, practice_environment, style_preference, previous_sequences.

**Output:**
- Validated user profile (experience_level, time_minutes, goals, constraints, mental_health_history, environment, style_preference, history_reference)
- Profile validation status (all_valid, assumptions_made, or invalid_input with specific details)
- Contraindication flags (array of mental health contexts requiring safety review in Phase 2)

**Quality Gate:**
- All inputs are validated and normalized to accepted values
- User profile is internally consistent (e.g., no contradictory constraints)
- If assumptions were made, they are explicitly logged with the assumption and reason
- If mental_health_history is provided, contraindication flags are populated for Phase 2 review
- Validation status is not "invalid_input" (abort if it would be)

---

### Phase 2: Technique Mapping & Contraindication Screening

**Entry Criteria:**
- User profile from Phase 1 is complete and valid
- Contraindication flags (if any) are available

**Actions:**
1. Map experience level to technique complexity tier:
   - Beginner: breathing, body scan, grounding
   - Intermediate: visualization, loving-kindness, mantra, extended body scan
   - Advanced: concentration (shamatha), insight (vipassana), advanced visualization
2. Map primary and secondary goals to technique families:
   - Stress reduction → breathing, body scan, grounding
   - Focus → concentration, mantra, visualization
   - Sleep → body scan, progressive relaxation, visualization
   - Anxiety → grounding, breathing, loving-kindness
   - Emotional regulation → loving-kindness, body scan, visualization
   - General wellness → any technique appropriate to level
3. Filter technique families by experience level (keep only appropriate complexity).
4. Apply physical constraint filters: remove techniques that violate constraints. For example, if "cannot_lie_down", exclude supine body scan; if "back_pain", exclude techniques requiring sustained upright posture without support.
5. Apply mental health contraindication filters based on contraindication flags:
   - If "trauma" or "dissociation": exclude or flag body scan (can trigger dissociation); use grounding and present-moment techniques instead
   - If "grief": flag loving-kindness (can amplify grief initially); suggest breathing and gentle body scan instead
   - If "depression": avoid visualization of future/positive imagery (can feel invalidating); prefer grounding and acceptance-based techniques
   - If "psychosis": exclude concentration (can intensify intrusive thoughts); prefer grounding and external-focus techniques
   - If "anxiety_disorder": avoid extended breath-holding or breath-focus (can trigger panic); prefer body scan and grounding
6. Identify environment-specific adaptations: if practice_environment is "office" or "public_transit", prioritize techniques with eyes-open options and shorter durations; if "home_with_distractions", suggest techniques with external focus (grounding, visualization) over internal focus (concentration).
7. Rank remaining techniques by goal alignment (primary goals first, secondary goals second).
8. Output: Filtered technique pool with 4-8 candidate techniques ranked by goal alignment, with contraindication notes and environment adaptations.

**Output:**
- Technique pool (array of technique objects with name, complexity, goal_alignment, constraints, contraindication_status, environment_adaptations)
- Ranking by relevance to user's primary goals
- Safety notes (array of contraindications or cautions to include in final output)

**Quality Gate:**
- Technique pool contains only techniques appropriate to user's experience level
- All techniques in pool address at least one user goal
- No technique in pool violates physical constraints (verified by checking constraint_filter field)
- No technique in pool is marked as contraindicated for user's mental health history
- If contraindication flags were present, safety_notes array is populated with specific cautions
- Technique pool is non-empty (if empty, abort and return error: "No techniques match user profile after safety screening")

---

### Phase 3: Technique Selection & Progression

**Entry Criteria:**
- Technique pool from Phase 2 is populated and ranked
- Available time window is confirmed
- User history (if available) is available for progression logic

**Actions:**
1. Allocate time budget: opening (1-2 min), core practice (remaining - 2 min), closing (1-2 min). For 5-min sessions, use opening (1 min), core (3 min), closing (1 min).
2. Select core techniques from pool to fill core practice time:
   - For 5 min: 1 technique
   - For 10-15 min: 2 techniques
   - For 20+ min: 3-4 techniques
3. Prioritize techniques by goal alignment (primary goals first). If user has previous_sequence_id, check if top-ranked technique was used in previous sequence; if so, consider second-ranked technique to provide variety (unless user is still building foundational skill in that technique).
4. Ensure technique sequence follows pedagogical order: simpler/grounding techniques before complex/introspective ones. Specific order: grounding → breathing → body scan → visualization → loving-kindness → concentration → insight.
5. Assign durations to each selected technique, respecting time budget. For multiple techniques, allocate more time to primary-goal techniques and less to supporting techniques.
6. Verify that each primary goal is addressed by at least one selected technique. If not, return to step 2 and reselect.
7. Output: Ordered list of 1-4 core techniques with assigned durations, goal alignment, and progression context.

**Output:**
- Core_techniques (array with name, duration_minutes, goal_alignment, sequence_order, progression_context)
- Time allocation breakdown (opening_minutes, core_minutes, closing_minutes)
- Progression recommendation (e.g., "User is ready to extend core practice by 2 min" or "Suggest introducing intermediate technique after 2 weeks")

**Quality Gate:**
- Total technique duration + opening + closing = available_time_minutes (within 1 min tolerance)
- Techniques are ordered from grounding/simple to introspective/complex (verified against pedagogical order list)
- Each primary goal is addressed by at least one technique (verified by checking goal_alignment field for each goal)
- If user has history, selected techniques show intentional variety or intentional repetition (not random)

---

### Phase 4: Sequence Construction & Instruction Generation

**Entry Criteria:**
- Core techniques and time allocation from Phase 3
- User profile (experience level, style preference, constraints, environment)
- Safety notes from Phase 2

**Actions:**
1. Build opening phase (1-2 min):
   - For all levels: settling ("Find a comfortable position..."), posture check ("Ensure your spine is upright..."), intention-setting ("Today we practice to [primary goal]")
   - Include brief goal reminder with specific language matching user's goal (e.g., "We will practice to reduce stress by calming your nervous system" rather than generic "to reduce stress")
   - For practice_environment = "office" or "public_transit", add brief grounding cue (e.g., "Notice 5 things you can see")
2. Build core practice phases:
   - For each selected technique, write detailed instructions:
     - Setup (posture, environment, any props needed)
     - Step-by-step guidance (numbered, specific, actionable verbs: "Notice", "Breathe", "Scan", not vague "Relax" or "Feel")
     - Verbal/mental cues (e.g., "Notice the breath entering your nostrils" not "Focus on breath")
     - Timing markers (e.g., "Continue for 3 minutes" with specific endpoint)
     - Troubleshooting cue (e.g., "If your mind wanders, gently return attention to [focus object]")
   - Adapt guidance style to user preference:
     - guided_narrative: rich imagery, metaphor, emotional resonance (e.g., "Imagine a warm light entering with each breath")
     - minimal_cues: sparse, direct instructions, minimal elaboration (e.g., "Notice the breath. Count each exhale from 1 to 10.")
     - technical: anatomical/physiological detail (e.g., "Activate the parasympathetic nervous system by extending the exhale, engaging the vagus nerve")
3. For each technique, generate 1-2 modifications:
   - Modification 1: Alternative for physical constraints (e.g., seated instead of lying, eyes-open instead of eyes-closed)
   - Modification 2: Alternative for different experience levels (e.g., simplified version for beginner, advanced variation for advanced) OR alternative for environment (e.g., silent version for office, audible version for home)
   - For each modification, specify when_to_use (e.g., "Use if you have back pain", "Use if practicing in public")
4. Build closing phase (1-2 min):
   - Gentle return to awareness ("Begin to deepen your breath", "Wiggle your fingers and toes")
   - Gratitude or reflection prompt specific to goal (e.g., "Notice any shift in your stress level" for stress_reduction goal)
   - Transition to daily activity ("Carry this calm with you as you move into your day")
5. Compile full sequence with timing markers and phase labels. Ensure total duration matches available_time_minutes (within 1 min).
6. If safety_notes from Phase 2 are present, insert relevant cautions into instructions (e.g., if body scan is contraindicated, note "If you feel disconnected from your body, open your eyes and focus on external sensations instead")

**Output:**
- sequence_phases (array of phase objects, each with name, duration_minutes, techniques with full instructions, cues, and modifications)
- Sequence text (human-readable, ready to guide practice)
- Instruction quality check (all instructions use imperative verbs, all timing is explicit, all modifications are usable)

**Quality Gate:**
- Every instruction is specific and actionable (verified by checking for vague words: "relax", "feel", "focus" without object; all should be replaced with specific actions)
- Timing adds up correctly (opening + core + closing = available_time_minutes ± 1 min)
- Modifications are genuinely usable alternatives, not vague suggestions (each modification has specific instructions, not "try a different approach")
- Guidance style matches user preference (verified by checking for narrative language if guided_narrative, sparse language if minimal_cues, anatomical language if technical)
- If safety_notes are present, relevant cautions are integrated into instructions

---

### Phase 5: Validation, Enrichment & Output Assembly

**Entry Criteria:**
- Complete sequence from Phase 4
- User profile and goals from Phase 1
- Safety notes from Phase 2

**Actions:**
1. Validate sequence feasibility:
   - Total duration matches available_time_minutes (within 1 min tolerance)
   - All primary goals are addressed by at least one technique (verified by checking goal_alignment for each primary goal)
   - No technique violates physical constraints (verified by checking constraint_filter)
   - Sequence order is pedagogically sound (grounding → breathing → body scan → visualization → loving-kindness → concentration → insight)
   - If validation fails on any criterion, set validation_status to "adjust_required" with specific details and abort Phase 5
2. Generate goal alignment map: for each goal, list which techniques address it and the mechanism of benefit (e.g., "Stress Reduction: Addressed by Breathing (activates parasympathetic nervous system) and Body Scan (releases muscular tension)")
3. Generate 3-5 practice tips based on user profile:
   - For beginners: emphasis on consistency ("Practice at the same time each day"), managing expectations ("Your mind will wander; this is normal"), common pitfalls ("Don't judge yourself if you fall asleep during body scan")
   - For intermediate: deepening ("Explore subtle sensations"), exploring variations ("Try the modification with eyes open next time")
   - For advanced: refinement ("Notice the quality of attention"), subtle adjustments ("Experiment with extending the exhale by one count")
   - For specific goals: stress_reduction tips should mention consistency and environment; anxiety tips should mention grounding; sleep tips should mention timing and environment
   - For specific environments: office tips should mention discrete practice; public_transit tips should mention eyes-open options
4. Generate progression notes: how user can adapt sequence over time. Each note should have timeframe (e.g., "After 2 weeks"), action (e.g., "Extend core practice by 2 minutes"), and rationale (e.g., "Your nervous system will be more responsive"). Generate 2-3 progression notes.
5. Create sequence title: personalized name reflecting time, primary goal, and style. Format: "[Time]-Minute [Goal] [Descriptor]" (e.g., "10-Minute Anxiety Release", "20-Minute Focus & Calm", "5-Minute Grounding for Work")
6. Assemble final output object with all fields: sequence_title, sequence_phases, total_duration_minutes, goal_alignment, practice_tips, progression_notes, safety_notes, validation_status

**Output:**
- sequence_title (string)
- goal_alignment (object mapping each goal to techniques and mechanisms)
- practice_tips (string[], 3-5 tips specific to user profile)
- progression_notes (object[], 2-3 notes with timeframe, action, rationale)
- safety_notes (string[], any contraindications or cautions)
- validation_status ("pass" or "adjust_required" with details)
- Complete output object ready for return to user

**Quality Gate:**
- Validation status is "pass" (if not, abort and return error details)
- Goal alignment is explicit and complete (every primary goal is mapped to at least one technique)
- Practice tips are specific to user profile, not generic (verified by checking for personalization: beginner-specific language, environment-specific language, goal-specific language)
- Progression notes provide concrete next steps with timeframes and rationales (not vague "keep practicing")
- Sequence title is personalized and descriptive (not generic "Mindfulness Practice")
- All outputs are populated and non-empty

---

## Exit Criteria

The skill is complete when:
1. All inputs are validated and user profile is established (Phase 1 complete, validation_status is not "invalid_input")
2. Technique pool is filtered by experience level, goals, physical constraints, and mental health contraindications (Phase 2 complete, technique pool is non-empty)
3. Core techniques are selected and sequenced in pedagogically sound order (Phase 3 complete, all primary goals are addressed)
4. Full sequence with instructions, cues, and modifications is generated with style matching user preference (Phase 4 complete, all instructions are specific and actionable)
5. Sequence is validated against time, goals, and constraints (Phase 5 complete, validation_status is "pass")
6. Goal alignment, practice tips, and progression notes are provided and specific to user profile (Phase 5 complete, all enrichments are populated)
7. Safety notes are included if mental health history was provided (Phase 5 complete, safety_notes array is populated if contraindications exist)
8. Complete output object is assembled and ready for return

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Assessment | User experience level is invalid or missing | **Adjust** — default to "beginner" and log assumption in validation_status output |
| Assessment | Available time is outside accepted range (5, 10, 15, 20, 30+) | **Adjust** — round to nearest valid duration and log adjustment in validation_status |
| Assessment | No valid primary goals provided after filtering | **Abort** — return error: "No valid goals provided. Accepted values: stress_reduction, focus, sleep, anxiety, emotional_regulation, general_wellness" |
| Assessment | Physical constraints conflict with experience level (e.g., "cannot_lie_down" + beginner body scan) | **Adjust** — note constraint and filter technique pool accordingly in Phase 2 |
| Assessment | Mental health history includes unknown context | **Adjust** — log unknown context and proceed without contraindication filtering for that context |
| Technique Mapping | No techniques match user's experience level and goals after physical constraint filtering | **Adjust** — relax experience level constraint by one tier (beginner → intermediate, intermediate → advanced) and retry technique pool generation |
| Technique Mapping | Contraindication screening removes all techniques for a primary goal | **Adjust** — flag in safety_notes that goal cannot be safely addressed; suggest alternative goal or recommend consultation with mental health professional |
| Technique Selection | Selected techniques exceed available time by >2 min | **Adjust** — reduce number of techniques or shorten durations proportionally; log adjustment in validation_status |
| Technique Selection | No technique addresses primary goal after selection | **Abort** — return to Phase 2 and expand technique pool or relax constraints |
| Sequence Construction | Guidance style preference is invalid | **Adjust** — default to "guided_narrative" and log assumption |
| Sequence Construction | Total sequence duration exceeds available time by >2 min | **Adjust** — trim technique durations proportionally and recalculate; log adjustment in validation_status |
| Sequence Construction | Instructions for a technique are incomplete or unclear | **Adjust** — regenerate instructions using template: Setup → Step-by-step (numbered) → Cues → Timing → Troubleshooting |
| Validation | Sequence does not address all primary goals | **Adjust** — return to Phase 3 and reselect techniques; log adjustment in validation_status |
| Validation | Sequence violates physical constraints | **Adjust** — apply modifications or reselect techniques; log adjustment in validation_status |
| Validation | Sequence order is not pedagogically sound | **Adjust** — reorder techniques according to pedagogical sequence (grounding → breathing → body scan → visualization → loving-kindness → concentration → insight) |
| Validation | User rejects final output | **Targeted revision** -- ask which technique selection, timing, or sequence order fell short and rerun only that phase. Do not regenerate the full sequence. |

---

## Reference Section

### Technique Descriptions & Goal Alignment

**Breathing (Pranayama)**
- Complexity: Beginner
- Duration: 3-10 min
- Goals: Stress reduction, anxiety, focus
- Description: Structured breathing patterns to calm nervous system and anchor attention
- Mechanism: Activates parasympathetic nervous system; extends exhale to signal safety to vagus nerve
- Modifications: Box breathing (4-4-4-4), extended exhale (inhale 4, exhale 6), nostril alternate (nadi shodhana)
- Contraindications: Avoid extended breath-holding or breath-focus with anxiety_disorder (can trigger panic); use shorter cycles
- Environment adaptations: Excellent for office (discrete, no equipment); suitable for public transit

**Body Scan**
- Complexity: Beginner-Intermediate
- Duration: 5-15 min
- Goals: Stress reduction, sleep, emotional regulation
- Description: Systematic attention to physical sensations from head to toe, releasing tension
- Mechanism: Releases muscular tension; increases interoceptive awareness (body-mind connection)
- Modifications: Lying down (standard) or seated; rapid (5 min) or slow (15 min); eyes-open (for dissociation risk)
- Contraindications: Flag for trauma and dissociation (can trigger dissociation); offer eyes-open modification or grounding alternative
- Environment adaptations: Best for quiet_room or home; not suitable for office or public_transit

**Grounding (5-4-3-2-1)**
- Complexity: Beginner
- Duration: 3-5 min
- Goals: Anxiety, stress reduction
- Description: Sensory awareness technique to anchor to present moment using external senses
- Mechanism: Interrupts anxiety spiral by redirecting attention to immediate environment; activates parasympathetic response
- Modifications: Verbal (naming aloud) or silent; tactile emphasis (holding ice, touching textures) for high anxiety
- Contraindications: None; safe for all mental health contexts
- Environment adaptations: Excellent for office and public_transit (uses external environment); suitable for home_with_distractions

**Loving-Kindness (Metta)**
- Complexity: Intermediate-Advanced
- Duration: 5-20 min
- Goals: Emotional regulation, anxiety, general wellness
- Description: Cultivating compassion through repeated phrases and visualization directed at self and others
- Mechanism: Activates positive emotion circuits; reduces self-criticism and increases social connection
- Modifications: Self-focused (beginner: "May I be happy") or expanding to others (intermediate+: "May all beings be happy")
- Contraindications: Flag for grief (can amplify grief initially); suggest breathing or gentle body scan instead; can introduce after grief processing
- Environment adaptations: Suitable for quiet_room or home; not ideal for office or public_transit (requires internal focus)

**Visualization**
- Complexity: Intermediate
- Duration: 5-15 min
- Goals: Focus, stress reduction, sleep
- Description: Mental imagery of calming or empowering scenes, engaging multiple senses
- Mechanism: Activates relaxation response through imagery; provides mental escape from stressors
- Modifications: Guided (narrative-rich, e.g., "beach scene") or minimal (simple scene, e.g., "blue sky"); active (engaging senses) or passive (observing)
- Contraindications: Flag for depression (avoid future/positive imagery that feels invalidating); use present-moment or nature-based imagery instead
- Environment adaptations: Suitable for quiet_room or home; can adapt for office with eyes-open variation

**Concentration (Shamatha)**
- Complexity: Advanced
- Duration: 10-30 min
- Goals: Focus, general wellness
- Description: Sustained attention on single object (breath, mantra, visual point) to develop mental stability
- Mechanism: Strengthens attention networks; reduces mind-wandering; builds mental resilience
- Modifications: Breath focus (most accessible) or mantra focus (e.g., "Om"); open eyes (visual focus) or closed eyes (internal focus)
- Contraindications: Exclude for psychosis (can intensify intrusive thoughts); use grounding and external-focus techniques instead
- Environment adaptations: Best for quiet_room; not suitable for office or public_transit (requires sustained internal focus)

**Insight (Vipassana)**
- Complexity: Advanced
- Duration: 15-30 min
- Goals: Emotional regulation, general wellness
- Description: Open awareness of thoughts, sensations, emotions without judgment; observing mental processes
- Mechanism: Develops metacognitive awareness; reduces reactivity to thoughts and emotions; builds psychological flexibility
- Modifications: Structured (body scan + open awareness) or unstructured (open awareness from start)
- Contraindications: Use with caution for trauma and psychosis; ensure grounding techniques are available if overwhelm occurs
- Environment adaptations: Best for quiet_room; not suitable for office or public_transit

### Time Allocation Guidelines

- **5 minutes:** Opening (1 min) + 1 core technique (3 min) + Closing (1 min)
- **10 minutes:** Opening (1 min) + 2 core techniques (7 min, split 4/3 or 3.5/3.5) + Closing (1 min)
- **15 minutes:** Opening (1.5 min) + 2-3 core techniques (11.5 min) + Closing (1.5 min)
- **20 minutes:** Opening (2 min) + 3 core techniques (16 min) + Closing (2 min)
- **30+ minutes:** Opening (2 min) + 4 core techniques (26+ min) + Closing (2 min)

### Goal-to-Technique Mapping

| Goal | Primary Techniques | Secondary Techniques | Mechanism |
|---|---|---|---|
| Stress Reduction | Breathing, Body Scan, Grounding | Visualization, Loving-Kindness | Activates parasympathetic nervous system; releases muscular tension; redirects attention |
| Focus | Concentration, Mantra | Breathing, Visualization | Strengthens attention networks; anchors mind to single object |
| Sleep | Body Scan, Visualization | Breathing, Progressive Relaxation | Releases tension; calms nervous system; provides mental escape |
| Anxiety | Grounding, Breathing, Loving-Kindness | Body Scan, Visualization | Interrupts anxiety spiral; activates parasympathetic response; builds self-compassion |
| Emotional Regulation | Loving-Kindness, Body Scan, Insight | Visualization, Breathing | Develops metacognitive awareness; reduces reactivity; builds psychological flexibility |
| General Wellness | Any technique appropriate to level | — | Varies by technique |

### Guidance Style Definitions

- **Guided Narrative:** Rich, evocative language with imagery and metaphor. Suitable for beginners and those who benefit from external structure. Example: "Imagine a warm light entering with each breath, melting tension from your shoulders. Feel the weight of your body sinking into the ground."
- **Minimal Cues:** Sparse, direct instructions with minimal elaboration. Suitable for intermediate practitioners and those who prefer internal focus. Example: "Notice the breath. Count each exhale from 1 to 10. When you reach 10, return to 1."
- **Technical:** Anatomical and physiological detail. Suitable for advanced practitioners and those with scientific interest. Example: "Activate the parasympathetic nervous system by extending the exhale to 6 counts, engaging the vagus nerve and signaling safety to your amygdala."

### Progression Pathways

- **Beginner → Intermediate:** After 2-4 weeks of consistent practice (10-15 sessions), extend core practice by 2-3 minutes. Introduce one intermediate technique (e.g., visualization or loving-kindness). Verify comfort with foundational techniques before advancing.
- **Intermediate → Advanced:** After 8+ weeks of consistent practice (30+ sessions), explore advanced techniques (concentration, insight). Extend practice to 20+ minutes. Experiment with combining techniques (e.g., body scan + open awareness).
- **Maintenance:** Rotate techniques monthly to prevent habituation. Adjust goals seasonally (e.g., sleep focus in winter, focus in spring). Track practice consistency and adjust frequency based on goal achievement.

### Contraindication Reference

| Mental Health Context | Contraindicated Techniques | Safe Alternatives | Cautions |
|---|---|---|---|
| Trauma | Body Scan (can trigger dissociation), Concentration (can intensify intrusive thoughts) | Grounding, Breathing, Loving-Kindness (self-focused) | Offer eyes-open modifications; ensure grounding techniques available; recommend professional support |
| Dissociation | Body Scan (can amplify dissociation) | Grounding, Breathing, External-focus techniques | Use eyes-open body scan or skip body scan; prioritize grounding |
| Grief | Loving-Kindness (can amplify grief initially), Visualization (positive imagery may feel invalidating) | Breathing, Grounding, Gentle Body Scan | Introduce loving-kindness after grief processing; use present-moment visualization |
| Depression | Visualization (future/positive imagery may feel invalidating), Concentration (can amplify rumination) | Grounding, Body Scan, Breathing | Use present-moment or nature-based visualization; monitor for rumination during concentration |
| Anxiety Disorder | Extended breath-focus (can trigger panic), Concentration (can amplify intrusive thoughts) | Grounding, Breathing (short cycles), Body Scan | Use shorter breathing cycles (4-4-4-4 instead of extended exhale); prioritize grounding |
| Psychosis | Concentration (can intensify intrusive thoughts), Insight (can amplify paranoia) | Grounding, External-focus techniques, Breathing | Avoid internal-focus techniques; prioritize grounding and present-moment awareness; recommend professional support |
| Substance Use History | Visualization (can trigger cravings), Concentration (can amplify cravings) | Grounding, Breathing, Body Scan | Monitor for triggers; recommend professional support; use grounding as relapse prevention tool |

### State Persistence & User History

If state persistence layer is available:
- Store completed sequences with user_id, sequence_id, completion_date, user_feedback (difficulty, goal_achievement, technique_preference)
- On subsequent calls with previous_sequence_id, retrieve history and:
  - Avoid repeating same technique sequence within 2 weeks
  - Suggest progression (extend duration, increase complexity) if user reported "easy" difficulty
  - Suggest regression (reduce complexity, add modifications) if user reported "difficult" difficulty
  - Track goal achievement over time and adjust technique selection based on effectiveness

---

**Version:** 2.0  
**Last Updated:** 2024  
**License:** Free to use. Royalties apply to published derivatives.