# Reactivation Strategy Assigner

Assign a specific reactivation strategy to each segment, calibrated to the effort justified by the RFV score.

## Inputs

- `rfv-scores`: Recency, frequency, value scores per contact
- `rfv-segments`: Contacts in high, medium, or low tiers

## Outputs

- `reactivation-plans`: Per-segment reactivation strategy with channel, message type, timing, and escalation sequence
- `release-criteria`: When to stop trying and release a contact from the reactivation funnel

## Process

1. High-RFV strategy: personal, 1-to-1 outreach. Reference the last specific conversation. Offer something of value (an introduction, a resource, an insight relevant to their current situation). Use their preferred channel (from historical data). Follow up once at 14 days if no response. This segment justifies 15-30 minutes of prep per contact.
2. Medium-RFV strategy: personalized but scalable outreach. Use a template that includes one personalized element (their name, their company's recent news, a reference to shared context). Send on a channel where they historically responded. Follow up once at 21 days. This segment gets 5 minutes of prep per contact.
3. Low-RFV strategy: batch communication. Add to a re-engagement email sequence or social media interaction (comment on their posts, like their updates). If no engagement after 60 days, release the contact to the 'lost' stage. Do not invest personal effort. This segment gets zero individual prep.
4. Define release criteria: a contact exits the reactivation funnel when they (a) respond (move back to active lifecycle stage), (b) explicitly ask to be removed, or (c) do not respond after completing the full sequence for their tier. Released contacts get a 6-month or 12-month re-evaluation flag, not permanent deletion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
