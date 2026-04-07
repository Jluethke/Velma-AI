const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8420';

/**
 * Download a skill's .md file via browser save dialog.
 */
export async function downloadSkill(name: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/skills/${name}`);
  if (!res.ok) throw new Error(`Failed to fetch skill: ${res.status}`);
  const data = await res.json();

  const blob = new Blob([data.content], { type: 'text/markdown' });
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
  await navigator.clipboard.writeText(`skillchain import ${name}`);
}
