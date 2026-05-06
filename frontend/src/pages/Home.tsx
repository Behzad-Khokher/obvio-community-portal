import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { portalsApi } from '../api/portals'
import { insightsApi } from '../api/insights'
import { Badge, Button, Card, EmptyState, Spinner } from '../components/ui'
import type { Portal } from '../types'

export default function Home() {
  const { data: portals, isLoading } = useQuery({
    queryKey: ['portals'],
    queryFn: portalsApi.list,
  })

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Community Portals</h1>
          <p className="mt-1 text-sm text-slate-500">Manage traffic safety deployments and publish community insights.</p>
        </div>
        <Link to="/portals/new">
          <Button size="md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Portal
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !portals?.length ? (
        <Card>
          <EmptyState
            icon={<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5" />
            </svg>}
            title="No portals yet"
            description="Create your first community portal to start managing traffic safety trials."
            action={<Link to="/portals/new"><Button>Create Portal</Button></Link>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {portals.map(p => <PortalCard key={p.id} portal={p} />)}
        </div>
      )}
    </div>
  )
}

function PortalCard({ portal }: { portal: Portal }) {
  const { data: insights } = useQuery({
    queryKey: ['insights', portal.id],
    queryFn: () => insightsApi.get(portal.id),
  })

  const rate = insights?.violation_rate ?? 0
  const rateColor = rate > 50 ? 'red' : rate > 20 ? 'yellow' : 'green'

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 truncate">{portal.name}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-slate-500 truncate">{portal.location}</span>
            </div>
          </div>
          {insights && (
            <Badge color={rateColor}>
              {rate.toFixed(0)}% violations
            </Badge>
          )}
        </div>

        {portal.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{portal.description}</p>
        )}

        {insights && (
          <div className="flex gap-4 mb-4 pt-3 border-t border-slate-100">
            <Stat label="Events" value={insights.total_events} />
            <Stat label="Violations" value={insights.total_violations} />
            <Stat label="Rate" value={`${rate.toFixed(1)}%`} />
          </div>
        )}

        <div className="flex gap-2">
          <Link to={`/portals/${portal.id}`} className="flex-1">
            <Button variant="secondary" size="sm" className="w-full">View Portal</Button>
          </Link>
          <Link to={`/portals/${portal.id}/dashboard`}>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </Button>
          </Link>
          <Link to={`/portals/${portal.id}/edit`}>
            <Button variant="ghost" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}
