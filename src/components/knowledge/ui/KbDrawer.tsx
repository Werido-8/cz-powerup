import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function KbDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  width = 460,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-kb-heading/20">
      <div
        className="flex h-full flex-col border-l border-kb-border bg-card shadow-card-hover"
        style={{ width }}
      >
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-divider px-5">
          <div className="min-w-0">
            <h2 className="truncate text-[16px] font-semibold text-kb-heading">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-[12px] text-kb-muted">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] text-kb-muted hover:bg-kb-surface-hover"
            aria-label="关闭"
          >
            <X className="h-4 w-4 stroke-[1.8]" />
          </button>
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function KbDrawerField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("mb-4 block", className)}>
      <span className="mb-1.5 block text-[12px] font-semibold text-kb-muted">{label}</span>
      {children}
    </label>
  );
}
