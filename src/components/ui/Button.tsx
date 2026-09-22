import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--text)] text-[var(--text-inverse)] hover:bg-[var(--accent-soft)]',
  secondary:
    'border border-[var(--border-strong)] text-[var(--text)] hover:bg-[var(--bg-muted)]',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text)]',
  danger:
    'text-[var(--danger)] hover:bg-[var(--danger-bg)]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-[var(--radius-sm)]
        transition-colors duration-150
        disabled:opacity-40 disabled:pointer-events-none
        ${variants[variant]}
        ${sizeClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
