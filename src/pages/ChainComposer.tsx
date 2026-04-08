/**
 * ChainComposer — Visual DAG editor for composing skill chains.
 * Uses @xyflow/react for the interactive graph canvas.
 *
 * - Loads all marketplace skills from /skill-catalog.json
 * - Nodes have top (input) and bottom (output) handles for drag-to-connect
 * - Drag from bottom handle of one node to top handle of another to create flow
 */
import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useGateCheck, TIER_LABELS, TIER_COLORS } from '../hooks/useGateCheck';
import { usePublishSkill, type LicenseType } from '../hooks/usePublishSkill';
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
  const { isConnected, tier, canChain, canPublish, canSchedule } = useGateCheck();
  const { address } = useAccount();
  const { publish: publishSkill, state: publishState, reset: resetPublish } = usePublishSkill();
  const [publishProgress, setPublishProgress] = useState<string[]>([]);
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
  const [trustToast, setTrustToast] = useState<string | false>(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleFreq, setScheduleFreq] = useState('daily');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleDay, setScheduleDay] = useState('MON');

  // Featured chain templates — pre-loaded onto canvas unconnected for free users
  const FEATURED_CHAINS = [
    { name: 'Career Launchpad', skills: ['explain-anything', 'study-planner', 'resume-builder', 'interview-coach', 'salary-negotiator'] },
    { name: 'Life Check-In', skills: ['energy-audit', 'money-truth', 'relationship-check', 'fear-inventory', 'future-self-letter'] },
    { name: 'Startup Validation', skills: ['problem-decomposer', 'research-synthesizer', 'competitor-teardown', 'decision-analyzer', 'business-in-a-box'] },
    { name: 'Content Machine', skills: ['research-synthesizer', 'seo-cluster-builder', 'growth-content-system', 'social-automation'] },
    { name: 'Weekly Planning', skills: ['weekly-review', 'meeting-prep', 'daily-planner', 'habit-builder'] },
  ];

  const loadFeaturedChain = useCallback((chainTemplate: { name: string; skills: string[] }) => {
    // Clear canvas
    setNodes([]);
    setEdges([]);
    setExportJson(null);
    setValidationErrors([]);
    setChainName(chainTemplate.name.toLowerCase().replace(/\s+/g, '-'));

    // Place skills on canvas unconnected
    const newNodes: Node[] = chainTemplate.skills.map((skillName, i) => {
      const skill = skills.find(s => s.name === skillName);
      const id = `node-${Date.now()}-${i}`;
      return {
        id,
        type: 'skillNode' as const,
        position: { x: 150 + i * 280, y: 80 + (i % 2) * 120 },
        data: {
          label: skillName,
          domain: skill?.domain ?? 'general',
          inputs: skill?.inputs ?? [],
          outputs: skill?.outputs ?? [],
          originalInputs: skill?.inputs ?? [],
          originalOutputs: skill?.outputs ?? [],
          isCustomized: false,
          isCustom: false,
          customDescription: '',
          onRemove: () => {
            setNodes(prev => prev.filter(n => n.id !== id));
            setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
          },
          onCustomize: (newInputs: string[], newOutputs: string[]) => {
            setNodes(prev => prev.map(n => {
              if (n.id !== id) return n;
              return { ...n, data: { ...n.data, inputs: newInputs, outputs: newOutputs, isCustomized: true } };
            }));
          },
        },
      };
    });

    setNodes(newNodes);
  }, [skills]);

  const showTrustToast = useCallback((msg?: string) => {
    setTrustToast(msg || 'Connect wallet with TRUST tokens to unlock this feature');
    setTimeout(() => setTrustToast(false), 3000);
  }, []);

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
    (connection) => {
      if (!canChain) {
        showTrustToast('Builder tier (500 TRUST) required to connect skills');
        return;
      }
      setEdges((eds) => addEdge({
        ...connection,
        style: { stroke: 'var(--cyan)', strokeWidth: 2 },
        animated: true,
      }, eds));
    },
    [canChain],
  );

  const handleAddSkill = useCallback((skill: PaletteSkill) => {
    // Free users: 3 skills max (enough to see the value of chaining). Builder+: unlimited.
    if (!canChain && nodes.length >= 3) {
      showTrustToast('Builder tier (500 TRUST) required to add more than 3 skills');
      return;
    }

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

  /** Publish chain + skills on-chain via SkillRegistry */
  const handlePublish = useCallback(async () => {
    const built = buildChainJson();
    if (!built || !address) return;

    const progress: string[] = [];
    const addProgress = (msg: string) => {
      progress.push(msg);
      setPublishProgress([...progress]);
    };

    resetPublish();
    addProgress('Starting on-chain publishing...');

    const publishedSkillIds: Record<string, string> = {};

    for (const node of nodes) {
      const isCustom = node.data.isCustom as boolean;
      const isModified = node.data.isCustomized as boolean;
      const skillName = node.data.label as string;

      if (isCustom || isModified) {
        addProgress(`Publishing ${skillName}${isModified ? ' (derivative)' : ' (new)'}...`);

        let derivedFrom: string | undefined;
        if (isModified && !isCustom) derivedFrom = `original:${skillName}`;

        const result = await publishSkill({
          name: skillName,
          domain: node.data.domain as string,
          tags: skillName.split('-').filter((t: string) => t.length > 2),
          inputs: node.data.inputs as string[],
          outputs: node.data.outputs as string[],
          price: 0n,
          licenseType: 0 as LicenseType,
          content: JSON.stringify({
            name: skillName, description: node.data.customDescription || '',
            inputs: node.data.inputs, outputs: node.data.outputs,
            domain: node.data.domain, derived_from: derivedFrom, author: address,
          }),
          derivedFrom,
        });

        if (result) {
          publishedSkillIds[skillName] = result.skillId;
          addProgress(`  Registered: ${result.skillId.slice(0, 12)}... (tx: ${result.txHash.slice(0, 12)}...)`);
        } else {
          addProgress(`  FAILED: ${publishState.error || 'Transaction rejected'}`);
          return;
        }
      }
    }

    addProgress(`Publishing chain "${chainName}"...`);
    const chainResult = await publishSkill({
      name: chainName, domain: chainCategory,
      tags: ['chain', chainCategory, ...chainName.split('-').filter(t => t.length > 2)],
      inputs: [], outputs: [], price: 0n, licenseType: 0 as LicenseType,
      content: built.json,
    });

    if (chainResult) {
      addProgress(`Chain: ${chainResult.skillId.slice(0, 12)}... (tx: ${chainResult.txHash.slice(0, 12)}...)`);
      addProgress('');
      addProgress(`Author: ${address}`);
      addProgress(`Custom/modified skills published: ${Object.keys(publishedSkillIds).length}`);
      addProgress(`Chain steps: ${built.steps.length}`);
      addProgress('Royalties flow to your wallet for all derivatives.');
    } else {
      addProgress(`FAILED: ${publishState.error || 'Transaction rejected'}`);
    }
  }, [buildChainJson, address, nodes, chainName, chainCategory, publishSkill, publishState.error, resetPublish]);

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
    // Use the skill name for single-skill runs, chain name for multi-skill
    const displayName = steps.length === 1 ? steps[0].skill_name : chainName;
    const safeName = displayName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
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
    const claudeMd = `# FlowFabric Chain: ${chainName}

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

    // Base64-encode the content to avoid ALL escaping issues in batch/shell
    const chainB64 = btoa(unescape(encodeURIComponent(built.json)));
    const claudeMdB64 = btoa(unescape(encodeURIComponent(claudeMd)));

    if (isWindows) {
      const batScript = `@echo off
title FlowFabric: ${safeName}
setlocal

:: Ensure PATH includes common tool locations
set "PATH=%PATH%;%APPDATA%\\npm;%USERPROFILE%\\.local\\bin;%ProgramFiles%\\nodejs"
set "PS=%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"

set "WS=%USERPROFILE%\\FlowFabric-Runs\\${dirName}"
if not exist "%WS%" mkdir "%WS%"

echo.
echo   FlowFabric: ${displayName}
echo   Workspace: %WS%
echo.

:: Write files via PowerShell (full path to avoid 'not found')
"%PS%" -NoProfile -ExecutionPolicy Bypass -Command ^
  "[IO.File]::WriteAllText('%WS%\\${safeName}.chain.json', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${chainB64}')));" ^
  "[IO.File]::WriteAllText('%WS%\\CLAUDE.md', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${claudeMdB64}')))"

cd /d "%WS%"

:: Find Claude Code (check common locations)
where claude >nul 2>nul
if %errorlevel% equ 0 (
    echo   Launching Claude Code...
    echo.
    claude
    goto :done
)

:: Try npm global path directly
if exist "%APPDATA%\\npm\\claude.cmd" (
    echo   Launching Claude Code...
    echo.
    "%APPDATA%\\npm\\claude.cmd"
    goto :done
)

:: Try local bin
if exist "%USERPROFILE%\\.local\\bin\\claude" (
    echo   Launching Claude Code...
    echo.
    "%USERPROFILE%\\.local\\bin\\claude"
    goto :done
)

echo.
echo   Claude Code not found. Install it:
echo     npm install -g @anthropic-ai/claude-code
echo.
echo   Your workspace is saved at: %WS%

:done
echo.
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
# FlowFabric Chain Runner: ${chainName}

WS="$HOME/FlowFabric-Runs/${dirName}"
mkdir -p "$WS"

echo ""
echo "  FlowFabric Chain Runner"
echo "  Chain: ${chainName} (${steps.length} skills)"
echo "  Workspace: $WS"
echo ""

# Write files via base64 decode (avoids heredoc escaping issues)
echo '${chainB64}' | base64 -d > "$WS/${safeName}.chain.json"
echo '${claudeMdB64}' | base64 -d > "$WS/CLAUDE.md"

cd "$WS"

# Find and launch Claude Code
if command -v claude &> /dev/null; then
    echo "  Launching Claude Code..."
    echo ""
    claude
elif command -v npm &> /dev/null; then
    echo "  Installing Claude Code..."
    npm install -g @anthropic-ai/claude-code
    if command -v claude &> /dev/null; then
        claude
    fi
else
    echo "  Install Node.js from https://nodejs.org then run:"
    echo "    npm install -g @anthropic-ai/claude-code"
    echo "  Chain saved at: $WS"
fi
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

  /** Generate a launcher script with OS-level scheduling (schtasks / crontab) */
  const handleSchedule = useCallback(() => {
    const built = buildChainJson();
    if (!built) return;

    const safeName = chainName.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const chainB64 = btoa(unescape(encodeURIComponent(built.json)));
    const claudeMd = `# Scheduled: ${chainName}\n\nThis chain runs on a schedule. Execute all ${built.steps.length} skills in order.\n\n${built.steps.map((s, i) => `${i + 1}. ${s.skill_name}`).join('\n')}\n\nStart immediately — ask for inputs only on first run, then use saved context.`;
    const claudeMdB64 = btoa(unescape(encodeURIComponent(claudeMd)));
    const isWindows = navigator.userAgent.includes('Windows');

    // Build the cron/schtasks schedule
    const time = scheduleTime;
    const [hour, minute] = time.split(':');

    if (isWindows) {
      // schtasks frequency mapping
      let schtasksSchedule = '';
      if (scheduleFreq === 'daily') schtasksSchedule = `/sc daily /st ${time}`;
      else if (scheduleFreq === 'weekly') schtasksSchedule = `/sc weekly /d ${scheduleDay} /st ${time}`;
      else if (scheduleFreq === 'hourly') schtasksSchedule = `/sc hourly /st ${time}`;

      const bat = `@echo off
title FlowFabric Scheduler: ${safeName}
set "WS=%USERPROFILE%\\FlowFabric-Runs\\${safeName}-scheduled"
if not exist "%WS%" mkdir "%WS%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "[IO.File]::WriteAllText('%WS%\\${safeName}.chain.json', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${chainB64}')));" ^
  "[IO.File]::WriteAllText('%WS%\\CLAUDE.md', [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${claudeMdB64}')))"

:: Create a run script that the scheduler will call
>"%WS%\\run.bat" (
echo @echo off
echo cd /d "%WS%"
echo claude
)

:: Register the scheduled task
schtasks /create /tn "FlowFabric-${safeName}" ${schtasksSchedule} /tr "%WS%\\run.bat" /f

echo.
echo   Scheduled task created!
echo   Name:      FlowFabric-${safeName}
echo   Frequency: ${scheduleFreq} at ${time}${scheduleFreq === 'weekly' ? ` (${scheduleDay})` : ''}
echo   Workspace: %WS%
echo.
echo   To remove: schtasks /delete /tn "FlowFabric-${safeName}" /f
echo.
pause
`;
      const blob = new Blob([bat], { type: 'application/bat' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Schedule-${safeName}.bat`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      const cronExpr = scheduleFreq === 'daily' ? `${minute} ${hour} * * *`
        : scheduleFreq === 'weekly' ? `${minute} ${hour} * * ${scheduleDay}`
        : `0 * * * *`; // hourly

      const sh = `#!/bin/bash
WS="$HOME/FlowFabric-Runs/${safeName}-scheduled"
mkdir -p "$WS"
echo '${chainB64}' | base64 -d > "$WS/${safeName}.chain.json"
echo '${claudeMdB64}' | base64 -d > "$WS/CLAUDE.md"

# Create run script
cat > "$WS/run.sh" << 'RUNEOF'
#!/bin/bash
cd "$HOME/FlowFabric-Runs/${safeName}-scheduled"
claude
RUNEOF
chmod +x "$WS/run.sh"

# Add to crontab
(crontab -l 2>/dev/null | grep -v "FlowFabric-${safeName}"; echo "${cronExpr} $WS/run.sh # FlowFabric-${safeName}") | crontab -

echo ""
echo "  Scheduled!"
echo "  Cron: ${cronExpr}"
echo "  To remove: crontab -l | grep -v 'FlowFabric-${safeName}' | crontab -"
`;
      const blob = new Blob([sh], { type: 'application/x-sh' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Schedule-${safeName}.sh`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setShowSchedule(false);
  }, [buildChainJson, chainName, scheduleFreq, scheduleTime, scheduleDay]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setExportJson(null);
    setValidationErrors([]);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', marginTop: '60px', position: 'relative' }}>
      {/* Left: Skill Palette — hidden on mobile */}
      <div className="hidden md:block">
        <SkillPalette skills={skills} onAddSkill={handleAddSkill} canChain={canChain} canPublish={canPublish} />
      </div>

      {/* Mobile floating add button */}
      <button
        className="md:hidden"
        onClick={() => setShowMobilePalette(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 50,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'var(--cyan)',
          border: 'none',
          color: '#000',
          fontSize: '28px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(56, 189, 248, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
        }}
        aria-label="Add skill"
      >
        +
      </button>

      {/* Mobile slide-up skill picker */}
      {showMobilePalette && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowMobilePalette(false)}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: '70vh',
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto' }} />
            </div>
            <SkillPalette
              skills={skills}
              onAddSkill={(skill) => {
                handleAddSkill(skill);
                setShowMobilePalette(false);
              }}
              canChain={canChain}
              canPublish={canPublish}
            />
          </div>
        </div>
      )}

      {/* Center: Canvas + Controls */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {/* Tier badge */}
          {isConnected && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: `color-mix(in srgb, ${TIER_COLORS[tier]} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${TIER_COLORS[tier]} 25%, transparent)`,
              color: TIER_COLORS[tier],
            }}>
              {TIER_LABELS[tier]}
            </span>
          )}
          {/* Chain metadata — only shown for builder+ users building chains */}
          {canChain && (
            <>
              <input
                type="text"
                value={chainName}
                onChange={e => setChainName(e.target.value)}
                placeholder="Name your chain"
                className="w-full sm:w-40"
                style={{
                  padding: '4px 8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                value={chainDescription}
                onChange={e => setChainDescription(e.target.value)}
                placeholder="What does this chain do?"
                className="w-full sm:flex-1"
                style={{
                  padding: '4px 8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  minWidth: 0,
                  outline: 'none',
                }}
              />
              <select
                value={chainCategory}
                onChange={e => setChainCategory(e.target.value)}
                style={{
                  padding: '4px 8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              >
                {['general', 'life', 'career', 'business', 'developer', 'health', 'finance', 'creative', 'education', 'ai', 'real estate'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </>
          )}
          {/* Featured chain templates — visible to everyone */}
          <select
            value=""
            onChange={e => {
              const chain = FEATURED_CHAINS.find(c => c.name === e.target.value);
              if (chain) loadFeaturedChain(chain);
            }}
            className="w-full sm:w-auto"
            style={{
              padding: '4px 8px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">Try a chain template...</option>
            {FEATURED_CHAINS.map(c => (
              <option key={c.name} value={c.name}>{c.name} ({c.skills.length} skills)</option>
            ))}
          </select>

          {!canChain && nodes.length === 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Pick a template or add a skill, then click Run
            </span>
          )}

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {/* Run: downloads launcher on desktop, copies command on mobile */}
            <button
              onClick={() => {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                if (isMobile) {
                  // Mobile: copy claude command to clipboard
                  const built = buildChainJson();
                  if (!built) return;
                  const skillNames = built.steps.map(s => s.skill_name).join(', ');
                  const cmd = `claude -p "Run these FlowFabric skills in order: ${skillNames}. For each skill, call start_skill_run, get_skill, execute each phase with record_phase, then complete_skill_run. Pass outputs between steps as context."`;
                  navigator.clipboard.writeText(cmd).then(() => {
                    showTrustToast();
                    setTrustToast(false); // clear the TRUST toast
                    alert('Command copied! Open an AI chat and paste it.');
                  });
                } else {
                  handleRun();
                }
              }}
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
              {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Copy CMD' : 'Run'}
            </button>

            {/* Builder+ buttons */}
            {canChain && (
              <>
                <button
                  onClick={handleValidate}
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    borderRadius: '4px',
                    color: 'var(--cyan)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Validate
                </button>
                <button
                  onClick={canChain ? handleExport : () => showTrustToast('Builder tier (500 TRUST) required to export chains')}
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(56,189,248,0.08)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    borderRadius: '4px',
                    color: 'var(--cyan)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Export
                </button>
                <button
                  onClick={canSchedule ? () => setShowSchedule(!showSchedule) : () => showTrustToast('Builder tier (500 TRUST) required to schedule chains')}
                  style={{
                    padding: '4px 12px',
                    background: 'rgba(74, 222, 128, 0.08)',
                    border: '1px solid rgba(74, 222, 128, 0.2)',
                    borderRadius: '4px',
                    color: canSchedule ? 'var(--green)' : 'rgba(74, 222, 128, 0.4)',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Schedule
                </button>
              </>
            )}
            <button
              onClick={canChain ? handleSave : () => showTrustToast('Builder tier (500 TRUST) required to save chains')}
              style={{
                padding: '4px 12px',
                background: 'rgba(170,136,255,0.08)',
                border: '1px solid rgba(170,136,255,0.2)',
                borderRadius: '4px',
                color: canChain ? 'var(--purple)' : 'rgba(170,136,255,0.4)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              title={canChain ? 'Save chain' : 'Builder tier (500 TRUST) required'}
            >
              Save
            </button>
            <button
              onClick={canChain ? () => { setSavedChains(getSavedChains()); setShowSaveLoad(!showSaveLoad); } : () => showTrustToast('Builder tier (500 TRUST) required to load chains')}
              style={{
                padding: '4px 12px',
                background: 'rgba(170,136,255,0.08)',
                border: '1px solid rgba(170,136,255,0.2)',
                borderRadius: '4px',
                color: canChain ? 'var(--purple)' : 'rgba(170,136,255,0.4)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              title={canChain ? 'Load saved chain' : 'Builder tier (500 TRUST) required'}
            >
              Load
            </button>
            <button
              onClick={canPublish ? handlePublish : () => showTrustToast('Creator tier (2,500 TRUST) required to publish on-chain')}
              disabled={publishState.status === 'signing' || publishState.status === 'confirming'}
              style={{
                padding: '4px 14px',
                background: canPublish ? (publishState.status === 'confirmed' ? 'rgba(0,255,136,0.15)' : 'rgba(255,215,0,0.1)') : 'rgba(255,215,0,0.05)',
                border: `1px solid ${canPublish ? (publishState.status === 'confirmed' ? 'rgba(0,255,136,0.3)' : 'rgba(255,215,0,0.25)') : 'rgba(255,215,0,0.15)'}`,
                borderRadius: '4px',
                color: canPublish ? (publishState.status === 'confirmed' ? '#00ff88' : 'var(--gold)') : 'rgba(255,215,0,0.4)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              title={canPublish ? 'Publish to Base mainnet' : 'Creator tier (2,500 TRUST) required'}
            >
              {publishState.status === 'signing' ? 'Sign...' :
               publishState.status === 'confirming' ? 'Confirming...' :
               publishState.status === 'confirmed' ? 'Published!' :
               'Publish On-Chain'}
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
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {nodes.length} skills / {edges.length} connections
          </span>
        </div>

        {/* TRUST token toast */}
        {trustToast && (
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255,215,0,0.1)',
            borderBottom: '1px solid rgba(255,215,0,0.25)',
            fontSize: '12px',
            color: 'var(--gold)',
            textAlign: 'center',
            fontWeight: 500,
          }}>
            {trustToast}
          </div>
        )}

        {/* Schedule picker */}
        {showSchedule && (
          <div style={{
            padding: '10px 16px',
            background: 'rgba(74,222,128,0.04)',
            borderBottom: '1px solid rgba(74,222,128,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 600 }}>Schedule:</span>
            <select
              value={scheduleFreq}
              onChange={e => setScheduleFreq(e.target.value)}
              style={{ padding: '3px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '11px' }}
            >
              <option value="hourly">Every hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            {scheduleFreq !== 'hourly' && (
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                style={{ padding: '3px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '11px' }}
              />
            )}
            {scheduleFreq === 'weekly' && (
              <select
                value={scheduleDay}
                onChange={e => setScheduleDay(e.target.value)}
                style={{ padding: '3px 6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontSize: '11px' }}
              >
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            )}
            <button
              onClick={handleSchedule}
              style={{ padding: '3px 10px', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '4px', color: 'var(--green)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
            >
              Create Schedule
            </button>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              Creates a {navigator.userAgent.includes('Windows') ? 'Windows Scheduled Task' : 'cron job'} on your machine
            </span>
          </div>
        )}

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
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>No saved chains yet. Click Save to store your current chain.</div>
            )}
            {savedChains.map(chain => (
              <div key={chain.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <button
                  onClick={() => handleLoad(chain)}
                  style={{
                    flex: 1, textAlign: 'left', background: 'transparent', border: 'none',
                    color: 'var(--text-primary)', fontSize: '11px', cursor: 'pointer', padding: '2px 0',
                  }}
                >
                  <strong>{chain.name}</strong> — {chain.nodes.length} skills, {chain.edges.length} connections
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>{new Date(chain.savedAt).toLocaleDateString()}</span>
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
            style={{ background: 'var(--bg-primary)' }}
            defaultEdgeOptions={{
              style: { stroke: 'rgba(0,255,200,0.4)', strokeWidth: 2 },
              animated: true,
            }}
          >
            <Controls
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="var(--border)"
            />
          </ReactFlow>
        </div>

        {/* Empty state hint */}
        {nodes.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            width: '90%',
            maxWidth: '400px',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>&#x1F9E9;</div>
            <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Try a chain template above, or click skills in the palette
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Drag from the <span style={{ color: 'var(--cyan)' }}>cyan dot</span> (bottom) to the <span style={{ color: '#ff6b6b' }}>red dot</span> (top) to connect
            </div>
          </div>
        )}

        {/* Export panel */}
        {exportJson && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--bg-card)',
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
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}>
              {exportJson}
            </pre>
          </div>
        )}

        {/* Publish progress panel */}
        {publishProgress.length > 0 && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255,215,0,0.03)',
            borderTop: '1px solid rgba(255,215,0,0.15)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600 }}>
                On-Chain Publishing
              </span>
              <button
                onClick={() => setPublishProgress([])}
                style={{
                  padding: '2px 8px', background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)', borderRadius: '4px',
                  color: 'var(--text-secondary)', fontSize: '11px', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
            <pre style={{
              margin: 0, fontSize: '11px', color: 'var(--text-secondary)',
              fontFamily: 'monospace', whiteSpace: 'pre-wrap',
            }}>
              {publishProgress.join('\n')}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
