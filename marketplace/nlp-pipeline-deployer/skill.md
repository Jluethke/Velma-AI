# Nlp Pipeline Deployer

Deploy the NLP pipeline and produce the report.

## Inputs

- `trained-nlp-model`: The trained model
- `preprocessing-config`: Preprocessing pipeline configuration

## Outputs

- `deployed-nlp-pipeline`: The deployed NLP pipeline endpoint
- `nlp-pipeline-report`: Complete NLP pipeline report

## Process

1. Package the preprocessing and model into a single inference pipeline.
2. Deploy with input validation and error handling.
3. Set up monitoring for prediction distribution and latency.
4. Write the NLP pipeline report with methodology, results, and limitations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
