# Sdk Code Generator

Generate the SDK code and customize it for each language.

## Inputs

- `validated-spec`: Clean API specification
- `target-languages`: Languages to generate for

## Outputs

- `generated-sdks`: Generated SDK code for each target language
- `customization-notes`: Language-specific customizations applied

## Process

1. Run the code generator for each target language.
2. Apply language-specific conventions: naming, error handling, async patterns.
3. Add authentication helpers: configure once, use everywhere.
4. Add pagination helpers for list endpoints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
