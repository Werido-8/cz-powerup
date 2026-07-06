import { cn } from "@/lib/utils";

export function VersionBadge({
  version,
  muted,
  className,
}: {
  version: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[21px] items-center rounded-full border px-2 text-[10px] font-semibold leading-none",
        muted
          ? "border-[#DDE8EA] bg-[#F7FAFB] text-[#8EA1A8]"
          : "border-[#CFE9ED] bg-[#EAF7F9] text-[#268C9A]",
        className,
      )}
    >
      {version}
    </span>
  );
}
