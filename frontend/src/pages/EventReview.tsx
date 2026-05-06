import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Stage, Layer, Rect, Text } from 'react-konva'
import { eventsApi } from '../api/events'
import { annotationsApi } from '../api/annotations'
import { Badge, Button, Card, Select, Spinner } from '../components/ui'
import { resolveVideoUrl } from '../utils/video'
import type { Annotation } from '../types'

const LABEL_COLORS: Record<string, string> = {
  car:        '#6366f1',
  pedestrian: '#22c55e',
  cyclist:    '#f59e0b',
  truck:      '#ef4444',
}
const LABELS = ['car', 'pedestrian', 'cyclist', 'truck']
const VIOLATION_TYPES = [
  { value: '',          label: 'Not a violation' },
  { value: 'speeding',  label: 'Speeding'        },
  { value: 'red_light', label: 'Red Light'       },
  { value: 'crosswalk', label: 'Crosswalk'       },
]

interface DrawBox { x: number; y: number; w: number; h: number }

export default function EventReview() {
  const { id } = useParams<{ id: string }>()
  const eventId = Number(id)
  const qc = useQueryClient()

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.get(eventId),
  })
  const { data: annotations } = useQuery({
    queryKey: ['annotations', eventId],
    queryFn: () => annotationsApi.list(eventId),
  })

  const videoRef   = useRef<HTMLVideoElement>(null)
  const [stageSize, setStageSize] = useState({ w: 0, h: 0 })
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [playing,     setPlaying]     = useState(false)
  const [drawMode,    setDrawMode]    = useState(false)
  const [drawing,     setDrawing]     = useState(false)
  const [startPt,     setStartPt]     = useState<{ x: number; y: number } | null>(null)
  const [drawBox,     setDrawBox]     = useState<DrawBox | null>(null)
  const [pendingBox,  setPendingBox]  = useState<DrawBox | null>(null)
  const [selectedLabel, setSelectedLabel] = useState('car')

  // Track the video element's actual rendered size so Konva stage is pixel-perfect
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const sync = () => setStageSize({ w: video.clientWidth, h: video.clientHeight })
    const ro = new ResizeObserver(sync)
    ro.observe(video)
    video.addEventListener('loadedmetadata', sync)
    sync()
    return () => { ro.disconnect(); video.removeEventListener('loadedmetadata', sync) }
  }, [])

  // ── Video controls ────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    playing ? v.pause() : v.play()
  }
  const seek = (t: number) => {
    const v = videoRef.current
    if (v) { v.currentTime = t; setCurrentTime(t) }
  }
  const fmt = (t: number) => {
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // ── Annotation mutations ──────────────────────────────────────────────────
  const saveAnnotation = useMutation({
    mutationFn: (box: DrawBox) => {
      // normalize negative w/h so boxes drawn right-to-left still work
      const x = box.w < 0 ? box.x + box.w : box.x
      const y = box.h < 0 ? box.y + box.h : box.y
      const w = Math.abs(box.w)
      const h = Math.abs(box.h)
      return annotationsApi.create(eventId, {
        frame_time: currentTime,
        x: x / stageSize.w,
        y: y / stageSize.h,
        width:  w / stageSize.w,
        height: h / stageSize.h,
        label: selectedLabel,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['annotations', eventId] })
      setPendingBox(null)
      setDrawBox(null)
    },
  })

  const deleteAnnotation = useMutation({
    mutationFn: (aId: number) => annotationsApi.delete(aId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['annotations', eventId] }),
  })

  const updateViolation = useMutation({
    mutationFn: (data: { is_violation: boolean; violation_type: string }) =>
      eventsApi.update(eventId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event', eventId] }),
  })

  // ── Canvas draw handlers ──────────────────────────────────────────────────
  const onMouseDown = useCallback((e: any) => {
    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return
    videoRef.current?.pause()
    setDrawing(true)
    setStartPt({ x: pos.x, y: pos.y })
    setDrawBox({ x: pos.x, y: pos.y, w: 0, h: 0 })
    setPendingBox(null)
  }, [])

  const onMouseMove = useCallback((e: any) => {
    if (!drawing || !startPt) return
    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return
    setDrawBox({ x: startPt.x, y: startPt.y, w: pos.x - startPt.x, h: pos.y - startPt.y })
  }, [drawing, startPt])

  const onMouseUp = useCallback(() => {
    if (!drawing || !drawBox) return
    setDrawing(false)
    if (Math.abs(drawBox.w) > 8 && Math.abs(drawBox.h) > 8) {
      setPendingBox(drawBox)
    } else {
      setDrawBox(null)
    }
  }, [drawing, drawBox])

  const cancelDraw = () => { setPendingBox(null); setDrawBox(null); setStartPt(null) }
  const enterDrawMode = () => { videoRef.current?.pause(); setDrawMode(true) }
  const exitDrawMode  = () => { setDrawMode(false); cancelDraw() }

  if (isLoading || !event) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const videoSrc = resolveVideoUrl(event.video_url ?? '')

  const toPx = (a: Annotation) => ({
    x: a.x * stageSize.w,
    y: a.y * stageSize.h,
    w: a.width  * stageSize.w,
    h: a.height * stageSize.h,
  })

  // show boxes within ±2 s of current playhead
  const visibleAnnotations = (annotations ?? []).filter(
    a => Math.abs(a.frame_time - currentTime) < 2
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Event #{event.id} — Review</h1>
          <p className="text-sm text-slate-500">
            {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
            {event.duration ? ` · ${event.duration}s` : ''}
          </p>
        </div>
        {event.is_violation && (
          <Badge color="red">{event.violation_type || 'violation'}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* ── Left: video player ───────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-0">
          <Card className="overflow-hidden">
            {/* Video + canvas overlay — canvas ONLY covers video image */}
            <div className="relative bg-black select-none">
              <video
                ref={videoRef}
                src={videoSrc}
                className="w-full block"
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime ?? 0)}
                onLoadedMetadata={() => {
                  setDuration(videoRef.current?.duration ?? 0)
                  setStageSize({ w: videoRef.current!.clientWidth, h: videoRef.current!.clientHeight })
                }}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
              />

              {/* Konva stage — same pixel size as the rendered video */}
              {stageSize.w > 0 && (
                <div
                  className="absolute inset-0"
                  style={{ cursor: drawMode ? 'crosshair' : 'default', pointerEvents: drawMode ? 'auto' : 'none' }}
                >
                  <Stage
                    width={stageSize.w}
                    height={stageSize.h}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                  >
                    <Layer>
                      {/* Saved annotations for this frame window */}
                      {visibleAnnotations.map(a => {
                        const px = toPx(a)
                        const color = LABEL_COLORS[a.label] ?? '#6366f1'
                        const labelW = a.label.length * 7 + 10
                        return (
                          <React.Fragment key={a.id}>
                            <Rect
                              x={px.x} y={px.y} width={px.w} height={px.h}
                              stroke={color} strokeWidth={2.5}
                              fill={color + '25'}
                            />
                            <Rect
                              x={px.x} y={px.y - 20}
                              width={labelW} height={20}
                              fill={color} cornerRadius={[4, 4, 0, 0]}
                            />
                            <Text
                              x={px.x + 5} y={px.y - 15}
                              text={a.label}
                              fill="white" fontSize={11} fontStyle="bold"
                            />
                          </React.Fragment>
                        )
                      })}

                      {/* Live draw box */}
                      {drawBox && (
                        <Rect
                          x={drawBox.w < 0 ? drawBox.x + drawBox.w : drawBox.x}
                          y={drawBox.h < 0 ? drawBox.y + drawBox.h : drawBox.y}
                          width={Math.abs(drawBox.w)}
                          height={Math.abs(drawBox.h)}
                          stroke="#6366f1" strokeWidth={2}
                          dash={[6, 4]}
                          fill="#6366f130"
                        />
                      )}
                    </Layer>
                  </Stage>
                </div>
              )}

              {/* Draw mode banner */}
              {drawMode && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-brand-500/90 backdrop-blur-sm text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow pointer-events-none">
                  Draw mode — drag to annotate · pauses automatically
                </div>
              )}
            </div>

            {/* Custom video controls — outside the canvas, always interactive */}
            <div className="bg-slate-900 px-4 py-3 flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
              >
                {playing ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z"/>
                  </svg>
                )}
              </button>

              <span className="text-xs text-slate-400 tabular-nums shrink-0 w-10">
                {fmt(currentTime)}
              </span>

              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.05}
                value={currentTime}
                onChange={e => seek(Number(e.target.value))}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-brand-500 bg-white/20"
              />

              <span className="text-xs text-slate-400 tabular-nums shrink-0 w-10 text-right">
                {fmt(duration)}
              </span>

              {/* Draw mode toggle lives in the controls bar */}
              <button
                onClick={() => drawMode ? exitDrawMode() : enterDrawMode()}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0
                  ${drawMode
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                {drawMode ? 'Drawing' : 'Annotate'}
              </button>
            </div>
          </Card>

          {/* Label picker + pending save — only shown when draw mode active */}
          {drawMode && (
            <Card className="px-4 py-3 flex flex-wrap items-center gap-3 rounded-t-none border-t-0 -mt-px">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Label:</span>
              {LABELS.map(l => (
                <button
                  key={l}
                  onClick={() => setSelectedLabel(l)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all
                    ${selectedLabel === l
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  style={selectedLabel === l ? { backgroundColor: LABEL_COLORS[l] } : {}}
                >
                  {l}
                </button>
              ))}

              {pendingBox && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Save <strong className="capitalize">{selectedLabel}</strong> at {fmt(currentTime)}?
                  </span>
                  <Button size="sm" onClick={() => saveAnnotation.mutate(pendingBox)} loading={saveAnnotation.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelDraw}>Cancel</Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Violation toggle */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Violation Classification</h3>
            <div
              className="flex items-center gap-3 mb-4 cursor-pointer"
              onClick={() => updateViolation.mutate({
                is_violation: !event.is_violation,
                violation_type: event.is_violation ? '' : event.violation_type,
              })}
            >
              <div className={`relative w-10 h-5 rounded-full transition-colors ${event.is_violation ? 'bg-red-500' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
                  ${event.is_violation ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </div>
              <span className="text-sm font-medium text-slate-700 select-none">
                {event.is_violation ? 'Marked as violation' : 'Not a violation'}
              </span>
            </div>

            {event.is_violation && (
              <Select
                label="Violation Type"
                value={event.violation_type}
                options={VIOLATION_TYPES}
                onChange={e => updateViolation.mutate({ is_violation: true, violation_type: e.target.value })}
              />
            )}
          </Card>

          {/* Annotations list */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700">Annotations</h3>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                {annotations?.length ?? 0}
              </span>
            </div>

            {!annotations?.length ? (
              <div className="py-6 text-center">
                <svg className="w-8 h-8 mx-auto text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs text-slate-400">
                  Click <strong>Annotate</strong> in the player, then drag a box around a car.
                </p>
              </div>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto -mx-1 px-1">
                {annotations.map(a => {
                  const isActive = Math.abs(a.frame_time - currentTime) < 2
                  return (
                    <div
                      key={a.id}
                      onClick={() => seek(a.frame_time)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors cursor-pointer group
                        ${isActive ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: LABEL_COLORS[a.label] ?? '#6366f1' }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 capitalize">{a.label}</p>
                        <p className="text-xs text-slate-400">@ {a.frame_time.toFixed(2)}s</p>
                      </div>
                      {isActive && (
                        <span className="text-xs text-brand-500 font-medium shrink-0">visible</span>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deleteAnnotation.mutate(a.id) }}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all ml-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Upload */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Upload Video</h3>
            <VideoUpload eventId={eventId} />
          </Card>
        </div>
      </div>
    </div>
  )
}

function VideoUpload({ eventId }: { eventId: number }) {
  const qc = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await eventsApi.upload(eventId, file)
      await qc.invalidateQueries({ queryKey: ['event', eventId] })
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors
      ${uploading ? 'border-brand-300 bg-brand-50' : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'}`}>
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Spinner size="sm" />
          <span className="text-xs text-brand-500">Uploading…</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-xs text-slate-500">Click to upload video file</span>
        </div>
      )}
      <input type="file" accept="video/*" className="hidden" onChange={upload} disabled={uploading} />
    </label>
  )
}
