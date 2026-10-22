# Language Detection Router Setup

Configure language detection and routing for the multilingual bot.

## Inputs

- `translated-content`: Translated content for all languages
- `target-languages`: Target languages and locales

## Outputs

- `language-routing-config`: Configuration for automatic language detection and routing to the correct language model
- `fallback-language-rules`: Rules for when language detection is uncertain or the language is unsupported

## Process

1. Configure automatic language detection from the user's first message.
2. Set up routing to the correct language-specific dialog and response set.
3. Define fallback behavior: ask the user to choose a language, or default to the primary language.
4. Handle code-switching (user switches language mid-conversation).

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
