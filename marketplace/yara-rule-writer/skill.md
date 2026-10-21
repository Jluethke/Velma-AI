# Yara Rule Writer

Write the YARA rule with proper metadata, strings section, and condition.

## Inputs

- `selected-patterns`: Patterns chosen for the rule
- `condition-logic`: Boolean condition logic

## Outputs

- `draft-yara-rule`: Complete YARA rule with metadata, strings, and condition
- `rule-documentation`: Documentation of what the rule detects and known limitations

## Process

1. Write the rule metadata (author, description, date, reference, severity)
2. Define the strings section with hex patterns, text strings, and regex where needed
3. Write the condition combining patterns with file size, header, or section constraints
4. Document the rule's intended target, known limitations, and expected false positive rate

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
