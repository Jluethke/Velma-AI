# Prompt-to-Skill Converter

Convert a working ad-hoc prompt that produces good results into a publishable SkillChain skill. Analyze the prompt's implicit structure, detect its execution pattern (ORPA or Phase Pipeline), extract inputs/outputs/phases/quality gates, generate a complete .skillpack, and validate through shadow execution.

## Execution Pattern: Phase Pipeline

```
PHASE 1: CAPTURE    --> Accept a working prompt that produces good results
PHASE 2: ANALYZE    --> Identify the execution pattern (ORPA vs Phase Pipeline)
PHASE 3: STRUCTURE  --> Extract inputs, outputs, phases, quality gates from the prompt
PHASE 4: GENERATE   --> Create a complete .skillpack (manifest, skill.md, test cases)
PHASE 5: VALIDATE   --> Run shadow validation on the generated skill
```

## Inputs

- `working_prompt`: string -- The complete prompt text that consistently produces good results
- `prompt_examples`: object[] (optional) -- 2-5 example inputs and their expected outputs from using this prompt
- `prompt_context`: string (optional) -- Domain context, who uses this prompt, what problem it solves
- `target_domain`: string (optional) -- SkillChain domain category (development, business, ai, writing, etc.)
- `conversion_history`: object (optional) -- Previous conversions for pattern reuse

## Outputs

- `prompt_analysis`: object -- Decomposed prompt: implicit steps, knowledge areas, decision points, quality criteria
- `execution_pattern`: object -- ORPA or Phase Pipeline recommendation with justification
- `skill_structure`: object -- Extracted inputs, outputs, phases, quality gates, exit criteria
- `generated_skillpack`: object -- Complete skill files: manifest.json, skill.md, tests/test_cases.json, examples/example_1.md, provenance.json
- `validation_results`: object -- Shadow execution results: consistency score, output quality assessment

---

## Execution

### Phase 1: CAPTURE -- Accept and Validate the Prompt

**Entry criteria:** A working prompt is provided. The prompt has been used at least a few times and produces good results.

**Actions:**

1. **Read the complete prompt text:**
   - Identify the instruction sections (what the prompt tells the model to do)
   - Identify the knowledge sections (background information, reference data, domain expertise)
   - Identify the format sections (output structure requirements)
   - Identify the constraint sections (what NOT to do, limitations, guardrails)

2. **Assess prompt quality for conversion:**
   - **Specificity**: Does the prompt describe a concrete procedure, or is it vague? ("analyze this code" = vague; "check this code for SQL injection, XSS, and auth bypass" = specific)
   - **Consistency**: Given the same input, does the prompt produce similar outputs? (Ask the user or infer from examples)
   - **Completeness**: Does the prompt handle edge cases, or does the user frequently need to add follow-up instructions?
   - **Domain scope**: Is the prompt focused on one domain, or does it try to do everything?

3. **Gather examples (if not provided):**
   - Ask for 2-5 example inputs and their outputs
   - These become the test cases for the generated skill
   - Look for: diversity of inputs, edge cases covered, consistent output format

4. **Classify the prompt's purpose:**
   - **Analysis**: takes input, produces evaluation/assessment (-> likely ORPA)
   - **Generation**: takes requirements, produces artifacts (-> likely Phase Pipeline)
   - **Transformation**: takes input in format A, produces output in format B (-> either pattern)
   - **Decision**: takes situation, produces recommendation (-> likely ORPA)
   - **Workflow**: takes goal, produces multi-step plan (-> likely Phase Pipeline)

**Output:** Prompt decomposition: instruction blocks, knowledge blocks, format blocks, constraints, quality assessment, purpose classification, and examples.

**Quality gate:** Prompt has at least one clear instruction block. Purpose is classified. At least 2 examples are available (provided or derived). Quality assessment flags any ambiguity that would cause inconsistent outputs.

---

### Phase 2: ANALYZE -- Detect Execution Pattern

**Entry criteria:** Prompt decomposition is complete.

**Actions:**

1. **Test for ORPA pattern indicators:**
   - Does the prompt involve iteration? ("keep checking until...", "if you find X, also look for Y")
   - Is the scope defined by the input? (scope unknown until you observe the input)
   - Does the prompt react to existing state? ("review this", "analyze this", "debug this")
   - Does the prompt have a feedback loop? (output of one step informs the next)
   - Count ORPA indicators: Observe (gather data), Reason (evaluate), Plan (prioritize), Act (produce output)

