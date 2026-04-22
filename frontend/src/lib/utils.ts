import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return `hoje às ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `ontem às ${format(d, 'HH:mm')}`;
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true });
}

export function formatShortDate(date: string | Date): string {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  return format(d, 'dd MMM', { locale: ptBR });
}

// Demand status
export const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  TRIAGEM: 'Em triagem',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_ORCAMENTO: 'Aguard. orçamento',
  AGUARDANDO_APROVACAO: 'Aguard. aprovação',
  AGENDADA: 'Agendada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const STATUS_COLOR: Record<string, string> = {
  ABERTA: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  TRIAGEM: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  EM_ANDAMENTO: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  AGUARDANDO_ORCAMENTO: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  AGUARDANDO_APROVACAO: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  AGENDADA: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  CONCLUIDA: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  CANCELADA: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
};

export const STATUS_DOT: Record<string, string> = {
  ABERTA: 'bg-blue-500',
  TRIAGEM: 'bg-violet-500',
  EM_ANDAMENTO: 'bg-amber-500',
  AGUARDANDO_ORCAMENTO: 'bg-purple-500',
  AGUARDANDO_APROVACAO: 'bg-indigo-500',
  AGENDADA: 'bg-cyan-500',
  CONCLUIDA: 'bg-emerald-500',
  CANCELADA: 'bg-slate-400',
};

export const PRIORITY_LABEL: Record<string, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

export const PRIORITY_COLOR: Record<string, string> = {
  CRITICA: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  ALTA: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  MEDIA: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  BAIXA: 'bg-green-50 text-green-700 ring-1 ring-green-200',
};

export const CATEGORY_LABEL: Record<string, string> = {
  MANUTENCAO: 'Manutenção',
  LIMPEZA: 'Limpeza',
  SEGURANCA: 'Segurança',
  FINANCEIRO: 'Financeiro',
  BARULHO: 'Barulho',
  INFRAESTRUTURA: 'Infraestrutura',
  ADMINISTRATIVO: 'Administrativo',
  OUTRO: 'Outro',
};

export const CATEGORY_ICON: Record<string, string> = {
  MANUTENCAO: '🔧',
  LIMPEZA: '🧹',
  SEGURANCA: '🔒',
  FINANCEIRO: '💰',
  BARULHO: '🔊',
  INFRAESTRUTURA: '🏗️',
  ADMINISTRATIVO: '📋',
  OUTRO: '📌',
};

export function complianceDaysColor(days: number): string {
  if (days <= 7) return 'bg-red-50 text-red-700 ring-1 ring-red-200';
  if (days <= 30) return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
  if (days <= 90) return 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200';
  return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
}
