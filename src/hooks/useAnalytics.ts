declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

export function trackEvent(event: string, props?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(event, props ? { props } : undefined);
  }
}

// Pre-defined events matching our analytics plan
export const analytics = {
  flowRunAttempted: (flowSlug: string, tier: string) =>
    trackEvent('flow_run_attempted', { flow_slug: flowSlug, tier }),

  flowRunCompleted: (flowSlug: string, durationMs: number) =>
    trackEvent('flow_run_completed', { flow_slug: flowSlug, duration_ms: durationMs }),

  apiKeyConfigured: () =>
    trackEvent('api_key_configured'),

  dailyLimitReached: (tier: string) =>
    trackEvent('daily_limit_reached', { tier }),

  walletConnected: (chain: string) =>
    trackEvent('wallet_connected', { chain }),

  ctaClicked: (cta: string, page: string) =>
    trackEvent('cta_clicked', { cta, page }),
};
