interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-6 mb-8">
      <div>
        <h1 className="font-serif text-2xl font-medium tracking-tight text-[var(--text)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
