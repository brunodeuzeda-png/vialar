'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import { PageLoader } from '@/components/ui/Spinner';
import { Menu } from 'lucide-react';

const SIDEBAR_W = 264;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  if (loading) return <PageLoader />;
  if (!user) return null;

  // Detail pages get full-screen layout (no sidebar)
  const isFullscreen = /^\/setores\/.+/.test(pathname);

  if (isFullscreen) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#F8F8F4' }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* ── Sidebar (always position:fixed) ── */}
      <div style={{
        position: 'fixed',
        left: 0, top: 0, bottom: 0,
        width: SIDEBAR_W,
        height: '100vh',
        zIndex: 30,
        transform: isMobile && !sidebarOpen ? `translateX(-${SIDEBAR_W}px)` : 'translateX(0)',
        transition: 'transform 0.25s ease',
      }}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Mobile overlay ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 25,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Menu"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'fixed', top: 14, left: 14, zIndex: 40,
            width: 38, height: 38,
            background: 'var(--surface)',
            border: '1px solid var(--border-2)',
            borderRadius: 9,
            cursor: 'pointer',
            color: 'var(--text)',
          }}
        >
          <Menu size={18} />
        </button>
      )}

      {/* ── Main content ── */}
      <div style={{
        marginLeft: isMobile ? 0 : SIDEBAR_W,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    </div>
  );
}
