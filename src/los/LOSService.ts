/** LOS server client. `/api/los*` is proxied by Vite in dev. */
import type { LOSAreaRequest, LOSRequest, LOSResponse } from './types';

async function post(url: string, body: unknown): Promise<LOSResponse> {
  const started = performance.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LOS server error: ${res.status}`);
  const result = await res.json();
  console.log(`[LOS] ${url} round trip: ${Math.round(performance.now() - started)} ms`);
  return result;
}

export function computeLOS(request: LOSRequest): Promise<LOSResponse> {
  return post('/api/los', request);
}

export function computeAreaLOS(request: LOSAreaRequest): Promise<LOSResponse> {
  return post('/api/los/area', request);
}
