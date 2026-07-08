import { FilterComboSelect } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

/** 知识库筛选下拉：始终使用 Combo 样式，避免选项少时变成 Pill 按钮 */
export function KbFilterCombo({
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
    <FilterComboSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn("h-9 min-w-[120px] rounded-[8px]", className)}
    />
  );
}
