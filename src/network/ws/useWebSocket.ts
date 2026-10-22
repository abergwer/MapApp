import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  OutgoingMessage,
  UseWebSocketOptions,
  WebSocketService,
  WebSocketStatus,
} from './types'

/**
 * Connects to a WebSocket, keeps it alive (auto-reconnect) and routes each
 * incoming JSON message to the `incoming` handler matching its `type` field.
 *
 * @example
 * type Outgoing = { type: 'chat'; text: string } | { type: 'ping' }
 *
 * const { send, status } = useWebSocket<Outgoing>({
 *   url: 'wss://example.com/socket',
 *   incoming: {
 *     chat: (msg: { text: string; user: string }) => console.log(msg.user),
 *   },
 * })
 * send({ type: 'chat', text: 'hi' })
 */
export function useWebSocket<TOutgoing extends OutgoingMessage = OutgoingMessage>(
  options: UseWebSocketOptions,
): WebSocketService<TOutgoing> {
  const {
    url,
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = Infinity,
  } = options

  const [status, setStatus] = useState<WebSocketStatus>('closed')

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const attemptsRef = useRef(0)
  const manualCloseRef = useRef(false)

  // The latest options live in a ref so handlers stay fresh without
  // reconnecting the socket on every render.
  const optionsRef = useRef(options)
  optionsRef.current = options

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
    const ws = new WebSocket(url, optionsRef.current.protocols)
    socketRef.current = ws

    ws.onopen = (event) => {
      attemptsRef.current = 0
      setStatus('open')
      optionsRef.current.onOpen?.(event)
    }

    ws.onmessage = (event) => {
      optionsRef.current.onMessage?.(event)

      let data: unknown
      try {
        data = JSON.parse(event.data)
      } catch {
        return // non-JSON frames only reach onMessage above
      }
      if (data === null || typeof data !== 'object') return

      const type = (data as { type?: unknown }).type
      if (typeof type !== 'string') return
      const handler = optionsRef.current.incoming?.[type]
      if (handler) (handler as (payload: unknown, raw: MessageEvent) => void)(data, event)
    }

    ws.onerror = (event) => optionsRef.current.onError?.(event)

    ws.onclose = (event) => {
      socketRef.current = null
      setStatus('closed')
      optionsRef.current.onClose?.(event)

      if (
        !manualCloseRef.current &&
        reconnect &&
        attemptsRef.current < maxReconnectAttempts
      ) {
        attemptsRef.current += 1
        reconnectTimerRef.current = setTimeout(connect, reconnectInterval)
      }
    }
  }, [url, reconnect, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    manualCloseRef.current = true
    clearTimeout(reconnectTimerRef.current)
    const ws = socketRef.current
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      setStatus('closing')
      ws.close()
    }
  }, [])

  const send = useCallback((message: TOutgoing): boolean => {
    const ws = socketRef.current
    if (ws?.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(message))
    return true
  }, [])

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
    connect,
    disconnect,
    getSocket: () => socketRef.current,
  }
}
