'use client';
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import {
  Building2, Plus, MapPin, Users, MessageSquare,
  CheckCircle2, XCircle, ArrowRight, X, Phone,
  Loader2, AlertCircle, Search
} from 'lucide-react';

const L = '#F8F8F4';
const S = '#FFFFFF';
const B = '#E8E8E0';
const T = '#0A0A0A';
const T2 = '#666';
const T3 = '#999';
const AC = '#BBFF00';
const ERR = '#EF4444';
const OK = '#22C55E';

// --- CNPJ validation ---
function validateCnpj(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (s: string, w: number[]) =>
    w.reduce((a, c, i) => a + parseInt(s[i]) * c, 0);
  const r1 = calc(d, [5,4,3,2,9,8,7,6,5,4,3,2]);
  const d1 = r1 % 11 < 2 ? 0 : 11 - (r1 % 11);
  const r2 = calc(d, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2 = r2 % 11 < 2 ? 0 : 11 - (r2 % 11);
  return parseInt(d[12]) === d1 && parseInt(d[13]) === d2;
}

function formatCnpj(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatCep(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

interface Condo {
  id: string; name: string; cnpj: string; address: string;
  city: string; state: string; zip_code: string; total_units: number;
  whatsapp_number: string; is_active: boolean; open_demands: number;
  total_users: number; created_at: string;
  sindico_name: string; sindico_phone: string;
  sindico_whatsapp: string; sindico_email: string;
}

const emptyForm = {
  name: '', cnpj: '', zip_code: '', address: '', number: '',
  complement: '', neighborhood: '', city: '', state: '',
  total_units: '', whatsapp_number: '',
  sindico_name: '', sindico_phone: '', sindico_whatsapp: '', sindico_email: '',
};

type Tab = 'geral' | 'endereco' | 'sindico';

export default function CondominiumsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editCondo, setEditCondo] = useState<Condo | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [tab, setTab] = useState<Tab>('geral');
  const [cnpjError, setCnpjError] = useState('');
  const [cnpjOk, setCnpjOk] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const numberRef = useRef<HTMLInputElement>(null);

  const { data: condos = [], isLoading } = useQuery<Condo[]>({
    queryKey: ['condominiums'],
    queryFn: () => api.get('/condominiums').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => api.post('/condominiums', data),
    onSuccess: () => { toast.success('Condomínio cadastrado!'); qc.invalidateQueries({ queryKey: ['condominiums'] }); closeModal(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao cadastrar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      api.patch(`/condominiums/${id}`, data),
    onSuccess: () => { toast.success('Condomínio atualizado!'); qc.invalidateQueries({ queryKey: ['condominiums'] }); closeModal(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao atualizar'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/condominiums/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['condominiums'] }),
  });

  function openCreate() {
    setEditCondo(null); setForm({ ...emptyForm });
    setCnpjError(''); setCnpjOk(false); setCepError('');
    setTab('geral'); setShowModal(true);
  }

  function openEdit(c: Condo) {
    setEditCondo(c);
    const digits = (c.cnpj || '').replace(/\D/g, '');
    setCnpjOk(digits.length === 14 ? validateCnpj(digits) : false);
    setCnpjError(''); setCepError('');
    setForm({
      name: c.name || '', cnpj: c.cnpj || '',
      zip_code: c.zip_code || '',
      address: c.address || '', number: '', complement: '', neighborhood: '',
      city: c.city || '', state: c.state || '',
      total_units: String(c.total_units || ''), whatsapp_number: c.whatsapp_number || '',
      sindico_name: c.sindico_name || '', sindico_phone: c.sindico_phone || '',
      sindico_whatsapp: c.sindico_whatsapp || '', sindico_email: c.sindico_email || '',
    });
    setTab('geral'); setShowModal(true);
  }

  function closeModal() {
    setShowModal(false); setEditCondo(null); setForm({ ...emptyForm });
    setCnpjError(''); setCnpjOk(false); setCepError('');
  }

  function sf(k: keyof typeof emptyForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  }

  function handleCnpj(e: React.ChangeEvent<HTMLInputElement>) {
    const fmt = formatCnpj(e.target.value);
    setForm(f => ({ ...f, cnpj: fmt }));
    const digits = fmt.replace(/\D/g, '');
    if (digits.length === 0) { setCnpjError(''); setCnpjOk(false); return; }
    if (digits.length < 14) { setCnpjError(''); setCnpjOk(false); return; }
    if (validateCnpj(digits)) { setCnpjError(''); setCnpjOk(true); }
    else { setCnpjError('CNPJ inválido'); setCnpjOk(false); }
  }

  async function handleCep(e: React.ChangeEvent<HTMLInputElement>) {
    const fmt = formatCep(e.target.value);
    setForm(f => ({ ...f, zip_code: fmt }));
    setCepError('');
    const digits = fmt.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { setCepError('CEP não encontrado'); }
      else {
        setForm(f => ({
          ...f,
          address: data.logradouro || f.address,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
        setTimeout(() => numberRef.current?.focus(), 50);
      }
    } catch {
      setCepError('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  }

  function buildAddress() {
    const parts = [form.address, form.number, form.complement, form.neighborhood].filter(Boolean);
    return parts.join(', ');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = form.cnpj.replace(/\D/g, '');
    if (digits.length > 0 && !validateCnpj(digits)) {
      setCnpjError('CNPJ inválido'); setTab('geral'); return;
    }
    const payload = {
      name: form.name, cnpj: form.cnpj || null,
      address: buildAddress() || null,
      city: form.city || null, state: form.state || null,
      zip_code: form.zip_code || null,
      total_units: form.total_units || null,
      whatsapp_number: form.whatsapp_number || null,
      sindico_name: form.sindico_name || null, sindico_phone: form.sindico_phone || null,
      sindico_whatsapp: form.sindico_whatsapp || null, sindico_email: form.sindico_email || null,
    };
    if (editCondo) updateMutation.mutate({ id: editCondo.id, data: payload });
    else createMutation.mutate(payload);
  }

  const active = condos.filter(c => c.is_active);
  const inactive = condos.filter(c => !c.is_active);
  const pending = createMutation.isPending || updateMutation.isPending;

  const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%', padding: '10px 13px',
    background: S, border: `1.5px solid ${B}`,
    borderRadius: 8, fontSize: 14, color: T,
    fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.15s', boxSizing: 'border-box',
    ...extra,
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'geral', label: 'Dados gerais' },
    { id: 'endereco', label: 'Endereço' },
    { id: 'sindico', label: 'Síndico' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: L }}>
      <Header title="Condomínios" />

      <main style={{ flex: 1, padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T, letterSpacing: '-0.04em', marginBottom: 6 }}>
              Condomínios
            </h1>
            <p style={{ fontSize: 14, color: T2 }}>
              {active.length} ativo{active.length !== 1 ? 's' : ''} · gerencie os condomínios clientes
            </p>
          </div>
          <button onClick={openCreate} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', background: T, color: '#fff',
            fontWeight: 800, fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer',
          }}>
            <Plus size={16} /> Cadastrar condomínio
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total de condomínios', value: condos.length, accent: T },
            { label: 'Ativos', value: active.length, accent: OK },
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
            {Array(3).fill(0).map((_, i) => <div key={i} style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: 24, height: 200 }} />)}
          </div>
        ) : condos.length === 0 ? (
          <div style={{ background: S, border: `1.5px dashed ${B}`, borderRadius: 16, padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: AC + '20', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Building2 size={26} color={T} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: T, marginBottom: 8 }}>Nenhum condomínio cadastrado</h3>
            <p style={{ fontSize: 14, color: T2, maxWidth: 360, margin: '0 auto 24px', lineHeight: 1.6 }}>
              Comece cadastrando o primeiro condomínio cliente da sua administradora.
            </p>
            <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: T, color: '#fff', fontWeight: 800, fontSize: 15, borderRadius: 10, border: 'none', cursor: 'pointer' }}>
              <Plus size={16} /> Cadastrar primeiro condomínio
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>ATIVOS — {active.length}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14 }}>
                  {active.map(c => <CondoCard key={c.id} condo={c} onEdit={openEdit} onToggle={(id) => toggleMutation.mutate({ id, is_active: false })} />)}
                </div>
              </div>
            )}
            {inactive.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: T3, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>INATIVOS — {inactive.length}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 14, opacity: 0.6 }}>
                  {inactive.map(c => <CondoCard key={c.id} condo={c} onEdit={openEdit} onToggle={(id) => toggleMutation.mutate({ id, is_active: true })} inactive />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ===== MODAL ===== */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: S, borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 100px rgba(0,0,0,0.22)' }}>

            {/* Modal header */}
            <div style={{ padding: '24px 28px 0', borderBottom: `1px solid ${B}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={18} color={AC} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: T, margin: 0, letterSpacing: '-0.02em' }}>
                      {editCondo ? 'Editar condomínio' : 'Novo condomínio'}
                    </h2>
                    <p style={{ fontSize: 12, color: T3, margin: '2px 0 0' }}>
                      {editCondo ? editCondo.name : 'Preencha os dados do condomínio cliente'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, padding: 6, borderRadius: 8, display: 'flex', flexShrink: 0 }}>
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0 }}>
                {tabs.map(t => (
                  <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
                    flex: 1, padding: '10px 0', border: 'none', background: 'none',
                    fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
                    color: tab === t.id ? T : T3, cursor: 'pointer',
                    borderBottom: `2px solid ${tab === t.id ? T : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal body — scrollable */}
            <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ---- TAB: GERAL ---- */}
                {tab === 'geral' && (
                  <>
                    <Field label="Nome do condomínio *">
                      <input
                        required
                        value={form.name}
                        onChange={sf('name')}
                        placeholder="Ex: Condomínio Parque das Flores"
                        style={inp()}
                        onFocus={e => e.target.style.borderColor = T}
                        onBlur={e => e.target.style.borderColor = B}
                      />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14 }}>
                      <Field label="CNPJ" status={cnpjOk ? 'ok' : cnpjError ? 'error' : undefined} statusMsg={cnpjError}>
                        <div style={{ position: 'relative' }}>
                          <input
                            value={form.cnpj}
                            onChange={handleCnpj}
                            placeholder="00.000.000/0001-00"
                            style={inp({ paddingRight: 36, borderColor: cnpjError ? ERR : cnpjOk ? OK : B })}
                            onFocus={e => e.target.style.borderColor = cnpjError ? ERR : cnpjOk ? OK : T}
                            onBlur={e => e.target.style.borderColor = cnpjError ? ERR : cnpjOk ? OK : B}
                          />
                          {cnpjOk && <CheckCircle2 size={15} color={OK} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />}
                          {cnpjError && <AlertCircle size={15} color={ERR} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />}
                        </div>
                      </Field>
                      <Field label="Total de unidades">
                        <input
                          type="number" min="0"
                          value={form.total_units}
                          onChange={sf('total_units')}
                          placeholder="0"
                          style={inp()}
                          onFocus={e => e.target.style.borderColor = T}
                          onBlur={e => e.target.style.borderColor = B}
                        />
                      </Field>
                    </div>

                    <Field label="WhatsApp do condomínio" hint="receberá chamados dos moradores">
                      <input
                        value={form.whatsapp_number}
                        onChange={sf('whatsapp_number')}
                        placeholder="5511999999999"
                        style={inp()}
                        onFocus={e => e.target.style.borderColor = T}
                        onBlur={e => e.target.style.borderColor = B}
                      />
                    </Field>

                    <div style={{ background: L, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: 13, color: T2, margin: 0 }}>Preencha o endereço e dados do síndico nas outras abas</p>
                      <button type="button" onClick={() => setTab('endereco')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T }}>
                        Endereço <ArrowRight size={14} />
                      </button>
                    </div>
                  </>
                )}

                {/* ---- TAB: ENDEREÇO ---- */}
                {tab === 'endereco' && (
                  <>
                    <Field label="CEP *" hint="preenchimento automático" status={cepError ? 'error' : undefined} statusMsg={cepError}>
                      <div style={{ position: 'relative' }}>
                        <input
                          value={form.zip_code}
                          onChange={handleCep}
                          placeholder="00000-000"
                          style={inp({ paddingRight: 36, borderColor: cepError ? ERR : B })}
                          onFocus={e => e.target.style.borderColor = cepError ? ERR : T}
                          onBlur={e => e.target.style.borderColor = cepError ? ERR : B}
                          maxLength={9}
                        />
                        {cepLoading
                          ? <Loader2 size={15} color={T3} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />
                          : <Search size={15} color={T3} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        }
                      </div>
                    </Field>

                    <Field label="Logradouro">
                      <input
                        value={form.address}
                        onChange={sf('address')}
                        placeholder="Rua, Av., Alameda..."
                        style={inp()}
                        onFocus={e => e.target.style.borderColor = T}
                        onBlur={e => e.target.style.borderColor = B}
                      />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14 }}>
                      <Field label="Número">
                        <input
                          ref={numberRef}
                          value={form.number}
                          onChange={sf('number')}
                          placeholder="Nº"
                          style={inp()}
                          onFocus={e => e.target.style.borderColor = T}
                          onBlur={e => e.target.style.borderColor = B}
                        />
                      </Field>
                      <Field label="Complemento">
                        <input
                          value={form.complement}
                          onChange={sf('complement')}
                          placeholder="Apto, Bloco, Torre..."
                          style={inp()}
                          onFocus={e => e.target.style.borderColor = T}
                          onBlur={e => e.target.style.borderColor = B}
                        />
                      </Field>
                    </div>

                    <Field label="Bairro">
                      <input
                        value={form.neighborhood}
                        onChange={sf('neighborhood')}
                        placeholder="Bairro"
                        style={inp()}
                        onFocus={e => e.target.style.borderColor = T}
                        onBlur={e => e.target.style.borderColor = B}
                      />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 14 }}>
                      <Field label="Cidade">
                        <input
                          value={form.city}
                          onChange={sf('city')}
                          placeholder="São Paulo"
                          style={inp()}
                          onFocus={e => e.target.style.borderColor = T}
                          onBlur={e => e.target.style.borderColor = B}
                        />
                      </Field>
                      <Field label="UF">
                        <input
                          value={form.state}
                          onChange={e => setForm(f => ({ ...f, state: e.target.value.toUpperCase().slice(0, 2) }))}
                          placeholder="SP"
                          maxLength={2}
                          style={inp({ textTransform: 'uppercase' })}
                          onFocus={e => e.target.style.borderColor = T}
                          onBlur={e => e.target.style.borderColor = B}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* ---- TAB: SÍNDICO ---- */}
                {tab === 'sindico' && (
                  <>
                    <div style={{ background: '#FFFDF0', border: '1px solid #E8E0A0', borderRadius: 10, padding: '12px 14px', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, color: '#7A6800', margin: 0, lineHeight: 1.5 }}>
                        O síndico terá acesso direto ao sistema e WhatsApp para interagir com a equipe da administradora.
                      </p>
                    </div>

                    <Field label="Nome completo do síndico">
                      <input
                        value={form.sindico_name}
                        onChange={sf('sindico_name')}
                        placeholder="Nome do síndico"
                        style={inp()}
                        onFocus={e => e.target.style.borderColor = T}
                        onBlur={e => e.target.style.borderColor = B}
                      />
                    </Field>

                    <Field label="E-mail do síndico">
                      <input
                        type="email"
                        value={form.sindico_email}
                        onChange={sf('sindico_email')}
                        placeholder="sindico@email.com"
                        style={inp()}
                        onFocus={e => e.target.style.borderColor = T}
                        onBlur={e => e.target.style.borderColor = B}
                      />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Telefone">
                        <input
                          value={form.sindico_phone}
                          onChange={sf('sindico_phone')}
                          placeholder="(11) 9xxxx-xxxx"
                          style={inp()}
                          onFocus={e => e.target.style.borderColor = T}
                          onBlur={e => e.target.style.borderColor = B}
                        />
                      </Field>
                      <Field label="WhatsApp">
                        <input
                          value={form.sindico_whatsapp}
                          onChange={sf('sindico_whatsapp')}
                          placeholder="5511999999999"
                          style={inp()}
                          onFocus={e => e.target.style.borderColor = T}
                          onBlur={e => e.target.style.borderColor = B}
                        />
                      </Field>
                    </div>
                  </>
                )}
              </div>

              {/* Modal footer */}
              <div style={{ padding: '16px 28px 24px', borderTop: `1px solid ${B}`, display: 'flex', gap: 10 }}>
                <button type="button" onClick={closeModal} style={{
                  flex: 1, padding: '11px', background: L, color: T2,
                  fontWeight: 600, fontSize: 14, borderRadius: 9,
                  border: `1.5px solid ${B}`, cursor: 'pointer',
                }}>
                  Cancelar
                </button>
                <button type="submit" disabled={pending} style={{
                  flex: 2, padding: '11px', background: T, color: S,
                  fontWeight: 800, fontSize: 14, borderRadius: 9, border: 'none',
                  cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {pending ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : editCondo ? 'Salvar alterações' : 'Cadastrar condomínio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, hint, status, statusMsg, children }: {
  label: string; hint?: string; status?: 'ok' | 'error';
  statusMsg?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: '#444', letterSpacing: '0.01em' }}>
          {label}
          {hint && <span style={{ fontWeight: 400, color: T3, marginLeft: 6, fontSize: 11 }}>{hint}</span>}
        </label>
        {statusMsg && <span style={{ fontSize: 11, color: ERR, fontWeight: 600 }}>{statusMsg}</span>}
      </div>
      {children}
    </div>
  );
}

