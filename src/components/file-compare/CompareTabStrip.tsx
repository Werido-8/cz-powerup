import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { House, RotateCw, X } from "lucide-react";
import { toast } from "sonner";
import { KbIconButton } from "@/components/knowledge/ui";

/**
 * 文件比对工作区的二级页签栏：首页 + 当前打开的「文件比对」页签。
 * 与顶部导航同宽通栏，位于 Header 之下。
 */
export function CompareTabStrip() {
  const router = useRouter();
  const navigate = useNavigate();

  return (
    <div className="flex h-9 w-full shrink-0 items-center gap-1 border-b border-border/70 bg-white px-3 sm:px-4">
      <Link
        to="/"
        className="inline-flex h-[26px] items-center gap-1.5 rounded-[6px] px-2 text-[12.5px] text-kb-muted transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
      >
        <House className="h-[13px] w-[13px] stroke-[1.8]" aria-hidden />
        首页
      </Link>

      <span className="inline-flex h-[26px] items-center gap-2 rounded-[6px] border border-primary/25 bg-primary-soft px-2.5 text-[12.5px] font-medium text-primary">
        文件比对
        <button
          type="button"
          aria-label="关闭文件比对页签"
          onClick={() => navigate({ to: "/knowledge" })}
          className="grid h-[15px] w-[15px] place-items-center rounded-[4px] text-primary/70 transition-colors hover:bg-primary/12 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <X className="h-[11px] w-[11px] stroke-[2.4]" />
        </button>
      </span>

      <div className="ml-auto">
        <KbIconButton
          icon={RotateCw}
          label="刷新当前页签"
          onClick={() => {
            router.invalidate();
            toast.success("已刷新当前页签");
          }}
        />
      </div>
    </div>
  );
}
