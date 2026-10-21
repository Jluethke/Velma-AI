# Secure Coding Standard Mapper

Map each vulnerability pattern to the secure coding standard and anti-pattern example that teaches the fix.

## Inputs

- `vulnerability-pattern-library`: Catalog of weakness patterns from the pattern step
- `tech-stack`: Languages, frameworks, and runtime the team builds on

## Outputs

- `secure-coding-standards`: Standard rules that prevent each cataloged pattern
- `anti-pattern-examples`: Paired vulnerable and fixed code snippets per rule

## Process

1. Select the coding standard clause that neutralizes each pattern
2. Write a vulnerable snippet and its corrected counterpart for each clause
3. Note the review signal that lets a reader spot the pattern quickly
4. Record gaps where no standard yet covers a cataloged pattern

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
