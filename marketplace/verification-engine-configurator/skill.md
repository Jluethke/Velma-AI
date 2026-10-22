# Verification Engine Configurator

Configure the verification engine thresholds and decision logic.

## Inputs

- `enrollment-flow`: How voiceprints are collected
- `authentication-requirements`: Acceptable false accept and false reject rates

## Outputs

- `verification-config`: Thresholds, decision logic, and fallback authentication for low-confidence scores
- `security-policy`: Policy for score handling, step-up authentication, and data retention

## Process

1. Set the score threshold to balance false accept rate against false reject rate.
2. Configure step-up authentication for borderline scores (knowledge questions, OTP).
3. Define the data retention and deletion policies for voiceprints.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
