# Example: Optimizing a "content-engine" Skill

## Input
```
skill_md_content: [A content-engine skill with Phase Pipeline:
  Phase 1: Research topic (inputs: topic, audience, platform)
  Phase 2: Generate outline
  Phase 3: Write draft
  Phase 4: Edit and polish
  Phase 5: Format for platform
  Quality gates exist for Phases 1-2, none for 3-5]

execution_history: [
  { "run": 1, "phase_times": [12s, 8s, 45s, 30s, 5s], "success": [true, true, true, true, true] },
  { "run": 2, "phase_times": [10s, 7s, 52s, 28s, 6s], "success": [true, true, true, true, true] },
  { "run": 3, "phase_times": [15s, 9s, 40s, 35s, 5s], "success": [true, true, false, false, true] },
  { "run": 4, "phase_times": [11s, 8s, 48s, 32s, 6s], "success": [true, true, true, true, true] },
  { "run": 5, "phase_times": [13s, 10s, 55s, 25s, 5s], "success": [true, true, true, true, true] }
]

validation_results: {
  "pass_rate": 0.60,
  "keyword_match_rates": { "test_1": 0.75, "test_2": 0.50, "test_3": 0.88, "test_4": 0.63, "test_5": 0.75 },
  "consistency_score": 0.58,
  "notes": "Outputs vary significantly in structure and depth across runs"
}
```

## OBSERVE Output

**Performance Profile:**
| Phase | Avg Time | Failure Rate | Notes |
|---|---|---|---|
| Phase 1: Research | 12.2s | 0% | Stable, consistent |
| Phase 2: Outline | 8.4s | 0% | Stable, has quality gate |
| Phase 3: Write | 48.0s | 20% | BOTTLENECK (time), UNRELIABLE (failures) |
| Phase 4: Edit | 30.0s | 20% | Failures cascade from Phase 3 |
| Phase 5: Format | 5.4s | 0% | Stable, fast |

**Key findings:**
- Phase 3 is the bottleneck (48s avg, 48% of total time) AND the most failure-prone (20% failure rate)
- Phase 4 failures are downstream of Phase 3 failures (100% correlation)
- Consistency score 0.58 is below the 0.75 threshold for reliable validation
- Test 2 has the lowest keyword match rate (0.50) -- investigating

## REASON Output

**Root cause analysis:**

1. **Phase 3 inconsistency (ROOT CAUSE #1):**
   - Phase 3 says "Write draft" with no further specification
   - No output format defined (sometimes produces markdown, sometimes plain text, sometimes with headers, sometimes without)
   - No length constraint (outputs range from 200 to 2000 words)
   - No structural template (sometimes includes examples, sometimes doesn't)
   - **Classification:** Prompt quality issue
   - **Impact:** Fixes here would improve consistency from 0.58 to estimated 0.75+

2. **Phase 3 failures (ROOT CAUSE #2):**
   - Phase 3 has no quality gate. When research (Phase 1) returns thin results on niche topics, Phase 3 doesn't have enough material to work with but tries anyway and produces garbage
   - **Classification:** Structural issue (missing gate between Phase 2 and Phase 3)
   - **Impact:** Adding a gate would reduce Phase 3 failure rate from 20% to estimated <5%

3. **Test 2 low match rate (ROOT CAUSE #3):**
   - Test 2 expects keywords related to "audience targeting" but Phase 3 doesn't consistently address audience -- it's in Phase 1 (research) but that output doesn't always carry forward
   - **Classification:** Test misalignment + data flow issue
   - **Impact:** Either the test needs adjustment or Phase 3 needs explicit instruction to incorporate audience from Phase 1

## PLAN Output

### Recommendation 1: Constrain Phase 3 output format (QUICK WIN)
**Before:** "Write draft based on the outline."
**After:** "Write draft based on the outline. The draft MUST:
- Follow the outline structure exactly (one section per outline heading)
- Target [audience] using [tone] appropriate for [platform]
- Include a hook in the opening paragraph
- Include at least one specific example, statistic, or anecdote per section
- Length: 500-800 words for blog posts, 200-300 for social, 1000-1500 for long-form
- Output format: markdown with H2 headings matching outline sections"

**Target metric:** Consistency score 0.58 -> 0.75
**Effort:** 10 minutes
**ROI:** HIGH

### Recommendation 2: Add quality gate before Phase 3
**Before:** No gate between Phase 2 and Phase 3.
**After:** "Quality gate: Outline contains at least 3 sections. Each section has a clear thesis or key point. Research notes from Phase 1 provide at least 2 supporting facts per section. If research is insufficient: abort and report 'topic requires additional research on [specific gaps].'"

**Target metric:** Phase 3 failure rate 20% -> <5%
**Effort:** 15 minutes
**ROI:** HIGH

### Recommendation 3: Thread audience context through all phases
**Before:** Audience is captured in Phase 1 but not explicitly referenced in Phases 3-5.
**After:** Add to Phase 3 actions: "Reference the audience profile from Phase 1 output. Adjust vocabulary, examples, and complexity to match audience level."

**Target metric:** Test 2 keyword match 0.50 -> 0.75+
**Effort:** 5 minutes
**ROI:** MEDIUM

### Implementation order: Recommendation 1 -> 2 -> 3

### Monitoring plan:
After implementing changes, run 5 new shadow validations. Measure:
- Consistency score (target: >0.75)
- Phase 3 failure rate (target: <5%)
- Test 2 keyword match (target: >0.70)
- Overall validation pass rate (target: >75%)

**Predicted overall validation pass rate after all changes: 75-80%** (up from 60%)
