'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useCondominium } from '@/contexts/CondominiumContext';
import { Zap, Plus } from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const COLUMNS = [
  { status: 'ABERTA',               label: 'Aberta',        color: '#3B82F6' },
  { status: 'EM_ANDAMENTO',         label: 'Em andamento',  color: '#F59E0B' },
  { status: 'AGUARDANDO_ORCAMENTO', label: 'Orçamento',     color: '#F97316' },
  { status: 'AGUARDANDO_APROVACAO', label: 'Aprovação',     color: '#EAB308' },
  { status: 'AGENDADA',             label: 'Agendada',      color: '#22C55E' },
  { status: 'CONCLUIDA',            label: 'Concluída',     color: '#16A34A' },
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
    if (dragging) {
      const demand = demands.find(d => d.id === dragging);
      if (demand && demand.status !== status) moveMutation.mutate({ id: dragging, status });
    }
    setDragging(null);
    setDragOver(null);
  }

  return (
    <div style={{ display: 'flex', gap: 8, height: '100%', minWidth: 'max-content', paddingBottom: 8 }}>
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
              width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
              background: isOver ? col.color + '10' : L,
              border: `2px solid ${isOver ? col.color : B}`,
              borderRadius: 12, padding: '10px 8px', transition: 'all 0.15s',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T }}>{col.label}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: T3, background: S, border: `1px solid ${B}`, padding: '1px 6px', borderRadius: 99 }}>
                {cards.length}
              </span>
            </div>

            {/* Scrollable cards */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {isLoading && [1, 2, 3].map(i => (
                <div key={i} style={{ background: S, borderRadius: 8, padding: '8px 10px', border: `1px solid ${B}` }}>
                  <div style={{ height: 10, background: L, borderRadius: 4, marginBottom: 6, width: '80%' }} />
                  <div style={{ height: 8, background: L, borderRadius: 4, width: '50%' }} />
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
                    borderRadius: 8, padding: '8px 10px', cursor: 'grab',
                    opacity: dragging === demand.id ? 0.45 : 1,
                    transition: 'all 0.12s',
                    flexShrink: 0,
                  }}
                >
                  <Link href={`/demands/${demand.id}`} style={{ textDecoration: 'none' }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 5 }}>
                      <span style={{ fontSize: 12, flexShrink: 0, lineHeight: 1.3 }}>
                        {CATEGORY_ICON[demand.category] || '📌'}
                      </span>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T, margin: 0, lineHeight: 1.3,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        {demand.title}
                      </p>
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99,
                        color: PRIORITY_COLOR[demand.priority] || T3,
                        background: (PRIORITY_COLOR[demand.priority] || '#999') + '18',
                      }}>
                        {PRIORITY_LABEL[demand.priority] || demand.priority}
                      </span>
                      {demand.ai_triage_data && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: AC + '25', color: '#5A7A00', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Zap size={8} />IA
                        </span>
                      )}
                      <span style={{ fontSize: 9, color: T3, marginLeft: 'auto' }}>
                        {timeAgo(demand.created_at)}
                      </span>
                    </div>

                    {/* Requester */}
                    {demand.requester_name && (
                      <p style={{ fontSize: 10, color: T3, margin: '5px 0 0', borderTop: `1px solid ${B}`, paddingTop: 4,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {demand.requester_name}{demand.unit_identifier ? ` · ${demand.unit_identifier}` : ''}
                      </p>
                    )}
                  </Link>
                </div>
              ))}

              {!isLoading && cards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px 4px', color: T3, fontSize: 11 }}>
                  Vazio
                </div>
              )}
            </div>

            {/* Add button on first column */}
            {col.status === 'ABERTA' && !isLoading && (
              <button
                onClick={onNewDemand}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px', background: 'none', border: `1.5px dashed ${B}`, borderRadius: 8, fontSize: 11, color: T3, cursor: 'pointer', marginTop: 6, flexShrink: 0 }}
              >
                <Plus size={11} /> Novo chamado
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
