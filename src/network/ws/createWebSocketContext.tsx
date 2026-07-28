import { createContext, useContext, type ReactNode } from 'react'
import { useWebSocket } from './useWebSocket'
import type {
  IncomingMap,
  OutgoingMap,
  UseWebSocketOptions,
  WebSocketService,
} from './types'

/**
 * Establishes a single shared WebSocket connection and exposes it through a
 * React context, so every component can `send` / read `status` via one hook.
 *
 * The connection is declared once (url, incoming handlers, outgoing messages)
 * and lives for as long as the provider is mounted. Fully decoupled — the
 * package knows nothing about your specific messages.
 *
 * @example
 * export const { WebSocketProvider, useWebSocketContext } = createWebSocketContext({
 *   url: 'wss://example.com/socket',
 *   incoming: { chat: (m: { text: string }) => store.add(m) },
 *   outgoing: { chat: message<{ text: string }>() },
 * })
 *
 * // anywhere in the tree:
 * const { status, send } = useWebSocketContext()
 */
export function createWebSocketContext<
  TIncoming extends IncomingMap = IncomingMap,
  TOutgoing extends OutgoingMap = OutgoingMap,
>(options: UseWebSocketOptions<TIncoming, TOutgoing>) {
  const WebSocketContext = createContext<WebSocketService<TOutgoing> | null>(
    null,
  )

  function WebSocketProvider({ children }: { children: ReactNode }) {
    const service = useWebSocket(options)
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
