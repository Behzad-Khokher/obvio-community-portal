import client from './client'
import type { Annotation } from '../types'

export const annotationsApi = {
  list: (eventId: number) =>
    client.get<Annotation[]>(`/events/${eventId}/annotations`).then(r => r.data),
  create: (eventId: number, data: Omit<Annotation, 'id' | 'event_id' | 'created_at' | 'updated_at'>) =>
    client.post<Annotation>(`/events/${eventId}/annotations`, data).then(r => r.data),
  update: (id: number, data: Partial<Annotation>) =>
    client.put<Annotation>(`/annotations/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/annotations/${id}`),
}
