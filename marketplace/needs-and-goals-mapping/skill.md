# Needs And Goals Mapping

Map the user's stated needs, pains, and goals to the domains and chains available in the library.

## Inputs

- `user-role`: What the user does
- `user-industry`: Their domain or industry
- `experience-level`: Beginner, intermediate, or experienced
- `current-situation`: What they are dealing with right now

## Outputs

- `identified-needs`: List of specific needs or problems the user described, each tagged to one or more library domains
- `matched-domains`: The library domains most relevant to this user, ranked by relevance
- `matched-chains`: Specific chains that address the user's stated needs, with a one-line explanation of why each matches

## Process

1. List the distinct needs or problems from the user's description. If they were vague, ask one or two clarifying questions.
2. For each need, search the chain library by domain, tags, and description to find chains that address it.
3. Rank the matched domains by how many of the user's needs they cover.
4. For each matched chain, write one sentence explaining what it does and why it fits this user's situation.
5. If the user's needs span multiple domains, note the cross-domain connections (related_chains) that link them.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
