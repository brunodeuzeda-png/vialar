'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Condo { id: string; name: string; is_active: boolean; }

interface CondominiumCtx {
  condos: Condo[];
  activeCondo: Condo | null;
  setActiveCondo: (c: Condo) => void;
}

const Ctx = createContext<CondominiumCtx>({ condos: [], activeCondo: null, setActiveCondo: () => {} });

export function CondominiumProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [activeCondo, setActiveCondoState] = useState<Condo | null>(null);

  const isAuthenticated = !!user && !authLoading;

  const { data: condos = [] } = useQuery<Condo[]>({
    queryKey: ['condominiums', 'active'],
    queryFn: () => api.get('/condominiums', { params: { active: 'true' } }).then(r => r.data),
    enabled: isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!condos.length) return;
    const saved = typeof window !== 'undefined' ? localStorage.getItem('active_condo_id') : null;
    const found = saved ? condos.find(c => c.id === saved) : null;
    setActiveCondoState(found || condos[0]);
  }, [condos]);

  function setActiveCondo(c: Condo) {
    setActiveCondoState(c);
    if (typeof window !== 'undefined') localStorage.setItem('active_condo_id', c.id);
  }

  return (
    <Ctx.Provider value={{ condos, activeCondo, setActiveCondo }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCondominium() { return useContext(Ctx); }
