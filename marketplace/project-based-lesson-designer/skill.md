# Project-Based Lesson Designer

**One-line description:** Design a hands-on project that teaches a specific skill with scaffolded steps, checkpoints, extension challenges, and validated alignment to learning objectives.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `skill_domain` (string, required): The technical or conceptual skill to be taught (e.g., "Python list comprehensions", "user interview techniques", "circuit design").
- `learner_level` (string, required): Target learner starting point — one of: "beginner", "intermediate", "advanced".
- `time_constraint` (string, required): Total time available for the project (e.g., "2 hours", "1 week", "semester").
- `available_resources` (array of strings, optional): Tools, software, materials, or environments available (e.g., ["Python 3.9+", "Jupyter notebooks", "Arduino kit"]).
- `learner_motivation` (string, optional): What motivates the target learners (e.g., "career advancement", "curiosity", "solving a real problem").
- `instructor_context` (string, optional): Role and expertise of the instructor (e.g., "high school teacher", "bootcamp mentor", "self-paced learner").

---

## Outputs

- `learning_objective` (string): Clear, measurable statement of what learners will be able to do after completing the project.
- `project_brief` (object): Contains `scenario` (real-world context), `deliverable` (what learners produce), `relevance` (why this skill matters).
- `scaffolded_steps` (array of objects): 5-8 ordered steps, each with `step_number`, `action`, `learning_focus`, `input_materials`, `output_artifact`, `estimated_time`.
- `checkpoints` (array of objects): 2-4 formative assessments, each with `checkpoint_name`, `trigger_step`, `assessment_task`, `pass_criteria`, `feedback_guidance`.
- `extensions` (array of objects): 2-3 optional advanced tasks, each with `extension_name`, `prerequisite_checkpoint`, `challenge_description`, `success_criteria`.
- `supporting_materials` (array of objects): Reference guides, templates, code samples keyed to steps, each with `material_name`, `linked_step`, `format`, `content_summary`, `accessibility_features`.
- `completion_rubric` (object): Rubric with `core_competency_levels` (novice/proficient/advanced) and `extension_tiers` (optional achievement levels).
- `differentiation_strategy` (object): Contains `fast_learner_pathway` (condensed or enriched steps), `struggling_learner_pathway` (additional scaffolding), `common_misconceptions` (array of typical errors and corrections).
- `validation_report` (object): Contains `alignment_score` (0-100), `gaps_identified` (array), `recommendations` (array), `prerequisite_validation_checklist` (array).
- `instructor_guide` (object): Contains `troubleshooting_guide` (array of common issues and solutions), `facilitation_tips` (array), `reflection_prompts` (array for learner metacognition).

---

## Execution Phases

### Phase 1: Define Learning Objective and Validate Feasibility

**Entry Criteria:**
- `skill_domain`, `learner_level`, and `time_constraint` are provided.
- Instructor context is known (or assumed to be a subject-matter expert).

**Actions:**

1. Write a learning objective in the form: "After completing this project, learners will be able to [action verb] [skill] in the context of [real-world scenario]." Use Bloom's taxonomy verbs (apply, analyze, create, evaluate) appropriate to the learner level. Avoid vague verbs like "understand" or "learn".
2. Validate that the skill is suitable for hands-on project format: Does it require practice? Can it be demonstrated through a concrete deliverable? If not, note and adjust to a hybrid format (project + theory).
3. Assess time feasibility using the heuristic: foundational step = 15-30 min, practice step = 10-20 min, integration step = 20-40 min, checkpoint = 10-20 min. Estimate whether the skill can be meaningfully taught in the given time constraint. If time is insufficient (e.g., learning Python in 2 hours), reduce scope to a specific sub-skill (e.g., "list comprehensions") and document the trade-off.
4. Identify any hard prerequisites (e.g., "learners must know loops before list comprehensions"). Document these as entry requirements. Create a prerequisite validation checklist: for each prerequisite, specify how it will be verified (self-assessment, pre-test, or assumed).
5. Identify learner misconceptions common to this skill domain (e.g., "confusing list indexing with list length" for Python lists). Document these for use in Phase 7.

