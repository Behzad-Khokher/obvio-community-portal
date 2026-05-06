import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { portalsApi } from '../api/portals'
import { insightsApi } from '../api/insights'
import { Badge, Card, Spinner } from '../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'

const VIOLATION_COLORS: Record<string, string> = {
  speeding:  '#f59e0b',
  red_light: '#ef4444',
  crosswalk: '#8b5cf6',
  default:   '#6366f1',
}

export default function Dashboard() {
  const { id } = useParams<{ id: string }>()
  const portalId = Number(id)

  const { data: portal } = useQuery({ queryKey: ['portal', portalId], queryFn: () => portalsApi.get(portalId) })
  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', portalId],
    queryFn: () => insightsApi.get(portalId),
  })

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  if (!insights) return null

  const rate = insights.violation_rate
  const rateColor = rate > 50 ? 'red' : rate > 20 ? 'yellow' : 'green'

  const sortedDays = [...(insights.events_by_day ?? [])].sort((a, b) => a.date.localeCompare(b.date))
  const sortedHours = [...(insights.events_by_hour ?? [])].sort((a, b) => a.hour - b.hour)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/portals/${portalId}`} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Insights Dashboard</h1>
          </div>
          <p className="text-sm text-slate-500">{portal?.name} · {portal?.location}</p>
        </div>
        <Badge color={rateColor}>{rate.toFixed(1)}% violation rate</Badge>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Events" value={insights.total_events}
          icon={<VideoIcon />} color="indigo"
        />
        <MetricCard
          label="Violations" value={insights.total_violations}
          icon={<AlertIcon />} color="red"
        />
        <MetricCard
          label="Violation Rate" value={`${rate.toFixed(1)}%`}
          icon={<ChartIcon />} color={rate > 50 ? 'red' : rate > 20 ? 'yellow' : 'green'}
        />
        <MetricCard
          label="Peak Hour" value={`${insights.peak_hour}:00`}
          icon={<ClockIcon />} color="slate"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Events over time */}
        <Card className="lg:col-span-3 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Events Over Time</h3>
          {sortedDays.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={sortedDays} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Violation breakdown */}
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Violation Breakdown</h3>
          {!insights.violation_breakdown?.length ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No violations</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={insights.violation_breakdown}
                  dataKey="count"
                  nameKey="type"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {insights.violation_breakdown.map((entry, i) => (
                    <Cell key={i} fill={VIOLATION_COLORS[entry.type] ?? VIOLATION_COLORS.default} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {/* Legend */}
          <div className="mt-2 space-y-1.5">
            {insights.violation_breakdown?.map(v => (
              <div key={v.type} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: VIOLATION_COLORS[v.type] ?? VIOLATION_COLORS.default }}
                  />
                  <span className="capitalize text-slate-600">{v.type.replace('_', ' ')}</span>
                </div>
                <span className="font-semibold text-slate-700">{v.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Hourly distribution */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Traffic by Hour of Day</h3>
        {sortedHours.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={sortedHours} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tickFormatter={h => `${h}:00`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
              <Tooltip
                labelFormatter={h => `${h}:00`}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}

type MetricColor = 'indigo' | 'red' | 'yellow' | 'green' | 'slate'
const metricColors: Record<MetricColor, { bg: string; icon: string; text: string }> = {
  indigo: { bg: 'bg-brand-50',   icon: 'text-brand-500',   text: 'text-brand-600'   },
  red:    { bg: 'bg-red-50',     icon: 'text-red-500',     text: 'text-red-600'     },
  yellow: { bg: 'bg-amber-50',   icon: 'text-amber-500',   text: 'text-amber-600'   },
  green:  { bg: 'bg-emerald-50', icon: 'text-emerald-500', text: 'text-emerald-600' },
  slate:  { bg: 'bg-slate-50',   icon: 'text-slate-400',   text: 'text-slate-600'   },
}

function MetricCard({ label, value, icon, color = 'indigo' }: {
  label: string; value: string | number; icon: React.ReactNode; color?: MetricColor
}) {
  const c = metricColors[color]
  return (
    <Card className="p-5">
      <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3 ${c.icon}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </Card>
  )
}

function VideoIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M15 10l4.553-2.069A1 1 0 0121 8.868v6.264a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
}
function AlertIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
}
function ChartIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
}
function ClockIcon() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
}
