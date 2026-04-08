/**
 * Fact Extractor — pattern-matching extraction from skill phase outputs.
 * =====================================================================
 * Extracts structured facts (dollar amounts, dates, decisions, preferences,
 * goals) from phase output text without requiring an LLM call.
 *
 * Ported from NeurOS NeuroFS value tagging patterns.
 */

export interface ExtractedFact {
  content: string;
  tags: string[];
  importance: number;
  /** NeurOS-style economic value (0-1), set for financial facts */
  economic_value?: number;
}

// ---------------------------------------------------------------------------
// Extraction Patterns
// ---------------------------------------------------------------------------

const MONEY_PATTERN = /\$[\d,]+(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|usd)/gi;
const DATE_PATTERN = /\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/gi;
const DECISION_PATTERN = /\b(?:decided|decision|chose|choosing|selected|concluded|determined|resolved|committed|agreed)\b[^.!?]*[.!?]/gi;
const PREFERENCE_PATTERN = /\b(?:prefer|prefers|preferred|favorite|likes|dislikes|avoids?|wants?|needs?)\b[^.!?]*[.!?]/gi;
const GOAL_PATTERN = /\b(?:goal|objective|target|aim|aspir|plan(?:ning)?|intend|milestone|deadline)\b[^.!?]*[.!?]/gi;
const METRIC_PATTERN = /\b\d+(?:\.\d+)?%|\b(?:score|rating|rank|grade|level|tier)[\s:]+\S+/gi;
const NAME_PATTERN = /\b(?:name|called|named|title[d]?)[\s:]+["']?([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/g;

// ---------------------------------------------------------------------------
// Extractor
// ---------------------------------------------------------------------------

/**
 * Extract structured facts from phase output data.
 * Handles both stringified JSON and plain text.
 */
export function extractFacts(
  phaseOutput: Record<string, unknown>,
  skillName: string,
): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  const text = flattenToText(phaseOutput);

  if (text.length < 10) return facts;

  // Extract money/financial facts
  const moneyMatches = text.match(MONEY_PATTERN);
  if (moneyMatches) {
    for (const match of moneyMatches) {
      facts.push({
        content: extractSurroundingContext(text, match),
        tags: ["financial", "amount", skillName],
        importance: 0.8,
        economic_value: 0.9,
      });
    }
  }

  // Extract decisions
  const decisionMatches = text.match(DECISION_PATTERN);
  if (decisionMatches) {
    for (const match of dedup(decisionMatches).slice(0, 3)) {
      facts.push({
        content: match.trim(),
        tags: ["decision", skillName],
        importance: 0.7,
      });
    }
  }

  // Extract goals
  const goalMatches = text.match(GOAL_PATTERN);
  if (goalMatches) {
    for (const match of dedup(goalMatches).slice(0, 3)) {
      facts.push({
        content: match.trim(),
        tags: ["goal", skillName],
        importance: 0.8,
      });
    }
  }

  // Extract preferences
  const prefMatches = text.match(PREFERENCE_PATTERN);
  if (prefMatches) {
    for (const match of dedup(prefMatches).slice(0, 2)) {
      facts.push({
        content: match.trim(),
        tags: ["preference", skillName],
        importance: 0.6,
      });
    }
  }

  // Extract dates (as context, not standalone)
  const dateMatches = text.match(DATE_PATTERN);
  if (dateMatches && dateMatches.length <= 3) {
    for (const match of dateMatches) {
      const context = extractSurroundingContext(text, match);
      if (context.length > match.length + 10) {
        facts.push({
          content: context,
          tags: ["date", "timeline", skillName],
          importance: 0.5,
        });
      }
    }
  }

  // Extract key-value outputs from structured data
  const kvFacts = extractKeyValues(phaseOutput, skillName);
  facts.push(...kvFacts);

  return deduplicateFacts(facts);
}

/**
 * Extract facts from key-value pairs in structured output.
 * Prioritizes fields that look like results, summaries, or recommendations.
 */
function extractKeyValues(
  data: Record<string, unknown>,
  skillName: string,
): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  const importantKeys = [
    "result", "summary", "recommendation", "conclusion", "action",
    "insight", "finding", "suggestion", "outcome", "answer",
    "total", "budget", "score", "plan", "next_steps",
  ];

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    const keyLower = key.toLowerCase();
    const isImportant = importantKeys.some(k => keyLower.includes(k));

    if (isImportant && typeof value === "string" && value.length > 10 && value.length < 500) {
      facts.push({
        content: `${key}: ${value}`,
        tags: ["output", keyLower, skillName],
        importance: 0.7,
      });
    }

    // Recurse into nested objects (1 level deep)
    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      for (const [subKey, subValue] of Object.entries(value as Record<string, unknown>)) {
        const subKeyLower = subKey.toLowerCase();
        const subImportant = importantKeys.some(k => subKeyLower.includes(k));
        if (subImportant && typeof subValue === "string" && subValue.length > 10 && subValue.length < 500) {
          facts.push({
            content: `${key}.${subKey}: ${subValue}`,
            tags: ["output", subKeyLower, skillName],
            importance: 0.6,
          });
        }
      }
    }
  }

  return facts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Flatten any JSON structure to a single text string for regex matching. */
function flattenToText(obj: unknown, depth: number = 0): string {
  if (depth > 5) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) return obj.map(item => flattenToText(item, depth + 1)).join(" ");
  if (typeof obj === "object" && obj !== null) {
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${flattenToText(v, depth + 1)}`)
      .join(". ");
  }
  return "";
}

/** Extract surrounding context (up to ~100 chars) around a match. */
function extractSurroundingContext(text: string, match: string): string {
  const idx = text.indexOf(match);
  if (idx < 0) return match;

  const start = Math.max(0, text.lastIndexOf(".", Math.max(0, idx - 50)) + 1);
  const end = Math.min(text.length, text.indexOf(".", idx + match.length) + 1 || idx + match.length + 50);
  return text.slice(start, end).trim();
}

/** Remove near-duplicate strings. */
function dedup(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter(s => {
    const normalized = s.toLowerCase().trim().slice(0, 50);
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

/** Remove near-duplicate extracted facts. */
function deduplicateFacts(facts: ExtractedFact[]): ExtractedFact[] {
  const seen = new Set<string>();
  return facts.filter(f => {
    const key = f.content.toLowerCase().trim().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
