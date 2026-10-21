# Flashcard Generator

**One-line description:** Process base_flashcards, complete_flashcard_set, concept_count to produce base_card_count, base_flashcards, complete_flashcard_set.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `base_flashcards` (string, required): Input for base flashcards.
- `complete_flashcard_set` (string, required): Input for complete flashcard set.
- `concept_count` (string, required): Input for concept count.
- `concept_inventory` (string, required): Input for concept inventory.
- `coverage_estimate` (string, required): Input for coverage estimate.
- `deck_size_preference` (string, required): Input for deck size preference.
- `elaboration_flashcards` (string, required): Input for elaboration flashcards.
- `example_flashcards` (string, required): Input for example flashcards.
- `include_elaboration` (string, required): Input for include elaboration.
- `include_examples` (string, required): Input for include examples.
- `interleaving_style` (string, required): Input for interleaving style.
- `learning_sequence` (string, required): Input for learning sequence.
- `material_domain` (string, required): Input for material domain.
- `prerequisite_graph` (string, required): Input for prerequisite graph.
- `spaced_repetition_schedule` (string, required): Input for spaced repetition schedule.
- `study_material` (string, required): Input for study material.
- `target_audience` (string, required): Input for target audience.

---

## Outputs

- `base_card_count` (object): Base Card Count.
- `base_flashcards` (object): Base Flashcards.
- `complete_flashcard_set` (object): Complete Flashcard Set.
- `concept_count` (object): Concept Count.
- `concept_inventory` (object): Concept Inventory.
- `coverage_estimate` (object): Coverage Estimate.
- `deck_metadata` (object): Deck Metadata.
- `deck_split_info` (object): Deck Split Info.
- `difficulty_distribution_base` (object): Difficulty Distribution Base.
- `elaboration_card_count` (object): Elaboration Card Count.
- `elaboration_flashcards` (object): Elaboration Flashcards.
- `enrichment_card_count` (object): Enrichment Card Count.
- `estimated_study_hours` (object): Estimated Study Hours.
- `example_card_count` (object): Example Card Count.
- `example_flashcards` (object): Example Flashcards.
- `first_session_duration_minutes` (object): First Session Duration Minutes.
- `flashcard_set` (object): Flashcard Set.
- `learning_sequence` (object): Learning Sequence.
- `prerequisite_graph` (object): Prerequisite Graph.
- `quality_report` (object): Quality Report.
- `recommended_daily_cards` (object): Recommended Daily Cards.
- `sequence_validation` (object): Sequence Validation.
- `session_breakdown` (object): Session Breakdown.
- `spaced_repetition_schedule` (object): Spaced Repetition Schedule.
- `study_load_validation` (object): Study Load Validation.

---

## Worked Example

### Entry Criteria

All required inputs are provided and validated.

### Actions

## Phase 1: Analyze

Examine the provided inputs and extract key information.

### Quality Gate

All inputs parsed. No missing required fields.

### Actions

## Phase 2: Process

Apply domain logic to transform inputs into structured outputs.

### Quality Gate

All outputs populated. No empty required fields.

### Output

Return the structured result containing `base_card_count`, `base_flashcards`, `complete_flashcard_set`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
