# Transactional Template Builder

Build the templates for each transactional email.

## Inputs

- `email-inventory`: The list of transactional emails
- `application-context`: The application for branding context

## Outputs

- `transactional-templates`: Templates for each email with dynamic variable placeholders
- `template-test-results`: Rendering test results across email clients

## Process

1. Design the base transactional template (clean, minimal, fast-loading).
2. Build each email template with the required dynamic variables (user name, order ID, amount, link, etc.).
3. Test rendering across email clients.
4. Verify that all dynamic variables render correctly with sample data.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
