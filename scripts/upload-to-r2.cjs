/**
 * Upload all flow content to Cloudflare R2 bucket.
 *
 * Prerequisites:
 *   1. Create R2 bucket "flowfabric" in Cloudflare dashboard
 *   2. Create R2 API token: Cloudflare dashboard → R2 → Manage R2 API Tokens
 *   3. Set environment variables:
 *      - R2_ACCOUNT_ID (your Cloudflare account ID)
 *      - R2_ACCESS_KEY_ID (from the API token)
 *      - R2_SECRET_ACCESS_KEY (from the API token)
 *      - R2_BUCKET_NAME (default: flowfabric)
 *
 * Usage: node scripts/upload-to-r2.cjs
 */

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || 'flowfabric';

if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY) {
  console.error('Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
  process.exit(1);
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

async function upload(key, body, contentType = 'application/json') {
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
  console.log(`  ✓ ${key}`);
}

async function main() {
  const marketplace = './marketplace';

  // 1. Upload skill catalog
  console.log('Uploading catalog...');
  const catalog = fs.readFileSync('./public/skill-catalog.json', 'utf-8');
  await upload('catalog.json', catalog);

  // 2. Upload each flow's content
  console.log('Uploading flows...');
  let flowCount = 0;
  for (const dir of fs.readdirSync(marketplace).sort()) {
    const skillMd = path.join(marketplace, dir, 'skill.md');
    if (!fs.existsSync(skillMd)) continue;

    const content = fs.readFileSync(skillMd, 'utf-8');
    const manifest = path.join(marketplace, dir, 'manifest.json');
    let meta = {};
    if (fs.existsSync(manifest)) {
      try { meta = JSON.parse(fs.readFileSync(manifest, 'utf-8')); } catch {}
    }

    // Upload flow as JSON with metadata + content
    await upload(`flows/${dir}.json`, JSON.stringify({
      name: meta.name || dir,
      domain: meta.domain || 'general',
      description: meta.description || '',
      inputs: meta.inputs || [],
      outputs: meta.outputs || [],
      tags: meta.tags || [],
      content,
    }));
    flowCount++;
  }

  // 3. Upload chains
  console.log('Uploading chains...');
  const chainsDir = path.join(marketplace, 'chains');
  let chainCount = 0;
  if (fs.existsSync(chainsDir)) {
    for (const f of fs.readdirSync(chainsDir)) {
      if (!f.endsWith('.chain.json')) continue;
      const content = fs.readFileSync(path.join(chainsDir, f), 'utf-8');
      const name = f.replace('.chain.json', '');
      await upload(`chains/${name}.json`, content);
      chainCount++;
    }
  }

  console.log(`\nDone! ${flowCount} flows + ${chainCount} chains uploaded to R2 bucket "${BUCKET}"`);
  console.log(`Public URL: https://pub-<YOUR_ID>.r2.dev/`);
}

main().catch(err => {
  console.error('Upload failed:', err.message);
  process.exit(1);
});
