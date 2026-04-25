'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Zap, MessageCircle, Shield } from 'lucide-react';
import Logo from '@/components/ui/Logo';

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
      setError('Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { icon: Zap, label: 'Triagem automática com IA', desc: 'Cada chamado classificado em segundos' },
    { icon: MessageCircle, label: 'Chamados via WhatsApp', desc: 'Moradores abrem chamados pelo celular' },
    { icon: Shield, label: '44 obrigações monitoradas', desc: 'Alertas proativos antes dos vencimentos' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── LEFT — preta com destaque lima ── */}
      <div
        className="hidden-mobile"
        style={{
          flex: '0 0 50%',
          background: '#000',
          padding: '52px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Logo size={38} />

        <div>
          <h1 style={{
            fontSize: 52,
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.06,
            color: '#fff',
            marginBottom: 24,
          }}>
            Gestão condominial<br />
            <span style={{ color: '#BBFF00' }}>inteligente.</span>
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 400 }}>
            Síndicos e administradoras que usam Vialar resolvem
            chamados 3× mais rápido e nunca perdem prazos regulatórios.
          </p>

          <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{
                  width: 42, height: 42, flexShrink: 0,
                  background: 'rgba(187,255,0,0.1)',
                  border: '1px solid rgba(187,255,0,0.25)',
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} color="#BBFF00" />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{label}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Vialar · Todos os direitos reservados.
        </p>
      </div>

      {/* ── RIGHT — branca com form escuro ── */}
      <div style={{
        flex: 1,
        background: '#F5F5F0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '52px 48px',
      }}>
        {/* Mobile logo */}
        <div className="show-mobile" style={{ marginBottom: 40 }}>
          <Logo size={36} variant="light" />
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#0A0A0A',
              marginBottom: 10,
            }}>
              Bem-vindo de volta
            </h2>
            <p style={{ fontSize: 16, color: '#666', lineHeight: 1.5 }}>
              Entre na sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 700,
                color: '#333', marginBottom: 8, letterSpacing: '0.01em',
              }}>
                Email
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%', padding: '14px 16px',
                  background: '#fff',
                  border: '1.5px solid #D8D8D0',
                  borderRadius: 10,
                  fontSize: 16, color: '#0A0A0A',
                  fontFamily: 'inherit', outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#BBFF00';
                  e.target.style.boxShadow = '0 0 0 3px rgba(187,255,0,0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#D8D8D0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: 13, fontWeight: 700,
                color: '#333', marginBottom: 8, letterSpacing: '0.01em',
              }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '14px 48px 14px 16px',
                    background: '#fff',
                    border: '1.5px solid #D8D8D0',
                    borderRadius: 10,
                    fontSize: 16, color: '#0A0A0A',
                    fontFamily: 'inherit', outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#BBFF00';
                    e.target.style.boxShadow = '0 0 0 3px rgba(187,255,0,0.2)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#D8D8D0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#999', padding: 4, display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#FFF0F0',
                border: '1.5px solid #FFD0D0',
                borderRadius: 10,
                fontSize: 14, color: '#CC3333', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '15px 24px',
                background: '#0A0A0A', color: '#fff',
                fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em',
                borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.15s, transform 0.1s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget.style.transform = 'translateY(-1px)'); }}
              onMouseLeave={e => { (e.currentTarget.style.transform = 'none'); }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 18, height: 18,
                    border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    borderRadius: '50%', display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Entrando...
                </>
              ) : (
                <> Entrar <ArrowRight size={18} /> </>
              )}
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: 15, color: '#888', textAlign: 'center' }}>
            Não tem conta?{' '}
            <a href="/register" style={{ color: '#0A0A0A', fontWeight: 800, textDecoration: 'none', borderBottom: '2px solid #BBFF00' }}>
              Cadastre sua administradora
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .hidden-mobile { display: flex; flex-direction: column; }
        .show-mobile { display: none; }
        @media (max-width: 767px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}
