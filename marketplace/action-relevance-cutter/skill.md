# Action Relevance Cutter

Second pass: for each sentence, ask 'does this move the reader toward the action?' If not, cut it. The most common mistake in written communication is including context the writer needed but the reader does not.

## Inputs

- `raw-draft`: The first draft
- `reader-action`: The action the reader should take

## Outputs

- `trimmed-draft`: The draft with non-action-advancing sentences removed
- `cut-log`: Sentences removed and why, in case any need to be restored

## Process

1. Read each sentence. Ask: if I remove this sentence, can the reader still take the action? If yes, cut it.
2. Watch for throat-clearing: 'As you know,' 'It is worth noting that,' 'For context,' These phrases almost always precede cuttable content.
3. Watch for writer-therapy: paragraphs that explain how you arrived at the recommendation. The reader does not care about your process. They care about the conclusion.
4. Move cut sentences to a log. Some belong in the appendix or a supporting document, not in the trash.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
