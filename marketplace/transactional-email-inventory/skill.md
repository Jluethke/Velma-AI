# Transactional Email Inventory

Inventory all transactional email types needed by the application or business.

## Inputs

- `application-context`: The product or service that sends transactional emails
- `user-journey-map`: The key user actions that trigger emails

## Outputs

- `email-inventory`: List of all transactional email types with trigger events, recipient, and priority
- `content-requirements`: Content requirements for each email (data fields, personalization, legal copy)

## Process

1. Map the user journey to identify every trigger point (signup, purchase, password reset, shipping, renewal, cancellation).
2. Classify each email by category (account, order, notification, security).
3. Define the priority and delivery SLA for each (security emails within seconds, order confirmations within minutes).
4. Document the dynamic data fields needed in each email.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
