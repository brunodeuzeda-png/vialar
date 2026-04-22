'use client';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        {title ? (
          <h1 className="font-semibold text-slate-900">{title}</h1>
        ) : (
          <p className="text-slate-600 text-sm">
            {greeting}, <span className="font-semibold text-slate-900">{user?.name?.split(' ')[0]}</span> 👋
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}
