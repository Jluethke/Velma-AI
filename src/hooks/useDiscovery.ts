/**
 * Fabric Discovery — React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiscoveryListing {
  id: string;
  wallet_address: string;
  flow_slug: string;
  role: 'host' | 'guest';
  title: string;
  description: string;
  market: string | null;
  tags: string[];
  status: 'active' | 'matched' | 'closed' | 'paused';
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface EnrichedMatch {
  id: string;
  listing_id: string;
  matched_listing_id: string;
  score: number;
  ai_intro_text: string;
  ai_reasoning: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'converted' | 'expired';
  fabric_session_id: string | null;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
  matched_listing: DiscoveryListing | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`);
  return data as T;
}

// ─── Board listings ───────────────────────────────────────────────────────────

export function useListings(params: {
  flowSlug?: string;
  role?: string;
  market?: string;
} = {}) {
  const qs = new URLSearchParams();
  if (params.flowSlug) qs.set('flowSlug', params.flowSlug);
  if (params.role) qs.set('role', params.role);
  if (params.market) qs.set('market', params.market);

  return useQuery({
    queryKey: ['discovery-listings', params],
    queryFn: () =>
      apiFetch<{ listings: DiscoveryListing[] }>(
        `/api/discovery/listings?${qs}`
      ).then(d => d.listings),
    staleTime: 30_000,
  });
}

// ─── My listings ─────────────────────────────────────────────────────────────

export function useMyListings() {
  const { address } = useAccount();
  return useQuery({
    queryKey: ['discovery-my-listings', address],
    queryFn: () =>
      apiFetch<{ listings: DiscoveryListing[] }>(
        `/api/discovery/listings?wallet=${address}`
      ).then(d => d.listings),
    enabled: !!address,
    staleTime: 30_000,
  });
}

// ─── Matches for a listing ────────────────────────────────────────────────────

export function useMatches(listingId: string | undefined) {
  return useQuery({
    queryKey: ['discovery-matches', listingId],
    queryFn: () =>
      apiFetch<{ matches: EnrichedMatch[] }>(
        `/api/discovery/matches?listingId=${listingId}`
      ).then(d => d.matches),
    enabled: !!listingId,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

// ─── Create listing ───────────────────────────────────────────────────────────

export function useCreateListing() {
  const qc = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: (data: {
      flowSlug: string;
      role: 'host' | 'guest';
      title: string;
      description: string;
      market?: string;
      tags?: string[];
    }) =>
      apiFetch<{ listing: DiscoveryListing }>('/api/discovery/listings', {
        method: 'POST',
        body: JSON.stringify({ walletAddress: address, ...data }),
      }).then(d => d.listing),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discovery-listings'] });
      qc.invalidateQueries({ queryKey: ['discovery-my-listings'] });
    },
  });
}

// ─── Respond to match ─────────────────────────────────────────────────────────

export function useRespondToMatch() {
  const qc = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: (data: { matchId: string; action: 'accept' | 'reject' }) =>
      apiFetch<{
        status: string;
        sessionId?: string;
        guestUrl?: string;
        hostToken?: string;
        expiresAt?: number;
      }>('/api/discovery/respond', {
        method: 'POST',
        body: JSON.stringify({ ...data, walletAddress: address }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discovery-matches'] });
      qc.invalidateQueries({ queryKey: ['discovery-my-listings'] });
    },
  });
}

// ─── Refresh matches ──────────────────────────────────────────────────────────

export function useRefreshMatches() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) =>
      apiFetch<{ matched: number }>('/api/discovery/score', {
        method: 'POST',
        body: JSON.stringify({ listingId }),
      }),
    onSuccess: (_data, listingId) => {
      qc.invalidateQueries({ queryKey: ['discovery-matches', listingId] });
    },
  });
}

// ─── Update listing status ────────────────────────────────────────────────────

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  const { address } = useAccount();

  return useMutation({
    mutationFn: (data: { listingId: string; status: 'active' | 'paused' | 'closed' }) =>
      apiFetch<{ listing: DiscoveryListing }>('/api/discovery/manage', {
        method: 'PATCH',
        body: JSON.stringify({ ...data, walletAddress: address }),
      }).then(d => d.listing),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discovery-listings'] });
      qc.invalidateQueries({ queryKey: ['discovery-my-listings'] });
    },
  });
}

// ─── Infer listing from free text ─────────────────────────────────────────────

export interface InferredListing {
  flowSlug: string;
  role: 'host' | 'guest';
  title: string;
  description: string;
  tags: string[];
}

export function useInferListing() {
  return useMutation({
    mutationFn: (text: string) =>
      apiFetch<InferredListing>('/api/discovery/infer', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
  });
}
