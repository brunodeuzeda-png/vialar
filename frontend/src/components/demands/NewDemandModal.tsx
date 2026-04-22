'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { X, Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

const CATEGORIES = [
  { value: 'MANUTENCAO', label: '🔧 Manutenção' },
  { value: 'LIMPEZA', label: '🧹 Limpeza' },
  { value: 'SEGURANCA', label: '🔒 Segurança' },
  { value: 'FINANCEIRO', label: '💰 Financeiro' },
  { value: 'BARULHO', label: '🔊 Barulho' },
  { value: 'INFRAESTRUTURA', label: '🏗️ Infraestrutura' },
  { value: 'ADMINISTRATIVO', label: '📋 Administrativo' },
  { value: 'OUTRO', label: '📌 Outro' },
];

const PRIORITIES = [
  { value: 'BAIXA', label: 'Baixa', color: 'text-green-600' },
  { value: 'MEDIA', label: 'Média', color: 'text-yellow-600' },
  { value: 'ALTA', label: 'Alta', color: 'text-orange-600' },
  { value: 'CRITICA', label: 'Crítica', color: 'text-red-600' },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewDemandModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'MANUTENCAO', priority: 'MEDIA',
  });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Preencha título e descrição');
      return;
    }
    setLoading(true);
    try {
      await api.post('/demands', form);
      toast.success('Chamado aberto! A IA irá fazer a triagem em instantes.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar chamado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900">Novo Chamado</h2>
            <p className="text-xs text-slate-400 mt-0.5">A IA irá classificar automaticamente</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="field">
            <label className="label">Título</label>
            <input
              className="input"
              placeholder="Ex: Vazamento na área da piscina"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="label">Descrição</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Descreva o problema com detalhes..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="label">Categoria</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Prioridade</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Spinner size="sm" className="text-white" /> : <><Plus size={16} /> Abrir Chamado</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
