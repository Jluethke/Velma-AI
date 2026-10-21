/**
 * Chain step condition evaluator.
 *
 * Chain steps may carry a `condition` such as `stack == 'python'` or
 * `'lock' in stampede_plan.techniques and cache_backend == 'redis'`. This module
 * evaluates those expressions against the run context without eval().
 *
 * Grammar (both symbol and word forms appear in published chains):
 *   expr    := or
 *   or      := and (("||" | "or") and)*
 *   and     := not (("&&" | "and") not)*
 *   not     := ("!" | "not") not | cmp
 *   cmp     := value (("==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "not in") value)?
 *   value   := string | number | true | false | null | list | path | "(" expr ")"
 *   path    := ident ("." ident)*     (".length" reads an array or string length)
 *
 * evaluateCondition returns true or false when the expression resolves, and null
 * when it cannot be parsed or names a context value that is not present yet.
 * Callers treat null as "let the model decide", never as false.
 */

type Tok = { t: "str" | "num" | "id" | "op" | "punc"; v: string };

const UNRESOLVED = Symbol("unresolved");
type Val = unknown | typeof UNRESOLVED;

function tokenize(src: string): Tok[] | null {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'" || c === '"') {
      const end = src.indexOf(c, i + 1);
      if (end < 0) return null;
      out.push({ t: "str", v: src.slice(i + 1, end) });
      i = end + 1;
      continue;
    }
    const two = src.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(two)) { out.push({ t: "op", v: two }); i += 2; continue; }
    if ("<>!".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
    if ("()[],".includes(c)) { out.push({ t: "punc", v: c }); i++; continue; }
    const num = /^-?\d+(\.\d+)?/.exec(src.slice(i));
    if (num) { out.push({ t: "num", v: num[0] }); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(src.slice(i));
    if (id) { out.push({ t: "id", v: id[0] }); i += id[0].length; continue; }
    return null;
  }
  return out;
}

function lookup(ctx: Record<string, unknown>, path: string): Val {
  let cur: unknown = ctx;
  for (const key of path.split(".")) {
    if (key === "length" && (Array.isArray(cur) || typeof cur === "string")) { cur = cur.length; continue; }
    if (cur === null || typeof cur !== "object" || !Object.prototype.hasOwnProperty.call(cur, key)) return UNRESOLVED;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function equal(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, k) => equal(x, b[k]));
  if (typeof a === "string" && typeof b === "boolean") return a.toLowerCase() === String(b);
  if (typeof b === "string" && typeof a === "boolean") return b.toLowerCase() === String(a);
  return a === b;
}

class Parser {
  private p = 0;
  constructor(private toks: Tok[], private ctx: Record<string, unknown>) {}

  private peek(): Tok | undefined { return this.toks[this.p]; }
  private isWord(w: string): boolean { const k = this.peek(); return !!k && k.t === "id" && k.v === w; }
  private isOp(o: string): boolean { const k = this.peek(); return !!k && (k.t === "op" || k.t === "punc") && k.v === o; }
  private expect(o: string): void { if (!this.isOp(o)) throw new Error(`expected ${o}`); this.p++; }

  done(): boolean { return this.p >= this.toks.length; }

  // Three-valued logic: UNRESOLVED propagates unless the other side decides the result.
  or(): Val {
    let left = this.and();
    while (this.isOp("||") || this.isWord("or")) {
      this.p++;
      const right = this.and();
      if (left === true || right === true) left = true;
      else if (left === UNRESOLVED || right === UNRESOLVED) left = UNRESOLVED;
      else left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  private and(): Val {
    let left = this.not();
    while (this.isOp("&&") || this.isWord("and")) {
      this.p++;
      const right = this.not();
      if (left === false || right === false) left = false;
      else if (left === UNRESOLVED || right === UNRESOLVED) left = UNRESOLVED;
      else left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  private not(): Val {
    if (this.isOp("!") || (this.isWord("not") && !(this.toks[this.p + 1]?.v === "in"))) {
      this.p++;
      const v = this.not();
      return v === UNRESOLVED ? UNRESOLVED : !v;
    }
    return this.cmp();
  }

  private cmp(): Val {
    const left = this.value();
    const k = this.peek();
    let op: string | null = null;
    if (k && k.t === "op" && ["==", "!=", ">", ">=", "<", "<="].includes(k.v)) { op = k.v; this.p++; }
    else if (this.isWord("in")) { op = "in"; this.p++; }
    else if (this.isWord("not") && this.toks[this.p + 1]?.v === "in") { op = "not in"; this.p += 2; }
    if (!op) return left;
    const right = this.value();
    if (left === UNRESOLVED || right === UNRESOLVED) return UNRESOLVED;
    switch (op) {
      case "==": return equal(left, right);
      case "!=": return !equal(left, right);
      case ">": return Number(left) > Number(right);
      case ">=": return Number(left) >= Number(right);
      case "<": return Number(left) < Number(right);
      case "<=": return Number(left) <= Number(right);
      case "in":
      case "not in": {
        let hit: boolean;
        if (Array.isArray(right)) hit = right.some(x => equal(x, left));
        else if (typeof right === "string") hit = right.includes(String(left));
        else if (right && typeof right === "object") hit = Object.prototype.hasOwnProperty.call(right, String(left));
        else return UNRESOLVED;
        return op === "in" ? hit : !hit;
      }
    }
    return UNRESOLVED;
  }

  private value(): Val {
    const k = this.peek();
    if (!k) throw new Error("unexpected end");
    if (k.t === "str") { this.p++; return k.v; }
    if (k.t === "num") { this.p++; return Number(k.v); }
    if (this.isOp("(")) { this.p++; const v = this.or(); this.expect(")"); return v; }
    if (this.isOp("[")) {
      this.p++;
      const items: unknown[] = [];
      let unresolved = false;
      while (!this.isOp("]")) {
        const v = this.value();
        if (v === UNRESOLVED) unresolved = true; else items.push(v);
        if (this.isOp(",")) this.p++;
        else if (!this.isOp("]")) throw new Error("bad list");
      }
      this.p++;
      return unresolved ? UNRESOLVED : items;
    }
    if (k.t === "id") {
      this.p++;
      if (k.v === "true") return true;
      if (k.v === "false") return false;
      if (k.v === "null" || k.v === "None") return null;
      return lookup(this.ctx, k.v);
    }
    throw new Error(`unexpected token ${k.v}`);
  }
}

export function evaluateCondition(expr: string | undefined, ctx: Record<string, unknown>): boolean | null {
  if (!expr || !expr.trim()) return true;
  if (expr.includes("${")) return null; // template syntax is not an expression; leave to the model
  const toks = tokenize(expr);
  if (!toks || toks.length === 0) return null;
  try {
    const parser = new Parser(toks, ctx);
    const v = parser.or();
    if (!parser.done() || v === UNRESOLVED) return null;
    return Boolean(v);
  } catch {
    return null;
  }
}
