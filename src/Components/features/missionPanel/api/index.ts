/**
 * Mission REST calls — plain axios, one file per server resource.
 *  - client.ts          the axios instance (base URL from config.json)
 *  - missionApi.ts      /missions CRUD
 *  - targetsApi.ts      GET /mission-targets
 *  - attackPointsApi.ts POST /components/:id/attack-points
 *  - impactDataApi.ts   GET/POST /impact-data
 *  - munitionsApi.ts    GET /munitions
 */
export { api, SERVER_URL } from './client'
export { missionApi, type MissionApi, type MissionDto } from './missionApi'
export { getMissionTargets } from './targetsApi'
export { createAttackPoint } from './attackPointsApi'
export { getImpactData, createImpactData } from './impactDataApi'
export { getMunitions } from './munitionsApi'
