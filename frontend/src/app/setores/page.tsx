'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCondominium } from '@/contexts/CondominiumContext';
import Header from '@/components/layout/Header';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, X, Save, Loader2,
  Users, AlertTriangle, ChevronRight, CheckCircle2,
  Activity,
} from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';

const PRESET_COLORS = [
  '#F59E0B','#3B82F6','#8B5CF6','#EC4899',
  '#EA580C','#DC2626','#0891B2','#7C3AED',
  '#16A34A','#0D9488','#D97706','#6B7280',
];
const PRESET_ICONS = [
  '🔧','💰','⚖️','🎧','🏗️','🔒','📋','💻',
  '🧹','📊','🚪','🌿','🔑','📞','🛡️','⚡',
];

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: form.color + '15', border: `2px solid ${form.color}40`, borderRadius: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: form.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              {form.icon}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: T, margin: 0 }}>{form.name || 'Nome do setor'}</p>
              <p style={{ fontSize: 12, color: T3, margin: 0 }}>Prévia do setor</p>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em', marginBottom: 6 }}>NOME</label>
            <input style={inp} placeholder="Ex: Jardinagem" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T)} onBlur={e => (e.target.style.borderColor = B)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em', marginBottom: 8 }}>ÍCONE</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_ICONS.map(icon => (
                <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                  style={{ width: 38, height: 38, borderRadius: 9, border: `2px solid ${form.icon === icon ? T : B}`, background: form.icon === icon ? L : 'none', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T2, letterSpacing: '0.04em', marginBottom: 8 }}>COR</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_COLORS.map(color => (
                <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: `3px solid ${form.color === color ? T : 'transparent'}`, cursor: 'pointer', boxSizing: 'border-box' as const }} />
              ))}
            </div>
          </div>
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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Setor | null>(null);

  const { data: setores = [], isLoading } = useQuery<Setor[]>({
    queryKey: ['setores'],
    queryFn: () => api.get('/setores').then(r => r.data),
  });

  const { data: stats = [] } = useQuery<any[]>({
    queryKey: ['demands-by-setor', condoId],
    queryFn: () => api.get('/demands/stats/by-setor', { params: { condominium_id: condoId } }).then(r => r.data),
    enabled: !!condoId,
    refetchInterval: 30000,
  });

  const { data: team = [] } = useQuery<any[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['setores'] }); toast.success('Setor excluído'); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao excluir'),
  });

  const statsMap = Object.fromEntries(stats.map((s: any) => [s.assigned_setor, s]));
  const teamBySetor = team.reduce((acc: any, m: any) => {
    if (m.setor) { acc[m.setor] = acc[m.setor] || []; acc[m.setor].push(m); }
    return acc;
  }, {} as Record<string, any[]>);

  const totalOpen     = stats.reduce((sum: number, s: any) => sum + Number(s.open || 0), 0);
  const totalCritical = stats.reduce((sum: number, s: any) => sum + Number(s.critical || 0), 0);
  const totalDone     = stats.reduce((sum: number, s: any) => sum + Number(s.done || 0), 0);

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Setores" />
      <main style={{ padding: '28px 32px' }} className="page-main">

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T, letterSpacing: '-0.04em', margin: '0 0 4px' }}>Setores</h1>
            <p style={{ fontSize: 14, color: T2, margin: 0 }}>{setores.length} setores · clique para abrir o dashboard do setor</p>
          </div>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: T, color: S, fontWeight: 800, fontSize: 14, borderRadius: 10, border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Novo Setor
          </button>
        </div>

        {/* Summary strip */}
        {stats.length > 0 && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              { label: 'Em aberto',  value: totalOpen,     color: '#3B82F6', icon: <Activity size={14} /> },
              { label: 'Críticos',   value: totalCritical, color: '#DC2626', icon: <AlertTriangle size={14} /> },
              { label: 'Concluídos', value: totalDone,     color: '#16A34A', icon: <CheckCircle2 size={14} /> },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: S, border: `1px solid ${B}`, borderRadius: 99 }}>
                <span style={{ color: item.color }}>{item.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: item.color, letterSpacing: '-0.02em' }}>{item.value}</span>
                <span style={{ fontSize: 12, color: T3 }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sector cards */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} style={{ height: 160, background: S, border: `1px solid ${B}`, borderRadius: 18 }} className="skeleton" />
            ))}
          </div>
        ) : setores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: T, marginBottom: 8 }}>Nenhum setor cadastrado</p>
            <p style={{ fontSize: 14, color: T3, marginBottom: 24 }}>Crie setores para organizar e rotear chamados automaticamente.</p>
            <button onClick={() => { setEditing(null); setModalOpen(true); }}
              style={{ background: T, color: S, border: 'none', borderRadius: 9, padding: '11px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Criar primeiro setor
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="grid-responsive-3">
            {setores.map(setor => {
              const s = statsMap[setor.name];
              const members = (teamBySetor[setor.name] || []).filter((m: any) => m.is_active);
              const open     = Number(s?.open     || 0);
              const done     = Number(s?.done     || 0);
              const critical = Number(s?.critical || 0);
              const total    = Number(s?.total    || 0);
              const pct      = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div key={setor.id} style={{ position: 'relative' }}>
                  {/* Main card — link to dashboard */}
                  <Link href={`/setores/${setor.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div
                      style={{
                        background: S,
                        border: `1.5px solid ${B}`,
                        borderRadius: 18,
                        padding: '22px 22px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        borderTop: `4px solid ${setor.color}`,
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${setor.color}20`;
                        (e.currentTarget as HTMLElement).style.borderColor = setor.color;
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        (e.currentTarget as HTMLElement).style.borderColor = B;
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Icon + name */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 46, height: 46, borderRadius: 13, background: setor.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                            {setor.icon}
                          </div>
                          <div>
                            <p style={{ fontSize: 15, fontWeight: 800, color: T, margin: '0 0 2px' }}>{setor.name}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Users size={11} color={T3} />
                              <span style={{ fontSize: 11, color: T3 }}>{members.length} membro{members.length !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={16} color={T3} style={{ marginTop: 4 }} />
                      </div>

                      {/* Stats row */}
                      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
                        {[
                          { label: 'Em aberto',  value: open,     color: '#3B82F6' },
                          { label: 'Concluídos', value: done,     color: '#16A34A' },
                          { label: 'Críticos',   value: critical, color: '#DC2626' },
                        ].map((item, i) => (
                          <div key={item.label} style={{
                            flex: 1, textAlign: 'center',
                            paddingLeft: i > 0 ? 0 : 0,
                            borderLeft: i > 0 ? `1px solid ${B}` : 'none',
                          }}>
                            <p style={{ fontSize: 24, fontWeight: 900, color: item.value > 0 ? item.color : T3, margin: '0 0 2px', letterSpacing: '-0.03em' }}>{item.value}</p>
                            <p style={{ fontSize: 10, fontWeight: 600, color: T3, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 10, color: T3, fontWeight: 600 }}>Conclusão</span>
                          <span style={{ fontSize: 10, fontWeight: 800, color: pct > 0 ? '#16A34A' : T3 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: L, borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: setor.color, borderRadius: 99, transition: 'width 0.4s' }} />
                        </div>
                      </div>

                      {/* Team avatars */}
                      {members.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${B}` }}>
                          <div style={{ display: 'flex' }}>
                            {members.slice(0, 5).map((m: any, i: number) => (
                              <div key={m.id} title={m.name} style={{
                                width: 26, height: 26, borderRadius: '50%',
                                background: setor.color + '25',
                                border: `2px solid ${S}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 800, color: setor.color,
                                marginLeft: i > 0 ? -7 : 0,
                              }}>
                                {m.name?.[0]?.toUpperCase()}
                              </div>
                            ))}
                            {members.length > 5 && (
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: L, border: `2px solid ${S}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: T3, marginLeft: -7 }}>
                                +{members.length - 5}
                              </div>
                            )}
                          </div>
                          {critical > 0 && (
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '3px 8px', borderRadius: 99 }}>
                              <AlertTriangle size={10} /> {critical} crítico{critical > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Edit / Delete — hover actions */}
                  <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setEditing(setor); setModalOpen(true); }}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${B}`, background: S, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T3 }}
                      title="Editar setor"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={e => {
                        e.preventDefault(); e.stopPropagation();
                        if (confirm(`Excluir o setor "${setor.name}"? Esta ação não pode ser desfeita.`)) {
                          deleteMut.mutate(setor.id);
                        }
                      }}
                      style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid #FEE2E2`, background: S, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626' }}
                      title="Excluir setor"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
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
