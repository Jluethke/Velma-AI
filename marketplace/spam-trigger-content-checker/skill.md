# Spam Trigger Content Checker

Check email content for spam triggers that could hurt deliverability.

## Inputs

- `infrastructure-audit`: Sending infrastructure status

## Outputs

- `content-audit`: List of spam trigger issues found in recent sends (words, formatting, image ratio, link density)
- `content-guidelines`: Guidelines for avoiding spam triggers in future sends

## Process

1. Review recent email content for spam trigger words and phrases.
2. Check the text-to-image ratio (aim for at least 60% text).
3. Check link density and URL reputation.
4. Review the from name, subject line patterns, and preheader text.
5. Compile the content guidelines document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
