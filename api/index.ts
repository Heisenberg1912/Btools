/**
 * Vercel Serverless API Handler
 * Wraps the Fastify backend for serverless deployment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Dynamic import to handle ESM - imports from compiled dist folder
let appPromise: Promise<any> | null = null;

async function getApp() {
  if (!appPromise) {
    // Import from compiled JavaScript in dist folder
    appPromise = import('../backend-node/dist/server.js').then(m => m.default);
  }
  return appPromise;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(200).end();
  }

  try {
    const app = await getApp();

    // Ensure the app is ready
    await app.ready();

    // Strip hop-by-hop headers that must not be forwarded.
    // content-length will mismatch when Vercel already parsed the body into an
    // object — Fastify re-serialises it and the byte length changes.
    const { 'content-length': _cl, 'transfer-encoding': _te, ...forwardHeaders } = req.headers;

    // Vercel pre-parses JSON bodies into objects; Fastify inject expects a
    // string payload when content-type is application/json.
    const payload = req.body != null && typeof req.body === 'object'
      ? JSON.stringify(req.body)
      : req.body;

    // Handle the request using Fastify's inject method for serverless
    const response = await app.inject({
      method: req.method as any,
      url: req.url || '/',
      headers: forwardHeaders as any,
      payload,
    });

    // Set response headers
    const headers = response.headers;
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        res.setHeader(key, value as string);
      }
    }

    // Send response
    res.status(response.statusCode).send(response.payload);
  } catch (error) {
    console.error('Serverless handler error:', error);
    res.status(500).json({
      detail: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
