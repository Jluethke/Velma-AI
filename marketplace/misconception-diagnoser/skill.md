# Misconception Diagnoser

**One-line description:** Analyze a student's practice problem mistakes to identify misconception patterns and generate targeted remediation exercises.

**Execution Pattern:** Phase Pipeline with conditional branching

---

## Inputs

- `student_id` (string, required) -- Unique identifier for the student being analyzed
- `problem_set_id` (string, required) -- Identifier for the practice problem set
- `student_responses` (array of objects, required) -- Student's submitted answers with work shown. Each object contains: `problem_id`, `submitted_answer`, `work_shown`, `timestamp`
- `answer_key` (array of objects, required) -- Correct solutions. Each object contains: `problem_id`, `correct_answer`, `solution_steps`, `learning_objective`
- `misconception_database` (array of objects, optional) -- Known misconceptions by domain. Each object contains: `misconception_id`, `description`, `typical_error_patterns`, `domain`, `grade_level`
- `student_grade_level` (string, required) -- Grade level or course level (e.g., "Grade 6", "Algebra 1")
- `remediation_difficulty_baseline` (string, optional) -- Starting difficulty for remediation exercises. Valid values: "Novice" (concrete, heavily scaffolded), "Intermediate" (guided with some independence), "Advanced" (minimal scaffolding). Default: "Intermediate"

---

## Outputs

- `error_analysis` (object) -- Summary of errors found. Contains: `total_problems`, `incorrect_count`, `error_breakdown` (object with counts by type: computational, conceptual, procedural, careless)
- `identified_misconceptions` (array of objects) -- Suspected misconceptions with evidence. Each object contains: `misconception_id`, `description`, `confidence_level` (0-1), `affected_problems` (array of problem IDs), `error_patterns` (array of observed patterns)
- `misconception_clusters` (array of objects) -- Grouped misconceptions by learning objective. Each object contains: `learning_objective`, `misconceptions` (array), `priority_rank` (1-5, where 1 is highest priority)
- `remediation_exercises` (array of objects) -- Generated exercises addressing each misconception. Each object contains: `exercise_id`, `misconception_id`, `learning_objective`, `difficulty_level` (Novice/Intermediate/Advanced), `exercise_content`, `scaffolding_notes`, `success_criteria`
- `remediation_plan` (object) -- Sequenced plan for addressing misconceptions. Contains: `sequence` (array of exercise IDs in recommended order), `estimated_duration_minutes`, `checkpoints` (array of assessment points with problem IDs), `success_metrics` (object with measurable targets)
- `diagnostic_report` (object) -- Structured report with findings and recommendations. Contains: `summary` (string), `error_analysis_section` (string), `misconceptions_section` (string), `remediation_plan_section` (string), `recommendations` (array of strings), `generated_timestamp`

---

## Execution Phases

### Phase 1: Data Collection and Organization

**Entry Criteria:**
- Student ID, problem set ID, and student responses are provided
- Answer key is available and complete
- Student grade level is specified

**Actions:**
1. Validate that all student responses have corresponding answer key entries; flag any mismatches
2. Organize student responses by problem ID for systematic comparison
3. Load misconception database if provided; if not, use domain-standard misconceptions for the grade level
4. Create a working analysis record with metadata (student ID, timestamp, problem count, grade level)
5. Verify that all required fields in responses and answer key are present and non-empty

**Output:**
- Organized response dataset ready for error identification
- Validated answer key
- Active misconception reference database
- Working analysis record with metadata

**Quality Gate:**
- All student responses are matched to answer key entries (mismatches are flagged, not dropped)
- No missing or malformed data in the working record
- Misconception database is loaded and accessible
- Working record contains student_id, timestamp, total_problem_count, and grade_level

---

### Phase 2: Error Identification and Categorization

**Entry Criteria:**
- Organized response dataset is available
- Answer key is validated

