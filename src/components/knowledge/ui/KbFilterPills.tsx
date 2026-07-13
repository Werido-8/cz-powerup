import { ChevronDown } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** 标签 + 当前值 + 下拉的筛选控件，视觉对齐「我的上传」分类筛选 */
export function KbFilterPills<T extends string>({
  value,
  onChange,
  options,
  label,
  align = "start",
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  label: string;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCEBED] bg-white px-3 text-[12.5px] text-[#334E59] transition-colors hover:border-primary/35 hover:text-primary data-[state=open]:border-primary/30 data-[state=open]:text-primary",
            className,
          )}
        >
          <span className="text-kb-muted">{label}</span>
          <span className="max-w-[140px] truncate font-medium">{selected?.label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 stroke-[1.8] text-kb-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className="max-h-[320px] min-w-[140px] overflow-y-auto"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              "text-[12.5px]",
              value === option.value && "font-medium text-primary",
            )}
            onClick={() => {
              onChange(option.value);
              setOpen(false);
            }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
