# Checkout Friction Tester

Test the checkout flow for friction points and abandonment triggers.

## Inputs

- `storefront-url`: Storefront URL
- `funnel-analysis`: Funnel analysis with checkout drop-off data

## Outputs

- `checkout-issues`: Identified checkout friction points
- `checkout-recommendations`: Recommended checkout improvements

## Process

1. Walk through the checkout as a guest and registered user.
2. Count the steps and form fields required.
3. Test payment method availability and error handling.
4. Identify surprise costs (shipping, tax revealed late).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
