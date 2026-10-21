# Phishing Email Analysis

Analyze the phishing email content, links, and attachments in a sandbox.

## Inputs

- `reported-email`: The phishing email sample
- `email-metadata`: Extracted headers and sender info

## Outputs

- `ioc-list`: Indicators of compromise: URLs, domains, IPs, file hashes
- `payload-analysis`: Analysis of any malicious attachments or landing pages

## Process

1. Detonate any attachments in a sandbox environment and record behavior
2. Follow links in an isolated browser and capture the landing page
3. Extract all indicators of compromise (URLs, domains, IPs, file hashes)
4. Determine the attack objective (credential harvesting, malware delivery, BEC)

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
