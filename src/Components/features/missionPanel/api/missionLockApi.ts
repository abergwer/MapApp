import { api } from './client'

/**
 * Edit lock on one mission. Non-200 is an answer ("someone else holds it"),
 * never an exception. `X-Client-Id` (random per page load) lets a server tell
 * holders apart; servers that don't need it can ignore it.
 */
const lockRequest = { headers: { 'X-Client-Id': crypto.randomUUID() }, validateStatus: () => true }

const isOk = async (request: Promise<{ status: number }>) => {
  try {
    return (await request).status === 200
  } catch {
    return false
  }
}

export const missionLockApi = {
  /** POST /mission/:id — true when the lock is ours. */
  acquire: (id: string) => isOk(api.post(`/mission/${id}`, null, lockRequest)),
  /** PUT /mission/:id — true while the lock is still ours. */
  renew: (id: string) => isOk(api.put(`/mission/${id}`, null, lockRequest)),
  /** DELETE /mission/:id */
  release: async (id: string) => {
    await isOk(api.delete(`/mission/${id}`, lockRequest))
  },
}
