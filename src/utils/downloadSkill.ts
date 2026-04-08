const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8420';

/**
 * Download a skill's .md file via browser save dialog.
 * Tries static file first (works on Vercel), falls back to API (works locally).
 */
export async function downloadSkill(name: string): Promise<void> {
  let content: string;

  // Try static file first (deployed on Vercel at /skills/{name}.md)
  try {
    const staticRes = await fetch(`/skills/${name}.md`);
    if (staticRes.ok) {
      content = await staticRes.text();
    } else {
      throw new Error('static not found');
    }
  } catch {
    // Fall back to API (local development)
    const apiRes = await fetch(`${API_URL}/api/skills/${name}`);
    if (!apiRes.ok) throw new Error(`Failed to fetch skill: ${apiRes.status}`);
    const data = await apiRes.json();
    content = data.content;
  }

  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy the CLI install command to clipboard.
 */
export async function copyInstallCommand(name: string): Promise<void> {
  await navigator.clipboard.writeText(`flowfabric import ${name}`);
}
