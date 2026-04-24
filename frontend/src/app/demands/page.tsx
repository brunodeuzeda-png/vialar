'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import {
  Plus, Search, MessageSquare, ChevronRight, Zap,
  AlertCircle, Clock, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import Header from '@/components/layout/Header';
import NewDemandModal from '@/components/demands/NewDemandModal';
import KanbanBoard from '@/components/demands/KanbanBoard';
import { useCondominium } from '@/contexts/CondominiumContext';
import { LayoutList, Kanban } from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'AGUARDANDO_ORCAMENTO', label: 'Aguard. orçamento' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const PRIORITIES = ['', 'CRITICA', 'ALTA', 'MEDIA', 'BAIXA'];

const PRIORITY_LABEL: Record<string, string> = {
  CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  ABERTA:               { label: 'Aberta',          bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  TRIAGEM:              { label: 'Triagem',          bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  EM_ANDAMENTO:         { label: 'Em andamento',     bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  AGUARDANDO_ORCAMENTO: { label: 'Aguard. orçamento',bg: '#FFF7ED', color: '#C2410C', dot: '#F97316' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação',bg: '#FEF9C3', color: '#854D0E', dot: '#EAB308' },
  AGENDADA:             { label: 'Agendada',         bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  CONCLUIDA:            { label: 'Concluída',        bg: '#F0FDF4', color: '#166534', dot: '#16A34A' },
  CANCELADA:            { label: 'Cancelada',        bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
};

const PRIORITY_CONFIG: Record<string, { bg: string; color: string }> = {
  CRITICA: { bg: '#FEF2F2', color: '#DC2626' },
  ALTA:    { bg: '#FFF7ED', color: '#EA580C' },
  MEDIA:   { bg: '#FFFBEB', color: '#D97706' },
  BAIXA:   { bg: '#F0FDF4', color: '#16A34A' },
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

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: cfg.bg, fontSize: 12, fontWeight: 600, color: cfg.color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CONFIG[priority] || { bg: '#F9FAFB', color: '#6B7280' };
  return (
    <span style={{ display: 'inline-flex', padding: '3px 9px', borderRadius: 99, background: cfg.bg, fontSize: 12, fontWeight: 600, color: cfg.color }}>
      {PRIORITY_LABEL[priority] || priority}
    </span>
  );
}

export default function DemandsPage() {
  const qc = useQueryClient();
  const { activeCondo } = useCondominium();
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [showNew, setShowNew] = useState(false);
  const [view, setView] = useState<'list' | 'kanban'>('list');

  const condoId = activeCondo?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['demands', filters, condoId],
    queryFn: () => api.get('/demands', { params: { ...filters, limit: 15, condominium_id: condoId } }).then(r => r.data),
    enabled: !!condoId,
  });

  const set = (key: string, value: string) => setFilters(f => ({ ...f, [key]: value, page: 1 }));
  const demands = data?.data || [];
  const pagination = data?.pagination;

  const inp: React.CSSProperties = {
    padding: '9px 13px', background: S, border: `1.5px solid ${B}`,
    borderRadius: 8, fontSize: 14, color: T, outline: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  if (view === 'kanban') return (
    <div style={{ height: '100vh', overflow: 'hidden', background: L, display: 'flex', flexDirection: 'column' }}>
      <Header title="Chamados" />
      <div style={{ padding: '16px 24px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: T, letterSpacing: '-0.04em', margin: 0 }}>Chamados</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', background: S, border: `1.5px solid ${B}`, borderRadius: 9, padding: 3, gap: 2 }}>
            {[
              { key: 'list', icon: <LayoutList size={15} />, label: 'Lista' },
              { key: 'kanban', icon: <Kanban size={15} />, label: 'Kanban' },
            ].map(v => (
              <button key={v.key} onClick={() => setView(v.key as any)} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                background: view === v.key ? T : 'transparent',
                color: view === v.key ? S : T2,
                transition: 'all 0.15s',
              }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: T, color: S, fontWeight: 800, fontSize: 13, borderRadius: 10, border: 'none', cursor: 'pointer' }}
          >
            <Plus size={15} /> Novo Chamado
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '0 24px 16px' }}>
        <KanbanBoard onNewDemand={() => setShowNew(true)} />
      </div>
      {showNew && (
        <NewDemandModal
          onClose={() => setShowNew(false)}
          onSuccess={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ['demands'] }); }}
        />
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Chamados" />
      <main style={{ padding: '28px 32px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T, letterSpacing: '-0.04em', marginBottom: 4 }}>Chamados</h1>
            <p style={{ fontSize: 14, color: T2 }}>
              {pagination?.total ?? '—'} registros encontrados
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: S, border: `1.5px solid ${B}`, borderRadius: 9, padding: 3, gap: 2 }}>
              {[
                { key: 'list', icon: <LayoutList size={15} />, label: 'Lista' },
                { key: 'kanban', icon: <Kanban size={15} />, label: 'Kanban' },
              ].map(v => (
                <button key={v.key} onClick={() => setView(v.key as any)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                  borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: view === v.key ? T : 'transparent',
                  color: view === v.key ? S : T2,
                  transition: 'all 0.15s',
                }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNew(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: T, color: S, fontWeight: 800, fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} /> Novo Chamado
            </button>
          </div>
        </div>

        {/* Status tabs — list view only */}
        {view === 'list' && <>
        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, background: S, border: `1px solid ${B}`, borderRadius: 10, padding: 4, width: 'fit-content', marginBottom: 20 }}>
          {STATUSES.map(({ value, label }) => {
            const active = filters.status === value;
            return (
              <button key={value} onClick={() => set('status', value)} style={{
                padding: '7px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 700 : 500,
                background: active ? T : 'transparent',
                color: active ? S : T2,
                transition: 'all 0.15s',
              }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T3 }} />
            <input
              style={{ ...inp, width: '100%', paddingLeft: 36, boxSizing: 'border-box' }}
              placeholder="Buscar chamados..."
              value={filters.search}
              onChange={e => set('search', e.target.value)}
              onFocus={e => (e.target.style.borderColor = T)}
              onBlur={e => (e.target.style.borderColor = B)}
            />
          </div>
          <select
            style={{ ...inp, cursor: 'pointer', minWidth: 150 }}
            value={filters.priority}
            onChange={e => set('priority', e.target.value)}
            onFocus={e => (e.target.style.borderColor = T)}
            onBlur={e => (e.target.style.borderColor = B)}
          >
            <option value="">Todas prioridades</option>
            {PRIORITIES.filter(Boolean).map(p => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </select>
        </div>

        </>}

        {/* Table */}
        <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${B}` }}>
                {['CHAMADO', 'STATUS', 'PRIORIDADE', 'CATEGORIA', 'ABERTO EM', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.06em', background: '#FAFAF8' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array(6).fill(0).map((_, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${B}` }}>
                  {Array(6).fill(0).map((_, j) => (
                    <td key={j} style={{ padding: '14px 16px' }}>
                      <div style={{ height: 14, background: '#F0F0EE', borderRadius: 4, width: j === 0 ? 180 : 80 }} />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && demands.map((d: any) => (
                <tr key={d.id} style={{ borderBottom: `1px solid ${B}`, transition: 'background 0.1s', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAF8')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/demands/${d.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, background: L, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                        {CATEGORY_ICON[d.category] || '📌'}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: T, margin: '0 0 2px', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </p>
                        <p style={{ fontSize: 12, color: T3, margin: 0 }}>
                          {d.requester_name}{d.unit_identifier ? ` · Apt ${d.unit_identifier}` : ''}
                        </p>
                      </div>
                      {d.ai_triage_data && (
                        <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', gap: 3, background: AC + '20', borderRadius: 6, padding: '2px 7px', fontSize: 11, color: '#5A7A00', fontWeight: 600 }}>
                          <Zap size={10} /> IA
                        </span>
                      )}
                    </Link>
                  </td>
                  <td style={{ padding: '14px 16px' }}><StatusBadge status={d.status} /></td>
                  <td style={{ padding: '14px 16px' }}><PriorityBadge priority={d.priority} /></td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 13, color: T2 }}>
                      {CATEGORY_ICON[d.category]} {CATEGORY_LABEL[d.category]}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: T3, whiteSpace: 'nowrap' }}>{timeAgo(d.created_at)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/demands/${d.id}`}>
                      <ChevronRight size={16} color={T3} />
                    </Link>
                  </td>
                </tr>
              ))}

              {!isLoading && demands.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div style={{ textAlign: 'center', padding: '60px 32px' }}>
                      <div style={{ width: 48, height: 48, background: L, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <MessageSquare size={22} color={T3} />
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: T, marginBottom: 6 }}>Nenhum chamado encontrado</p>
                      <p style={{ fontSize: 14, color: T3, marginBottom: 20 }}>Quando moradores abrirem chamados, eles aparecerão aqui.</p>
                      <button onClick={() => setShowNew(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: T, color: S, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        <Plus size={14} /> Criar chamado
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${B}` }}>
              <p style={{ fontSize: 12, color: T3 }}>
                Página {pagination.page} de {pagination.pages} · {pagination.total} registros
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Anterior', disabled: filters.page === 1, onClick: () => setFilters(f => ({ ...f, page: f.page - 1 })) },
                  { label: 'Próxima', disabled: filters.page === pagination.pages, onClick: () => setFilters(f => ({ ...f, page: f.page + 1 })) },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled} style={{
                    padding: '7px 14px', border: `1.5px solid ${B}`, borderRadius: 8, background: S,
                    fontSize: 13, fontWeight: 600, color: btn.disabled ? T3 : T, cursor: btn.disabled ? 'default' : 'pointer',
                    opacity: btn.disabled ? 0.5 : 1,
                  }}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showNew && (
        <NewDemandModal
          onClose={() => setShowNew(false)}
          onSuccess={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ['demands'] }); }}
        />
      )}
    </div>
  );
}
