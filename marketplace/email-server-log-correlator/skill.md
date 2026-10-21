# Email Server Log Correlator

Correlate email evidence with server-side logs for delivery and access records.

## Inputs

- `preserved-emails`: The email evidence
- `authentication-results`: Authentication verification results

## Outputs

- `server-correlation`: Correlated server log entries for each message
- `access-records`: Records of mailbox access (login, forwarding, delegation)

## Process

1. Match messages to mail server transport logs by Message-ID
2. Check for forwarding rules or delegates that may have accessed messages
3. Identify mailbox login events and their source IPs
4. Detect any message deletion or modification events in server logs

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
