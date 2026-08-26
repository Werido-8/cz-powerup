import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { LucideIcon } from "lucide-react";
import { Loader2, X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type AppDialogSize = "small" | "compact" | "medium" | "large" | "xlarge" | "full";
export type AppDialogVariant = "form" | "confirm" | "detail";

const sizeWidth: Record<AppDialogSize, string> = {
  small: "w-[480px]",
  compact: "w-[550px]",
  medium: "w-[720px]",
  large: "w-[940px]",
  xlarge: "w-[1040px]",
  full: "w-[min(1320px,calc(100vw-32px))]",
};

export function AppFormDialog({
  open,
  onClose,
  title,
  titleIcon: TitleIcon,
  children,
  footer,
  size = "medium",
  variant = "form",
  className,
  headerRight,
  fillHeight,
  overlayClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  size?: AppDialogSize;
  variant?: AppDialogVariant;
  className?: string;
  headerRight?: ReactNode;
  fillHeight?: boolean;
  overlayClassName?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPortal>
        <DialogPrimitive.Overlay
          className={cn(
            "app-dialog-overlay fixed inset-0 z-50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            overlayClassName,
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-0 z-50 m-auto flex flex-col overflow-hidden border bg-white outline-none",
            fillHeight
              ? "h-[calc(100vh-40px)] max-h-[calc(100vh-40px)]"
              : "h-fit max-h-[calc(100vh-64px)] max-[640px]:max-h-[calc(100vh-32px)]",
            "max-[640px]:max-w-[calc(100vw-32px)]",
            "max-w-[calc(100vw-64px)] rounded-[12px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            sizeWidth[size],
            variant === "form" && "border-[var(--dialog-border)] shadow-[var(--dialog-shadow)]",
            className,
          )}
          style={{
            borderColor: "var(--dialog-border)",
            height: fillHeight ? undefined : "fit-content",
          }}
        >
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--dialog-header-border)] bg-white px-6">
            <div className="flex min-w-0 items-center">
              {TitleIcon && (
                <span
                  className="mr-2.5 grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-white"
                  style={{
                    background: "var(--dialog-title-icon-gradient)",
                    boxShadow: "var(--dialog-title-icon-shadow)",
                  }}
                >
                  <TitleIcon className="h-4 w-4" strokeWidth={1.8} />
                </span>
              )}
              <DialogPrimitive.Title
                className="truncate font-semibold text-[var(--dialog-title-color)]"
                style={{
                  fontSize: "var(--dialog-title-size)",
                  lineHeight: "var(--dialog-title-line-height)",
                }}
              >
                {title}
              </DialogPrimitive.Title>
            </div>
            {headerRight ?? (
              <DialogPrimitive.Close
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-[#61717d] transition-colors",
                  "hover:bg-[#f3f6f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                )}
                aria-label="关闭"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </DialogPrimitive.Close>
            )}
          </header>

          <div
            className={cn(
              "scrollbar-thin overflow-x-hidden bg-white",
              fillHeight ? "flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4" : "shrink-0",
              !fillHeight &&
                variant === "form" &&
                "max-h-[calc(100vh-64px-56px-56px)] overflow-y-auto px-6 py-4 max-[640px]:max-h-[calc(100vh-32px-56px-56px)]",
            )}
          >
            {children}
          </div>

          {footer && (
            <footer className="flex h-14 shrink-0 items-center justify-end gap-2.5 border-t border-[var(--dialog-header-border)] bg-[var(--dialog-footer-bg)] px-6">
              {footer}
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}

export function AppDialogButton({
  variant = "outline",
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline" | "primary";
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        "inline-flex h-9 min-w-[88px] items-center justify-center gap-1.5 rounded-[8px] px-4 text-[13px] font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "outline" &&
          "border border-[#d7e1e6] bg-white text-[#2f424d] hover:bg-[#f5f7f8]",
        variant === "primary" &&
          "border border-primary bg-primary text-white shadow-[var(--dialog-btn-shadow)] hover:border-[var(--dialog-btn-primary-hover)] hover:bg-[var(--dialog-btn-primary-hover)]",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-[17px] w-[17px] animate-spin" strokeWidth={2} />}
      {children}
    </button>
  );
}
