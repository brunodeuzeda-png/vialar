'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn, COMPLIANCE_COLORS, formatDate } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CompliancePage() {
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['compliance', filter],
    queryFn: () => api.get('/compliance/obligations', { params: filter ? { status: filter } : {} }).then((r) => r.data),
  });

  const { data: alerts } = useQuery({
    queryKey: ['compliance-alerts'],
    queryFn: () => api.get('/compliance/alerts').then((r) => r.data),
  });

  const complete = useMutation({
    mutationFn: (recordId: string) =>
      api.post(`/compliance/records/${recordId}/complete`, { completed_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => {
      toast.success('Obrigação marcada como cumprida');
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
    onError: () => toast.error('Erro ao atualizar'),
  });

  const urgentCount = alerts?.filter((a: any) => a.days_until_due <= 7).length || 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Regulatório</h1>
          <p className="text-gray-500 text-sm">Obrigações legais e renovações periódicas</p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-200">
            <ShieldAlert size={16} />
            <span className="text-sm font-medium">{urgentCount} vencem em 7 dias</span>
          </div>
        )}
      </div>

      {/* Alertas urgentes */}
      {alerts && alerts.length > 0 && (
        <div className="card p-4 space-y-2 border-orange-200 bg-orange-50">
          <h3 className="font-medium text-orange-900 flex items-center gap-2">
            <ShieldAlert size={16} /> Próximos vencimentos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {alerts.slice(0, 6).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-orange-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.category}</p>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-xs font-bold', COMPLIANCE_COLORS(a.days_until_due))}>
                  {a.days_until_due}d
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {['', 'PENDENTE', 'EM_DIA', 'VENCIDA'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors', filter === s
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            {s || 'Todas'}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {data?.data?.map((record: any) => (
          <div key={record.id} className="card p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={cn('p-2 rounded-lg', record.status === 'EM_DIA' ? 'bg-green-50' : 'bg-gray-50')}>
                {record.status === 'EM_DIA'
                  ? <CheckCircle size={18} className="text-green-600" />
                  : <ShieldCheck size={18} className="text-gray-500" />
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">{record.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{record.code}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{record.category}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{record.legal_basis}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} /> Vence: {formatDate(record.due_date)}
                  </span>
                  {record.frequency && (
                    <span className="text-xs text-gray-400">Freq: {record.frequency}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', COMPLIANCE_COLORS(record.days_until_due ?? 999))}>
                {record.days_until_due != null ? `${record.days_until_due}d` : '—'}
              </span>
              {record.status === 'PENDENTE' && (
                <button
                  onClick={() => complete.mutate(record.id)}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  Concluir
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
