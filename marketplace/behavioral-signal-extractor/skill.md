# Behavioral Signal Extractor

Extract behavioral signals from interaction history that reveal each contact's communication patterns.

## Inputs

- `interaction-history`: Timestamped interaction log across all channels
- `channel-list`: All communication channels used (email, phone, text, social media, in-person, video call)

## Outputs

- `behavioral-profiles`: Per-contact profile with: preferred channel, average response time, initiation ratio, peak engagement times, topic keywords, seasonal patterns
- `signal-confidence`: For each behavioral attribute, the confidence level based on sample size (5+ data points = high, 2-4 = medium, 1 = low)

## Process

1. Extract channel preference: for each contact, count interactions by channel and identify the channel with the highest response rate (not the highest volume, because you may be emailing them when they prefer text). If response rate on text is 95% and email is 40%, text is their preferred channel regardless of how many emails you have sent.
2. Calculate response latency: median time from your message to their reply, by channel. Some people respond to texts in minutes but take days on email. The latency tells you which channel to use for time-sensitive communication and which for asynchronous topics.
3. Determine initiation patterns: do they proactively reach out, or do they only respond to your outreach? What triggers their proactive outreach (specific topics, specific times of year, specific events)? A contact who only initiates when they need something is not disengaged; they have a transactional communication pattern.
4. Identify seasonal patterns: some contacts are active in Q1 and Q3 (budget planning cycles), some are active in summer (conference season), some go dark in December (holiday). These patterns are invisible in aggregate but obvious when you plot individual interaction timelines.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
