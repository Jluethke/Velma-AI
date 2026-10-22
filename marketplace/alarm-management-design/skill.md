# Alarm Management Design

Design the alarm system following ISA-18.2 to prevent alarm flooding and ensure operator response.

## Inputs

- `control-structure`: Control loops and safety systems
- `process-objectives`: Safety, environmental, and operational limits

## Outputs

- `alarm-rationalization`: Rationalized alarm list with setpoints, priorities, and response procedures
- `alarm-performance-targets`: Target alarm rate, standing alarm count, and response metrics

## Process

1. Start from the master alarm database and rationalize: every alarm must have a defined purpose, a unique response, a sufficient time to respond, and a consequence of inaction. If two alarms have the same response, consolidate. If an alarm has no defined operator action, it should not be an alarm (make it an event or remove it).
2. Set alarm priorities per ISA-18.2: critical (immediate threat to life, environment, or major equipment), high (action required within minutes), medium (action required within 15 to 30 minutes), low (action required within shift). Target distribution: less than 5% critical, 15% high, 30% medium, 50% low.
3. Set alarm setpoints with proper deadband: the alarm should activate early enough that the operator has time to diagnose and respond before the process reaches the safety limit. Deadband prevents chattering: typically 1% to 3% of span. One-sided alarms (high-only or low-only) unless both directions have different consequences.
4. Design for target alarm rate: ISA-18.2 recommends a maximum of 6 alarms per operator per hour in normal operation, 10 per hour during upsets. Standing alarms (always active, no action possible) should be zero; any standing alarm indicates a design issue or stale configuration.
5. Implement alarm suppression for known conditions: suppress downstream alarms when the root cause alarm is already active (state-based alarming), suppress alarms during planned transitions (e.g., startup, shutdown), and suppress alarms for equipment that is out of service. Never suppress safety-related alarms.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
