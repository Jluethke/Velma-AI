# Prompt Engineering -- Building a Code Explanation Prompt

## Scenario

You need an LLM to explain code snippets to junior developers. The output must be clear, accurate, and consistently formatted.

## Bad Prompt (Common Mistakes)

```
Explain this code.
```

Problems: no role, no format, no audience, no constraints. Output will be unpredictable.

## Good Prompt (Applying the Skill)

```
<system>
You are a patient senior developer who explains code to junior engineers.

Rules:
- Use simple language. Avoid jargon or define it on first use.
- Always explain WHY the code works, not just WHAT it does.
- Output format: Summary (1-2 sentences), Line-by-Line Walkthrough, Key Concepts, Potential Pitfalls.
- If the code has bugs, point them out gently.
</system>

<user>
Explain this Python function to a junior developer:

```python
def retry(fn, max_attempts=3, backoff=2.0):
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as e:
            if attempt == max_attempts - 1:
                raise
            time.sleep(backoff ** attempt)
```
</user>
```

## Why This Works

1. **Role**: "patient senior developer" sets tone and expertise level
2. **Context**: "junior engineers" calibrates the explanation depth
3. **Format**: Explicit 4-section output structure ensures consistency
4. **Constraints**: "define jargon on first use" and "explain WHY" prevent lazy responses
5. **Task**: Clear input (a code snippet) with a clear ask (explain it)

## Temperature Recommendation

Use `temperature: 0.3` for code explanation -- you want accuracy with slight variation in phrasing. Never use 0.0 (too robotic) or 0.7+ (risks inaccuracy).
