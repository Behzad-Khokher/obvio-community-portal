import client from './client'
import type { Trial } from '../types'

export const trialsApi = {
  list: (portalId: number) =>
    client.get<Trial[]>(`/portals/${portalId}/trials`).then(r => r.data),
  get: (id: number) => client.get<Trial>(`/trials/${id}`).then(r => r.data),
  create: (portalId: number, data: Omit<Trial, 'id' | 'portal_id' | 'created_at' | 'updated_at'>) =>
    client.post<Trial>(`/portals/${portalId}/trials`, data).then(r => r.data),
  update: (id: number, data: Partial<Trial>) =>
    client.put<Trial>(`/trials/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/trials/${id}`),
}
