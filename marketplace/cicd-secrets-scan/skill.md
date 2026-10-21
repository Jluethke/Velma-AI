# Cicd Secrets Scan

Check for secrets exposed in environment variables, build logs, configuration files, and pipeline artifacts.

## Inputs

- `pipeline-inventory`: Catalog of pipelines and their configurations
- `build-system-access`: Access to read build logs and configurations

## Outputs

- `secrets-findings`: List of exposed or poorly protected secrets with locations
- `secret-management-assessment`: Evaluation of secret storage and rotation practices

## Process

1. Scan pipeline configuration files for hardcoded secrets, tokens, and API keys
2. Review build logs for leaked credentials or sensitive values
3. Check environment variable masking and secret injection mechanisms
4. Assess secret rotation policies and practices

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
