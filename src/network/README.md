# `network` — portable networking package

Drop this `network/` folder into any Vite + React + TS project. It bundles a
small REST client, two TanStack Query hooks, and a WebSocket hook.

## Copy steps

1. Copy the whole `src/network` folder into the new project.
2. Install the one dependency: `npm i @tanstack/react-query`.
3. Wrap your app once with `NetworkProvider` (needed for the query hooks).

## REST

Declare your API as **plain typed functions** — the signatures are the
contract, so wrong names or arguments are a compile error. No special types
to learn.

```tsx
import { createRestClient, createApiHooks, NetworkProvider } from './network'

// 1. One client + one api object per server (module scope). The hooks are
//    created FROM the api, so they only accept these method names.
const client = createRestClient({ baseURL: 'https://api.example.com' })

export const api = {
  getTodos:   ()              => client.get<Todo[]>('/todos'),
  getTodo:    (id: number)    => client.get<Todo>(`/todos/${id}`),
  createTodo: (todo: NewTodo) => client.post<Todo>('/todos', todo),
  deleteTodo: (id: number)    => client.delete<void>(`/todos/${id}`),
}
export const { useApiQuery, useApiMutation, useRequest } = createApiHooks(api)

// 2. Provider at the root (main.tsx).
<NetworkProvider><App /></NetworkProvider>

// 3a. Plain call — works anywhere, including outside React.
const todo = await api.getTodo(1)

// 3b. Cached read (TanStack Query): same key = shared cache.
//     Signature: useApiQuery(key, method, vars?, queryOptions?)
const { data, isLoading } = useApiQuery(['todo', id], 'getTodo', id)

// 3c. Write with request state; `invalidate` refetches those keys on success.
//     All useMutation options pass through (onSuccess, retry, ...).
const create = useApiMutation('createTodo', { invalidate: [['todos']] })
create.mutate({ title: 'Hi' })            // fire-and-forget
const saved = await create.mutateAsync({ title: 'Hi' }) // need the result

// useApiQuery(['x'], 'getTdoo') ❌ does not compile — not in the api.
```

`createRestClient` config (all optional): `baseURL`, `headers`,
`getAuthToken`, `timeout`, `onError`. Every failure — HTTP error, network,
timeout, abort — surfaces as a `RestError` with `status` and `data`.

### Without React Query

`useRequest` (also from `createApiHooks`, same method-name restriction)
gives the same flags without React Query — no `NetworkProvider`, no caching.
Prefer `useApiQuery` when you want the cache.

```tsx
// GET — runs on mount, `run()` re-runs it.
const { data, isLoading, isError, error, run } = useRequest('getTodo', id)

// POST — `auto: false` waits for run(), e.g. on a button click.
const save = useRequest('createTodo', draft, { auto: false })
<button onClick={() => save.run()} disabled={save.isLoading}>Save</button>
```

See `src/bridge/examples.tsx` for all five patterns in one runnable file.

## WebSocket

Incoming messages are routed by their `type` field to a handler map; the
payload type is declared inline on each handler. Outgoing messages are a
union you declare, so `send` is compile-checked.

```tsx
import { useWebSocket } from './network'

type Outgoing = { type: 'chat'; text: string } | { type: 'ping' }

const { send, status } = useWebSocket<Outgoing>({
  url: 'wss://example.com/socket',
  incoming: {
    chat: (msg: { text: string; user: string }) => console.log(msg.user),
    presence: (msg: { online: number }) => console.log(msg.online),
  },
})

send({ type: 'chat', text: 'hello' }) // ✅ typed
send({ type: 'nope' })                // ❌ does not compile
```

Auto-connect, reconnect and cleanup are handled for you. For one shared
connection app-wide, use `createWebSocketContext` (same options) and mount
the returned provider once.
