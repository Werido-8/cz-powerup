import { Link } from "@tanstack/react-router";
import { EmptyState, ActionButton } from "@/components/learning/ui";

export function KbEmptyState({
  title,
  description,
  actionLabel,
  actionTo,
}: {
  title?: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      action={
        actionLabel && actionTo ? (
          <Link to={actionTo} params={{ deptId: "dept-run" }}>
            <ActionButton>{actionLabel}</ActionButton>
          </Link>
        ) : undefined
      }
    />
  );
}
