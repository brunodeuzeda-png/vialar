import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { locale: ptBR, addSuffix: true });
}

export const DEMAND_STATUS_LABELS: Record<string, string> = {
  ABERTA: 'Aberta',
  TRIAGEM: 'Em triagem',
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_ORCAMENTO: 'Aguardando orçamento',
  AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  AGENDADA: 'Agendada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const DEMAND_STATUS_COLORS: Record<string, string> = {
  ABERTA: 'bg-blue-100 text-blue-800',
  TRIAGEM: 'bg-yellow-100 text-yellow-800',
  EM_ANDAMENTO: 'bg-orange-100 text-orange-800',
  AGUARDANDO_ORCAMENTO: 'bg-purple-100 text-purple-800',
  AGUARDANDO_APROVACAO: 'bg-indigo-100 text-indigo-800',
  AGENDADA: 'bg-cyan-100 text-cyan-800',
  CONCLUIDA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-gray-100 text-gray-800',
};

export const PRIORITY_COLORS: Record<string, string> = {
  CRITICA: 'bg-red-100 text-red-800',
  ALTA: 'bg-orange-100 text-orange-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  BAIXA: 'bg-green-100 text-green-800',
};

export const COMPLIANCE_COLORS = (daysLeft: number): string => {
  if (daysLeft <= 7) return 'bg-red-100 text-red-800';
  if (daysLeft <= 30) return 'bg-orange-100 text-orange-800';
  if (daysLeft <= 90) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};
