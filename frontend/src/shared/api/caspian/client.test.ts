import { afterEach, describe, expect, it } from 'bun:test';
import { createCaspianClient } from './client';
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe('passport API transport', () => {
  it('sends a revocation with revision, actor authentication and a stable idempotency key', async () => {
    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe('/api/backend/shipments/shp_x/revocations');
      expect(init?.method).toBe('POST');
      expect(JSON.parse(init?.body as string)).toEqual({ expected_revision: 18 });
      expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('reviewed-revocation');
      expect(new Headers(init?.headers).get('Authorization')).toStartWith('Bearer ');
      return Response.json({ id: 'op_x', status: 'queued', kind: 'revoke' });
    }) as unknown as typeof fetch;
    const result = await createCaspianClient('/api/backend', () => 'carrier').revoke('shp_x', 18, 'reviewed-revocation');
    expect(result.status).toBe('queued');
  });
  it('returns exact document bytes and preserves backend errors instead of decoding binary as JSON', async () => {
    const client = createCaspianClient('/api/backend', () => 'logistician');
    globalThis.fetch = (async () => new Response(new Uint8Array([0, 255, 13, 10]), { headers: { 'Content-Type': 'application/octet-stream' } })) as unknown as typeof fetch;
    expect(new Uint8Array(await (await client.downloadDocument('shipment', 'invoice', 2)).arrayBuffer())).toEqual(new Uint8Array([0, 255, 13, 10]));
    globalThis.fetch = (async () => Response.json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Версия не найдена' } }, { status: 404 })) as unknown as typeof fetch;
    await expect(client.downloadDocument('shipment', 'invoice', 9)).rejects.toMatchObject({ status: 404, code: 'DOCUMENT_NOT_FOUND' });
  });
});
