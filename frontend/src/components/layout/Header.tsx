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
      height: 60,
      background: '#F8F8F4',
      borderBottom: '1px solid #E8E8E0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky', top: 0, zIndex: 20,
    }}>
      <div>
        {title ? (
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em' }}>{title}</h1>
        ) : (
          <p style={{ fontSize: 15, color: '#888' }}>
            {greeting},{' '}
            <span style={{ fontWeight: 800, color: '#0A0A0A' }}>{user?.name?.split(' ')[0]}</span>
          </p>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button style={{
          position: 'relative', padding: 9, borderRadius: 9,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#999', display: 'flex', alignItems: 'center',
          transition: 'color 0.15s, background 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#333'; (e.currentTarget as HTMLElement).style.background = '#EEEDE8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#999'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
        >
          <Bell size={18} />
          <span style={{
            position: 'absolute', top: 8, right: 8,
            width: 5, height: 5, background: '#EF4444', borderRadius: '50%',
          }} />
        </button>
      </div>
    </header>
  );
}
