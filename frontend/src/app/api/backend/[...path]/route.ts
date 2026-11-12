import previewTokens from '../preview-role-tokens.json';

const backend = (process.env.CASPIAN_API_URL ?? 'https://caspian.psychaos.art/api/v1').replace(/\/$/, '');
type Role = keyof typeof previewTokens;

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  if (path.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part))) return new Response(null, { status: 400 });
  const url = new URL(`${backend}/${path.map(encodeURIComponent).join('/')}`);
  url.search = new URL(request.url).search;
  const roleName = request.headers.get('authorization')?.replace(/^Bearer demo-/, '') as Role;
  const token = Object.hasOwn(previewTokens, roleName) ? previewTokens[roleName] : undefined;
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const contentType = request.headers.get('content-type');
  const idempotency = request.headers.get('idempotency-key');
  if (contentType) headers.set('Content-Type', contentType);
  if (idempotency) headers.set('Idempotency-Key', idempotency);
  try {
    const response = await fetch(url, {
      method: request.method, headers, cache: 'no-store',
      body: request.method === 'POST' ? await request.arrayBuffer() : undefined,
      signal: AbortSignal.timeout(45000),
    });
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: { code: 'BACKEND_UNAVAILABLE', message: 'Backend недоступен' } }, { status: 503 });
  }
}
export const GET = proxy;
export const POST = proxy;
