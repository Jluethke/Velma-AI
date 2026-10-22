# Segment Engagement Strategist

Design engagement strategies tailored to each behavioral segment so you communicate in the way each person is most likely to respond to.

## Inputs

- `behavioral-segments`: Named segments with characteristics
- `segment-sizes`: Contacts per segment and value distribution

## Outputs

- `segment-playbooks`: For each segment: preferred channel, optimal send time, ideal message length, follow-up interval, and content type that generates the highest response rate
- `channel-switching-rules`: When to switch channels within a segment (e.g., move from email to phone if email goes unanswered for X days)

## Process

1. Build a playbook for each segment. For 'Fast Async' contacts: use text or chat, keep messages under 100 words, expect a reply within hours, follow up at 7 days if no response. For 'Quarterly Sync' contacts: schedule a 30-minute call every 3 months, send a brief agenda beforehand, do not expect responses to interim emails. For 'Event Connectors': reach out 2 weeks before industry events, suggest meeting up, follow up within 48 hours after the event.
2. Define the channel escalation sequence for each segment. If the preferred channel gets no response, which channel to try next. For async-preferring contacts, escalate from text to email to phone. For sync-preferring contacts, escalate from phone to video to in-person. Never skip to a higher-effort channel without trying the preferred one first.
3. Set message length and format by segment. Some contacts respond to short direct messages ('Are you free Thursday?'). Others need context ('I have been thinking about the conversation we had about X, and I wanted to share Y because Z'). Match the format to the segment's observed preference, not your own communication style.
4. Build the A/B testing protocol: for segments with 10+ contacts, test variations (send time, message length, content type) and measure response rate. Over time, refine the playbooks from data rather than assumptions. For small segments, rely on individual behavioral profiles instead.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
