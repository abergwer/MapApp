import type {
  HttpMethod,
  QueryParams,
  RequestOptions,
  RestClientConfig,
} from './types'
import { RestError } from './types'

/**
 * Joins `baseURL` and `path` (absolute `http(s)://` paths bypass the base)
 * and appends `params` as a query string. `undefined`/`null` params are
 * skipped; a `?` already present in the URL is respected.
 */
function buildUrl(baseURL: string, path: string, params?: QueryParams): string {
  // Absolute URLs are used as-is; otherwise join base and path with exactly
  // one slash between them, regardless of trailing/leading slashes.
  const url = /^https?:\/\//.test(path)
    ? path
    : `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`

  if (!params) return url

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) search.append(key, String(value))
  }
  const query = search.toString()
  // Append with '&' when the path already carries its own query string.
  return query ? `${url}${url.includes('?') ? '&' : '?'}${query}` : url
}

/**
 * Reads the response body based on its headers:
 * empty responses (204 / content-length 0) -> `null`,
 * JSON content type -> parsed object, anything else -> raw text.
 */
async function parseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null
  }
  if (contentType.includes('application/json')) return response.json()
  return response.text()
}

/**
 * Minimal, dependency-free REST client built on `fetch`.
 * Returns typed helpers for every HTTP verb.
 *
 * Behavior in one place:
 * - Every failure (HTTP, network, timeout, abort) surfaces as a `RestError`.
 * - Requests time out after `timeout` ms (default 30s, per-request override).
 * - `getAuthToken` is read on every request and sent as a Bearer header.
 * - JSON bodies and JSON/text responses are handled automatically.
 */
export function createRestClient(config: RestClientConfig = {}) {
  const {
    baseURL = '',
    headers: baseHeaders = {},
    getAuthToken,
    timeout = 30_000,
    onError,
  } = config

  /** Core request pipeline; the verb helpers below all delegate here. */
  async function request<T = unknown>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<T> {
    // One controller drives fetch cancellation for both the timeout and the
    // caller's own signal.
    const controller = new AbortController()
    const timeoutMs = options.timeout ?? timeout
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    // Forward an external abort signal to our controller.
    if (options.signal) {
      if (options.signal.aborted) controller.abort()
      else
        options.signal.addEventListener('abort', () => controller.abort(), {
          once: true,
        })
    }

    // Header precedence: per-request options override client-level defaults.
    const headers: Record<string, string> = { ...baseHeaders, ...options.headers }
    // Token is fetched per request so rotation/expiry is picked up naturally.
    const token = getAuthToken?.()
    if (token) headers.Authorization = `Bearer ${token}`

    // Bodies are JSON by default; callers can override Content-Type per request.
    const hasBody = body !== undefined && body !== null
    if (hasBody && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    try {
      const response = await fetch(buildUrl(baseURL, path, options.params), {
        method,
        headers,
        body: hasBody ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      // Parse before the ok-check so error responses keep their payload,
      // which is exposed on `RestError.data` for callers to inspect.
      const payload = await parseBody(response)

      if (!response.ok) {
        throw new RestError(
          `Request failed with status ${response.status}`,
          response.status,
          payload,
        )
      }

      return payload as T
    } catch (err) {
      // Normalize everything to RestError (status 0 = no HTTP response),
      // report it once via onError, then rethrow for the caller.
      const error =
        err instanceof RestError ? err : new RestError(abortMessage(err), 0)
      onError?.(error)
      throw error
    } finally {
      clearTimeout(timer)
    }

    // Distinguishes caller aborts from timeouts and plain network failures.
    function abortMessage(err: unknown): string {
      if (options.signal?.aborted) return 'Request aborted'
      if (controller.signal.aborted)
        return `Request timed out after ${timeoutMs}ms`
      return (err as Error).message || 'Network request failed'
    }
  }

  // Thin per-verb wrappers: GET/DELETE take no body, the rest accept one.
  return {
    request,
    get: <T = unknown>(path: string, options?: RequestOptions) =>
      request<T>('GET', path, undefined, options),
    post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('POST', path, body, options),
    put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PUT', path, body, options),
    patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) =>
      request<T>('PATCH', path, body, options),
    delete: <T = unknown>(path: string, options?: RequestOptions) =>
      request<T>('DELETE', path, undefined, options),
  }
}

/** Inferred client shape, convenient for passing through props/context. */
export type RestClient = ReturnType<typeof createRestClient>
