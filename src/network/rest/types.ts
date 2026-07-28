export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Values allowed as query string params. `undefined`/`null` entries are skipped. */
export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>

export interface RestClientConfig {
  /** Prepended to every request path, e.g. `https://api.example.com`. */
  baseURL?: string
  /** Static headers merged into every request. */
  headers?: Record<string, string>
  /** Return a token to be sent as `Authorization: Bearer <token>`. */
  getAuthToken?: () => string | null | undefined
  /** Abort a request after this many ms. Default: 30000. */
  timeout?: number
  /** Called whenever a request fails. */
  onError?: (error: RestError) => void
}

export interface RequestOptions {
  params?: QueryParams
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Per-request timeout override (ms). */
  timeout?: number
}

/** Thrown for non-2xx responses or network/timeout failures. */
export class RestError extends Error {
  readonly status: number
  readonly data: unknown

  constructor(message: string, status: number, data: unknown = null) {
    super(message)
    this.name = 'RestError'
    this.status = status
    this.data = data
  }
}
