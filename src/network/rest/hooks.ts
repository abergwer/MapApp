import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions, UseQueryOptions } from '@tanstack/react-query'
import { useRequest as useRequestBase } from './useRequest'
import type { UseRequestResult } from './useRequest'

/** An api definition: an object of functions taking 0-1 args, returning promises. */
type ApiDefinition = Record<string, (vars: never) => Promise<unknown>>

type Result<F> = F extends (...args: never[]) => Promise<infer R> ? R : never
type Vars<F> = F extends () => Promise<unknown>
  ? void
  : F extends (vars: infer V) => Promise<unknown>
    ? V
    : never

/**
 * Builds `useApiQuery` / `useApiMutation` / `useRequest` hooks that ONLY
 * accept the method names of your api definition — anything else is a
 * compile error. All React Query options pass through. `useApiQuery` and
 * `useApiMutation` require `<NetworkProvider>` at the app root;
 * `useRequest` does not.
 *
 * @example
 * export const api = {
 *   getTodos:   ()              => client.get<Todo[]>('/todos'),
 *   createTodo: (todo: NewTodo) => client.post<Todo>('/todos', todo),
 * }
 * export const { useApiQuery, useApiMutation, useRequest } = createApiHooks(api)
 *
 * // in components:
 * const todos  = useApiQuery(['todos'], 'getTodos')
 * const create = useApiMutation('createTodo', { invalidate: [['todos']] })
 * create.mutate({ title: 'Hi' })
 * const save   = useRequest('createTodo', draft, { auto: false })
 * useApiQuery(['todos'], 'getTdoos') // ❌ does not compile
 */
export function createApiHooks<TApi extends ApiDefinition>(api: TApi) {
  function useApiQuery<K extends keyof TApi>(
    key: readonly unknown[],
    method: K,
    vars?: Vars<TApi[K]>,
    options?: Omit<UseQueryOptions<Result<TApi[K]>>, 'queryKey' | 'queryFn'>,
  ) {
    return useQuery({
      queryKey: key,
      // The definition constraint guarantees this call shape; TS just can't
      // relate the generic key back to the concrete function.
      queryFn: () => api[method](vars as never) as Promise<Result<TApi[K]>>,
      ...options,
    })
  }

  function useApiMutation<K extends keyof TApi>(
    method: K,
    options: Omit<
      UseMutationOptions<Result<TApi[K]>, Error, Vars<TApi[K]>>,
      'mutationFn'
    > & {
      /** Query keys to refetch after a successful write. */
      invalidate?: readonly (readonly unknown[])[]
    } = {},
  ) {
    const queryClient = useQueryClient()
    const { invalidate, onSuccess, ...mutationOptions } = options
    return useMutation({
      ...mutationOptions,
      mutationFn: (vars: Vars<TApi[K]>) =>
        api[method](vars as never) as Promise<Result<TApi[K]>>,
      onSuccess: (...args) => {
        for (const key of invalidate ?? [])
          void queryClient.invalidateQueries({ queryKey: key })
        return onSuccess?.(...args)
      },
    })
  }

  /** Request state WITHOUT React Query — no cache, no provider. See useRequest.ts. */
  function useRequest<K extends keyof TApi>(
    method: K,
    vars?: Vars<TApi[K]>,
    options?: { auto?: boolean },
  ): UseRequestResult<Result<TApi[K]>> {
    return useRequestBase(
      () => api[method](vars as never) as Promise<Result<TApi[K]>>,
      options,
    )
  }

  return { useApiQuery, useApiMutation, useRequest }
}
