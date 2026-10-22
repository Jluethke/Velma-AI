# Rating Distribution Analyzer

Before calibration, analyze the rating distributions by manager. For each manager, plot the distribution of ratings they gave. Identify the outliers: managers whose distributions are more than one standard deviation from the company norm. These are the systematic over-raters and under-raters.

## Inputs

- `performance-ratings-data`: All performance ratings for the current cycle, organized by manager
- `company-rating-scale`: The rating scale used (e.g., 1-5, exceeds/meets/below)

## Outputs

- `manager-distributions`: The rating distribution for each manager, compared against the company-wide distribution
- `systematic-bias-flags`: Managers whose distributions are more than one standard deviation from the norm, flagged as potential over-raters or under-raters

## Process

1. Calculate the company-wide rating distribution: what percentage of employees received each rating level?
2. For each manager, calculate their distribution. Plot both on the same chart.
3. Flag managers whose mean rating is more than one standard deviation above (over-rater) or below (under-rater) the company mean.
4. Note: a skewed distribution is not necessarily wrong. A manager may genuinely have a strong team. But the flag prompts the calibration discussion.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