function CondoCard({ condo, onEdit, onToggle, inactive }: {
  condo: Condo; onEdit: (c: Condo) => void; onToggle: (id: string) => void; inactive?: boolean;
}) {
  return (
    <div
      style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'transform 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: inactive ? '#F5F5F5' : AC + '25', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={18} color={inactive ? T3 : T} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 800, color: T, letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>{condo.name}</p>
            {condo.cnpj && <p style={{ fontSize: 11, color: T3, marginTop: 2, margin: 0 }}>{condo.cnpj}</p>}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: inactive ? '#F5F5F5' : '#DCFCE7', color: inactive ? T3 : '#166534', flexShrink: 0 }}>
          {inactive ? 'Inativo' : 'Ativo'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {(condo.city || condo.state) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} color={T3} />
            <span style={{ fontSize: 12, color: T2 }}>{[condo.city, condo.state].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        {condo.sindico_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={12} color={T3} />
            <span style={{ fontSize: 12, color: T2 }}>Sínd. {condo.sindico_name}</span>
          </div>
        )}
        {condo.whatsapp_number && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Phone size={12} color={T3} />
            <span style={{ fontSize: 12, color: T2 }}>{condo.whatsapp_number}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '10px 0', borderTop: `1px solid ${B}`, borderBottom: `1px solid ${B}` }}>
        {[
          { val: condo.total_units || 0, label: 'unidades' },
          { val: condo.total_users || 0, label: 'usuários' },
          { val: condo.open_demands || 0, label: 'chamados' },
        ].map(({ val, label }, i) => (
          <div key={label} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? `1px solid ${B}` : 'none' }}>
            <p style={{ fontSize: 20, fontWeight: 900, color: T, letterSpacing: '-0.03em', margin: 0 }}>{val}</p>
            <p style={{ fontSize: 10, color: T3, margin: '2px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onEdit(condo)} style={{ flex: 1, padding: '8px', background: L, color: T, fontWeight: 700, fontSize: 13, borderRadius: 8, border: `1px solid ${B}`, cursor: 'pointer' }}>
          Editar
        </button>
        <button onClick={() => onToggle(condo.id)} style={{ padding: '8px 14px', background: 'transparent', color: inactive ? OK : ERR, fontWeight: 700, fontSize: 13, borderRadius: 8, border: `1.5px solid ${inactive ? '#DCFCE7' : '#FEE2E2'}`, cursor: 'pointer' }}>
          {inactive ? 'Reativar' : 'Desativar'}
        </button>
      </div>
    </div>
  );
}
