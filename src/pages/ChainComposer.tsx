/**
 * ChainComposer — Visual DAG editor for composing skill chains.
 * Uses @xyflow/react for the interactive graph canvas.
 *
 * - Loads ALL 176 marketplace skills from /skill-catalog.json
 * - Nodes have top (input) and bottom (output) handles for drag-to-connect
 * - Drag from bottom handle of one node to top handle of another to create flow
 */
import { useState, useCallback, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGateCheck } from '../hooks/useGateCheck';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import SkillNodeComponent from '../components/SkillNode';
import SkillPalette, { type PaletteSkill } from '../components/SkillPalette';

// ---------------------------------------------------------------------------
// Custom node type — wraps SkillNodeComponent with ReactFlow handles
// ---------------------------------------------------------------------------

const nodeTypes: NodeTypes = {
  skillNode: ({ data, selected }: { data: Record<string, unknown>; selected?: boolean }) => (
    <SkillNodeComponent
      data={data as { label: string; domain: string; inputs: string[]; outputs: string[]; onRemove: () => void }}
      selected={selected}
    />
  ),
};

// ---------------------------------------------------------------------------
// ChainComposer Page
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Save/Load helpers
// ---------------------------------------------------------------------------

interface SavedChain {
  name: string;
  description: string;
  category: string;
  nodes: Array<{ id: string; label: string; domain: string; inputs: string[]; outputs: string[]; position: { x: number; y: number }; isCustom?: boolean; isCustomized?: boolean; customDescription?: string }>;
  edges: Array<{ id: string; source: string; target: string }>;
  savedAt: string;
}

function getSavedChains(): SavedChain[] {
  try {
    return JSON.parse(localStorage.getItem('skillchain-saved-chains') ?? '[]');
  } catch { return []; }
}

function saveChainToStorage(chain: SavedChain): void {
  const chains = getSavedChains().filter(c => c.name !== chain.name);
  chains.unshift(chain);
  // Keep last 20
  localStorage.setItem('skillchain-saved-chains', JSON.stringify(chains.slice(0, 20)));
}

function deleteChainFromStorage(name: string): void {
  const chains = getSavedChains().filter(c => c.name !== name);
  localStorage.setItem('skillchain-saved-chains', JSON.stringify(chains));
}

// ---------------------------------------------------------------------------
// ChainComposer Page
// ---------------------------------------------------------------------------

