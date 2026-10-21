# Gel Electrophoresis Protocol

Run and document agarose gel electrophoresis to confirm PCR product size and purity before downstream processing.

## Inputs

- `pcr-product`: Amplified PCR product from the optimization step
- `expected-size`: Expected amplicon size in base pairs
- `gel-parameters`: Agarose percentage, buffer type, voltage, and run time

## Outputs

- `gel-image`: Annotated gel photograph with lane labels, ladder, and size markers
- `band-assessment`: Assessment of band size, intensity, and presence of nonspecific products
- `purification-decision`: Recommendation on whether gel extraction or direct cleanup is appropriate

## Process

1. Prepare gel at the specified agarose concentration with ethidium bromide or SYBR Safe
2. Load PCR products alongside a molecular weight ladder with known size standards
3. Run electrophoresis at the specified voltage and time, monitoring migration progress
4. Image the gel under UV or blue light and annotate lanes with sample identifiers
5. Compare observed band sizes to expected amplicon size and assess purity for next steps

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
