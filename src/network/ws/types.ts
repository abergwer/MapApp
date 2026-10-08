export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed'

/**
 * Every message on the wire is a plain JSON object with a `type` field.
 * Declare your outgoing messages as a union of these to get compile-time
 * checking on `send`:
 *
 *   type Outgoing = { type: 'chat'; text: string } | { type: 'ping' }
 */
export interface OutgoingMessage {
  type: string
}

/**
 * Incoming routing: message `type` -> handler. Declare each payload inline:
 *
 *   incoming: { chat: (msg: { text: string }) => console.log(msg.text) }
 */
// `never` here just means "any concrete payload type is accepted".
export type IncomingHandlers = Record<string, (payload: never, raw: MessageEvent) => void>

export interface UseWebSocketOptions {
  /** Endpoint, e.g. `wss://example.com/socket`. */
  url: string
  /** Incoming messages: `type` -> handler receiving the parsed message. */
  incoming?: IncomingHandlers
  /** Sub-protocols passed to the native `WebSocket`. */
  protocols?: string | string[]
  /** Connect automatically on mount. Default: `true`. */
  autoConnect?: boolean
  /** Reconnect automatically after an unexpected close. Default: `true`. */
  reconnect?: boolean
  /** Delay between reconnect attempts (ms). Default: `3000`. */
  reconnectInterval?: number
  /** Maximum reconnect attempts. Default: `Infinity`. */
  maxReconnectAttempts?: number
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  /** Called for every raw frame, before routing (including non-JSON ones). */
  onMessage?: (event: MessageEvent) => void
}

export interface WebSocketService<TOutgoing extends OutgoingMessage = OutgoingMessage> {
  status: WebSocketStatus
  /** Send a message as JSON. Returns false when the socket is not open. */
  send: (message: TOutgoing) => boolean
  connect: () => void
  disconnect: () => void
  getSocket: () => WebSocket | null
}
