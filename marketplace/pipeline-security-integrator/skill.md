# Pipeline Security Integrator

Integrate the configured security tools into the CI/CD pipeline with quality gates.

## Inputs

- `tool-configurations`: Configuration files for each selected security tool
- `application-profile`: Application type and CI/CD platform in use

## Outputs

- `pipeline-definition`: Updated pipeline definition with security stages and quality gates
- `gate-criteria`: Pass/fail criteria for each quality gate

## Process

1. Add each security tool as a pipeline stage at the appropriate point (SAST at build, DAST at deploy, SCA at dependency install).
2. Define quality gate criteria: which severity levels block the pipeline.
3. Test the pipeline with a known-vulnerable test project to verify gates trigger correctly.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
