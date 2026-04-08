/**
 * useSkillRunner — runs skills inline via the FlowFabric AI runtime.
 * Streams Anthropic API responses through /api/chat serverless function.
 */
import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RunnerState {
  status: 'idle' | 'loading' | 'streaming' | 'waiting' | 'done' | 'error';
  messages: ChatMessage[];
  error?: string;
  skillName?: string;
}

export function useSkillRunner() {
  const [state, setState] = useState<RunnerState>({ status: 'idle', messages: [] });
  const abortRef = useRef<AbortController | null>(null);

  const startSkill = useCallback(async (skillName: string, skillDescription: string) => {
    // Abort any existing stream
    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    const systemPrompt = `You are running a FlowFabric skill called "${skillName}".

${skillDescription}

Execute this skill step by step:
1. First, ask the user for any required inputs
2. Then execute each phase in order
3. Show your work clearly under each phase heading
4. Check the quality gate at the end of each phase
5. When all phases complete, summarize the outputs

Be concise but thorough. Format output with markdown headers for each phase.`;

    const initialMessage: ChatMessage = {
      role: 'user',
      content: `Run the "${skillName}" skill. Start by asking me for any required inputs.`,
    };

    setState({
      status: 'streaming',
      messages: [initialMessage],
      skillName,
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: initialMessage.content }],
          system: systemPrompt,
          skill_name: skillName,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        setState(prev => ({ ...prev, status: 'error', error: err.error || `API error ${response.status}` }));
        return;
      }

      // Parse the SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        setState(prev => ({ ...prev, status: 'error', error: 'No response stream' }));
        return;
      }

      const decoder = new TextDecoder();
      let assistantContent = '';

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
              assistantContent += parsed.delta.text;
              setState(prev => ({
                ...prev,
                status: 'streaming',
                messages: [
                  ...prev.messages.filter(m => m.role === 'user'),
                  { role: 'assistant', content: assistantContent },
                ],
              }));
            }
          } catch {
            // Skip unparseable lines
          }
        }
      }

      setState(prev => ({
        ...prev,
        status: 'waiting',
        messages: [
          ...prev.messages.filter(m => m.role === 'user'),
          { role: 'assistant', content: assistantContent },
        ],
      }));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(prev => ({ ...prev, status: 'error', error: (err as Error).message }));
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!state.skillName) return;

    const newMessages: ChatMessage[] = [...state.messages, { role: 'user', content }];
    setState(prev => ({ ...prev, status: 'streaming', messages: newMessages }));

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          skill_name: state.skillName,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        setState(prev => ({ ...prev, status: 'error', error: err.error }));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = '';

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
              assistantContent += parsed.delta.text;
              setState(prev => ({
                ...prev,
                status: 'streaming',
                messages: [
                  ...newMessages,
                  { role: 'assistant', content: assistantContent },
                ],
              }));
            }
          } catch { /* skip */ }
        }
      }

      setState(prev => ({
        ...prev,
        status: 'waiting',
        messages: [...newMessages, { role: 'assistant', content: assistantContent }],
      }));
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState(prev => ({ ...prev, status: 'error', error: (err as Error).message }));
    }
  }, [state.messages, state.skillName]);

  const stop = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState(prev => ({ ...prev, status: 'done' }));
  }, []);

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState({ status: 'idle', messages: [] });
  }, []);

  return { state, startSkill, sendMessage, stop, reset };
}
