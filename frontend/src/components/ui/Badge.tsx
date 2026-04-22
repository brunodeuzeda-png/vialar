import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  dot?: string;
}

export function Badge({ children, className, dot }: BadgeProps) {
  return (
    <span className={cn('badge', className)}>
      {dot && <span className={cn('status-dot mr-1.5', dot)} />}
      {children}
    </span>
  );
}
