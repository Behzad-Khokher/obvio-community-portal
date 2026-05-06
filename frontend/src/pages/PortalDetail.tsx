import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portalsApi } from '../api/portals'
import { trialsApi } from '../api/trials'
import { eventsApi } from '../api/events'
import { insightsApi } from '../api/insights'
import { Badge, Button, Card, EmptyState, Modal, Spinner } from '../components/ui'
import type { Event, Trial } from '../types'
import { format } from 'date-fns'

export default function PortalDetail() {
  const { id } = useParams<{ id: string }>()
  const portalId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: portal, isLoading } = useQuery({
    queryKey: ['portal', portalId],
    queryFn: () => portalsApi.get(portalId),
  })
  const { data: trials } = useQuery({
    queryKey: ['trials', portalId],
    queryFn: () => trialsApi.list(portalId),
  })
  const { data: insights } = useQuery({
    queryKey: ['insights', portalId],
    queryFn: () => insightsApi.get(portalId),
  })

  const deletePortal = useMutation({
    mutationFn: () => portalsApi.delete(portalId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['portals'] }); navigate('/') },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!portal) return <div className="text-center py-20 text-slate-400">Portal not found</div>

  const rate = insights?.violation_rate ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 truncate">{portal.name}</h1>
              {insights && (
                <Badge color={rate > 50 ? 'red' : rate > 20 ? 'yellow' : 'green'}>
                  {rate.toFixed(0)}% violation rate
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-3">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {portal.location}
            </div>
            {portal.description && <p className="text-sm text-slate-600">{portal.description}</p>}
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to={`/portals/${portalId}/dashboard`}>
              <Button variant="secondary" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Dashboard
              </Button>
            </Link>
            <Link to={`/portals/${portalId}/edit`}>
              <Button size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)} className="text-red-500 hover:bg-red-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        {insights && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 sm:grid-cols-6 gap-4">
            {[
              { label: 'Total Events', value: insights.total_events },
              { label: 'Violations', value: insights.total_violations },
              { label: 'Violation Rate', value: `${rate.toFixed(1)}%` },
              { label: 'Trials', value: trials?.length ?? 0 },
              { label: 'Peak Hour', value: `${insights.peak_hour}:00` },
              { label: 'Clean Events', value: insights.total_events - insights.total_violations },
            ].map(s => (
              <div key={s.label}>
                <p className="text-xl font-bold text-slate-900">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Trials */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Trials</h2>
        {!trials?.length ? (
          <Card>
            <EmptyState title="No trials yet" description="Edit this portal to add camera deployments." />
          </Card>
        ) : (
          <div className="space-y-4">
            {trials.map(t => <TrialSection key={t.id} trial={t} />)}
          </div>
        )}
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Portal">
        <p className="text-sm text-slate-600 mb-5">
          Are you sure you want to delete <span className="font-semibold">{portal.name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={deletePortal.isPending} onClick={() => deletePortal.mutate()}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}

function TrialSection({ trial }: { trial: Trial }) {
  const { data: events, isLoading } = useQuery({
    queryKey: ['events', trial.id],
    queryFn: () => eventsApi.list(trial.id),
  })

  const start = trial.start_date ? format(new Date(trial.start_date), 'MMM d, yyyy') : '—'
  const end = trial.end_date ? format(new Date(trial.end_date), 'MMM d, yyyy') : '—'

  return (
    <Card>
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{trial.location}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{start} → {end}</p>
        </div>
        <Badge color="slate">{events?.length ?? 0} events</Badge>
      </div>

      {isLoading ? (
        <div className="p-6 flex justify-center"><Spinner /></div>
      ) : !events?.length ? (
        <div className="p-6 text-center text-sm text-slate-400">No events assigned to this trial.</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {events.map(e => <EventRow key={e.id} event={e} />)}
        </div>
      )}
    </Card>
  )
}

function EventRow({ event }: { event: Event }) {
  const ts = event.timestamp ? format(new Date(event.timestamp), 'MMM d, HH:mm') : '—'
  return (
    <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700">Event #{event.id}</p>
          <p className="text-xs text-slate-400">{ts} · {event.duration}s</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {event.is_violation && (
          <Badge color="red">{event.violation_type || 'violation'}</Badge>
        )}
        <Link to={`/events/${event.id}/review`}>
          <Button variant="ghost" size="sm">Review</Button>
        </Link>
      </div>
    </div>
  )
}
