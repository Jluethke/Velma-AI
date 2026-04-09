/**
 * useFlowRunner — executes a flow phase-by-phase with streaming AI responses.
 * Parses phase definitions from skill.md content, collects inputs,
 * and runs each phase sequentially through /api/chat.
 */
import { useState, useCallback, useRef } from 'react';

export type FlowStage = 'overview' | 'inputs' | 'running' | 'complete' | 'error';

export interface FlowPhase {
  number: number;
  name: string;
  entryCriteria: string;
  actions: string;
  outputs: string;
  qualityGate: string;
}

export interface FlowInput {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface FlowDefinition {
  name: string;
  description: string;
  phases: FlowPhase[];
  inputs: FlowInput[];
  outputs: string[];
}

export interface FlowRunnerState {
  stage: FlowStage;
  currentPhaseIndex: number;
  phaseResults: Map<number, string>;
  phaseStreaming: Map<number, string>;
  inputValues: Map<string, string>;
  error?: string;
  definition: FlowDefinition | null;
}

/** Parse phase sections from skill.md content */
export function parseFlowDefinition(
  name: string,
  description: string,
  content: string,
  manifest: Record<string, unknown>
): FlowDefinition {
  const phases: FlowPhase[] = [];

  // Match phase sections: ### Phase N: NAME
  const phaseRegex = /### Phase (\d+): (\w+)\s*\n([\s\S]*?)(?=### Phase \d+:|## Exit Criteria|$)/gi;
  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    const phaseNum = parseInt(match[1], 10);
    const phaseName = match[2];
    const body = match[3];

    const extractSection = (label: string): string => {
      const re = new RegExp(`\\*\\*${label}:?\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z][a-z]+(?:\\s+\\w+)?:?\\*\\*|$)`, 'i');
      const m = body.match(re);
      return m ? m[1].trim() : '';
    };

    phases.push({
      number: phaseNum,
      name: phaseName,
      entryCriteria: extractSection('Entry criteria'),
      actions: extractSection('Actions'),
      outputs: extractSection('Output'),
      qualityGate: extractSection('Quality gate'),
    });
  }

