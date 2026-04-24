'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useCondominium } from '@/contexts/CondominiumContext';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, CheckCircle2, ChevronRight, RefreshCw,
  Activity, Zap, Flame, CircleDot, Clock, TrendingUp,
} from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const PIPELINE = [
  { status: 'ABERTA',               label: 'Aberta',     color: '#3B82F6' },
  { status: 'TRIAGEM',              label: 'Triagem',    color: '#8B5CF6' },
  { status: 'EM_ANDAMENTO',         label: 'Andamento',  color: '#F59E0B' },
  { status: 'AGUARDANDO_ORCAMENTO', label: 'Orçamento',  color: '#F97316' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Aprovação',  color: '#EAB308' },
  { status: 'AGENDADA',             label: 'Agendada',   color: '#22C55E' },
  { status: 'CONCLUIDA',            label: 'Concluída',  color: '#16A34A' },
];

const PRIO: Record<string, { label: string; color: string; bg: string }> = {
  CRITICA: { label: 'Crítica', color: '#DC2626', bg: '#FEF2F2' },
  ALTA:    { label: 'Alta',    color: '#EA580C', bg: '#FFF7ED' },
  MEDIA:   { label: 'Média',   color: '#D97706', bg: '#FFFBEB' },
  BAIXA:   { label: 'Baixa',   color: '#16A34A', bg: '#F0FDF4' },
};

export default function SetorDashboard() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { activeCondo } = useCondominium();
  const condoId = activeCondo?.id;
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: setor } = useQuery({
    queryKey: ['setor', id],
    queryFn: () => api.get('/setores').then(r => r.data.find((s: any) => s.id === id)),
    enabled: !!id,
  });

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
    refetchInterval: 15000,
  });

  const { data: team = [] } = useQuery<any[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ demandId, status }: { demandId: string; status: string }) =>
      api.patch(`/demands/${demandId}`, { status, condominium_id: condoId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setor-demands', id] });
      toast.success('Status atualizado');
    },
  });

  useEffect(() => {
    if (dataUpdatedAt) setLastRefresh(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  if (!setor) return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Setor" />
      <div style={{ padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[100, 80, 500].map(h => (
          <div key={h} style={{ height: h, background: S, border: `1px solid ${B}`, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  );

  const demands: any[] = demandsData?.data || [];
  const sectorTeam = team.filter((m: any) => m.setor === setor.name && m.is_active);

  const open      = demands.filter(d => !['CONCLUIDA', 'CANCELADA'].includes(d.status)).length;
  const done      = demands.filter(d => d.status === 'CONCLUIDA').length;
  const critica   = demands.filter(d => d.priority === 'CRITICA' && !['CONCLUIDA', 'CANCELADA'].includes(d.status)).length;
  const andamento = demands.filter(d => d.status === 'EM_ANDAMENTO').length;
  const completionPct = demands.length > 0 ? Math.round((done / demands.length) * 100) : 0;

  const pipelineWithCounts = PIPELINE.map(p => ({
    ...p,
    count: demands.filter(d => d.status === p.status).length,
  }));

  const inp: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', border: `1.5px solid`, transition: 'all 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title={setor.name} />
      <main style={{ padding: '28px 40px' }} className="page-main">

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <Link href="/setores" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: T3, textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={14} /> Setores
          </Link>
          <span style={{ color: B, fontSize: 16 }}>/</span>

          {/* Sector identity */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '8px 18px 8px 12px',
            background: S, border: `1.5px solid ${setor.color}40`,
            borderRadius: 12, boxShadow: `0 2px 12px ${setor.color}15`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: setor.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              {setor.icon}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: T, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {setor.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px #22C55E25', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, color: T3 }}>Ao vivo · {timeAgo(lastRefresh.toISOString())}</span>
              </div>
            </div>
          </div>

          {/* Team avatars */}
          {sectorTeam.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {sectorTeam.slice(0, 5).map((m: any, i: number) => (
                  <div key={m.id} title={m.name} style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: setor.color + '25',
                    border: `2px solid ${S}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: setor.color,
                    marginLeft: i > 0 ? -8 : 0,
                    position: 'relative', zIndex: sectorTeam.length - i,
                  }}>
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                ))}
                {sectorTeam.length > 5 && (
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: L, border: `2px solid ${S}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: T3, marginLeft: -8,
                  }}>+{sectorTeam.length - 5}</div>
                )}
              </div>
              <span style={{ fontSize: 12, color: T3 }}>{sectorTeam.length} membro{sectorTeam.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Completion */}
            {demands.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: S, border: `1px solid ${B}`, borderRadius: 99 }}>
                <div style={{ width: 64, height: 5, background: B, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionPct}%`, background: '#16A34A', borderRadius: 99, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#16A34A' }}>{completionPct}%</span>
                <span style={{ fontSize: 12, color: T3 }}>concluído</span>
              </div>
            )}
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['setor-demands', id] })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: S, border: `1.5px solid ${B}`, borderRadius: 9, fontSize: 13, fontWeight: 600, color: T2, cursor: 'pointer' }}
            >
              <RefreshCw size={13} /> Atualizar
            </button>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }} className="kpi-grid">
          {[
            { label: 'EM ABERTO',    value: open,      icon: <CircleDot size={20} color="#3B82F6" />,   bg: '#EFF6FF', color: '#3B82F6' },
            { label: 'EM ANDAMENTO', value: andamento, icon: <Activity size={20} color="#F59E0B" />,    bg: '#FFFBEB', color: '#F59E0B' },
            { label: 'CONCLUÍDOS',   value: done,      icon: <CheckCircle2 size={20} color="#16A34A" />, bg: '#F0FDF4', color: '#16A34A' },
            { label: 'CRÍTICOS',     value: critica,   icon: <Flame size={20} color="#DC2626" />,       bg: '#FEF2F2', color: '#DC2626' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: S, border: `1px solid ${B}`, borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {kpi.icon}
                </div>
                {kpi.label === 'EM ABERTO' && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 3px #22C55E25' }} />
                )}
              </div>
              <p style={{ fontSize: 38, fontWeight: 900, color: kpi.color, letterSpacing: '-0.04em', lineHeight: 1, margin: '0 0 6px' }}>{kpi.value}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: 0 }}>{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* ── Pipeline funnel ── */}
        <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <TrendingUp size={15} color={T3} />
            <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: 0, textTransform: 'uppercase' }}>
              Funil de etapas
            </h3>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: T3 }}>{demands.filter(d => !['CONCLUIDA','CANCELADA'].includes(d.status)).length} ativos</span>
          </div>

          <div style={{ display: 'flex', gap: 6 }} className="status-tabs">
            {pipelineWithCounts.map(stage => {
              const isActive = statusFilter === stage.status;
              const hasItems = stage.count > 0;
              return (
                <button
                  key={stage.status}
                  onClick={() => setStatusFilter(isActive ? '' : stage.status)}
                  style={{
                    flex: 1, minWidth: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                    padding: '14px 10px',
                    background: isActive ? stage.color + '15' : L,
                    border: `1.5px solid ${isActive ? stage.color : B}`,
                    borderRadius: 12, cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? `0 4px 12px ${stage.color}20` : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = stage.color + '80'; e.currentTarget.style.background = stage.color + '08'; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = B; e.currentTarget.style.background = L; } }}
                >
                  <span style={{ fontSize: 28, fontWeight: 900, color: hasItems ? stage.color : T3, letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {stage.count}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? stage.color : T3, textAlign: 'center', lineHeight: 1.3 }}>
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Demand list ── */}
        <div>
          {/* Filter row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: T, margin: 0 }}>
              Chamados
              <span style={{ fontSize: 13, fontWeight: 400, color: T3, marginLeft: 8 }}>
                {statusFilter || priorityFilter ? '(filtrado)' : `${demands.length} total`}
              </span>
            </h3>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(PRIO).map(([key, cfg]) => (
                <button key={key}
                  onClick={() => setPriorityFilter(priorityFilter === key ? '' : key)}
                  style={{
                    ...inp,
                    background: priorityFilter === key ? cfg.color : 'transparent',
                    color: priorityFilter === key ? S : cfg.color,
                    borderColor: cfg.color + (priorityFilter === key ? '' : '60'),
                  }}
                >
                  {cfg.label}
                </button>
              ))}
              {(statusFilter || priorityFilter) && (
                <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
                  style={{ ...inp, background: L, color: T2, borderColor: B }}>
                  × Limpar
                </button>
              )}
            </div>
          </div>

          <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 16, overflow: 'hidden' }}>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: `1px solid ${B}` }}>
                  <div style={{ width: 4, height: 40, background: B, borderRadius: 99 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, background: L, borderRadius: 6, width: '50%', marginBottom: 10 }} />
                    <div style={{ height: 11, background: L, borderRadius: 6, width: '30%' }} />
                  </div>
                </div>
              ))
            ) : demands.length === 0 ? (
              <div style={{ padding: '64px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <CheckCircle2 size={40} color={B} />
                <p style={{ fontSize: 15, fontWeight: 700, color: T, margin: 0 }}>
                  {statusFilter || priorityFilter ? 'Nenhum chamado com esses filtros' : 'Nenhum chamado atribuído'}
                </p>
                <p style={{ fontSize: 13, color: T3, margin: 0 }}>
                  {statusFilter || priorityFilter ? 'Tente limpar os filtros' : 'Os chamados encaminhados aparecerão aqui'}
                </p>
              </div>
            ) : demands.map((d: any, i: number) => {
              const pCfg = PRIO[d.priority] || { label: d.priority, color: T3, bg: L };
              const stCfg = PIPELINE.find(p => p.status === d.status);
              const isCritical = d.priority === 'CRITICA';
              const idx = PIPELINE.findIndex(p => p.status === d.status);
              const next = PIPELINE[idx + 1];
              const canAdvance = !!next && !['CONCLUIDA', 'CANCELADA'].includes(d.status);

              return (
                <div
                  key={d.id}
                  style={{
                    display: 'flex', alignItems: 'stretch',
                    borderBottom: i < demands.length - 1 ? `1px solid ${B}` : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Priority color strip */}
                  <div style={{ width: 4, background: pCfg.color, flexShrink: 0, opacity: 0.75 }} />

                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 18, padding: '16px 24px', minWidth: 0 }}>
                    {/* Text block */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </span>
                        {d.ai_triage_data && (
                          <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, background: AC + '25', borderRadius: 5, padding: '2px 7px', fontSize: 10, color: '#5A7A00', fontWeight: 700 }}>
                            <Zap size={9} /> IA
                          </span>
                        )}
                        {isCritical && <Flame size={13} color="#DC2626" style={{ flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 99, background: (stCfg?.color || T3) + '18', fontSize: 11, fontWeight: 700, color: stCfg?.color || T3 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: stCfg?.color || T3 }} />
                          {stCfg?.label || d.status}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 99, background: pCfg.bg, fontSize: 11, fontWeight: 700, color: pCfg.color }}>
                          {pCfg.label}
                        </span>
                        {d.requester_name && (
                          <span style={{ fontSize: 12, color: T3 }}>
                            {d.requester_name}{d.unit_identifier ? ` · Apt ${d.unit_identifier}` : ''}
                          </span>
                        )}
                        <span style={{ fontSize: 12, color: T3, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} /> {timeAgo(d.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {canAdvance && (
                        <button
                          onClick={() => updateMutation.mutate({ demandId: d.id, status: next.status })}
                          title={`Avançar para: ${next.label}`}
                          style={{
                            padding: '6px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700,
                            background: next.color + '15', color: next.color,
                            border: `1.5px solid ${next.color}40`,
                            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = next.color + '28'; e.currentTarget.style.borderColor = next.color; }}
                          onMouseLeave={e => { e.currentTarget.style.background = next.color + '15'; e.currentTarget.style.borderColor = next.color + '40'; }}
                        >
                          {next.label} →
                        </button>
                      )}
                      <Link href={`/demands/${d.id}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 34, height: 34, borderRadius: 9,
                        background: L, border: `1.5px solid ${B}`,
                        color: T3, textDecoration: 'none', transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T3; (e.currentTarget as HTMLElement).style.color = T; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = B; (e.currentTarget as HTMLElement).style.color = T3; }}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team strip */}
          {sectorTeam.length > 0 && (
            <div style={{
              marginTop: 16, background: S, border: `1px solid ${B}`,
              borderRadius: 14, padding: '16px 22px',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Users size={14} color={T3} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Equipe · {sectorTeam.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sectorTeam.map((m: any) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px', background: L, border: `1px solid ${B}`, borderRadius: 99,
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: setor.color + '22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, color: setor.color, flexShrink: 0,
                    }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T2 }}>{m.name}</span>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} title="Ativo" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
