# Implementation Survey

Survey available open-source implementations of a target protocol to identify the most complete and best-tested codebase. Rank by completeness, test coverage, and real-world deployment count. Identify the minimal set of source files to extract from.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Gather protocol description and known implementations
REASON  --> Assess completeness, tests, deployment, community
PLAN    --> Rank sources, identify key files
ACT     --> Output ranked sources and key file list
```

## Inputs

- `protocol_description`: string -- What the protocol does, what systems use it, and what documentation already exists
- `known_implementations`: list[string] -- URLs or names of known open-source implementations

## Outputs

- `ranked_sources`: list[object] -- Implementations ranked by: completeness (message types covered), test coverage (automated tests), community validation (deployment count, bug tracker health)
- `key_files`: list[object] -- The specific source files in the top-ranked implementation that contain protocol logic (not application logic or test harnesses)

---

## Execution

### OBSERVE: Gather Implementations

1. For each known implementation, clone or browse the repository.
2. Identify the project's language, framework, license, last commit date, contributor count, and open/closed issue ratio.
3. Find the files that contain protocol logic: message construction, message parsing, state machine, checksum computation.

### REASON: Assess Quality

1. **Completeness.** Does the implementation handle all message types defined in the protocol? All error conditions? All states? Score 0-100 based on coverage.
2. **Test coverage.** Does it have automated tests? Do tests exercise the protocol against real or simulated endpoints? Are there integration tests, not just unit tests? Score 0-100.
3. **Community validation.** How many real-world deployments use this implementation? How many protocol-correctness bug reports exist (resolved vs open)? Score 0-100.
4. **Maintainability.** Is the code readable? Are protocol constants clearly defined? Is the protocol logic separated from application logic? Score 0-100.

### PLAN: Rank and Select

1. Rank implementations by weighted score: completeness (40%) + test coverage (30%) + community validation (20%) + maintainability (10%).
2. For the top-ranked implementation, identify the minimal file set: only files that contain protocol logic. Exclude: UI, configuration, build scripts, test fixtures, platform-specific wrappers.
3. If no single implementation is complete, note which parts each covers and recommend extracting from multiple sources.

### ACT: Deliver

1. Output the ranked list with scores and rationale per implementation.
2. Output the key file list: path, purpose (message builder, parser, state machine, checksum), and lines of protocol logic.

## Exit Criteria

1. At least one implementation is assessed and ranked
2. Key files are identified in the top-ranked source
3. Any gaps in completeness are noted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