**Actions:**
1. Compare each student response to the correct answer
2. For each incorrect response, examine the student's work shown to determine error type:
   - **Computational:** Arithmetic or calculation mistake (correct method, wrong result)
   - **Conceptual:** Misunderstanding of underlying principle or concept
   - **Procedural:** Incorrect application of steps or algorithm
   - **Careless:** Transcription error, misread problem, or attention lapse
3. If work shown is illegible or insufficient, mark error as "uncategorized" and flag for instructor review
4. Record the error type, affected problem ID, and evidence (work shown, incorrect answer)
5. Tally errors by type for summary statistics

**Output:**
- `error_analysis` object with breakdown by error type (computational, conceptual, procedural, careless, uncategorized)
- Detailed error log with categorization for each incorrect problem

**Quality Gate:**
- Every incorrect response is categorized or marked "uncategorized" with a flag
- Error categorization is supported by evidence from student work or explicitly noted as insufficient
- Error counts sum to total incorrect responses
- No guesses are made; unclear errors are flagged, not assumed

---

### Phase 3: Misconception Identification

**Entry Criteria:**
- Error categorization is complete
- Misconception database is active

**Actions:**
1. For each conceptual or procedural error, search the misconception database for matching patterns
2. Match error patterns to known misconceptions; assign confidence level based on pattern match strength:
   - High confidence (0.8-1.0): Error pattern matches known misconception exactly, appears in multiple problems, or is consistent with student's work shown
   - Medium confidence (0.5-0.79): Error pattern is consistent with misconception but other explanations are possible, or appears in 1-2 problems
   - Low confidence (0.3-0.49): Error pattern suggests possible misconception; requires further evidence, or appears once
3. For errors not matching the database, infer likely misconception from error pattern and domain knowledge; mark confidence as "Inferred" (0.2-0.4)
4. Record all identified misconceptions with affected problem IDs, confidence levels, and evidence
5. Flag any misconceptions appearing in 3+ problems (high priority for remediation)

**Output:**
- `identified_misconceptions` array with confidence levels and evidence

**Quality Gate:**
- Every conceptual/procedural error is mapped to at least one misconception
- Confidence levels are justified by pattern match strength (High/Medium/Low/Inferred)
- Misconceptions are specific and actionable (e.g., "Believes multiplying always makes numbers larger" not "Does not understand multiplication")
- Misconceptions with confidence < 0.3 are noted as "Uncertain" and flagged for instructor review

---

### Phase 4: Misconception Clustering and Prioritization

**Entry Criteria:**
- Misconceptions are identified with confidence levels
- Learning objectives are available from answer key

**Actions:**
1. Group identified misconceptions by learning objective (e.g., "fraction addition", "equation solving")
2. Within each group, rank misconceptions using the Priority Ranking Criteria (see Reference section):
   - Frequency: how many problems affected
   - Confidence level: how certain we are
   - Prerequisite importance: does this misconception block other learning?
3. Assign priority rank (1-5, where 1 is highest) to each cluster using the criteria table
4. Create a prioritized list of learning objectives to address, ordered by priority rank
5. Document the ranking rationale for each cluster (e.g., "Rank 1: affects 4 problems, confidence 0.85, blocks fraction operations")

**Output:**
- `misconception_clusters` array organized by learning objective and priority

**Quality Gate:**
- All identified misconceptions appear in exactly one cluster
- Priority ranking is consistent with criteria (higher frequency/confidence = higher priority)
- Clusters are actionable (each cluster has 1-4 misconceptions)
- Each cluster has a documented ranking rationale

---

### Phase 5: Remediation Exercise Generation

**Entry Criteria:**
- Misconception clusters are prioritized
- Student grade level and difficulty baseline are specified

**Actions:**
1. For each misconception, design a targeted remediation exercise that:
   - Directly addresses the misconception
   - Includes scaffolding (worked examples, guided steps, hints)
   - Progresses from concrete to abstract (if applicable)
   - Uses familiar contexts from the original problem set
