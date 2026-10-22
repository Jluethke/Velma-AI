# Common Cause Avoidance Techniques

Apply systematic techniques to prevent common cause failures from defeating redundancy in safety-critical architectures.

## Inputs

- `safety-case-structure`: Current safety case
- `residual-risk-register`: Known residual risks

## Outputs

- `independence-analysis`: For each redundant pair: physical separation, electrical isolation, software diversity, manufacturing lot diversity, and maintenance staggering assessment
- `common-cause-defense-score`: Scoring against IEC 61508 Annex D or equivalent: separation/segregation, diversity, complexity, assessment, competence, environmental testing, and environmental control, with an overall beta factor estimate
- `updated-residual-risks`: Residual risk register updated with common cause mitigation evidence and revised PFD calculations

## Process

1. Assess physical independence: are redundant channels in separate enclosures, on separate boards, powered from separate sources, routed through separate connectors? Physical proximity is the most common source of common cause: a single overvoltage event, a single thermal excursion, or a single mechanical impact can defeat both channels simultaneously.
2. Assess design diversity: are redundant channels implemented with different hardware (different IC families, different sensor technologies), different software (different algorithms, different compilers, different operating systems), and different design teams? Full diversity is expensive but dramatically reduces beta. Partial diversity (same hardware, different software) provides moderate common cause reduction.
3. Score the common cause defenses against IEC 61508 Annex D scoring system. Each defense category (separation, diversity, complexity management, assessment, competence, environmental testing, environmental control) receives a score from 0 to 3. The total score maps to a beta factor: score 165+ gives beta = 0.5%, score 130-165 gives beta = 1%, lower scores give higher beta values.
4. Recalculate the PFD with the revised beta factor and verify the safety integrity target is still met. If not, the options are: add diversity (expensive but effective), add diagnostics to detect common cause conditions before they propagate (moderate cost), or add a third channel to provide voting (expensive and complex). Document the chosen approach and its justification in the safety case.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
