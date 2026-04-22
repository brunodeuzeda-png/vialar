'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, timeAgo, STATUS_LABEL, STATUS_DOT, PRIORITY_COLOR, PRIORITY_LABEL, cn } from '@/lib/utils';
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, ShieldAlert,
  Banknote, Bot, ArrowUpRight, ArrowRight, Flame, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import Header from '@/components/layout/Header';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/dashboard/overview').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.get('/dashboard/alerts').then(r => r.data),
  });

  const { data: digest } = useQuery({
    queryKey: ['ai-digest'],
    queryFn: () => api.get('/dashboard/ai-digest').then(r => r.data),
    staleTime: 1000 * 60 * 60,
  });

  const d = overview?.demands;
  const c = overview?.compliance;
  const f = overview?.financial;

  // Mock chart data (replace with real data when available)
  const chartData = [
    { day: 'Seg', value: 4 }, { day: 'Ter', value: 7 }, { day: 'Qua', value: 3 },
    { day: 'Qui', value: 9 }, { day: 'Sex', value: 5 }, { day: 'Sáb', value: 2 }, { day: 'Dom', value: 6 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6 space-y-6 animate-fade-in">

        {/* AI Digest */}
        {digest?.summary && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white shadow-lg shadow-indigo-200">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwaDQydjQySDM2VjE4eiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{digest.greeting}</p>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">IA</span>
                </div>
                <p className="text-indigo-100 text-sm leading-relaxed">{digest.summary}</p>
                {digest.top_actions?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {digest.top_actions.map((a: any, i: number) => (
                      <span key={i} className="text-xs bg-white/15 border border-white/20 px-3 py-1 rounded-lg">
                        {i + 1}. {a.action}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            <>
              <KpiCard
                label="Chamados Abertos"
                value={d?.open ?? 0}
                sub={`${d?.created_today ?? 0} novos hoje`}
                icon={<Clock size={18} />}
                iconBg="bg-blue-50 text-blue-600"
                trend={d?.created_today > 0 ? 'up' : 'neutral'}
                href="/demands"
              />
              <KpiCard
                label="Chamados Críticos"
                value={d?.critica ?? 0}
                sub={`${d?.alta ?? 0} de alta prioridade`}
                icon={<Flame size={18} />}
                iconBg="bg-red-50 text-red-600"
                highlight={d?.critica > 0}
                href="/demands?priority=CRITICA"
              />
              <KpiCard
                label="Compliance Urgente"
                value={c?.urgent ?? 0}
                sub={`${c?.this_month ?? 0} vencem em 30d`}
                icon={<ShieldAlert size={18} />}
                iconBg="bg-amber-50 text-amber-600"
                highlight={c?.urgent > 0}
                href="/compliance"
              />
              <KpiCard
                label="Saldo do Mês"
                value={f?.saldo !== undefined ? formatCurrency(f.saldo) : 'R$ 0'}
                sub={`Receitas: ${formatCurrency(f?.receitas ?? 0)}`}
                icon={<Banknote size={18} />}
                iconBg="bg-emerald-50 text-emerald-600"
                href="/financial"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Demand chart */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-900">Chamados esta semana</h3>
                <p className="text-xs text-slate-400 mt-0.5">Volume diário de novos chamados</p>
              </div>
              <Link href="/demands" className="btn-ghost btn-sm text-indigo-600">
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                  itemStyle={{ color: '#4f46e5' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-slate-900">Resumo</h3>
            <div className="space-y-3">
              {[
                { label: 'Resolvidos (7d)', value: d?.resolved_week ?? 0, color: 'bg-emerald-500', icon: <CheckCircle2 size={14} className="text-emerald-500" /> },
                { label: 'Em andamento', value: d?.em_andamento ?? 0, color: 'bg-amber-500', icon: <Clock size={14} className="text-amber-500" /> },
                { label: 'Tempo médio', value: d?.avg_resolution_hours ? `${Math.round(d.avg_resolution_hours)}h` : '—', color: 'bg-indigo-500', icon: <TrendingUp size={14} className="text-indigo-500" /> },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Taxa de resolução</span>
                <span className="text-xs font-semibold text-emerald-600">
                  {d?.resolved_week && d?.open ? Math.round((d.resolved_week / (d.resolved_week + d.open)) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
                  style={{ width: `${d?.resolved_week && d?.open ? Math.round((d.resolved_week / (d.resolved_week + d.open)) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Alertas ativos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alerts.map((alert: any, i: number) => (
                <AlertCard key={i} alert={alert} />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, iconBg, trend, highlight, href }: any) {
  return (
    <Link href={href || '#'} className="card-hover p-5 block group">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>
      <p className={cn('text-2xl font-bold mb-0.5', highlight ? 'text-red-600' : 'text-slate-900')}>{value}</p>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </Link>
  );
}

const ALERT_TITLES: Record<string, string> = {
  DEMAND_CRITICAL: '🔥 Chamados críticos pendentes',
  COMPLIANCE_URGENT: '⚠️ Obrigações vencendo em breve',
  DEMAND_STALE: '💤 Chamados sem atualização',
};

function AlertCard({ alert }: { alert: any }) {
  const isHigh = alert.severity === 'high';
  return (
    <div className={cn('card p-4', isHigh ? 'border-red-100 bg-red-50/50' : 'border-amber-100 bg-amber-50/50')}>
      <p className={cn('font-semibold text-sm mb-2', isHigh ? 'text-red-800' : 'text-amber-800')}>
        {ALERT_TITLES[alert.type] || alert.type}
      </p>
      <ul className="space-y-1">
        {alert.items.slice(0, 3).map((item: any) => (
          <li key={item.id} className="text-xs text-slate-600 flex items-center gap-1.5">
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isHigh ? 'bg-red-400' : 'bg-amber-400')} />
            {item.title || item.name}
            {item.days_left !== undefined && (
              <span className={cn('ml-auto font-semibold', item.days_left <= 7 ? 'text-red-600' : 'text-amber-600')}>
                {item.days_left}d
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
