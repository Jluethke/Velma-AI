# Rfv Scorer

Score each dormant contact on recency, frequency, and value to determine who is worth reactivating and how much effort to invest.

## Inputs

- `dormant-list`: Dormant contacts with last interaction dates
- `interaction-summaries`: Last 5 interactions before dormancy

## Outputs

- `rfv-scores`: Each dormant contact scored on recency (how recently active), frequency (how often they engaged when active), and value (relationship value when active)
- `rfv-segments`: Contacts segmented into tiers: high-RFV (personal outreach), medium-RFV (targeted batch), low-RFV (light touch or release)

## Process

1. Score recency on a 1-5 scale: went dormant in the last 90 days = 5, 91-180 days = 4, 181-365 days = 3, 1-2 years = 2, over 2 years = 1. The score reflects how easily the relationship can be restarted, not just how recently it was active.
2. Score frequency on a 1-5 scale based on their interaction pattern when they were active. Weekly contact when active = 5, monthly = 4, quarterly = 3, semi-annual = 2, annual or less = 1. High-frequency contacts who go dormant are more notable (something changed) than low-frequency contacts who go dormant (this may be their normal pattern).
3. Score value on a 1-5 scale. Use your relationship scoring model if available. If not, assess by asking: what did this relationship produce when active? Introductions, insights, deals, emotional support, collaboration? Tangible mutual value = 5. One-way value (they helped you but you never reciprocated, or vice versa) = 3. Pleasant but not productive = 1.
4. Combine into an RFV composite: (recency * 0.3) + (frequency * 0.3) + (value * 0.4). Value gets the highest weight because a high-value contact dormant for 2 years is still worth more effort than a low-value contact dormant for 30 days. Segment: top 25% = high-RFV, middle 50% = medium-RFV, bottom 25% = low-RFV.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
