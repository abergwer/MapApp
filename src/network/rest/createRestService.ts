import {
  useMutation as useReactMutation,
  useQuery as useReactQuery,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query'
import { createRestClient } from './createRestClient'
import type {
  AnyEndpoint,
  Args,
  EndpointMap,
  ReadName,
  ResponseOf,
  VarsOf,
  WriteName,
} from './endpoints'
import type { RestClientConfig } from './types'
import { RestError } from './types'
import {
  useRequest as useClientRequest,
  type UseRequestOptions,
  type UseRequestResult,
} from './useRequest'

// Endpoint declaration lives in ./endpoints.ts; this file wires declared
// endpoints to the REST client and the TanStack Query hooks.
export { get, post, put, patch, del, type EndpointDef } from './endpoints'

// Hook options exposed to callers. The service owns the keys and fetch
// functions internally, so those fields are omitted.
type QueryOptions<T> = Omit<
  UseQueryOptions<T, RestError, T, readonly unknown[]>,
  'queryKey' | 'queryFn'
>
type MutationOptions<E extends AnyEndpoint> = Omit<
  UseMutationOptions<ResponseOf<E>, RestError, VarsOf<E>>,
  'mutationFn'
>

// Full service config: normal REST client config plus the declared endpoints.
export interface RestServiceConfig<TEndpoints extends EndpointMap>
  extends RestClientConfig {
  endpoints: TEndpoints
}

/**
 * Creates a typed REST service from a declared endpoint map.
 * Unknown endpoint names fail at compile time, and `useMutation` only accepts
 * endpoints whose method is POST/PUT/PATCH/DELETE.
 */
export function createRestService<TEndpoints extends EndpointMap>(
  config: RestServiceConfig<TEndpoints>,
) {
  // `endpoints` are used for typed routing; the rest goes to the low-level client.
  const { endpoints, ...clientConfig } = config
  // One client instance is shared by all service methods.
  const client = createRestClient(clientConfig)

  // Turns an endpoint name + vars into the actual request details.
  function resolve(name: keyof TEndpoints, vars: unknown) {
    const { method, path } = endpoints[name]
    // Only POST/PUT/PATCH send vars as the JSON body.
    const sendsBody = method === 'POST' || method === 'PUT' || method === 'PATCH'
    return {
      method,
      // Dynamic paths get vars; static paths are used as-is.
      path: typeof path === 'function' ? path(vars as never) : path,
      body: sendsBody ? vars : undefined,
    }
  }

  // React-Query-like state (data/isLoading/isError) without React Query.
  // Works for ANY declared endpoint — unknown names fail at compile time.
  // Reads auto-fetch on mount; for writes pass `enabled: false` and fire
  // manually via `refetch()`.
  function useRequest<K extends keyof TEndpoints & string>(
    name: K,
    ...[vars, options]: Args<TEndpoints[K], Omit<UseRequestOptions, 'body'>>
  ): UseRequestResult<ResponseOf<TEndpoints[K]>> {
    const { method, path, body } = resolve(name, vars)
    return useClientRequest<ResponseOf<TEndpoints[K]>>(client, method, path, {
      ...options,
      body,
    })
  }

  // Cached read request. Only read endpoints are allowed here.
  function useQuery<K extends ReadName<TEndpoints>>(
    name: K,
    ...[vars, options]: Args<TEndpoints[K], QueryOptions<ResponseOf<TEndpoints[K]>>>
  ): UseQueryResult<ResponseOf<TEndpoints[K]>, RestError> {
    const { method, path } = resolve(name, vars)
    return useReactQuery<ResponseOf<TEndpoints[K]>, RestError>({
      // Cache is separated by endpoint name, then vars (when present).
      queryKey: vars === undefined ? [name] : [name, vars],
      // React Query supplies `signal`; forwarding it lets fetch abort cleanly.
      queryFn: ({ signal }) =>
        client.request<ResponseOf<TEndpoints[K]>>(method, path, undefined, {
          signal,
        }),
      // User options like enabled/staleTime are still allowed.
      ...options,
    })
  }

  // Cached write request. Only POST/PUT/PATCH/DELETE endpoints are allowed here.
  function useMutation<K extends WriteName<TEndpoints>>(
    name: K,
    options?: MutationOptions<TEndpoints[K]>,
  ): UseMutationResult<
    ResponseOf<TEndpoints[K]>,
    RestError,
    VarsOf<TEndpoints[K]>
  > {
    return useReactMutation<
      ResponseOf<TEndpoints[K]>,
      RestError,
      VarsOf<TEndpoints[K]>
    >({
      // `vars` come from mutate(vars), then we resolve the actual request.
      mutationFn: (vars) => {
        const { method, path, body } = resolve(name, vars)
        return client.request<ResponseOf<TEndpoints[K]>>(method, path, body)
      },
      // User options like onSuccess/onError/retry are still allowed.
      ...options,
    })
  }

  // Public service API.
  return { client, useRequest, useQuery, useMutation }
}

// Convenient type for passing this service through context/props.
export type RestService<TEndpoints extends EndpointMap = EndpointMap> =
  ReturnType<typeof createRestService<TEndpoints>>
