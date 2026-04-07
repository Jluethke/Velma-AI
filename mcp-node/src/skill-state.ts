/**
 * Skill State Store — persistent per-skill state, run tracking, and history.
 * Port of sdk/skill_state.py
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface PhaseResult {
  phase: string;
  status: string;
  output: Record<string, unknown>;
  timestamp: string;
  duration_ms: number;
}

export interface SkillRun {
  skill_name: string;
  execution_pattern: string;
  started_at: string;
  completed_at: string;
  status: string;
  phases: PhaseResult[];
  metadata: Record<string, unknown>;
}

export interface SkillState {
  skill_name: string;
  last_run: SkillRun | null;
  accumulated_data: Record<string, unknown>;
  run_count: number;
  first_run: string;
  last_run_at: string;
}

function sanitizeName(name: string): string {
  let safe = name.replace(/[/\\]/g, "").replace(/\0/g, "");
  while (safe.includes("..")) safe = safe.replace("..", "");
  safe = safe.replace(/^\.+/, "");
  return safe || "unknown";
}

export class SkillStateStore {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? join(homedir(), ".skillchain", "state");
    mkdirSync(this.baseDir, { recursive: true });
  }

  private skillDir(skillName: string): string {
    const safe = sanitizeName(skillName);
    const dir = join(this.baseDir, safe);
    mkdirSync(dir, { recursive: true });
    return dir;
  }

  getState(skillName: string): SkillState {
    const dir = this.skillDir(skillName);
    const statePath = join(dir, "state.json");
    if (existsSync(statePath)) {
      try {
        return JSON.parse(readFileSync(statePath, "utf-8"));
      } catch {
        // corrupted, return default
      }
    }
    return {
      skill_name: skillName,
      last_run: null,
      accumulated_data: {},
      run_count: 0,
      first_run: "",
      last_run_at: "",
    };
  }

  private saveState(skillName: string, state: SkillState): void {
    const dir = this.skillDir(skillName);
    writeFileSync(join(dir, "state.json"), JSON.stringify(state, null, 2), "utf-8");
  }

  startRun(skillName: string, executionPattern: string = "orpa", metadata: Record<string, unknown> = {}): SkillRun {
    return {
      skill_name: skillName,
      execution_pattern: executionPattern,
      started_at: new Date().toISOString(),
      completed_at: "",
      status: "in_progress",
      phases: [],
      metadata,
    };
  }

  recordPhase(run: SkillRun, phase: string, status: string, output: Record<string, unknown> = {}, durationMs: number = 0): PhaseResult {
    const result: PhaseResult = {
      phase,
      status,
      output,
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
    };
    run.phases.push(result);
    return result;
  }

  completeRun(run: SkillRun, status: string = "completed"): void {
    run.completed_at = new Date().toISOString();
    run.status = status;

    const state = this.getState(run.skill_name);
    state.last_run = run;
    state.run_count += 1;
    state.last_run_at = run.completed_at;
    if (!state.first_run) state.first_run = run.started_at;
    this.saveState(run.skill_name, state);

    // Archive to history
    const histDir = join(this.skillDir(run.skill_name), "history");
    mkdirSync(histDir, { recursive: true });
    const ts = run.completed_at.replace(/[:.]/g, "-");
    writeFileSync(join(histDir, `${ts}.json`), JSON.stringify(run, null, 2), "utf-8");
  }

  saveData(skillName: string, key: string, data: unknown): void {
    const dir = this.skillDir(skillName);
    const safeKey = sanitizeName(key);
    writeFileSync(join(dir, `data_${safeKey}.json`), JSON.stringify(data, null, 2), "utf-8");

    const state = this.getState(skillName);
    state.accumulated_data[key] = data;
    this.saveState(skillName, state);
  }

  loadData(skillName: string, key: string): unknown | null {
    const dir = this.skillDir(skillName);
    const safeKey = sanitizeName(key);
    const path = join(dir, `data_${safeKey}.json`);
    if (existsSync(path)) {
      try { return JSON.parse(readFileSync(path, "utf-8")); } catch { return null; }
    }
    return null;
  }

  getRunHistory(skillName: string, limit: number = 10): Record<string, unknown>[] {
    const histDir = join(this.skillDir(skillName), "history");
    if (!existsSync(histDir)) return [];
    const files = readdirSync(histDir).filter(f => f.endsWith(".json")).sort().reverse().slice(0, limit);
    return files.map(f => {
      try { return JSON.parse(readFileSync(join(histDir, f), "utf-8")); } catch { return {}; }
    });
  }

  listSkillsWithState(): string[] {
    if (!existsSync(this.baseDir)) return [];
    return readdirSync(this.baseDir).filter(d => {
      return existsSync(join(this.baseDir, d, "state.json"));
    });
  }
}
