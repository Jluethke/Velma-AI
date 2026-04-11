/**
 * Velma Notifications — Supabase helper
 * =======================================
 * Stores in-app notifications for the Velma companion widget.
 * Notifications are scoped by wallet address and/or session ID.
 *
 * SQL to run in Supabase → SQL Editor:
 * ──────────────────────────────────────────────────────────────────
 *   create table public.velma_notifications (
 *     id uuid primary key default gen_random_uuid(),
 *     wallet_address text,
 *     session_id text,
 *     side text,
 *     type text not null,
 *     title text not null,
 *     message text not null,
 *     action_url text,
 *     read boolean not null default false,
 *     created_at timestamptz not null default now()
 *   );
 *
 *   create index on public.velma_notifications (wallet_address) where wallet_address is not null;
 *   create index on public.velma_notifications (session_id) where session_id is not null;
 *
 *   alter table public.velma_notifications enable row level security;
 *   -- All reads/writes go through service key (bypasses RLS)
 * ──────────────────────────────────────────────────────────────────
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

export type NotificationType =
  | 'fabric_reminder'
  | 'session_expired'
  | 'synthesis_ready'
  | 'match_found';

export interface VelmaNotification {
  id: string;
  wallet_address: string | null;
  session_id: string | null;
  side: string | null;
  type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  read: boolean;
  created_at: string;
}

interface WriteNotificationInput {
  wallet_address?: string;
  session_id?: string;
  side?: string;
  type: NotificationType;
  title: string;
  message: string;
  action_url?: string;
}

function sbFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  });
}

export async function writeNotification(input: WriteNotificationInput): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  await sbFetch('/velma_notifications', {
    method: 'POST',
    body: JSON.stringify({
      wallet_address: input.wallet_address ?? null,
      session_id: input.session_id ?? null,
      side: input.side ?? null,
      type: input.type,
      title: input.title,
      message: input.message,
      action_url: input.action_url ?? null,
    }),
  });
}

export async function getNotificationsByWallet(
  walletAddress: string,
  unreadOnly = false
): Promise<VelmaNotification[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return [];
  let url = `/velma_notifications?wallet_address=eq.${encodeURIComponent(walletAddress.toLowerCase())}&order=created_at.desc&limit=20`;
  if (unreadOnly) url += '&read=eq.false';
  const res = await sbFetch(url, { method: 'GET', headers: { Prefer: 'return=representation' } });
  if (!res.ok) return [];
  return res.json() as Promise<VelmaNotification[]>;
}

export async function getNotificationsBySession(
  sessionId: string,
  side: string,
  unreadOnly = false
): Promise<VelmaNotification[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return [];
  let url = `/velma_notifications?session_id=eq.${encodeURIComponent(sessionId)}&side=eq.${encodeURIComponent(side)}&order=created_at.desc&limit=20`;
  if (unreadOnly) url += '&read=eq.false';
  const res = await sbFetch(url, { method: 'GET', headers: { Prefer: 'return=representation' } });
  if (!res.ok) return [];
  return res.json() as Promise<VelmaNotification[]>;
}

export async function dismissNotification(id: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  await sbFetch(`/velma_notifications?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ read: true }),
  });
}

export async function dismissAllByWallet(walletAddress: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  await sbFetch(`/velma_notifications?wallet_address=eq.${encodeURIComponent(walletAddress.toLowerCase())}`, {
    method: 'PATCH',
    body: JSON.stringify({ read: true }),
  });
}
