'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, MessageSquare, ShieldCheck, Wrench,
  DollarSign, MessageCircle, Settings, LogOut, Building2,
  ChevronRight, Bell, Zap
} from 'lucide-react';
import { useState } from 'react';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/demands', label: 'Chamados', icon: MessageSquare, badge: null },
  { href: '/compliance', label: 'Compliance', icon: ShieldCheck },
  { href: '/providers', label: 'Prestadores', icon: Wrench },
  { href: '/financial', label: 'Financeiro', icon: DollarSign },
  { href: '/communications', label: 'WhatsApp', icon: MessageCircle },
];

const bottom = [
  { href: '/settings', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const initial = user?.name?.[0]?.toUpperCase() ?? '?';

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <aside className="w-64 bg-slate-900 flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-tight">Vialar</span>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Gestão Condominial</p>
          </div>
        </div>
      </div>

      {/* AI badge */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl px-3 py-2">
          <Zap size={13} className="text-indigo-400" />
          <span className="text-xs text-indigo-300 font-medium">IA ativa</span>
          <span className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 pb-2 space-y-0.5">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Menu</p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={cn('nav-item', active ? 'nav-item-active' : 'nav-item-inactive')}>
              <Icon size={17} />
              <span>{label}</span>
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Sistema</p>
          {bottom.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={cn('nav-item', active ? 'nav-item-active' : 'nav-item-inactive')}>
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{user?.name}</p>
            <p className="text-xs text-slate-500 leading-tight capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sair"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
