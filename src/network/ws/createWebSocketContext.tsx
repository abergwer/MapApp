import { createContext, useContext, type ReactNode } from 'react'
import { useWebSocket } from './useWebSocket'
import type {
  OutgoingMessage,
  UseWebSocketOptions,
  WebSocketService,
} from './types'

/**
 * Establishes a single shared WebSocket connection and exposes it through a
 * React context, so every component can `send` / read `status` via one hook.
 *
 * The connection is declared once (url, incoming handlers) and lives for as
 * long as the provider is mounted. Pass your outgoing-message union as the
 * type argument to get a typed `send`.
 *
 * @example
 * type Outgoing = { type: 'chat'; text: string }
 *
 * export const { WebSocketProvider, useWebSocketContext } =
 *   createWebSocketContext<Outgoing>({
 *     url: 'wss://example.com/socket',
 *     incoming: { chat: (m: { text: string }) => store.add(m) },
 *   })
 *
 * // anywhere in the tree:
 * const { status, send } = useWebSocketContext()
 */
export function createWebSocketContext<
  TOutgoing extends OutgoingMessage = OutgoingMessage,
>(options: UseWebSocketOptions) {
  const WebSocketContext = createContext<WebSocketService<TOutgoing> | null>(
    null,
  )

  function WebSocketProvider({ children }: { children: ReactNode }) {
    const service = useWebSocket<TOutgoing>(options)
    return (
      <WebSocketContext.Provider value={service}>
        {children}
      </WebSocketContext.Provider>
    )
  }

  function useWebSocketContext(): WebSocketService<TOutgoing> {
    const ctx = useContext(WebSocketContext)
    if (ctx === null) {
      throw new Error(
        'useWebSocketContext must be used within a <WebSocketProvider>',
      )
    }
    return ctx
  }

  return { WebSocketProvider, useWebSocketContext }
}
