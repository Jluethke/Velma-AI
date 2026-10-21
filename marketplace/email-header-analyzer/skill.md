# Email Header Analyzer

Extract and analyze email headers for routing, authentication, and origin information.

## Inputs

- `preserved-emails`: The preserved email data
- `target-messages`: Specific messages to analyze in detail

## Outputs

- `header-analysis`: Parsed headers showing routing path and authentication results
- `origin-assessment`: Assessment of the true origin of each message

## Process

1. Parse the Received headers to trace the routing path
2. Extract the originating IP address and sending MTA
3. Analyze the Message-ID for sending system clues
4. Check for header inconsistencies indicating manipulation

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
