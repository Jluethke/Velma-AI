/**
 * Manifest Index — loads and indexes all skill manifests for fast lookup.
 * Used by ChainComposer for input/output compatibility matching.
 */
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

export interface SkillManifest {
  name: string;
  version?: string;
  domain: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
  execution_pattern: string;
  description: string;
  price?: string;
  license?: string;
}

export interface ManifestIndex {
  /** All manifests keyed by skill name */
  skills: Map<string, SkillManifest>;
  /** Inverted index: output field name -> set of skill names that produce it */
  outputIndex: Map<string, Set<string>>;
  /** Inverted index: input field name -> set of skill names that consume it */
  inputIndex: Map<string, Set<string>>;
  /** Inverted index: tag -> set of skill names */
  tagIndex: Map<string, Set<string>>;
  /** Inverted index: domain -> set of skill names */
  domainIndex: Map<string, Set<string>>;
}

/**
 * Load a single manifest from the marketplace directory.
 * Falls back to a minimal manifest if manifest.json doesn't exist.
 */
function loadManifestFull(marketplaceDir: string, skillName: string): SkillManifest {
  const manifestPath = join(marketplaceDir, skillName, "manifest.json");
  if (existsSync(manifestPath)) {
    try {
      const raw = JSON.parse(readFileSync(manifestPath, "utf-8"));
      return {
        name: raw.name ?? skillName,
        version: raw.version,
        domain: raw.domain ?? "general",
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        inputs: Array.isArray(raw.inputs) ? raw.inputs : [],
        outputs: Array.isArray(raw.outputs) ? raw.outputs : [],
        execution_pattern: raw.execution_pattern ?? "orpa",
        description: raw.description ?? "",
        price: raw.price,
        license: raw.license,
      };
    } catch { /* fall through */ }
  }
  return {
    name: skillName,
    domain: "general",
    tags: [],
    inputs: [],
    outputs: [],
    execution_pattern: "orpa",
    description: "",
  };
}

/**
 * Build a full manifest index from the marketplace directory.
 * Scans all subdirectories for manifest.json files and builds inverted indices.
 */
export function buildManifestIndex(marketplaceDir: string): ManifestIndex {
  const index: ManifestIndex = {
    skills: new Map(),
    outputIndex: new Map(),
    inputIndex: new Map(),
    tagIndex: new Map(),
    domainIndex: new Map(),
  };

  if (!existsSync(marketplaceDir)) return index;

  const dirs = readdirSync(marketplaceDir).filter(d => {
    const skillMd = join(marketplaceDir, d, "skill.md");
    return existsSync(skillMd);
  });

  for (const skillName of dirs) {
    const manifest = loadManifestFull(marketplaceDir, skillName);
    index.skills.set(skillName, manifest);

    // Build output index
    for (const output of manifest.outputs) {
      const normalized = output.toLowerCase().replace(/[_\s-]+/g, "_");
      if (!index.outputIndex.has(normalized)) index.outputIndex.set(normalized, new Set());
      index.outputIndex.get(normalized)!.add(skillName);
    }

    // Build input index
    for (const input of manifest.inputs) {
      const normalized = input.toLowerCase().replace(/[_\s-]+/g, "_");
      if (!index.inputIndex.has(normalized)) index.inputIndex.set(normalized, new Set());
      index.inputIndex.get(normalized)!.add(skillName);
    }

    // Build tag index
    for (const tag of manifest.tags) {
      const normalized = tag.toLowerCase();
      if (!index.tagIndex.has(normalized)) index.tagIndex.set(normalized, new Set());
      index.tagIndex.get(normalized)!.add(skillName);
    }

    // Build domain index
    const domain = manifest.domain.toLowerCase();
    if (!index.domainIndex.has(domain)) index.domainIndex.set(domain, new Set());
    index.domainIndex.get(domain)!.add(skillName);
  }

  return index;
}

/**
 * Find skills whose outputs can feed into a given skill's inputs.
 * Returns a map of input_field -> [skill_names that produce it].
 */
export function findUpstreamSkills(
  targetSkill: string,
  idx: ManifestIndex,
): Map<string, string[]> {
  const manifest = idx.skills.get(targetSkill);
  if (!manifest) return new Map();

  const upstreams = new Map<string, string[]>();
  for (const input of manifest.inputs) {
    const normalized = input.toLowerCase().replace(/[_\s-]+/g, "_");
    const producers = idx.outputIndex.get(normalized);
    if (producers) {
      const filtered = [...producers].filter(s => s !== targetSkill);
      if (filtered.length > 0) upstreams.set(input, filtered);
    }
  }
  return upstreams;
}

/**
 * Find skills that can consume a given skill's outputs.
 * Returns a map of output_field -> [skill_names that need it].
 */
export function findDownstreamSkills(
  sourceSkill: string,
  idx: ManifestIndex,
): Map<string, string[]> {
  const manifest = idx.skills.get(sourceSkill);
  if (!manifest) return new Map();

  const downstreams = new Map<string, string[]>();
  for (const output of manifest.outputs) {
    const normalized = output.toLowerCase().replace(/[_\s-]+/g, "_");
    const consumers = idx.inputIndex.get(normalized);
    if (consumers) {
      const filtered = [...consumers].filter(s => s !== sourceSkill);
      if (filtered.length > 0) downstreams.set(output, filtered);
    }
  }
  return downstreams;
}
