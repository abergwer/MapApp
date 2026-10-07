/** Impact data record as stored by the server (`GET/POST /api/impact-data`). */
export interface ImpactDataDto {
  id: string
  name: string
  radius: string
  speed: string
  details: string
}

/** POST body — the server assigns `id`. */
export type NewImpactData = Omit<ImpactDataDto, 'id'>
