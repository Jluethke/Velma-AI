# Wcs Minimum Context Selector

Add only the context the reader needs to take the action, and no more. Writers include the context they needed to reach the conclusion. Readers need only the context required to act on it. The gap between those two is most of what makes messages too long.

## Inputs

- `action-sentence`: The action and deadline from the first sentence
- `single-topic-check`: Confirmation that the message is one topic

## Outputs

- `context-block`: The minimum context the reader needs to act, placed after the action
- `cut-context-log`: The background you removed, kept in case a reader asks or it belongs in a linked document

## Process

1. For each sentence of context, ask whether the reader can act without it. If yes, cut it.
2. Keep context that answers the questions the action raises: how much, by when, what happens if they say no.
3. Remove the story of how you got here. The reader cares about the conclusion and the ask, not your path to them.
4. Move cut context to a log or a linked document. Some of it belongs somewhere, just not in the body of this message.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
