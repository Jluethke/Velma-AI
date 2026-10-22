# Phone Tree Tester

Test every path through the phone tree and produce the deployment document.

## Inputs

- `prompt-scripts`: All prompts to test
- `routing-rules`: Expected routing to verify

## Outputs

- `test-results`: Pass/fail for each path with issues found
- `phone-tree-document`: Complete phone tree documentation with menus, prompts, routing, and test results

## Process

1. Call through every menu path and verify the routing.
2. Test business hours, after-hours, and holiday routing.
3. Verify hold times, callback, and failover behavior.
4. Compile the phone tree document for operations.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
