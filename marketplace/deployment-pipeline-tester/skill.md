# Deployment Pipeline Tester

Test the deployment pipeline end to end including rollback to validate it works as designed.

## Inputs

- `healthcheck-config`: Health check configuration
- `automation-rules`: Automated deployment rules

## Outputs

- `pipeline-test-results`: Results of the end-to-end deployment test
- `rollback-test-results`: Results of the rollback test

## Process

1. Deploy a test version through the full pipeline
2. Verify health checks trigger correctly during deployment
3. Simulate a failure to test the rollback procedure
4. Measure the total rollback time against the target

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
