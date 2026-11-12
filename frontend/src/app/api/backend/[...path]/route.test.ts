import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import previewTokens from '../preview-role-tokens.json';
import { GET, POST } from './route';

const upstream = spyOn(globalThis, 'fetch');
afterEach(() => upstream.mockReset());
const context = (path = ['shipments']) => ({ params: Promise.resolve({ path }) });

describe('backend proxy authentication', () => {
  it.each([
    ['Bearer preview-test-key', 'Bearer preview-test-key'],
    ['Bearer demo-logistician', `Bearer ${previewTokens.logistician}`],
    ['Bearer unknown-key', 'Bearer unknown-key'],
    ['logistician', null],
    ['', null],
  ])('handles authorization case %#', async (authorization, expected) => {
    upstream.mockResolvedValue(new Response('{}', { status: 200 }));
    const response = await GET(new Request('https://example.com/api/backend/shipments', {
      headers: authorization ? { Authorization: authorization } : {},
    }), context());
    expect(response.status).toBe(200);
    const headers = new Headers(upstream.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization') === expected).toBe(true);
  });

  it('preserves backend rejection of an invalid bearer', async () => {
    upstream.mockResolvedValue(new Response('{}', { status: 401 }));
    expect((await GET(new Request('https://example.com', {
      headers: { Authorization: 'Bearer invalid' },
    }), context())).status).toBe(401);
  });

  it('forwards POST payload, query and idempotency key', async () => {
    upstream.mockResolvedValue(new Response('{}', { status: 201 }));
    const response = await POST(new Request('https://example.com/api/backend/shipments?mode=test', {
      method: 'POST', body: '{"test":true}',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'retry-key' },
    }), context());
    const [url, options] = upstream.mock.calls[0];
    expect(String(url)).toEndWith('/shipments?mode=test');
    expect(new Headers(options?.headers).get('Idempotency-Key')).toBe('retry-key');
    expect(new TextDecoder().decode(options?.body as ArrayBuffer)).toBe('{"test":true}');
    expect(response.status).toBe(201);
  });

  it('rejects invalid paths before contacting the backend', async () => {
    expect((await GET(new Request('https://example.com'), context(['..']))).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
});
