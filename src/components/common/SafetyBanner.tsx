import { ShieldAlert } from "lucide-react";

export function SafetyBanner({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft/60 px-3 py-2 text-[11.5px] text-warning-foreground">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        <span>
          本系统输出仅用于培训学习与依据查阅,不构成正式调度命令、操作票或事故结论。
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft/60 px-4 py-3 text-[12.5px] text-warning-foreground">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
      <div className="leading-relaxed">
        <span className="font-medium">安全边界提示:</span>
        本系统输出仅用于培训学习与依据查阅,不构成正式调度命令、操作票或事故定性结论。
      </div>
    </div>
  );
}
