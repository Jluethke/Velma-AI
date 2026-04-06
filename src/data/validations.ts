export interface ValidationRecord {
  validator: string;
  result: 'PASS' | 'FAIL' | 'PARTIAL';
  similarity: number;
  date: string;
}

export const validationsBySkill: Record<string, ValidationRecord[]> = {
  'trading-system': [
    { validator: 'node_0xa3f7...d12e', result: 'PASS', similarity: 0.94, date: '2026-03-30' },
    { validator: 'node_0x8b21...c4a9', result: 'PASS', similarity: 0.91, date: '2026-03-29' },
    { validator: 'node_0x1fe4...7b33', result: 'PASS', similarity: 0.88, date: '2026-03-28' },
    { validator: 'node_0xd905...a1c7', result: 'PARTIAL', similarity: 0.76, date: '2026-03-27' },
    { validator: 'node_0x62cb...ef58', result: 'PASS', similarity: 0.92, date: '2026-03-26' },
  ],
  'content-engine': [
    { validator: 'node_0x8b21...c4a9', result: 'PASS', similarity: 0.89, date: '2026-03-30' },
    { validator: 'node_0xa3f7...d12e', result: 'PASS', similarity: 0.93, date: '2026-03-29' },
    { validator: 'node_0x4d6e...82f1', result: 'PASS', similarity: 0.87, date: '2026-03-28' },
    { validator: 'node_0x1fe4...7b33', result: 'FAIL', similarity: 0.42, date: '2026-03-27' },
  ],
  'social-automation': [
    { validator: 'node_0xd905...a1c7', result: 'PASS', similarity: 0.86, date: '2026-03-30' },
    { validator: 'node_0x62cb...ef58', result: 'PASS', similarity: 0.91, date: '2026-03-29' },
    { validator: 'node_0xa3f7...d12e', result: 'PASS', similarity: 0.84, date: '2026-03-28' },
  ],
  'velma-voice': [
    { validator: 'node_0x1fe4...7b33', result: 'PASS', similarity: 0.96, date: '2026-03-30' },
    { validator: 'node_0x8b21...c4a9', result: 'PASS', similarity: 0.93, date: '2026-03-29' },
    { validator: 'node_0xd905...a1c7', result: 'PASS', similarity: 0.91, date: '2026-03-28' },
    { validator: 'node_0x62cb...ef58', result: 'PASS', similarity: 0.95, date: '2026-03-27' },
  ],
  'repo-health': [
    { validator: 'node_0xa3f7...d12e', result: 'PASS', similarity: 0.97, date: '2026-03-30' },
    { validator: 'node_0x4d6e...82f1', result: 'PASS', similarity: 0.95, date: '2026-03-29' },
    { validator: 'node_0x1fe4...7b33', result: 'PASS', similarity: 0.93, date: '2026-03-28' },
    { validator: 'node_0x8b21...c4a9', result: 'PASS', similarity: 0.94, date: '2026-03-27' },
    { validator: 'node_0xd905...a1c7', result: 'PASS', similarity: 0.91, date: '2026-03-26' },
  ],
  'mission-control-design': [
    { validator: 'node_0x62cb...ef58', result: 'PASS', similarity: 0.92, date: '2026-03-30' },
    { validator: 'node_0xa3f7...d12e', result: 'PASS', similarity: 0.94, date: '2026-03-29' },
    { validator: 'node_0x4d6e...82f1', result: 'PASS', similarity: 0.90, date: '2026-03-28' },
  ],
  'multi-agent-swarm': [
    { validator: 'node_0x8b21...c4a9', result: 'PASS', similarity: 0.88, date: '2026-03-30' },
    { validator: 'node_0x1fe4...7b33', result: 'PASS', similarity: 0.91, date: '2026-03-29' },
    { validator: 'node_0xd905...a1c7', result: 'PARTIAL', similarity: 0.73, date: '2026-03-28' },
    { validator: 'node_0xa3f7...d12e', result: 'PASS', similarity: 0.89, date: '2026-03-27' },
  ],
  'tick-engine': [
    { validator: 'node_0x4d6e...82f1', result: 'PASS', similarity: 0.90, date: '2026-03-30' },
    { validator: 'node_0x62cb...ef58', result: 'PASS', similarity: 0.87, date: '2026-03-29' },
    { validator: 'node_0x8b21...c4a9', result: 'PASS', similarity: 0.92, date: '2026-03-28' },
  ],
  'event-bus': [
    { validator: 'node_0xa3f7...d12e', result: 'PASS', similarity: 0.88, date: '2026-03-30' },
    { validator: 'node_0x1fe4...7b33', result: 'PASS', similarity: 0.85, date: '2026-03-29' },
    { validator: 'node_0xd905...a1c7', result: 'PASS', similarity: 0.90, date: '2026-03-28' },
  ],
  'task-decomposition': [
    { validator: 'node_0x62cb...ef58', result: 'PASS', similarity: 0.93, date: '2026-03-30' },
    { validator: 'node_0x4d6e...82f1', result: 'PASS', similarity: 0.89, date: '2026-03-29' },
    { validator: 'node_0x8b21...c4a9', result: 'PASS', similarity: 0.91, date: '2026-03-28' },
    { validator: 'node_0xa3f7...d12e', result: 'PARTIAL', similarity: 0.71, date: '2026-03-27' },
  ],
};
