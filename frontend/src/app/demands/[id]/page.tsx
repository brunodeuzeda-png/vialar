'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCondominium } from '@/contexts/CondominiumContext';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Zap, MessageSquare, User, Home,
  Send, Loader2, RefreshCw, Tag, Calendar,
  Clock, AlertCircle, CheckCircle2, XCircle, Users,
} from 'lucide-react';
import Header from '@/components/layout/Header';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

// Pipeline stages (ordered flow)
const PIPELINE = [
  { status: 'ABERTA',               label: 'Aberta',            short: 'Aberta',       color: '#3B82F6' },
  { status: 'TRIAGEM',              label: 'Triagem',            short: 'Triagem',      color: '#8B5CF6' },
  { status: 'EM_ANDAMENTO',         label: 'Em andamento',       short: 'Andamento',    color: '#F59E0B' },
  { status: 'AGUARDANDO_ORCAMENTO', label: 'Aguard. orçamento',  short: 'Orçamento',    color: '#F97316' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Aguard. aprovação',  short: 'Aprovação',    color: '#EAB308' },
  { status: 'AGENDADA',             label: 'Agendada',           short: 'Agendada',     color: '#22C55E' },
  { status: 'CONCLUIDA',            label: 'Concluída',          short: 'Concluída',    color: '#16A34A' },
];

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  CRITICA: { label: 'Crítica', bg: '#FEF2F2', color: '#DC2626' },
  ALTA:    { label: 'Alta',    bg: '#FFF7ED', color: '#EA580C' },
  MEDIA:   { label: 'Média',   bg: '#FFFBEB', color: '#D97706' },
  BAIXA:   { label: 'Baixa',   bg: '#F0FDF4', color: '#16A34A' },
};
const CATEGORY_ICON: Record<string, string> = {
  MANUTENCAO: '🔧', LIMPEZA: '🧹', SEGURANCA: '🔒', FINANCEIRO: '💰',
  BARULHO: '🔊', INFRAESTRUTURA: '🏗️', ADMINISTRATIVO: '📋', OUTRO: '📌',
};
const CATEGORY_LABEL: Record<string, string> = {
  MANUTENCAO: 'Manutenção', LIMPEZA: 'Limpeza', SEGURANCA: 'Segurança',
  FINANCEIRO: 'Financeiro', BARULHO: 'Barulho', INFRAESTRUTURA: 'Infraestrutura',
  ADMINISTRATIVO: 'Administrativo', OUTRO: 'Outro',
};

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, bg: '#F9FAFB', color: '#6B7280' };
  return (
    <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 99, background: cfg.bg, fontSize: 12, fontWeight: 600, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function DemandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { activeCondo } = useCondominium();
  const condoId = activeCondo?.id;

  const [comment, setComment] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: demand, isLoading } = useQuery({
    queryKey: ['demand', id, condoId],
    queryFn: () => api.get(`/demands/${id}`, { params: { condominium_id: condoId } }).then(r => r.data),
    enabled: !!condoId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/demands/${id}`, { ...data, condominium_id: condoId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['demand', id] });
      qc.invalidateQueries({ queryKey: ['demands'] });
      toast.success('Chamado atualizado');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao atualizar'),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/demands/${id}/updates`, { type: 'COMMENT', content: comment, condominium_id: condoId }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['demand', id] });
      setComment('');
      toast.success('Comentário adicionado');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao comentar'),
  });

  async function handleAITriage() {
    setAiLoading(true);
    try {
      await api.post(`/demands/${id}/ai/triage`, { condominium_id: condoId });
      qc.invalidateQueries({ queryKey: ['demand', id] });
      toast.success('Triagem IA realizada!');
    } catch {
      toast.error('Erro ao executar triagem IA');
    } finally {
      setAiLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', background: S,
    border: `1.5px solid ${B}`, borderRadius: 8, fontSize: 14,
    color: T, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
  };
  const card: React.CSSProperties = {
    background: S, border: `1px solid ${B}`, borderRadius: 14, padding: 20, marginBottom: 16,
  };

  if (isLoading || !condoId) {
    return (
      <div style={{ minHeight: '100vh', background: L }}>
        <Header title="Chamado" />
        <main style={{ padding: '28px 32px' }}>
          <div style={{ height: 100, background: S, border: `1px solid ${B}`, borderRadius: 14, marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
            <div style={{ height: 300, background: S, border: `1px solid ${B}`, borderRadius: 14 }} />
            <div style={{ height: 200, background: S, border: `1px solid ${B}`, borderRadius: 14 }} />
          </div>
        </main>
      </div>
    );
  }

  if (!demand) return null;

  const triage = demand.ai_triage_data;
  const updates: any[] = demand.updates || [];
  const isCancelled = demand.status === 'CANCELADA';
  const currentIdx = PIPELINE.findIndex(p => p.status === demand.status);

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Chamado" />
      <main style={{ padding: '28px 32px' }}>

        {/* Back */}
        <button
          onClick={() => router.push('/demands')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T3, padding: '4px 0', marginBottom: 16 }}
        >
          <ArrowLeft size={14} /> Voltar aos chamados
        </button>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 44, height: 44, background: S, border: `1px solid ${B}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {CATEGORY_ICON[demand.category] || '📌'}
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: T, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
                {demand.title}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <PriorityBadge priority={demand.priority} />
                <span style={{ fontSize: 12, color: T3 }}>
                  {demand.requester_name}{demand.unit_identifier ? ` · Apt ${demand.unit_identifier}` : ''}
                </span>
                {triage && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: AC + '20', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#5A7A00', fontWeight: 600 }}>
                    <Zap size={10} /> Triado por IA
                  </span>
                )}
                {isCancelled && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF2F2', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                    <XCircle size={10} /> Cancelado
                  </span>
                )}
              </div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: T3, fontFamily: 'monospace', background: L, padding: '4px 8px', borderRadius: 6 }}>
            #{demand.id?.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* ── PIPELINE ─────────────────────────────────────────── */}
        <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: 0 }}>PIPELINE DO CHAMADO</h3>
            {!isCancelled && (
              <button
                onClick={() => { if (confirm('Cancelar este chamado?')) updateMutation.mutate({ status: 'CANCELADA' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid #FEE2E2`, borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}
              >
                <XCircle size={12} /> Cancelar
              </button>
            )}
          </div>

          {isCancelled ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#DC2626', fontWeight: 600, fontSize: 14 }}>
              <XCircle size={20} style={{ marginBottom: 6 }} /> Este chamado foi cancelado.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Connector line */}
              <div style={{ position: 'absolute', top: 18, left: '6%', right: '6%', height: 3, background: B, borderRadius: 99, zIndex: 0 }} />
              <div style={{
                position: 'absolute', top: 18, left: '6%',
                width: currentIdx <= 0 ? '0%' : `${(currentIdx / (PIPELINE.length - 1)) * 88}%`,
                height: 3, background: PIPELINE[currentIdx]?.color || T, borderRadius: 99, zIndex: 1,
                transition: 'width 0.4s ease',
              }} />

              {/* Steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                {PIPELINE.map((step, idx) => {
                  const isDone = idx < currentIdx;
                  const isCurrent = idx === currentIdx;
                  const isFuture = idx > currentIdx;

                  return (
                    <button
                      key={step.status}
                      onClick={() => {
                        if (!isCurrent) updateMutation.mutate({ status: step.status });
                      }}
                      disabled={isCurrent || updateMutation.isPending}
                      title={isFuture ? `Avançar para: ${step.label}` : isDone ? `Voltar para: ${step.label}` : step.label}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: 'none', border: 'none', cursor: isCurrent ? 'default' : 'pointer',
                        padding: '0 4px',
                      }}
                    >
                      {/* Circle */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isCurrent ? step.color : isDone ? T : S,
                        border: `3px solid ${isCurrent ? step.color : isDone ? T : B}`,
                        boxShadow: isCurrent ? `0 0 0 4px ${step.color}25` : 'none',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}>
                        {isDone
                          ? <CheckCircle2 size={16} color={S} strokeWidth={2.5} />
                          : isCurrent
                            ? <span style={{ width: 10, height: 10, borderRadius: '50%', background: S }} />
                            : <span style={{ width: 8, height: 8, borderRadius: '50%', background: B }} />
                        }
                      </div>

                      {/* Label */}
                      <span style={{
                        fontSize: 11, fontWeight: isCurrent ? 800 : isDone ? 600 : 500,
                        color: isCurrent ? step.color : isDone ? T : T3,
                        textAlign: 'center', lineHeight: 1.3, maxWidth: 72,
                        whiteSpace: 'nowrap',
                      }}>
                        {step.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick advance buttons */}
          {!isCancelled && currentIdx < PIPELINE.length - 1 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${B}`, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: T3, fontWeight: 600 }}>Avançar para:</span>
              {PIPELINE.slice(currentIdx + 1).map(step => (
                <button
                  key={step.status}
                  onClick={() => updateMutation.mutate({ status: step.status })}
                  disabled={updateMutation.isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                    background: step.color + '15', border: `1.5px solid ${step.color}40`,
                    borderRadius: 8, fontSize: 12, fontWeight: 600, color: step.color,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = step.color + '25'; e.currentTarget.style.borderColor = step.color; }}
                  onMouseLeave={e => { e.currentTarget.style.background = step.color + '15'; e.currentTarget.style.borderColor = step.color + '40'; }}
                >
                  {updateMutation.isPending ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {step.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* ── END PIPELINE ─────────────────────────────────────── */}

        {/* 2-col body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* Left */}
          <div>
            {/* Description */}
            <div style={card}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: '0 0 12px' }}>DESCRIÇÃO</h3>
              <p style={{ fontSize: 14, color: T, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{demand.description}</p>
            </div>

            {/* AI */}
            {triage ? (
              <div style={{ ...card, border: `1.5px solid ${AC}40`, background: '#FAFFF0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, background: AC + '30', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={14} color="#5A7A00" />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: T, margin: 0 }}>Análise da IA</h3>
                  <button onClick={handleAITriage} disabled={aiLoading}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${B}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: T2, cursor: 'pointer' }}>
                    {aiLoading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={11} />} Refazer
                  </button>
                </div>

                {/* Summary */}
                {triage.summary && (
                  <p style={{ fontSize: 13, color: T, lineHeight: 1.6, margin: '0 0 14px', padding: '10px 14px', background: AC + '15', borderRadius: 8, borderLeft: `3px solid ${AC}` }}>
                    {triage.summary}
                  </p>
                )}

                {/* Routing highlight — multi-sector */}
                {(demand.assigned_setores?.length > 0 || demand.assigned_setor) && (() => {
                  const setores: string[] = demand.assigned_setores?.length
                    ? demand.assigned_setores
                    : [demand.assigned_setor];
                  return (
                    <div style={{ marginBottom: 14, padding: '14px 16px', background: S, borderRadius: 10, border: `2px solid #3B82F630` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: setores.length > 1 ? 10 : 0 }}>
                        <div style={{ width: 32, height: 32, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Users size={15} color="#3B82F6" />
                        </div>
                        <p style={{ fontSize: 11, color: T3, margin: 0, fontWeight: 700, letterSpacing: '0.05em' }}>
                          {setores.length > 1 ? 'SETORES ENVOLVIDOS' : 'ENCAMINHADO PARA'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: demand.routing_data?.justificativa ? 8 : 0 }}>
                        {setores.map((s, i) => (
                          <span key={s} style={{
                            padding: '4px 12px', borderRadius: 99, fontSize: 13, fontWeight: 700,
                            background: i === 0 ? '#3B82F6' : '#EFF6FF',
                            color: i === 0 ? '#fff' : '#1D4ED8',
                            border: i === 0 ? 'none' : '1px solid #BFDBFE',
                          }}>
                            {i === 0 && setores.length > 1 ? `★ ${s}` : s}
                          </span>
                        ))}
                      </div>
                      {demand.routing_data?.justificativa && (
                        <p style={{ fontSize: 12, color: T2, margin: 0, lineHeight: 1.5 }}>{demand.routing_data.justificativa}</p>
                      )}
                    </div>
                  );
                })()}

                {/* Triage metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Categoria', value: CATEGORY_LABEL[triage.category] || triage.category },
                    { label: 'Prioridade', value: PRIORITY_CONFIG[triage.priority]?.label || triage.priority },
                    { label: 'Resolução estimada', value: triage.estimated_resolution_hours ? `${triage.estimated_resolution_hours}h` : null },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} style={{ background: L, border: `1px solid ${B}`, borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11, color: T3, margin: '0 0 3px', fontWeight: 600 }}>{item.label}</p>
                      <p style={{ fontSize: 13, color: T, fontWeight: 700, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Suggested action */}
                {triage.suggested_action && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: S, borderRadius: 8, border: `1px solid ${B}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <CheckCircle2 size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontSize: 11, color: T3, margin: '0 0 2px', fontWeight: 600 }}>AÇÃO SUGERIDA</p>
                      <p style={{ fontSize: 13, color: T, margin: 0 }}>{triage.suggested_action}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...card, textAlign: 'center', padding: '24px 20px' }}>
                <Zap size={24} color={T3} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: T, margin: '0 0 4px' }}>Sem triagem IA</p>
                <p style={{ fontSize: 12, color: T3, margin: '0 0 14px' }}>Clique para analisar este chamado com IA</p>
                <button onClick={handleAITriage} disabled={aiLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: T, color: S, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? 0.7 : 1 }}>
                  {aiLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
                  Executar triagem IA
                </button>
              </div>
            )}

            {/* Timeline */}
            <div style={card}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: '0 0 16px' }}>HISTÓRICO ({updates.length})</h3>
              {updates.length === 0 && (
                <p style={{ fontSize: 13, color: T3, textAlign: 'center', padding: '20px 0' }}>Nenhuma atualização ainda.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {updates.map((u: any, idx: number) => {
                  const isStatus = u.type === 'STATUS_CHANGE';
                  const isLast = idx === updates.length - 1;
                  return (
                    <div key={u.id} style={{ display: 'flex', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isStatus ? T : '#EFF6FF', border: `2px solid ${isStatus ? T : B}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isStatus ? <CheckCircle2 size={13} color={S} /> : <MessageSquare size={12} color={T3} />}
                        </div>
                        {!isLast && <div style={{ width: 2, flex: 1, background: B, minHeight: 16, margin: '4px 0' }} />}
                      </div>
                      <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T }}>{u.author_name || 'Sistema'}</span>
                          {u.author_role && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: L, color: T3, fontWeight: 600 }}>{u.author_role}</span>}
                          <span style={{ fontSize: 11, color: T3, marginLeft: 'auto' }}>{timeAgo(u.created_at)}</span>
                        </div>
                        {isStatus && u.old_value && u.new_value ? (
                          <p style={{ fontSize: 12, color: T2, margin: 0 }}>
                            {PIPELINE.find(p => p.status === u.old_value)?.label || u.old_value}
                            {' → '}
                            <strong style={{ color: PIPELINE.find(p => p.status === u.new_value)?.color || T }}>
                              {PIPELINE.find(p => p.status === u.new_value)?.label || u.new_value}
                            </strong>
                          </p>
                        ) : (
                          <p style={{ fontSize: 13, color: T, margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{u.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comment */}
              <div style={{ borderTop: `1px solid ${B}`, marginTop: 16, paddingTop: 16 }}>
                <textarea
                  style={{ ...inp, minHeight: 80, resize: 'none', marginBottom: 10 }}
                  placeholder="Adicionar comentário ou nota..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onFocus={e => (e.target.style.borderColor = T)}
                  onBlur={e => (e.target.style.borderColor = B)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => commentMutation.mutate()} disabled={!comment.trim() || commentMutation.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: T, color: S, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: (!comment.trim() || commentMutation.isPending) ? 'default' : 'pointer', opacity: (!comment.trim() || commentMutation.isPending) ? 0.5 : 1 }}>
                    {commentMutation.isPending ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={13} />}
                    Comentar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            <div style={card}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: '0 0 14px' }}>DETALHES</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <User size={13} />, label: 'Solicitante', value: demand.requester_name },
                  { icon: <Home size={13} />, label: 'Unidade', value: demand.unit_identifier ? `Apt ${demand.unit_identifier}` : null },
                  { icon: <Tag size={13} />, label: 'Categoria', value: `${CATEGORY_ICON[demand.category] || ''} ${CATEGORY_LABEL[demand.category] || demand.category}` },
                  { icon: <AlertCircle size={13} />, label: 'Prioridade', value: PRIORITY_CONFIG[demand.priority]?.label },
                  { icon: <Calendar size={13} />, label: 'Aberto em', value: demand.created_at ? new Date(demand.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null },
                  { icon: <Clock size={13} />, label: 'Atualizado', value: demand.updated_at ? timeAgo(demand.updated_at) : null },
                  { icon: <User size={13} />, label: 'Responsável', value: demand.assigned_name },
                  { icon: <Tag size={13} />, label: 'Setor', value: demand.assigned_setores?.length > 1 ? demand.assigned_setores.join(', ') : demand.assigned_setor },
                  { icon: <MessageSquare size={13} />, label: 'Origem', value: demand.origin === 'WHATSAPP' ? '💬 WhatsApp' : demand.origin === 'PORTAL' ? '🌐 Portal' : demand.origin },
                ].filter(item => item.value).map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ color: T3, marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 11, color: T3, margin: '0 0 1px', fontWeight: 600 }}>{item.label}</p>
                      <p style={{ fontSize: 13, color: T, margin: 0, fontWeight: 500 }}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
