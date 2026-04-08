# Curriculum Designer

**One-line description:** Transform any topic into a structured, multi-level learning curriculum with prerequisites, sequenced modules, curated resources, hands-on exercises, and assessment criteria.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `topic`: string (required) -- The subject or skill to design a curriculum for (e.g., "Machine Learning", "Project Management", "Watercolor Painting")
- `target_audience`: string (optional) -- Who will follow this curriculum (e.g., "software engineers", "business analysts", "hobbyists"). Default: "general adult learners"
- `domain_context`: string (optional) -- Industry, field, or specialization context (e.g., "finance", "healthcare", "creative arts"). Default: inferred from topic
- `time_constraints`: string (optional) -- Total time available for curriculum completion (e.g., "12 weeks", "6 months"). Default: "flexible"
- `resource_preferences`: string[] (optional) -- Preferred resource types (e.g., ["video", "books", "hands-on labs", "interactive"]). Default: ["mixed"]

---

## Outputs

- `curriculum_overview`: object -- High-level summary
  - `topic`: string
  - `target_audience`: string
  - `overview`: string -- What learners will achieve
  - `total_estimated_duration`: string
  - `progression_notes`: string

- `prerequisites`: object[] -- Required prior knowledge
  - `name`: string
  - `description`: string
  - `rationale`: string
  - `self_assessment_questions`: string[]
  - `remediation_resources`: string[]

- `skill_levels`: object[] -- Four-level progression framework
  - `level`: string ("Beginner", "Intermediate", "Advanced", "Expert")
  - `description`: string
  - `learning_objectives`: string[]
  - `estimated_duration`: string

- `learning_path`: object[] -- Sequenced modules
  - `module_number`: number
  - `module_name`: string
  - `level`: string
  - `concepts`: string[]
  - `duration`: string
  - `prerequisites_within_path`: string[]
  - `learning_objectives`: string[]
  - `real_world_applications`: string[]

- `resources`: object[] -- Curated learning materials
  - `module_number`: number
  - `resource_type`: string ("book", "course", "tutorial", "documentation", "tool", "community")
  - `title`: string
  - `url_or_reference`: string
  - `level`: string
  - `time_estimate`: string
  - `description`: string
  - `learner_personas`: string[]

- `practice_exercises`: object[] -- Hands-on activities
  - `module_number`: number
  - `exercise_name`: string
  - `level`: string
  - `description`: string
  - `success_criteria`: string[]
  - `estimated_time`: string
  - `resources_needed`: string[]
  - `learner_personas`: string[]
  - `common_misconceptions`: string[]
  - `troubleshooting_guide`: string

- `assessment_criteria`: object -- Evaluation framework
  - `beginner_criteria`: object
    - `knowledge_checks`: string[]
    - `practical_tasks`: string[]
    - `passing_threshold`: string
  - `intermediate_criteria`: object
    - `knowledge_checks`: string[]
    - `practical_tasks`: string[]
    - `passing_threshold`: string
  - `advanced_criteria`: object
    - `knowledge_checks`: string[]
    - `practical_tasks`: string[]
    - `passing_threshold`: string
  - `expert_criteria`: object
    - `knowledge_checks`: string[]
    - `practical_tasks`: string[]
    - `passing_threshold`: string
  - `capstone_project`: object
    - `description`: string
    - `requirements`: string[]
    - `evaluation_rubric`: string[]

---

## Execution Phases

### Phase 1: Topic Analysis & Decomposition

**Entry Criteria:**
- Topic is provided and is non-empty
- Topic is sufficiently specific to decompose (not "everything" or "life")

**Actions:**
1. Parse the topic and identify its primary domain (technical, creative, professional, academic, etc.)
2. Decompose the topic into 5-12 core concepts or skill areas
3. Map relationships between concepts (dependencies, overlaps, prerequisites)
4. Document any ambiguities or scope decisions made
5. Validate that the topic is learnable within reasonable timeframes (flag if topic is too broad)

**Output:**
- Core concepts list with definitions
- Concept dependency map
- Scope notes and assumptions

**Quality Gate:**
- Each core concept has a unique definition (verified by non-overlapping concept map) and is teachable in <4 hours (verified by pilot teaching or expert review)
- Relationships between concepts are explicit and documented
- Scope is bounded (not infinite); topic is decomposable into 5-12 distinct concepts

