import { cn } from "@/lib/utils";

/**
 * Lucide Library 书脊 + 右上角线框加号。
 */
export function KnowledgeBasePlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-3.5 w-3.5 shrink-0 stroke-[1.8]", className)}
      aria-hidden
    >
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
      <path d="M21 3v7" />
      <path d="M17.5 6.5h7" />
    </svg>
  );
}
