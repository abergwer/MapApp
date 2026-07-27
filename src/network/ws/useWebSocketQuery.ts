import {
  skipToken,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryResult,
} from '@tanstack/react-query'
import { useWebSocket } from './useWebSocket'
import type {
  IncomingMap,
  OutgoingMap,
  UseWebSocketOptions,
  WebSocketService,
} from './types'

/**
 * Options for `useWebSocketQuery`: the normal WebSocket options plus the bits
 * needed to keep a TanStack Query cache entry in sync with the socket.
 */
export type UseWebSocketQueryOptions<
  TData,
  TIncoming extends IncomingMap = IncomingMap,
  TOutgoing extends OutgoingMap = OutgoingMap,
> = UseWebSocketOptions<TIncoming, TOutgoing> & {
  /** Cache key this socket feeds. Read it anywhere with the same key. */
  queryKey: QueryKey
  /** Value used before any message arrives. */
  initialData: TData
  /**
   * Fold each raw message into the cached value. Return the next value.
   * Defaults to "last message wins": the cache is replaced with the parsed
   * JSON of each frame (non-JSON frames are ignored).
   */
  reduceMessage?: (current: TData, event: MessageEvent) => TData
}

export interface WebSocketQueryService<
  TData,
  TOutgoing extends OutgoingMap = OutgoingMap,
> extends WebSocketService<TOutgoing> {
  /** The underlying query result (data, dataUpdatedAt, etc.). */
  query: UseQueryResult<TData, Error>
  /** Convenience accessor for the current cached value. */
  data: TData
}

/**
 * Bridges a WebSocket into TanStack Query: incoming frames update a cache entry
 * through `reduceMessage`, so components read live socket data via the same
 * query cache used for REST. Returns the full WebSocket service plus `data`,
 * so you can also send: declare messages in `outgoing` and call `send`.
 *
 * @example
 * const { data, send, status } = useWebSocketQuery({
 *   url: 'wss://example.com/socket',
 *   queryKey: ['socket', 'messages'],
 *   initialData: [] as Message[],
 *   reduceMessage: (messages, event) =>
 *     [...messages, JSON.parse(event.data)].slice(-20),
 *   outgoing: {
 *     chat: message<{ text: string }>(),
 *     ping: message(),
 *   },
 * })
 * send('chat', { text: 'hi' }) // typed; undeclared names are rejected
 */
export function useWebSocketQuery<
  TData,
  TIncoming extends IncomingMap = IncomingMap,
  TOutgoing extends OutgoingMap = OutgoingMap,
>(
  options: UseWebSocketQueryOptions<TData, TIncoming, TOutgoing>,
): WebSocketQueryService<TData, TOutgoing> {
  const {
    queryKey,
    initialData,
    reduceMessage = defaultReduceMessage,
    onMessage,
    ...socketOptions
  } = options
  const queryClient = useQueryClient()

  // The socket is the source of truth; the query only mirrors the cache.
  // `skipToken` disables fetching entirely and it never goes stale on its own.
  const query = useQuery<TData, Error>({
    queryKey,
    queryFn: skipToken,
    initialData,
    staleTime: Infinity,
  })

  const socket = useWebSocket({
    ...socketOptions,
    onMessage: (event) => {
      queryClient.setQueryData<TData>(queryKey, (current) =>
        reduceMessage(current ?? initialData, event),
      )
      onMessage?.(event)
    },
  })

  return { ...socket, query, data: query.data ?? initialData }
}

/** Default reducer: replace the cache with each frame's parsed JSON. */
function defaultReduceMessage<TData>(current: TData, event: MessageEvent): TData {
  try {
    return JSON.parse(event.data) as TData
  } catch {
    return current // Keep the cached value for non-JSON frames.
  }
}
