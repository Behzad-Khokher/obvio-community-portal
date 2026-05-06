import client from './client'
import type { Event } from '../types'

export const eventsApi = {
  list: (trialId: number) =>
    client.get<Event[]>(`/trials/${trialId}/events`).then(r => r.data),
  get: (id: number) => client.get<Event>(`/events/${id}`).then(r => r.data),
  create: (trialId: number, data: Partial<Event>) =>
    client.post<Event>(`/trials/${trialId}/events`, data).then(r => r.data),
  update: (id: number, data: Partial<Event>) =>
    client.put<Event>(`/events/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/events/${id}`),
  upload: (id: number, file: File) => {
    const form = new FormData()
    form.append('video', file)
    return client.post<{ video_url: string }>(`/events/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
}
