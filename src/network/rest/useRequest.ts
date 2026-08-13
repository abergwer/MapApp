import { useCallback, useEffect, useRef, useState } from 'react'
import { RestError } from './types'

/** Same state flags as `useApiQuery`, minus the caching. */
export interface UseRequestResult<T> {
  data: T | undefined
  error: RestError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  /** Runs the fetcher (again). The only trigger when `auto: false`. */
  run: () => Promise<T | undefined>
}

/**
 * Request state WITHOUT React Query — no cache, no `<NetworkProvider>`, no
 * dependency. Runs the fetcher once on mount; call `run` to run it again.
 * With `{ auto: false }` nothing runs until you call `run()` — use that for
 * writes triggered by a click. Use `useApiQuery` for cached reads instead.
 *
 * Not exported directly — consume it through `createApiHooks(api)`, which
 * restricts it to your api's method names:
 *
 * @example
 * const { data, isLoading, isError, error, run } = useRequest('getTodo', id)
 */
export function useRequest<T>(
  fetcher: () => Promise<T>,
  { auto = true }: { auto?: boolean } = {},
): UseRequestResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<RestError | null>(null)
  const [isLoading, setIsLoading] = useState(auto)

  // Ref so `run` always calls the latest fetcher without re-running the
  // mount effect on every render.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  // Incremented per run so an old response can't overwrite a newer one.
  const runId = useRef(0)

  const run = useCallback(async (): Promise<T | undefined> => {
    const id = ++runId.current
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      if (id !== runId.current) return undefined // superseded by a newer run
      setData(result)
      setIsLoading(false)
      return result
    } catch (err) {
      if (id !== runId.current) return undefined
      setError(err instanceof RestError ? err : new RestError(String(err), 0))
      setIsLoading(false)
      return undefined
    }
  }, [])

  useEffect(() => {
    if (auto) void run()
  }, [auto, run])

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: !isLoading && error === null && data !== undefined,
    run,
  }
}
