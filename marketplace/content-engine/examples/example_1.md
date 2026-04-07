# Content Engine Example: Repurpose a Blog Post

## Input
```python
request = {
    "content": "Machine learning models require careful feature engineering. The most critical step is ensuring that inference-time feature computation exactly matches training-time computation. Even small differences in technical indicators like RSI can compound into meaningful prediction errors.",
    "content_types": ["twitter_threads", "linkedin_posts", "tiktok_hooks"],
    "tone": "professional"
}
result = content_repurposing_engine.repurpose(request)
```

## Output (abbreviated)
```python
result["data"]["total_variations"]  # 15 (3 platforms x 5 each)
result["data"]["repurposed_content"]["twitter_threads"][0]
# -> "Key insight: Machine learning models require careful feat..."
#    char_count: 274, compliant: True

result["data"]["repurposed_content"]["tiktok_hooks"][0]
# -> "Warning: You need to know: Machine learning models..."
#    char_count: 98, compliant: True

result["data"]["metadata"]
# -> {"source_words": 42, "key_sentences_extracted": 3, "clusters_identified": 2}
```

## Key Points
- TF-IDF ranks sentences by information density without any LLM calls
- Each platform gets 5 variations with different hook styles
- Always check the `compliant` flag before publishing -- truncation may exceed limits
