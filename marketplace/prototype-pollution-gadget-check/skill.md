# Prototype Pollution Gadget Check

Check for framework-specific gadgets that amplify prototype pollution to higher impact.

## Inputs

- `dos-results`: DoS results
- `merge-operations`: Merge operations identified

## Outputs

- `gadget-findings`: Framework gadgets that amplify pollution impact
- `framework-specific-risks`: Risks specific to the frameworks in use

## Process

1. Check for known gadgets in Express, Handlebars, Pug, EJS, and lodash
2. Test for property injection that triggers template compilation
3. Document each gadget with its required polluted property and impact

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
