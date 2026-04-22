'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Wifi, WifiOff, QrCode, RefreshCw } from 'lucide-react';
import Image from 'next/image';

export default function WhatsAppSettingsPage() {
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['wa-status'],
    queryFn: () => api.get('/whatsapp/status').then((r) => r.data),
    refetchInterval: 5000,
  });

  const connect = useMutation({
    mutationFn: () => api.post('/whatsapp/connect').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-status'] }),
    onError: () => toast.error('Erro ao iniciar conexão'),
  });

  const disconnect = useMutation({
    mutationFn: () => api.post('/whatsapp/disconnect'),
    onSuccess: () => {
      toast.success('WhatsApp desconectado');
      qc.invalidateQueries({ queryKey: ['wa-status'] });
    },
  });

  const isConnected = status?.status === 'CONNECTED';
  const hasQR = status?.has_pending_qr && status?.qr;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-gray-500 text-sm">Conecte o WhatsApp do condomínio para receber e enviar mensagens</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
            {isConnected
              ? <Wifi size={24} className="text-green-600" />
              : <WifiOff size={24} className="text-gray-400" />
            }
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {isConnected ? 'Conectado' : status?.status === 'QR_PENDING' ? 'Aguardando QR Code' : 'Desconectado'}
            </p>
            {status?.phone_number && (
              <p className="text-sm text-gray-500">+{status.phone_number}</p>
            )}
          </div>
        </div>

        {hasQR && (
          <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <QrCode size={24} className="text-gray-500" />
            <p className="text-sm text-gray-600 text-center">
              Abra o WhatsApp no celular → Dispositivos Conectados → Conectar um dispositivo
            </p>
            <div className="border-4 border-white rounded-xl shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={status.qr} alt="QR Code WhatsApp" className="w-48 h-48" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <RefreshCw size={12} className="animate-spin" />
              Atualizando automaticamente...
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          {!isConnected && (
            <button
              onClick={() => connect.mutate()}
              disabled={connect.isPending}
              className="btn-primary"
            >
              {connect.isPending ? 'Conectando...' : 'Conectar WhatsApp'}
            </button>
          )}
          {isConnected && (
            <button
              onClick={() => disconnect.mutate()}
              className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>

      <div className="card p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Como funciona</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Moradores enviam mensagens para o número conectado</li>
          <li>• A IA analisa e cria chamados automaticamente</li>
          <li>• O síndico é notificado sobre demandas críticas</li>
          <li>• Moradores recebem confirmação automática</li>
        </ul>
      </div>
    </div>
  );
}
