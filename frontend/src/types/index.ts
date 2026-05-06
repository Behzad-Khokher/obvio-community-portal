export interface Portal {
  id: number
  name: string
  location: string
  description: string
  created_at: string
  updated_at: string
}

export interface Trial {
  id: number
  portal_id: number
  location: string
  start_date: string
  end_date: string
  description: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: number
  trial_id: number
  video_url: string
  timestamp: string
  is_violation: boolean
  violation_type: string
  duration: number
  created_at: string
  updated_at: string
}

export interface Annotation {
  id: number
  event_id: number
  frame_time: number
  x: number
  y: number
  width: number
  height: number
  label: string
  created_at: string
  updated_at: string
}

export interface InsightsResult {
  total_events: number
  total_violations: number
  violation_rate: number
  violation_breakdown: { type: string; count: number }[]
  events_by_day: { date: string; count: number }[]
  events_by_hour: { hour: number; count: number }[]
  peak_hour: number
  peak_day: string
}

export type ViolationType = 'speeding' | 'red_light' | 'crosswalk' | ''
export type AnnotationLabel = 'car' | 'pedestrian' | 'cyclist' | 'truck'
