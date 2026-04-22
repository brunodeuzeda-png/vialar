import { cn } from '@/lib/utils';

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={cn('animate-spin rounded-full border-2 border-current border-t-transparent', sizes[size], className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" className="text-indigo-600" />
        <p className="text-sm text-slate-400 font-medium">Carregando...</p>
      </div>
    </div>
  );
}
