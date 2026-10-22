# Requirements Structuring Engine

Transform stakeholder needs into structured, verifiable requirements with shall statements, performance parameters, and verification methods.

## Inputs

- `needs-register`: Structured stakeholder needs
- `conops-document`: Operational concept

## Outputs

- `requirements-set`: Structured requirements with ID, shall statement, rationale, verification method, and parent need trace
- `requirement-quality-report`: Quality metrics: ambiguity count, testability score, completeness coverage

## Process

1. For each need, write one or more shall statements following the pattern: [System/Subsystem] shall [verb] [measurable performance] [under stated conditions]. Every requirement must have a numerical threshold or an unambiguous pass/fail criterion.
2. For each requirement, assign a verification method: Analysis (calculation or simulation proves compliance), Demonstration (operate the system and observe), Inspection (examine drawings or code), Test (measure performance against threshold). If no method works, the requirement is not verifiable and must be rewritten.
3. Run ambiguity checks: search for words like 'appropriate', 'sufficient', 'timely', 'user-friendly', 'fast', 'reliable'. Each is ambiguous without a quantified threshold. Replace or define.
4. Compute quality metrics: completeness = fraction of needs with at least one derived requirement, ambiguity count = flagged words remaining, testability = fraction with assigned verification method, volatility = change rate per review cycle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
