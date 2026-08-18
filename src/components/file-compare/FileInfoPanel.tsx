import { CalendarClock, FileText, Layers, UserRound } from "lucide-react";
import type { CompareTask, CompareVersion } from "@/lib/file-compare/types";

/** 文件信息页签：基准 / 更新文件属性与比对任务信息 */
export function FileInfoPanel({
  task,
  baseVersion,
  targetVersion,
}: {
  task: CompareTask;
  baseVersion: CompareVersion;
  targetVersion: CompareVersion;
}) {
  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-4">
        <FileCard label="基准文件" tone="base" version={baseVersion} />
        <FileCard label="更新文件" tone="target" version={targetVersion} />
      </div>

      <section className="mt-4 rounded-[8px] border border-kb-border bg-white">
        <header className="flex h-11 items-center border-b border-[#EDF3F5] px-4">
          <h3 className="text-[13px] font-semibold text-kb-heading">比对任务信息</h3>
        </header>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-3.5 px-4 py-4">
          <InfoRow icon={FileText} label="任务名称" value={task.title} />
          <InfoRow
            icon={Layers}
            label="版本对"
            value={`${baseVersion.label} 基准 → ${targetVersion.label} 更新`}
          />
          <InfoRow icon={CalendarClock} label="完成时间" value={task.finishedAt} />
          <InfoRow icon={UserRound} label="发起人" value={task.operator} />
        </dl>
      </section>
    </div>
  );
}

function FileCard({
  label,
  tone,
  version,
}: {
  label: string;
  tone: "base" | "target";
  version: CompareVersion;
}) {
  return (
    <section className="rounded-[8px] border border-kb-border bg-white">
      <header className="flex h-11 items-center gap-2 border-b border-[#EDF3F5] px-4">
        <span
          className={
            tone === "base"
              ? "inline-flex h-[22px] items-center rounded-[5px] bg-[#F2F6F7] px-2 text-[11.5px] font-medium text-kb-muted"
              : "inline-flex h-[22px] items-center rounded-[5px] bg-primary-soft px-2 text-[11.5px] font-medium text-primary"
          }
        >
          {label}
        </span>
        <span className="min-w-0 truncate text-[13.5px] font-semibold text-kb-heading">
          {version.fileName}
        </span>
      </header>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5 px-4 py-4">
        <InfoRow label="文件全称" value={version.title} span />
        <InfoRow label="版本号" value={version.label} />
        <InfoRow label="发布日期" value={version.publishedAt} />
        <InfoRow label="总页数" value={`${version.pages} 页`} />
        <InfoRow label="文件大小" value={version.size} />
      </dl>
    </section>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  span,
}: {
  icon?: typeof FileText;
  label: string;
  value: string;
  span?: boolean;
}) {
  return (
    <div className={span ? "col-span-2 min-w-0" : "min-w-0"}>
      <dt className="flex items-center gap-1.5 text-[11.5px] text-kb-muted">
        {Icon && <Icon className="h-3.5 w-3.5 stroke-[1.8]" aria-hidden />}
        {label}
      </dt>
      <dd className="mt-1 truncate text-[13px] text-kb-body" title={value}>
        {value}
      </dd>
    </div>
  );
}
