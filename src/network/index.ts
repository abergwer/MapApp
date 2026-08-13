// REST
export { createRestClient, type RestClient } from './rest/createRestClient'
export { createApiHooks } from './rest/hooks'
export type { UseRequestResult } from './rest/useRequest'
export { NetworkProvider, type NetworkProviderProps } from './rest/NetworkProvider'
export {
  RestError,
  type HttpMethod,
  type QueryParams,
  type RequestOptions,
  type RestClientConfig,
} from './rest/types'

// WebSocket
export { useWebSocket } from './ws/useWebSocket'
export { createWebSocketContext } from './ws/createWebSocketContext'
export type {
  IncomingHandlers,
  OutgoingMessage,
  UseWebSocketOptions,
  WebSocketService,
  WebSocketStatus,
} from './ws/types'
