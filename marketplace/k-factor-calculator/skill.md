# K Factor Calculator

Calculate the K-factor: invitations per user times the invitation conversion rate.

## Inputs

- `referral-loop-map`: The referral loop structure
- `referral-data`: Data on invitations sent and converted (if available)

## Outputs

- `k-factor`: The viral coefficient: K = (invitations per user) x (conversion rate per invitation). K > 1 means viral growth.
- `k-factor-components`: The two components: invitation rate (what percentage of users invite, and how many invitations each) and conversion rate (what percentage of invited people become users)

## Process

1. Measure the invitation rate: what percentage of users send at least one invitation? Of those, how many invitations do they send on average?
2. Measure the conversion rate: of all invitations sent, what percentage result in a new user?
3. Calculate K: invitations per user (total invitations / total users) times conversion rate.
4. If K > 1: viral growth. Each user generates more than one new user. If K < 1: you need paid acquisition to grow. If K = 0.5: each user generates half a new user, which helps but does not sustain growth alone.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
