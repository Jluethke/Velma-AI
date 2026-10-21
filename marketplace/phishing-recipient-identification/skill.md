# Phishing Recipient Identification

Identify all recipients who received the phishing email and who interacted with it.

## Inputs

- `email-metadata`: Sender, subject, and other matching criteria
- `ioc-list`: URLs and domains from the phishing email

## Outputs

- `recipient-list`: All users who received the phishing email
- `interaction-list`: Users who clicked links, opened attachments, or submitted credentials

## Process

1. Search the mail system for all deliveries matching the phishing email (sender, subject, message-ID)
2. Check web proxy or DNS logs for connections to the phishing URLs
3. Check endpoint telemetry for attachment execution
4. Compile the list of users who received and who interacted

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
