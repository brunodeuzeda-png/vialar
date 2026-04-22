'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, ShieldAlert, Banknote, Bot } from 'lucide-react';

export default function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: () => api.get('/dashboard/overview').then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => api.get('/dashboard/alerts').then((r) => r.data),
    refetchInterval: 60000,
  });

  const { data: digest } = useQuery({
    queryKey: ['ai-digest'],
    queryFn: () => api.get('/dashboard/ai-digest').then((r) => r.data),
    staleTime: 1000 * 60 * 60,
  });

  const demands = overview?.demands;
  const compliance = overview?.compliance;
  const financial = overview?.financial;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">Visão geral do condomínio</p>
      </div>

      {/* AI Digest */}
      {digest?.summary && (
        <div className="card p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
          <div className="flex items-start gap-3">
            <Bot className="text-primary-600 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-primary-900">{digest.greeting}</p>
              <p className="text-sm text-primary-700 mt-1">{digest.summary}</p>
              {digest.top_actions?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {digest.top_actions.map((action: any, i: number) => (
                    <p key={i} className="text-xs text-primary-600">
                      {i + 1}. {action.action}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Chamados Abertos"
          value={demands?.open ?? '—'}
          icon={<Clock size={20} className="text-blue-600" />}
          color="blue"
          sub={`${demands?.created_today ?? 0} novos hoje`}
        />
        <KpiCard
          label="Chamados Críticos"
          value={demands?.critica ?? '—'}
          icon={<AlertTriangle size={20} className="text-red-600" />}
          color="red"
          sub={`${demands?.alta ?? 0} de alta prioridade`}
        />
        <KpiCard
          label="Compliance Urgente"
          value={compliance?.urgent ?? '—'}
          icon={<ShieldAlert size={20} className="text-orange-600" />}
          color="orange"
          sub={`${compliance?.this_month ?? 0} vencem em 30 dias`}
        />
        <KpiCard
          label="Saldo do Mês"
          value={financial?.saldo !== undefined ? formatCurrency(financial.saldo) : '—'}
          icon={<Banknote size={20} className="text-green-600" />}
          color="green"
          sub={`Receitas: ${financial?.receitas !== undefined ? formatCurrency(financial.receitas) : '—'}`}
        />
      </div>

      {/* Alerts */}
      {alerts?.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">Alertas ativos</h2>
          {alerts.map((alert: any, i: number) => (
            <AlertBanner key={i} alert={alert} />
          ))}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <h3 className="font-medium text-gray-700 mb-3">Por status</h3>
          <div className="space-y-2">
            {[
              { label: 'Aberta', value: demands?.aberta, color: 'bg-blue-500' },
              { label: 'Em andamento', value: demands?.em_andamento, color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-sm text-gray-600 flex-1">{item.label}</span>
                <span className="text-sm font-semibold">{item.value ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-medium text-gray-700 mb-3">Resolvidos</h3>
          <div className="flex items-center gap-3">
            <CheckCircle2 size={32} className="text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{demands?.resolved_week ?? 0}</p>
              <p className="text-xs text-gray-500">últimos 7 dias</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-medium text-gray-700 mb-3">Tempo médio</h3>
          <div className="flex items-center gap-3">
            <TrendingUp size={32} className="text-primary-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {demands?.avg_resolution_hours ? `${Math.round(demands.avg_resolution_hours)}h` : '—'}
              </p>
              <p className="text-xs text-gray-500">resolução média</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color, sub }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50',
    red: 'bg-red-50',
    orange: 'bg-orange-50',
    green: 'bg-green-50',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function AlertBanner({ alert }: { alert: any }) {
  const severityClass = alert.severity === 'high'
    ? 'border-red-200 bg-red-50'
    : 'border-yellow-200 bg-yellow-50';

  const titles: Record<string, string> = {
    DEMAND_CRITICAL: 'Chamados críticos pendentes',
    COMPLIANCE_URGENT: 'Obrigações vencendo em 7 dias',
    DEMAND_STALE: 'Chamados sem atualização há 3+ dias',
  };

  return (
    <div className={`card p-4 border ${severityClass}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className={alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'} />
        <div>
          <p className="font-medium text-gray-900">{titles[alert.type] || alert.type}</p>
          <ul className="mt-1 space-y-0.5">
            {alert.items.slice(0, 3).map((item: any) => (
              <li key={item.id} className="text-sm text-gray-600">
                • {item.title || item.name}
                {item.days_left !== undefined && ` — ${item.days_left} dias`}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
