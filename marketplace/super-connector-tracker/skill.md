# Super Connector Tracker

Track referral chains to find super-connectors: the small percentage of referrers who generate a disproportionate share of referrals.

## Inputs

- `referral-mechanism-spec`: The referral flow design
- `motivation-map`: Why customers refer

## Outputs

- `tracking-schema`: Data model for tracking referral chains: who referred whom, when, whether it converted, and the chain depth
- `super-connector-criteria`: The threshold that defines a super-connector (top 5% by referral volume or chain depth)

## Process

1. Build the tracking: each referral link is unique to the referrer. When a referral converts, log the chain: referrer, recipient, timestamp, and whether the recipient also refers.
2. Calculate referral depth: how many levels deep does a chain go? A chain of 1 (direct referral) is normal. A chain of 3 or more indicates a viral loop is working.
3. Identify super-connectors: the people who generate 5 or more referrals, or whose referrals generate further referrals. These people are 10-50x more valuable than average customers.
4. Design differentiated treatment for super-connectors: early access, direct communication channel, recognition, or increased rewards. The goal is to keep them active.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
