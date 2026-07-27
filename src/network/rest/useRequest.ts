import { useCallback, useEffect, useRef, useState } from 'react'
import type { RestClient } from './createRestClient'
import type { HttpMethod, RequestOptions } from './types'
import { RestError } from './types'

/** React-Query-like state exposed to consumers. */
export interface UseRequestResult<T> {
  data: T | undefined
  error: RestError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  /** Re-runs the request manually (also the only trigger when `enabled: false`). */
  refetch: () => Promise<T | undefined>
}

export interface UseRequestOptions extends Omit<RequestOptions, 'signal'> {
  /** JSON body for POST/PUT/PATCH requests. */
  body?: unknown
  /** When false the request does not run automatically. Default: true. */
  enabled?: boolean
}

/**
 * Wraps `client.request` in React-Query-like state without pulling in
 * React Query. Fetches on mount and whenever method/path/body/params change,
 * aborts in-flight requests on unmount, and ignores stale responses.
 *
 * @example
 * const client = createRestClient({ baseURL: 'https://api.example.com' })
 *
 * function Todo({ id }: { id: number }) {
 *   const { data, isLoading, isError, error, refetch } =
 *     useRequest<Todo>(client, 'GET', `/todos/${id}`)
 *   if (isLoading) return <Spinner />
 *   if (isError) return <ErrorView error={error} onRetry={refetch} />
 *   return <TodoView todo={data!} />
 * }
 */
export function useRequest<T = unknown>(
  client: RestClient,
  method: HttpMethod,
  path: string,
  options: UseRequestOptions = {},
): UseRequestResult<T> {
  const { body, enabled = true, ...requestOptions } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<RestError | null>(null)
  const [isLoading, setIsLoading] = useState(enabled)

  // Latest values live in refs so `refetch` stays stable and the effect
  // below only re-runs when the request identity actually changes.
  const latest = useRef({ client, method, path, body, requestOptions })
  latest.current = { client, method, path, body, requestOptions }

  // Incremented per fetch so out-of-order responses are dropped.
  const fetchId = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)

  const refetch = useCallback(async (): Promise<T | undefined> => {
    const id = ++fetchId.current
    // A new fetch supersedes any in-flight one.
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)
    setError(null)

    const { client, method, path, body, requestOptions } = latest.current
    try {
      const result = await client.request<T>(method, path, body, {
        ...requestOptions,
        signal: controller.signal,
      })
      if (id !== fetchId.current) return undefined // stale response
      setData(result)
      setIsLoading(false)
      return result
    } catch (err) {
      if (id !== fetchId.current) return undefined // aborted/superseded
      setError(err instanceof RestError ? err : new RestError(String(err), 0))
      setIsLoading(false)
      return undefined
    }
  }, [])

  // Serialized so changing object literals only refetch on real changes.
  const bodyKey = JSON.stringify(body ?? null)
  const paramsKey = JSON.stringify(requestOptions.params ?? null)

  useEffect(() => {
    if (!enabled) return
    void refetch()
    // Abort the in-flight request when deps change or on unmount.
    return () => controllerRef.current?.abort()
  }, [enabled, method, path, bodyKey, paramsKey, refetch])

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: !isLoading && error === null && data !== undefined,
    refetch,
  }
}
