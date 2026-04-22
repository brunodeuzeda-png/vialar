'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  cn, STATUS_LABEL, STATUS_COLOR, STATUS_DOT, PRIORITY_COLOR, PRIORITY_LABEL,
  CATEGORY_LABEL, CATEGORY_ICON, timeAgo
} from '@/lib/utils';
import { Plus, Search, Filter, MessageSquare, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import Header from '@/components/layout/Header';
import NewDemandModal from '@/components/demands/NewDemandModal';

const STATUSES = [
  { value: '', label: 'Todos' },
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'AGUARDANDO_ORCAMENTO', label: 'Aguard. orçamento' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const PRIORITIES = ['', 'CRITICA', 'ALTA', 'MEDIA', 'BAIXA'];

export default function DemandsPage() {
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [showNew, setShowNew] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['demands', filters],
    queryFn: () => api.get('/demands', { params: { ...filters, limit: 15 } }).then(r => r.data),
  });

  const set = (key: string, value: string) => setFilters(f => ({ ...f, [key]: value, page: 1 }));

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Chamados" />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Chamados</h1>
            <p className="page-subtitle">
              {data?.pagination?.total ?? '—'} registros encontrados
            </p>
          </div>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            <Plus size={16} /> Novo Chamado
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => set('status', value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                filters.status === value
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search + filters */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Buscar chamados..."
              value={filters.search}
              onChange={e => set('search', e.target.value)}
            />
          </div>
          <select
            className="input w-36"
            value={filters.priority}
            onChange={e => set('priority', e.target.value)}
          >
            <option value="">Prioridade</option>
            {PRIORITIES.filter(Boolean).map(p => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Chamado</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Categoria</th>
                <th>Aberto</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {isLoading && Array(8).fill(0).map((_, i) => <TableRowSkeleton key={i} cols={6} />)}

              {!isLoading && data?.data?.map((d: any) => (
                <tr key={d.id} className="group cursor-pointer" onClick={() => {}}>
                  <td>
                    <Link href={`/demands/${d.id}`} className="block">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-base flex-shrink-0">
                          {CATEGORY_ICON[d.category] || '📌'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                            {d.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {d.requester_name} {d.unit_identifier && `· Apt ${d.unit_identifier}`}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <Badge className={STATUS_COLOR[d.status]} dot={STATUS_DOT[d.status]}>
                      {STATUS_LABEL[d.status]}
                    </Badge>
                  </td>
                  <td>
                    <Badge className={PRIORITY_COLOR[d.priority]}>
                      {PRIORITY_LABEL[d.priority]}
                    </Badge>
                  </td>
                  <td>
                    <span className="text-sm text-slate-500">
                      {CATEGORY_ICON[d.category]} {CATEGORY_LABEL[d.category]}
                    </span>
                  </td>
                  <td className="text-xs text-slate-400">{timeAgo(d.created_at)}</td>
                  <td>
                    <Link href={`/demands/${d.id}`}>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </Link>
                  </td>
                </tr>
              ))}

              {!isLoading && !data?.data?.length && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<MessageSquare size={28} />}
                      title="Nenhum chamado encontrado"
                      description="Quando moradores abrirem chamados, eles aparecerão aqui."
                      action={
                        <button onClick={() => setShowNew(true)} className="btn-primary btn-sm">
                          <Plus size={14} /> Criar chamado
                        </button>
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50">
              <p className="text-xs text-slate-400">
                Página {data.pagination.page} de {data.pagination.pages} · {data.pagination.total} registros
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                  disabled={filters.page === 1}
                  className="btn-secondary btn-sm"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                  disabled={filters.page === data.pagination.pages}
                  className="btn-secondary btn-sm"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showNew && <NewDemandModal onClose={() => setShowNew(false)} onSuccess={() => { setShowNew(false); refetch(); }} />}
    </div>
  );
}
