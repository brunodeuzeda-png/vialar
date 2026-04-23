'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, timeAgo } from '@/lib/utils';
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp, ShieldAlert,
  Banknote, ArrowUpRight, ArrowRight, Flame, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const L = '#F8F8F4';   // fundo principal
const S = '#FFFFFF';   // superfície cards
const B = '#E8E8E0';   // borda
const T = '#0A0A0A';   // texto principal
const T2 = '#666';     // texto secundário
const T3 = '#999';     // texto terciário
const AC = '#BBFF00';  // accent verde lima

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

  const chartData = overview?.chart ?? [
    { day: 'Seg', value: 4 }, { day: 'Ter', value: 7 }, { day: 'Qua', value: 3 },
    { day: 'Qui', value: 9 }, { day: 'Sex', value: 5 }, { day: 'Sáb', value: 2 }, { day: 'Dom', value: 6 },
  ];

  const resolutionRate = d?.resolved_week && d?.open
    ? Math.round((d.resolved_week / (d.resolved_week + d.open)) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: L }}>
      <Header />

      <main style={{ flex: 1, padding: '28px 32px', maxWidth: 1200 }}>

        {/* AI Digest */}
        {digest?.summary && (
          <div style={{
            background: T, borderRadius: 14, padding: '22px 26px',
            marginBottom: 28, display: 'flex', gap: 18, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 42, height: 42, flexShrink: 0, background: AC,
              borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#000" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: '-0.01em' }}>
                  {digest.greeting}
                </p>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  background: 'rgba(187,255,0,0.15)', color: AC,
                  padding: '2px 8px', borderRadius: 99,
                }}>IA</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>
                {digest.summary}
              </p>
            </div>
          </div>
        )}

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: 22, height: 120 }}>
                <div style={{ width: '60%', height: 12, background: '#eee', borderRadius: 6, marginBottom: 12, animation: 'shimmer 1.5s infinite' }} />
                <div style={{ width: '40%', height: 28, background: '#eee', borderRadius: 6 }} />
              </div>
            ))
          ) : (
            <>
              <KpiCard label="Chamados Abertos" value={d?.open ?? 0}
                sub={`${d?.created_today ?? 0} novos hoje`}
                icon={<Clock size={20} />} accent="#3B82F6" href="/demands" />
              <KpiCard label="Chamados Críticos" value={d?.critica ?? 0}
                sub={`${d?.alta ?? 0} de alta prioridade`}
                icon={<Flame size={20} />} accent="#EF4444"
                alert={(d?.critica ?? 0) > 0} href="/demands?priority=CRITICA" />
              <KpiCard label="Compliance Urgente" value={c?.urgent ?? 0}
                sub={`${c?.this_month ?? 0} vencem em 30d`}
                icon={<ShieldAlert size={20} />} accent="#F59E0B"
                alert={(c?.urgent ?? 0) > 0} href="/compliance" />
              <KpiCard label="Saldo do Mês" value={f?.saldo !== undefined ? formatCurrency(f.saldo) : 'R$ 0'}
                sub={`Receitas: ${formatCurrency(f?.receitas ?? 0)}`}
                icon={<Banknote size={20} />} accent="#22C55E" href="/financial" />
            </>
          )}
        </div>

        {/* Chart + Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>

          {/* Chart */}
          <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: 26 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: T, letterSpacing: '-0.03em', marginBottom: 4 }}>
                  Chamados esta semana
                </h3>
                <p style={{ fontSize: 13, color: T3 }}>Volume diário de novos chamados</p>
              </div>
              <Link href="/demands" style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                fontWeight: 700, color: T, textDecoration: 'none',
                padding: '7px 14px', borderRadius: 8,
                border: `1.5px solid ${B}`, transition: 'border-color 0.15s',
              }}>
                Ver todos <ArrowRight size={14} />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AC} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={AC} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: T3, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: T, border: 'none', borderRadius: 10, fontSize: 13, color: '#fff', padding: '8px 14px' }}
                  itemStyle={{ color: AC }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4, fontSize: 11 }}
                  cursor={{ stroke: B, strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="value" stroke={AC} strokeWidth={2.5} fill="url(#grad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats */}
          <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: 26 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: T, letterSpacing: '-0.03em', marginBottom: 20 }}>
              Resumo
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Resolvidos (7d)', value: d?.resolved_week ?? 0, icon: <CheckCircle2 size={16} color="#22C55E" />, accent: '#22C55E' },
                { label: 'Em andamento', value: d?.em_andamento ?? 0, icon: <Clock size={16} color="#F59E0B" />, accent: '#F59E0B' },
                { label: 'Tempo médio', value: d?.avg_resolution_hours ? `${Math.round(d.avg_resolution_hours)}h` : '—', icon: <TrendingUp size={16} color="#3B82F6" />, accent: '#3B82F6' },
              ].map((item, i) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: i < 2 ? `1px solid ${B}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {item.icon}
                    <span style={{ fontSize: 14, color: T2, fontWeight: 500 }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: T, letterSpacing: '-0.03em' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${B}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: T2, fontWeight: 500 }}>Taxa de resolução</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: T, letterSpacing: '-0.03em' }}>
                  {resolutionRate}%
                </span>
              </div>
              <div style={{ height: 6, background: '#EEEDE8', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: AC, borderRadius: 99,
                  width: `${resolutionRate}%`, transition: 'width 0.7s ease',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <AlertTriangle size={18} color="#F59E0B" />
              <h3 style={{ fontSize: 17, fontWeight: 800, color: T, letterSpacing: '-0.02em' }}>
                Alertas ativos
              </h3>
              <span style={{
                fontSize: 11, fontWeight: 700, background: '#FEF3C7',
                color: '#92400E', padding: '2px 10px', borderRadius: 99,
              }}>
                {alerts.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {alerts.map((alert: any, i: number) => (
                <AlertCard key={i} alert={alert} />
              ))}
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes shimmer {
          0% { opacity: 1 } 50% { opacity: 0.4 } 100% { opacity: 1 }
        }
        @media (max-width: 900px) {
          main > div[style*="grid-template-columns: 1fr 340px"] { grid-template-columns: 1fr !important; }
          main > div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
          main > div[style*="repeat(2, 1fr)"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function KpiCard({ label, value, sub, icon, accent, alert, href }: any) {
  return (
    <Link href={href || '#'} style={{
      background: S, border: `1.5px solid ${alert ? accent + '40' : B}`,
      borderRadius: 14, padding: '22px 22px 20px',
      textDecoration: 'none', display: 'block',
      transition: 'transform 0.15s, box-shadow 0.15s',
      boxShadow: alert ? `0 0 0 1px ${accent}20` : 'none',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = alert ? `0 0 0 1px ${accent}20` : 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: accent + '15',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent,
        }}>
          {icon}
        </div>
        <ArrowUpRight size={16} color={B} />
      </div>
      <p style={{ fontSize: 30, fontWeight: 900, color: alert ? accent : T, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
        {value}
      </p>
      <p style={{ fontSize: 13, fontWeight: 700, color: T2, marginBottom: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: 12, color: T3 }}>{sub}</p>}
    </Link>
  );
}

const ALERT_TITLES: Record<string, string> = {
  DEMAND_CRITICAL: 'Chamados críticos pendentes',
  COMPLIANCE_URGENT: 'Obrigações vencendo em breve',
  DEMAND_STALE: 'Chamados sem atualização',
};

function AlertCard({ alert }: { alert: any }) {
  const isHigh = alert.severity === 'high';
  const accentColor = isHigh ? '#EF4444' : '#F59E0B';
  return (
    <div style={{
      background: S, border: `1.5px solid ${accentColor}30`,
      borderRadius: 14, padding: '18px 20px',
      borderLeft: `3px solid ${accentColor}`,
    }}>
      <p style={{ fontWeight: 800, fontSize: 14, color: T, marginBottom: 12, letterSpacing: '-0.01em' }}>
        {isHigh ? '🔴' : '🟡'} {ALERT_TITLES[alert.type] || alert.type}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alert.items.slice(0, 3).map((item: any) => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T2 }}>{item.title || item.name}</span>
            </div>
            {item.days_left !== undefined && (
              <span style={{
                fontSize: 12, fontWeight: 800, color: item.days_left <= 7 ? '#EF4444' : '#F59E0B',
                background: item.days_left <= 7 ? '#FEE2E2' : '#FEF3C7',
                padding: '2px 8px', borderRadius: 6,
              }}>
                {item.days_left}d
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
