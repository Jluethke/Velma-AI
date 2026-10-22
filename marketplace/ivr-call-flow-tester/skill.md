# Ivr Call Flow Tester

Test the IVR call flows end to end.

## Inputs

- `recording-files`: The audio recordings
- `recording-inventory`: Recording inventory and menu mapping

## Outputs

- `test-results`: Results of testing every menu path (correct routing, audio quality, timeout handling)
- `ivr-deployment-document`: Complete IVR deployment document with menu tree, scripts, recordings, and test results

## Process

1. Test every path through the menu tree by calling the system.
2. Verify each option routes to the correct destination.
3. Test the error handling: press an invalid key, wait through timeout, exceed retry limit.
4. Test the after-hours and holiday routing.
5. Compile the deployment document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