2. **Test for Phase Pipeline indicators:**
   - Does the prompt follow a linear flow? ("first do X, then Y, then Z")
   - Is the output format defined upfront? (scope known before starting)
   - Does the prompt generate something new? ("create", "write", "build", "design")
   - Are the steps sequential with clear handoff? (output of step N is input to step N+1)
   - Count phase indicators: how many distinct phases can you identify?

3. **Apply the decision rule:**
   ```
   If ORPA indicators > Pipeline indicators AND the prompt has a loop condition:
     -> ORPA Loop
   If Pipeline indicators > ORPA indicators AND the prompt has >3 sequential phases:
     -> Phase Pipeline
   If tied:
     -> "Do I know what the output looks like before I start?"
        Yes -> Phase Pipeline
        No  -> ORPA Loop
   ```

4. **Map the prompt's implicit phases:**
   - For ORPA: identify what constitutes Observe, Reason, Plan, and Act
   - For Phase Pipeline: identify 3-5 sequential phases with names
   - For each phase: what does the prompt say to DO? (actions)
   - For each phase: what does it produce? (intermediate output)
   - For each phase: what must be true before proceeding? (quality gate)

5. **Identify implicit knowledge:**
   - What domain expertise does the prompt assume the model has?
   - What reference data is embedded in the prompt? (checklists, formulas, taxonomies)
   - What decision criteria are used? (explicit rules or implied heuristics)
   - This knowledge becomes the Reference section of the skill

**Output:** Execution pattern recommendation (ORPA or Phase Pipeline) with justification, phase map with actions/outputs/quality gates, and implicit knowledge inventory.

**Quality gate:** Pattern choice is justified with specific indicators from the prompt. At least 3 phases are identified with distinct actions. Implicit knowledge areas are listed.

---

### Phase 3: STRUCTURE -- Build the Skill Skeleton

**Entry criteria:** Execution pattern and phase map are determined.

**Actions:**

