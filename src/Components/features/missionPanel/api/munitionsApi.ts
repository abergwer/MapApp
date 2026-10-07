import { api } from './client'
import type { MunitionDto } from '../munitions/types'

/** Munitions available for a mission (read-only list). */
export const getMunitions = async (): Promise<MunitionDto[]> => {
  const response = await api.get<MunitionDto[]>('/munitions')
  return response.data
}
