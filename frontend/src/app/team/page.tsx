'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import {
  Users, Plus, X, Mail, Phone, Shield, Briefcase,
  CheckCircle2, XCircle, ChevronDown, Search
} from 'lucide-react';

const L = '#F8F8F4';
const S = '#FFFFFF';
const B = '#E8E8E0';
const T = '#0A0A0A';
const T2 = '#666';
const T3 = '#999';
const AC = '#BBFF00';

const SETORES = [
  'Financeiro', 'Manutenção', 'Jurídico', 'Atendimento',
  'Obras e Reformas', 'Segurança', 'Administrativo', 'TI',
];

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  role: 'ADMIN' | 'FUNCIONARIO';
  setor: string;
  funcao: string;
  is_active: boolean;
  last_login_at: string;
  created_at: string;
}

const emptyForm = {
  name: '', email: '', password: '', phone: '', whatsapp_number: '',
  setor: '', funcao: '', role: 'FUNCIONARIO' as const,
};

export default function TeamPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [search, setSearch] = useState('');
  const [filterSetor, setFilterSetor] = useState('');

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof emptyForm) => api.post('/team', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Funcionário cadastrado'); closeModal(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao cadastrar'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof emptyForm> & { is_active?: boolean } }) =>
      api.patch(`/team/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Dados atualizados'); closeModal(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao atualizar'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/team/${id}`, { is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['team'] }); toast.success('Status atualizado'); },
  });

  function openCreate() { setEditMember(null); setForm({ ...emptyForm }); setShowModal(true); }
  function openEdit(m: Member) {
    setEditMember(m);
    setForm({ name: m.name, email: m.email, password: '', phone: m.phone || '', whatsapp_number: m.whatsapp_number || '', setor: m.setor || '', funcao: m.funcao || '', role: m.role });
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditMember(null); setForm({ ...emptyForm }); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editMember) {
      const data: any = { ...form };
      if (!data.password) delete data.password;
      updateMutation.mutate({ id: editMember.id, data });
    } else {
      createMutation.mutate(form);
    }
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.funcao || '').toLowerCase().includes(q);
    const matchSetor = !filterSetor || m.setor === filterSetor;
    return matchSearch && matchSetor;
  });

  const bySetor = SETORES.reduce((acc, s) => {
    acc[s] = filtered.filter(m => m.setor === s);
    return acc;
  }, {} as Record<string, Member[]>);
  const noSetor = filtered.filter(m => !m.setor);

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: `1.5px solid ${B}`,
    borderRadius: 8, fontSize: 14, background: S, color: T,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: L, minHeight: '100vh' }}>
      <Header title="Equipe" subtitle="Gerencie os funcionários da administradora" />
      <div style={{ padding: '0 32px 32px' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T3 }} />
            <input
              placeholder="Buscar funcionário..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ ...inp, paddingLeft: 36 }}
            />
          </div>
          <select
            value={filterSetor}
            onChange={e => setFilterSetor(e.target.value)}
            style={{ ...inp, width: 'auto', minWidth: 160, cursor: 'pointer' }}
          >
            <option value="">Todos os setores</option>
            {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T, color: S, border: 'none', borderRadius: 8,
              padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} />
            Novo funcionário
          </button>
        </div>

        {isLoading && (
          <div style={{ textAlign: 'center', padding: 80, color: T3 }}>Carregando equipe...</div>
        )}

        {!isLoading && members.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Users size={48} color={B} style={{ margin: '0 auto 16px' }} />
            <p style={{ color: T2, fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Nenhum funcionário cadastrado</p>
            <p style={{ color: T3, fontSize: 14, marginBottom: 24 }}>Adicione funcionários e atribua setores para o roteamento automático de chamados.</p>
            <button onClick={openCreate} style={{ background: T, color: S, border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cadastrar primeiro funcionário
            </button>
          </div>
        )}

        {/* Grouped by setor */}
        {!isLoading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {SETORES.map(setor => {
              const group = bySetor[setor];
              if (!filterSetor && group.length === 0) return null;
              if (filterSetor && filterSetor !== setor) return null;
              return (
                <SetorGroup key={setor} setor={setor} members={group} onEdit={openEdit} onToggle={(m) => toggleMutation.mutate({ id: m.id, is_active: !m.is_active })} />
              );
            })}
            {noSetor.length > 0 && (
              <SetorGroup setor="Sem setor" members={noSetor} onEdit={openEdit} onToggle={(m) => toggleMutation.mutate({ id: m.id, is_active: !m.is_active })} />
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: S, borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: T, margin: 0 }}>
                {editMember ? 'Editar funcionário' : 'Novo funcionário'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>Nome completo *</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} placeholder="Nome do funcionário" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>E-mail *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} style={inp} placeholder="email@empresa.com" disabled={!!editMember} />
                </div>
                {!editMember && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>Senha *</label>
                    <input required={!editMember} type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={inp} placeholder="Senha de acesso" />
                  </div>
                )}
                {editMember && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>Nova senha (opcional)</label>
                    <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} style={inp} placeholder="Deixe em branco para manter" />
                  </div>
                )}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>Telefone</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={inp} placeholder="(11) 9xxxx-xxxx" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>WhatsApp</label>
                  <input value={form.whatsapp_number} onChange={e => setForm(p => ({ ...p, whatsapp_number: e.target.value }))} style={inp} placeholder="55119xxxx-xxxx" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>Setor</label>
                  <select value={form.setor} onChange={e => setForm(p => ({ ...p, setor: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="">Selecione o setor</option>
                    {SETORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>Função</label>
                  <input value={form.funcao} onChange={e => setForm(p => ({ ...p, funcao: e.target.value }))} style={inp} placeholder="Ex: Analista, Gerente..." />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T2, marginBottom: 6 }}>Perfil de acesso</label>
                  <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as any }))} style={{ ...inp, cursor: 'pointer' }}>
                    <option value="FUNCIONARIO">Funcionário</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '11px 0', border: `1.5px solid ${B}`, borderRadius: 8, background: 'none', color: T2, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ flex: 1, padding: '11px 0', border: 'none', borderRadius: 8, background: T, color: S, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {editMember ? 'Salvar alterações' : 'Cadastrar funcionário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SetorGroup({ setor, members, onEdit, onToggle }: {
  setor: string;
  members: Member[];
  onEdit: (m: Member) => void;
  onToggle: (m: Member) => void;
}) {
  const colors: Record<string, string> = {
    'Financeiro': '#10B981', 'Manutenção': '#F59E0B', 'Jurídico': '#6366F1',
    'Atendimento': '#EC4899', 'Obras e Reformas': '#F97316', 'Segurança': '#EF4444',
    'Administrativo': '#8B5CF6', 'TI': '#06B6D4', 'Sem setor': '#999',
  };
  const color = colors[setor] || '#666';

  return (
    <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E8E8E0', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #E8E8E0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A' }}>{setor}</span>
        <span style={{ marginLeft: 4, fontSize: 12, color: '#999', background: '#F0F0F0', borderRadius: 20, padding: '2px 8px' }}>{members.length}</span>
      </div>
      {members.length === 0 ? (
        <div style={{ padding: '20px', color: '#999', fontSize: 13, textAlign: 'center' }}>Nenhum funcionário neste setor</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
          {members.map((m, i) => (
            <MemberCard key={m.id} member={m} onEdit={onEdit} onToggle={onToggle} borderBottom={i < members.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberCard({ member: m, onEdit, onToggle, borderBottom }: {
  member: Member;
  onEdit: (m: Member) => void;
  onToggle: (m: Member) => void;
  borderBottom: boolean;
}) {
  const initial = m.name?.[0]?.toUpperCase() ?? '?';
  return (
    <div style={{ padding: '16px 20px', borderRight: '1px solid #E8E8E0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: m.is_active ? 'linear-gradient(135deg, #BBFF00, #88CC00)' : '#E0E0E0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: m.is_active ? '#0A0A0A' : '#999',
      }}>
        {initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
          {m.role === 'ADMIN' && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', background: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 5px' }}>ADMIN</span>
          )}
          {!m.is_active && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#999', background: '#F0F0F0', borderRadius: 4, padding: '1px 5px' }}>INATIVO</span>
          )}
        </div>
        {m.funcao && <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>{m.funcao}</p>}
        <p style={{ fontSize: 11, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(m)}
          title="Editar"
          style={{ background: 'none', border: `1px solid #E8E8E0`, borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#666', cursor: 'pointer' }}
        >
          Editar
        </button>
        <button
          onClick={() => onToggle(m)}
          title={m.is_active ? 'Desativar' : 'Ativar'}
          style={{ background: 'none', border: `1px solid #E8E8E0`, borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: m.is_active ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center' }}
        >
          {m.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
        </button>
      </div>
    </div>
  );
}
