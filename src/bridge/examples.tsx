/**
 * THE 5 NETWORK PATTERNS — one file, simplest possible, real code against
 * the demo server. Read top to bottom; every example is independent.
 * (Not mounted in the app — this file is living documentation for the
 * `network` package. It compiles and works if you render it.)
 */
import { useState } from 'react'
import { useWebSocket } from '../network'
import { useApiQuery, useApiMutation, useRequest, DEMO_SERVER_URL } from './liveDataApi'
import type { MapShape } from '../stores/DrawingToolStore'

/** A shape to send in the write examples (server assigns the real id). */
const DEMO_SHAPE: MapShape = { id: 'temp-example', kind: 'point', position: [34.8, 32.1] }

// ---------------------------------------------------------------------------
// 1. useApiQuery — cached GET (React Query). Same key = shared cache. Only
//    liveDataApi method names are accepted; a typo does not compile.
//    Needs <NetworkProvider> at the app root.
// ---------------------------------------------------------------------------
export function Example1_Query() {
  const shapes = useApiQuery(['shapes'], 'getShapes')

  if (shapes.isPending) return <p>Loading…</p>
  if (shapes.isError) return <p>Failed: {shapes.error.message}</p>
  return <p>{shapes.data.length} shapes on the server</p>
}

// ---------------------------------------------------------------------------
// 2. useRequest GET — same flags, no React Query, no provider, no cache.
//    Runs once on mount; `run()` runs it again.
// ---------------------------------------------------------------------------
export function Example2_RequestGet() {
  const shapes = useRequest('getShapes')

  if (shapes.isLoading) return <p>Loading…</p>
  if (shapes.isError) return <p>Failed: {shapes.error?.message}</p>
  return (
    <p>
      {shapes.data?.length} shapes <button onClick={() => void shapes.run()}>Reload</button>
    </p>
  )
}

// ---------------------------------------------------------------------------
// 3. useRequest POST — `auto: false` means nothing happens until `run()`,
//    so the write fires on click, with the same isLoading/isError state.
// ---------------------------------------------------------------------------
export function Example3_RequestPost() {
  const save = useRequest('createShape', DEMO_SHAPE, { auto: false })

  return (
    <button onClick={() => void save.run()} disabled={save.isLoading}>
      {save.isSuccess ? `Saved as ${save.data?.id}` : 'Save shape'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// 4. useApiMutation — write through React Query. `invalidate` marks those
//    query keys stale on success, so Example 1's list refetches by itself.
// ---------------------------------------------------------------------------
export function Example4_Mutation() {
  const create = useApiMutation('createShape', {invalidate: [['shapes']]})

  return (
    <button onClick={() => create.mutate(DEMO_SHAPE)} disabled={create.isPending}>
      {create.isSuccess ? `Saved as ${create.data.id}` : 'Save shape'}
    </button>
  )
}

// ---------------------------------------------------------------------------
// 5. useWebSocket — incoming: handlers keyed by the frame's `type` field;
//    outgoing: declare a union so `send` is compile-checked.
// ---------------------------------------------------------------------------
type Outgoing = { type: 'ping' } // add more: | { type: 'chat'; text: string }

export function Example5_WebSocket() {
  const [lastPong, setLastPong] = useState('never')

  const socket = useWebSocket<Outgoing>({
    url: `${DEMO_SERVER_URL.replace('http', 'ws')}/ws`,
    incoming: {
      pong: (msg: { time: string }) => setLastPong(msg.time),
    },
  })

  return (
    <button onClick={() => socket.send({ type: 'ping' })}>
      {socket.status} · last pong: {lastPong}
    </button>
    // socket.send({ type: 'nope' }) ❌ does not compile
  )
}
