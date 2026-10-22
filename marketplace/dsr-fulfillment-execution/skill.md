# Dsr Fulfillment Execution

Execute the requested action (export, delete, correct) across all systems.

## Inputs

- `data-inventory`: Inventory of personal data across systems
- `request-type`: The type of action to perform

## Outputs

- `fulfillment-log`: Record of actions taken in each system (exported, deleted, corrected)
- `exceptions`: Any data that could not be processed and the reason (legal hold, regulatory retention)

## Process

1. For access or portability requests, export the data in a machine-readable format.
2. For deletion requests, delete or anonymize the data in each system, respecting legal retention requirements.
3. For correction requests, update the data in each system and verify the correction.
4. Log each action taken, the system affected, and the timestamp.
5. Document any exceptions where data was retained and the legal basis for retention.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
