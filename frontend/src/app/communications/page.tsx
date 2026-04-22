'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { MessageCircle, ArrowUpRight, ArrowDownLeft, Wifi, WifiOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import Header from '@/components/layout/Header';
import Link from 'next/link';

export default function CommunicationsPage() {
  const { data: status } = useQuery({
    queryKey: ['wa-status'],
    queryFn: () => api.get('/whatsapp/status').then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['wa-messages'],
    queryFn: () => api.get('/whatsapp/messages', { params: { limit: 30 } }).then(r => r.data),
  });

  const isConnected = status?.status === 'CONNECTED';

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="WhatsApp" />
      <main className="flex-1 p-6 animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Comunicações</h1>
            <p className="page-subtitle">Mensagens via WhatsApp do condomínio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${
              isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? `Conectado · ${status?.phone_number}` : 'Desconectado'}
            </div>
            <Link href="/settings/whatsapp" className="btn-secondary btn-sm">
              Configurar
            </Link>
          </div>
        </div>

        {!isConnected && (
          <div className="card p-5 border-amber-100 bg-amber-50/50 mb-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <WifiOff size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-amber-900">WhatsApp não conectado</p>
              <p className="text-sm text-amber-700">Conecte o WhatsApp para receber chamados automaticamente via mensagem.</p>
            </div>
            <Link href="/settings/whatsapp" className="btn-primary btn-sm">Conectar agora</Link>
          </div>
        )}

        {/* Messages */}
        <div className="table-container">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Histórico de mensagens</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Direção</th>
                <th>Número</th>
                <th>Mensagem</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array(5).fill(0).map((_, i) => (
                <tr key={i}>
                  {Array(5).fill(0).map((_, j) => (
                    <td key={j}><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))}

              {!isLoading && !messages?.data?.length && (
                <tr><td colSpan={5}>
                  <EmptyState
                    icon={<MessageCircle size={28} />}
                    title="Nenhuma mensagem ainda"
                    description="As mensagens recebidas via WhatsApp aparecerão aqui."
                  />
                </td></tr>
              )}

              {messages?.data?.map((m: any) => (
                <tr key={m.id}>
                  <td>
                    <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${
                      m.direction === 'INBOUND'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      {m.direction === 'INBOUND'
                        ? <ArrowDownLeft size={11} />
                        : <ArrowUpRight size={11} />
                      }
                      {m.direction === 'INBOUND' ? 'Recebida' : 'Enviada'}
                    </div>
                  </td>
                  <td className="text-sm text-slate-600 font-mono">
                    {m.direction === 'INBOUND' ? m.from_number : m.to_number}
                  </td>
                  <td className="max-w-xs">
                    <p className="text-sm text-slate-700 line-clamp-2">{m.content}</p>
                  </td>
                  <td className="text-xs text-slate-400">{formatDateTime(m.created_at)}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      m.is_processed
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-50 text-slate-500'
                    }`}>
                      {m.is_processed ? 'Processada' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