**Output:**
- `learning_objective`: Formal statement using action verb and context.
- `feasibility_notes`: Any constraints or adjustments to scope, with rationale.
- `prerequisites`: List of assumed prior knowledge with validation method for each.
- `common_misconceptions_draft`: Preliminary list of typical errors to address in checkpoints.

**Quality Gate:**
- Learning objective uses an action verb from Bloom's taxonomy (apply, analyze, create, evaluate, not understand or learn).
- Learning objective is testable and specific to a real-world context.
- Time constraint is realistic for the skill scope, justified by time estimation heuristic.
- Prerequisites are explicit and each has a validation method (self-check, pre-test, or assumed).
- At least 2 common misconceptions are documented.

---

### Phase 2: Design Project Concept and Real-World Context

**Entry Criteria:**
- Learning objective is defined and feasible.
- Available resources and learner motivation are known.

**Actions:**

1. Identify a real-world scenario or problem that authentically requires the target skill. The scenario should resonate with learner motivation (e.g., if learners care about climate, frame a data analysis project around climate data). Brainstorm 3 candidate scenarios and choose the most authentic and motivating.
2. Define the deliverable: What concrete artifact will learners produce? (e.g., a working Python script, a designed circuit, a user research report). The deliverable must directly demonstrate the target skill and be completable within the time constraint.
3. Write a project brief (2-3 paragraphs) that includes: the scenario, the problem or challenge, the deliverable, and why the skill matters. Use language appropriate to the learner level. Include a statement of relevance: "This skill matters because [specific reason relevant to learner motivation]."
4. Identify constraints and resources: What tools, data, or materials will learners have access to? What are the constraints (e.g., "no internet access", "budget limit of $50")? Document any accessibility considerations (e.g., "project can be completed with screen reader").
5. Validate authenticity: Could this project be assigned in a real workplace or professional context? If not, adjust the scenario to be more authentic.

**Output:**
- `project_brief`: Scenario (2-3 sentences), deliverable (specific artifact), relevance (why it matters), constraints, resources, accessibility notes.

**Quality Gate:**
- The scenario is concrete and relatable, not abstract or contrived. It reflects a real-world problem or context.
- The deliverable is specific, measurable, and directly demonstrates the target skill.
- The project brief uses language appropriate to the learner level (no jargon for beginners; technical terms for advanced learners).
- A person unfamiliar with the skill domain could read the brief and understand what to build and why it matters.
- Accessibility considerations are documented.

---

### Phase 3: Decompose Skill into Scaffolded Learning Steps

**Entry Criteria:**
- Project brief is defined.
- Learning objective and target skill are clear.

**Actions:**

1. Break the target skill into 5-8 sub-skills or micro-steps, ordered from foundational to advanced. Each step should build on the prior one. Create a dependency diagram if helpful to visualize prerequisites.
2. For each step, define: the learning focus (what specific aspect of the skill), the input materials (what the learner starts with), the action (what they do, using imperative verbs), and the output artifact (what they produce).
3. Estimate time for each step using the heuristic: foundational step = 15-30 min, practice step = 10-20 min, integration step = 20-40 min. Ensure the total aligns with the time constraint. If total exceeds time constraint, merge or remove steps.
4. Design scaffolding for each step: What guidance, templates, or examples will reduce cognitive load? What should learners discover themselves? Document the scaffolding approach for each step (e.g., "provide a worked example, then learners adapt it"; "provide a partial template; learner fills in the body"; "provide hints but not the solution").
5. Ensure each step is achievable in one session or logical work block. If a step is too large (>45 min), split it. If a step is too small (<5 min), merge it with an adjacent step.
6. For each step, identify which common misconceptions (from Phase 1) might arise and plan how the step's scaffolding will address them.

**Output:**
- `scaffolded_steps`: Array of 5-8 steps, each with step_number, action (imperative verb), learning_focus, input_materials, output_artifact, estimated_time, scaffolding_approach, misconceptions_addressed.

**Quality Gate:**
- Each step has a clear, imperative action verb (not "understand" or "learn").
- Each step has a clear input and output artifact.
- Steps are ordered logically; each builds on prior ones with no circular dependencies.
- No step is vague (e.g., "learn the concept" is not a step; "apply the concept to a provided dataset" is).
- Each step's estimated time is 5-45 minutes.
- Total estimated time ≤ time constraint.
- Each step addresses at least one common misconception through its scaffolding.

