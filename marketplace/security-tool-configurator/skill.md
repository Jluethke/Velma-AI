# Security Tool Configurator

Select and configure security testing tools for each required test type.

## Inputs

- `required-test-types`: List of security test types needed
- `application-profile`: Application type, languages, frameworks, and deployment model

## Outputs

- `tool-configurations`: Configuration files for each selected security tool
- `tool-selection-rationale`: Rationale for each tool choice including alternatives considered

## Process

1. Evaluate candidate tools for each test type against the application stack.
2. Configure each tool with appropriate rules, exclusions, and severity thresholds.
3. Document the selection rationale and configuration decisions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
