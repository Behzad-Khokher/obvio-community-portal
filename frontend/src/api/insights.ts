import client from './client'
import type { InsightsResult } from '../types'

export const insightsApi = {
  get: (portalId: number) =>
    client.get<InsightsResult>(`/portals/${portalId}/insights`).then(r => r.data),
}
