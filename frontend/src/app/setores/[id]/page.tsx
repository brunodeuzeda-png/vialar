'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useCondominium } from '@/contexts/CondominiumContext';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, MessageSquare, CheckCircle2, AlertCircle,
  Clock, Flame, ChevronRight, RefreshCw, Activity, Zap,
  TrendingUp, CircleDot,
} from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const PIPELINE_STATUSES = [
  { status: 'ABERTA',               label: 'Aberta',       color: '#3B82F6' },
  { status: 'TRIAGEM',              label: 'Triagem',      color: '#8B5CF6' },
  { status: 'EM_ANDAMENTO',         label: 'Andamento',    color: '#F59E0B' },
  { status: 'AGUARDANDO_ORCAMENTO', label: 'Orçamento',    color: '#F97316' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Aprovação',    color: '#EAB308' },
  { status: 'AGENDADA',             label: 'Agendada',     color: '#22C55E' },
  { status: 'CONCLUIDA',            label: 'Concluída',    color: '#16A34A' },
];

const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string }> = {
  CRITICA: { label: 'Crítica', color: '#DC2626', bg: '#FEF2F2' },
  ALTA:    { label: 'Alta',    color: '#EA580C', bg: '#FFF7ED' },
  MEDIA:   { label: 'Média',   color: '#D97706', bg: '#FFFBEB' },
  BAIXA:   { label: 'Baixa',   color: '#16A34A', bg: '#F0FDF4' },
};

