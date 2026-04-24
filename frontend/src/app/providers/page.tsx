'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatBRPhone } from '@/lib/phone';
import { cn } from '@/lib/utils';
import { Plus, Search, Star, Phone, Mail, Wrench } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import Header from '@/components/layout/Header';

export default function ProvidersPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['providers', search],
    queryFn: () => api.get('/providers', { params: { search, limit: 24 } }).then(r => r.data),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Prestadores" />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Prestadores</h1>
            <p className="page-subtitle">{data?.pagination?.total ?? '—'} fornecedores cadastrados</p>
          </div>
          <button className="btn-primary">
            <Plus size={16} /> Novo Prestador
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Buscar prestadores..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </div>
          ))}

          {!isLoading && !data?.data?.length && (
            <div className="col-span-3">
              <EmptyState
                icon={<Wrench size={28} />}
                title="Nenhum prestador cadastrado"
                description="Cadastre fornecedores para vinculá-los aos chamados."
                action={<button className="btn-primary btn-sm"><Plus size={14} /> Cadastrar</button>}
              />
            </div>
          )}

          {data?.data?.map((p: any) => (
            <div key={p.id} className="card-hover p-5 cursor-pointer">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center text-xl font-bold text-indigo-600 flex-shrink-0">
                  {p.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-500">
                      {p.rating_avg > 0 ? Number(p.rating_avg).toFixed(1) : '—'} ({p.rating_count})
                    </span>
                  </div>
                </div>
              </div>

              {p.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.specialties.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg">{s}</span>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 border-t border-slate-50 pt-3">
                {p.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={11} /> {formatBRPhone(p.phone)}
                  </div>
                )}
                {p.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail size={11} /> {p.email}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