---

### Phase 1.5: Learner Persona Mapping

**Entry Criteria:**
- Core concepts are defined
- Target audience is known

**Actions:**
1. Identify 3-5 learner personas within the target audience (e.g., visual learner, kinesthetic learner, self-directed, group-based, auditory)
2. For each persona, document preferred learning modalities (video, hands-on, reading, discussion)
3. For each persona, identify potential barriers or challenges
4. Map each persona to appropriate resource types and exercise formats
5. Document how curriculum will be differentiated for each persona

**Output:**
- Learner personas with learning preferences
- Persona-to-resource mapping
- Persona-to-exercise mapping
- Differentiation strategy

**Quality Gate:**
- Each persona is distinct and represents a meaningful segment of target audience
- Each persona has documented learning preferences and barriers
- Curriculum includes resources and exercises for each persona

---

### Phase 2: Prerequisites & Foundation Mapping

**Entry Criteria:**
- Core concepts are defined
- Target audience is known

**Actions:**
1. For each core concept, identify what prior knowledge is required
2. Consolidate prerequisites into a minimal set (avoid redundancy)
3. Order prerequisites by logical dependency
4. Classify each prerequisite as: foundational (must have), helpful (nice to have), or assumed (learner should verify)
5. Document how learners can self-assess prerequisite readiness

**Output:**
- Ordered list of prerequisites with rationale
- Self-assessment checklist for learners
- Remediation suggestions for gaps

**Quality Gate:**
- Each prerequisite is named with specific skill (e.g., "linear algebra" not "math skills") and has measurable success criteria
- No circular dependencies exist
- Learners can realistically acquire prerequisites before starting

---

### Phase 2.5: Prerequisite Self-Assessment & Remediation

**Entry Criteria:**
- Prerequisites are defined

**Actions:**
1. Create a self-assessment tool (quiz or checklist) for each prerequisite
2. Identify 3-5 common prerequisite gaps based on target audience
3. For each common gap, curate 2-3 remediation resources (tutorials, courses, practice exercises)
4. Document how learners should use remediation resources (time estimate, success criteria)
5. Create a decision tree: if learner fails self-assessment, which remediation path to take

**Output:**
- Self-assessment tool (quiz or checklist format)
- Common gaps analysis
- Remediation resource map
- Decision tree for gap remediation

**Quality Gate:**
- Self-assessment tool is objective and takes <15 minutes to complete
- Each common gap has at least 2 remediation resources
- Remediation resources are accessible and free or low-cost

---

### Phase 3: Skill Level Framework & Learning Objectives

**Entry Criteria:**
- Core concepts and prerequisites are defined
- Target audience is known

**Actions:**
1. Define Beginner level: what does "I can do basic X" mean? (e.g., "I can write a simple Python script")
2. Define Intermediate level: what does "I can do X competently" mean? (e.g., "I can build a multi-module Python application")
3. Define Advanced level: what does "I can do X expertly" mean? (e.g., "I can architect scalable Python systems")
4. Define Expert level: what does "I can teach/lead X" mean? (e.g., "I can mentor others and design Python frameworks")
5. For each level, write 3-5 specific, measurable learning objectives in SMART format (Specific, Measurable, Achievable, Relevant, Time-bound)
6. Estimate realistic duration for each level (accounting for practice and consolidation)

**Output:**
- Four-level skill framework with descriptions
- Learning objectives per level (SMART format)
- Estimated duration per level

**Quality Gate:**
- Each level has distinct learning objectives; no objective appears in multiple levels
- Learning objectives are written in SMART format and are observable and measurable
- Durations are realistic and justified based on complexity and practice time

---

### Phase 4: Learning Path & Module Sequencing

**Entry Criteria:**
- Skill levels and learning objectives are defined
- Core concepts are mapped

**Actions:**
1. Sequence core concepts into 6-12 learning modules, ordered by dependency
2. Assign each module to a skill level (Beginner, Intermediate, Advanced, Expert)
3. For each module, list the concepts it covers and the learning objectives it addresses
4. Identify which modules can be learned in parallel vs. which must be sequential
5. Estimate duration for each module (including study, practice, and consolidation)
6. For each module, identify 2-3 real-world applications or use cases
7. Create a visual or textual learning path diagram

