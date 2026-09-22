import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({
  children,
  className = '',
  padding = true,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-[var(--bg-elevated)]
        border border-[var(--border)]
        rounded-[var(--radius)]
        shadow-[var(--shadow-sm)]
        ${padding ? 'p-5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
