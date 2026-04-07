# Example: Generating Tests for a "debugging-strategies" Skill

## Input
```
skill_md_content: [A debugging-strategies skill with ORPA pattern:
  OBSERVE: Read error message, inspect stack trace, gather context
  REASON: Form hypotheses ranked by likelihood, identify patterns
  PLAN: Select debugging strategy (binary search, rubber duck, print debug, debugger)
  ACT: Apply fix, verify, document root cause
  Error handling: unknown error type -> escalate to senior dev
  Reference: common error patterns, debugging methodologies]

manifest_json: { "name": "debugging-strategies", "execution_pattern": "orpa", "inputs": ["error_message", "stack_trace", "code_context"], "outputs": ["root_cause", "fix", "prevention"] }
existing_tests: []
```

## Phase 1: ANALYZE Output

**Skill Anatomy:**
- Pattern: ORPA Loop
- Phases: OBSERVE (error reading), REASON (hypothesis formation), PLAN (strategy selection), ACT (fix + verify)
- Inputs: error_message, stack_trace, code_context
- Outputs: root_cause, fix, prevention recommendation
- Quality gates: "hypotheses ranked by likelihood before proceeding to plan"
- Error handling: unknown error type -> escalate
- Core competency: systematic hypothesis-driven debugging

**Testable behaviors:**
1. OBSERVE: Can it parse an error message and extract relevant information?
2. REASON: Does it form multiple hypotheses and rank them?
3. PLAN: Does it select an appropriate debugging strategy for the situation?
4. ACT: Does it provide a fix AND a prevention recommendation?
5. Edge: What if the error message is vague or missing?
6. Error: Does it know when to escalate?

## Phase 2: GENERATE Output

```json
[
    {
        "input": "I'm getting a TypeError: Cannot read properties of undefined (reading 'map') in my React component. Here's the stack trace pointing to line 45 of UserList.jsx.",
        "expected_keywords": ["undefined", "props", "null check", "optional chaining", "initial state", "API response", "guard", "default value"]
    },
    {
        "input": "My application works locally but crashes in production with a 502 error. No useful stack trace. How do I debug this?",
        "expected_keywords": ["environment difference", "logs", "config", "memory", "binary search", "reproduce", "monitoring", "staging"]
    },
    {
        "input": "I have a race condition that only happens under load. The bug is intermittent and I can't reliably reproduce it.",
        "expected_keywords": ["race condition", "concurrency", "lock", "mutex", "logging", "thread", "timing", "reproduce under load"]
    },
    {
        "input": "What debugging strategy should I use when I have no idea where the bug is in a large codebase?",
        "expected_keywords": ["binary search", "bisect", "isolate", "divide", "narrow", "half", "git bisect", "systematic"]
    },
    {
        "input": "The error message just says 'segmentation fault' with no other context. What now?",
        "expected_keywords": ["memory", "pointer", "out of bounds", "valgrind", "address sanitizer", "core dump", "escalate", "low-level"]
    }
]
```

## Phase 3: VALIDATE Output

**Coverage Matrix:**
| Element | Test 1 | Test 2 | Test 3 | Test 4 | Test 5 |
|---|---|---|---|---|---|
| OBSERVE phase | YES | YES | YES | | YES |
| REASON phase | YES | | YES | | |
| PLAN phase | | YES | | YES | |
| ACT phase | YES | | | | |
| Error handling | | | | | YES (escalation) |
| Edge case | | YES (no stack trace) | YES (intermittent) | | |

**Coverage score:** 85% (all phases covered, error handling covered, good edge case variety)
**Minor gap:** ACT phase (fix + prevention) only explicitly tested in test 1. Recommend adding a test specifically asking "How do I prevent this bug from recurring?"

## Phase 4: SCORE Output

| Factor | Score | Notes |
|---|---|---|
| Execution clarity | 20/25 | Phases are well-defined, actions are specific |
| Output definition | 18/25 | Outputs named but format not specified (JSON? narrative?) |
| Quality gates | 15/20 | Gate exists for REASON phase, others implicit |
| Error handling | 12/15 | Escalation defined but only one failure mode |
| Reference depth | 12/15 | Good methodology coverage, could add more patterns |

**Total: 77/100**
**Predicted shadow validation success: 70-80%**

**Improvement recommendations:**
1. Define output format explicitly (will a fix be code, pseudocode, or explanation?)
2. Add quality gates between PLAN and ACT (does the selected strategy match the hypothesis?)
3. Add 2-3 more error handling scenarios (what if code_context is empty? what if the error is in a dependency?)
