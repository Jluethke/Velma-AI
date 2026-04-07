# Skill Acquisition Engine

Systematically decomposes any learnable skill into prerequisite-ordered sub-skills, assesses current proficiency, generates a progressive curriculum with exercises at each difficulty level, provides guided practice with feedback loops, and evaluates mastery with targeted gap remediation.

## Execution Pattern: Phase Pipeline

## Inputs
- target_skill: string -- The skill to learn (e.g., "Python programming," "public speaking," "financial modeling")
- current_level: string -- Self-assessed starting point: "none," "beginner," "intermediate," "advanced"
- target_proficiency: string -- Desired end state: "functional" (can do it), "competent" (can do it well), "expert" (can teach it and handle edge cases)
- available_hours_per_week: number -- Realistic weekly time commitment for learning and practice
- learning_preferences: object -- Preferred learning modes (reading, video, hands-on, social), constraints (no paid courses, offline only, etc.)

## Outputs
- skill_assessment: object -- Diagnostic evaluation of current sub-skill proficiency levels
- learning_roadmap: object -- Ordered sequence of sub-skills with time estimates and dependency graph
- curriculum: array -- Learning resources and exercises per sub-skill, organized by difficulty tier
- practice_exercises: array -- Concrete exercises with expected outputs, hints, and self-evaluation rubrics
- proficiency_evaluation: object -- Mastery test per sub-skill with pass criteria and gap identification

## Execution

### Phase 1: ASSESS -- Diagnostic Proficiency Evaluation
**Entry criteria:** Target skill and self-assessed level provided.
**Actions:**
1. Decompose the target skill into 5-15 fundamental sub-skills. Use domain-standard taxonomies where they exist (e.g., programming: syntax, data structures, algorithms, debugging, architecture, testing).
2. For each sub-skill, generate 2-3 diagnostic questions or challenges:
   - **Recognition level:** "Can you identify what [concept] means when you see it?"
   - **Application level:** "Can you use [concept] to solve a simple problem?"
   - **Transfer level:** "Can you apply [concept] in a novel situation without guidance?"
3. Map the user's responses (or self-assessment) to the Dreyfus model:
   - **Novice:** Follows rules, needs step-by-step instructions, no context awareness.
   - **Advanced Beginner:** Recognizes patterns, can handle simple cases, struggles with complexity.
   - **Competent:** Plans and prioritizes, handles standard situations, needs guidance for edge cases.
   - **Proficient:** Sees the big picture, adapts approaches, recognizes when rules don't apply.
   - **Expert:** Intuitive understanding, innovates, teaches others.
4. Identify the gap between current level and target proficiency for each sub-skill.

**Output:** Proficiency matrix: sub-skill x current level x target level x gap size.
**Quality gate:** All sub-skills have an assessed level. Gap sizes are ranked. The biggest gaps are identified as priority learning areas.

