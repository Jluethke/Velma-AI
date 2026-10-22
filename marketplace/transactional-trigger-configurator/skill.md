# Transactional Trigger Configurator

Configure the sending service and event triggers for each transactional email.

## Inputs

- `email-content`: The written email content
- `personalization-map`: Dynamic field mappings

## Outputs

- `trigger-configuration`: Configured triggers linking application events to email sends
- `test-results`: Results of trigger testing for each email type

## Process

1. Configure the API or webhook integration between the application and the email service.
2. Map each application event to its corresponding email template.
3. Set the sending parameters (from address, reply-to, priority, rate limits).
4. Test each trigger by simulating the application event and verifying delivery.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
