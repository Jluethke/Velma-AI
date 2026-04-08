/**
 * Chain Composer Hook — manages visual DAG state, validation, and export.
 */
import { useState, useCallback } from 'react';

export interface ComposerSkill {
  name: string;
  domain: string;
  description: string;
  tags: string[];
  inputs: string[];
  outputs: string[];
}

export interface ComposerNode {
  id: string;
  skillName: string;
  alias: string;
  position: { x: number; y: number };
  inputs: string[];
  outputs: string[];
}

export interface ComposerEdge {
  id: string;
  source: string;
  target: string;
  /** The output field flowing through this edge */
  field: string;
}

export interface ChainExport {
  name: string;
  description: string;
  category: string;
  steps: Array<{
    skill_name: string;
    alias: string;
    depends_on: string[];
    config: Record<string, unknown>;
    phase_filter: null;
  }>;
}

export function useChainComposer() {
  const [nodes, setNodes] = useState<ComposerNode[]>([]);
  const [edges, setEdges] = useState<ComposerEdge[]>([]);
  const [chainName, setChainName] = useState('my-chain');
  const [chainDescription, setChainDescription] = useState('');
  const [chainCategory, setChainCategory] = useState('general');

  const addSkill = useCallback((skill: ComposerSkill) => {
    const id = `node-${Date.now()}`;
    const alias = skill.name.replace(/-/g, '_');

    // Position new nodes in a cascade
    const x = 250 + (nodes.length % 3) * 300;
    const y = 100 + Math.floor(nodes.length / 3) * 200;

    const newNode: ComposerNode = {
      id,
      skillName: skill.name,
      alias,
      position: { x, y },
      inputs: skill.inputs,
      outputs: skill.outputs,
    };

    setNodes(prev => [...prev, newNode]);
    return id;
  }, [nodes.length]);

  const removeNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const addEdge = useCallback((source: string, target: string, field: string) => {
    const id = `edge-${source}-${target}-${field}`;
    // Prevent duplicates
    setEdges(prev => {
      if (prev.some(e => e.id === id)) return prev;
      return [...prev, { id, source, target, field }];
    });
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId));
  }, []);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, position } : n));
  }, []);

  /** Validate the DAG: check for cycles and unconnected inputs */
  const validate = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (nodes.length === 0) {
      errors.push('Add at least one skill to the chain');
      return { valid: false, errors };
    }

    // Check for cycles via topological sort
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
        const newDeg = (inDegree.get(next) ?? 1) - 1;
        inDegree.set(next, newDeg);
        if (newDeg === 0) queue.push(next);
      }
    }

    if (visited !== nodes.length) {
      errors.push('Chain contains a cycle — skills cannot depend on each other circularly');
    }

    return { valid: errors.length === 0, errors };
  }, [nodes, edges]);

  /** Export the composed chain as a .chain.json structure */
  const exportChain = useCallback((): ChainExport | null => {
    const { valid } = validate();
    if (!valid) return null;

    // Build dependency map: nodeId -> [nodeIds it depends on]
    const deps = new Map<string, Set<string>>();
    for (const node of nodes) deps.set(node.id, new Set());
    for (const edge of edges) deps.get(edge.target)?.add(edge.source);

    // Map nodeId -> alias
    const aliasMap = new Map(nodes.map(n => [n.id, n.alias]));

    // Topological sort for step ordering
    const sorted: ComposerNode[] = [];
    const visited = new Set<string>();

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      for (const dep of deps.get(id) ?? []) visit(dep);
      const node = nodes.find(n => n.id === id);
      if (node) sorted.push(node);
    };

    for (const node of nodes) visit(node.id);

    return {
      name: chainName,
      description: chainDescription,
      category: chainCategory,
      steps: sorted.map(node => ({
        skill_name: node.skillName,
        alias: node.alias,
        depends_on: [...(deps.get(node.id) ?? [])].map(d => aliasMap.get(d) ?? d),
        config: {},
        phase_filter: null,
      })),
    };
  }, [nodes, edges, chainName, chainDescription, chainCategory, validate]);

  /** Clear the canvas */
  const clear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, []);

  return {
    nodes,
    edges,
    chainName,
    chainDescription,
    chainCategory,
    setChainName,
    setChainDescription,
    setChainCategory,
    addSkill,
    removeNode,
    addEdge,
    removeEdge,
    updateNodePosition,
    validate,
    exportChain,
    clear,
  };
}
