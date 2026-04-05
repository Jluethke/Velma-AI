# Repo Health -- Quick Start

```bash
# Run the five core detection commands
BRANCH=$(git rev-parse --abbrev-ref HEAD)
CHANGES=$(git status --porcelain | wc -l)
STALE=$(git branch -a -v --format="%(refname:short)|%(committerdate:iso8601)" \
    | awk -F'|' -v cutoff="$(date -d '30 days ago' --iso-8601)" '$2 < cutoff' | wc -l)
UNMERGED=$(git branch --no-merged | wc -l)

# Calculate health score
SCORE=1.0
[ "$BRANCH" = "HEAD" ] && SCORE=$(echo "$SCORE - 0.30" | bc)
[ "$CHANGES" -gt 0 ]   && SCORE=$(echo "$SCORE - 0.20" | bc)
[ "$STALE" -gt 0 ]     && SCORE=$(echo "$SCORE - 0.20 * $STALE" | bc)
[ "$UNMERGED" -ge 3 ]  && SCORE=$(echo "$SCORE - 0.10" | bc)

echo "Health: $SCORE"
# Gate governance: <0.65 = FROZEN, <0.80 = CONSTRAINED, else NOMINAL
```
