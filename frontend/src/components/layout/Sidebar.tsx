'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, MessageSquare, ShieldCheck, Wrench,
  DollarSign, MessageCircle, Settings, LogOut, Zap, Building2, Users, Layers, X
} from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { useState } from 'react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/condominiums', label: 'Condomínios', icon: Building2 },
  { href: '/demands', label: 'Chamados', icon: MessageSquare },
  { href: '/setores', label: 'Setores', icon: Layers },
  { href: '/team', label: 'Equipe', icon: Users },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/financial', label: 'Financeiro', icon: DollarSign },
  { href: '/providers', label: 'Prestadores', icon: Wrench },
  { href: '/communications', label: 'WhatsApp', icon: MessageCircle },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <aside style={{
      width: '100%',
      height: '100%',
      background: 'var(--bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Logo size={30} />
        {onClose && (
          <button
            onClick={onClose}
            className="show-mobile"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 6, borderRadius: 6 }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* AI badge */}
      <div style={{ padding: '14px 14px 4px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--accent-dim)',
          border: '1px solid rgba(124,92,252,0.2)',
          borderRadius: 8, padding: '7px 12px',
        }}>
          <Zap size={13} color="var(--accent-2)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-2)' }}>IA ativa</span>
          <span style={{
            marginLeft: 'auto', width: 6, height: 6,
            background: 'var(--success)', borderRadius: '50%',
            boxShadow: '0 0 6px var(--success)',
          }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', padding: '6px 10px 4px' }}>
          MENU
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                fontWeight: active ? 600 : 500,
                fontSize: 13,
                color: active ? 'var(--text)' : 'var(--text-2)',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; } }}
            >
              <Icon
                size={16}
                color={active ? 'var(--accent)' : 'currentColor'}
                style={{ flexShrink: 0 }}
              />
              {label}
              {active && (
                <span style={{
                  marginLeft: 'auto', width: 4, height: 4,
                  background: 'var(--accent-2)', borderRadius: '50%',
                }} />
              )}
            </Link>
          );
        })}

        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', padding: '0 10px 6px' }}>
            SISTEMA
          </p>
          {[{ href: '/settings', label: 'Configurações', icon: Settings }].map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8,
                  fontWeight: active ? 600 : 500, fontSize: 13,
                  color: active ? 'var(--text)' : 'var(--text-2)',
                  background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', borderRadius: 9,
          background: 'var(--surface)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent), #AADD00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize', marginTop: 1 }}>
              {user?.role?.toLowerCase()}
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sair"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', padding: 6, borderRadius: 6,
              display: 'flex', alignItems: 'center', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
