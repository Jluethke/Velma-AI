# Isotope Context Interpreter

Interpret isotope values in the appropriate context: provenance, diet reconstruction, paleothermometry, or geochronology.

## Inputs

- `delta-values`: Sample isotope values in delta notation
- `interpretive-framework`: Which context applies (provenance, paleoecology, temperature, age)

## Outputs

- `interpretation`: Narrative interpretation of the isotope data in the selected context
- `comparison-dataset`: Sample values plotted against published reference ranges

## Process

1. Compile published reference data for the relevant context.
2. Plot sample values against the reference ranges.
3. Identify which reference group each sample falls within.
4. Write the interpretive narrative with caveats about mixing and diagenesis.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
