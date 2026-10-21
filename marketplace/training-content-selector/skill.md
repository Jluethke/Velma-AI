# Training Content Selector

Select training content matched to the team's languages, frameworks, and identified vulnerability classes.

## Inputs

- `top-vuln-classes`: Ranked list of vulnerability classes by frequency and severity
- `codebase-summary`: Overview of the codebase including languages and frameworks

## Outputs

- `training-modules`: Selected training modules mapped to vulnerability classes and languages
- `content-sources`: List of training providers and materials for each module

## Process

1. Match vulnerability classes to available training content by language and framework.
2. Evaluate content quality and relevance for each candidate module.
3. Select the final set of modules covering all priority vulnerability classes.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
