'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import {
  Building2, Plus, MapPin, Users, MessageSquare,
  CheckCircle2, XCircle, ArrowRight, X, Phone
} from 'lucide-react';

const L = '#F8F8F4';
const S = '#FFFFFF';
const B = '#E8E8E0';
const T = '#0A0A0A';
const T2 = '#666';
const T3 = '#999';
const AC = '#BBFF00';

interface Condo {
  id: string;
  name: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  total_units: number;
  whatsapp_number: string;
  is_active: boolean;
  open_demands: number;
  total_users: number;
  created_at: string;
}

const emptyForm = {
  name: '', cnpj: '', address: '', city: '', state: '', zip_code: '',
  total_units: '', whatsapp_number: '',
};

export default function CondominiumsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCondo, setEditCondo] = useState<Condo | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: condos = [], isLoading } = useQuery<Condo[]>({
    queryKey: ['condominiums'],
    queryFn: () => api.get('/condominiums').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => api.post('/condominiums', data),
    onSuccess: () => {
      toast.success('Condomínio cadastrado com sucesso!');
      qc.invalidateQueries({ queryKey: ['condominiums'] });
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao cadastrar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptyForm }) =>
      api.patch(`/condominiums/${id}`, data),
    onSuccess: () => {
      toast.success('Condomínio atualizado!');
      qc.invalidateQueries({ queryKey: ['condominiums'] });
      closeModal();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao atualizar'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/condominiums/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['condominiums'] }),
  });

  function openCreate() {
    setEditCondo(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(c: Condo) {
    setEditCondo(c);
    setForm({
      name: c.name || '', cnpj: c.cnpj || '', address: c.address || '',
      city: c.city || '', state: c.state || '', zip_code: '',
      total_units: String(c.total_units || ''), whatsapp_number: c.whatsapp_number || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditCondo(null);
    setForm(emptyForm);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editCondo) {
      updateMutation.mutate({ id: editCondo.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  }

  function set(k: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));
  }

  const formatCnpj = (v: string) =>
    v.replace(/\D/g, '').slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');

  const active = condos.filter(c => c.is_active);
  const inactive = condos.filter(c => !c.is_active);
  const pending = createMutation.isPending || updateMutation.isPending;

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: '#fff', border: `1.5px solid ${B}`,
    borderRadius: 9, fontSize: 15, color: T,
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: L }}>
      <Header title="Condomínios" />

      <main style={{ flex: 1, padding: '28px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T, letterSpacing: '-0.04em', marginBottom: 6 }}>
              Condomínios
            </h1>
            <p style={{ fontSize: 14, color: T2 }}>
              {active.length} ativo{active.length !== 1 ? 's' : ''} · gerencie os condomínios clientes da sua administradora
            </p>
          </div>
          <button onClick={openCreate} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', background: T, color: '#fff',
            fontWeight: 800, fontSize: 14, borderRadius: 10, border: 'none',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}>
            <Plus size={16} /> Cadastrar condomínio
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total de condomínios', value: condos.length, accent: T },
            { label: 'Ativos', value: active.length, accent: '#22C55E' },
            { label: 'Chamados em aberto', value: active.reduce((s, c) => s + Number(c.open_demands || 0), 0), accent: '#F59E0B' },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ background: S, border: `1px solid ${B}`, borderRadius: 12, padding: '18px 22px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: accent, letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* List */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: 24, height: 180 }} />
            ))}
          </div>
        ) : condos.length === 0 ? (
          <div style={{
            background: S, border: `1.5px dashed ${B}`, borderRadius: 16,
            padding: '64px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 56, height: 56, background: AC + '20',
              borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Building2 size={26} color={T} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: T, letterSpacing: '-0.03em', marginBottom: 8 }}>
              Nenhum condomínio cadastrado
            </h3>
            <p style={{ fontSize: 14, color: T2, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Comece cadastrando o primeiro condomínio cliente da sua administradora.
            </p>
            <button onClick={openCreate} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: T, color: '#fff',
              fontWeight: 800, fontSize: 15, borderRadius: 10, border: 'none', cursor: 'pointer',
            }}>
              <Plus size={16} /> Cadastrar primeiro condomínio
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
                  ATIVOS — {active.length}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {active.map(c => <CondoCard key={c.id} condo={c} onEdit={openEdit} onToggle={(id) => toggleMutation.mutate({ id, is_active: false })} />)}
                </div>
              </div>
            )}
            {inactive.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
                  INATIVOS — {inactive.length}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, opacity: 0.6 }}>
                  {inactive.map(c => <CondoCard key={c.id} condo={c} onEdit={openEdit} onToggle={(id) => toggleMutation.mutate({ id, is_active: true })} inactive />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '32px 36px',
            width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: T, letterSpacing: '-0.03em' }}>
                  {editCondo ? 'Editar condomínio' : 'Cadastrar condomínio'}
                </h2>
                <p style={{ fontSize: 13, color: T2, marginTop: 4 }}>
                  {editCondo ? 'Atualize os dados do condomínio' : 'Preencha os dados do novo condomínio cliente'}
                </p>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, padding: 6, borderRadius: 8, display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Row label="Nome do condomínio *">
                <input style={inputStyle} placeholder="Ex: Condomínio Parque das Flores" value={form.name}
                  onChange={set('name')} required
                  onFocus={e => (e.target.style.borderColor = AC)}
                  onBlur={e => (e.target.style.borderColor = B)} />
              </Row>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Row label="CNPJ">
                  <input style={inputStyle} placeholder="00.000.000/0001-00"
                    value={form.cnpj}
                    onChange={e => setForm(f => ({ ...f, cnpj: formatCnpj(e.target.value) }))}
                    onFocus={e => (e.target.style.borderColor = AC)}
                    onBlur={e => (e.target.style.borderColor = B)} />
                </Row>
                <Row label="Total de unidades">
                  <input style={inputStyle} type="number" min="0" placeholder="Ex: 120" value={form.total_units}
                    onChange={set('total_units')}
                    onFocus={e => (e.target.style.borderColor = AC)}
                    onBlur={e => (e.target.style.borderColor = B)} />
                </Row>
              </div>

              <Row label="Endereço">
                <input style={inputStyle} placeholder="Rua, número, bairro" value={form.address}
                  onChange={set('address')}
                  onFocus={e => (e.target.style.borderColor = AC)}
                  onBlur={e => (e.target.style.borderColor = B)} />
              </Row>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px', gap: 14 }}>
                <Row label="Cidade">
                  <input style={inputStyle} placeholder="São Paulo" value={form.city}
                    onChange={set('city')}
                    onFocus={e => (e.target.style.borderColor = AC)}
                    onBlur={e => (e.target.style.borderColor = B)} />
                </Row>
                <Row label="Estado">
                  <input style={inputStyle} placeholder="SP" maxLength={2} value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))}
                    onFocus={e => (e.target.style.borderColor = AC)}
                    onBlur={e => (e.target.style.borderColor = B)} />
                </Row>
                <Row label="CEP">
                  <input style={inputStyle} placeholder="00000-000" value={form.zip_code}
                    onChange={set('zip_code')}
                    onFocus={e => (e.target.style.borderColor = AC)}
                    onBlur={e => (e.target.style.borderColor = B)} />
                </Row>
              </div>

              <Row label="WhatsApp do condomínio" hint="Número que receberá chamados dos moradores">
                <input style={inputStyle} placeholder="5511999999999" value={form.whatsapp_number}
                  onChange={set('whatsapp_number')}
                  onFocus={e => (e.target.style.borderColor = AC)}
                  onBlur={e => (e.target.style.borderColor = B)} />
              </Row>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeModal} style={{
                  flex: 1, padding: '12px', background: '#fff', color: T,
                  fontWeight: 700, fontSize: 14, borderRadius: 10,
                  border: `1.5px solid ${B}`, cursor: 'pointer',
                }}>
                  Cancelar
                </button>
                <button type="submit" disabled={pending} style={{
                  flex: 2, padding: '12px', background: T, color: '#fff',
                  fontWeight: 800, fontSize: 15, borderRadius: 10, border: 'none',
                  cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {pending ? 'Salvando...' : editCondo ? 'Salvar alterações' : 'Cadastrar condomínio'}
                  {!pending && <ArrowRight size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#444', marginBottom: 6, letterSpacing: '0.02em' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: T3, marginLeft: 6 }}>· {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function CondoCard({ condo, onEdit, onToggle, inactive }: { condo: Condo; onEdit: (c: Condo) => void; onToggle: (id: string) => void; inactive?: boolean }) {
  return (
    <div style={{
      background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '22px',
      display: 'flex', flexDirection: 'column', gap: 14,
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      {/* Top */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11, flexShrink: 0,
            background: inactive ? '#F5F5F5' : AC + '25',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={20} color={inactive ? T3 : T} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: T, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {condo.name}
            </p>
            {condo.cnpj && <p style={{ fontSize: 11, color: T3, marginTop: 2 }}>{condo.cnpj}</p>}
          </div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
          background: inactive ? '#F5F5F5' : '#DCFCE7',
          color: inactive ? T3 : '#166534',
          flexShrink: 0,
        }}>
          {inactive ? 'Inativo' : 'Ativo'}
        </span>
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(condo.city || condo.state) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={T3} />
            <span style={{ fontSize: 12, color: T2 }}>{[condo.city, condo.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {condo.whatsapp_number && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Phone size={13} color={T3} />
            <span style={{ fontSize: 12, color: T2 }}>{condo.whatsapp_number}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
        {[
          { icon: <Building2 size={13} />, val: condo.total_units || 0, label: 'unidades' },
          { icon: <Users size={13} />, val: condo.total_users || 0, label: 'usuários' },
          { icon: <MessageSquare size={13} />, val: condo.open_demands || 0, label: 'chamados' },
        ].map(({ icon, val, label }) => (
          <div key={label} style={{ flex: 1, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 900, color: T, letterSpacing: '-0.03em' }}>{val}</p>
            <p style={{ fontSize: 10, color: T3, marginTop: 1 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(condo)} style={{
          flex: 1, padding: '9px', background: '#F5F5F0', color: T,
          fontWeight: 700, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer',
        }}>
          Editar
        </button>
        <button onClick={() => onToggle(condo.id)} style={{
          padding: '9px 14px', background: 'transparent', color: inactive ? '#22C55E' : '#EF4444',
          fontWeight: 700, fontSize: 13, borderRadius: 8,
          border: `1.5px solid ${inactive ? '#DCFCE7' : '#FEE2E2'}`,
          cursor: 'pointer',
        }}>
          {inactive ? 'Reativar' : 'Desativar'}
        </button>
      </div>
    </div>
  );
}
