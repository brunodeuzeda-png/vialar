'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/utils';
import { useCondominium } from '@/contexts/CondominiumContext';
import Header from '@/components/layout/Header';
import {
  Users, MessageSquare, AlertCircle, ChevronRight,
  Zap, CheckCircle2, Clock, ArrowLeft,
} from 'lucide-react';

const L = '#F8F8F4', S = '#FFFFFF', B = '#E8E8E0';
const T = '#0A0A0A', T2 = '#666', T3 = '#999';
const AC = '#BBFF00';

const SETORES = [
  { name: 'Manutenção',      icon: '🔧', color: '#F59E0B', bg: '#FFFBEB' },
  { name: 'Financeiro',      icon: '💰', color: '#3B82F6', bg: '#EFF6FF' },
  { name: 'Jurídico',        icon: '⚖️', color: '#8B5CF6', bg: '#F5F3FF' },
  { name: 'Atendimento',     icon: '🎧', color: '#EC4899', bg: '#FDF2F8' },
  { name: 'Obras e Reformas',icon: '🏗️', color: '#EA580C', bg: '#FFF7ED' },
  { name: 'Segurança',       icon: '🔒', color: '#DC2626', bg: '#FEF2F2' },
  { name: 'Administrativo',  icon: '📋', color: '#0891B2', bg: '#ECFEFF' },
  { name: 'TI',              icon: '💻', color: '#7C3AED', bg: '#F5F3FF' },
];

const STATUS_CONFIG: Record<string, { label: string; dot: string; color: string }> = {
  ABERTA:               { label: 'Aberta',           dot: '#3B82F6', color: '#1D4ED8' },
  TRIAGEM:              { label: 'Triagem',           dot: '#8B5CF6', color: '#6D28D9' },
  EM_ANDAMENTO:         { label: 'Em andamento',      dot: '#F59E0B', color: '#B45309' },
  AGUARDANDO_ORCAMENTO: { label: 'Aguard. orçamento', dot: '#F97316', color: '#C2410C' },
  AGUARDANDO_APROVACAO: { label: 'Aguard. aprovação', dot: '#EAB308', color: '#854D0E' },
  AGENDADA:             { label: 'Agendada',          dot: '#22C55E', color: '#15803D' },
  CONCLUIDA:            { label: 'Concluída',         dot: '#16A34A', color: '#166534' },
  CANCELADA:            { label: 'Cancelada',         dot: '#9CA3AF', color: '#6B7280' },
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICA: '#DC2626', ALTA: '#EA580C', MEDIA: '#D97706', BAIXA: '#16A34A',
};

