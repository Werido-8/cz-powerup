import type { ReactNode } from "react";
import { AdaptiveFilterSelect } from "@/components/learning/ui";
import { SearchInput } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export function KbFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "搜索",
  searchClassName,
  filters,
  trailing,
  className,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchClassName?: string;
  filters?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      {onSearchChange !== undefined && (
        <SearchInput
          value={searchValue ?? ""}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className={cn("h-9 min-w-[200px] max-w-[320px] flex-1 !rounded-[8px] py-0", searchClassName)}
        />
      )}
      {filters}
      {trailing && <div className="ml-auto flex items-center gap-2">{trailing}</div>}
    </div>
  );
}

export function KbFilterSelect({
  options,
  value,
  onChange,
  placeholder,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <AdaptiveFilterSelect
      options={options}
      value={value}
      onChange={onChange}
      comboPlaceholder={placeholder}
      className={cn("h-9 min-w-[120px] rounded-[8px]", className)}
    />
  );
}