---

### Phase 4: Create Checkpoint Assessments

**Entry Criteria:**
- Scaffolded steps are defined.
- Learning objective and success criteria are clear.
- Common misconceptions are documented.

**Actions:**

1. Identify natural breakpoints in the scaffolded steps where learners have completed a major skill cluster (typically after 2-3 steps). Plan 2-4 checkpoints, with at least one checkpoint designed to catch common misconceptions.
2. For each checkpoint, design a formative assessment task: a small, focused task that requires learners to apply the skills learned so far. The task should be completable in 10-20 minutes and should directly assess one or more common misconceptions.
3. Define pass criteria: What does a successful checkpoint look like? Be specific and objective (e.g., "code runs without errors and produces correct output for 3 test cases", not "code works"). Criteria must be verifiable without subjective judgment.
4. Write feedback guidance: If a learner fails a checkpoint, what feedback or hints should they receive? What is the recovery path (e.g., "review step 2, then retry")? Provide specific, actionable feedback tied to the misconception being assessed.
5. Decide: Are checkpoints self-assessed (learner checks their own work against a rubric) or instructor-assessed? Document the approach. Provide a self-assessment rubric or checklist if self-assessed.
6. Design a remediation pathway: If a learner fails a checkpoint, what steps should they repeat or what additional scaffolding should they receive?

**Output:**
- `checkpoints`: Array of 2-4 checkpoints, each with checkpoint_name, trigger_step, assessment_task, pass_criteria (objective and measurable), feedback_guidance (specific and actionable), assessment_mode (self/instructor), misconceptions_assessed (array), remediation_pathway (steps to repeat or additional scaffolding).

**Quality Gate:**
- Each checkpoint is tied to a specific step or step range.
- Pass criteria are objective, measurable, and verifiable (not subjective like "good" or "appropriate").
- Feedback guidance is actionable and specific to the misconception being assessed (not just "try again").
- Checkpoints are not redundant; each assesses a distinct skill cluster or misconception.
- At least one checkpoint explicitly assesses a common misconception.
- Remediation pathways are concrete (e.g., "review step 2 and redo the practice exercise").

---

### Phase 5: Design Extension Challenges for Advanced Learners

**Entry Criteria:**
- Scaffolded steps and checkpoints are defined.
- Core project is achievable and well-scoped.

**Actions:**

1. Design 2-3 optional extension tasks that deepen or broaden the skill. Extensions should be truly optional and non-blocking (learners can complete the core project without them). Each extension should be independent; learners should not need to complete one extension to access another.
2. For each extension, define: the challenge description (what learners will do), the prerequisite checkpoint (which checkpoint must be passed first), and success criteria (how to know the extension is complete). Estimated time should be 20-60 minutes (open-ended since optional).
3. Vary extension types: one might deepen the core skill (e.g., "optimize your code for performance"), another might broaden it (e.g., "apply the same technique to a different domain"), and another might explore edge cases (e.g., "handle error conditions").
4. Ensure extensions are appropriately challenging for advanced learners but not so difficult that they require external research or expertise beyond the project scope. Provide scaffolding for extensions similar to core steps (worked examples, partial templates, hints).
5. Consider how extensions affect the completion rubric: Do they unlock an "advanced" or "mastery" tier? Document the relationship.

**Output:**
- `extensions`: Array of 2-3 extension tasks, each with extension_name, extension_type (deepen/broaden/edge_cases), prerequisite_checkpoint, challenge_description, success_criteria, estimated_time, scaffolding_approach, rubric_tier_unlocked.

**Quality Gate:**
- Extensions are optional and do not block core completion.
- Each extension is distinct in focus and type (not just "do more of the same").
- Success criteria are clear and achievable.
- Extensions are independent; learners can choose any subset without prerequisites between extensions.
- Scaffolding is provided for extensions (not left to learner discovery).

---

### Phase 6: Develop Supporting Materials and Resources

