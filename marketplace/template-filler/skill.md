# Template Filler

> **Starter Skill** — Free to use. Royalties to original creator on derivatives. Build on this.

Foundation pattern for populating document templates with contextual data. Takes a template with placeholders and a context object, intelligently fills each placeholder using available context, infers missing values from surrounding data, flags values it is unsure about, and produces the completed document. The key differentiator from simple find-and-replace: this skill understands context and can infer, adapt, and flag rather than blindly substituting. Fork this for: contract generators, invoice builders, form fillers, mail merge, report generators, proposal writers, etc.

## Execution Pattern: ORPA Loop

```
OBSERVE --> Parse template placeholders, inventory available context data
REASON  --> Match placeholders to context, infer missing values, flag uncertainties
PLAN    --> Fill all placeholders, format values, validate completeness
ACT     --> Output the completed document with confidence and review flags
     \                                                              /
      +--- Missing critical value or format mismatch --- loop OBSERVE +
```

## Inputs

- `template`: string -- The document template with placeholders (e.g., `{{company_name}}`, `{date}`, `[AMOUNT]`, or any consistent placeholder syntax)
- `context`: object -- Available data to fill placeholders. Keys may or may not exactly match placeholder names.
- `format_rules`: object -- Optional formatting instructions: date format, currency format, number precision, capitalization rules
- `strict_mode`: boolean -- If true, never infer values -- only fill exact matches and flag everything else. Default: false.

## Outputs

- `filled_document`: string -- The completed document with all placeholders resolved
- `fill_report`: list[object] -- Per-placeholder report: `{placeholder, value, source ("exact"|"inferred"|"default"|"unfilled"), confidence (0.0-1.0)}`
- `review_flags`: list[object] -- Placeholders that need human review: `{placeholder, reason, suggested_value}`
- `unfilled_count`: number -- Count of placeholders that could not be resolved

---

## Execution

### OBSERVE: Parse Template and Context

**Entry criteria:** A template and context object are provided.

**Actions:**
1. Detect placeholder syntax. Scan the template for placeholder patterns. Support common formats: `{{name}}`, `{name}`, `[NAME]`, `<name>`, `$name`, `%name%`, `<<name>>`. Identify the dominant pattern and extract all unique placeholders.
2. Inventory placeholders. List every unique placeholder with: name, number of occurrences, surrounding text (for context clues about what the placeholder represents).
3. Inventory context keys. List every key in the context object with: key name, value type, value preview. Note nested objects and arrays.
4. Detect format requirements from the template. If a placeholder appears next to a dollar sign, it probably needs currency formatting. If it appears in a date string, it needs date formatting. If it appears in uppercase context, the value may need capitalization.

**Output:** Placeholder inventory, context key inventory, detected format requirements, placeholder syntax pattern.

**Quality gate:** All unique placeholders are identified. Context keys are inventoried. Placeholder syntax is consistent or inconsistencies are noted.

---

### REASON: Match and Infer

**Entry criteria:** Placeholder and context inventories are complete.

**Actions:**
1. Exact match. For each placeholder, look for a context key with the same name (case-insensitive, ignoring underscores/hyphens/spaces). These get confidence 0.95+.
2. Semantic match. For unmatched placeholders, look for context keys that are synonyms or abbreviations. `{{company}}` matches context key `organization_name`. `{{phone}}` matches `contact_telephone`. These get confidence 0.7-0.9.
3. Infer from surrounding context. For still-unmatched placeholders, use the surrounding template text and other filled values to infer. If the template says "Dear {{recipient_name}}" and the context has `to_email: john@example.com`, infer "John" from the email. These get confidence 0.4-0.7.
4. Apply defaults. For low-priority placeholders that remain unfilled, apply sensible defaults if the context suggests them: today's date for `{{date}}`, the user's name for `{{prepared_by}}`. These get confidence 0.3-0.5 and are always flagged for review.
5. In strict_mode, skip steps 2-4 entirely. Only exact matches are filled; everything else is flagged as unfilled.
6. Flag uncertainties. Any fill with confidence below 0.7 gets added to review_flags with the reason and suggested value.

