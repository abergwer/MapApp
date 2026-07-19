// REST
export { createRestClient, type RestClient } from './rest/createRestClient'
export {
  createRestService,
  get,
  post,
  put,
  patch,
  del,
  type EndpointDef,
  type RestService,
  type RestServiceConfig,
} from './rest/createRestService'
export { NetworkProvider, type NetworkProviderProps } from './rest/NetworkProvider'
export { createApiContext } from './rest/createApiContext'
export {
  useRequest,
  type UseRequestOptions,
  type UseRequestResult,
} from './rest/useRequest'
export {
  RestError,
  type HttpMethod,
  type QueryParams,
  type RequestOptions,
  type RestClientConfig,
} from './rest/types'

// WebSocket
export { useWebSocket } from './ws/useWebSocket'
export { useWebSocketQuery } from './ws/useWebSocketQuery'
export { createWebSocketContext } from './ws/createWebSocketContext'
export { message, type OutgoingMessage } from './ws/types'
export type {
  IncomingMap,
  OutgoingMap,
  UseWebSocketOptions,
  WebSocketService,
  WebSocketStatus,
} from './ws/types'
export type {
  UseWebSocketQueryOptions,
  WebSocketQueryService,
} from './ws/useWebSocketQuery'
 