**Output:**
- Ordered module sequence with dependencies
- Module-to-level mapping
- Learning path diagram or table
- Real-world applications per module
- Total estimated duration

**Quality Gate:**
- Dependencies are explicit (no "magic" prerequisites)
- Each module covers 1-3 core concepts and is completable in 4-8 hours
- Path is learnable within stated time constraints
- Each module has at least 2 documented real-world applications

---

### Phase 5: Resource Curation

**Entry Criteria:**
- Learning path is defined
- Learner personas are mapped
- Resource preferences are known

**Actions:**
1. For each module, identify 3-5 high-quality resources (books, courses, tutorials, documentation, tools, communities)
2. Categorize resources by type and level
3. Provide URLs, references, and brief descriptions
4. For each resource, identify which learner personas it serves best
5. Verify that resources are current (published/updated in last 3 years), from recognized sources, and have positive reviews (4+ stars)
6. Ensure resource coverage across all learner personas

**Output:**
- Resource list organized by module and level
- Persona-to-resource mapping
- Resource quality verification notes

**Quality Gate:**
- Each resource is current (published/updated in last 3 years), from recognized source, and has positive reviews (4+ stars)
- Each module has resources for all learner personas
- Resources are accessible and affordable to target audience

---

### Phase 6: Exercise Design

**Entry Criteria:**
- Learning path is defined
- Learner personas are mapped

