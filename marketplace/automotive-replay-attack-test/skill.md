# Automotive Replay Attack Test

Test for replay attack vulnerabilities on authorized test signals including key fob, TPMS, and CAN bus messages.

## Inputs

- `can-message-catalog`: CAN messages to test for replay
- `traffic-baseline`: Normal traffic patterns for comparison
- `telematics-findings`: Wireless interfaces for RF replay testing

## Outputs

- `replay-findings`: Replay attack vulnerabilities and results
- `automotive-security-report`: Final automotive security test report

## Process

1. Capture and replay CAN messages to test for state changes
2. Test key fob signal capture and replay in the authorized test environment
3. Check for rolling code implementation and counter synchronization
4. Compile all findings into the automotive security report with risk ratings

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
