# Email Template Assembler

Assemble the master templates from components for each email type.

## Inputs

- `component-library`: The reusable components
- `email-types`: The email types needing templates
- `accessibility-rules`: Accessibility requirements

## Outputs

- `master-templates`: One master template per email type, assembled from components and tested
- `template-design-system`: The complete design system document with components, templates, and usage rules

## Process

1. Assemble the newsletter template: header, hero, 2 to 3 content blocks, CTA, footer.
2. Assemble the transactional template: header, single content block, CTA, footer.
3. Assemble the promotional template: header, hero, offer block, CTA, footer.
4. Run the full rendering test suite across clients and compile the design system document.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
