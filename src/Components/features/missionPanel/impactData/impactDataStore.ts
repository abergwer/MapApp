/**
 * Impact data records exactly as the server returns them from
 * GET /api/impact-data, in one observable list so every reader (the mission
 * form's dropdown, SignalR pushes) sees the same data. Same pattern as
 * `targets/targetsStore.ts`.
 */
import { observable } from 'mobx';
import { getImpactData } from '../api/impactDataApi';
import type { ImpactDataDto } from './types';

export const impactData = observable.array<ImpactDataDto>([]);

/** Fetch the list from the server and replace it in place. */
export const loadImpactData = (): Promise<void> =>
  getImpactData()
    .then((list) => {
      impactData.replace(list);
    })
    .catch((err) => console.error('[missions] failed to load impact data:', err));

/** Add or replace one record — from our own POST or a server push. */
export const upsertImpactData = (dto: ImpactDataDto) => {
  const i = impactData.findIndex((d) => d.id === dto.id);
  if (i >= 0) impactData[i] = dto;
  else impactData.push(dto);
};