**Output:** Placeholder-to-value mapping with sources and confidence scores, review flags.

**Quality gate:** Every placeholder has a status: filled (with confidence) or unfilled. No placeholder is silently ignored.

---

### PLAN: Fill and Format

**Entry criteria:** Placeholder mapping is complete.

**Actions:**
1. Apply format rules. Before inserting values:
   - Dates: format to specified format (ISO, US, EU, or custom). Default to the format used elsewhere in the template.
   - Numbers: apply specified precision, thousands separators, and currency symbols.
   - Text: match the capitalization pattern of the placeholder context (ALL CAPS, Title Case, lowercase).
   - Lists: if the placeholder expects a list and the value is an array, format as comma-separated, bulleted, or numbered based on template context.
2. Fill placeholders. Replace each placeholder with its formatted value. For placeholders with multiple occurrences, ensure all instances are filled consistently.
3. Handle unfilled placeholders. Leave them visually distinct: wrap in `[NEEDS: placeholder_name]` or highlight with a comment. Do not silently delete them.
4. Validate the completed document. Read through the filled document for: grammatical coherence (does the filled value make grammatical sense in context?), formatting consistency, and logical consistency (does the filled date come after other dates in the document?).

**Output:** Filled document, fill report, validation results.

**Quality gate:** All filled values are properly formatted. Unfilled placeholders are visually flagged. No grammatical breaks from value insertion.

---

### ACT: Deliver the Completed Document

**Entry criteria:** Document is filled and validated.

**Actions:**
1. Output the filled_document.
2. Output the fill_report showing every placeholder, its value, source type, and confidence.
3. Output review_flags for placeholders needing human attention.
4. Output unfilled_count as a quick health metric.
5. If unfilled_count > 0, list the unfilled placeholders with the context clues available, so the user can provide the missing values.
6. Check for loop trigger: did filling reveal that a placeholder was misinterpreted (grammatical break, logical inconsistency)? If so, loop back to REASON with the correction.

**Output:** Complete filled document package.

**Quality gate:** filled_document is a valid document (no broken syntax). fill_report covers every placeholder. review_flags highlight all low-confidence fills.

## Exit Criteria

The skill is DONE when:
1. Every placeholder is either filled or explicitly flagged as unfilled
2. Filled values are properly formatted for their context
3. Low-confidence fills are flagged for human review
4. The completed document reads coherently
5. A fill report documents the source and confidence of every substitution

## Error Handling

| Phase | Failure Mode | Response |
|---|---|---|
| OBSERVE | No placeholders detected in template | **Escalate** -- ask if the template uses a custom placeholder syntax |
| OBSERVE | Context object is empty | **Escalate** -- ask for data to fill the template with |
| REASON | Critical placeholder has no match (e.g., `{{contract_value}}`) | **Flag** -- mark as unfilled and add to review_flags with high priority |
| REASON | Ambiguous match (context has two possible values for one placeholder) | **Flag** -- use the more specific match, note the alternative in review_flags |
| PLAN | Filled value breaks document grammar | **Adjust** -- try alternative formatting (singular/plural, with/without article) |
| PLAN | Template has conditional sections (if/else blocks) | **Adjust** -- evaluate conditions against context, include/exclude sections accordingly |

## State Persistence

Between runs, this skill accumulates:
- **Synonym maps**: placeholder name to context key mappings that have been confirmed (e.g., `company` = `organization_name`)
- **Format preferences**: per-template or per-user formatting preferences
- **Inference patterns**: successful inferences that can be reused (e.g., extracting first name from email address)

---

**License:** Free to use (price: 0 TRUST). Royalties apply to published derivatives.

Copyright 2024-present The Wayfinder Trust. All rights reserved.