  // Parse inputs from manifest or from ## Inputs section in content
  const inputs: FlowInput[] = [];
  if (manifest?.inputs && Array.isArray(manifest.inputs)) {
    for (const inp of manifest.inputs as Array<{ name: string; type?: string; description?: string; required?: boolean }>) {
      inputs.push({
        name: inp.name,
        type: inp.type || 'string',
        description: inp.description || '',
        required: inp.required !== false,
      });
    }
  } else {
    // Parse from markdown: - name: type -- description
    const inputSection = content.match(/## Inputs\s*\n([\s\S]*?)(?=\n## )/);
    if (inputSection) {
      const inputLines = inputSection[1].match(/^- (\w+):\s*(\w+)\s*--\s*(.+)$/gm);
      if (inputLines) {
        for (const line of inputLines) {
          const m = line.match(/^- (\w+):\s*(\w+)\s*--\s*(.+)$/);
          if (m) {
            inputs.push({
              name: m[1],
              type: m[2],
              description: m[3].trim(),
              required: !line.toLowerCase().includes('(optional)'),
            });
          }
        }
      }
    }
  }

  // Parse outputs
  const outputNames: string[] = [];
  const outputSection = content.match(/## Outputs\s*\n([\s\S]*?)(?=\n## )/);
  if (outputSection) {
    const outputLines = outputSection[1].match(/^- (\w+):/gm);
    if (outputLines) {
      for (const line of outputLines) {
        const m = line.match(/^- (\w+):/);
        if (m) outputNames.push(m[1]);
      }
    }
  }

  return { name, description, phases, inputs, outputs: outputNames };
}

export function useFlowRunner() {
  const [state, setState] = useState<FlowRunnerState>({
    stage: 'overview',
    currentPhaseIndex: -1,
    phaseResults: new Map(),
    phaseStreaming: new Map(),
    inputValues: new Map(),
    definition: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const initialize = useCallback(
    (name: string, description: string, content: string, manifest: Record<string, unknown>) => {
      const def = parseFlowDefinition(name, description, content, manifest);
      setState({
        stage: def.inputs.length > 0 ? 'overview' : 'overview',
        currentPhaseIndex: -1,
        phaseResults: new Map(),
        phaseStreaming: new Map(),
        inputValues: new Map(),
        definition: def,
      });
    },
    []
  );

  const setInputValue = useCallback((name: string, value: string) => {
    setState(prev => {
      const next = new Map(prev.inputValues);
      next.set(name, value);
      return { ...prev, inputValues: next };
    });
  }, []);

  const goToInputs = useCallback(() => {
    setState(prev => ({ ...prev, stage: 'inputs' }));
  }, []);

  /** Stream a single phase and return the full response text */
  const streamPhase = async (
    phase: FlowPhase,
    inputContext: string,
    previousOutputs: string,
    skillName: string,
    signal: AbortSignal,
    onChunk: (text: string) => void
  ): Promise<string> => {
    const systemPrompt = `You are executing Phase ${phase.number}: ${phase.name} of the "${skillName}" flow.

Follow these instructions exactly:
${phase.actions}

Produce these outputs:
${phase.outputs}

Quality gate — ensure this is met before finishing:
${phase.qualityGate}

Be thorough but concise. Use markdown formatting. Do NOT repeat previous phase outputs — only produce this phase's deliverables.`;

    const userMessage = [
      '## User Inputs',
      inputContext,
      previousOutputs ? `\n## Previous Phase Outputs\n${previousOutputs}` : '',
      `\nNow execute Phase ${phase.number}: ${phase.name}.`,
    ].join('\n');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMessage }],
        system: systemPrompt,
        skill_name: skillName,
      }),
      signal,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(err.error || `API error ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullText += parsed.delta.text;
            onChunk(fullText);
          }
        } catch {
          // skip
        }
      }
    }

    return fullText;
  };

  const startExecution = useCallback(async () => {
    const def = state.definition;
    if (!def || def.phases.length === 0) return;

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setState(prev => ({ ...prev, stage: 'running', currentPhaseIndex: 0 }));

    // Build input context string
    const inputContext = Array.from(state.inputValues.entries())
      .map(([k, v]) => `- **${k}**: ${v}`)
      .join('\n');

    const results = new Map<number, string>();
    let previousOutputs = '';

    try {
      for (let i = 0; i < def.phases.length; i++) {
        if (abort.signal.aborted) return;

        setState(prev => ({
          ...prev,
          currentPhaseIndex: i,
          phaseStreaming: new Map(prev.phaseStreaming).set(i, ''),
        }));

        const phaseText = await streamPhase(
          def.phases[i],
          inputContext,
          previousOutputs,
          def.name,
          abort.signal,
          (text) => {
            setState(prev => ({
              ...prev,
              phaseStreaming: new Map(prev.phaseStreaming).set(i, text),
            }));
          }
        );

        results.set(i, phaseText);
        previousOutputs += `\n### Phase ${def.phases[i].number}: ${def.phases[i].name}\n${phaseText}\n`;

        setState(prev => ({
          ...prev,
          phaseResults: new Map(prev.phaseResults).set(i, phaseText),
          phaseStreaming: new Map(prev.phaseStreaming).set(i, ''),
        }));
      }

      setState(prev => ({
        ...prev,
        stage: 'complete',
        phaseResults: results,
      }));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: (err as Error).message,
      }));
    }
  }, [state.definition, state.inputValues]);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState(prev => ({ ...prev, stage: 'error', error: 'Flow stopped by user' }));
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState(prev => ({
      ...prev,
      stage: 'overview',
      currentPhaseIndex: -1,
      phaseResults: new Map(),
      phaseStreaming: new Map(),
      inputValues: new Map(),
    }));
  }, []);

  const requiredInputsFilled = state.definition
    ? state.definition.inputs
        .filter(i => i.required)
        .every(i => (state.inputValues.get(i.name) || '').trim().length > 0)
    : false;

  return {
    state,
    initialize,
    setInputValue,
    goToInputs,
    startExecution,
    stop,
    reset,
    requiredInputsFilled,
  };
}
