'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  Zap, Flame, Clock, AlertTriangle, Activity, CircleDot, UserPlus, X,
} from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const PIPELINE = [
  { status: 'ABERTA',               label: 'Aberta',     color: '#3B82F6', short: 'Aberta' },
  { status: 'TRIAGEM',              label: 'Triagem',    color: '#8B5CF6', short: 'Triagem' },
  { status: 'EM_ANDAMENTO',         label: 'Andamento',  color: '#F59E0B', short: 'Andamento' },
  { status: 'AGUARDANDO_ORCAMENTO', label: 'Orçamento',  color: '#F97316', short: 'Orçamento' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Aprovação',  color: '#EAB308', short: 'Aprovação' },
  { status: 'AGENDADA',             label: 'Agendada',   color: '#22C55E', short: 'Agendada' },
  { status: 'CONCLUIDA',            label: 'Concluída',  color: '#16A34A', short: 'Concluída' },
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
    queryKey: ['setor-demands', id, statusFilter, priorityFilter],
    queryFn: () => api.get('/demands', {
      params: { condominium_id: condoId, all_condominiums: 'true', assigned_setor: setor?.name, status: statusFilter || undefined, priority: priorityFilter || undefined, limit: 200 }
    }).then(r => r.data),
    enabled: !!setor?.name,
    refetchInterval: 15000,
  });

  const { data: team = [] } = useQuery<any[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
  });

  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null);

  const openPicker = useCallback((demandId: string, btn: HTMLElement) => {
    const r = btn.getBoundingClientRect();
    setPickerPos({ top: r.bottom + 6, left: Math.min(r.left, window.innerWidth - 220) });
    setAssigningId(demandId);
  }, []);

  const updateMutation = useMutation({
    mutationFn: ({ demandId, condominiumId, status, assignedToId }: { demandId: string; condominiumId: string; status?: string; assignedToId?: string | null }) =>
      api.patch(`/demands/${demandId}`, { condominium_id: condominiumId, ...(status ? { status } : {}), ...(assignedToId !== undefined ? { assigned_to_id: assignedToId } : {}) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['setor-demands', id] });
      toast.success(vars.assignedToId !== undefined ? 'Responsável atribuído' : 'Status atualizado');
      setAssigningId(null);
      setPickerPos(null);
    },
  });

  useEffect(() => {
    if (dataUpdatedAt) setLastRefresh(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  // Skeleton
  if (!setor) return (
    <div style={{ width: '100%', height: '100%', background: L }}>
      <Header title="Setor" />
      <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 60px)' }}>
        <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
        <div style={{ width: 280, borderLeft: `1px solid ${B}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
        </div>
      </div>
    </div>
  );

  const demands: any[] = demandsData?.data || [];
  const sectorTeam = team.filter((m: any) => m.setor === setor.name && m.is_active);

  const open      = demands.filter(d => !['CONCLUIDA', 'CANCELADA'].includes(d.status)).length;
  const done      = demands.filter(d => d.status === 'CONCLUIDA').length;
  const critical  = demands.filter(d => d.priority === 'CRITICA' && !['CONCLUIDA', 'CANCELADA'].includes(d.status)).length;
  const pct       = demands.length > 0 ? Math.round((done / demands.length) * 100) : 0;

  const pipelineWithCounts = PIPELINE.map(p => ({
    ...p,
    count: demands.filter(d => d.status === p.status).length,
  }));

  // Group demands by condominium
  const demandsFiltered = demands.filter(d => {
    if (priorityFilter && d.priority !== priorityFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });
  const condoGroups: Record<string, { name: string; demands: any[] }> = {};
  for (const d of demandsFiltered) {
    const key = d.condominium_id || 'unknown';
    if (!condoGroups[key]) condoGroups[key] = { name: d.condominium_name || 'Condomínio', demands: [] };
    condoGroups[key].demands.push(d);
  }
  const groupEntries = Object.entries(condoGroups);

  const accent = setor.color;

  return (
    <div style={{ width: '100%', height: '100%', background: L, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {assigningId && pickerPos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => { setAssigningId(null); setPickerPos(null); }} />
          <div style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 50, background: S, border: `1px solid ${B}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, padding: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 8px', borderBottom: `1px solid ${B}`, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T3 }}>ATRIBUIR A</span>
              <button onClick={() => { setAssigningId(null); setPickerPos(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, padding: 2, display: 'flex' }}><X size={12} /></button>
            </div>
            {(() => {
              const d = demandsFiltered.find((x: any) => x.id === assigningId);
              if (!d) return null;
              return (
                <>
                  {d.assigned_to_id && (
                    <button
                      onClick={() => updateMutation.mutate({ demandId: d.id, condominiumId: d.condominium_id, assignedToId: null })}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, color: '#EF4444', fontWeight: 600, textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FFF0F0')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      × Remover responsável
                    </button>
                  )}
                  {sectorTeam.length === 0
                    ? <p style={{ fontSize: 12, color: T3, padding: '8px 10px', margin: 0 }}>Nenhum membro no setor</p>
                    : sectorTeam.map((m: any) => (
                      <button
                        key={m.id}
                        onClick={() => updateMutation.mutate({ demandId: d.id, condominiumId: d.condominium_id, assignedToId: m.id })}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: d.assigned_to_id === m.id ? AC + '20' : 'none', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: d.assigned_to_id === m.id ? 700 : 500, color: T, textAlign: 'left' }}
                        onMouseEnter={e => { if (d.assigned_to_id !== m.id) e.currentTarget.style.background = L; }}
                        onMouseLeave={e => { if (d.assigned_to_id !== m.id) e.currentTarget.style.background = 'none'; }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: `hsl(${m.name.charCodeAt(0) * 5 % 360},55%,50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {m.name[0].toUpperCase()}
                        </div>
                        {m.name.split(' ')[0]}
                        {d.assigned_to_id === m.id && <span style={{ marginLeft: 'auto', fontSize: 10, color: '#5A7A00', fontWeight: 700 }}>✓</span>}
                      </button>
                    ))
                  }
                </>
              );
            })()}
          </div>
        </>
      )}
      <Header title={setor.name} />

      {/* ── Compact top bar ── */}
      <div style={{ background: S, borderBottom: `1px solid ${B}`, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/setores" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: T3, textDecoration: 'none', flexShrink: 0 }}>
          <ArrowLeft size={13} /> Setores
        </Link>
        <span style={{ color: B }}>·</span>

        {/* Sector pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 10px', background: accent + '12', border: `1.5px solid ${accent}35`, borderRadius: 99 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: accent + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
            {setor.icon}
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: T }}>{setor.name}</span>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 0 2px #22C55E25', animation: 'pulse 2s infinite' }} />
        </div>

        {/* KPI pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { icon: <CircleDot size={12} />, value: open,     label: 'abertos',   color: '#3B82F6' },
            { icon: <Activity size={12} />,  value: demands.filter(d => d.status === 'EM_ANDAMENTO').length, label: 'andamento', color: '#F59E0B' },
            { icon: <Flame size={12} />,     value: critical, label: 'críticos',  color: '#DC2626' },
            { icon: <CheckCircle2 size={12} />, value: done,  label: 'concluídos',color: '#16A34A' },
          ].map(k => (
            <div key={k.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: L, border: `1px solid ${B}`, borderRadius: 99 }}>
              <span style={{ color: k.color }}>{k.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: k.color }}>{k.value}</span>
              <span style={{ fontSize: 11, color: T3 }}>{k.label}</span>
            </div>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: T3 }}>{timeAgo(lastRefresh.toISOString())}</span>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ['setor-demands', id] })}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: L, border: `1px solid ${B}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: T2, cursor: 'pointer' }}
          >
            <RefreshCw size={11} /> Atualizar
          </button>
        </div>
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── LEFT: demand list (main) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T }}>Chamados</span>
            <span style={{ fontSize: 13, color: T3 }}>{statusFilter || priorityFilter ? '(filtrado)' : `· ${demands.length} total`}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {Object.entries(PRIO).map(([key, cfg]) => (
                <button key={key}
                  onClick={() => setPriorityFilter(priorityFilter === key ? '' : key)}
                  style={{
                    padding: '4px 11px', borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    background: priorityFilter === key ? cfg.color : 'transparent',
                    color: priorityFilter === key ? S : cfg.color,
                    border: `1.5px solid ${cfg.color + (priorityFilter === key ? '' : '55')}`,
                  }}>
                  {cfg.label}
                </button>
              ))}
              {(statusFilter || priorityFilter) && (
                <button onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
                  style={{ padding: '4px 11px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: L, border: `1px solid ${B}`, color: T2 }}>
                  × Limpar
                </button>
              )}
            </div>
          </div>

          {/* Demand list — grouped by condominium */}
          {isLoading ? (
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
              {Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${B}` }}>
                  <div style={{ width: 3, height: 40, background: B, borderRadius: 99 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: '55%', borderRadius: 4, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 10, width: '35%', borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : demandsFiltered.length === 0 ? (
            <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '60px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={36} color={B} />
              <p style={{ fontSize: 15, fontWeight: 700, color: T, margin: 0 }}>
                {statusFilter || priorityFilter ? 'Nenhum chamado com esses filtros' : 'Nenhum chamado atribuído'}
              </p>
              <p style={{ fontSize: 13, color: T3, margin: 0 }}>
                {statusFilter || priorityFilter ? 'Tente limpar os filtros' : 'Os chamados encaminhados aparecerão aqui'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {groupEntries.map(([condoKey, group]) => (
                <div key={condoKey}>
                  {/* Condominium header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, padding: '6px 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: T }}>{group.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: T3, background: B, padding: '1px 8px', borderRadius: 99, fontWeight: 600 }}>
                      {group.demands.length} chamado{group.demands.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Demands for this condo */}
                  <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
                    {group.demands.map((d: any, i: number) => {
                      const pCfg = PRIO[d.priority] || { label: d.priority, color: T3, bg: L };
                      const stCfg = PIPELINE.find(p => p.status === d.status);
                      const idx = PIPELINE.findIndex(p => p.status === d.status);
                      const next = PIPELINE[idx + 1];
                      const canAdvance = !!next && !['CONCLUIDA', 'CANCELADA'].includes(d.status);
                      return (
                        <div key={d.id}
                          style={{ display: 'flex', alignItems: 'stretch', borderBottom: i < group.demands.length - 1 ? `1px solid ${B}` : 'none', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                          <div style={{ width: 3, flexShrink: 0, background: pCfg.color, opacity: 0.7 }} />

                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '13px 20px', minWidth: 0 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                                {d.ai_triage_data && (
                                  <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 3, background: AC + '25', borderRadius: 5, padding: '1px 6px', fontSize: 10, color: '#5A7A00', fontWeight: 700 }}>
                                    <Zap size={9} /> IA
                                  </span>
                                )}
                                {d.priority === 'CRITICA' && <Flame size={12} color="#DC2626" style={{ flexShrink: 0 }} />}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: (stCfg?.color || T3) + '18', fontSize: 10, fontWeight: 700, color: stCfg?.color || T3 }}>
                                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: stCfg?.color || T3 }} />
                                  {stCfg?.label || d.status}
                                </span>
                                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 99, background: pCfg.bg, fontSize: 10, fontWeight: 700, color: pCfg.color }}>
                                  {pCfg.label}
                                </span>
                                {d.requester_name && <span style={{ fontSize: 11, color: T3 }}>{d.requester_name}{d.unit_identifier ? ` · Apt ${d.unit_identifier}` : ''}</span>}
                                {d.assigned_name ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px 2px 4px', borderRadius: 99, background: '#3B82F610', border: '1px solid #3B82F625', fontSize: 10, fontWeight: 700, color: '#3B82F6' }}>
                                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: `hsl(${d.assigned_name.charCodeAt(0) * 5 % 360},55%,50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                                      {d.assigned_name[0].toUpperCase()}
                                    </div>
                                    {d.assigned_name.split(' ')[0]}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 10, color: T3, fontStyle: 'italic' }}>Sem responsável</span>
                                )}
                                <span style={{ fontSize: 11, color: T3, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Clock size={10} /> {timeAgo(d.created_at)}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

                              {/* Assignee button — dropdown rendered at root via fixed position */}
                              <button
                                onClick={e => openPicker(d.id, e.currentTarget)}
                                title={d.assigned_name ? `Responsável: ${d.assigned_name}` : 'Atribuir responsável'}
                                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${d.assigned_name ? '#3B82F630' : B}`, background: d.assigned_name ? '#3B82F608' : 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: d.assigned_name ? '#3B82F6' : T3, whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B82F6')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = d.assigned_name ? '#3B82F630' : B)}
                              >
                                {d.assigned_name ? (
                                  <>
                                    <div style={{ width: 16, height: 16, borderRadius: 4, background: `hsl(${d.assigned_name.charCodeAt(0) * 5 % 360},55%,50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff' }}>
                                      {d.assigned_name[0].toUpperCase()}
                                    </div>
                                    {d.assigned_name.split(' ')[0]}
                                  </>
                                ) : (
                                  <><UserPlus size={11} /> Atribuir</>
                                )}
                              </button>

                              {canAdvance && (
                                <button
                                  onClick={() => updateMutation.mutate({ demandId: d.id, status: next.status, condominiumId: d.condominium_id })}
                                  style={{ padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: next.color + '15', color: next.color, border: `1.5px solid ${next.color}40`, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = next.color + '28'; e.currentTarget.style.borderColor = next.color; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = next.color + '15'; e.currentTarget.style.borderColor = next.color + '40'; }}
                                >
                                  {next.short} →
                                </button>
                              )}
                              <Link href={`/demands/${d.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: L, border: `1px solid ${B}`, color: T3, textDecoration: 'none', transition: 'all 0.15s' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T3; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = B; }}>
                                <ChevronRight size={14} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT sidebar ── */}
        <div style={{ width: 268, flexShrink: 0, borderLeft: `1px solid ${B}`, background: S, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Pipeline stages — vertical */}
          <div style={{ padding: '18px 16px', borderBottom: `1px solid ${B}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>Funil de etapas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pipelineWithCounts.map(stage => {
                const isActive = statusFilter === stage.status;
                const total = demands.length || 1;
                const barW = Math.round((stage.count / total) * 100);
                return (
                  <button
                    key={stage.status}
                    onClick={() => setStatusFilter(isActive ? '' : stage.status)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                      borderRadius: 8, border: `1.5px solid ${isActive ? stage.color : 'transparent'}`,
                      background: isActive ? stage.color + '12' : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = L; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: isActive ? stage.color : T2 }}>{stage.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: stage.count > 0 ? stage.color : T3, minWidth: 16, textAlign: 'right' }}>{stage.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div style={{ padding: '16px', borderBottom: `1px solid ${B}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', margin: '0 0 12px' }}>Resumo</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Total de chamados', value: demands.length, color: T },
                { label: 'Em aberto',         value: open,           color: '#3B82F6' },
                { label: 'Em andamento',      value: demands.filter(d => d.status === 'EM_ANDAMENTO').length, color: '#F59E0B' },
                { label: 'Críticos ativos',   value: critical,       color: '#DC2626' },
                { label: 'Concluídos',        value: done,           color: '#16A34A' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: L, borderRadius: 7 }}>
                  <span style={{ fontSize: 12, color: T2 }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            {demands.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: T3 }}>Conclusão</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A' }}>{pct}%</span>
                </div>
                <div style={{ height: 6, background: B, borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: accent, borderRadius: 99, transition: 'width 0.5s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Team */}
          <div style={{ padding: '16px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <Users size={12} color={T3} />
              <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', margin: 0 }}>
                Equipe · {sectorTeam.length}
              </p>
            </div>
            {sectorTeam.length === 0 ? (
              <p style={{ fontSize: 12, color: T3, textAlign: 'center', padding: '16px 0' }}>Nenhum membro neste setor</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sectorTeam.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: L, borderRadius: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: accent, flexShrink: 0 }}>
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: T, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                      <p style={{ fontSize: 10, color: T3, margin: 0 }}>{m.funcao || 'Funcionário'}</p>
                    </div>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
