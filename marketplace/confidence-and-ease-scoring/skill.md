# Confidence And Ease Scoring

Add the Confidence and Ease dimensions to get the full ICE score.

## Inputs

- `impact-scores`: Impact scores for each feature
- `feature-list`: Feature descriptions

## Outputs

- `full-ice-scores`: Each feature with Impact (calculated above), Confidence (1-10: how sure are we about the impact estimate), and Ease (1-10: how easy is it to build)
- `ice-ranking`: All features ranked by Impact x Confidence x Ease

## Process

1. Score confidence (1-10): 10 = we have hard data (analytics, customer validation). 5 = we have qualitative evidence (customer interviews, support tickets). 1 = we are guessing. Low confidence scores pull down features that might be impactful but are unvalidated.
2. Score ease (1-10): 10 = trivial to build (a configuration change or a small UI tweak). 1 = requires months of engineering. Ease scores prevent high-impact features from being prioritized when they take so long that other features would produce more total impact in the same time.
3. Multiply Impact x Confidence x Ease. Rank all features by the result.
4. The top 5-10 features by ICE score are the strongest candidates for the next development cycle.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
