import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { portalsApi } from '../api/portals'
import { trialsApi } from '../api/trials'
import { eventsApi } from '../api/events'
import { Button, Input, Textarea, Card } from '../components/ui'
import { resolveVideoUrl } from '../utils/video'
import type { Portal, Trial } from '../types'

interface TrialDraft {
  location: string
  start_date: string
  end_date: string
  description: string
  events: EventDraft[]
}

interface EventDraft {
  video_url: string
  timestamp: string
  is_violation: boolean
  violation_type: string
  duration: number
}

const defaultTrial = (): TrialDraft => ({
  location: '', start_date: '', end_date: '', description: '', events: [],
})

const defaultEvent = (): EventDraft => ({
  video_url: '', timestamp: new Date().toISOString().slice(0, 16), is_violation: false, violation_type: '', duration: 0,
})

export default function PortalCreate() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(1)

  const [portalForm, setPortalForm] = useState({ name: '', location: '', description: '' })
  const [trials, setTrials] = useState<TrialDraft[]>([defaultTrial()])

  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    setSaving(true)
    try {
      const portal = await portalsApi.create(portalForm)
      for (const td of trials) {
        if (!td.location) continue
        const trial = await trialsApi.create(portal.id, {
          location: td.location,
          start_date: td.start_date ? new Date(td.start_date).toISOString() : new Date().toISOString(),
          end_date: td.end_date ? new Date(td.end_date).toISOString() : new Date().toISOString(),
          description: td.description,
        })
        for (const ed of td.events) {
          if (!ed.video_url) continue
          await eventsApi.create(trial.id, {
            video_url: resolveVideoUrl(ed.video_url),
            timestamp: ed.timestamp ? new Date(ed.timestamp).toISOString() : new Date().toISOString(),
            is_violation: ed.is_violation,
            violation_type: ed.violation_type,
            duration: ed.duration,
          })
        }
      }
      await qc.invalidateQueries({ queryKey: ['portals'] })
      navigate(`/portals/${portal.id}`)
    } catch (e) {
      console.error(e)
      setSaving(false)
    }
  }

  const steps = ['Portal Info', 'Add Trials', 'Add Events']

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create Portal</h1>
        <p className="mt-1 text-sm text-slate-500">Set up a new community traffic safety portal.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => i + 1 < step && setStep(i + 1)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors
                ${step === i + 1 ? 'text-brand-600' : step > i + 1 ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step === i + 1 ? 'bg-brand-500 text-white' : step > i + 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 mx-3 h-px ${step > i + 1 ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {step === 1 && (
          <Step1 form={portalForm} onChange={setPortalForm} />
        )}
        {step === 2 && (
          <Step2 trials={trials} onChange={setTrials} />
        )}
        {step === 3 && (
          <Step3 trials={trials} onChange={setTrials} />
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
          <Button variant="secondary" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !portalForm.name}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={saving}>
              Create Portal
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

function Step1({ form, onChange }: {
  form: { name: string; location: string; description: string }
  onChange: (f: typeof form) => void
}) {
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...form, [k]: e.target.value })
  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-slate-800 mb-4">Portal Information</h2>
      <Input label="Portal Name *" placeholder="e.g. Downtown Intersection Safety" value={form.name} onChange={set('name')} />
      <Input label="Location *" placeholder="e.g. Main St & 1st Ave, Springfield" value={form.location} onChange={set('location')} />
      <Textarea label="Description" placeholder="Describe the purpose of this portal..." value={form.description} onChange={set('description')} rows={4} />
    </div>
  )
}

function Step2({ trials, onChange }: { trials: TrialDraft[]; onChange: (t: TrialDraft[]) => void }) {
  const update = (i: number, field: string, value: string) => {
    const next = [...trials]
    next[i] = { ...next[i], [field]: value }
    onChange(next)
  }
  const add = () => onChange([...trials, defaultTrial()])
  const remove = (i: number) => onChange(trials.filter((_, idx) => idx !== i))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-slate-800">Camera Deployments (Trials)</h2>
        <Button variant="secondary" size="sm" onClick={add}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Trial
        </Button>
      </div>

      <div className="space-y-4">
        {trials.map((t, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Trial {i + 1}</span>
              {trials.length > 1 && (
                <button onClick={() => remove(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <Input label="Location" placeholder="e.g. North approach, Main St" value={t.location} onChange={e => update(i, 'location', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" value={t.start_date} onChange={e => update(i, 'start_date', e.target.value)} />
              <Input label="End Date" type="date" value={t.end_date} onChange={e => update(i, 'end_date', e.target.value)} />
            </div>
            <Textarea label="Notes" placeholder="Optional description..." value={t.description} onChange={e => update(i, 'description', e.target.value)} rows={2} />
          </div>
        ))}
      </div>
    </div>
  )
}

function Step3({ trials, onChange }: { trials: TrialDraft[]; onChange: (t: TrialDraft[]) => void }) {
  const addEvent = (ti: number) => {
    const next = [...trials]
    next[ti] = { ...next[ti], events: [...next[ti].events, defaultEvent()] }
    onChange(next)
  }
  const updateEvent = (ti: number, ei: number, field: string, value: string | boolean | number) => {
    const next = [...trials]
    next[ti].events[ei] = { ...next[ti].events[ei], [field]: value }
    onChange(next)
  }
  const removeEvent = (ti: number, ei: number) => {
    const next = [...trials]
    next[ti].events = next[ti].events.filter((_, idx) => idx !== ei)
    onChange(next)
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-slate-800 mb-1">Assign Events to Trials</h2>
      <p className="text-sm text-slate-500 mb-4">Add video URLs for each event. You can upload files from the event review page later.</p>

      <div className="space-y-5">
        {trials.map((t, ti) => (
          <div key={ti} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-slate-700">
                {t.location || `Trial ${ti + 1}`}
              </span>
              <Button variant="secondary" size="sm" onClick={() => addEvent(ti)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Event
              </Button>
            </div>
            {t.events.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">No events yet. Add video clips above.</p>
            )}
            {t.events.map((ev, ei) => (
              <div key={ei} className="mt-2 p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Event {ei + 1}</span>
                  <button onClick={() => removeEvent(ti, ei)} className="text-slate-400 hover:text-red-500">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div>
                  <Input placeholder='Video URL or "default"' value={ev.video_url} onChange={e => updateEvent(ti, ei, 'video_url', e.target.value)} />
                  <p className="text-xs text-slate-400 mt-1">Type <code className="bg-slate-100 px-1 rounded">default</code> to use the sample traffic video.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Timestamp" type="datetime-local" value={ev.timestamp} onChange={e => updateEvent(ti, ei, 'timestamp', e.target.value)} />
                  <Input label="Duration (s)" type="number" value={ev.duration} onChange={e => updateEvent(ti, ei, 'duration', parseFloat(e.target.value) || 0)} />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ev.is_violation}
                    onChange={e => updateEvent(ti, ei, 'is_violation', e.target.checked)}
                    className="w-4 h-4 text-brand-500 rounded border-slate-300 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-700">Mark as violation</span>
                </label>
                {ev.is_violation && (
                  <select
                    value={ev.violation_type}
                    onChange={e => updateEvent(ti, ei, 'violation_type', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">Select type…</option>
                    <option value="speeding">Speeding</option>
                    <option value="red_light">Red Light</option>
                    <option value="crosswalk">Crosswalk</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
