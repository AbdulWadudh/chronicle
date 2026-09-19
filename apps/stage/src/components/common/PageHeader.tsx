import type { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function PageHeader({ title, leading, trailing }: PageHeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 pb-4">
      {leading}
      <h1 className="flex-1 truncate text-xl font-semibold tracking-[-0.02em] text-text-primary">
        {title}
      </h1>
      {trailing}
    </header>
  );
}
