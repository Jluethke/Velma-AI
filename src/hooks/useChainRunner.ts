/**
 * useChainRunner — executes a chain pipeline in the browser.
 * Runs each skill sequentially through /api/chat with streaming,
 * passing each step's output as context to the next.
 */
import { useState, useCallback, useRef } from 'react';

export type ChainRunStage = 'idle' | 'running' | 'complete' | 'error';

export interface ChainRunnerState {
  stage: ChainRunStage;
  currentSkillIndex: number;
  skillResults: Map<number, string>;
  skillStreaming: Map<number, string>;
  error?: string;
}

async function streamSkill(
  skillName: string,
  chainName: string,
  stepIndex: number,
  stepTotal: number,
  userGoal: string,
  previousOutputs: string,
  signal: AbortSignal,
  onChunk: (text: string) => void
): Promise<string> {
  const displaySkill = skillName.replace(/-/g, ' ');
  const displayChain = chainName.replace(/-/g, ' ');

  const systemPrompt = `You are executing the "${displaySkill}" step (step ${stepIndex + 1} of ${stepTotal}) in the "${displayChain}" pipeline.

Your role: perform the "${displaySkill}" task thoroughly and produce clear, actionable deliverables in markdown format.
This output feeds directly into the next pipeline step as context — be explicit and well-organized.
Do not restate prior step outputs in full; reference them only where needed.`;

  const parts = [`## Goal\n${userGoal}`];
  if (previousOutputs) parts.push(`## Prior Steps Output\n${previousOutputs}`);
  parts.push(`Execute step ${stepIndex + 1}: **${displaySkill}**.`);

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: parts.join('\n\n') }],
      system: systemPrompt,
      skill_name: skillName,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const p = JSON.parse(data);
        if (p.type === 'content_block_delta' && p.delta?.text) {
          full += p.delta.text;
          onChunk(full);
        }
      } catch { /* skip malformed SSE */ }
    }
  }

  return full;
}

export function useChainRunner(chainName: string, skills: string[]) {
  const [state, setState] = useState<ChainRunnerState>({
    stage: 'idle',
    currentSkillIndex: -1,
    skillResults: new Map(),
    skillStreaming: new Map(),
  });
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async (goal: string) => {
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setState({
      stage: 'running',
      currentSkillIndex: 0,
      skillResults: new Map(),
      skillStreaming: new Map(),
    });

    const results = new Map<number, string>();
    let accumulated = '';

    try {
      for (let i = 0; i < skills.length; i++) {
        if (abort.signal.aborted) return;

        setState(prev => ({
          ...prev,
          currentSkillIndex: i,
          skillStreaming: new Map(prev.skillStreaming).set(i, ''),
        }));

        const text = await streamSkill(
          skills[i],
          chainName,
          i,
          skills.length,
          goal,
          accumulated,
          abort.signal,
          (chunk) =>
            setState(prev => ({
              ...prev,
              skillStreaming: new Map(prev.skillStreaming).set(i, chunk),
            }))
        );

        results.set(i, text);
        accumulated += `\n### Step ${i + 1}: ${skills[i]}\n${text}\n`;

        setState(prev => ({
          ...prev,
          skillResults: new Map(prev.skillResults).set(i, text),
          skillStreaming: new Map(prev.skillStreaming).set(i, ''),
        }));
      }

      setState(prev => ({
        ...prev,
        stage: 'complete',
        currentSkillIndex: -1,
        skillResults: results,
      }));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: (err as Error).message,
      }));
    }
  }, [chainName, skills]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, stage: 'error', error: 'Pipeline stopped.' }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({
      stage: 'idle',
      currentSkillIndex: -1,
      skillResults: new Map(),
      skillStreaming: new Map(),
    });
  }, []);

  return { state, run, stop, reset };
}