2. Determine difficulty level using the Difficulty Level Mapping (see Reference section):
   - **Novice:** Concrete examples, step-by-step guidance, heavy scaffolding. For severe misconceptions or younger students.
   - **Intermediate:** Guided discovery, some independence, moderate scaffolding. For typical remediation.
   - **Advanced:** Minimal scaffolding, open-ended exploration, transfer tasks. For students ready to apply independently.
   - Adjust baseline based on misconception severity: severe misconceptions start at Novice; mild misconceptions may start at Intermediate or Advanced.
3. Write exercise content with clear instructions and success criteria
4. Include scaffolding notes for instructor (what support to provide, when to reduce support)
5. Define success criteria (measurable and specific, e.g., "student solves 3 of 4 similar problems correctly" not "student understands")
6. If a misconception cannot be addressed with a generated exercise, document it and recommend instructor-designed remediation

**Output:**
- `remediation_exercises` array with full exercise details

**Quality Gate:**
- Each exercise targets exactly one misconception
- Difficulty level is mapped to a specific scaffolding approach (Novice/Intermediate/Advanced)
- Success criteria are measurable and specific (not vague)
- Scaffolding notes are actionable for an instructor (e.g., "Show worked example first, then have student solve with hints, then independent")
- All misconceptions have either a generated exercise or a documented recommendation

---

### Phase 6: Remediation Plan Sequencing

**Entry Criteria:**
- Remediation exercises are generated
- Misconception clusters are prioritized

**Actions:**
1. Sequence exercises based on:
   - Priority rank (address Rank 1 misconceptions before Rank 2, etc.)
   - Prerequisites (if misconception A must be resolved before B, sequence accordingly)
   - Cognitive load: alternate between different domains/topics if multiple misconceptions exist; do not sequence 3+ exercises from the same domain consecutively
2. Identify checkpoint assessments: place a checkpoint after every 2-3 exercises to assess understanding before proceeding
3. Estimate time required for each exercise (based on difficulty level and scaffolding) and total remediation duration
4. Define success metrics with measurable targets (e.g., "student demonstrates mastery on 80% of checkpoint items" not "student shows improvement")
5. Create the final remediation plan with sequence, checkpoints, and metrics
6. If total estimated duration exceeds 120 minutes, prioritize top 3-5 misconceptions and recommend phased remediation over multiple sessions

**Output:**
- `remediation_plan` object with sequenced exercises, checkpoints, and success metrics

**Quality Gate:**
- Sequence respects priority and prerequisite constraints
- Checkpoints are spaced appropriately (after every 2-3 exercises)
- Estimated duration is realistic for the student's grade level (e.g., 15-20 min per exercise for elementary, 20-30 min for secondary)
- Success metrics are measurable and aligned with learning objectives (e.g., "80% accuracy on checkpoint items")
- If duration exceeds 120 minutes, top 3-5 misconceptions are identified and phased approach is documented

---

### Phase 7: Remediation Completion and Validation

**Entry Criteria:**
- Remediation plan is finalized and communicated to student/instructor
- Student has completed remediation exercises

**Actions:**
1. Collect student responses to remediation exercises (submitted answers and work shown)
2. Score remediation exercises against success criteria
3. For each misconception, determine if success criteria were met:
   - **Resolved:** Student met success criteria on 80%+ of exercises for this misconception
   - **Partially Resolved:** Student met success criteria on 50-79% of exercises
   - **Not Resolved:** Student met success criteria on <50% of exercises
4. For misconceptions not resolved, recommend:
   - Additional practice with increased scaffolding, or
   - Diagnostic interview to identify root cause, or
   - Referral for specialized support
5. Document resolution status for each misconception

**Output:**
- `remediation_validation` object with resolution status for each misconception
- `remediation_follow_up_recommendations` (array of strings) for misconceptions not resolved

**Quality Gate:**
- All remediation exercises have been scored
- Resolution status is determined for each misconception using the 80%/50%/0% thresholds
- Follow-up recommendations are specific and actionable (not vague)

---

### Phase 8: Diagnostic Report Generation

