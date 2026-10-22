# Network Density Scorer

Calculate network density and diversity scores that quantify the overall health and strategic value of your network.

## Inputs

- `structural-holes`: Gaps between clusters
- `bridging-opportunities`: Potential introductions to fill gaps

## Outputs

- `density-score`: How interconnected your network is (ratio of actual connections to possible connections)
- `diversity-score`: How diverse your network is across industries, roles, seniority levels, and geographies

## Process

1. Calculate density: actual edges divided by possible edges (n*(n-1)/2 for an undirected graph). Low density (below 0.1) means your contacts mostly do not know each other, which gives you brokerage power but limited group benefits. High density (above 0.4) means everyone knows everyone, which provides trust and support but limited new information.
2. Calculate diversity across 4 axes: industry (how many different industries are represented), role (how many different functional roles), seniority (mix of junior, mid, and senior contacts), and geography (how many distinct metro areas or regions). Score each axis on 0-10 using an entropy measure (even distribution = high score, one-dominant-category = low score).
3. Identify the diversity gaps. If 80% of your contacts are in one industry, you are deep but narrow. If 90% are at your seniority level, you lack mentors and mentees. The gaps point directly to where targeted relationship-building would add the most value.
4. Combine into a network health score: average of density and diversity scores. But do not optimize for the score. A salesperson's network should be low-density and high-diversity (many disconnected clusters across industries). A community organizer's network should be high-density and moderate-diversity (tight-knit but spanning different groups). The ideal depends on your goals.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
