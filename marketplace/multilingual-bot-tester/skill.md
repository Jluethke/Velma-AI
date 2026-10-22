# Multilingual Bot Tester

Test each language path end to end and produce the localization plan document.

## Inputs

- `language-routing-config`: Language detection and routing configuration
- `translated-content`: Translated content for all languages

## Outputs

- `multilingual-test-results`: Test results for each language: intent accuracy, response correctness, cultural appropriateness
- `localization-document`: Complete localization document with language coverage, translations, routing, and test results

## Process

1. Run the full test suite in each supported language.
2. Verify intent recognition accuracy per language.
3. Check response correctness and cultural appropriateness with native speakers.
4. Compile the localization document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
