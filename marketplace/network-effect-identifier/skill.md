# Network Effect Identifier

Determine if a network effect exists and what type it is.

## Inputs

- `product-description`: What the product or service does
- `user-interaction-model`: How users interact with each other or with the product's content

## Outputs

- `network-effect-type`: The type of network effect: direct (users interact with each other, e.g., phone network), indirect (users benefit from complementary supply, e.g., marketplace), data (more usage improves the product, e.g., recommendation engine), or none
- `effect-strength-assessment`: How strong the effect is: does adding 10% more users create a noticeable improvement for existing users?

## Process

1. Ask: does the product become more valuable as more people use it? If adding 100 users makes the product better for the existing 1000, there is a network effect. If not, the value is independent of the user count.
2. Classify the type: direct (users communicate or transact with each other), indirect (more buyers attract more sellers and vice versa), or data (more usage data improves recommendations, search results, or predictions).
3. Assess the strength: is the effect strong enough that users notice? A marketplace with 10 sellers vs. 100 sellers has a strong effect. A tool where users work independently has a weak or absent effect.
4. If there is no network effect, growth must be driven by product quality and marketing, not by the user base itself. This is not bad. It just means the growth model is different.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
