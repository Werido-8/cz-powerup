import type { ReactNode } from "react";
import { EmptyState } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export function KbEmptyState({
  title,
  description,
  action,
  className,
}: {
  title?: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-6", className)}>
      <EmptyState title={title} description={description} action={action} />
    </div>
  );
}