**Entry Criteria:**
- All prior phases are complete.
- Scaffolded steps, checkpoints, and extensions are defined.

**Actions:**

1. For each scaffolded step, identify what supporting materials would reduce cognitive load without removing the learning challenge. Examples: code templates, reference guides, worked examples, checklists, visual diagrams, data files, video tutorials, interactive simulations.
2. Create or outline each material. Be specific about content (e.g., "template includes function signature and docstring; learner fills in the body"). For each material, specify the format (text, code, diagram, video, interactive, audio).
3. Decide what materials are provided upfront vs. revealed progressively. Document the release strategy (e.g., "worked example provided before step 2; partial template provided at start of step 3").
4. Ensure materials are keyed to specific steps so learners know when to use them. Create a materials index mapping each material to its step(s).
5. Conduct an accessibility audit: For each material, specify accessibility features (e.g., "text has alt text for diagrams", "video has captions", "code template is compatible with screen readers"). Provide materials in multiple formats where possible (e.g., both text and video for a worked example).
6. Consider cognitive load: Are materials reducing load without removing challenge? If a material is too prescriptive (e.g., complete code solution), adjust to be less complete (e.g., function signature and hints).

**Output:**
- `supporting_materials`: Array of materials, each with material_name, linked_step (array of step numbers), format (text/code/diagram/video/interactive/audio), content_summary, release_strategy, accessibility_features (array), cognitive_load_level (low/medium/high).

**Quality Gate:**
- Each material supports a specific step or step range.
- Materials reduce cognitive load without removing the learning challenge.
- Materials are concrete and actionable (not vague guidance like "think about how to solve this").
- Accessibility features are documented for each material.
- Materials are available in at least 2 formats where feasible (e.g., text + video, code + diagram).
- No material is so prescriptive that it removes the learning challenge (e.g., complete code solutions are not provided; partial templates or hints are).

---

### Phase 7: Define Success Criteria and Completion Rubric

**Entry Criteria:**
- All prior phases are complete.
- Learning objective, checkpoints, and extensions are defined.

**Actions:**

1. Define core competency levels: Typically novice (meets minimum learning objective), proficient (demonstrates skill confidently), advanced (applies skill in novel contexts or with sophistication). For each level, describe what it looks like in terms of the deliverable and the learner's ability to apply the skill.
2. Create a rubric with rows for each competency dimension (e.g., "correctness", "code quality", "explanation", "problem-solving approach") and columns for each level (novice/proficient/advanced). Assign points or descriptors to each cell. Descriptors must be specific to this project (not generic).
3. Define extension achievement tiers: How do extensions affect the final grade or achievement level? (e.g., completing one extension = advanced, completing two = mastery). Document the relationship between extensions and rubric tiers.
4. Decide on completion criteria: Is the project pass/fail (meets learning objective or not) or graduated (novice/proficient/advanced)? Document the decision and the threshold (e.g., "proficient or higher = pass").
5. Write a summary statement: "A learner has successfully completed this project when [criteria]." Make it testable and specific to this project.
6. Include a self-assessment component: Provide learners with a checklist or rubric they can use to self-assess their work before submission. This promotes metacognition and reduces surprises.

**Output:**
- `completion_rubric`: Object with core_competency_levels (array of level objects with name, description, point_value, specific_examples_from_this_project), competency_dimensions (array of dimension objects with name, description, rubric_cells_by_level), extension_tiers (array of tier objects with name, extensions_required, rubric_tier_unlocked), completion_criteria (summary statement, testable and specific), self_assessment_checklist (array of checkpoints learner can verify).

**Quality Gate:**
- Rubric is specific to this project (references the deliverable, skill domain, and context).
- Each rubric cell is descriptive enough that two graders would score similarly (inter-rater reliability).
- Completion criteria are testable and aligned with the learning objective.
- Self-assessment checklist is clear and actionable for learners.
- Extension tiers are clearly defined and achievable.

---

### Phase 8: Validate Project Design Against Learning Objective

**Entry Criteria:**
- All prior phases are complete.
- Full project design is assembled.

**Actions:**

