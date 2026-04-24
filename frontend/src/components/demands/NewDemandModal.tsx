'use client';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { X, Plus, Loader2, Building2 } from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';

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
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewDemandModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'MANUTENCAO', priority: 'MEDIA', condominium_id: '',
  });
  const [loading, setLoading] = useState(false);

  const { data: condos = [] } = useQuery<any[]>({
    queryKey: ['condominiums', 'active'],
    queryFn: () => api.get('/condominiums', { params: { active: 'true' } }).then(r => r.data),
    staleTime: 60_000,
  });

  // Auto-fill when only one active condo (useEffect replaces deprecated onSuccess)
  useEffect(() => {
    if (condos.length === 1 && !form.condominium_id) {
      setForm(f => ({ ...f, condominium_id: condos[0].id }));
    }
  }, [condos]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', background: S,
    border: `1.5px solid ${B}`, borderRadius: 8, fontSize: 14,
    color: T, outline: 'none', fontFamily: 'inherit',
    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Preencha título e descrição');
      return;
    }
    if (!form.condominium_id) {
      toast.error('Selecione o condomínio');
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

  const selectedCondo = condos.find((c: any) => c.id === form.condominium_id);

  return (
    <div className="modal-overlay-resp" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="modal-resp" style={{ position: 'relative', background: S, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: 520 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${B}` }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: T, margin: 0 }}>Novo Chamado</h2>
            <p style={{ fontSize: 12, color: T3, margin: '2px 0 0' }}>A IA irá classificar automaticamente</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: T3, display: 'flex', alignItems: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Condomínio: selector if multiple, read-only pill if single */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>CONDOMÍNIO</label>
            {condos.length > 1 ? (
              <select
                style={{ ...inp, cursor: 'pointer' }}
                value={form.condominium_id}
                onChange={e => set('condominium_id', e.target.value)}
                onFocus={e => (e.target.style.borderColor = T)}
                onBlur={e => (e.target.style.borderColor = B)}
                required
              >
                <option value="">Selecione o condomínio...</option>
                {condos.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : condos.length === 1 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', background: L, border: `1.5px solid ${B}`, borderRadius: 8 }}>
                <Building2 size={15} color={T3} />
                <span style={{ fontSize: 14, fontWeight: 600, color: T }}>{condos[0].name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#16A34A', fontWeight: 600, background: '#F0FDF4', padding: '2px 8px', borderRadius: 99 }}>Ativo</span>
              </div>
            ) : (
              <div style={{ padding: '10px 13px', background: '#FEF2F2', border: `1.5px solid #FECACA`, borderRadius: 8, fontSize: 13, color: '#DC2626' }}>
                Nenhum condomínio ativo encontrado. Cadastre um condomínio primeiro.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>TÍTULO</label>
            <input
              style={inp}
              placeholder="Ex: Vazamento na área da piscina"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              onFocus={e => (e.target.style.borderColor = T)}
              onBlur={e => (e.target.style.borderColor = B)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>DESCRIÇÃO</label>
            <textarea
              style={{ ...inp, minHeight: 100, resize: 'none' }}
              placeholder="Descreva o problema com detalhes..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              onFocus={e => (e.target.style.borderColor = T)}
              onBlur={e => (e.target.style.borderColor = B)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>CATEGORIA</label>
              <select
                style={{ ...inp, cursor: 'pointer' }}
                value={form.category}
                onChange={e => set('category', e.target.value)}
                onFocus={e => (e.target.style.borderColor = T)}
                onBlur={e => (e.target.style.borderColor = B)}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>PRIORIDADE</label>
              <select
                style={{ ...inp, cursor: 'pointer' }}
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                onFocus={e => (e.target.style.borderColor = T)}
                onBlur={e => (e.target.style.borderColor = B)}
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '11px 0', background: L, border: `1.5px solid ${B}`, borderRadius: 9, fontSize: 14, fontWeight: 700, color: T2, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || condos.length === 0}
              style={{ flex: 1, padding: '11px 0', background: T, border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 800, color: S, cursor: (loading || condos.length === 0) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: (loading || condos.length === 0) ? 0.5 : 1 }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <><Plus size={15} /> Abrir Chamado</>}
            </button>
          </div>
        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
