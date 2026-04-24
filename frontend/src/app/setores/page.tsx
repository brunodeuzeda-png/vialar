'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useCondominium } from '@/contexts/CondominiumContext';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, X, Save, Loader2,
  Users, MessageSquare, ChevronRight, Zap,
  CheckCircle2, ArrowLeft,
} from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const PRESET_COLORS = [
  '#F59E0B','#3B82F6','#8B5CF6','#EC4899',
  '#EA580C','#DC2626','#0891B2','#7C3AED',
  '#16A34A','#0D9488','#D97706','#6B7280',
];
const PRESET_ICONS = [
  '🔧','💰','⚖️','🎧','🏗️','🔒','📋','💻',
  '🧹','📊','🚪','🌿','🔑','📞','🛡️','⚡',
];

const STATUS_CFG: Record<string, { label: string; dot: string; color: string }> = {
  ABERTA:               { label: 'Aberta',           dot: '#3B82F6', color: '#1D4ED8' },
  TRIAGEM:              { label: 'Triagem',           dot: '#8B5CF6', color: '#6D28D9' },
  EM_ANDAMENTO:         { label: 'Em andamento',      dot: '#F59E0B', color: '#B45309' },
  AGUARDANDO_ORCAMENTO: { label: 'Aguard. orçamento', dot: '#F97316', color: '#C2410C' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação', dot: '#EAB308', color: '#854D0E' },
  AGENDADA:             { label: 'Agendada',          dot: '#22C55E', color: '#15803D' },
  CONCLUIDA:            { label: 'Concluída',         dot: '#16A34A', color: '#166534' },
  CANCELADA:            { label: 'Cancelada',         dot: '#9CA3AF', color: '#6B7280' },
};
const PRIO_COLOR: Record<string, string> = {
  CRITICA: '#DC2626', ALTA: '#EA580C', MEDIA: '#D97706', BAIXA: '#16A34A',
};

interface Setor { id: string; name: string; icon: string; color: string; is_active: boolean; }

function SetorModal({ setor, onClose, onSave }: {
  setor?: Setor | null;
  onClose: () => void;
  onSave: (data: Partial<Setor>) => Promise<void>;
}) {
  const [form, setForm] = useState({ name: setor?.name || '', icon: setor?.icon || '📋', color: setor?.color || '#6B7280' });
  const [loading, setLoading] = useState(false);

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 13px', background: S,
    border: `1.5px solid ${B}`, borderRadius: 8, fontSize: 14,
    color: T, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: S, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${B}` }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T, margin: 0 }}>
            {setor ? 'Editar Setor' : 'Novo Setor'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: form.color + '15', border: `2px solid ${form.color}40`, borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: form.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {form.icon}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: T, margin: 0 }}>{form.name || 'Nome do setor'}</p>
              <p style={{ fontSize: 12, color: T3, margin: 0 }}>Prévia do setor</p>
            </div>
          </div>

          {/* Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>NOME</label>
            <input style={inp} placeholder="Ex: Jardinagem" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T)} onBlur={e => (e.target.style.borderColor = B)} />
          </div>

          {/* Icon picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>ÍCONE</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                  style={{ width: 38, height: 38, borderRadius: 9, border: `2px solid ${form.icon === icon ? T : B}`, background: form.icon === icon ? L : 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em' }}>COR</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_COLORS.map(color => (
                <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: `3px solid ${form.color === color ? T : 'transparent'}`, cursor: 'pointer', boxSizing: 'border-box' as const }} />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px 0', background: L, border: `1.5px solid ${B}`, borderRadius: 9, fontSize: 14, fontWeight: 700, color: T2, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              disabled={!form.name.trim() || loading}
              onClick={async () => { setLoading(true); try { await onSave(form); onClose(); } catch { setLoading(false); } }}
              style={{ flex: 1, padding: '11px 0', background: T, border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 800, color: S, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: !form.name.trim() ? 0.5 : 1 }}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
              {setor ? 'Salvar' : 'Criar Setor'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function SetoresPage() {
  const qc = useQueryClient();
  const { activeCondo } = useCondominium();
  const condoId = activeCondo?.id;

  const [selected, setSelected] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);

  const { data: setores = [], isLoading: setoresLoading } = useQuery<Setor[]>({
    queryKey: ['setores'],
    queryFn: () => api.get('/setores').then(r => r.data),
  });

  const { data: stats = [] } = useQuery<any[]>({
    queryKey: ['demands-by-setor', condoId],
    queryFn: () => api.get('/demands/stats/by-setor', { params: { condominium_id: condoId } }).then(r => r.data),
    enabled: !!condoId,
  });

  const { data: team = [] } = useQuery<any[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
  });

  const { data: demandsData, isLoading: demandsLoading } = useQuery({
    queryKey: ['demands-setor', selected, condoId],
    queryFn: () => api.get('/demands', { params: { condominium_id: condoId, assigned_setor: selected, limit: 50 } }).then(r => r.data),
    enabled: !!condoId && !!selected,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/setores', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['setores'] }); toast.success('Setor criado!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao criar'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, ...data }: any) => api.patch(`/setores/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['setores'] }); toast.success('Setor atualizado!'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao atualizar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/setores/${id}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['setores'] });
      if (selected === setores.find(s => s.id === id)?.name) setSelected(null);
      toast.success('Setor excluído');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao excluir'),
  });

  const statsMap = Object.fromEntries(stats.map(s => [s.assigned_setor, s]));
  const teamBySetor = team.reduce((acc: any, m: any) => {
    if (m.setor) { acc[m.setor] = acc[m.setor] || []; acc[m.setor].push(m); }
    return acc;
  }, {} as Record<string, any[]>);

  const selectedSetor = setores.find(s => s.name === selected);
  const selectedDemands: any[] = demandsData?.data || [];

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Setores" />
      <main style={{ padding: '28px 32px' }} className="page-main">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T, letterSpacing: '-0.04em', margin: '0 0 4px' }}>Setores</h1>
            <p style={{ fontSize: 14, color: T2, margin: 0 }}>{setores.length} setores cadastrados</p>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: T, color: S, fontWeight: 800, fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Novo Setor
          </button>
        </div>

        {/* Sector grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {setoresLoading && Array(8).fill(0).map((_, i) => (
            <div key={i} style={{ height: 110, background: S, border: `1px solid ${B}`, borderRadius: 14 }} />
          ))}

          {setores.map(setor => {
            const s = statsMap[setor.name];
            const members = teamBySetor[setor.name] || [];
            const isActive = selected === setor.name;
            const openCount = Number(s?.open || 0);
            const criticalCount = Number(s?.critical || 0);

            return (
              <div key={setor.id} style={{ position: 'relative' }}>
                <button
                  onClick={() => setSelected(isActive ? null : setor.name)}
                  style={{
                    width: '100%', background: isActive ? setor.color + '15' : S,
                    border: `2px solid ${isActive ? setor.color : B}`,
                    borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                    transition: 'all 0.15s', boxShadow: isActive ? `0 4px 16px ${setor.color}20` : 'none',
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = setor.color + '60'; } }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = B; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{setor.icon}</span>
                    {criticalCount > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', padding: '2px 7px', borderRadius: 99 }}>
                        {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: T, margin: '0 0 8px', lineHeight: 1.3 }}>{setor.name}</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 900, color: openCount > 0 ? setor.color : T3, margin: 0, lineHeight: 1 }}>{openCount}</p>
                      <p style={{ fontSize: 10, color: T3, margin: '1px 0 0', fontWeight: 600 }}>em aberto</p>
                    </div>
                    <div style={{ width: 1, background: B }} />
                    <div>
                      <p style={{ fontSize: 18, fontWeight: 900, color: members.length > 0 ? T : T3, margin: 0, lineHeight: 1 }}>{members.length}</p>
                      <p style={{ fontSize: 10, color: T3, margin: '1px 0 0', fontWeight: 600 }}>membros</p>
                    </div>
                  </div>
                </button>

                {/* Edit / Delete actions */}
                <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 4 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditing(setor); setModalOpen(true); }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${B}`, background: S, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T3 }}
                    title="Editar"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      if (confirm(`Excluir o setor "${setor.name}"? Esta ação não pode ser desfeita.`)) {
                        deleteMut.mutate(setor.id);
                      }
                    }}
                    style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid #FEE2E2`, background: S, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}
                    title="Excluir"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && selectedSetor && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                <ArrowLeft size={13} /> Todos os setores
              </button>
              <span style={{ color: B }}>·</span>
              <span style={{ fontSize: 20 }}>{selectedSetor.icon}</span>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: T, margin: 0 }}>{selectedSetor.name}</h2>
              {statsMap[selected] && (
                <>
                  <span style={{ fontSize: 12, fontWeight: 700, background: selectedSetor.color + '20', color: selectedSetor.color, padding: '3px 10px', borderRadius: 99 }}>
                    {statsMap[selected].open} em aberto
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, background: '#F0FDF4', color: '#16A34A', padding: '3px 10px', borderRadius: 99 }}>
                    {statsMap[selected].done} concluídos
                  </span>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
              {/* Demands */}
              <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAF8' }}>
                  <MessageSquare size={14} color={selectedSetor.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T, letterSpacing: '0.04em' }}>CHAMADOS ATRIBUÍDOS</span>
                </div>
                {demandsLoading && <div style={{ padding: 20 }}>{[1,2,3].map(i => <div key={i} style={{ height: 52, background: L, borderRadius: 8, marginBottom: 8 }} />)}</div>}
                {!demandsLoading && selectedDemands.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 32px', color: T3 }}>
                    <CheckCircle2 size={32} color={B} style={{ marginBottom: 12 }} />
                    <p style={{ fontWeight: 700, color: T, margin: '0 0 4px' }}>Nenhum chamado atribuído</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Os chamados encaminhados para este setor aparecerão aqui.</p>
                  </div>
                )}
                {!demandsLoading && selectedDemands.map((d: any) => {
                  const sCfg = STATUS_CFG[d.status] || { label: d.status, dot: T3, color: T3 };
                  return (
                    <Link key={d.id} href={`/demands/${d.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: `1px solid ${B}`, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = L)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 4, height: 38, borderRadius: 99, background: PRIO_COLOR[d.priority] || B, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: T, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                        <p style={{ fontSize: 12, color: T3, margin: 0 }}>{d.requester_name}{d.unit_identifier ? ` · Apt ${d.unit_identifier}` : ''} · {timeAgo(d.created_at)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {d.ai_triage_data && <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: AC + '20', color: '#5A7A00', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}><Zap size={9} /> IA</span>}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 99, background: sCfg.dot + '18', fontSize: 11, fontWeight: 600, color: sCfg.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sCfg.dot }} />{sCfg.label}
                        </span>
                        <ChevronRight size={14} color={T3} />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Team */}
              <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '13px 18px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAF8' }}>
                  <Users size={14} color={selectedSetor.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T, letterSpacing: '0.04em' }}>EQUIPE</span>
                </div>
                {(teamBySetor[selected] || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: T3 }}>
                    <Users size={28} color={B} style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: T, margin: '0 0 4px' }}>Sem membros</p>
                    <p style={{ fontSize: 12, margin: 0 }}>Adicione funcionários em Equipe.</p>
                  </div>
                ) : (
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(teamBySetor[selected] || []).map((m: any) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: L, borderRadius: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: selectedSetor.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: selectedSetor.color, flexShrink: 0 }}>
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: T, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                          <p style={{ fontSize: 11, color: T3, margin: 0 }}>{m.funcao || m.role}</p>
                        </div>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.is_active ? '#22C55E' : B, flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                )}
                {statsMap[selected] && (
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${B}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Total', value: statsMap[selected].total, color: T },
                      { label: 'Em aberto', value: statsMap[selected].open, color: selectedSetor.color },
                      { label: 'Concluídos', value: statsMap[selected].done, color: '#16A34A' },
                      { label: 'Críticos', value: statsMap[selected].critical, color: '#DC2626' },
                    ].map(item => (
                      <div key={item.label} style={{ background: L, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <p style={{ fontSize: 18, fontWeight: 900, color: item.color, margin: 0 }}>{item.value}</p>
                        <p style={{ fontSize: 10, color: T3, margin: '2px 0 0', fontWeight: 600 }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {modalOpen && (
        <SetorModal
          setor={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSave={async (data) => {
            if (editing) await updateMut.mutateAsync({ id: editing.id, ...data });
            else await createMut.mutateAsync(data);
          }}
        />
      )}
    </div>
  );
}