1. **Define inputs:**
   - What information does the prompt need to start? (extract from prompt's input requirements)
   - For each input: name, type, description, required/optional
   - Validate: are there inputs the prompt implies but doesn't explicitly request? (e.g., language of the code, target audience)

2. **Define outputs:**
   - What does the prompt produce? (extract from format sections and examples)
   - For each output: name, type, description
   - Make outputs specific: not "a result" but "a JSON object with severity-ranked findings including file paths and line numbers"

3. **Define phases with full structure:**
   - For each phase identified in Phase 2:
     - **Entry criteria**: what must be true before this phase starts
     - **Actions**: numbered list of specific actions (extracted from prompt instructions)
     - **Output**: what this phase produces (intermediate or final)
     - **Quality gate**: testable condition to proceed to next phase

4. **Define exit criteria:**
   - When is the skill DONE? (extract from prompt's completion signals)
   - Convert implicit criteria to explicit, testable conditions
   - Example: prompt says "make sure it's thorough" -> exit criteria says "all identified issues have severity ratings and remediation recommendations"

5. **Define error handling:**
   - What can go wrong at each phase?
   - What does the prompt say to do when input is ambiguous/missing?
   - If the prompt doesn't address errors: design reasonable defaults (retry, adjust, abort)

6. **Extract reference material:**
   - Pull all domain knowledge, checklists, taxonomies, formulas from the prompt
   - Organize into the Reference section of skill.md
   - Add: any knowledge the prompt assumes but doesn't state (expert knowledge that improves consistency)

7. **Design state persistence:**
   - What should the skill remember between runs?
   - Patterns seen, configurations learned, history of inputs/outputs
   - This is what differentiates a skill from a one-shot prompt

**Output:** Complete skill skeleton: inputs, outputs, phases with full structure, exit criteria, error handling, reference material, state persistence design.

**Quality gate:** Every input maps to at least one phase action that uses it. Every output is produced by at least one phase. Quality gates are testable (not "make sure it's good"). Exit criteria are concrete.

---

### Phase 4: GENERATE -- Create the .skillpack

**Entry criteria:** Skill skeleton is complete and validated.

**Actions:**

1. **Generate manifest.json:**
   ```json
   {
     "name": "<skill-name>",
     "version": "1.0.0",
     "domain": "<domain>",
     "tags": ["<extracted-from-prompt-topics>"],
     "inputs": ["<input-names>"],
     "outputs": ["<output-names>"],
     "execution_pattern": "<orpa|phase_pipeline>",
     "price": "<based-on-complexity>",
     "license": "COMMERCIAL",
     "min_shadow_count": 5,
     "graduation_threshold": 0.75,
     "description": "<one-sentence-procedure-description>"
   }
   ```

2. **Generate skill.md:**
   - Follow the Skill.md Template from the SkillChain Execution Standard exactly
   - Include: one-line description, execution pattern declaration, inputs, outputs, execution phases with full structure, exit criteria, error handling, state persistence, reference section
   - The reference section should be comprehensive -- this is where the prompt's knowledge lives permanently

3. **Generate tests/test_cases.json:**
   - Create 5 test cases from the prompt examples
   - Each test case: input scenario + expected_keywords (8-12 keywords the output must contain)
   - Cover: happy path (2 cases), edge case (1 case), error handling (1 case), complex input (1 case)
   - Test cases validate that the skill's execution is consistent

4. **Generate examples/example_1.md:**
   - Create a complete worked example showing the skill executing on a real input
   - Walk through each phase with specific intermediate outputs
   - Show the final output in full
   - This is the "proof of execution" that demonstrates the skill works

5. **Generate provenance.json:**
   - Creator, creator node, timestamp, origin
   - Add: `"converted_from": "prompt"` to indicate this is a prompt-derived skill

6. **Set pricing based on complexity:**
   - Simple (1-3 phases, narrow domain): 5-10 credits
   - Moderate (3-5 phases, standard domain): 10-20 credits
   - Complex (5+ phases, deep domain expertise, extensive reference): 20-30 credits

**Output:** Complete .skillpack: all 5 files ready for publishing.

**Quality gate:** manifest.json passes schema validation. skill.md follows the execution standard template. 5 test cases cover diverse scenarios. Example walks through every phase. Provenance is complete.

---

### Phase 5: VALIDATE -- Shadow Execution

**Entry criteria:** .skillpack is fully generated.

**Actions:**

1. **Run 5 independent shadow executions:**
   - Take each test case input and execute the skill against it
   - Record the output from each execution
   - Do not share outputs between executions (independence)

2. **Score consistency:**
   - For each test case: what percentage of expected_keywords appear in the output?
   - A test case passes if >= 75% of expected_keywords are present
   - Overall skill passes if >= 4 out of 5 test cases pass (80%)
   - If < 80%: identify which phases produce inconsistent outputs

3. **Score completeness:**
   - Does the output follow the declared execution pattern? (all phases present)
   - Are all declared outputs produced?
   - Are quality gates enforced? (skip detection)
   - Do exit criteria match what was actually produced?

4. **Identify improvement areas:**
   - Phases where outputs vary most between executions (need tighter specification)
   - Quality gates that are too vague (allow inconsistent pass-through)
   - Reference material gaps (knowledge needed but not included)
   - Test cases that are too easy or too hard

5. **Generate validation report:**
   - Pass/fail per test case with keyword match details
   - Overall consistency score
   - Specific recommendations for improving consistency
   - Comparison to the original prompt's output quality

**Output:** Validation results: pass/fail, consistency score, completeness score, improvement recommendations.

**Quality gate:** Overall consistency score >= 75%. All declared outputs are produced in at least 4/5 executions. No phase is skipped in any execution. If validation fails: loop back to Phase 3 (STRUCTURE) to tighten specifications.

---

## Exit Criteria

The skill is DONE when:
- The prompt is decomposed into explicit phases with quality gates
- An execution pattern is selected with justification
- A complete .skillpack is generated with all 5 required files
- Shadow validation produces a consistency score >= 75%
- The generated skill is demonstrably more consistent than the raw prompt
- The example shows a complete execution walkthrough

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| CAPTURE | Prompt is too vague to convert (no specific procedure) | **Abort** -- explain that the prompt needs to describe a concrete procedure, not a general request. Suggest structuring the prompt first. |
| CAPTURE | No examples available and user cannot provide them | **Adjust** -- generate synthetic examples by running the prompt internally, then validate with the user |
| ANALYZE | Prompt doesn't fit either execution pattern | **Adjust** -- decompose the prompt into sub-prompts, each converting to a separate skill, linked by composition |
| ANALYZE | Prompt has both iterative AND linear elements | **Adjust** -- use Phase Pipeline as the primary pattern with an ORPA loop nested within one phase |
| STRUCTURE | Prompt's implicit knowledge is too extensive to capture | **Adjust** -- capture the top 80% and document remaining knowledge gaps as "requires domain expertise" |
| GENERATE | Generated skill.md exceeds reasonable length (>2000 lines) | **Adjust** -- split reference material into multiple skills, make the main skill import them |
| VALIDATE | Consistency score < 75% after first attempt | **Retry** -- return to Phase 3, tighten quality gates and add more specific action descriptions, re-generate and re-validate (max 2 retries) |

## State Persistence

Between runs, this skill saves:
- **Conversion log**: prompts converted, their domains, execution patterns detected
- **Pattern library**: reusable phase structures across converted prompts (e.g., "research phase" template, "validation phase" template)
- **Quality insights**: which prompt structures produce the highest consistency scores
- **Domain templates**: pre-built skill skeletons for common domains (development, writing, analysis)

---

## Reference

### Prompt Decomposition Framework

Every working prompt contains these implicit blocks (whether the author intended them or not):

```
INSTRUCTION BLOCKS:
  "You are a..."         -> Role/persona definition
  "Given X, do Y..."     -> Core task specification
  "Make sure to..."      -> Quality constraints
  "Do not..."            -> Negative constraints/guardrails
  "First... then..."     -> Sequencing (phases)
  "If... then..."        -> Conditional logic (branches)

KNOWLEDGE BLOCKS:
  "Use the following..." -> Explicit reference data
  "Consider factors..."  -> Decision criteria
  "Best practices..."    -> Domain expertise
  Embedded examples      -> Pattern demonstration

FORMAT BLOCKS:
  "Output as JSON..."    -> Structure specification
  "Include sections..."  -> Content organization
  "Format: ..."          -> Template specification

CONTEXT BLOCKS:
  "You are helping..."   -> User context
  "The audience is..."   -> Output audience
  "In the context of..." -> Domain context
```

### Execution Pattern Detection Signals

#### Strong ORPA Signals
```
- "Analyze the [input] and identify..."  (Observe -> Reason)
- "Review this for [issues]"             (Observe -> Reason)
- "Debug this [error]"                   (Observe -> Reason -> Plan -> Act)
- "If you find X, also check for Y"     (Loop: Act -> Observe)
- "Keep investigating until..."          (Loop with exit condition)
- "Prioritize findings by..."           (Plan)
- "Recommend fixes for..."              (Act)
```

#### Strong Phase Pipeline Signals
```
- "First, gather... Then, analyze... Finally, produce..."  (Sequential phases)
- "Create a [specific artifact]"                           (Known output shape)
- "Write a [document/plan/spec]"                           (Generative)
- "Step 1:... Step 2:... Step 3:..."                       (Explicit sequencing)
- "Include the following sections:..."                      (Defined output structure)
- "Start by... then... end with..."                        (Linear flow)
```

### Quality Gate Design Patterns

```
Good quality gates (testable):
  "Every file has been scanned"                -> count files scanned vs total
  "All items have a severity rating"           -> check for unrated items
  "Output contains at least 3 recommendations" -> count recommendations
  "No unresolved references in the output"     -> search for broken references

Bad quality gates (untestable):
  "The analysis is thorough"                   -> what does "thorough" mean?
  "The output is high quality"                 -> by whose standard?
  "Make sure nothing is missed"                -> how to verify completeness?
  "The result is accurate"                     -> compared to what ground truth?

Converting bad to good:
  "thorough" -> "covers all 6 checklist categories"
  "high quality" -> "every finding has location, description, and severity"
  "nothing missed" -> "every public function has been analyzed"
  "accurate" -> "expected_keywords match at >= 75%"
```

### Pricing Guide

```
Credits 5-10 (Simple):
  - Single execution pattern (ORPA or Pipeline)
  - 1-3 phases
  - Narrow domain (one specific task)
  - Minimal reference material
  - Example: prompt for writing commit messages

Credits 10-20 (Moderate):
  - Full execution pattern with quality gates
  - 3-5 phases
  - Standard domain expertise
  - Moderate reference material
  - Example: prompt for code review, API design

Credits 20-30 (Complex):
  - Deep execution pattern with error handling
  - 5+ phases with branching
  - Expert domain knowledge
  - Extensive reference material
  - State persistence across runs
  - Example: prompt for architecture assessment, legal analysis
```

### Skill Naming Conventions

```
Format: lowercase-kebab-case
  Good: "code-review", "bug-root-cause", "api-design"
  Bad:  "CodeReview", "bug_root_cause", "API Design"

Naming rules:
  - Describe the ACTION, not the topic: "review-code" not "code-knowledge"
  - Be specific: "sql-query-optimizer" not "database-helper"
  - Keep it short: 2-4 words maximum
  - No version numbers in the name: version goes in manifest.json
```

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