**Entry Criteria:**
- All analysis phases are complete
- Remediation plan is finalized
- Remediation validation is complete (if applicable)

**Actions:**
1. Compile error analysis summary (total problems, error breakdown by type, percentage incorrect)
2. Summarize identified misconceptions with confidence levels, affected problems, and priority ranks
3. Present misconception clusters organized by priority
4. Describe the remediation plan in narrative form with rationale and sequencing logic
5. If remediation validation is available, include resolution status for each misconception
6. Include specific recommendations for instruction (what to emphasize, common pitfalls to watch for, when to provide additional support)
7. Format as a structured report with sections: summary, error analysis, misconceptions, remediation plan, recommendations
8. Ensure report is clear and accessible to non-technical readers (parents, students, teachers)

**Output:**
- `diagnostic_report` (object) with sections: summary, error_analysis_section, misconceptions_section, remediation_plan_section, recommendations (array), generated_timestamp

**Quality Gate:**
- Report is clear and accessible to non-technical readers
- All major findings are included (error breakdown, misconceptions, remediation plan)
- Recommendations are specific and actionable (e.g., "Emphasize that the equals sign means both sides are equal, not 'the answer is coming'" not "Teach equations better")
- Report sections are complete and logically organized
- Timestamp is included for audit trail

---

## Exit Criteria

The skill is complete when:
1. All student responses have been analyzed and categorized by error type (or marked uncategorized with flags)
2. All misconceptions have been identified with confidence levels and evidence
3. Misconceptions are clustered by learning objective and prioritized using the Priority Ranking Criteria
4. Remediation exercises are generated for each misconception with scaffolding notes and measurable success criteria
5. A sequenced remediation plan is created with checkpoints, estimated duration, and success metrics
6. A comprehensive diagnostic report is generated with sections for summary, error analysis, misconceptions, remediation plan, and recommendations
7. (Optional) Remediation exercises have been completed by the student and validation status is documented

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Student responses do not match answer key (missing or extra problems) | **Adjust** -- Flag mismatches and document which problems are unmatched; proceed with available matched pairs; note limitation in report |
| Phase 1 | Misconception database is unavailable or incomplete | **Adjust** -- Use domain-standard misconceptions for the grade level and subject; note limitation in report; flag for database update |
| Phase 2 | Student work shown is illegible or insufficient to categorize error | **Adjust** -- Mark error as "uncategorized" and flag for instructor review; do not guess; proceed with categorized errors |
| Phase 3 | Error pattern does not match any known misconception | **Adjust** -- Infer likely misconception from error pattern; mark confidence as "Inferred" (0.2-0.4) and note as inferred in output |
| Phase 3 | Multiple misconceptions could explain the same error | **Adjust** -- List all plausible misconceptions and assign confidence levels; prioritize most likely; note ambiguity in report |
| Phase 5 | Cannot generate appropriate remediation exercise for a misconception | **Adjust** -- Document the misconception and recommend instructor-designed remediation; note in report; do not skip the misconception |
| Phase 6 | Remediation plan exceeds 120 minutes estimated duration | **Adjust** -- Prioritize top 3-5 misconceptions by rank; recommend phased remediation over multiple sessions; document in plan |
| Phase 7 | Student does not complete remediation exercises | **Adjust** -- Document completion status; note which exercises were not completed; recommend follow-up session; do not mark as "Not Resolved" without evidence |
| Phase 7 | User rejects final output | **Targeted revision** -- ask which misconception diagnosis, severity rating, or remediation plan fell short and rerun only that section. Do not re-diagnose the full concept map. |

---

## Reference Section

### Error Type Definitions

- **Computational Error:** Student used correct method/formula but made an arithmetic mistake. Example: Correctly set up a fraction addition problem but added numerators and denominators separately.
- **Conceptual Error:** Student misunderstands a core principle or concept. Example: Believes that multiplying always makes a number larger (fails with fractions < 1).
- **Procedural Error:** Student knows the concept but applies steps incorrectly or in wrong order. Example: Solves equations by adding to both sides instead of subtracting.
- **Careless Error:** Student made a transcription, misread, or attention lapse. Example: Copied a number wrong from the problem statement.

