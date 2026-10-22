# Cancellation Policy Setup

Define the cancellation, rescheduling, and no-show policies for the booking system.

## Inputs

- `notification-templates`: Notification templates that will reference the policy
- `service-catalog`: Services catalog for policy variation by service type

## Outputs

- `cancellation-policy`: The published cancellation, rescheduling, and no-show policy
- `booking-system-document`: Complete booking system setup document combining all configuration

## Process

1. Define the cancellation window (e.g., free cancellation up to 24 hours before, fee after that).
2. Define the rescheduling rules (how many times, how far in advance, same-day allowed or not).
3. Define the no-show policy (fee, automatic rebooking, follow-up action).
4. Publish the policy on the booking page and include it in the confirmation notification.
5. Compile the complete booking system setup document: service catalog, availability rules, booking page, notifications, and policies.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
