import { api } from './client'
import type { ImpactDataDto, NewImpactData } from '../impactData/types'

/** Impact data records; the server assigns the id. */
export const getImpactData = async (): Promise<ImpactDataDto[]> => {
  const response = await api.get<ImpactDataDto[]>('/impact-data')
  return response.data
}

export const createImpactData = async (body: NewImpactData): Promise<ImpactDataDto> => {
  const response = await api.post<ImpactDataDto>('/impact-data', body)
  return response.data
}