1. Review the complete project design against the original learning objective. Does the project authentically teach the skill? Will a learner who completes all scaffolded steps and passes checkpoints achieve the learning objective? Trace each learning objective component to the steps and checkpoints that teach and assess it.
2. Identify any gaps: Are there aspects of the learning objective not covered by the project? Are there prerequisites missing? Are there assumptions about learner knowledge that are not documented? Create a gap analysis table: learning objective component → steps that teach it → checkpoints that assess it. Flag any component with no teaching step or no assessment checkpoint.
3. Check for alignment: Does each scaffolded step contribute to the learning objective? Are checkpoints assessing the right skills? Do extensions align with the objective or do they diverge? Remove or adjust any step, checkpoint, or extension that does not contribute to the learning objective.
4. Validate feasibility: Is the project realistic for the target learner level and time constraint? Are there any resource or logistical barriers? Conduct a resource audit: for each step, verify that required materials and tools are available and accessible.
5. Validate prerequisite assumptions: For each documented prerequisite, confirm that it is reasonable to assume learners have it (or that a pre-assessment is provided). If a prerequisite is not universal, provide remediation materials.
6. Generate a validation report with an alignment score (0-100), identified gaps, recommendations for improvement, and a prerequisite validation checklist.

**Output:**
- `validation_report`: Object with alignment_score (0-100, calculated as: 100 × (learning_objective_components_with_teaching_and_assessment / total_learning_objective_components)), gap_analysis (array of gaps with component, missing_teaching_step_or_checkpoint, recommendation), resource_audit (array of resource requirements and availability status), prerequisite_validation_checklist (array of prerequisites with validation method and status), recommendations (array of specific improvements), final_sign_off (boolean: true if alignment_score ≥ 80 and all gaps have recommendations).

**Quality Gate:**
- Alignment score is ≥ 80 (project substantially aligns with learning objective).
- All identified gaps have recommended fixes.
- Feasibility is confirmed or constraints are documented.
- Prerequisite validation checklist is complete.
- Resource audit confirms all required materials are available.
- Final sign-off is true (or false with documented reasons if not).

---

### Phase 9: Develop Instructor Guide and Differentiation Strategy

**Entry Criteria:**
- All prior phases are complete and validated.
- Project design is finalized.

**Actions:**

1. Create a differentiation strategy for learners progressing at different rates. Define a fast-learner pathway (condensed steps, enrichment challenges, or accelerated progression) and a struggling-learner pathway (additional scaffolding, repeated practice, or remediation). Document how instructors can identify which pathway a learner needs (e.g., checkpoint performance, self-assessment, instructor observation).
2. Develop a troubleshooting guide for instructors: Document 5-10 common issues learners encounter (e.g., "code doesn't run", "output is wrong", "misunderstands the problem"), their likely causes, and recovery strategies. For each issue, provide a diagnostic question ("How do you know the learner has this issue?") and a solution ("What should the instructor do?").
3. Create facilitation tips: Document best practices for running this project (e.g., "check in with learners after step 2 to ensure they understand the concept", "use the checkpoint as a formative assessment, not a grade", "celebrate extensions but don't pressure learners to complete them").
4. Design reflection prompts: Create 3-5 reflection questions learners answer after each checkpoint or at project completion (e.g., "What was the most challenging part of this step?", "How would you apply this skill in a real project?", "What would you do differently next time?"). These promote metacognition and provide valuable feedback.
5. Document common misconceptions and how to address them: For each misconception identified in Phase 1, provide a teaching strategy (e.g., "use a worked example that shows the correct approach and a contrasting example that shows the misconception").

**Output:**
- `instructor_guide`: Object with troubleshooting_guide (array of issues with diagnostic_question, likely_causes, recovery_strategy), facilitation_tips (array of best practices), reflection_prompts (array of prompts keyed to checkpoints or project completion), differentiation_strategy (object with fast_learner_pathway, struggling_learner_pathway, identification_criteria), misconception_teaching_strategies (array of misconceptions with teaching approaches).

**Quality Gate:**
- Troubleshooting guide covers at least 5 common issues with concrete solutions.
- Facilitation tips are specific and actionable (not generic advice).
- Reflection prompts are open-ended and promote metacognition.
- Differentiation strategy is concrete with clear identification criteria and specific pathways.
- Misconception teaching strategies are evidence-based and specific to this skill domain.

