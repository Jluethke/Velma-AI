# Panel Compiler

Compile multiple sub-figures into a multi-panel figure: align axes, assign panel labels (A, B, C), and ensure consistent styling across panels.

## Inputs

- `vector-figure-file`: The individual figure panels
- `style-config`: Consistent style parameters

## Outputs

- `compiled-panel`: The final multi-panel figure
- `panel-caption`: Caption with sub-panel references (A) ..., (B) ...

## Process

1. Arrange panels in the specified layout (rows, columns, or custom grid).
2. Align shared axes across panels so values are directly comparable.
3. Add panel labels (A, B, C) in a consistent position and size.
4. Verify that font sizes, line weights, and colors are identical across all panels.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
