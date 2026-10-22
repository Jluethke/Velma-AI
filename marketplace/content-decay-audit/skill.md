# Content Decay Audit

Audit your existing content library and classify each piece as compounding or decaying based on its traffic and engagement trajectory.

## Inputs

- `content-library`: List of all published content (blog posts, articles, videos, podcasts, social posts) with publish dates
- `analytics-data`: Traffic, engagement, and conversion data per piece over time (at least 6 months of history)

## Outputs

- `content-classification`: Each piece classified as compounding (traffic stable or growing after 90 days) or decaying (traffic declining after 90 days)
- `compound-decay-ratio`: The percentage of your library that is compounding vs decaying. Most libraries are 10-20% compounding, 80-90% decaying.

## Process

1. For each piece of content, plot the traffic over time from publish date to now. If traffic is stable or growing after 90 days, it is compounding. If traffic peaked within 7 days and has been declining since, it is decaying.
2. Calculate the ratio. A healthy content operation has at least 30% compounding content. Below 20% means you are on a treadmill: you must constantly produce new content just to maintain traffic.
3. For each compounding piece, note what it has in common with other compounding pieces: topic type, format, search intent, and structure.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
