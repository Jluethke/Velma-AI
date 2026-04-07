# Onboarding Guide Builder

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Takes a tool, platform, system, or role and generates a structured onboarding guide for a new user or employee. Covers: prerequisites, day-1 setup, first-week milestones, common mistakes, who to ask for help, glossary of terms, and "you're ramped up when" criteria. Fork this for: employee onboarding, SaaS onboarding, community onboarding, course onboarding.

## Execution Pattern: Phase Pipeline

```
PHASE 1: SCOPE      --> Define what is being onboarded and who the audience is
PHASE 2: MAP        --> Chart the learning path from zero to productive
PHASE 3: BUILD      --> Write each section of the onboarding guide
PHASE 4: VALIDATE   --> Verify completeness and identify gaps
```

## Inputs

- `subject`: string -- What the person is onboarding to: a tool, platform, system, role, or team.
- `subject_description`: string -- What the subject does, its core concepts, and why it exists.
- `audience`: string -- Who is being onboarded: new employee, new user, new team member, new customer.
- `audience_level`: string (optional) -- Technical level: "beginner", "intermediate", "expert-in-adjacent-field" (default: "beginner").
- `existing_resources`: string[] (optional) -- Documentation, wikis, or guides that already exist (to reference, not duplicate).
- `time_to_ramp`: string (optional) -- Expected ramp-up period: "1 day", "1 week", "30 days", "90 days" (default: "1 week").

## Outputs

- `onboarding_guide`: object -- Complete guide with all sections populated.
- `checklist`: object[] -- Day-by-day checklist the new person can work through.
- `glossary`: object[] -- Term/definition pairs for domain-specific vocabulary.
- `ramp_criteria`: string[] -- "You're ramped up when..." criteria to self-assess readiness.

---

## Execution

### Phase 1: SCOPE -- Define the Onboarding Boundary

**Entry criteria:** Subject and audience are provided.

**Actions:**

1. Determine what "productive" means for this subject. Productive is NOT "knows everything" — it is "can do the 3-5 most common tasks independently without asking for help."
2. List the 3-5 most common tasks a ramped-up person performs. These are the learning objectives.
3. Identify prerequisites: what must the person already know or have before starting? (e.g., "has a GitHub account", "understands basic SQL", "has admin access to the platform").
4. Identify what is explicitly OUT of scope: advanced features, edge cases, and topics that can wait until after the ramp period.
5. Determine the right granularity for the audience_level: a beginner needs every click explained; an expert-in-adjacent-field needs conceptual mapping ("this is like X in the tool you already know").

**Output:** Productivity definition, learning objectives, prerequisites list, out-of-scope list, granularity guidance.

**Quality gate:** Learning objectives are specific tasks (not "understand the system"). Prerequisites are verifiable (not "be smart"). Out-of-scope items are listed to prevent scope creep.

---

### Phase 2: MAP -- Chart the Learning Path

**Entry criteria:** Scope is defined.

**Actions:**

1. Order the learning objectives by dependency: which tasks must be learned first because other tasks depend on them? Build a dependency chain.
2. Break the ramp period into milestones:
   - **Day 1**: environment setup, first successful action (the "hello world" moment).
   - **End of week 1** (or equivalent): can perform the most common task independently.
   - **End of ramp period**: can perform all 3-5 common tasks and knows where to find help for everything else.
3. For each milestone, list the specific skills or knowledge needed:
   - Concepts to understand (what and why)
   - Actions to perform (how, step by step)
   - Validation to confirm (how to know you did it right)
4. Identify the "aha moments": the 2-3 key insights that transform confusion into understanding. Place them strategically in the learning path.
5. Map common mistakes to milestones: at each stage, what do people typically get wrong? Warn about them before they happen.

**Output:** Milestone-based learning path with skills, actions, validations, aha moments, and common mistakes.

**Quality gate:** Every milestone has at least one validation step. Common mistakes are listed with prevention advice, not just "be careful." The path follows dependency order.

---

### Phase 3: BUILD -- Write the Guide

**Entry criteria:** Learning path is mapped.

**Actions:**

1. **Welcome section**: one paragraph explaining what this guide covers, who it is for, and how long it will take. Set expectations.
2. **Prerequisites checklist**: everything needed before starting, each as a checkable item with instructions for how to get it if missing.
3. **Day 1 guide**: step-by-step instructions for initial setup and the first successful action. Include screenshots or diagram descriptions where helpful. End with: "If you've done X, you're on track."
4. **Core concepts**: 3-5 key concepts explained in plain language. Use analogies appropriate to the audience_level. Each concept has: what it is, why it matters, and one example.
5. **Common tasks walkthroughs**: for each learning objective, a numbered step-by-step guide. Include what to do when something goes wrong at each step.
6. **Common mistakes**: a section titled "Things Everyone Gets Wrong" with: the mistake, why it happens, how to fix it, and how to prevent it.
7. **Who to ask for help**: categorized by topic. For each topic: the person/team/channel to contact and what to include in your request.
8. **Glossary**: every domain-specific term used in the guide, with a plain-English definition.
9. **"You're ramped up when" criteria**: 5-8 self-assessment statements. "You're ramped up when you can [specific action] without looking it up."

**Output:** Complete onboarding guide with all 9 sections.

**Quality gate:** Day 1 guide has numbered steps that a new person could follow without prior knowledge. Every domain term used in the guide appears in the glossary. Ramp criteria are measurable (not "you feel comfortable").

---

### Phase 4: VALIDATE -- Check for Gaps

**Entry criteria:** Guide is fully written.

**Actions:**

1. Walk through the guide as a new person: does every step in Day 1 have enough detail to execute? Are there any points where you would be stuck and not know where to go?
2. Cross-reference: does every learning objective from Phase 1 have a corresponding walkthrough in Phase 3? Are any missing?
3. Check the glossary: scan the guide for technical terms and verify each one is defined in the glossary.
4. Verify existing_resources are referenced (not duplicated): if documentation already exists, link to it rather than rewriting it.
5. Build the day-by-day checklist: extract every action item from the guide into a chronological checklist grouped by day or milestone. Each item should be completable and verifiable.

**Output:** Validation report with any gaps found, final checklist, cross-reference confirmation.

**Quality gate:** Every learning objective has a walkthrough. Every technical term is in the glossary. The checklist covers the full ramp period. No step says "figure out how to..." without providing the how.

---

## Exit Criteria

The skill is DONE when:
- All 9 guide sections are populated
- Day 1 guide is executable by someone with only the listed prerequisites
- Every learning objective has a task walkthrough
- A glossary covers all domain-specific terms
- A day-by-day checklist is produced
- "You're ramped up when" criteria are measurable

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| SCOPE | Subject description is too vague to identify learning objectives | **Adjust** -- ask what the 3 most common tasks are and build from there |
| SCOPE | Audience level varies widely (guide is for both beginners and experts) | **Adjust** -- create two tracks: a quick-start for experts and a full guide for beginners |
| MAP | No clear dependency order between tasks | **Adjust** -- order by frequency (most common task first) instead of dependency |
| BUILD | Existing resources cover most of what the guide would say | **Adjust** -- create a "navigator" guide that links to existing resources in the right order with context for each |
| VALIDATE | More than 3 gaps found in the walkthrough | **Retry** -- return to Phase 3 and fill each gap before finalizing |

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
