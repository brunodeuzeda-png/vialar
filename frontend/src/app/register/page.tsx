'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Building2, User, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || '/v1';

interface FormData {
  adminName: string;
  adminCnpj: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    adminName: '', adminCnpj: '', name: '', email: '', password: '', confirmPassword: '',
  });

  function set(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function formatCnpj(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.adminName.trim()) { setError('Nome da administradora obrigatório'); return; }
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('As senhas não coincidem'); return; }
    if (form.password.length < 8) { setError('Senha deve ter no mínimo 8 caracteres'); return; }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/register`, {
        adminName: form.adminName,
        adminCnpj: form.adminCnpj.replace(/\D/g, '') || undefined,
        name: form.name,
        email: form.email,
        password: form.password,
      });
      // Auto-login after register
      await login(form.email, form.password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: 'var(--bg-2)', border: '1px solid var(--border-2)',
    borderRadius: 'var(--r)' as const, color: 'var(--text)', fontSize: 14,
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* LEFT — Info panel */}
      <div style={{
        flex: '0 0 44%',
        background: 'var(--bg-2)',
        borderRight: '1px solid var(--border)',
        padding: '48px 52px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }} className="hidden-mobile">

        <Logo size={34} />

        <div>
          <h1 style={{
            fontSize: 40, fontWeight: 900, letterSpacing: '-0.04em',
            lineHeight: 1.1, color: 'var(--text)', marginBottom: 20,
          }}>
            Gerencie seus<br />
            <span style={{ color: 'var(--accent)' }}>condomínios</span><br />
            com inteligência.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 340 }}>
            Plataforma completa para administradoras e síndicos.
            Centralize chamados, compliance regulatório e comunicação
            com moradores em um único lugar.
          </p>

          <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { n: '3×', label: 'mais rápido na resolução de chamados' },
              { n: '44', label: 'obrigações regulatórias monitoradas' },
              { n: '100%', label: 'dos prazos de compliance controlados' },
            ].map(({ n, label }) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{
                  fontSize: 22, fontWeight: 900, letterSpacing: '-0.04em',
                  color: 'var(--accent)', minWidth: 52,
                }}>{n}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>© 2026 Vialar · Todos os direitos reservados.</p>
      </div>

      {/* RIGHT — Form */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: s <= step ? 'var(--accent)' : 'var(--surface)',
                  border: `1px solid ${s <= step ? 'var(--accent)' : 'var(--border-2)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                }}>
                  {s < step
                    ? <CheckCircle2 size={14} color="#000" />
                    : <span style={{ fontSize: 11, fontWeight: 700, color: s === step ? '#000' : 'var(--text-3)' }}>{s}</span>
                  }
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: s === step ? 'var(--text)' : 'var(--text-3)' }}>
                  {s === 1 ? 'Administradora' : 'Responsável'}
                </span>
                {s < 2 && <div style={{ width: 28, height: 1, background: 'var(--border-2)', margin: '0 4px' }} />}
              </div>
            ))}
          </div>

          {/* Step 1 — Administradora */}
          {step === 1 && (
            <form onSubmit={nextStep}>
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 34, height: 34, background: 'var(--accent-dim)',
                    borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Building2 size={16} color="var(--accent)" />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>
                    Sua administradora
                  </h2>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 44 }}>
                  Informe os dados da empresa que gerencia os condomínios
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Nome da administradora *
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="Ex: Silva & Associados Gestão Condominial"
                    value={form.adminName}
                    onChange={set('adminName')}
                    required
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-2)')}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    CNPJ <span style={{ fontWeight: 400, opacity: 0.6 }}>(opcional)</span>
                  </label>
                  <input
                    style={inputStyle}
                    placeholder="00.000.000/0001-00"
                    value={form.adminCnpj}
                    onChange={e => setForm(f => ({ ...f, adminCnpj: formatCnpj(e.target.value) }))}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-2)')}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--danger)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px 20px', fontSize: 14 }}>
                  Continuar <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* Step 2 — Responsável */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 28 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16, padding: 0 }}
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, background: 'var(--accent-dim)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={16} color="var(--accent)" />
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>Conta de acesso</h2>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', marginLeft: 44 }}>
                  Dados do responsável que vai administrar a plataforma
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Nome completo *
                  </label>
                  <input style={inputStyle} placeholder="João Silva" value={form.name} onChange={set('name')} required
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-2)')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Email *
                  </label>
                  <input style={inputStyle} type="email" placeholder="joao@administradora.com.br" value={form.email} onChange={set('email')} required
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-2)')} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Senha *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input style={{ ...inputStyle, paddingRight: 44 }} type={showPass ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" value={form.password} onChange={set('password')} required
                      onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border-2)')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Confirmar senha *
                  </label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set('confirmPassword')} required
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border-2)')} />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r)', fontSize: 13, color: 'var(--danger)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '12px 20px', fontSize: 14 }}>
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#000', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Criando conta...
                    </>
                  ) : (
                    <> Criar conta <ArrowRight size={16} /> </>
                  )}
                </button>
              </div>
            </form>
          )}

          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>
            Já tem conta?{' '}
            <a href="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Entrar
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
