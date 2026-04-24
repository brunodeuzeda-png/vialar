'use client';
import { useState } from 'react';
import { Bell, ChevronDown, Building2, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCondominium } from '@/contexts/CondominiumContext';

const T = '#0A0A0A', T2 = '#666', T3 = '#999', B = '#E8E8E0', S = '#FFFFFF', L = '#F8F8F4';

interface HeaderProps { title?: string; }

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const { condos, activeCondo, setActiveCondo } = useCondominium();
  const [open, setOpen] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <header style={{
      height: 60, background: L, borderBottom: `1px solid ${B}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px 0 72px', position: 'sticky', top: 0, zIndex: 20,
    }} className="responsive-header">
      <div>
        {title ? (
          <h1 style={{ fontSize: 16, fontWeight: 800, color: T, letterSpacing: '-0.02em' }}>{title}</h1>
        ) : (
          <p style={{ fontSize: 15, color: T3 }}>
            {greeting},{' '}
            <span style={{ fontWeight: 800, color: T }}>{user?.name?.split(' ')[0]}</span>
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Condo selector — only show if admin has condos */}
        {condos.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 12px', background: S, border: `1.5px solid ${B}`,
                borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = T)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = B)}
            >
              <Building2 size={14} color={T3} />
              <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeCondo?.name || 'Selecionar condomínio'}
              </span>
              {condos.length > 1 && <ChevronDown size={13} color={T3} />}
            </button>

            {open && condos.length > 1 && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 29 }} onClick={() => setOpen(false)} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: S, border: `1px solid ${B}`, borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: 220, zIndex: 30,
                  padding: 6, overflow: 'hidden',
                }}>
                  {condos.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setActiveCondo(c); setOpen(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', background: 'none', border: 'none',
                        borderRadius: 7, cursor: 'pointer', textAlign: 'left',
                        fontSize: 13, fontWeight: activeCondo?.id === c.id ? 700 : 500,
                        color: T, transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = L)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Building2 size={13} color={T3} style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                      {activeCondo?.id === c.id && <Check size={13} color="#16A34A" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Bell */}
        <button style={{
          position: 'relative', padding: 9, borderRadius: 9,
          background: 'none', border: 'none', cursor: 'pointer',
          color: T3, display: 'flex', alignItems: 'center',
          transition: 'color 0.15s, background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#333'; (e.currentTarget as HTMLElement).style.background = '#EEEDE8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T3; (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          <Bell size={18} />
          <span style={{ position: 'absolute', top: 8, right: 8, width: 5, height: 5, background: '#EF4444', borderRadius: '50%' }} />
        </button>
      </div>
    </header>
  );
}
