import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, House } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LearningPageShell } from "@/components/learning/learning-breadcrumb";
import { cn } from "@/lib/utils";

export { LearningPageShell as TrainingPageShell };

export type TrainingNavPageKey =
  | "practice"
  | "custom-exam"
  | "exam"
  | "wrong"
  | "records"
  | "growth";

const NAV_PAGES: {
  key: TrainingNavPageKey;
  label: string;
  to:
    | "/training/practice"
    | "/training/custom-exam"
    | "/training/exam"
    | "/training/wrong"
    | "/training/records"
    | "/training/growth";
}[] = [
  { key: "practice", label: "专项练习", to: "/training/practice" },
  { key: "custom-exam", label: "自主组卷", to: "/training/custom-exam" },
  { key: "exam", label: "正式考试", to: "/training/exam" },
  { key: "wrong", label: "错题本", to: "/training/wrong" },
  { key: "records", label: "训练记录", to: "/training/records" },
  { key: "growth", label: "成长反馈", to: "/training/growth" },
];

function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      to="/training"
      className={cn(
        "inline-flex items-center gap-1 text-kb-muted transition-colors hover:text-primary",
        className,
      )}
    >
      <House className="h-3.5 w-3.5 stroke-[1.8]" aria-hidden />
      训练中心
    </Link>
  );
}

export function TrainingBreadcrumb({
  current,
  className,
}: {
  current: TrainingNavPageKey;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentPage = NAV_PAGES.find((page) => page.key === current) ?? NAV_PAGES[0];

  return (
    <nav
      aria-label="页面导航"
      className={cn("mb-2 flex h-[22px] shrink-0 items-center text-[12px] leading-none", className)}
    >
      <HomeLink />
      <ChevronRight className="mx-1 h-3 w-3 shrink-0 text-kb-muted/40" aria-hidden />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`切换页面，当前为${currentPage.label}`}
            className={cn(
              "inline-flex items-center gap-0.5 text-left text-kb-body transition-colors",
              "hover:text-primary focus-visible:outline-none",
              open && "text-primary",
            )}
          >
            <span className={cn("truncate", open && "underline")}>{currentPage.label}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-kb-muted/70" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[min(220px,calc(100vw-2rem))] border-divider p-1 shadow-[0_8px_24px_rgba(31,52,64,0.08)]"
        >
          <ul className="py-0.5">
            {NAV_PAGES.map((page) => {
              const selected = page.key === current;
              return (
                <li key={page.key}>
                  <Link
                    to={page.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-8 w-full items-center rounded-[6px] px-2.5 text-left text-[12.5px] transition-colors",
                      selected
                        ? "bg-primary-soft font-medium text-accent-foreground"
                        : "text-kb-body hover:bg-[#F4FAFB]",
                    )}
                  >
                    {page.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
    </nav>
  );
}

export function TrainingPageFrame({
  current,
  children,
  className,
}: {
  current: TrainingNavPageKey;
  children: ReactNode;
  className?: string;
}) {
  return (
    <LearningPageShell className={className}>
      <TrainingBreadcrumb current={current} />
      {children}
    </LearningPageShell>
  );
}
