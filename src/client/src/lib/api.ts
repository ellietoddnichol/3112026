import axios from 'axios';
import type { Project, Room, TakeoffLine, CatalogItem, Bundle, Settings, ParseJob, ParseLine, Modifier, Abbreviation, ItemVariant } from '../types';

const api = axios.create({ baseURL: '/api' });

export const projectsApi = {
  list: () => api.get<Project[]>('/projects').then(r => r.data),
  get: (id: number) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (data: Partial<Project>) => api.post<Project>('/projects', data).then(r => r.data),
  update: (id: number, data: Partial<Project>) => api.put<Project>(`/projects/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/projects/${id}`).then(r => r.data),
  getSummary: (id: number) => api.get(`/projects/${id}/summary`).then(r => r.data),
};

export const roomsApi = {
  list: (projectId: number) => api.get<Room[]>(`/rooms?projectId=${projectId}`).then(r => r.data),
  create: (data: Partial<Room>) => api.post<Room>('/rooms', data).then(r => r.data),
  update: (id: number, data: Partial<Room>) => api.put<Room>(`/rooms/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/rooms/${id}`).then(r => r.data),
  duplicate: (id: number) => api.post<Room>(`/rooms/${id}/duplicate`).then(r => r.data),
};

export const takeoffApi = {
  list: (projectId: number, roomId?: number) => {
    const url = roomId ? `/takeoff?projectId=${projectId}&roomId=${roomId}` : `/takeoff?projectId=${projectId}`;
    return api.get<TakeoffLine[]>(url).then(r => r.data);
  },
  create: (data: Partial<TakeoffLine> & { baseMaterialCost?: number; baseLaborMinutes?: number }) =>
    api.post<TakeoffLine>('/takeoff', data).then(r => r.data),
  update: (id: number, data: Partial<TakeoffLine> & { baseMaterialCost?: number; baseLaborMinutes?: number }) =>
    api.put<TakeoffLine>(`/takeoff/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/takeoff/${id}`).then(r => r.data),
};

export const catalogApi = {
  list: (params?: { search?: string; category?: string; active?: boolean }) =>
    api.get<CatalogItem[]>('/catalog', { params }).then(r => r.data),
  get: (id: number) => api.get<CatalogItem>(`/catalog/${id}`).then(r => r.data),
  create: (data: Partial<CatalogItem>) => api.post<CatalogItem>('/catalog', data).then(r => r.data),
  update: (id: number, data: Partial<CatalogItem>) => api.put<CatalogItem>(`/catalog/${id}`, data).then(r => r.data),
  deactivate: (id: number) => api.patch(`/catalog/${id}/deactivate`).then(r => r.data),
  getVariants: (id: number) => api.get<ItemVariant[]>(`/catalog/${id}/variants`).then(r => r.data),
  createVariant: (id: number, data: Partial<ItemVariant>) => api.post<ItemVariant>(`/catalog/${id}/variants`, data).then(r => r.data),
  updateVariant: (variantId: number, data: Partial<ItemVariant>) => api.put<ItemVariant>(`/catalog/variants/${variantId}`, data).then(r => r.data),
  categories: () => api.get<string[]>('/catalog/categories').then(r => r.data),
};

export const bundlesApi = {
  list: () => api.get<Bundle[]>('/bundles').then(r => r.data),
  get: (id: number) => api.get<Bundle>(`/bundles/${id}`).then(r => r.data),
  create: (data: Partial<Bundle>) => api.post<Bundle>('/bundles', data).then(r => r.data),
  update: (id: number, data: Partial<Bundle>) => api.put<Bundle>(`/bundles/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/bundles/${id}`).then(r => r.data),
  apply: (bundleId: number, projectId: number, roomId: number) =>
    api.post('/bundles/apply', { bundleId, projectId, roomId }).then(r => r.data),
  getItems: (bundleId: number) => api.get(`/bundles/${bundleId}/items`).then(r => r.data),
  addItem: (bundleId: number, data: Record<string, unknown>) => api.post(`/bundles/${bundleId}/items`, data).then(r => r.data),
  deleteItem: (itemId: number) => api.delete(`/bundles/items/${itemId}`).then(r => r.data),
};

export const parserApi = {
  parseText: (data: { text: string; projectId?: number; roomId?: number }) =>
    api.post<{ job: ParseJob; lines: ParseLine[] }>('/parser/text', data).then(r => r.data),
  getJob: (jobId: number) => api.get<ParseJob>(`/parser/jobs/${jobId}`).then(r => r.data),
  getLines: (jobId: number) => api.get<ParseLine[]>(`/parser/jobs/${jobId}/lines`).then(r => r.data),
  updateLine: (lineId: number, data: Partial<ParseLine>) =>
    api.put<ParseLine>(`/parser/lines/${lineId}`, data).then(r => r.data),
  finalize: (jobId: number, projectId: number, roomId: number) =>
    api.post('/parser/finalize', { jobId, projectId, roomId }).then(r => r.data),
  listJobs: (projectId?: number) => {
    const url = projectId ? `/parser/jobs?projectId=${projectId}` : '/parser/jobs';
    return api.get<ParseJob[]>(url).then(r => r.data);
  },
};

export const settingsApi = {
  get: () => api.get<Settings>('/settings').then(r => r.data),
  update: (data: Partial<Settings>) => api.put<Settings>('/settings', data).then(r => r.data),
};

export const modifiersApi = {
  list: () => api.get<Modifier[]>('/modifiers').then(r => r.data),
  create: (data: Partial<Modifier>) => api.post<Modifier>('/modifiers', data).then(r => r.data),
  update: (id: number, data: Partial<Modifier>) => api.put<Modifier>(`/modifiers/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/modifiers/${id}`).then(r => r.data),
};

export const abbreviationsApi = {
  list: () => api.get<Abbreviation[]>('/abbreviations').then(r => r.data),
  create: (data: Partial<Abbreviation>) => api.post<Abbreviation>('/abbreviations', data).then(r => r.data),
  update: (id: number, data: Partial<Abbreviation>) => api.put<Abbreviation>(`/abbreviations/${id}`, data).then(r => r.data),
  delete: (id: number) => api.delete(`/abbreviations/${id}`).then(r => r.data),
};

export const syncApi = {
  syncCatalog: () => api.post('/sync/catalog').then(r => r.data),
  syncAbbreviations: () => api.post('/sync/abbreviations').then(r => r.data),
  syncModifiers: () => api.post('/sync/modifiers').then(r => r.data),
  syncBundles: () => api.post('/sync/bundles').then(r => r.data),
  fullSync: () => api.post('/sync/full').then(r => r.data),
};
