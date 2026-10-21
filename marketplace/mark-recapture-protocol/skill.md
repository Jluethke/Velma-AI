# Mark Recapture Protocol

Design and execute a mark-recapture study: marking method, capture occasions, data recording, and assumptions to verify.

## Inputs

- `target-species`: Species to mark and recapture
- `sampling-design`: When and where captures occur

## Outputs

- `capture-history-matrix`: Binary matrix of individual detection across occasions
- `marking-protocol`: Mark type, application method, and individual identification scheme
- `assumption-checks`: Tests for equal catchability, mark loss, and closure

## Process

1. Choose a marking method that does not alter survival or behavior
2. Define capture occasions with sufficient intervals for mixing
3. Record individual captures in a standard encounter history format
4. Test closure and equal catchability assumptions

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
