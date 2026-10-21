# Background Script Message Audit

Audit background script message handlers for authentication bypass, privilege escalation, and injection attacks.

## Inputs

- `extension-source`: Path to the unpacked extension source
- `injection-findings`: Content script injection findings

## Outputs

- `message-handler-findings`: Vulnerabilities in message passing between components
- `privilege-escalation-paths`: Identified paths from content script to background privileges

## Process

1. Map all chrome.runtime.onMessage and chrome.runtime.onConnect listeners
2. Check for sender origin validation on incoming messages
3. Test for command injection through message parameters
4. Identify privilege escalation from content script context to background page context

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
