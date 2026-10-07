import { api } from './client'
import type { AttackPointDto, NewAttackPoint } from '../attackPoints/types'

/** Adds an attack point under a component; the server assigns the id
 *  and stamps `parentId` from the component in the URL. */
export const createAttackPoint = async (componentId: string, body: NewAttackPoint): Promise<AttackPointDto> => {
  const response = await api.post<AttackPointDto>(`/components/${componentId}/attack-points`, body)
  return response.data
}
