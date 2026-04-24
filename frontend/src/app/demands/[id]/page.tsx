'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ArrowLeft, Zap, MessageSquare, Clock, User, Home,
  ChevronDown, Send, Loader2, RefreshCw, Tag, Calendar,
  AlertCircle, CheckCircle2, XCircle, Edit2, Save, X
} from 'lucide-react';
import Header from '@/components/layout/Header';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  ABERTA:               { label: 'Aberta',           bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  TRIAGEM:              { label: 'Triagem',           bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  EM_ANDAMENTO:         { label: 'Em andamento',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  AGUARDANDO_ORCAMENTO: { label: 'Aguard. orçamento', bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação', bg: '#FEF9C3', color: '#854D0E', dot: '#EAB308' },
  AGENDADA:             { label: 'Agendada',          bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  CONCLUIDA:            { label: 'Concluída',         bg: '#DCFCE7', color: '#166534', dot: '#16A34A' },
  CANCELADA:            { label: 'Cancelada',         bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
};

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

const STATUSES = [
  'ABERTA', 'TRIAGEM', 'EM_ANDAMENTO', 'AGUARDANDO_ORCAMENTO',
  'AGUARDANDO_APROVACAO', 'AGENDADA', 'CONCLUIDA', 'CANCELADA',
];

const UPDATE_TYPE_LABEL: Record<string, string> = {
  COMMENT: 'Comentário',
  STATUS_CHANGE: 'Alteração de status',
  INTERNAL_NOTE: 'Nota interna',
  ATTACHMENT: 'Anexo',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: cfg.bg, fontSize: 13, fontWeight: 600, color: cfg.color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || { label: priority, bg: '#F9FAFB', color: '#6B7280' };
  return (
    <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 99, background: cfg.bg, fontSize: 13, fontWeight: 600, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export default function DemandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [comment, setComment] = useState('');
  const [statusEdit, setStatusEdit] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: demand, isLoading } = useQuery({
    queryKey: ['demand', id],
    queryFn: () => api.get(`/demands/${id}`).then(r => r.data),
    onSuccess: (d: any) => { if (!selectedStatus) setSelectedStatus(d.status); },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/demands/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['demand', id] });
      qc.invalidateQueries({ queryKey: ['demands'] });
      setStatusEdit(false);
      toast.success('Chamado atualizado');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erro ao atualizar'),
  });

  const commentMutation = useMutation({
    mutationFn: () => api.post(`/demands/${id}/updates`, { type: 'COMMENT', content: comment }).then(r => r.data),
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
      await api.post(`/demands/${id}/ai/triage`);
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
    background: S, border: `1px solid ${B}`, borderRadius: 14,
    padding: 20, marginBottom: 16,
  };

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: L }}>
        <Header title="Chamado" />
        <main style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ height: 20, width: 80, background: B, borderRadius: 6 }} />
            <div style={{ height: 28, width: 280, background: B, borderRadius: 6 }} />
          </div>
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            <div style={{ ...card, height: 300 }} />
            <div style={{ ...card, height: 200 }} />
          </div>
        </main>
      </div>
    );
  }

  if (!demand) return null;

  const triage = demand.ai_triage_data;
  const updates: any[] = demand.updates || [];

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Chamado" />
      <main style={{ padding: '28px 32px' }}>

        {/* Back + title */}
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => router.push('/demands')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T3, padding: '4px 0', marginBottom: 12 }}
          >
            <ArrowLeft size={14} /> Voltar aos chamados
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, background: S, border: `1px solid ${B}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {CATEGORY_ICON[demand.category] || '📌'}
              </div>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: T, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
                  {demand.title}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <StatusBadge status={demand.status} />
                  <PriorityBadge priority={demand.priority} />
                  {triage && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: AC + '20', borderRadius: 6, padding: '3px 9px', fontSize: 12, color: '#5A7A00', fontWeight: 600 }}>
                      <Zap size={11} /> Triado por IA
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, color: T3, whiteSpace: 'nowrap', paddingTop: 4 }}>
              #{demand.id?.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Body: 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* Left column */}
          <div>
            {/* Description */}
            <div style={card}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: '0 0 12px' }}>DESCRIÇÃO</h3>
              <p style={{ fontSize: 14, color: T, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                {demand.description}
              </p>
            </div>

            {/* AI Triage Card */}
            {triage ? (
              <div style={{ ...card, border: `1.5px solid ${AC}40`, background: '#FAFFF0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, background: AC + '30', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={14} color="#5A7A00" />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 800, color: T, margin: 0 }}>Análise da IA</h3>
                  <button
                    onClick={handleAITriage}
                    disabled={aiLoading}
                    style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${B}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: T2, cursor: 'pointer' }}
                  >
                    {aiLoading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={11} />}
                    Refazer
                  </button>
                </div>
                {triage.summary && (
                  <p style={{ fontSize: 13, color: T, lineHeight: 1.6, margin: '0 0 14px', padding: '10px 14px', background: AC + '15', borderRadius: 8, borderLeft: `3px solid ${AC}` }}>
                    {triage.summary}
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Urgência', value: triage.urgency_score ? `${triage.urgency_score}/10` : null },
                    { label: 'Categoria sugerida', value: CATEGORY_LABEL[triage.category] || triage.category },
                    { label: 'Prioridade sugerida', value: PRIORITY_CONFIG[triage.priority]?.label || triage.priority },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} style={{ background: S, border: `1px solid ${B}`, borderRadius: 8, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11, color: T3, margin: '0 0 3px', fontWeight: 600 }}>{item.label}</p>
                      <p style={{ fontSize: 13, color: T, fontWeight: 700, margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {demand.assigned_setor && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: S, borderRadius: 8, border: `1px solid ${B}` }}>
                    <Tag size={13} color={T3} />
                    <span style={{ fontSize: 12, color: T2 }}>Encaminhado para: </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T }}>{demand.assigned_setor}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ ...card, textAlign: 'center', padding: '24px 20px' }}>
                <Zap size={24} color={T3} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: T, margin: '0 0 4px' }}>Sem triagem IA</p>
                <p style={{ fontSize: 12, color: T3, margin: '0 0 14px' }}>Clique para analisar este chamado com IA</p>
                <button
                  onClick={handleAITriage}
                  disabled={aiLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', background: T, color: S, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: aiLoading ? 'default' : 'pointer', opacity: aiLoading ? 0.7 : 1 }}
                >
                  {aiLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
                  Executar triagem IA
                </button>
              </div>
            )}

            {/* Timeline */}
            <div style={card}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: '0 0 16px' }}>
                HISTÓRICO ({updates.length})
              </h3>

              {updates.length === 0 && (
                <p style={{ fontSize: 13, color: T3, textAlign: 'center', padding: '20px 0' }}>Nenhuma atualização ainda.</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {updates.map((u: any, idx: number) => {
                  const isStatus = u.type === 'STATUS_CHANGE';
                  const isComment = u.type === 'COMMENT';
                  const isLast = idx === updates.length - 1;
                  return (
                    <div key={u.id} style={{ display: 'flex', gap: 12 }}>
                      {/* Timeline line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: isStatus ? T : isComment ? '#EFF6FF' : L,
                          border: `2px solid ${isStatus ? T : B}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isStatus
                            ? <CheckCircle2 size={13} color={S} />
                            : <MessageSquare size={12} color={T3} />}
                        </div>
                        {!isLast && <div style={{ width: 2, flex: 1, background: B, minHeight: 16, margin: '4px 0' }} />}
                      </div>
                      {/* Content */}
                      <div style={{ paddingBottom: isLast ? 0 : 16, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T }}>
                            {u.author_name || 'Sistema'}
                          </span>
                          {u.author_role && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: L, color: T3, fontWeight: 600 }}>
                              {u.author_role}
                            </span>
                          )}
                          <span style={{ fontSize: 11, color: T3, marginLeft: 'auto' }}>{timeAgo(u.created_at)}</span>
                        </div>
                        {isStatus && u.old_value && u.new_value ? (
                          <p style={{ fontSize: 12, color: T2, margin: 0 }}>
                            Status alterado:{' '}
                            <span style={{ fontWeight: 600, color: STATUS_CONFIG[u.old_value]?.color || T2 }}>
                              {STATUS_CONFIG[u.old_value]?.label || u.old_value}
                            </span>
                            {' → '}
                            <span style={{ fontWeight: 600, color: STATUS_CONFIG[u.new_value]?.color || T }}>
                              {STATUS_CONFIG[u.new_value]?.label || u.new_value}
                            </span>
                          </p>
                        ) : (
                          <p style={{ fontSize: 13, color: T, margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                            {u.content}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comment box */}
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
                  <button
                    onClick={() => commentMutation.mutate()}
                    disabled={!comment.trim() || commentMutation.isPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '9px 16px', background: T, color: S,
                      border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
                      cursor: (!comment.trim() || commentMutation.isPending) ? 'default' : 'pointer',
                      opacity: (!comment.trim() || commentMutation.isPending) ? 0.5 : 1,
                    }}
                  >
                    {commentMutation.isPending
                      ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Send size={13} />}
                    Comentar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div>
            {/* Status change */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: T3, letterSpacing: '0.06em', margin: 0 }}>STATUS</h3>
                {!statusEdit && (
                  <button
                    onClick={() => { setStatusEdit(true); setSelectedStatus(demand.status); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T3, padding: 0 }}
                  >
                    <Edit2 size={11} /> Alterar
                  </button>
                )}
              </div>
              {statusEdit ? (
                <div>
                  <select
                    style={{ ...inp, marginBottom: 10 }}
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setStatusEdit(false)}
                      style={{ flex: 1, padding: '8px 0', background: L, border: `1px solid ${B}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: T2, cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => updateMutation.mutate({ status: selectedStatus })}
                      disabled={updateMutation.isPending || selectedStatus === demand.status}
                      style={{ flex: 1, padding: '8px 0', background: T, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: S, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    >
                      {updateMutation.isPending ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={12} />}
                      Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <StatusBadge status={demand.status} />
              )}
            </div>

            {/* Details */}
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
                  { icon: <Tag size={13} />, label: 'Setor', value: demand.assigned_setor },
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

            {/* Origin badge */}
            {demand.origin && (
              <div style={{ ...card, padding: '12px 16px' }}>
                <p style={{ fontSize: 11, color: T3, margin: '0 0 3px', fontWeight: 600, letterSpacing: '0.06em' }}>ORIGEM</p>
                <p style={{ fontSize: 13, color: T, margin: 0, fontWeight: 600 }}>
                  {demand.origin === 'WHATSAPP' ? '💬 WhatsApp' : demand.origin === 'PORTAL' ? '🌐 Portal' : demand.origin}
                </p>
              </div>
            )}

            {/* Danger zone */}
            <div style={{ ...card, border: `1px solid #FEE2E2` }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', letterSpacing: '0.06em', margin: '0 0 10px' }}>AÇÕES</h3>
              <button
                onClick={() => {
                  if (confirm('Cancelar este chamado?')) {
                    updateMutation.mutate({ status: 'CANCELADA' });
                  }
                }}
                disabled={demand.status === 'CANCELADA' || demand.status === 'CONCLUIDA'}
                style={{
                  width: '100%', padding: '9px 0', background: 'none', border: `1px solid #FEE2E2`,
                  borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#DC2626', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  opacity: (demand.status === 'CANCELADA' || demand.status === 'CONCLUIDA') ? 0.4 : 1,
                }}
              >
                <XCircle size={13} /> Cancelar chamado
              </button>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
