# Whitepaper To Social Threads

**One-line description:** Process body_tweets, campaign_goal, cta_tweets to produce body_tweets, cta_tweets, extracted_insights.

**Execution Pattern:** Phase Pipeline

---

## Inputs

- `body_tweets` (string, required): Input for body tweets.
- `campaign_goal` (string, required): Input for campaign goal.
- `cta_tweets` (string, required): Input for cta tweets.
- `extracted_insights` (string, required): Input for extracted insights.
- `formatted_threads` (string, required): Input for formatted threads.
- `hook_tweets` (string, required): Input for hook tweets.
- `include_cta` (string, required): Input for include cta.
- `include_visual_recommendations` (string, required): Input for include visual recommendations.
- `num_threads` (string, required): Input for num threads.
- `platform` (string, required): Input for platform.
- `quality_report` (string, required): Input for quality report.
- `target_audience` (string, required): Input for target audience.
- `thread_outlines` (string, required): Input for thread outlines.
- `tone` (string, required): Input for tone.
- `whitepaper_content` (string, required): Input for whitepaper content.

---

## Outputs

- `body_tweets` (object): Body Tweets.
- `cta_tweets` (object): Cta Tweets.
- `extracted_insights` (object): Extracted Insights.
- `formatted_threads` (object): Formatted Threads.
- `hook_tweets` (object): Hook Tweets.
- `publishing_schedule` (object): Publishing Schedule.
- `quality_report` (object): Quality Report.
- `thread_outlines` (object): Thread Outlines.
- `threads` (object): Threads.
- `visual_asset_recommendations` (object): Visual Asset Recommendations.

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

Return the structured result containing `body_tweets`, `cta_tweets`, `extracted_insights`.

---

## Exit Criteria

All outputs are populated with valid data and pass type checks.

## Error Handling

If any required input is missing, return an error message identifying the missing field. If processing fails, return partial results with an error flag.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
