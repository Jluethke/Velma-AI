# Phishing Report Intake

Receive and triage a reported phishing email.

## Inputs

- `reported-email`: The phishing email sample or report from the user
- `reporter-info`: Who reported the email and when

## Outputs

- `triage-result`: Initial classification: confirmed phishing, suspicious, or benign
- `email-metadata`: Extracted headers, sender, subject, timestamp

## Process

1. Extract and record email headers, sender address, subject, and body
2. Check the sender against known threat intelligence feeds
3. Classify the email as confirmed phishing, suspicious, or benign
4. If confirmed or suspicious, escalate to full investigation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
