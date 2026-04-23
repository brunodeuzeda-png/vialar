'use client';
import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps { title?: string; }

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <header style={{
      height: 56,
      background: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div>
        {title ? (
          <h1 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h1>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {greeting},{' '}
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</span>
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={{
          position: 'relative', padding: 8, borderRadius: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-2)', display: 'flex', alignItems: 'center',
          transition: 'color 0.15s, background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          <Bell size={17} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 5, height: 5, background: 'var(--danger)',
            borderRadius: '50%',
          }} />
        </button>
      </div>
    </header>
  );
}
