import type { HttpMethod } from './types'

// ---------------------------------------------------------------------------
// Declaring endpoints
//
// An endpoint is declared with one of the verb helpers below. The helper
// captures three things in the returned `EndpointDef` type:
//   - TResponse: what the endpoint returns
//   - TVars:     what callers must pass in (`void` = nothing)
//   - TMethod:   the exact HTTP method (used to split reads from writes)
//
//   getTodos:   get<Todo[]>('/todos')
//   getTodo:    get<Todo, number>((id) => `/todos/${id}`)
//   createTodo: post<Todo, { title: string }>('/todos')
// ---------------------------------------------------------------------------

/** A path is either fixed (`'/todos'`) or built from vars (`(id) => `/todos/${id}``). */
export type Path<TVars> = string | ((vars: TVars) => string)

/** One declared endpoint. See the file header for what the generics mean. */
export interface EndpointDef<
  TResponse = unknown,
  TVars = void,
  TMethod extends HttpMethod = HttpMethod,
> {
  method: TMethod
  path: Path<TVars>
  /** Type-only marker so TResponse/TVars can be read back; never exists at runtime. */
  readonly __types?: { response: TResponse; vars: TVars }
}

// All verb helpers are the same function, differing only in the method they tag.
function define<TMethod extends HttpMethod>(method: TMethod) {
  return <TResponse, TVars = void>(
    path: Path<TVars>,
  ): EndpointDef<TResponse, TVars, TMethod> => ({ method, path })
}

export const get = define('GET')
export const post = define('POST')
export const put = define('PUT')
export const patch = define('PATCH')
/** Named `del` because `delete` is a reserved word in JavaScript. */
export const del = define('DELETE')

// ---------------------------------------------------------------------------
// Type utilities used by `createRestService`
// ---------------------------------------------------------------------------

// The loosest endpoint shape, used only to constrain endpoint maps.
// (`vars: never` in `path` lets every concrete endpoint be assignable here.)
export interface AnyEndpoint {
  method: HttpMethod
  path: string | ((vars: never) => string)
  readonly __types?: { response: unknown; vars: unknown }
}

/** Endpoints are declared as an object map: `{ getTodo: get(...), ... }`. */
export type EndpointMap = Record<string, AnyEndpoint>

/** Read the phantom `__types` back out of an endpoint. */
export type ResponseOf<E extends AnyEndpoint> = NonNullable<E['__types']>['response']
export type VarsOf<E extends AnyEndpoint> = NonNullable<E['__types']>['vars']

// POST/PUT/PATCH/DELETE are "writes": allowed in `useMutation`, blocked from
// `useQuery` at compile time.
type WriteMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Endpoint names usable with `useQuery` (everything that is not a write). */
export type ReadName<T extends EndpointMap> = {
  [K in keyof T]: T[K]['method'] extends WriteMethod ? never : K
}[keyof T]

/** Endpoint names usable with `useMutation` (POST/PUT/PATCH/DELETE). */
export type WriteName<T extends EndpointMap> = {
  [K in keyof T]: T[K]['method'] extends WriteMethod ? K : never
}[keyof T]

/** `vars` is optional when the endpoint declares `void`, required otherwise. */
export type Args<E extends AnyEndpoint, TOptions> = VarsOf<E> extends void
  ? [vars?: undefined, options?: TOptions]
  : [vars: VarsOf<E>, options?: TOptions]
