# Sbom Cicd Integrator

Integrate SBOM generation into the CI/CD pipeline for continuous and automatic updates on every build.

## Inputs

- `enriched-sbom`: SBOM with vulnerability and license annotations
- `project-source`: Path to the project source code and CI/CD configuration

## Outputs

- `pipeline-config`: Updated CI/CD pipeline configuration with SBOM generation step
- `integration-test-result`: Result of running the SBOM step in the pipeline

## Process

1. Add the SBOM generation tool as a pipeline step triggered on each build.
2. Configure the step to fail the build if critical vulnerabilities or license violations are found.
3. Test the integration by running a full pipeline execution.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
