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
  Activity, Zap, Flame, CircleDot, Clock,
} from 'lucide-react';

const PIPELINE = [
  { status: 'ABERTA',               label: 'Aberta',      color: '#3B82F6' },
  { status: 'TRIAGEM',              label: 'Triagem',     color: '#8B5CF6' },
  { status: 'EM_ANDAMENTO',         label: 'Andamento',   color: '#F59E0B' },
  { status: 'AGUARDANDO_ORCAMENTO', label: 'Orçamento',   color: '#F97316' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Aprovação',   color: '#EAB308' },
  { status: 'AGENDADA',             label: 'Agendada',    color: '#22C55E' },
  { status: 'CONCLUIDA',            label: 'Concluída',   color: '#16A34A' },
];

const PRIO: Record<string, { label: string; color: string }> = {
  CRITICA: { label: 'Crítica', color: '#EF4444' },
  ALTA:    { label: 'Alta',    color: '#F97316' },
  MEDIA:   { label: 'Média',   color: '#EAB308' },
  BAIXA:   { label: 'Baixa',   color: '#22C55E' },
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header title="Setor" />
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[120, 80, 400].map(h => (
          <div key={h} style={{ height: h, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }} className="skeleton" />
        ))}
      </div>
    </div>
  );

  const demands: any[] = demandsData?.data || [];
  const sectorTeam = team.filter((m: any) => m.setor === setor.name && m.is_active);

  const open     = demands.filter(d => !['CONCLUIDA', 'CANCELADA'].includes(d.status)).length;
  const done     = demands.filter(d => d.status === 'CONCLUIDA').length;
  const critica  = demands.filter(d => d.priority === 'CRITICA' && !['CONCLUIDA', 'CANCELADA'].includes(d.status)).length;
  const andamento = demands.filter(d => d.status === 'EM_ANDAMENTO').length;
  const completionPct = demands.length > 0 ? Math.round((done / demands.length) * 100) : 0;

  const pipelineWithCounts = PIPELINE.map(p => ({
    ...p,
    count: demands.filter(d => d.status === p.status).length,
  }));

  const accent = setor.color;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header title={setor.name} />

      {/* Hero header */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        background: `linear-gradient(180deg, ${accent}0D 0%, transparent 100%)`,
        padding: '24px 32px 20px',
      }} className="page-main">

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Link href="/setores" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-2)', textDecoration: 'none', fontWeight: 500 }}>
            <ArrowLeft size={13} /> Setores
          </Link>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{setor.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

          {/* Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${accent}20`,
              border: `2px solid ${accent}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, flexShrink: 0,
            }}>
              {setor.icon}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>
                {setor.name}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                {/* Live dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', flexShrink: 0, boxShadow: '0 0 0 3px rgba(34,197,94,0.2)', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>
                    Ao vivo · atualizado {timeAgo(lastRefresh.toISOString())}
                  </span>
                </div>
                {/* Team avatars */}
                {sectorTeam.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--border-2)', fontSize: 12 }}>·</span>
                    <div style={{ display: 'flex', marginLeft: 0 }}>
                      {sectorTeam.slice(0, 4).map((m: any, i: number) => (
                        <div key={m.id} title={m.name} style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: `${accent}30`, border: '2px solid var(--bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 800, color: accent,
                          marginLeft: i > 0 ? -6 : 0, flexShrink: 0,
                          zIndex: sectorTeam.length - i,
                        }}>
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                      ))}
                      {sectorTeam.length > 4 && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--surface-2)', border: '2px solid var(--bg)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 800, color: 'var(--text-3)',
                          marginLeft: -6, flexShrink: 0,
                        }}>
                          +{sectorTeam.length - 4}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{sectorTeam.length} membro{sectorTeam.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Completion pill */}
            {demands.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 99,
              }}>
                <div style={{ width: 54, height: 4, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completionPct}%`, background: 'var(--success)', borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{completionPct}%</span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>concluídos</span>
              </div>
            )}
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ['setor-demands', id] })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                color: 'var(--text-2)', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              <RefreshCw size={12} /> Atualizar
            </button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 20 }} className="kpi-grid">
          {[
            { label: 'Em aberto',    value: open,      icon: <CircleDot size={15} />, color: '#3B82F6' },
            { label: 'Em andamento', value: andamento, icon: <Activity size={15} />,  color: '#F59E0B' },
            { label: 'Concluídos',   value: done,      icon: <CheckCircle2 size={15} />, color: 'var(--success)' },
            { label: 'Críticos',     value: critica,   icon: <Flame size={15} />,     color: 'var(--danger)' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'var(--surface)',
              border: `1px solid var(--border)`,
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ color: kpi.color, flexShrink: 0 }}>{kpi.icon}</div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', lineHeight: 1, margin: 0 }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', margin: '3px 0 0', textTransform: 'uppercase' }}>{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <main style={{ padding: '24px 32px' }} className="page-main">

        {/* Pipeline flow */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 20,
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 14px' }}>
            Funil de chamados
          </p>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }} className="status-tabs">
            {pipelineWithCounts.map((stage, i) => {
              const isActive = statusFilter === stage.status;
              const hasItems = stage.count > 0;
              return (
                <button
                  key={stage.status}
                  onClick={() => setStatusFilter(isActive ? '' : stage.status)}
                  style={{
                    flex: '1 0 auto',
                    minWidth: 80,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: '10px 8px',
                    background: isActive ? `${stage.color}20` : 'var(--bg)',
                    border: `1.5px solid ${isActive ? stage.color : 'var(--border)'}`,
                    borderRadius: 10, cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = stage.color + '60'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  {/* Connector line */}
                  {i < pipelineWithCounts.length - 1 && (
                    <span style={{
                      position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)',
                      width: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'var(--text-3)', zIndex: 1, pointerEvents: 'none',
                    }}>›</span>
                  )}
                  <span style={{
                    fontSize: 22, fontWeight: 900, color: hasItems ? stage.color : 'var(--text-3)',
                    lineHeight: 1, letterSpacing: '-0.03em',
                  }}>
                    {stage.count}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: isActive ? stage.color : 'var(--text-3)',
                    letterSpacing: '0.01em', textAlign: 'center', lineHeight: 1.2,
                  }}>
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Demand list */}
        <div>
          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              Chamados
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
              {statusFilter || priorityFilter ? '(filtrado)' : `· ${demands.length} total`}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(PRIO).map(([key, cfg]) => (
                <button key={key}
                  onClick={() => setPriorityFilter(priorityFilter === key ? '' : key)}
                  style={{
                    padding: '4px 12px', borderRadius: 99,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    background: priorityFilter === key ? cfg.color + '20' : 'transparent',
                    color: priorityFilter === key ? cfg.color : 'var(--text-3)',
                    border: `1px solid ${priorityFilter === key ? cfg.color + '60' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  {cfg.label}
                </button>
              ))}
              {(statusFilter || priorityFilter) && (
                <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
                  style={{
                    padding: '4px 12px', borderRadius: 99,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                  }}>
                  × Limpar
                </button>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 3, height: 36, background: 'var(--border-2)', borderRadius: 99 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: 4, marginBottom: 7 }} />
                    <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 4 }} />
                  </div>
                </div>
              ))
            ) : demands.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={32} color="var(--border-2)" />
                <p style={{ fontWeight: 700, color: 'var(--text-2)', margin: 0 }}>
                  {statusFilter || priorityFilter ? 'Nenhum chamado com esses filtros' : 'Nenhum chamado atribuído'}
                </p>
                <p>{statusFilter || priorityFilter ? 'Tente limpar os filtros' : 'Os chamados encaminhados aparecerão aqui'}</p>
              </div>
            ) : demands.map((d: any, i: number) => {
              const pCfg = PRIO[d.priority] || { label: d.priority, color: 'var(--text-3)' };
              const stCfg = PIPELINE.find(p => p.status === d.status);
              const isCritical = d.priority === 'CRITICA';
              const idx = PIPELINE.findIndex(p => p.status === d.status);
              const next = PIPELINE[idx + 1];
              const canAdvance = next && !['CONCLUIDA', 'CANCELADA'].includes(d.status);

              return (
                <div
                  key={d.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 0,
                    borderBottom: i < demands.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Priority strip */}
                  <div style={{
                    width: 3, alignSelf: 'stretch', flexShrink: 0,
                    background: pCfg.color,
                    opacity: 0.7,
                  }} />

                  {/* Content */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', minWidth: 0 }}>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </span>
                        {d.ai_triage_data && (
                          <span style={{
                            flexShrink: 0,
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            background: 'var(--accent-dim)', borderRadius: 5,
                            padding: '1px 6px', fontSize: 10,
                            color: 'var(--accent-2)', fontWeight: 700,
                          }}>
                            <Zap size={9} /> IA
                          </span>
                        )}
                        {isCritical && (
                          <span style={{ flexShrink: 0 }}><Flame size={12} color="var(--danger)" /></span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {/* Status pill */}
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 99,
                          background: (stCfg?.color || '#999') + '18',
                          fontSize: 10, fontWeight: 700, color: stCfg?.color || 'var(--text-3)',
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: stCfg?.color || '#999', flexShrink: 0 }} />
                          {stCfg?.label || d.status}
                        </span>
                        {d.requester_name && (
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {d.requester_name}{d.unit_identifier ? ` · ${d.unit_identifier}` : ''}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>
                          <Clock size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                          {timeAgo(d.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {canAdvance && (
                        <button
                          onClick={() => updateMutation.mutate({ demandId: d.id, status: next.status })}
                          title={`Avançar para: ${next.label}`}
                          style={{
                            padding: '5px 12px', borderRadius: 8,
                            fontSize: 11, fontWeight: 700,
                            background: next.color + '18',
                            color: next.color,
                            border: `1px solid ${next.color}40`,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = next.color + '30'; e.currentTarget.style.borderColor = next.color; }}
                          onMouseLeave={e => { e.currentTarget.style.background = next.color + '18'; e.currentTarget.style.borderColor = next.color + '40'; }}
                        >
                          {next.label} →
                        </button>
                      )}
                      <Link href={`/demands/${d.id}`} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 7,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        color: 'var(--text-3)', textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Team footer — only shown if team exists */}
          {sectorTeam.length > 0 && (
            <div style={{
              marginTop: 16,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Users size={13} color="var(--text-3)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Equipe do setor
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sectorTeam.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 99 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: `${accent}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 800, color: accent, flexShrink: 0,
                    }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{m.name}</span>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
          50%       { opacity: 0.6; box-shadow: 0 0 0 6px rgba(34,197,94,0.05); }
        }
      `}</style>
    </div>
  );
}
