import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  AppFormDialog,
  type AppDialogSize,
  type AppDialogVariant,
} from "@/components/ui/app-dialog";
import { AppFormField } from "@/components/ui/app-form";
import { cn } from "@/lib/utils";

export function KbFormDialog({
  open,
  title,
  titleIcon,
  onClose,
  children,
  footer,
  size = "medium",
  variant = "form",
  className,
}: {
  open: boolean;
  title: string;
  titleIcon?: LucideIcon;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: AppDialogSize;
  variant?: AppDialogVariant;
  className?: string;
}) {
  return (
    <AppFormDialog
      open={open}
      title={title}
      titleIcon={titleIcon}
      onClose={onClose}
      footer={footer}
      size={size}
      variant={variant}
      className={className}
    >
      {children}
    </AppFormDialog>
  );
}

export function KbFormField({
  label,
  icon,
  required,
  children,
  className,
  error,
}: {
  label: string;
  icon?: LucideIcon;
  required?: boolean;
  children: ReactNode;
  className?: string;
  error?: string | null;
}) {
  return (
    <AppFormField
      label={label}
      icon={icon}
      required={required}
      className={cn(className)}
      error={error}
    >
      {children}
    </AppFormField>
  );
}
