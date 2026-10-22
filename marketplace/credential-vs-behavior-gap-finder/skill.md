# Credential Vs Behavior Gap Finder

Compare what the job posting asks for against what the top performers actually do. Many listed credentials predict nothing, and several real requirements never appear in the posting.

## Inputs

- `differentiating-behaviors`: The behaviors that set top performers apart
- `hidden-skill-list`: The skills they use that the posting omits

## Outputs

- `posting-reality-gap`: The real requirements that the current posting leaves out
- `credential-noise-list`: The listed requirements that no top performer's success actually depends on

## Process

1. Lay the current job posting next to the differentiating behaviors and hidden skills.
2. Mark each posting requirement: does any top performer's success actually depend on it? If not, it is credential noise.
3. Mark each behavior or hidden skill the posting never mentions; these are the missing real requirements.
4. Produce two lists: the gap of real requirements absent from the posting, and the noise of listed requirements that predict nothing.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
