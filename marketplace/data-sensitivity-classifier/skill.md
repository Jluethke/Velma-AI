# Data Sensitivity Classifier

Identify all data types the system will handle and classify each by sensitivity level.

## Inputs

- `system-description`: Description of the system being built, its purpose, and its users
- `data-flow-diagrams`: Diagrams showing how data moves through the system

## Outputs

- `data-classification`: Each data type classified by sensitivity (public, internal, confidential, restricted)
- `data-handling-rules`: Required handling rules per sensitivity level

## Process

1. List all data types the system will collect, process, store, and transmit.
2. Classify each by sensitivity using the organization's data classification policy.
3. Document the required handling rules (encryption, access control, retention) per level.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
