import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

export interface NetworkProviderProps {
  children: ReactNode
  /** Provide your own client to share/customize it; otherwise one is created. */
  client?: QueryClient
}

const defaultClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })

/**
 * Wrap your app once with this to enable the REST query/mutation hooks.
 * No configuration required.
 */
export function NetworkProvider({ children, client }: NetworkProviderProps) {
  const [queryClient] = useState(() => client ?? defaultClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
