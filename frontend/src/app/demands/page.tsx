'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { cn, DEMAND_STATUS_LABELS, DEMAND_STATUS_COLORS, PRIORITY_COLORS, formatDateTime, timeAgo } from '@/lib/utils';
import { Plus, Search, Filter } from 'lucide-react';

const STATUSES = ['', 'ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_ORCAMENTO', 'CONCLUIDA', 'CANCELADA'];
const PRIORITIES = ['', 'CRITICA', 'ALTA', 'MEDIA', 'BAIXA'];
const CATEGORIES = ['', 'MANUTENCAO', 'LIMPEZA', 'SEGURANCA', 'FINANCEIRO', 'BARULHO', 'INFRAESTRUTURA', 'ADMINISTRATIVO', 'OUTRO'];

export default function DemandsPage() {
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['demands', filters],
    queryFn: () => api.get('/demands', { params: filters }).then((r) => r.data),
  });

  function setFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="text-gray-500 text-sm">{data?.pagination?.total ?? '—'} registros</p>
        </div>
        <Link href="/demands/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Chamado
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar chamados..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <select className="input w-40" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? DEMAND_STATUS_LABELS[s] : 'Todos os status'}</option>)}
        </select>
        <select className="input w-36" value={filters.priority} onChange={(e) => setFilter('priority', e.target.value)}>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p || 'Prioridade'}</option>)}
        </select>
        <select className="input w-40" value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'Categoria'}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Chamado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Prioridade</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Origem</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            )}
            {data?.data?.map((demand: any) => (
              <tr key={demand.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/demands/${demand.id}`} className="hover:text-primary-600">
                    <p className="font-medium text-gray-900">{demand.title}</p>
                    <p className="text-xs text-gray-500">{demand.requester_name} · {demand.unit_identifier}</p>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', DEMAND_STATUS_COLORS[demand.status])}>
                    {DEMAND_STATUS_LABELS[demand.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', PRIORITY_COLORS[demand.priority])}>
                    {demand.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{demand.origin}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(demand.created_at)}</td>
              </tr>
            ))}
            {!isLoading && !data?.data?.length && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum chamado encontrado</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {data.pagination.page} de {data.pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                disabled={filters.page === 1}
                className="btn-secondary px-3 py-1 text-sm"
              >
                Anterior
              </button>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                disabled={filters.page === data.pagination.pages}
                className="btn-secondary px-3 py-1 text-sm"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
