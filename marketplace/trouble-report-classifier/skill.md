# Trouble Report Classifier

Receive and classify the trouble report.

## Inputs

- `trouble-report`: The reported issue from the customer or monitoring system
- `service-record`: The affected service record and history

## Outputs

- `classified-ticket`: Ticket classified by type (voice, data, video, equipment), severity, and priority
- `initial-diagnosis`: Initial assessment based on symptoms and known issues

## Process

1. Log the trouble report with timestamp, reporter, and symptom description.
2. Classify by service type (voice, data, video) and component (access, transport, core, equipment).
3. Assign severity based on impact (number of users, service degradation level).
4. Check for known issues or recent changes that could explain the symptoms.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
