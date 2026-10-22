# Fault Diagnostician

Diagnose the fault through remote testing and analysis.

## Inputs

- `classified-ticket`: Classified trouble ticket
- `initial-diagnosis`: Initial assessment

## Outputs

- `fault-diagnosis`: Identified fault location and cause
- `repair-plan`: Plan for fixing the fault (remote fix, dispatch, vendor escalation)

## Process

1. Run remote diagnostic tests (ping, traceroute, SNMP polling, loopback tests).
2. Isolate the fault to a specific network segment or device.
3. Determine the root cause (hardware failure, configuration error, capacity, external damage).
4. Decide whether the fix can be applied remotely or requires a field dispatch.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
