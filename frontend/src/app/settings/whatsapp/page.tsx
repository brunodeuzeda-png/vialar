'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw, Shield, MessageCircle, Zap } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import Header from '@/components/layout/Header';

export default function WhatsAppSettingsPage() {
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['wa-status'],
    queryFn: () => api.get('/whatsapp/status').then(r => r.data),
    refetchInterval: 5000,
  });

  const connect = useMutation({
    mutationFn: () => api.post('/whatsapp/connect').then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-status'] }),
    onError: () => toast.error('Erro ao iniciar conexão'),
  });

  const disconnect = useMutation({
    mutationFn: () => api.post('/whatsapp/disconnect'),
    onSuccess: () => {
      toast.success('Desconectado');
      qc.invalidateQueries({ queryKey: ['wa-status'] });
    },
  });

  const isConnected = status?.status === 'CONNECTED';
  const isQRPending = status?.status === 'QR_PENDING' || status?.has_pending_qr;
  const qrData = status?.qr || (connect.data?.status === 'QR_PENDING' ? connect.data?.qr : null);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Configurações do WhatsApp" />
      <main className="flex-1 p-6 animate-fade-in max-w-2xl">
        <div className="mb-6">
          <h1 className="page-title">WhatsApp</h1>
          <p className="page-subtitle">Conecte o número do condomínio para receber chamados automaticamente</p>
        </div>

        {/* Status card */}
        <div className="card p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isConnected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
              {isConnected
                ? <Wifi size={26} className="text-emerald-600" />
                : <WifiOff size={26} className="text-slate-400" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900 text-lg">
                  {isConnected ? 'Conectado' : isQRPending ? 'Aguardando escaneamento' : 'Desconectado'}
                </p>
                {isConnected && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
              </div>
              {status?.phone_number && (
                <p className="text-slate-500 text-sm">+{status.phone_number}</p>
              )}
            </div>
          </div>

          {/* QR Code */}
          {qrData && (
            <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 mb-5">
              <p className="text-sm font-medium text-slate-700">Escaneie o QR Code com o WhatsApp</p>
              <p className="text-xs text-slate-400 text-center">
                Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo
              </p>
              <div className="p-3 bg-white rounded-2xl shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrData} alt="QR Code" className="w-52 h-52" />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <RefreshCw size={12} className="animate-spin" />
                Atualizando automaticamente...
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {!isConnected && (
              <button
                onClick={() => connect.mutate()}
                disabled={connect.isPending}
                className="btn-primary"
              >
                {connect.isPending ? <Spinner size="sm" className="text-white" /> : 'Conectar WhatsApp'}
              </button>
            )}
            {isConnected && (
              <button
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
                className="btn-secondary text-red-600 hover:bg-red-50 border-red-200"
              >
                Desconectar
              </button>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Como funciona</h3>
          <div className="space-y-3">
            {[
              { icon: MessageCircle, color: 'bg-blue-50 text-blue-600', title: 'Moradores enviam mensagens', desc: 'Para o número conectado, a qualquer hora' },
              { icon: Zap, color: 'bg-violet-50 text-violet-600', title: 'IA classifica automaticamente', desc: 'Claude identifica se é chamado, categoria e prioridade' },
              { icon: Shield, color: 'bg-emerald-50 text-emerald-600', title: 'Chamado criado + síndico notificado', desc: 'Morador recebe protocolo, síndico é alertado se urgente' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{title}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
