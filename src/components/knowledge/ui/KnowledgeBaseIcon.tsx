import { Library } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  xs: { box: "h-4 w-4 rounded-[4px]", icon: "h-2.5 w-2.5" },
  sm: { box: "h-5 w-5 rounded-[6px]", icon: "h-3 w-3" },
  md: { box: "h-10 w-10 rounded-[10px]", icon: "h-5 w-5" },
} as const;

export function KnowledgeBaseIcon({
  size = "md",
  className,
  iconClassName,
}: {
  size?: keyof typeof SIZE_MAP;
  className?: string;
  iconClassName?: string;
}) {
  const styles = SIZE_MAP[size];

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-primary-soft text-primary",
        styles.box,
        className,
      )}
      aria-hidden
    >
      <Library className={cn("stroke-[1.8]", styles.icon, iconClassName)} />
    </span>
  );
}