**Actions:**
1. For each module, design 2-3 hands-on practice exercises that reinforce learning objectives
2. For each exercise, identify which learner personas it serves best
3. Write success criteria for each exercise (how learners know they've succeeded)
4. Estimate time for each exercise
5. List tools, datasets, or environments needed for exercises
6. For each exercise, document 2-3 common misconceptions learners may have
7. For each exercise, create a troubleshooting guide for common errors

**Output:**
- Practice exercise bank with success criteria
- Persona-to-exercise mapping
- Tools and environment setup guide
- Common misconceptions and troubleshooting guides

**Quality Gate:**
- Exercises are practical and directly tied to learning objectives
- Success criteria are objective and testable
- Each exercise has documented common misconceptions and troubleshooting guide
- Exercises cover all learner personas

---

### Phase 7: Assessment & Validation

**Entry Criteria:**
- Learning path, resources, and exercises are complete

**Actions:**
1. For each skill level, define assessment criteria (what evidence shows mastery?)
2. Design knowledge checks (quizzes, conceptual questions) for each level
3. Design practical assessments (projects, demonstrations, peer review) for each level
4. Define passing thresholds (e.g., "70%+ on knowledge check + successful completion of 80%+ of exercises")
5. Create a progression guide: how learners move from one level to the next
6. Validate that assessments align with learning objectives

**Output:**
- Assessment rubric for each level
- Knowledge check templates
- Practical assessment descriptions
- Progression criteria

**Quality Gate:**
- Assessments are aligned with learning objectives
- Passing threshold is 70%+ on knowledge checks + successful completion of 80%+ of exercises
- Progression criteria are clear and measurable

---

### Phase 7.5: Capstone Project Design

**Entry Criteria:**
- All assessment criteria are defined

**Actions:**
1. Design a capstone project that integrates learning across all modules and levels
2. Define capstone requirements that demonstrate mastery of core concepts
3. Create an evaluation rubric for the capstone project
4. Estimate time to complete capstone (typically 20-40 hours)
5. Provide capstone project examples or templates
6. Document how capstone project can be used as portfolio piece

**Output:**
- Capstone project description
- Capstone requirements
- Evaluation rubric
- Project examples or templates
- Portfolio guidance

**Quality Gate:**
- Capstone project integrates at least 5+ core concepts
- Capstone requirements are clear and measurable
- Evaluation rubric is objective and aligned with Expert-level learning objectives

---

### Phase 8: Curriculum Synthesis & Documentation

**Entry Criteria:**
- All previous phases are complete

**Actions:**
1. Integrate all outputs into a cohesive curriculum document
2. Cross-reference modules, resources, exercises, and assessments
3. Add an overview section summarizing the entire curriculum
4. Add a learner guide with tips for success, time management, and troubleshooting
5. Add an instructor/facilitator guide (if applicable)
6. Validate that every learning objective is addressed by at least one resource and one exercise
7. Validate that every module is assessed
8. Format for publication or distribution

**Output:**
- Complete curriculum structure with all sections integrated
- Learner guide
- Instructor guide (optional)
- Cross-reference matrix (module → resources → exercises → assessments)

**Quality Gate:**
- All sections are present and complete
- Cross-references are accurate and verified
- Document is clear and usable by target audience
- No learning objectives are orphaned (each has at least one resource and one exercise)

---

### Phase 9: Curriculum Review & Iteration

**Entry Criteria:**
- Curriculum has been published or piloted with learners

**Actions:**
1. Collect feedback from early learners (surveys, interviews, completion data)
2. Analyze feedback for common pain points, resource gaps, and exercise difficulty
3. Identify modules with high dropout rates or low assessment scores
4. Update resources, exercises, and timelines based on learner data
5. Verify that field developments or new tools are reflected in curriculum
6. Document all updates and version the curriculum
7. Schedule regular review cycles (e.g., quarterly or annually)

**Output:**
- Feedback summary and analysis
- Update recommendations
- Updated curriculum version
- Review schedule and process

**Quality Gate:**
- Feedback has been collected from at least 3 learners
- Updates are documented with rationale
- Curriculum version is incremented
- Review process is documented for future iterations

---

## Exit Criteria

The curriculum is DONE when:
- All four skill levels are defined with SMART learning objectives
- A complete learning path with 6-12 sequenced modules exists
- Each module has at least 3 curated resources (current, reputable, reviewed) and 2-3 practice exercises
- Assessment criteria and passing thresholds (70%+ knowledge + 80%+ exercises) are defined for each level
- A capstone project integrating 5+ core concepts is designed
- Learner personas are mapped to resources and exercises
- Prerequisite self-assessment tool and remediation resources are provided
- Common misconceptions and troubleshooting guides are documented for each exercise
- A learner unfamiliar with the topic could follow the curriculum and achieve the stated learning objectives
- Total estimated duration is realistic and validated against learner feedback or pilot data
- All cross-references are accurate and complete
- Curriculum has been tested with at least 3 learners from target audience

---

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| Phase 1 | Topic is too broad (e.g., "Science", "Technology") | **Adjust** -- Ask for scope narrowing (e.g., "Machine Learning for Computer Vision") or split into multiple curricula |
| Phase 1 | Topic is too narrow or niche (fewer than 3 core concepts) | **Adjust** -- Suggest combining with related topics or treating as a single module within a broader curriculum |
| Phase 1.5 | Cannot identify distinct learner personas | **Adjust** -- Use generic personas (visual, kinesthetic, auditory, reading/writing) and tailor resources accordingly |
| Phase 2 | Prerequisites form a circular dependency | **Adjust** -- Identify bootstrap concepts that can be learned in parallel; add an "orientation" phase |
| Phase 2.5 | Insufficient remediation resources available | **Adjust** -- Recommend community resources, create original content, or note as a gap for learners |
| Phase 3 | Cannot differentiate skill levels meaningfully | **Adjust** -- Topic may be too simple; consider a 2-3 level framework instead of 4 |
| Phase 4 | Learning path exceeds 12 modules | **Adjust** -- Group related modules or split curriculum into Part 1 and Part 2 |
| Phase 5 | Insufficient quality resources available for a module | **Adjust** -- Recommend community resources, create original content, or note as a gap for learners |
| Phase 6 | Exercises cannot be made objective | **Adjust** -- Use peer review, portfolio-based assessment, or expert evaluation; document subjectivity |
| Phase 7 | Assessments cannot be aligned with objectives | **Adjust** -- Revise learning objectives to be more measurable or use alternative assessment methods |
| Phase 8 | Curriculum exceeds 50 pages | **Adjust** -- Split into primary curriculum + supplementary modules; use modular format |
| Phase 9 | Learner feedback indicates fundamental curriculum flaws | **Adjust** -- Loop back to Phase 3 or 4 to redesign skill levels or learning path |

---

## State Persistence

The Curriculum Designer skill maintains state across execution phases and iterations:

**Tracked State:**
- `curriculum_version`: string -- Version number (e.g., "1.0", "1.1") for tracking updates
- `learner_feedback_log`: object[] -- Feedback collected from learners, with timestamps and analysis
- `module_completion_data`: object[] -- Learner completion rates and assessment scores per module
- `resource_update_log`: object[] -- History of resource additions, removals, or replacements
- `exercise_difficulty_ratings`: object[] -- Learner-reported difficulty and time estimates vs. actual
- `last_review_date`: string -- Date of last curriculum review and iteration
- `next_review_date`: string -- Scheduled date for next review

**Persistence Mechanism:**
- State is stored in a curriculum metadata file (e.g., curriculum_metadata.json) alongside the curriculum document
- State is updated after Phase 9 (Curriculum Review & Iteration) and before publication
- State enables iterative improvement and version control

---

## Reference Section

### Curriculum Design Principles

1. **Scaffolding:** Each level builds on the previous one. Beginner concepts are prerequisites for Intermediate.
2. **Coherence:** All modules, resources, exercises, and assessments align with the same learning objectives.
3. **Practicality:** Learners apply concepts through hands-on exercises, not just passive consumption.
4. **Accessibility:** Resources and exercises are available and affordable to the target audience.
5. **Measurability:** Learning objectives and assessments are specific and testable (SMART format).
6. **Flexibility:** Learners can progress at their own pace; modules can be revisited.
7. **Inclusivity:** Curriculum serves diverse learner personas (visual, kinesthetic, auditory, self-directed, group-based).
8. **Iterability:** Curriculum evolves based on learner feedback and field developments.

### Skill Level Definitions (Generic)

- **Beginner:** Can perform basic tasks with guidance; understands core concepts; needs external resources for complex problems.
- **Intermediate:** Can perform standard tasks independently; understands relationships between concepts; can troubleshoot common issues.
- **Advanced:** Can perform complex tasks independently; can design solutions; can teach others; understands edge cases and limitations.
- **Expert:** Can innovate and lead; can handle novel problems; can mentor; can contribute to field advancement.

### Resource Type Guidance

- **Books:** Best for deep, comprehensive understanding; good for Intermediate and Advanced levels
- **Courses:** Best for structured learning with feedback; good for all levels
- **Tutorials:** Best for hands-on, step-by-step learning; good for Beginner and Intermediate
- **Documentation:** Best for reference and specific problem-solving; good for Intermediate and Advanced
- **Tools/Platforms:** Best for practice and experimentation; good for all levels
- **Communities:** Best for peer learning, support, and staying current; good for all levels

### Learner Persona Types

- **Visual Learner:** Prefers diagrams, videos, infographics, color-coded notes
- **Kinesthetic Learner:** Prefers hands-on exercises, labs, simulations, physical manipulation
- **Auditory Learner:** Prefers lectures, podcasts, discussions, verbal explanations
- **Reading/Writing Learner:** Prefers books, articles, note-taking, written summaries
- **Self-Directed Learner:** Prefers independent study, self-paced modules, autonomy
- **Group-Based Learner:** Prefers collaborative exercises, peer discussion, group projects

### Assessment Methods

- **Knowledge Checks:** Quizzes, conceptual questions, flashcards (test understanding)
- **Practical Tasks:** Exercises, projects, demonstrations (test application)
- **Peer Review:** Critique from peers or mentors (test communication and quality)
- **Portfolio:** Collection of work demonstrating progression (test growth and mastery)
- **Certification Exams:** Standardized tests (test against external benchmarks)

### Time Estimation Guidance

- Beginner level: 20-40 hours (2-4 weeks at 5-10 hrs/week)
- Intermediate level: 40-80 hours (4-8 weeks at 10 hrs/week)
- Advanced level: 60-120 hours (6-12 weeks at 10 hrs/week)
- Expert level: 80-160+ hours (8+ weeks at 10+ hrs/week)
- Total: 200-400 hours for full mastery (6-12 months at 10 hrs/week)

Adjust based on learner background, time availability, and topic complexity.

### SMART Learning Objectives Format

- **Specific:** Clearly define what the learner will do (e.g., "write a Python function" not "understand Python")
- **Measurable:** Include a measurable outcome (e.g., "that passes 10 test cases" not "that works well")
- **Achievable:** Realistic within the estimated timeframe and learner background
- **Relevant:** Connected to real-world applications or career goals
- **Time-bound:** Estimated duration for achieving the objective

Example: "By the end of Module 3, learners will write a Python function that sorts a list of 1000 integers in <2 seconds, demonstrating understanding of algorithm complexity (2 hours of practice)."

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.