export default function SetoresPage() {
  const { activeCondo } = useCondominium();
  const condoId = activeCondo?.id;
  const [selected, setSelected] = useState<string | null>(null);

  // Stats per setor
  const { data: stats = [] } = useQuery<any[]>({
    queryKey: ['demands-by-setor', condoId],
    queryFn: () => api.get('/demands/stats/by-setor', { params: { condominium_id: condoId } }).then(r => r.data),
    enabled: !!condoId,
  });

  // Team members per setor
  const { data: team = [] } = useQuery<any[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data),
    enabled: !!condoId,
  });

  // Demands for selected setor
  const { data: demandsData, isLoading: demandsLoading } = useQuery({
    queryKey: ['demands-setor', selected, condoId],
    queryFn: () => api.get('/demands', {
      params: { condominium_id: condoId, assigned_setor: selected, limit: 50 }
    }).then(r => r.data),
    enabled: !!condoId && !!selected,
  });

  const statsMap = Object.fromEntries(stats.map(s => [s.assigned_setor, s]));
  const teamBySetor = team.reduce((acc: any, m: any) => {
    if (m.setor) { acc[m.setor] = acc[m.setor] || []; acc[m.setor].push(m); }
    return acc;
  }, {} as Record<string, any[]>);

  const selectedSetor = SETORES.find(s => s.name === selected);
  const selectedDemands: any[] = demandsData?.data || [];
  const selectedTeam: any[] = selected ? (teamBySetor[selected] || []) : [];
  const selectedStats = selected ? statsMap[selected] : null;

  return (
    <div style={{ minHeight: '100vh', background: L }}>
      <Header title="Setores" />
      <main style={{ padding: '28px 32px' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: T, letterSpacing: '-0.04em', margin: '0 0 4px' }}>Setores</h1>
            <p style={{ fontSize: 14, color: T2, margin: 0 }}>
              Chamados organizados por setor responsável
            </p>
          </div>
        </div>

        {/* Sector grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {SETORES.map(setor => {
            const s = statsMap[setor.name];
            const members = teamBySetor[setor.name] || [];
            const isActive = selected === setor.name;
            const openCount = Number(s?.open || 0);
            const criticalCount = Number(s?.critical || 0);

            return (
              <button
                key={setor.name}
                onClick={() => setSelected(isActive ? null : setor.name)}
                style={{
                  background: isActive ? setor.bg : S,
                  border: `2px solid ${isActive ? setor.color : B}`,
                  borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                  boxShadow: isActive ? `0 4px 16px ${setor.color}20` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = setor.color + '60'; e.currentTarget.style.background = setor.bg + '80'; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = B; e.currentTarget.style.background = S; } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{setor.icon}</span>
                  {criticalCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 800, background: '#FEF2F2', color: '#DC2626', padding: '2px 7px', borderRadius: 99 }}>
                      {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, fontWeight: 800, color: T, margin: '0 0 10px', lineHeight: 1.3 }}>{setor.name}</p>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 900, color: openCount > 0 ? setor.color : T3, margin: 0, lineHeight: 1 }}>{openCount}</p>
                    <p style={{ fontSize: 10, color: T3, margin: '2px 0 0', fontWeight: 600 }}>em aberto</p>
                  </div>
                  <div style={{ width: 1, background: B }} />
                  <div>
                    <p style={{ fontSize: 20, fontWeight: 900, color: members.length > 0 ? T : T3, margin: 0, lineHeight: 1 }}>{members.length}</p>
                    <p style={{ fontSize: 10, color: T3, margin: '2px 0 0', fontWeight: 600 }}>membro{members.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && selectedSetor && (
          <div>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => setSelected(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: T3, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                >
                  <ArrowLeft size={13} /> Todos os setores
                </button>
                <span style={{ color: B }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{selectedSetor.icon}</span>
                  <h2 style={{ fontSize: 18, fontWeight: 900, color: T, margin: 0 }}>{selectedSetor.name}</h2>
                </div>
                {selectedStats && (
                  <div style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: selectedSetor.bg, color: selectedSetor.color, padding: '3px 10px', borderRadius: 99 }}>
                      {selectedStats.open} em aberto
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, background: '#F0FDF4', color: '#16A34A', padding: '3px 10px', borderRadius: 99 }}>
                      {selectedStats.done} concluídos
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

              {/* Demands list */}
              <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAF8' }}>
                  <MessageSquare size={14} color={selectedSetor.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T, letterSpacing: '0.04em' }}>CHAMADOS ATRIBUÍDOS</span>
                </div>

                {demandsLoading && (
                  <div style={{ padding: 20 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{ height: 56, background: L, borderRadius: 8, marginBottom: 8 }} />
                    ))}
                  </div>
                )}

                {!demandsLoading && selectedDemands.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 32px', color: T3 }}>
                    <CheckCircle2 size={32} color={B} style={{ marginBottom: 12 }} />
                    <p style={{ fontWeight: 700, color: T, margin: '0 0 4px' }}>Nenhum chamado atribuído</p>
                    <p style={{ fontSize: 13, margin: 0 }}>Todos os chamados deste setor foram resolvidos.</p>
                  </div>
                )}

                {!demandsLoading && selectedDemands.map((d: any) => {
                  const sCfg = STATUS_CONFIG[d.status] || { label: d.status, dot: T3, color: T3 };
                  return (
                    <Link
                      key={d.id}
                      href={`/demands/${d.id}`}
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: `1px solid ${B}`, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = L)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Priority indicator */}
                      <div style={{ width: 4, height: 40, borderRadius: 99, background: PRIORITY_COLOR[d.priority] || B, flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: T, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </p>
                        <p style={{ fontSize: 12, color: T3, margin: 0 }}>
                          {d.requester_name}{d.unit_identifier ? ` · Apt ${d.unit_identifier}` : ''} · {timeAgo(d.created_at)}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {d.ai_triage_data && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: AC + '20', color: '#5A7A00', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>
                            <Zap size={9} /> IA
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 99, background: sCfg.dot + '18', fontSize: 11, fontWeight: 600, color: sCfg.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sCfg.dot }} />
                          {sCfg.label}
                        </span>
                        <ChevronRight size={14} color={T3} />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Team members sidebar */}
              <div style={{ background: S, border: `1px solid ${B}`, borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${B}`, display: 'flex', alignItems: 'center', gap: 8, background: '#FAFAF8' }}>
                  <Users size={14} color={selectedSetor.color} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T, letterSpacing: '0.04em' }}>EQUIPE DO SETOR</span>
                </div>

                {selectedTeam.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: T3 }}>
                    <Users size={28} color={B} style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: T, margin: '0 0 4px' }}>Sem membros</p>
                    <p style={{ fontSize: 12, margin: 0 }}>Adicione funcionários a este setor na página Equipe.</p>
                  </div>
                ) : (
                  <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedTeam.map((m: any) => (
                      <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: L, borderRadius: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: selectedSetor.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: selectedSetor.color, flexShrink: 0 }}>
                          {m.name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: T, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.name}
                          </p>
                          <p style={{ fontSize: 11, color: T3, margin: 0 }}>
                            {m.funcao || m.role}
                          </p>
                        </div>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.is_active ? '#22C55E' : B, flexShrink: 0 }} title={m.is_active ? 'Ativo' : 'Inativo'} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats summary */}
                {selectedStats && (
                  <div style={{ padding: '12px 16px', borderTop: `1px solid ${B}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Total', value: selectedStats.total, color: T },
                      { label: 'Em aberto', value: selectedStats.open, color: selectedSetor.color },
                      { label: 'Concluídos', value: selectedStats.done, color: '#16A34A' },
                      { label: 'Críticos', value: selectedStats.critical, color: '#DC2626' },
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

        {/* Empty state when no setor selected */}
        {!selected && stats.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 32px', background: S, border: `1px solid ${B}`, borderRadius: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: T, margin: '0 0 6px' }}>Nenhum chamado atribuído ainda</p>
            <p style={{ fontSize: 14, color: T3, margin: 0 }}>Abra um chamado e execute a triagem IA para encaminhar automaticamente ao setor responsável.</p>
          </div>
        )}

      </main>
    </div>
  );
}
