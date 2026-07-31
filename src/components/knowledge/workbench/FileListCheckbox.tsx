import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileListCheckbox({
  checked,
  indeterminate,
  disabled,
  onCheckedChange,
  className,
  "aria-label": ariaLabel,
}: {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const state = indeterminate ? "indeterminate" : checked;

  return (
    <CheckboxPrimitive.Root
      checked={state}
      disabled={disabled}
      onCheckedChange={(value) => onCheckedChange?.(value === true)}
      aria-label={ariaLabel}
      className={cn(
        "grid h-4 w-4 shrink-0 place-content-center rounded-[3px] border border-[#b8c9d0] bg-white shadow-none",
        "cursor-pointer transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
        {indeterminate ? (
          <Minus className="h-3 w-3 stroke-[2.5]" />
        ) : (
          <Check className="h-3 w-3 stroke-[2.5]" />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
