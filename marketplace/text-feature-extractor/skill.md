# Text Feature Extractor

Extract features from the preprocessed text.

## Inputs

- `preprocessed-corpus`: Tokenized text
- `task-definition`: The NLP task

## Outputs

- `text-features`: Extracted feature representations
- `feature-method`: Which extraction method was used and why

## Process

1. Select the feature extraction method (TF-IDF, word embeddings, sentence embeddings).
2. For TF-IDF: fit the vectorizer and transform the corpus.
3. For embeddings: load or train the embedding model (Word2Vec, FastText, BERT).
4. Validate feature dimensionality and coverage.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
