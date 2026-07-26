import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  IncomingMap,
  OutgoingMap,
  UseWebSocketOptions,
  WebSocketService,
  WebSocketStatus,
} from './types'

/**
 * Connects to a WebSocket and routes incoming JSON messages to typed handlers
 * by their `name`. Handles auto-connect, reconnect and cleanup for you.
 *
 * Incoming and outgoing messages are declared as two separate maps; both the
 * `incoming` handler payloads and the `send` payloads are then fully typed.
 *
 * @example
 * const { send } = useWebSocket({
 *   url: 'wss://example.com/socket',
 *   incoming: {
 *     chat: (msg: { text: string; user: string }) => console.log(msg.user),
 *   },
 *   outgoing: {
 *     chat: message<{ text: string }>(),
 *     typing: message<{ on: boolean }>(),
 *   },
 * })
 * send('chat', { text: 'hi' })
 */
export function useWebSocket<
  TIncoming extends IncomingMap = IncomingMap,
  TOutgoing extends OutgoingMap = OutgoingMap,
>(
  options: UseWebSocketOptions<TIncoming, TOutgoing>,
): WebSocketService<TOutgoing> {
  const {
    url,
    incoming,
    outgoing,
    protocols,
    messageKey = 'type',
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = Infinity,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = options

  const [status, setStatus] = useState<WebSocketStatus>('closed')

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const attemptsRef = useRef(0)
  const manualCloseRef = useRef(false)

  // Keep maps/protocols fresh without re-running connect().
  const incomingRef = useRef(incoming)
  incomingRef.current = incoming
  const outgoingRef = useRef(outgoing)
  outgoingRef.current = outgoing
  const protocolsRef = useRef(protocols)
  protocolsRef.current = protocols
  const callbacksRef = useRef({ onOpen, onClose, onError, onMessage })
  callbacksRef.current = { onOpen, onClose, onError, onMessage }

  const connect = useCallback(() => {
    const existing = socketRef.current
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    manualCloseRef.current = false
    setStatus('connecting')
    const ws = new WebSocket(url, protocolsRef.current)
    socketRef.current = ws

    ws.onopen = (event) => {
      attemptsRef.current = 0
      setStatus('open')
      callbacksRef.current.onOpen?.(event)
    }

    ws.onmessage = (event) => {
      // Opt-in: storing every frame in state re-renders the consumer per
      // message, which is pure overhead on high-frequency streams.
      //if (trackLastMessage) setLastMessage(event)
      callbacksRef.current.onMessage?.(event)

      let data: unknown
      try {
        data = JSON.parse(event.data)
      } catch {
        return // Non-JSON frames are exposed via onMessage/lastMessage only.
      }
      if (data === null || typeof data !== 'object') return

      const record = data as Record<string, unknown>
      const name = record[messageKey]
      if (typeof name !== 'string') return
      const handler = incomingRef.current?.[name]
      if (handler) {
        ;(handler as (p: unknown, e: MessageEvent) => void)(record, event)
      }
    }

    ws.onerror = (event) => callbacksRef.current.onError?.(event)

    ws.onclose = (event) => {
      socketRef.current = null
      setStatus('closed')
      callbacksRef.current.onClose?.(event)

      if (
        !manualCloseRef.current &&
        reconnect &&
        attemptsRef.current < maxReconnectAttempts
      ) {
        attemptsRef.current += 1
        reconnectTimerRef.current = setTimeout(connect, reconnectInterval)
      }
    }
  }, [url, messageKey, reconnect, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    manualCloseRef.current = true
    clearTimeout(reconnectTimerRef.current)
    const ws = socketRef.current
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      setStatus('closing')
      ws.close()
    }
  }, [])

  const sendRaw = useCallback<WebSocketService<TOutgoing>['sendRaw']>((data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(data)
      return true
    }
    return false
  }, [])

  const send = useCallback<WebSocketService<TOutgoing>['send']>(
    (name, ...args) => {
      const declared = outgoingRef.current
      if (declared && !(name in declared)) {
        console.warn(
          `[useWebSocket] "${String(name)}" is not a declared outgoing message.`,
        )
        return false
      }
      const payload = args[0] as Record<string, unknown> | undefined
      // Flat wire format, symmetric with incoming routing:
      // { [messageKey]: name, ...payload }
      return sendRaw(JSON.stringify({ ...payload, [messageKey]: name }))
    },
    [sendRaw, messageKey],
  )

  useEffect(() => {
    if (autoConnect) connect()
    return () => {
      manualCloseRef.current = true
      clearTimeout(reconnectTimerRef.current)
      socketRef.current?.close()
    }
  }, [autoConnect, connect])

  return {
    status,
    send,
    sendRaw,
    connect,
    disconnect,
    getSocket: () => socketRef.current,
  }
}