export default function SetorDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { activeCondo } = useCondominium();
  const condoId = activeCondo?.id;
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Sector info
  const { data: setor } = useQuery({
    queryKey: ['setor', id],
    queryFn: () => api.get('/setores').then(r => r.data.find((s: any) => s.id === id)),
    enabled: !!id,
  });

  // Demands for this sector (with polling for real-time)
  const { data: demandsData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['setor-demands', id, condoId, statusFilter, priorityFilter],
    queryFn: () => api.get('/demands', {
      params: {
        condominium_id: condoId,
        assigned_setor: setor?.name,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        limit: 100,
      }
    }).then(r => r.data),
    enabled: !!condoId && !!setor?.name,
    refetchInterval: 15000, // poll every 15s
  });

  // Stats
  const { data: statsAll = [] } = useQuery<any[]>({
    queryKey: ['demands-by-setor', condoId],
    queryFn: () => api.get('/demands/stats/by-setor', { params: { condominium_id: condoId } }).then(r => r.data),
    enabled: !!condoId,
    refetchInterval: 15000,
  });

  // Team for this sector
  const { data: team = [] } = useQuery<any[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ demandId, status }: { demandId: string; status: string }) =>
      api.patch(`/demands/${demandId}`, { status, condominium_id: condoId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setor-demands', id] });
      qc.invalidateQueries({ queryKey: ['demands-by-setor'] });
      toast.success('Status atualizado');
    },
  });

  useEffect(() => {
    setLastRefresh(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  if (!setor) return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Setor" />
      <div style={{ padding: 32 }}>
        <div style={{ height: 120, background: S, border: `1px solid ${B}`, borderRadius: 14 }} />
      </div>
    </div>
  );

  const demands: any[] = demandsData?.data || [];
  const sectorStats = statsAll.find((s: any) => s.assigned_setor === setor.name);
  const sectorTeam = team.filter((m: any) => m.setor === setor.name && m.is_active);

  const open    = demands.filter(d => !['CONCLUIDA','CANCELADA'].includes(d.status)).length;
  const done    = demands.filter(d => d.status === 'CONCLUIDA').length;
  const critica = demands.filter(d => d.priority === 'CRITICA' && !['CONCLUIDA','CANCELADA'].includes(d.status)).length;
  const andamento = demands.filter(d => d.status === 'EM_ANDAMENTO').length;

  const byStatus = PIPELINE_STATUSES.map(p => ({
    ...p,
    count: demands.filter(d => d.status === p.status).length,
  }));

  const totalActive = demands.filter(d => !['CONCLUIDA','CANCELADA'].includes(d.status)).length;

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title={setor.name} />
      <main style={{ padding: '24px 32px' }} className="page-main">

        {/* Back + header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link href="/setores" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T3, textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Setores
          </Link>
          <span style={{ color: B }}>›</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{setor.icon}</span>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: T, letterSpacing: '-0.03em', margin: 0 }}>{setor.name}</h1>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: setor.color, flexShrink: 0, boxShadow: `0 0 0 3px ${setor.color}30` }} />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: T3 }}>Atualizado {timeAgo(lastRefresh.toISOString())}</span>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['setor-demands', id] })}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: S, border: `1.5px solid ${B}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: T2, cursor: 'pointer' }}
            >
              <RefreshCw size={12} /> Atualizar
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }} className="kpi-grid">
          {[
            { label: 'EM ABERTO',    value: open,      icon: <CircleDot size={18} color="#3B82F6" />, bg: '#EFF6FF', color: '#3B82F6' },
            { label: 'EM ANDAMENTO', value: andamento, icon: <Activity size={18} color="#F59E0B" />,  bg: '#FFFBEB', color: '#F59E0B' },
            { label: 'CONCLUÍDOS',   value: done,      icon: <CheckCircle2 size={18} color="#16A34A" />, bg: '#F0FDF4', color: '#16A34A' },
            { label: 'CRÍTICOS',     value: critica,   icon: <Flame size={18} color="#DC2626" />,    bg: '#FEF2F2', color: '#DC2626' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kpi.icon}
                </div>
                {kpi.label === 'EM ABERTO' && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px #22C55E30' }} title="Ao vivo" />
                )}
              </div>
              <p style={{ fontSize: 32, fontWeight: 900, color: kpi.color, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 4px' }}>{kpi.value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.05em', margin: 0 }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline distribution */}
        <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={14} color={T3} />
            <h3 style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: 0 }}>DISTRIBUIÇÃO POR ETAPA</h3>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: T3 }}>{totalActive} ativos</span>
          </div>

          {/* Bar chart */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60, marginBottom: 10 }}>
            {byStatus.map(s => {
              const pct = totalActive > 0 ? (s.count / (demands.length || 1)) * 100 : 0;
              return (
                <div key={s.status} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.count > 0 ? s.color : T3 }}>{s.count || ''}</span>
                  <div style={{ width: '100%', borderRadius: 4, background: s.count > 0 ? s.color : B, height: Math.max(4, pct * 0.5), transition: 'height 0.3s' }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {byStatus.map(s => (
              <button
                key={s.status}
                onClick={() => setStatusFilter(statusFilter === s.status ? '' : s.status)}
                style={{
                  flex: 1, fontSize: 9, fontWeight: 700, color: statusFilter === s.status ? S : T3,
                  background: statusFilter === s.status ? s.color : 'transparent',
                  border: `1px solid ${statusFilter === s.status ? s.color : B}`,
                  borderRadius: 4, padding: '3px 2px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-col */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }} className="detail-grid">

          {/* Left: demand list */}
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: T, margin: 0 }}>
                Chamados
                {statusFilter || priorityFilter
                  ? <span style={{ fontWeight: 400, color: T3 }}> (filtrado)</span>
                  : <span style={{ fontWeight: 400, color: T3, fontSize: 12 }}> · {demands.length} total</span>
                }
              </h3>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                {['CRITICA','ALTA','MEDIA','BAIXA'].map(p => (
                  <button key={p} onClick={() => setPriorityFilter(priorityFilter === p ? '' : p)}
                    style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      background: priorityFilter === p ? PRIORITY_CFG[p].color : 'transparent',
                      color: priorityFilter === p ? S : PRIORITY_CFG[p].color,
                      border: `1.5px solid ${PRIORITY_CFG[p].color}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    {PRIORITY_CFG[p].label}
                  </button>
                ))}
                {(statusFilter || priorityFilter) && (
                  <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
                    style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: L, border: `1px solid ${B}`, color: T2 }}>
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} style={{ padding: '14px 18px', borderBottom: `1px solid ${B}`, display: 'flex', gap: 12 }}>
                    <div style={{ width: 36, height: 36, background: L, borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 13, background: L, borderRadius: 4, width: '60%', marginBottom: 8 }} />
                      <div style={{ height: 10, background: L, borderRadius: 4, width: '40%' }} />
                    </div>
                  </div>
                ))
              ) : demands.length === 0 ? (
                <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                  <CheckCircle2 size={32} color={B} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: T, marginBottom: 4 }}>Nenhum chamado</p>
                  <p style={{ fontSize: 13, color: T3 }}>
                    {statusFilter || priorityFilter ? 'Tente remover os filtros' : 'Este setor não tem chamados atribuídos'}
                  </p>
                </div>
              ) : (
                demands.map((d: any, i: number) => {
                  const pCfg = PRIORITY_CFG[d.priority] || { label: d.priority, color: T3, bg: L };
                  const stCfg = PIPELINE_STATUSES.find(p => p.status === d.status);
                  const isCritical = d.priority === 'CRITICA';
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                      borderBottom: i < demands.length - 1 ? `1px solid ${B}` : 'none',
                      background: isCritical ? '#FEF2F205' : 'transparent',
                      borderLeft: isCritical ? '3px solid #DC2626' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                      onMouseLeave={e => (e.currentTarget.style.background = isCritical ? '#FEF2F205' : 'transparent')}
                    >
                      {/* Status dot */}
                      <div style={{ flexShrink: 0, width: 10, height: 10, borderRadius: '50%', background: stCfg?.color || T3 }} />

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.title}
                          </p>
                          {d.ai_triage_data && (
                            <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, background: AC + '20', borderRadius: 5, padding: '1px 6px', fontSize: 10, color: '#5A7A00', fontWeight: 700 }}>
                              <Zap size={9} />IA
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: (stCfg?.color || T3) + '15', color: stCfg?.color || T3 }}>{stCfg?.label || d.status}</span>
                          {d.requester_name && <span style={{ fontSize: 11, color: T3 }}>{d.requester_name}{d.unit_identifier ? ` · ${d.unit_identifier}` : ''}</span>}
                          <span style={{ fontSize: 11, color: T3, marginLeft: 'auto' }}>{timeAgo(d.created_at)}</span>
                        </div>
                      </div>

                      {/* Quick status advance */}
                      {!['CONCLUIDA','CANCELADA'].includes(d.status) && (() => {
                        const idx = PIPELINE_STATUSES.findIndex(p => p.status === d.status);
                        const next = PIPELINE_STATUSES[idx + 1];
                        return next ? (
                          <button
                            onClick={() => updateMutation.mutate({ demandId: d.id, status: next.status })}
                            title={`Avançar para: ${next.label}`}
                            style={{
                              flexShrink: 0, padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                              background: next.color + '15', color: next.color, border: `1.5px solid ${next.color}40`,
                              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = next.color + '30'; e.currentTarget.style.borderColor = next.color; }}
                            onMouseLeave={e => { e.currentTarget.style.background = next.color + '15'; e.currentTarget.style.borderColor = next.color + '40'; }}
                          >
                            → {next.label}
                          </button>
                        ) : null;
                      })()}

                      {/* Link */}
                      <Link href={`/demands/${d.id}`} style={{ flexShrink: 0, color: T3, display: 'flex' }}>
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Live indicator */}
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0, boxShadow: '0 0 0 3px #22C55E30', animation: 'pulse 2s infinite' }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T, margin: 0 }}>Atualização automática</p>
                <p style={{ fontSize: 11, color: T3, margin: 0 }}>A cada 15 segundos</p>
              </div>
            </div>

            {/* Summary stats */}
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '16px 18px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: '0 0 14px' }}>RESUMO GERAL</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Total de chamados', value: demands.length, color: T },
                  { label: 'Em aberto',         value: open,           color: '#3B82F6' },
                  { label: 'Em andamento',      value: andamento,      color: '#F59E0B' },
                  { label: 'Concluídos',        value: done,           color: '#16A34A' },
                  { label: 'Críticos ativos',   value: critica,        color: '#DC2626' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: T2 }}>{item.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</span>
                  </div>
                ))}
                {demands.length > 0 && (
                  <>
                    <div style={{ borderTop: `1px solid ${B}`, paddingTop: 10, marginTop: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: T2 }}>Taxa de conclusão</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>
                          {Math.round((done / demands.length) * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 4, background: B, borderRadius: 99, marginTop: 6, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#16A34A', borderRadius: 99, width: `${Math.round((done / demands.length) * 100)}%`, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Team */}
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Users size={13} color={T3} />
                <h3 style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: 0 }}>EQUIPE ({sectorTeam.length})</h3>
              </div>
              {sectorTeam.length === 0 ? (
                <p style={{ fontSize: 12, color: T3, textAlign: 'center', padding: '12px 0' }}>Nenhum membro neste setor</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sectorTeam.map((m: any) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: setor.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: setor.color, flexShrink: 0 }}>
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                        <p style={{ fontSize: 11, color: T3, margin: 0 }}>{m.funcao || m.role}</p>
                      </div>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} title="Ativo" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '16px 18px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: '0 0 12px' }}>AÇÕES RÁPIDAS</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PIPELINE_STATUSES.filter(p => !['CONCLUIDA'].includes(p.status)).map(p => {
                  const count = demands.filter(d => d.status === p.status).length;
                  if (!count) return null;
                  return (
                    <button key={p.status}
                      onClick={() => setStatusFilter(statusFilter === p.status ? '' : p.status)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                        background: statusFilter === p.status ? p.color + '15' : L,
                        border: `1.5px solid ${statusFilter === p.status ? p.color : B}`,
                        borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: T }}>{p.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </main>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
}
