/**
 * FlowFabric Publish Endpoint — Vercel Serverless Function
 *
 * When a user publishes a flow on-chain, the frontend POSTs the flow
 * content here. This endpoint:
 * 1. Validates the request
 * 2. Uploads the flow content to R2 CDN
 * 3. Updates the catalog in R2
 * 4. Returns success with the R2 URL
 *
 * R2 credentials must be set in Vercel environment variables:
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME
 */

export const config = {
  runtime: 'edge',
};

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET = process.env.R2_BUCKET_NAME || 'flowfabric';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-b7ac6670aa9145689edf77a11d3e2d6e.r2.dev';

// ---------------------------------------------------------------------------
// S3-compatible R2 upload (minimal implementation, no SDK needed at edge)
// ---------------------------------------------------------------------------

async function signAndUpload(key: string, body: string, contentType: string = 'application/json'): Promise<boolean> {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
    throw new Error('R2 credentials not configured in Vercel environment variables');
  }

  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${R2_BUCKET}/${key}`;
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const shortDate = dateStamp.slice(0, 8);

  // AWS Signature V4
  const encoder = new TextEncoder();

  async function hmacSha256(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  }

  async function sha256(data: string): Promise<string> {
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  const payloadHash = await sha256(body);
  const region = 'auto';
  const service = 's3';
  const scope = `${shortDate}/${region}/${service}/aws4_request`;

  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${dateStamp}`,
  ].join('\n') + '\n';

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    `/${R2_BUCKET}/${key}`,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    dateStamp,
    scope,
    await sha256(canonicalRequest),
  ].join('\n');

  // Derive signing key
  let signingKey = await hmacSha256(encoder.encode(`AWS4${R2_SECRET_KEY}`), shortDate);
  signingKey = await hmacSha256(signingKey, region);
  signingKey = await hmacSha256(signingKey, service);
  signingKey = await hmacSha256(signingKey, 'aws4_request');

  const signature = Array.from(new Uint8Array(await hmacSha256(signingKey, stringToSign)))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': dateStamp,
      'Authorization': authorization,
    },
    body,
  });

  return res.ok;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req: Request) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const body = await req.json();
    const { name, domain, description, tags, inputs, outputs, content, txHash, author, type } = body;

    // Validate required fields
    if (!name || !content) {
      return new Response(JSON.stringify({ error: 'name and content are required' }), { status: 400, headers });
    }

    const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');

    if (type === 'chain' || type === 'flow-chain') {
      // Upload as a chain definition
      const chainData = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      const uploaded = await signAndUpload(`chains/${safeName}.json`, chainData);

      if (!uploaded) {
        return new Response(JSON.stringify({ error: 'Failed to upload chain to R2' }), { status: 500, headers });
      }

      return new Response(JSON.stringify({
        success: true,
        type: 'chain',
        name: safeName,
        url: `${R2_PUBLIC_URL}/chains/${safeName}.json`,
        txHash,
      }), { status: 200, headers });
    }

    // Upload as an individual flow — starts in "pending" status
    // Flow must be validated by the community before it appears in search
    const flowData = JSON.stringify({
      name: safeName,
      domain: domain || 'general',
      description: description || '',
      inputs: inputs || [],
      outputs: outputs || [],
      tags: tags || [],
      content: typeof content === 'string' ? content : JSON.stringify(content),
      author: author || '',
      publishedAt: new Date().toISOString(),
      txHash: txHash || '',
      status: 'pending_validation', // pending_validation -> validated -> graduated -> compiled
      validations: 0,
      trustScore: 0,
    }, null, 2);

    const uploaded = await signAndUpload(`flows/${safeName}.json`, flowData);

    if (!uploaded) {
      return new Response(JSON.stringify({ error: 'Failed to upload flow to R2' }), { status: 500, headers });
    }

    // Add to pending catalog (separate from the validated catalog)
    // The validated catalog (catalog.json) is only updated when flows pass validation
    // The pending catalog tracks flows awaiting validation
    try {
      const pendingRes = await fetch(`${R2_PUBLIC_URL}/pending.json`);
      let pending: Array<Record<string, unknown>> = [];
      if (pendingRes.ok) {
        pending = await pendingRes.json() as Array<Record<string, unknown>>;
      }

      pending = pending.filter((s) => (s.name as string) !== safeName);
      pending.push({
        name: safeName,
        domain: domain || 'general',
        description: description || '',
        inputs: inputs || [],
        outputs: outputs || [],
        tags: tags || [],
        author: author || '',
        txHash: txHash || '',
        publishedAt: new Date().toISOString(),
        status: 'pending_validation',
      });

      await signAndUpload('pending.json', JSON.stringify(pending, null, 2));
    } catch {
      console.error('Failed to update pending catalog');
    }

    return new Response(JSON.stringify({
      success: true,
      type: 'flow',
      name: safeName,
      url: `${R2_PUBLIC_URL}/flows/${safeName}.json`,
      catalogUpdated: true,
      txHash,
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers });
  }
}
