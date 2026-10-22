# Ongoing Elasticity Monitoring

Monitor elasticity over time because it changes with market conditions, competition, and product evolution.

## Inputs

- `elasticity-coefficient`: The measured elasticity
- `keep-or-revert-decision`: The decision made

## Outputs

- `monitoring-plan`: How to detect shifts in elasticity without running formal tests (churn rate changes, conversion rate trends, competitive price movements)
- `retest-schedule`: When to re-run the elasticity test (annually, or when market conditions change significantly)

## Process

1. Set up ongoing monitoring of the proxy signals: conversion rate trend, churn rate trend, and price-related support tickets or objections.
2. If conversion rate starts declining without other changes, elasticity may be increasing (customers becoming more price-sensitive). This could be caused by new competitors, economic changes, or declining perceived value.
3. Schedule a formal re-test annually or after significant market changes.
4. Over time, build a historical record of elasticity measurements. This gives you a model of how your customers respond to pricing, which informs all future pricing decisions.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
