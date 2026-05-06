import client from './client'
import type { Portal } from '../types'

export const portalsApi = {
  list: () => client.get<Portal[]>('/portals').then(r => r.data),
  get: (id: number) => client.get<Portal>(`/portals/${id}`).then(r => r.data),
  create: (data: Omit<Portal, 'id' | 'created_at' | 'updated_at'>) =>
    client.post<Portal>('/portals', data).then(r => r.data),
  update: (id: number, data: Partial<Portal>) =>
    client.put<Portal>(`/portals/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/portals/${id}`),
}
