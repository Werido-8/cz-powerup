import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function KbButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger-text" | "primary-light";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    "primary-light":
      "border border-primary/25 bg-primary-soft text-accent-foreground hover:bg-primary-soft/80",
    outline:
      "border border-kb-border bg-card text-kb-body hover:bg-kb-surface-hover hover:border-primary/30",
    ghost: "text-kb-muted hover:bg-kb-surface-hover hover:text-kb-body",
    "danger-text": "text-destructive hover:bg-danger-soft",
  };
  const sizes = {
    sm: "h-8 px-2.5 text-[12px]",
    md: "h-9 px-3.5 text-[12.5px]",
  };
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[8px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function KbIconButton({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
  className,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-[8px] text-kb-muted transition-colors duration-150 hover:bg-kb-surface-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-45",
              active && "bg-primary-soft text-primary",
              className,
            )}
          >
            <Icon className="h-4 w-4 stroke-[1.8]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[12px]">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function KbIconTextButton({
  icon: Icon,
  label,
  variant = "ghost",
  onClick,
  disabled,
  className,
}: {
  icon: LucideIcon;
  label: string;
  variant?: "ghost" | "primary-light" | "danger-text" | "primary-text";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    ghost: "text-kb-muted hover:bg-kb-surface-hover hover:text-primary",
    "primary-light":
      "border border-primary/20 bg-primary-soft text-accent-foreground hover:bg-primary-soft/80",
    "primary-text": "text-primary hover:text-primary/80",
    "danger-text": "text-destructive hover:bg-danger-soft",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
      {label}
    </button>
  );
}
