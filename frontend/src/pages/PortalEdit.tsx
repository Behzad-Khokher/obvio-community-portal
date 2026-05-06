import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { portalsApi } from '../api/portals'
import { trialsApi } from '../api/trials'
import { eventsApi } from '../api/events'
import { Button, Input, Textarea, Card, Spinner, Badge } from '../components/ui'
import { resolveVideoUrl } from '../utils/video'
import type { Event, Trial } from '../types'
import { format } from 'date-fns'

export default function PortalEdit() {
  const { id } = useParams<{ id: string }>()
  const portalId = Number(id)
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: portal, isLoading: loadingPortal } = useQuery({
    queryKey: ['portal', portalId],
    queryFn: () => portalsApi.get(portalId),
  })
  const { data: trials, isLoading: loadingTrials } = useQuery({
    queryKey: ['trials', portalId],
    queryFn: () => trialsApi.list(portalId),
  })

  const [form, setForm] = useState({ name: '', location: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (portal) setForm({ name: portal.name, location: portal.location, description: portal.description })
  }, [portal])

  async function save() {
    setSaving(true)
    try {
      await portalsApi.update(portalId, form)
      await qc.invalidateQueries({ queryKey: ['portal', portalId] })
      await qc.invalidateQueries({ queryKey: ['portals'] })
      navigate(`/portals/${portalId}`)
    } catch (e) { console.error(e); setSaving(false) }
  }

  if (loadingPortal || loadingTrials) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Portal</h1>
          <p className="text-sm text-slate-500">Update portal details, trials, and events.</p>
        </div>
      </div>

      {/* Portal info */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Portal Information</h2>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Input label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={save} loading={saving}>Save Changes</Button>
        </div>
      </Card>

      {/* Trials */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Trials</h2>
        <div className="space-y-3">
          {trials?.map(t => <TrialEditRow key={t.id} trial={t} portalId={portalId} />)}
        </div>
        <div className="mt-3">
          <AddTrialInline portalId={portalId} />
        </div>
      </div>
    </div>
  )
}

function TrialEditRow({ trial, portalId }: { trial: Trial; portalId: number }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    location: trial.location,
    start_date: trial.start_date?.slice(0, 10) ?? '',
    end_date: trial.end_date?.slice(0, 10) ?? '',
    description: trial.description,
  })
  const [saving, setSaving] = useState(false)

  const { data: events } = useQuery({
    queryKey: ['events', trial.id],
    queryFn: () => eventsApi.list(trial.id),
    enabled: open,
  })

  const deleteTrial = async () => {
    await trialsApi.delete(trial.id)
    qc.invalidateQueries({ queryKey: ['trials', portalId] })
  }

  const save = async () => {
    setSaving(true)
    await trialsApi.update(trial.id, {
      ...form,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
    })
    await qc.invalidateQueries({ queryKey: ['trials', portalId] })
    setSaving(false)
  }

  return (
    <Card>
      <button
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors rounded-xl"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <p className="font-medium text-slate-800">{trial.location}</p>
          <p className="text-xs text-slate-400">
            {trial.start_date ? format(new Date(trial.start_date), 'MMM d, yyyy') : '—'} →{' '}
            {trial.end_date ? format(new Date(trial.end_date), 'MMM d, yyyy') : '—'}
          </p>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            <Input label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input label="Start Date" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            <Input label="End Date" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} loading={saving}>Save Trial</Button>
            <Button size="sm" variant="danger" onClick={deleteTrial}>Delete Trial</Button>
          </div>

          {/* Events in this trial */}
          <div className="mt-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Events</p>
            {events?.map(e => <EventEditRow key={e.id} event={e} trialId={trial.id} />)}
            <AddEventInline trialId={trial.id} />
          </div>
        </div>
      )}
    </Card>
  )
}

function EventEditRow({ event, trialId }: { event: Event; trialId: number }) {
  const qc = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    video_url: event.video_url,
    is_violation: event.is_violation,
    violation_type: event.violation_type,
  })

  const save = async () => {
    setSaving(true)
    await eventsApi.update(event.id, form)
    await qc.invalidateQueries({ queryKey: ['events', trialId] })
    setSaving(false)
  }
  const del = async () => {
    await eventsApi.delete(event.id)
    qc.invalidateQueries({ queryKey: ['events', trialId] })
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="flex-1">
        <p className="text-xs text-slate-600 font-medium">Event #{event.id}</p>
        <p className="text-xs text-slate-400 truncate">{event.video_url || 'No video'}</p>
      </div>
      {event.is_violation && <Badge color="red">{event.violation_type || 'violation'}</Badge>}
      <a href={`/events/${event.id}/review`} target="_blank" rel="noopener noreferrer">
        <Button variant="ghost" size="sm">Review</Button>
      </a>
      <Button variant="ghost" size="sm" onClick={del} className="text-red-400 hover:bg-red-50">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>
    </div>
  )
}

function AddTrialInline({ portalId }: { portalId: number }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ location: '', start_date: '', end_date: '', description: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await trialsApi.create(portalId, {
      ...form,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : new Date().toISOString(),
      end_date: form.end_date ? new Date(form.end_date).toISOString() : new Date().toISOString(),
    })
    await qc.invalidateQueries({ queryKey: ['trials', portalId] })
    setOpen(false)
    setSaving(false)
    setForm({ location: '', start_date: '', end_date: '', description: '' })
  }

  if (!open) return (
    <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Trial
    </Button>
  )

  return (
    <Card className="p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-700">New Trial</p>
      <Input placeholder="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
        <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
      </div>
      <Textarea placeholder="Description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
      <div className="flex gap-2">
        <Button size="sm" onClick={save} loading={saving}>Add</Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </Card>
  )
}

function AddEventInline({ trialId }: { trialId: number }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await eventsApi.create(trialId, { video_url: resolveVideoUrl(url), timestamp: new Date().toISOString() })
    await qc.invalidateQueries({ queryKey: ['events', trialId] })
    setOpen(false); setSaving(false); setUrl('')
  }

  if (!open) return (
    <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="mt-2">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Add Event
    </Button>
  )

  return (
    <div className="mt-2 flex gap-2">
      <Input placeholder='URL or "default"' value={url} onChange={e => setUrl(e.target.value)} className="flex-1" />
      <Button size="sm" onClick={save} loading={saving}>Add</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>✕</Button>
    </div>
  )
}
