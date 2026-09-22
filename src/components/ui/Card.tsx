interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: CardProps) {
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
    >
      {children}
    </div>
  );
}
