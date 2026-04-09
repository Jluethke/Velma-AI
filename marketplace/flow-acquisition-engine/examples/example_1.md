# Example: Learning SQL from Intermediate to Expert

## Input
```
target_skill: "SQL for data analysis"
current_level: "intermediate"
target_proficiency: "expert"
available_hours_per_week: 8
learning_preferences: { "modes": ["hands-on", "reading"], "constraints": ["free resources only"] }
```

## Phase 1: ASSESS Output

**Sub-skill decomposition:**
1. SELECT fundamentals (columns, WHERE, ORDER BY)
2. JOINs (INNER, LEFT, RIGHT, FULL, SELF, CROSS)
3. Aggregation (GROUP BY, HAVING, aggregate functions)
4. Subqueries (scalar, correlated, EXISTS, IN)
5. Window functions (ROW_NUMBER, RANK, LAG/LEAD, running totals)
6. CTEs and recursive queries
7. Set operations (UNION, INTERSECT, EXCEPT)
8. Query optimization (EXPLAIN plans, indexing strategy, query rewriting)
9. Advanced data types (JSON, arrays, date/time manipulation)
10. Complex analytical patterns (cohort analysis, funnel queries, sessionization)

**Proficiency matrix (self-assessed + diagnostic):**
| Sub-skill | Current | Target | Gap |
|---|---|---|---|
| SELECT fundamentals | Proficient | Expert | Small |
| JOINs | Competent | Expert | Medium |
| Aggregation | Competent | Expert | Medium |
| Subqueries | Advanced Beginner | Expert | Large |
| Window functions | Novice | Expert | Large |
| CTEs | Novice | Expert | Large |
| Set operations | Advanced Beginner | Expert | Medium |
| Query optimization | Novice | Expert | Large |
| Advanced data types | Novice | Expert | Large |
| Analytical patterns | Novice | Expert | Large |

**Priority gaps:** Window functions, CTEs, query optimization, analytical patterns.

## Phase 2: ROADMAP Output

**Dependency graph:**
```
SELECT fundamentals -> JOINs -> Subqueries -> CTEs -> Recursive CTEs
SELECT fundamentals -> Aggregation -> Window functions
JOINs + Aggregation + Subqueries -> Analytical patterns
CTEs + Window functions -> Query optimization (need complex queries to optimize)
```

**Learning phases:**
| Phase | Sub-skills | Duration | Milestone |
|---|---|---|---|
| 1 | Subqueries deep dive, Set operations | 2 weeks | Can write correlated subqueries from scratch |
| 2 | Window functions (all types) | 2 weeks | Can solve any ranking/running-total problem |
| 3 | CTEs + recursive queries | 1.5 weeks | Can replace any subquery with CTE, write recursive hierarchies |
| 4 | Advanced data types | 1 week | Can query JSON, handle timezones, array operations |
| 5 | Query optimization | 2 weeks | Can read EXPLAIN, design indexes, rewrite slow queries |
| 6 | Analytical patterns | 2.5 weeks | Can build cohort analysis, funnels, sessionization from scratch |

**Total estimated time:** ~11 weeks at 8 hours/week = ~88 hours.

## Phase 3: CURRICULUM Output (Phase 2 sample -- Window Functions)

### Tier 1: Understand
**Key concepts:**
- Window functions operate on a set of rows related to the current row WITHOUT collapsing them (unlike GROUP BY)
- PARTITION BY defines the window, ORDER BY defines the sequence within it
- Frame specification: ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW

### Tier 2: Apply (Guided exercises)
**Exercise 2.1:** Given a `sales` table, write a query showing each sale with the running total per salesperson.
- Expected: `SUM(amount) OVER (PARTITION BY salesperson_id ORDER BY sale_date)`
- Self-eval: Does your result maintain one row per sale while showing cumulative amounts?

**Exercise 2.2:** Rank products by revenue within each category. Show dense rank, not gaps.
- Expected: `DENSE_RANK() OVER (PARTITION BY category ORDER BY revenue DESC)`
- Self-eval: Can you explain the difference between RANK, DENSE_RANK, and ROW_NUMBER?

### Tier 3: Master (No scaffolding)
**Exercise 3.1:** Write a query that finds the first purchase date, most recent purchase, and average days between purchases for each customer -- in a single query, no subqueries.
- Hint (hidden): LAG + DATEDIFF + window frame
- Self-eval: Can you solve this without looking at any documentation?

## Phase 5: EVALUATE Output (Phase 2 mastery test)

**Question 1 (Application):** Write a window function query that shows each employee's salary, department average, and their percent deviation from department average.

**Question 2 (Transfer):** A `page_views` table has (user_id, page, timestamp). Find sessions where a session is defined as consecutive page views less than 30 minutes apart. Use only window functions.

**Question 3 (Synthesis):** Combine JOINs and window functions: given `orders` and `customers` tables, find customers whose most recent order amount is more than 2x their historical average order amount.

**Result:** Score 85% -> Pass. Gap identified: frame specifications still shaky (used default frame instead of specifying ROWS BETWEEN). Remediation: 2 targeted exercises on frame specifications.
