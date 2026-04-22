'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, MessageCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

const features = [
  { icon: Zap, text: 'Triagem inteligente com IA' },
  { icon: MessageCircle, text: 'Chamados via WhatsApp' },
  { icon: ShieldCheck, text: '44 obrigações de compliance' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — branding */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-violet-900/20" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl">Vialar</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Gestão condominial<br />
            <span className="text-gradient">inteligente</span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Plataforma completa para síndicos e administradoras gerenciarem condomínios com o poder da IA.
          </p>
        </div>

        <div className="relative space-y-3">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Icon size={15} className="text-indigo-300" />
              </div>
              <span className="text-slate-300 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Building2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-900">Vialar</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
            <p className="text-slate-500 mt-1 text-sm">Entre na sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="field">
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="field">
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 text-base"
            >
              {loading ? <Spinner size="sm" className="text-white" /> : (
                <>Entrar <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Não tem conta?{' '}
              <a href="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                Cadastre seu condomínio
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