---

## Exit Criteria

The project-based lesson design is DONE when:

1. A clear, measurable learning objective is defined using action verbs and feasible within the time constraint.
2. A concrete project brief with real-world scenario, deliverable, and relevance statement is written.
3. 5-8 scaffolded steps are defined, ordered logically, with clear inputs, outputs, estimated times that total ≤ time constraint, and scaffolding approaches documented.
4. 2-4 checkpoint assessments are designed with objective pass criteria, actionable feedback guidance, and remediation pathways.
5. 2-3 optional extension challenges are designed for advanced learners, independent and non-blocking.
6. Supporting materials (templates, guides, examples) are identified, keyed to steps, and include accessibility features.
7. A completion rubric with core competency levels and extension tiers is defined, specific to this project.
8. A differentiation strategy with fast-learner and struggling-learner pathways is documented.
9. A validation report confirms alignment with the learning objective (score ≥ 80) and documents gaps and recommendations.
10. An instructor guide with troubleshooting, facilitation tips, reflection prompts, and misconception strategies is provided.
11. A person unfamiliar with the skill domain could follow the project brief and scaffolded steps and produce a meaningful deliverable that demonstrates the target skill.
12. All common misconceptions for the skill domain are identified and addressed in checkpoints and teaching strategies.

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Learning objective is too vague (e.g., "understand Python") | **Adjust** -- Rewrite using action verbs from Bloom's taxonomy (apply, create, debug) and add specific context (e.g., "create a Python script that analyzes CSV data and produces a summary report"). |
| Phase 1 | Time constraint is unrealistic for skill scope (e.g., 2 hours to learn Python) | **Adjust** -- Reduce scope to a specific sub-skill (e.g., focus on "list comprehensions" instead of "Python") or extend time. Document the trade-off and rationale. |
| Phase 1 | Prerequisites are not documented or validated | **Adjust** -- Create a prerequisite validation checklist for each prerequisite, specifying how it will be verified (self-assessment, pre-test, or assumed). Provide remediation materials for learners lacking prerequisites. |
| Phase 2 | Project scenario is contrived or unmotivating | **Adjust** -- Brainstorm 3 alternative scenarios aligned with learner motivation. Pilot with 1-2 learners to test authenticity. Choose the most authentic and motivating. |
| Phase 3 | Scaffolded steps are too large or too small (step takes <5 min or >45 min) | **Adjust** -- Merge small steps or split large ones. Re-estimate time. Verify that each step has a clear input and output artifact. |
| Phase 3 | Steps are out of order or have circular dependencies | **Adjust** -- Reorder steps so each builds on prior ones. Create a dependency diagram if helpful. Add an initialization step if needed. |
| Phase 4 | Checkpoint pass criteria are subjective (e.g., "code is good") | **Adjust** -- Rewrite criteria to be objective and measurable (e.g., "code runs without errors and produces correct output for 3 test cases"). Use a rubric or checklist to make criteria explicit. |
| Phase 4 | Checkpoints do not assess common misconceptions | **Adjust** -- Review common misconceptions from Phase 1. Redesign at least one checkpoint to explicitly assess a misconception (e.g., "does the learner confuse list indexing with list length?"). |
| Phase 5 | Extensions are too easy or too hard relative to core project | **Adjust** -- Pilot with 1-2 advanced learners. Adjust challenge level. Ensure extensions are independent and non-blocking. |
| Phase 6 | Supporting materials are too prescriptive (remove learning challenge) | **Adjust** -- Provide less complete templates or worked examples. Shift from "here's the answer" to "here's a hint". Use a partial template or guided discovery approach. |
| Phase 6 | Materials are not accessible to learners with disabilities | **Adjust** -- Provide materials in multiple formats (text, video, audio, interactive). Add alt text to diagrams. Ensure code templates are compatible with screen readers. Test with assistive technologies. |
| Phase 7 | Rubric is generic and not specific to this project | **Adjust** -- Rewrite rubric rows and cells to reference specific deliverables and skills from this project. Include examples from the project context. |
| Phase 8 | Validation score is <80 (poor alignment with learning objective) | **Adjust** -- Identify gaps using the gap analysis table. Either modify the project (add steps, change deliverable, add checkpoints) or modify the learning objective (narrow scope). Re-validate. |
| Phase 8 | Resources required for the project are not available | **Adjust** -- Modify the project to use available resources, or document resource requirements and provide alternatives (e.g., "if Python is not available, use JavaScript instead"). |
| Phase 9 | Differentiation pathways are not concrete or actionable | **Adjust** -- Specify exactly which steps fast learners skip or which steps struggling learners repeat. Provide specific scaffolding materials for struggling learners. Document identification criteria (e.g., "if checkpoint 1 score is <70%, use struggling-learner pathway"). |
| Phase 9 | User rejects final output | **Targeted revision** -- ask which project step, rubric criterion, or differentiation pathway fell short and rerun only that phase. Do not redesign the full lesson. |

