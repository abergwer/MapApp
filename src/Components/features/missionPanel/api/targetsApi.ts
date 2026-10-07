import { api } from './client'
import type { TargetDto } from '../targets/types'

/** Mission planning tree (targets → components → attack points). */
export const getMissionTargets = async (): Promise<TargetDto[]> => {
  const response = await api.get<TargetDto[]>('/mission-targets')
  return response.data
}