### Phase 2: ROADMAP -- Prerequisite-Ordered Learning Sequence
**Entry criteria:** Proficiency matrix with gap analysis exists.
**Actions:**
1. Build a dependency graph of sub-skills. Identify prerequisites: which sub-skills must be learned before others? (E.g., "variables and types" before "functions," "functions" before "object-oriented programming.")
2. Topologically sort the sub-skills: learning order that respects all prerequisites.
3. Estimate time to bridge each gap based on:
   - Gap size (novice->competent takes longer than competent->proficient)
   - Sub-skill complexity (algorithms take longer than syntax)
   - Available hours per week
   - Research-based learning rates: ~20 focused hours to reach basic competence in a sub-skill (Josh Kaufman), ~1000 hours for deep expertise in a domain (not 10,000 -- that's for world-class performance).
4. Create milestones: group sub-skills into learning phases (each phase: 1-4 weeks depending on complexity).
5. Identify "high-leverage sub-skills" -- sub-skills that unlock multiple downstream skills. Prioritize these.

**Output:** Ordered learning roadmap with phases, time estimates, milestones, and dependency graph.
**Quality gate:** No sub-skill is scheduled before its prerequisites. Total estimated time is feasible given available hours. At least one milestone every 2 weeks to maintain motivation.

### Phase 3: CURRICULUM -- Resources and Progressive Exercises
**Entry criteria:** Ordered roadmap exists.
**Actions:**
1. For each sub-skill, generate a learning sequence across three tiers:
   - **Tier 1 (Understand):** Concepts, mental models, worked examples. Focus: "What is this and why does it matter?"
   - **Tier 2 (Apply):** Guided exercises with scaffolding. Focus: "Can I do this with support?"
   - **Tier 3 (Master):** Open-ended challenges, no scaffolding, real-world complexity. Focus: "Can I do this independently in novel situations?"
2. For each tier, provide:
   - Key concepts to internalize (not just read, but be able to explain from memory)
   - 3-5 exercises with progressive difficulty
   - Self-evaluation criteria ("You've passed this tier when you can ___ without looking anything up")
3. Apply the interleaving principle: after every 3 sub-skills, include a "synthesis exercise" that requires combining them.
4. Apply spaced repetition: schedule review exercises for previously learned sub-skills at increasing intervals (1 day, 3 days, 7 days, 14 days, 30 days).

**Output:** Complete curriculum: learning resources, exercises per tier per sub-skill, synthesis exercises, spaced repetition schedule.
**Quality gate:** Every sub-skill has exercises at all three tiers. Each exercise has clear expected output and self-evaluation criteria. Synthesis exercises exist every 3 sub-skills.

### Phase 4: PRACTICE -- Guided Deliberate Practice
**Entry criteria:** Curriculum generated for current learning phase.
**Actions:**
1. Present exercises from the current sub-skill and tier. Start at the tier matching the user's assessed level (don't make an intermediate learner do beginner exercises for sub-skills they've passed).
2. For each exercise:
   - State the challenge clearly with all necessary context.
   - Provide hints (available on request, not shown by default).
   - Define the expected output or success criteria.
   - After the user attempts it: provide specific feedback on what was correct, what was wrong, and why.
3. Apply deliberate practice principles:
   - Focus on the hardest part, not the comfortable parts. If a sub-skill has 5 components and the user struggles with one, drill that one.
   - Immediate feedback: correct errors at the point of practice, not after.
   - Repetition with variation: same concept, different contexts.
   - Just outside comfort zone: if success rate is >80%, increase difficulty. If <50%, decrease difficulty.
4. Track exercise completion and success rate per sub-skill.

**Output:** Completed exercises with feedback, success rates per sub-skill, adjusted difficulty recommendations.
**Quality gate:** User has attempted all exercises in the current tier. Success rate is recorded. If success rate >80%, advance to next tier. If <50%, remediation exercises generated.

### Phase 5: EVALUATE -- Mastery Test and Gap Remediation
**Entry criteria:** Current learning phase exercises completed.
**Actions:**
1. Generate a mastery test for the completed sub-skills:
   - 2-3 application-level questions (use the concept correctly)
   - 1-2 transfer-level questions (apply in unfamiliar context)
   - 1 synthesis question (combine multiple sub-skills)
2. Evaluate performance against mastery criteria:
   - **Pass (>80%):** Sub-skill mastered at current target level. Mark complete, schedule spaced review.
   - **Partial (50-80%):** Specific gaps identified. Generate targeted remediation exercises for weak areas only.
   - **Fail (<50%):** Sub-skill not yet learned. Return to Tier 2 exercises with additional scaffolding.
3. Update the proficiency matrix with new assessment data.
4. If all sub-skills in the current phase are passed: advance to next roadmap phase.
5. If the entire roadmap is complete: final comprehensive evaluation across all sub-skills.

**Output:** Mastery evaluation with scores, gap analysis, remediation plan or advancement recommendation.
**Quality gate:** Every completed sub-skill has a mastery score. Gaps are specific (not "needs improvement" but "struggles with [specific concept] in [specific context]"). Remediation exercises target the exact gap.

## Exit Criteria
The skill is complete when: (1) all sub-skills in the roadmap are assessed at or above target proficiency level, OR (2) the user has completed all phases and received a final comprehensive evaluation with remaining gap analysis for self-directed continuation.

## Error Handling
| Phase | Failure Mode | Response |
|---|---|---|
| ASSESS | Target skill too broad (e.g., "learn programming") | Adjust -- ask user to narrow scope or decompose into specific skills (e.g., "Python web development") |
| ASSESS | User can't self-assess level | Adjust -- provide diagnostic exercises instead of relying on self-report |
| ROADMAP | Circular dependencies in sub-skills | Retry -- re-decompose sub-skills to break the cycle |
| CURRICULUM | Cannot generate exercises for a domain (too abstract) | Adjust -- provide project-based learning instead of isolated exercises |
| PRACTICE | User success rate stuck at 50-60% for 3+ attempts | Escalate -- suggest external resources (tutor, course, peer learning) for this specific sub-skill |
| EVALUATE | User passes mastery test but can't apply in real projects | Adjust -- add real-world project phase between mastery test and completion |

## Reference

### Dreyfus Model of Skill Acquisition
Five stages from novice to expert. Key insight: expertise is not just "more knowledge" -- it's a qualitative shift in how information is processed. Novices follow rules; experts see patterns.

| Stage | Characteristics | Teaching Approach |
|---|---|---|
| Novice | Follows rules rigidly, no context | Clear rules, step-by-step instructions |
| Advanced Beginner | Recognizes patterns, limited context | Guided examples with some variation |
| Competent | Plans, prioritizes, handles standard cases | Problem-based learning, case studies |
| Proficient | Sees big picture, adapts | Mentorship, complex real-world problems |
| Expert | Intuitive, innovates | Peer exchange, teaching, research |

### Deliberate Practice (K. Anders Ericsson)
- Not just "practice more" but practice with specific structure:
  1. Well-defined goals for each session
  2. Full concentration (not background practice)
  3. Immediate feedback on performance
  4. Repetition with progressive difficulty
  5. Focus on weaknesses, not strengths
- 4 hours/day is the upper limit of productive deliberate practice for most people.

### The 80/20 of Skill Acquisition
- 20% of sub-skills produce 80% of practical value. Identify these first.
- The first 20 hours of focused practice produce massive improvement (novice to functional).
- The last 20% of mastery takes 80% of the total time. Only pursue if target proficiency requires it.

### Interleaving vs. Blocking
- **Blocking:** Practice one thing until mastered, then move on. Feels productive. Less effective for long-term retention.
- **Interleaving:** Mix practice across sub-skills. Feels harder. Produces better retention and transfer.
- Optimal mix: 70% focused practice on current sub-skill, 30% interleaved review of previous sub-skills.

### Spaced Repetition Intervals
Optimal review schedule for long-term retention (Ebbinghaus + modern research):
- 1st review: 1 day after learning
- 2nd review: 3 days after 1st review
- 3rd review: 7 days after 2nd review
- 4th review: 14 days after 3rd review
- 5th review: 30 days after 4th review
- After 5 successful reviews: the knowledge is in long-term memory.

### Plateau Breaking Strategies
1. **Isolate the bottleneck:** Which specific sub-skill is stalling progress?
2. **Increase difficulty temporarily:** Perform at a harder level, then return to current level (overshoot training).
3. **Change modality:** If learning by reading, switch to teaching. If practicing alone, practice with others.
4. **Deconstruct:** Break the stalled sub-skill into even smaller components.
5. **Rest:** Sometimes plateaus are fatigue. A 3-5 day break can produce surprising improvement (consolidation).

### State Persistence
The skill tracks:
- Proficiency matrix evolution over time
- Exercise completion rates per sub-skill per tier
- Time spent per sub-skill (actual vs. estimated)
- Plateau detection (same score on 3+ consecutive attempts)
- Spaced repetition schedule and review compliance
