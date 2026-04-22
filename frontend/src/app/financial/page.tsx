'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { Plus, TrendingUp, TrendingDown, DollarSign, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function FinancialPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const qc = useQueryClient();

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ['financial-report', year, month],
    queryFn: () => api.get('/financial/reports/monthly', { params: { year, month } }).then(r => r.data),
  });

  const { data: entries, isLoading: loadingEntries } = useQuery({
    queryKey: ['financial-entries', year, month],
    queryFn: () => api.get('/financial/entries', {
      params: {
        start: `${year}-${String(month).padStart(2, '0')}-01`,
        end: `${year}-${String(month).padStart(2, '0')}-31`,
        limit: 20,
      }
    }).then(r => r.data),
  });

  const pay = useMutation({
    mutationFn: (id: string) => api.patch(`/financial/entries/${id}/pay`),
    onSuccess: () => {
      toast.success('Lançamento marcado como pago');
      qc.invalidateQueries({ queryKey: ['financial-report'] });
      qc.invalidateQueries({ queryKey: ['financial-entries'] });
    },
  });

  // Chart data
  const chartData = [
    ...(report?.receitas?.map((r: any) => ({ name: r.category || 'Receita', value: Number(r.total), type: 'receita' })) || []),
    ...(report?.despesas?.map((d: any) => ({ name: d.category || 'Despesa', value: Number(d.total), type: 'despesa' })) || []),
  ].slice(0, 8);

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Financeiro" />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Financeiro</h1>
            <p className="page-subtitle">Receitas e despesas do condomínio</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="input w-28"
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
            >
              {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select className="input w-24" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-primary"><Plus size={16} /> Lançamento</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {loadingReport ? Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />) : (
            <>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-500">Receitas</p>
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <TrendingUp size={16} className="text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(report?.totalReceita ?? 0)}</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-500">Despesas</p>
                  <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                    <TrendingDown size={16} className="text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(report?.totalDespesa ?? 0)}</p>
              </div>
              <div className={cn('card p-5', (report?.saldo ?? 0) >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100')}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-500">Saldo</p>
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
                    <DollarSign size={16} className={(report?.saldo ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'} />
                  </div>
                </div>
                <p className={cn('text-2xl font-bold', (report?.saldo ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                  {formatCurrency(report?.saldo ?? 0)}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Chart */}
          <div className="lg:col-span-2 card p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Por categoria</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v: any) => formatCurrency(v)}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.type === 'receita' ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<DollarSign size={24} />} title="Sem dados" description="Nenhum lançamento neste período" />
            )}
          </div>

          {/* Entries */}
          <div className="lg:col-span-3 table-container">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Lançamentos</h3>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {!loadingEntries && !entries?.data?.length && (
                  <tr><td colSpan={5}>
                    <EmptyState icon={<DollarSign size={24} />} title="Sem lançamentos" description="Nenhum lançamento neste período" />
                  </td></tr>
                )}
                {entries?.data?.map((e: any) => (
                  <tr key={e.id}>
                    <td>
                      <p className="font-medium text-slate-900 text-sm">{e.description}</p>
                      <p className="text-xs text-slate-400">{formatDate(e.competence_date)}</p>
                    </td>
                    <td>
                      <Badge className={e.type === 'RECEITA' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}>
                        {e.type === 'RECEITA' ? 'Receita' : 'Despesa'}
                      </Badge>
                    </td>
                    <td>
                      <span className={cn('font-semibold text-sm', e.type === 'RECEITA' ? 'text-emerald-700' : 'text-red-700')}>
                        {e.type === 'DESPESA' ? '−' : '+'}{formatCurrency(e.amount)}
                      </span>
                    </td>
                    <td>
                      {e.is_paid
                        ? <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"><CheckCircle size={11} className="mr-1" />Pago</Badge>
                        : <Badge className="bg-amber-50 text-amber-700 ring-1 ring-amber-200">Pendente</Badge>
                      }
                    </td>
                    <td>
                      {!e.is_paid && (
                        <button
                          onClick={() => pay.mutate(e.id)}
                          className="btn-ghost btn-sm text-indigo-600"
                        >
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