---

## Reference Section: Domain Knowledge and Decision Criteria

### Scaffolding Strategies

- **Worked Example:** Provide a complete, annotated example of the skill in action. Learner studies it, then applies the same approach to a new problem.
- **Partial Template:** Provide a skeleton or outline (e.g., function signature, loop structure). Learner fills in the details.
- **Guided Discovery:** Provide a problem and hints, but not the solution. Learner discovers the approach.
- **Fading:** Start with heavy scaffolding (worked example) and gradually reduce it (hints, then nothing) as learner progresses.
- **Contrasting Examples:** Provide both a correct example and an incorrect example (showing a common misconception). Learner compares and identifies the difference.

### Checkpoint Design Principles

- Checkpoints should be **formative** (provide feedback for improvement) not **summative** (final grade). They are low-stakes.
- Checkpoints should assess **one skill cluster** at a time, not the entire project.
- Checkpoints should be **completable in 10-20 minutes** so they do not disrupt workflow.
- Checkpoints should have **clear pass/fail criteria** so learners know immediately if they succeeded.
- At least one checkpoint should explicitly assess a **common misconception** for the skill domain.

### Extension Design Principles

- Extensions should be **truly optional** and non-blocking. A learner who skips all extensions should still complete the core project successfully.
- Extensions should **vary in type**: deepen (master the core skill more), broaden (apply skill to new domain), or explore edge cases.
- Extensions should be **appropriately challenging** for advanced learners but not require external expertise or research.
- Extensions should **build on checkpoints**, not on each other, so learners can choose independently.
- Extensions should have **scaffolding** similar to core steps (worked examples, partial templates, hints).

### Bloom's Taxonomy Verbs by Level

- **Beginner (Remember/Understand):** Define, identify, list, describe, recall.
- **Intermediate (Apply/Analyze):** Apply, solve, use, demonstrate, classify, distinguish, debug.
- **Advanced (Evaluate/Create):** Evaluate, critique, create, design, synthesize, justify, optimize.

### Time Estimation Heuristics

- **Foundational step** (new concept): 15-30 minutes.
- **Practice step** (apply known concept): 10-20 minutes.
- **Integration step** (combine multiple skills): 20-40 minutes.
- **Checkpoint**: 10-20 minutes.
- **Extension**: 20-60 minutes (optional, so can be open-ended).

### Learner Level Definitions

- **Beginner:** No prior experience with the skill. May have general domain knowledge (e.g., knows what a variable is, but not how to use it in code).
- **Intermediate:** Has basic familiarity with the skill. Can follow examples but struggles with novel applications.
- **Advanced:** Can apply the skill confidently and adapt it to new contexts. Ready for challenges and edge cases.

### Common Misconceptions by Domain

- **Programming (Python lists):** Confusing list indexing with list length; thinking list.append() returns the modified list; misunderstanding list slicing syntax.
- **Data Analysis:** Confusing correlation with causation; misinterpreting statistical significance; not considering data quality and bias.
- **Design Thinking:** Jumping to solutions before understanding the problem; not validating assumptions with users; treating user research as optional.
- **Circuit Design:** Misunderstanding voltage vs. current; thinking components in series have the same current (correct) but different voltage (incorrect); not considering power dissipation.

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.