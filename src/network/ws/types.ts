
/** Declares an outgoing message's payload type. Phantom — never used at runtime. */
export interface OutgoingMessage<TPayload = void> {
  readonly __payload?: TPayload
}

/**
 * Declares an outgoing message and captures its payload type, for use in the
 * `outgoing` map of `useWebSocket`.
 *
 * @example outgoing: { chat: message<{ text: string }>(), ping: message() }
 */
export function message<TPayload = void>(): OutgoingMessage<TPayload> {
  return {}
}

export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed'

/** Incoming side: a map of message name -> typed handler. */
export type IncomingMap = Record<
  string,
  (payload: never, raw: MessageEvent) => void
>

/** Outgoing side: a map of message name -> declared payload (via `message<T>()`). */
export type OutgoingMap = Record<string, OutgoingMessage<unknown>>

type PayloadOf<M> = M extends OutgoingMessage<infer P> ? P : never

/** `send` takes no payload arg when the outgoing message declares `void`. */
type SendArgs<TPayload> = TPayload extends void | undefined
  ? []
  : [payload: TPayload]

export interface UseWebSocketOptions<
  TIncoming extends IncomingMap = IncomingMap,
  TOutgoing extends OutgoingMap = OutgoingMap,
> {
  /** Endpoint, e.g. `wss://example.com/socket`. */
  url: string
  /** Incoming messages: a map of name -> handler receiving the typed payload. */
  incoming?: TIncoming
  /** Outgoing messages: a map of name -> `message<Payload>()`. */
  outgoing?: TOutgoing
  /** Sub-protocols passed to the native `WebSocket`. */
  protocols?: string | string[]
  /** Field used to route incoming messages and tag outgoing ones. Default: `type`. */
  messageKey?: string
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
  /** Called for every raw message, before routing. */
  onMessage?: (event: MessageEvent) => void
}

export interface WebSocketService<TOutgoing extends OutgoingMap = OutgoingMap> {
  status: WebSocketStatus
  lastMessage: MessageEvent | null
  /** Send a declared message as JSON: `{ [messageKey]: name, ...payload }`. */
  send: <K extends keyof TOutgoing>(
    name: K,
    ...args: SendArgs<PayloadOf<TOutgoing[K]>>
  ) => boolean
  /** Send a raw frame as-is. Returns false if not open. */
  sendRaw: (data: Parameters<WebSocket['send']>[0]) => boolean
  connect: () => void
  disconnect: () => void
  getSocket: () => WebSocket | null
}


