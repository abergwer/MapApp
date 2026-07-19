import { createContext, useContext, type ReactNode } from 'react'

/**
 * Wraps a REST service in a React context so it can be reached from anywhere
 * with a single hook, without importing the instance everywhere.
 *
 * The factory is decoupled from your endpoints — pass the service you created
 * with `createRestService`, and the returned hook gives it back fully typed.
 *
 * @example
 * const api = createRestService({ ... })
 * export const { ApiProvider, useApiContext } = createApiContext(api)
 *
 * // anywhere in the tree:
 * const api = useApiContext()
 * const { data } = api.useQuery('getTodo', 1)
 */
export function createApiContext<TService>(service: TService) {
  const ApiContext = createContext<TService | null>(null)

  function ApiProvider({ children }: { children: ReactNode }) {
    return <ApiContext.Provider value={service}>{children}</ApiContext.Provider>
  }

  function useApiContext(): TService {
    const ctx = useContext(ApiContext)
    if (ctx === null) {
      throw new Error('useApiContext must be used within an <ApiProvider>')
    }
    return ctx
  }

  return { ApiProvider, useApiContext }
}
