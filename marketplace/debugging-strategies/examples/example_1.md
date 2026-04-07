# Debugging Strategies -- Finding an Intermittent 500 Error

## Scenario

Your API returns HTTP 500 about 2% of the time on the `/api/checkout` endpoint. No pattern in timing. No useful error message in the response. Logs show `NullPointerException` but the stack trace points to a line that "can't be null."

## Applying the Scientific Method

### Step 1: Observe

Gather data before forming any hypothesis.

```bash
# How often does it happen?
grep "500" access.log | wc -l        # 847 out of 42,000 requests = ~2%

# Is it correlated with time of day?
grep "500" access.log | cut -d' ' -f4 | cut -d: -f2 | sort | uniq -c
# Result: evenly distributed. Not a peak-traffic issue.

# Is it correlated with specific users or inputs?
grep "500" access.log | cut -d' ' -f1 | sort | uniq -c | sort -rn | head
# Result: spread across many IPs. Not one bad actor.

# What does the stack trace say?
grep -A 20 "NullPointerException" app.log | head -40
# Line 142: user.getCart().getItems().stream()...
# "user can't be null here -- we check for null on line 130"
```

### Step 2: Hypothesize

The null check on line 130 passes, but by line 142 `user.getCart()` returns null. Two hypotheses:

- **H1**: `getCart()` returns null for users with no cart (data issue)
- **H2**: Race condition -- another thread clears the cart between lines 130 and 142

### Step 3: Test Each Hypothesis

**Testing H1** (data issue):
```sql
SELECT COUNT(*) FROM users WHERE cart_id IS NULL;
-- Result: 0. Every user has a cart. H1 seems wrong.

-- But wait: what about the cart object itself?
SELECT COUNT(*) FROM carts WHERE items IS NULL;
-- Result: 312. Carts exist but items column is NULL. Bingo?
```

**Testing H2** (race condition):
```java
// Add logging to narrow the window
log.info("cart={} items={}", user.getCart(), user.getCart().getItems());
// If H2 is true, we'd see cart=Cart{} items=null in the logs
// because another request clears items between the two calls
```

### Step 4: Conclude

After deploying the logging, the answer is **H1 refined**: `getCart()` returns a Cart object, but `getItems()` returns null (not an empty list) for newly created carts that haven't had items added yet.

### The Fix

```java
// Before (crashes on null items)
user.getCart().getItems().stream()...

// After (defensive, handles empty carts)
List<Item> items = Optional.ofNullable(user.getCart())
    .map(Cart::getItems)
    .orElse(Collections.emptyList());
items.stream()...
```

## Key Takeaway

The developer's assumption -- "user can't be null here" -- was technically correct but missed the deeper issue. The null wasn't on `user`, it was on `getItems()`. Reading the stack trace more carefully and testing with data queries (not just code inspection) found the root cause in 20 minutes.
