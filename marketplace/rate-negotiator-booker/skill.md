# Rate Negotiator Booker

Negotiate the rate and book the carrier.

## Inputs

- `carrier-options`: Available carriers
- `carrier-scores`: Carrier scores

## Outputs

- `booking-confirmation`: Confirmed booking with carrier, rate, and terms
- `rate-confirmation-doc`: Rate confirmation document signed by both parties

## Process

1. Contact the top-ranked carrier and negotiate the rate.
2. Confirm equipment type, pickup time, and delivery expectations.
3. Issue the rate confirmation with all terms (accessorial charges, detention, layover).
4. Get the carrier's signed acceptance.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
