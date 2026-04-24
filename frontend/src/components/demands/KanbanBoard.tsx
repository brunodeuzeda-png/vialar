'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useCondominium } from '@/contexts/CondominiumContext';
import { Zap, GripVertical, Plus } from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const COLUMNS = [
  { status: 'ABERTA',               label: 'Aberta',            color: '#3B82F6', bg: '#EFF6FF' },
  { status: 'EM_ANDAMENTO',         label: 'Em andamento',      color: '#F59E0B', bg: '#FFFBEB' },
  { status: 'AGUARDANDO_ORCAMENTO', label: 'Aguard. orçamento', color: '#F97316', bg: '#FFF7ED' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Aguard. aprovação', color: '#EAB308', bg: '#FEF9C3' },
  { status: 'AGENDADA',             label: 'Agendada',          color: '#22C55E', bg: '#F0FDF4' },
  { status: 'CONCLUIDA',            label: 'Concluída',         color: '#16A34A', bg: '#DCFCE7' },
];

const PRIORITY_COLOR: Record<string, string> = {
  CRITICA: '#DC2626', ALTA: '#EA580C', MEDIA: '#D97706', BAIXA: '#16A34A',
};
const PRIORITY_LABEL: Record<string, string> = {
  CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa',
};
const CATEGORY_ICON: Record<string, string> = {
  MANUTENCAO: '🔧', LIMPEZA: '🧹', SEGURANCA: '🔒', FINANCEIRO: '💰',
  BARULHO: '🔊', INFRAESTRUTURA: '🏗️', ADMINISTRATIVO: '📋', OUTRO: '📌',
};

export default function KanbanBoard({ onNewDemand }: { onNewDemand: () => void }) {
  const qc = useQueryClient();
  const { activeCondo } = useCondominium();
  const condoId = activeCondo?.id;

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['demands-all', condoId],
    queryFn: () => api.get('/demands', { params: { condominium_id: condoId, limit: 200 } }).then(r => r.data),
    enabled: !!condoId,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/demands/${id}`, { status, condominium_id: condoId }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['demands-all', condoId] });
      const prev = qc.getQueryData(['demands-all', condoId]);
      qc.setQueryData(['demands-all', condoId], (old: any) => ({
        ...old,
        data: old?.data?.map((d: any) => d.id === id ? { ...d, status } : d),
      }));
      return { prev };
    },
    onError: (_e, _v, ctx: any) => qc.setQueryData(['demands-all', condoId], ctx?.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['demands-all', condoId] });
      qc.invalidateQueries({ queryKey: ['demands'] });
    },
  });

  const demands: any[] = data?.data || [];

  function handleDrop(status: string) {
    if (dragging && dragging !== status) {
      const demand = demands.find(d => d.id === dragging);
      if (demand && demand.status !== status) {
        moveMutation.mutate({ id: dragging, status });
      }
    }
    setDragging(null);
    setDragOver(null);
  }

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
      <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
        {COLUMNS.map(col => {
          const cards = demands.filter(d => d.status === col.status);
          const isOver = dragOver === col.status;

          return (
            <div
              key={col.status}
              onDragOver={e => { e.preventDefault(); setDragOver(col.status); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.status)}
              style={{
                width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10,
                background: isOver ? col.bg : L,
                border: `2px solid ${isOver ? col.color : B}`,
                borderRadius: 14, padding: 12, transition: 'all 0.15s',
                minHeight: 200,
              }}
            >
              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T }}>{col.label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T3, background: S, border: `1px solid ${B}`, padding: '1px 7px', borderRadius: 99 }}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              {isLoading && [1,2].map(i => (
                <div key={i} style={{ background: S, borderRadius: 10, padding: 12, border: `1px solid ${B}` }}>
                  <div style={{ height: 12, background: L, borderRadius: 4, marginBottom: 8, width: '80%' }} />
                  <div style={{ height: 10, background: L, borderRadius: 4, width: '50%' }} />
                </div>
              ))}

              {!isLoading && cards.map(demand => (
                <div
                  key={demand.id}
                  draggable
                  onDragStart={() => setDragging(demand.id)}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                  style={{
                    background: S,
                    border: `1.5px solid ${dragging === demand.id ? col.color : B}`,
                    borderRadius: 10, padding: 12, cursor: 'grab',
                    opacity: dragging === demand.id ? 0.5 : 1,
                    boxShadow: dragging === demand.id ? `0 4px 12px ${col.color}30` : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  <Link href={`/demands/${demand.id}`} style={{ textDecoration: 'none' }}>
                    {/* Category + title */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                        {CATEGORY_ICON[demand.category] || '📌'}
                      </span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: T, margin: 0, lineHeight: 1.35 }}>
                        {demand.title}
                      </p>
                    </div>

                    {/* Meta row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {/* Priority */}
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                        color: PRIORITY_COLOR[demand.priority] || T3,
                        background: PRIORITY_COLOR[demand.priority] ? PRIORITY_COLOR[demand.priority] + '18' : L,
                      }}>
                        {PRIORITY_LABEL[demand.priority] || demand.priority}
                      </span>

                      {/* AI badge */}
                      {demand.ai_triage_data && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: AC + '25', color: '#5A7A00', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Zap size={9} /> IA
                        </span>
                      )}

                      {/* Time */}
                      <span style={{ fontSize: 10, color: T3, marginLeft: 'auto' }}>
                        {timeAgo(demand.created_at)}
                      </span>
                    </div>

                    {/* Requester */}
                    {demand.requester_name && (
                      <p style={{ fontSize: 11, color: T3, margin: '6px 0 0', borderTop: `1px solid ${B}`, paddingTop: 6 }}>
                        {demand.requester_name}{demand.unit_identifier ? ` · Apt ${demand.unit_identifier}` : ''}
                      </p>
                    )}
                  </Link>
                </div>
              ))}

              {/* Empty col */}
              {!isLoading && cards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 8px', color: T3, fontSize: 12 }}>
                  Nenhum chamado
                </div>
              )}

              {/* Add button on first column */}
              {col.status === 'ABERTA' && !isLoading && (
                <button
                  onClick={onNewDemand}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', background: 'none', border: `1.5px dashed ${B}`, borderRadius: 9, fontSize: 12, color: T3, cursor: 'pointer', marginTop: 2 }}
                >
                  <Plus size={13} /> Novo chamado
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
