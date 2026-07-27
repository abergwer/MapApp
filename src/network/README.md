# `network` — portable networking package

Drop this `network/` folder into any Vite + React + TS project. It bundles a
REST layer (optionally cached with TanStack Query) and a WebSocket hook.

## Copy steps

1. Copy the whole `src/network` folder into the new project.
2. Install the one peer dependency: `npm i @tanstack/react-query`.
3. Wrap your app once with `NetworkProvider` (only needed for the REST hooks).

That's it — everything else is configured through props with sensible defaults.

## REST

Declare the endpoints the service is allowed to call. Every request is made by
name, so undeclared calls are a **compile error**. Each endpoint works three ways:

```tsx
import { createRestService, get, post, NetworkProvider } from './network'

// 1. Create one service instance, scoped to its endpoints (module scope).
export const api = createRestService({
  baseURL: 'https://api.example.com',
  endpoints: {
    getTodo: get<Todo, number>((id) => `/todos/${id}`),
    createTodo: post<Todo, NewTodo>('/todos'),
  },
})

// 2. Provider at the root (main.tsx) — only needed for the cached hooks.
<NetworkProvider><App /></NetworkProvider>

// 3a. Standard fetch (promise based, no cache).
const todo = await api.call('getTodo', 1)

// 3b. Cached read (TanStack Query, encapsulated).
const { data, isLoading } = api.useQuery('getTodo', 1)

// 3c. Cached write.
const create = api.useMutation('createTodo')
create.mutate({ title: 'Hi' })

// api.call('unknown', ...) ❌ does not compile.
```

`get` / `post` / `put` / `patch` / `del` declare endpoints:
`get<TResponse, TVars>(path)` captures the response and call-argument types.
`createRestService` config (besides `endpoints`): `baseURL`, `headers`,
`getAuthToken`, `timeout`, `onError` — all optional.

## WebSocket

Incoming and outgoing messages are declared as **two separate maps** — they are
never mixed. `incoming` maps a name to a handler (payload typed inline);
`outgoing` maps a name to a declared payload via `message<T>()`. Both `send`
payloads and unknown names are checked at compile time (and runtime).

```tsx
import { useWebSocket, message } from './network'

const { send, status } = useWebSocket({
  url: 'wss://example.com/socket',
  // Incoming: name -> handler
  incoming: {
    chat: (msg: { text: string; user: string }) => console.log(msg.user),
    presence: (msg: { online: number }) => console.log(msg.online),
  },
  // Outgoing: name -> declared payload type
  outgoing: {
    chat: message<{ text: string }>(),
    typing: message<{ on: boolean }>(),
  },
})

send('chat', { text: 'hello' }) // payload typed as { text: string }
send('typing', { on: true })
send('unknown', {})             // ❌ does not compile (and rejected at runtime)
```

Incoming messages are parsed as JSON and routed to the handler whose key matches
the message's `type` field (configurable via `messageKey`). Auto-connect,
reconnect and cleanup are handled for you.
