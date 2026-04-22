'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn, complianceDaysColor, formatDate } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';

const STATUS_FILTERS = [
  { value: '', label: 'Todas' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'EM_DIA', label: 'Em dia' },
  { value: 'VENCIDA', label: 'Vencidas' },
];

const CATEGORIES: Record<string, { label: string; color: string }> = {
  SEGURANCA_INCENDIO: { label: 'Incêndio', color: 'bg-red-100 text-red-700' },
  ESTRUTURA: { label: 'Estrutura', color: 'bg-orange-100 text-orange-700' },
  ELETRICA: { label: 'Elétrica', color: 'bg-yellow-100 text-yellow-700' },
  ELEVADORES: { label: 'Elevadores', color: 'bg-blue-100 text-blue-700' },
  HIDRAULICA: { label: 'Hidráulica', color: 'bg-cyan-100 text-cyan-700' },
  GAS: { label: 'Gás', color: 'bg-purple-100 text-purple-700' },
  SERVICOS: { label: 'Serviços', color: 'bg-green-100 text-green-700' },
  LEGAL: { label: 'Legal', color: 'bg-slate-100 text-slate-700' },
  TRABALHISTA: { label: 'Trabalhista', color: 'bg-indigo-100 text-indigo-700' },
  SEGURANCA_PATRIMONIAL: { label: 'Patrimonial', color: 'bg-violet-100 text-violet-700' },
};

export default function CompliancePage() {
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['compliance', filter],
    queryFn: () => api.get('/compliance/obligations', { params: filter ? { status: filter } : {} }).then(r => r.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: () => api.get('/compliance/alerts').then(r => r.data),
  });

  const complete = useMutation({
    mutationFn: (id: string) => api.post(`/compliance/records/${id}/complete`, {
      completed_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => {
      toast.success('Obrigação marcada como cumprida! Próxima data calculada automaticamente.');
      qc.invalidateQueries({ queryKey: ['compliance'] });
      qc.invalidateQueries({ queryKey: ['compliance-alerts'] });
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const urgentCount = alerts?.filter((a: any) => a.days_until_due <= 7).length || 0;
  const month30Count = alerts?.filter((a: any) => a.days_until_due <= 30 && a.days_until_due > 7).length || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Compliance Regulatório" />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Compliance</h1>
            <p className="page-subtitle">Obrigações legais e renovações periódicas</p>
          </div>
          {urgentCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-xl border border-red-200 text-sm font-medium">
              <AlertTriangle size={15} />
              {urgentCount} vence{urgentCount > 1 ? 'm' : ''} em 7 dias
            </div>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{urgentCount}</p>
              <p className="text-xs text-slate-400">Vencem em 7 dias</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Clock size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{month30Count}</p>
              <p className="text-xs text-slate-400">Vencem em 30 dias</p>
            </div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">
                {data?.data?.filter((r: any) => r.status === 'EM_DIA').length ?? 0}
              </p>
              <p className="text-xs text-slate-400">Em dia</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-5">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {isLoading && Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-4">
              <Skeleton className="h-4 w-64 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}

          {!isLoading && !data?.data?.length && (
            <EmptyState
              icon={<ShieldCheck size={28} />}
              title="Nenhuma obrigação encontrada"
              description="Use o botão Inicializar para carregar as obrigações padrão."
            />
          )}

          {data?.data?.map((record: any) => {
            const cat = CATEGORIES[record.category] || { label: record.category, color: 'bg-slate-100 text-slate-600' };
            const isDue = record.status === 'EM_DIA';
            const isOverdue = record.status === 'VENCIDA';

            return (
              <div
                key={record.id}
                className={cn(
                  'card p-4 flex items-center gap-4 transition-all',
                  isOverdue && 'border-red-100 bg-red-50/30',
                  isDue && 'border-emerald-100'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  isDue ? 'bg-emerald-50' : isOverdue ? 'bg-red-50' : 'bg-slate-50'
                )}>
                  {isDue
                    ? <CheckCircle2 size={18} className="text-emerald-600" />
                    : isOverdue
                      ? <AlertTriangle size={18} className="text-red-600" />
                      : <ShieldCheck size={18} className="text-slate-400" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-900 text-sm">{record.name}</p>
                    <span className="text-xs font-mono text-slate-400">{record.code}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', cat.color)}>{cat.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={11} /> {formatDate(record.due_date)}
                    </span>
                    <span className="text-xs text-slate-400">{record.frequency}</span>
                    {record.legal_basis && (
                      <span className="text-xs text-slate-400 truncate max-w-48">{record.legal_basis}</span>
                    )}
                  </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {record.days_until_due != null && (
                    <Badge className={complianceDaysColor(record.days_until_due)}>
                      {record.days_until_due >= 0 ? `${record.days_until_due}d` : `${Math.abs(record.days_until_due)}d atraso`}
                    </Badge>
                  )}
                  {record.status === 'PENDENTE' && (
                    <button
                      onClick={() => complete.mutate(record.id)}
                      disabled={complete.isPending}
                      className="btn-primary btn-sm"
                    >
                      Concluir
                    </button>
                  )}
                  {isDue && (
                    <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">Em dia</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
