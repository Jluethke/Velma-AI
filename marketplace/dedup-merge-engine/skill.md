# Dedup Merge Engine

Build the logic for identifying and merging duplicate contact records, which accumulate as people change emails, phone numbers, and companies.

## Inputs

- `verification-schedule`: When fields get checked
- `event-triggers`: Events that trigger verification

## Outputs

- `dedup-rules`: The matching rules for identifying potential duplicates (name similarity, shared email domain, shared phone number, shared company)
- `merge-protocol`: How to merge two records into one: which fields to keep, how to preserve interaction history from both records, and how to handle conflicts

## Process

1. Define matching rules with confidence tiers. High confidence: exact email match OR exact phone match (these are almost certainly the same person). Medium confidence: same first name AND same company AND similar last name (catches name misspellings). Low confidence: same last name AND same city AND similar job title (may be the same person or may be a relative/colleague). Only auto-merge high confidence matches; present medium and low for manual review.
2. Design the merge protocol. For each field, keep the most recently verified value. For interaction history, concatenate from both records with a merge marker. For relationship scores, keep the higher score. For lifecycle stage, keep the higher stage. For tags and notes, union from both records.
3. Handle the 'same person, different role' case: someone you know personally AND professionally may appear as two contacts (personal email and work email). These should merge into a single record with both email addresses, not stay as separate records that get separate follow-up cadences.
4. Set a dedup cadence: run the matching rules monthly. New duplicates appear when you add contacts from a new source (conference leads, email imports, social media connections) that overlaps with existing records. Also run dedup after any bulk import.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