### Misconception Confidence Levels

- **High (0.8-1.0):** Error pattern matches known misconception exactly; appears in multiple problems; consistent with student's work shown.
- **Medium (0.5-0.79):** Error pattern is consistent with misconception but other explanations are possible; appears in 1-2 problems.
- **Low (0.3-0.49):** Error pattern suggests misconception but is not definitive; could be careless error or other cause; appears once.
- **Inferred (0.2-0.4):** Error pattern does not match database; misconception inferred from error pattern and domain knowledge; requires further evidence.

### Remediation Exercise Design Principles

1. **Specificity:** Each exercise targets one misconception, not multiple.
2. **Scaffolding:** Provide worked examples, guided steps, or hints; gradually reduce support as student demonstrates understanding.
3. **Concreteness:** Use concrete examples and familiar contexts before abstract generalizations.
4. **Variation:** Include multiple problem types to ensure transfer (not just repetition of one format).
5. **Feedback:** Include answer keys and explanations so student can self-check.

### Priority Ranking Criteria

| Rank | Frequency | Confidence | Prerequisite | Example |
|------|-----------|------------|--------------|----------|
| 1 (Highest) | 3+ problems | ≥ 0.7 | Blocks other learning | Affects 4 problems, confidence 0.85, blocks fraction operations |
| 2 | 2-3 problems | ≥ 0.6 | Important but not blocking | Affects 3 problems, confidence 0.75, foundational |
| 3 | 1-2 problems | ≥ 0.5 | Useful but not critical | Affects 2 problems, confidence 0.65, supports learning |
| 4 | 1 problem | 0.3-0.5 | Minor impact | Affects 1 problem, confidence 0.45, isolated error |
| 5 (Lowest) | 1 problem | < 0.3 | Uncertain | Low-confidence inferred misconception; monitor but may not require immediate remediation |

### Difficulty Level Mapping

| Level | Scaffolding | Guidance | Independence | Use Case |
|-------|-------------|----------|--------------|----------|
| **Novice** | Heavy (worked examples, step-by-step, hints) | Explicit instructions, teacher-led | Minimal | Severe misconceptions, younger students, foundational concepts |
| **Intermediate** | Moderate (guided discovery, some hints) | Structured prompts, guided practice | Some independence | Typical remediation, most students |
| **Advanced** | Light (minimal scaffolding) | Open-ended prompts, exploration | High independence | Mild misconceptions, advanced students, transfer tasks |

### Common Misconceptions by Domain

**Fractions:**
- Larger denominator = larger fraction (e.g., 1/5 > 1/3)
- Cannot compare fractions with different denominators
- Multiplication always makes numbers larger
- Adding fractions: add numerators and denominators separately

**Equations:**
- Equals sign means "the answer is coming" not "both sides are equal"
- Cannot perform same operation on both sides
- Negative numbers don't follow same rules as positive
- Variables represent a label, not an unknown quantity

**Geometry:**
- Area and perimeter are the same thing
- Larger perimeter = larger area (or vice versa)
- Angles in a triangle don't always sum to 180°
- Congruent shapes must be identical in appearance (not just size/shape)

---

## State Persistence

If this skill is run multiple times on the same student:
- **Store previous diagnoses:** Maintain a history of misconception diagnoses by date and problem set
- **Track remediation:** Record which misconceptions have been remediated and their resolution status
- **Monitor re-emergence:** Flag if a previously resolved misconception appears again in later problem sets
- **Adjust difficulty:** Use student's response to previous remediation exercises to inform difficulty level for new exercises
- **Build student profile:** Identify persistent vs. transient misconceptions; persistent misconceptions may require different intervention strategies
- **Data structure:** Store as `student_misconception_history` (array of objects with: date, problem_set_id, misconception_id, resolution_status, remediation_exercises_completed)
