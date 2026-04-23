'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Zap, MessageCircle, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* LEFT — Brand panel */}
      <div style={{
        flex: '0 0 52%',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        padding: '48px 56px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }} className="hidden-mobile">

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: '-0.02em' }}>V</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>Vialar</span>
        </div>

        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-dim)', borderRadius: 99,
            padding: '5px 14px', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--accent-2)', borderRadius: '50%', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-2)', letterSpacing: '0.04em' }}>
              Powered by Claude AI
            </span>
          </div>
          <h1 style={{
            fontSize: 44, fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-0.04em', color: 'var(--text)', marginBottom: 20,
          }}>
            Gestão condominial<br />
            <span style={{ color: 'var(--text-2)' }}>inteligente.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65, maxWidth: 380 }}>
            Síndicos que usam Vialar resolvem chamados 3× mais rápido
            e nunca perdem prazos regulatórios.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { icon: Zap, label: 'Triagem automática com IA', desc: 'Claude classifica cada chamado instantaneamente' },
            { icon: MessageCircle, label: 'Chamados via WhatsApp', desc: 'Moradores abrem chamados pelo celular' },
            { icon: Shield, label: '44 obrigações de compliance', desc: 'Alertas proativos antes dos vencimentos' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 36, height: 36, flexShrink: 0,
                background: 'var(--surface)', border: '1px solid var(--border-2)',
                borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={16} color="var(--accent-2)" />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>© 2026 Vialar · Todos os direitos reservados.</p>
      </div>

      {/* RIGHT — Login form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 8 }}>
              Bem-vindo de volta
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)' }}>Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label>Email</label>
              <input
                className="input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                background: 'var(--danger-dim)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--r)',
                fontSize: 13, color: 'var(--danger)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '12px 20px', fontSize: 14, marginTop: 4 }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--bg)',
                    borderRadius: '50%', display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Entrando...
                </>
              ) : (
                <> Entrar <ArrowRight size={16} /> </>
              )}
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            Não tem conta?{' '}
            <a href="/register" style={{ color: 'var(--accent-2)', fontWeight: 600, textDecoration: 'none' }}>
              Cadastre seu condomínio
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 767px) { .hidden-mobile { display: none !important; } }
      `}</style>
    </div>
  );
}
