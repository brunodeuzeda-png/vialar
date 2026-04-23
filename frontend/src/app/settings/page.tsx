'use client';
import React from 'react';
import Link from 'next/link';
import { MessageCircle, Building2, Users, Bell, Shield, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';

type SectionItem = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  desc: string;
  href: string;
  badge?: string;
};

type Section = { title: string; items: SectionItem[] };

const sections: Section[] = [
  {
    title: 'Integrações',
    items: [
      { icon: MessageCircle, label: 'WhatsApp', desc: 'Conectar número e gerenciar sessão', href: '/settings/whatsapp', badge: 'Configurar' },
    ],
  },
  {
    title: 'Condomínio',
    items: [
      { icon: Building2, label: 'Dados do Condomínio', desc: 'Nome, endereço, unidades', href: '/settings/condominium' },
      { icon: Users, label: 'Usuários e Moradores', desc: 'Gerenciar acessos e perfis', href: '/settings/users' },
      { icon: Bell, label: 'Notificações', desc: 'Preferências de alertas', href: '/settings/notifications' },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Configurações" />
      <main className="flex-1 p-6 max-w-2xl animate-fade-in">
        <div className="mb-6">
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Gerencie o condomínio e integrações</p>
        </div>

        <div className="space-y-6">
          {sections.map(section => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section.title}</p>
              <div className="card divide-y divide-slate-50">
                {section.items.map(({ icon: Icon, label, desc, href, badge }) => (
                  <Link key={href} href={href} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Icon size={18} className="text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    {badge && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-medium">{badge}</span>
                    )}
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
