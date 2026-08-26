import { useRef, useState, type ComponentType } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type RowAction = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "default" | "primary" | "danger";
  disabled?: boolean;
  onClick: () => void;
};

export function useHoverMenu(closeDelay = 160) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const openNow = () => {
    clearTimer();
    setOpen(true);
  };
  const closeSoon = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  return {
    open,
    setOpen,
    hoverProps: { onMouseEnter: openNow, onMouseLeave: closeSoon },
  };
}

export function splitRowActions(actions: RowAction[]) {
  if (actions.length <= 3) {
    return { visible: actions, overflow: [] as RowAction[] };
  }
  return { visible: actions.slice(0, 2), overflow: actions.slice(2) };
}

function RowActionButton({ action }: { action: RowAction }) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      disabled={action.disabled}
      onClick={action.onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        action.tone === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : action.tone === "primary"
            ? "text-primary hover:bg-primary-soft"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {action.label}
    </button>
  );
}

export function RowActionBar({
  actions,
  moreAriaLabel,
}: {
  actions: RowAction[];
  moreAriaLabel: string;
}) {
  const { visible, overflow } = splitRowActions(actions);
  const { open, setOpen, hoverProps } = useHoverMenu();

  return (
    <div className="ml-auto inline-flex flex-nowrap items-center justify-end gap-0.5">
      {visible.map((action) => (
        <RowActionButton key={action.key} action={action} />
      ))}
      {overflow.length > 0 ? (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={moreAriaLabel}
              {...hoverProps}
              className="inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
            >
              更多
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40"
            onCloseAutoFocus={(event) => event.preventDefault()}
            {...hoverProps}
          >
            {overflow.map((action) => {
              const Icon = action.icon;
              return (
                <DropdownMenuItem
                  key={action.key}
                  disabled={action.disabled}
                  className={cn(
                    action.tone === "danger" && "text-destructive focus:text-destructive",
                  )}
                  onClick={action.onClick}
                >
                  <Icon className="mr-2 h-3.5 w-3.5" />
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
