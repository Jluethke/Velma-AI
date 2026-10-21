# Call Message Analyzer

Analyze call logs, SMS/MMS messages, and messaging application data.

## Inputs

- `extracted-data`: The device data extraction
- `case-context`: Investigation focus for targeted analysis

## Outputs

- `communication-analysis`: Analysis of calls, messages, and messaging app conversations
- `contact-network`: Map of communication patterns and key contacts

## Process

1. Parse call logs for numbers, durations, and timestamps
2. Extract SMS/MMS content and metadata
3. Analyze messaging app databases (WhatsApp, Signal, Telegram)
4. Build the contact communication network

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