export default function ChainComposer() {
  const [skills, setSkills] = useState<PaletteSkill[]>([]);
  const { isConnected, isUnlocked, isLoading: gateLoading } = useGateCheck();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [chainName, setChainName] = useState('my-chain');
  const [chainDescription, setChainDescription] = useState('');
  const [chainCategory, setChainCategory] = useState('general');
  const [exportJson, setExportJson] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedChains, setSavedChains] = useState<SavedChain[]>(getSavedChains);
  const [showSaveLoad, setShowSaveLoad] = useState(false);

  // Load full skill catalog from static JSON
  useEffect(() => {
    fetch('/skill-catalog.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PaletteSkill[]) => {
        setSkills(data);
        setLoadError(null);
      })
      .catch(err => {
        setLoadError(`Could not load skill catalog: ${err.message}`);
        // Fallback: minimal set so composer is still usable
        setSkills([
          { name: 'budget-builder', domain: 'finance', description: 'Build a comprehensive budget', tags: ['money'], inputs: ['income', 'fixed_expenses'], outputs: ['spending_snapshot', 'action_plan'] },
          { name: 'career-pivot', domain: 'career', description: 'Plan a career transition', tags: ['career'], inputs: ['current_role', 'target_role'], outputs: ['gap_analysis', 'transition_plan'] },
          { name: 'am-i-okay', domain: 'life', description: 'Personal wellbeing check-in', tags: ['wellbeing'], inputs: ['current_state'], outputs: ['assessment', 'recommendations'] },
        ]);
      });
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({
      ...connection,
      style: { stroke: 'var(--cyan)', strokeWidth: 2 },
      animated: true,
    }, eds)),
    [],
  );

  const handleAddSkill = useCallback((skill: PaletteSkill) => {
    const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const x = 300 + (nodes.length % 3) * 320;
    const y = 80 + Math.floor(nodes.length / 3) * 250;

    const newNode: Node = {
      id,
      type: 'skillNode',
      position: { x, y },
      data: {
        label: skill.name,
        domain: skill.domain,
        inputs: [...skill.inputs],
        outputs: [...skill.outputs],
        originalInputs: [...skill.inputs],
        originalOutputs: [...skill.outputs],
        isCustomized: false,
        isCustom: skill.isCustom ?? false,
        customDescription: skill.description ?? '',
        onRemove: () => {
          setNodes(prev => prev.filter(n => n.id !== id));
          setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
        },
        onCustomize: (newInputs: string[], newOutputs: string[]) => {
          setNodes(prev => prev.map(n => {
            if (n.id !== id) return n;
            const origIn = (n.data.originalInputs as string[]) ?? [];
            const origOut = (n.data.originalOutputs as string[]) ?? [];
            const changed = JSON.stringify(newInputs) !== JSON.stringify(origIn) || JSON.stringify(newOutputs) !== JSON.stringify(origOut);
            return { ...n, data: { ...n.data, inputs: newInputs, outputs: newOutputs, isCustomized: changed } };
          }));
        },
      },
    };

    setNodes(prev => [...prev, newNode]);
  }, [nodes.length]);

  /** When a new custom skill is created in the palette, add to skill list */
  const handleCreateSkill = useCallback((skill: PaletteSkill) => {
    setSkills(prev => {
      if (prev.some(s => s.name === skill.name)) return prev;
      return [...prev, skill];
    });
  }, []);

  /** Save current chain to localStorage */
  const handleSave = useCallback(() => {
    if (!chainName.trim()) return;
    const chain: SavedChain = {
      name: chainName,
      description: chainDescription,
      category: chainCategory,
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.data.label as string,
        domain: n.data.domain as string,
        inputs: n.data.inputs as string[],
        outputs: n.data.outputs as string[],
        position: n.position,
        isCustom: n.data.isCustom as boolean | undefined,
        isCustomized: n.data.isCustomized as boolean | undefined,
        customDescription: n.data.customDescription as string | undefined,
      })),
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
      savedAt: new Date().toISOString(),
    };
    saveChainToStorage(chain);
    setSavedChains(getSavedChains());
  }, [chainName, chainDescription, chainCategory, nodes, edges]);

  /** Load a saved chain onto the canvas */
  const handleLoad = useCallback((chain: SavedChain) => {
    setChainName(chain.name);
    setChainDescription(chain.description);
    setChainCategory(chain.category);
    setExportJson(null);
    setValidationErrors([]);

    // Rebuild nodes with callbacks
    const newNodes: Node[] = chain.nodes.map(n => ({
      id: n.id,
      type: 'skillNode' as const,
      position: n.position,
      data: {
        label: n.label,
        domain: n.domain,
        inputs: n.inputs,
        outputs: n.outputs,
        originalInputs: n.inputs,
        originalOutputs: n.outputs,
        isCustomized: n.isCustomized ?? false,
        isCustom: n.isCustom ?? false,
        customDescription: n.customDescription ?? '',
        onRemove: () => {
          setNodes(prev => prev.filter(nd => nd.id !== n.id));
          setEdges(prev => prev.filter(e => e.source !== n.id && e.target !== n.id));
        },
        onCustomize: (newInputs: string[], newOutputs: string[]) => {
          setNodes(prev => prev.map(nd => {
            if (nd.id !== n.id) return nd;
            return { ...nd, data: { ...nd.data, inputs: newInputs, outputs: newOutputs, isCustomized: true } };
          }));
        },
      },
    }));

    const newEdges: Edge[] = chain.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      style: { stroke: 'var(--cyan)', strokeWidth: 2 },
      animated: true,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
    setShowSaveLoad(false);
  }, []);

  const handleDeleteSaved = useCallback((name: string) => {
    deleteChainFromStorage(name);
    setSavedChains(getSavedChains());
  }, []);

  const handleValidate = useCallback(() => {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push('Add at least one skill');
    }

    if (!chainName.trim()) {
      errors.push('Chain name is required');
    }

    // Cycle detection via topological sort
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    for (const node of nodes) {
      adjList.set(node.id, []);
      inDegree.set(node.id, 0);
    }
    for (const edge of edges) {
      adjList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
    const queue = [...inDegree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
    let visited = 0;
    while (queue.length > 0) {
      const curr = queue.shift()!;
      visited++;
      for (const next of adjList.get(curr) ?? []) {
        const nd = (inDegree.get(next) ?? 1) - 1;
        inDegree.set(next, nd);
        if (nd === 0) queue.push(next);
      }
    }
    if (visited !== nodes.length && nodes.length > 1) {
      errors.push('Chain has a cycle — remove a connection');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [nodes, edges, chainName]);

  /** Build the chain JSON from current graph state (shared by export + run) */
  const buildChainJson = useCallback((): { json: string; steps: Array<{ skill_name: string; alias: string; depends_on: string[] }> } | null => {
    if (!handleValidate()) return null;

    const deps = new Map<string, Set<string>>();
    for (const node of nodes) deps.set(node.id, new Set());
    for (const edge of edges) deps.get(edge.target)?.add(edge.source);

    const aliasMap = new Map(nodes.map(n => [
      n.id,
      (n.data.label as string).replace(/-/g, '_'),
    ]));

    const sorted: Node[] = [];
    const vis = new Set<string>();
    const visit = (id: string) => {
      if (vis.has(id)) return;
      vis.add(id);
      for (const dep of deps.get(id) ?? []) visit(dep);
      const node = nodes.find(n => n.id === id);
      if (node) sorted.push(node);
    };
    for (const node of nodes) visit(node.id);

    const steps = sorted.map(node => ({
      skill_name: node.data.label as string,
      alias: (node.data.label as string).replace(/-/g, '_'),
      depends_on: [...(deps.get(node.id) ?? [])].map(d => aliasMap.get(d) ?? d),
      config: {},
      phase_filter: null,
    }));

    const chain = { name: chainName, description: chainDescription, category: chainCategory, steps };
    return { json: JSON.stringify(chain, null, 2), steps };
  }, [nodes, edges, chainName, chainDescription, chainCategory, handleValidate]);

  const handleExport = useCallback(() => {
    const built = buildChainJson();
    if (built) setExportJson(built.json);
  }, [buildChainJson]);

  /**
   * Generate and download a launcher script that:
   * 1. Creates a workspace directory
   * 2. Saves the chain + a CLAUDE.md with instructions
   * 3. Opens Claude Code interactively (not -p which exits)
   */
  const handleRun = useCallback(() => {
    const built = buildChainJson();
    if (!built) return;

    const { steps } = built;
    const safeName = chainName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    const dirName = `${safeName}-${timestamp}`;

    // Only collect inputs for the FIRST step(s) — the entry points with no dependencies
    // Downstream skills get their inputs from upstream outputs (context bridging)
    const entrySteps = steps.filter(s => s.depends_on.length === 0);
    const entryInputs: string[] = [];
    for (const step of entrySteps) {
      const skill = skills.find(s => s.name === step.skill_name);
      if (skill) {
        for (const input of skill.inputs) {
          if (!entryInputs.includes(input)) entryInputs.push(input);
        }
      }
    }

    // Build step-by-step instructions with context bridging
    const stepInstructions = steps.map((step, i) => {
      const deps = step.depends_on;
      let bridge = '';
      if (deps.length > 0) {
        bridge = `\n   CONTEXT: Use the outputs from ${deps.join(' and ')} as input. Summarize key findings from those steps and feed them into this skill.`;
      }
      return `${i + 1}. **${step.skill_name}**${deps.length > 0 ? ` (after: ${deps.join(', ')})` : ' (entry point)'}${bridge}`;
    }).join('\n');

    // Track customized and custom skills
    const customizedSkills = nodes
      .filter(n => n.data.isCustomized)
      .map(n => `${n.data.label} (modified inputs/outputs)`);

    const customSkills = nodes
      .filter(n => n.data.isCustom)
      .map(n => ({
        name: n.data.label as string,
        description: n.data.customDescription as string,
        inputs: n.data.inputs as string[],
        outputs: n.data.outputs as string[],
      }));

    // Write a CLAUDE.md that tells Claude how to run the chain
    const claudeMd = `# SkillChain Chain: ${chainName}

${chainDescription || 'Custom skill chain composed in the visual editor.'}

## How to run this chain

Execute these ${steps.length} skills in order. For each skill:
1. Call \`start_skill_run\` with the skill name
2. Call \`get_skill\` to read the full skill definition
3. Follow each phase in the skill definition, calling \`record_phase\` after each
4. Call \`complete_skill_run\` when done
5. **Before starting the next skill, summarize the key outputs from this skill and carry them forward as context**

## Chain steps

${stepInstructions}

## Required inputs (ask the user first)

${entryInputs.length > 0 ? entryInputs.map(i => `- ${i}`).join('\n') : 'No specific inputs required — ask the user what they need help with.'}

## Context bridging rules

When moving from one skill to the next:
- Summarize the key outputs, decisions, and findings from the completed skill
- Frame them as inputs for the next skill (e.g., "Based on the code review, the main issues are X, Y, Z — now let\\'s create content about these findings")
- The user should NOT have to re-explain anything — carry all context forward
- If a skill produces structured data (lists, tables, scores), preserve that structure

${customSkills.length > 0 ? `## Custom skills to build first\n\nThese skills don't exist in the marketplace yet. Before running the chain, use the \`skill-from-workflow\` skill to create each one based on the description below. Ask the user to confirm the generated skill definition before proceeding.\n\n${customSkills.map(s => `### ${s.name}\n**Description:** ${s.description}\n**Inputs:** ${s.inputs.join(', ') || 'ask the user'}\n**Outputs:** ${s.outputs.join(', ') || 'ask the user'}\n`).join('\n')}\n` : ''}
${customizedSkills.length > 0 ? `## Customized skills (derivatives)\n\nThese skills were modified from their originals. When publishing, they should be marked as derivatives with royalty splits to the original author:\n${customizedSkills.map(s => `- ${s}`).join('\n')}\n` : ''}
## Start

Ask the user for the required inputs listed above, then begin with step 1.
`;

    const isWindows = navigator.userAgent.includes('Windows');

    if (isWindows) {
      // Write CLAUDE.md to workspace, then open Claude interactively
      const batScript = `@echo off
title SkillChain: ${safeName}
setlocal enabledelayedexpansion

echo.
echo   SkillChain Chain Runner
echo   =======================
echo   Chain: ${chainName}
echo   Skills: ${steps.length}
echo   Steps: ${steps.map(s => s.skill_name).join(' -> ')}
echo.

set "WORKSPACE=%USERPROFILE%\\SkillChain-Runs\\${dirName}"
if not exist "%WORKSPACE%" mkdir "%WORKSPACE%"
echo   Workspace: %WORKSPACE%

:: Save chain definition
>${">"} "%WORKSPACE%\\${safeName}.chain.json" (
${built.json.split('\n').map(line => `echo ${line.replace(/"/g, '').replace(/%/g, '%%').replace(/>/g, '^>').replace(/</g, '^<').replace(/&/g, '^&').replace(/\|/g, '^|')}`).join('\n')}
)

:: Save CLAUDE.md with chain instructions
>${">"} "%WORKSPACE%\\CLAUDE.md" (
${claudeMd.split('\n').map(line => `echo ${line.replace(/%/g, '%%').replace(/>/g, '^>').replace(/</g, '^<').replace(/&/g, '^&').replace(/\|/g, '^|') || '.'}`).join('\n')}
)

echo   Created CLAUDE.md with chain instructions.
echo.

cd /d "%WORKSPACE%"

echo   Launching Claude Code...
echo   Type your inputs when prompted. Claude will run each skill step by step.
echo   =========================================================================
echo.

:: Launch Claude interactively — it will read CLAUDE.md automatically
claude

echo.
echo   Session complete. Output saved in: %WORKSPACE%
pause
`;
      const blob = new Blob([batScript], { type: 'application/bat' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Run-${safeName}.bat`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const shScript = `#!/bin/bash
# SkillChain Chain Runner: ${chainName}

echo ""
echo "  SkillChain Chain Runner"
echo "  ======================="
echo "  Chain: ${chainName}"
echo "  Skills: ${steps.length}"
echo "  Steps: ${steps.map(s => s.skill_name).join(' -> ')}"
echo ""

WORKSPACE="$HOME/SkillChain-Runs/${dirName}"
mkdir -p "$WORKSPACE"
echo "  Workspace: $WORKSPACE"

# Save chain definition
cat > "$WORKSPACE/${safeName}.chain.json" << 'CHAINEOF'
${built.json}
CHAINEOF

# Save CLAUDE.md with chain instructions
cat > "$WORKSPACE/CLAUDE.md" << 'CLAUDEEOF'
${claudeMd}
CLAUDEEOF

echo "  Created CLAUDE.md with chain instructions."
echo ""

cd "$WORKSPACE"

echo "  Launching Claude Code..."
echo "  Type your inputs when prompted. Claude will run each skill step by step."
echo "  ========================================================================="
echo ""

# Launch Claude interactively — it reads CLAUDE.md automatically
claude

echo ""
echo "  Session complete. Output saved in: $WORKSPACE"
`;
      const blob = new Blob([shScript], { type: 'application/x-sh' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Run-${safeName}.sh`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [buildChainJson, chainName, chainDescription, chainCategory, skills, nodes, edges]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setExportJson(null);
    setValidationErrors([]);
  }, []);

  // Gate: require wallet + TRUST to use the composer
  if (!isConnected || !isUnlocked) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 60px)', marginTop: '60px', padding: '40px',
        background: '#0a0a0f',
      }}>
        <div style={{
          maxWidth: '420px', textAlign: 'center',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '16px', padding: '40px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#x1F9E9;</div>
          <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '8px' }}>
            Chain Composer
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
            Drag, drop, and connect skills to build custom chains.
            Create new skills with natural language. Run interactively in Claude Code.
          </p>

          {!isConnected ? (
            <>
              <p style={{ color: 'var(--cyan)', fontSize: '13px', marginBottom: '20px' }}>
                Connect your wallet to unlock the composer.
              </p>
              <ConnectButton />
            </>
          ) : !isUnlocked ? (
            <>
              <p style={{ color: 'var(--gold)', fontSize: '13px', marginBottom: '12px' }}>
                You need TRUST tokens to use the chain composer.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '20px' }}>
                Earn TRUST by publishing skills, validating for quality, or participating in governance. No public sale.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                Want to try a single skill for free? Browse the <a href="/explore" style={{ color: 'var(--cyan)' }}>Skills</a> page.
              </p>
            </>
          ) : null}

          {gateLoading && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Checking TRUST balance...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', marginTop: '60px' }}>
      {/* Left: Skill Palette */}
      <SkillPalette skills={skills} onAddSkill={handleAddSkill} onCreateSkill={handleCreateSkill} />

      {/* Center: Canvas + Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div
          style={{
            padding: '8px 16px',
            background: 'rgba(10, 10, 15, 0.95)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            value={chainName}
            onChange={e => setChainName(e.target.value)}
            placeholder="Name your chain"
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
              width: '160px',
              outline: 'none',
            }}
          />
          <input
            type="text"
            value={chainDescription}
            onChange={e => setChainDescription(e.target.value)}
            placeholder="What does this chain do?"
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
              flex: 1,
              minWidth: '200px',
              outline: 'none',
            }}
          />
          <select
            value={chainCategory}
            onChange={e => setChainCategory(e.target.value)}
            style={{
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            {['general', 'life', 'career', 'business', 'developer', 'health', 'finance', 'creative', 'education', 'ai', 'real estate'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleValidate}
              style={{
                padding: '4px 12px',
                background: 'rgba(0,255,200,0.08)',
                border: '1px solid rgba(0,255,200,0.2)',
                borderRadius: '4px',
                color: 'var(--cyan)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Validate
            </button>
            <button
              onClick={handleExport}
              style={{
                padding: '4px 12px',
                background: 'rgba(0,255,200,0.15)',
                border: '1px solid rgba(0,255,200,0.3)',
                borderRadius: '4px',
                color: 'var(--cyan)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Export .chain.json
            </button>
            <button
              onClick={handleRun}
              style={{
                padding: '4px 14px',
                background: 'rgba(0,200,255,0.15)',
                border: '1px solid rgba(0,200,255,0.3)',
                borderRadius: '4px',
                color: '#00c8ff',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Run
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '4px 12px',
                background: 'rgba(170,136,255,0.08)',
                border: '1px solid rgba(170,136,255,0.2)',
                borderRadius: '4px',
                color: 'var(--purple)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Save
            </button>
            <button
              onClick={() => { setSavedChains(getSavedChains()); setShowSaveLoad(!showSaveLoad); }}
              style={{
                padding: '4px 12px',
                background: 'rgba(170,136,255,0.08)',
                border: '1px solid rgba(170,136,255,0.2)',
                borderRadius: '4px',
                color: 'var(--purple)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Load
            </button>
            <button
              onClick={handleClear}
              style={{
                padding: '4px 12px',
                background: 'rgba(255,100,100,0.08)',
                border: '1px solid rgba(255,100,100,0.2)',
                borderRadius: '4px',
                color: '#ff6464',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </div>

          {/* Node count */}
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
            {nodes.length} skills / {edges.length} connections
          </span>
        </div>

        {/* Saved chains panel */}
        {showSaveLoad && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(170,136,255,0.03)',
            borderBottom: '1px solid rgba(170,136,255,0.15)',
            maxHeight: '150px',
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--purple)', fontWeight: 600, marginBottom: '6px' }}>
              Saved Chains ({savedChains.length})
            </div>
            {savedChains.length === 0 && (
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>No saved chains yet. Click Save to store your current chain.</div>
            )}
            {savedChains.map(chain => (
              <div key={chain.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <button
                  onClick={() => handleLoad(chain)}
                  style={{
                    flex: 1, textAlign: 'left', background: 'transparent', border: 'none',
                    color: 'rgba(255,255,255,0.7)', fontSize: '11px', cursor: 'pointer', padding: '2px 0',
                  }}
                >
                  <strong>{chain.name}</strong> — {chain.nodes.length} skills, {chain.edges.length} connections
                  <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>{new Date(chain.savedAt).toLocaleDateString()}</span>
                </button>
                <button
                  onClick={() => handleDeleteSaved(chain.name)}
                  style={{ background: 'transparent', border: 'none', color: '#ff6464', fontSize: '11px', cursor: 'pointer' }}
                >del</button>
              </div>
            ))}
          </div>
        )}

        {/* Load error */}
        {loadError && (
          <div style={{
            padding: '6px 16px',
            background: 'rgba(255,200,0,0.08)',
            borderBottom: '1px solid rgba(255,200,0,0.2)',
            fontSize: '12px',
            color: '#ffc800',
          }}>
            {loadError} — showing fallback skills
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div style={{
            padding: '6px 16px',
            background: 'rgba(255,100,100,0.08)',
            borderBottom: '1px solid rgba(255,100,100,0.2)',
            fontSize: '12px',
            color: '#ff6464',
          }}>
            {validationErrors.join(' | ')}
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            style={{ background: '#0a0a0f' }}
            defaultEdgeOptions={{
              style: { stroke: 'rgba(0,255,200,0.4)', strokeWidth: 2 },
              animated: true,
            }}
          >
            <Controls
              style={{ background: 'rgba(15,15,25,0.9)', borderColor: 'rgba(255,255,255,0.1)' }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(255,255,255,0.05)"
            />
          </ReactFlow>
        </div>

        {/* Empty state hint */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-20%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>&#x1F9E9;</div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>
              Click skills in the palette to add them
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)' }}>
              Drag from the <span style={{ color: 'var(--cyan)' }}>cyan dot</span> (bottom) to the <span style={{ color: '#ff6b6b' }}>red dot</span> (top) to connect
            </div>
          </div>
        )}

        {/* Export panel */}
        {exportJson && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(10, 10, 15, 0.95)',
            borderTop: '1px solid rgba(0,255,200,0.2)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 600 }}>
                Exported Chain
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(exportJson); }}
                style={{
                  padding: '2px 8px',
                  background: 'rgba(0,255,200,0.08)',
                  border: '1px solid rgba(0,255,200,0.2)',
                  borderRadius: '4px',
                  color: 'var(--cyan)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
            </div>
            <pre style={{
              margin: 0,
              fontSize: '11px',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {exportJson}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
