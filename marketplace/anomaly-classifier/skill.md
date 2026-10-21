# Anomaly Classifier

Synthesize all evidence to classify the anomaly as confirmed real signal, probable artifact, or indeterminate requiring further data.

## Inputs

- `instrument-verdict`: Instrument error assessment
- `processing-verdict`: Processing artifact assessment
- `mechanism-candidates`: Candidate physical mechanisms
- `significance-result`: Statistical significance assessment

## Outputs

- `anomaly-classification`: Real signal, artifact, or indeterminate
- `classification-rationale`: Structured argument for the classification

## Process

1. Weigh instrument and processing verdicts: if either confirms an artifact, classify accordingly.
2. If artifacts are ruled out, check whether a known mechanism fits and significance is met.
3. If significance is marginal or no mechanism fits, classify as indeterminate with next steps.
4. Produce a structured rationale citing each line of evidence.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
