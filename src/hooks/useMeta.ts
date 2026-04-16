import { useEffect } from 'react';

interface MetaConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

export function useMeta({ title, description, canonical, ogImage }: MetaConfig) {
  useEffect(() => {
    // Title
    document.title = title;

    // Description
    const descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (descTag) descTag.content = description;

    // OG tags
    const setMeta = (prop: string, content: string) => {
      let tag = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', prop);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setMeta('og:title', title);
    setMeta('og:description', description);
    if (canonical) setMeta('og:url', canonical);
    if (ogImage) setMeta('og:image', ogImage);

    // Twitter
    const setTwitter = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };

    setTwitter('twitter:title', title);
    setTwitter('twitter:description', description);
    if (ogImage) setTwitter('twitter:image', ogImage);

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Cleanup - restore defaults on unmount
    return () => {
      document.title = 'FlowFabric — AI Flows for Everything';
      if (descTag) descTag.content = '165+ structured AI workflows for life, career, money, business, health, and more. Free. No account needed. Runs step by step, streamed live in your browser.';
    };
  }, [title, description, canonical, ogImage]);
}
