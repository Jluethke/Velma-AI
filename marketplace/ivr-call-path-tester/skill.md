# Ivr Call Path Tester

Test all IVR call paths and produce the IVR design document.

## Inputs

- `routing-config`: Routing rules
- `ivr-prompts`: Written prompts

## Outputs

- `call-path-test-results`: Results of testing each path through the IVR, noting any dead ends or loops
- `ivr-design-document`: Complete IVR design document with menu tree, prompts, routing, and test results

## Process

1. Walk each call path from entry to resolution, testing every menu option.
2. Verify that no path leads to a dead end or infinite loop.
3. Test the error paths: invalid input, timeout, and maximum retries.
4. Compile the IVR design document with the menu tree, prompts, routing config, and test results.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
