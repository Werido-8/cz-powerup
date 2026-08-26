import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Clock3, FileText, Loader2, Pause, RefreshCw, type LucideIcon } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { KbFileTypeIcon } from "@/components/knowledge/ui";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getBaseById, PERSONAL_TREE_ALL_ID, PROFESSIONAL_TREE_ALL_ID } from "@/lib/knowledge/model";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  getStoreUploadRecords,
  PAUSED_PARSE_ERROR,
  pauseStoreUploadParse,
  retryStoreUploadParse,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type { UploadRecord } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

type TaskKind = "parsing" | "waiting" | "paused" | "failed" | "done";

function taskKindOf(record: UploadRecord): TaskKind {
  if (record.parseError === PAUSED_PARSE_ERROR) return "paused";
  if (record.parseStatus === "failed" || record.status === "parseFailed") return "failed";
  if (record.parseStatus === "parsing" || record.status === "uploading") return "parsing";
  if (record.parseStatus === "waiting") return "waiting";
  return "done";
}

function statusLabel(kind: TaskKind) {
  if (kind === "parsing") return "解析中";
  if (kind === "waiting") return "等待解析";
  if (kind === "paused") return "已暂停";
  if (kind === "failed") return "解析失败";
  return "已完成";
}

function matchesCurrentView(record: UploadRecord, knowledgeBaseId: string) {
  if (knowledgeBaseId === PROFESSIONAL_TREE_ALL_ID) {
    return getBaseById(record.targetKnowledgeBaseId)?.scope !== "personal";
  }
  if (knowledgeBaseId === PERSONAL_TREE_ALL_ID) {
    return getBaseById(record.targetKnowledgeBaseId)?.scope === "personal";
  }
  return record.targetKnowledgeBaseId === knowledgeBaseId;
}

export function MyPendingReviewWidget({ knowledgeBaseId }: { knowledgeBaseId: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAggregate =
    knowledgeBaseId === PROFESSIONAL_TREE_ALL_ID || knowledgeBaseId === PERSONAL_TREE_ALL_ID;

  const storeVersion = useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );
  void storeVersion;

  const records = useMemo(
    () =>
      getStoreUploadRecords()
        .filter((item) => matchesCurrentView(item, knowledgeBaseId))
        .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "")),
    [knowledgeBaseId, storeVersion],
  );

  const tasks = useMemo(() => {
    const kindOrder: Record<TaskKind, number> = { parsing: 0, waiting: 1, paused: 2, failed: 3, done: 4 };
    return records
      .map((record) => ({ record, kind: taskKindOf(record) }))
      .filter((item) => item.kind !== "done")
      .sort((a, b) => {
        const byKind = kindOrder[a.kind] - kindOrder[b.kind];
        if (byKind !== 0) return byKind;
        return (a.record.submittedAt ?? "").localeCompare(b.record.submittedAt ?? "");
      });
  }, [records]);

  const parsingCount = tasks.filter((item) => item.kind === "parsing").length;
  const waitingCount = tasks.filter((item) => item.kind === "waiting").length;
  const pausedCount = tasks.filter((item) => item.kind === "paused").length;
  const failedCount = tasks.filter((item) => item.kind === "failed").length;

  if (tasks.length === 0) return null;

  const handlePause = (record: UploadRecord) => {
    pauseStoreUploadParse(record.id);
    toast.success(`已暂停「${record.fileName}」的解析`);
  };

  const handleRetry = (record: UploadRecord) => {
    retryStoreUploadParse(record.id);
    toast.success(`已重新发起「${record.fileName}」的解析`);
  };

  const openAll = () => {
    setOpen(false);
    navigate({ to: "/knowledge/mine", search: { panel: "uploads", view: "all" } });
  };

  return (
    <HoverCard open={open} onOpenChange={setOpen} openDelay={80} closeDelay={180}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#D4E8EC] bg-white px-2.5 text-[12.5px] text-[#31485D] transition-colors hover:border-[#1496B4]/45 hover:text-[#1496B4]"
        >
          {parsingCount > 0 ? (
            <Loader2 className="size-3.5 animate-spin stroke-[2] text-[#1496B4]" />
          ) : (
            <Clock3 className="size-3.5 stroke-[1.8] text-[#1496B4]" />
          )}
          <span>文件处理</span>
          <span className="min-w-4 text-center text-[12px] font-semibold tabular-nums text-[#E87B1B]">
            {tasks.length}
          </span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        sideOffset={10}
        className="w-[380px] overflow-hidden rounded-[12px] border-[#E6EEF0] p-0 shadow-[0_12px_32px_rgba(31,52,64,0.14)]"
      >
        <div className="flex items-center justify-between px-3.5 pb-1 pt-3">
          <div className="flex items-center gap-1.5">
            <FileText className="size-4 stroke-[1.7] text-[#1496B4]" />
            <h3 className="text-[13px] font-medium text-[#1A2E36]">文件处理任务</h3>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid size-7 cursor-pointer place-items-center text-[#8A9AA2] transition-colors hover:text-[#1A2E36]"
            aria-label="收起"
            title="收起"
          >
            <ChevronDown className="size-4 stroke-[1.8]" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 pb-2.5 pt-1 text-[12px] text-[#8A9AA2]">
          {parsingCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="size-3 animate-spin stroke-[2] text-[#1496B4]" />
              解析中 {parsingCount}
            </span>
          )}
          {waitingCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3 stroke-[2]" />
              等待解析 {waitingCount}
            </span>
          )}
          {pausedCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Pause className="size-3 fill-current stroke-[1.5]" />
              已暂停 {pausedCount}
            </span>
          )}
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[#E44A4A]">解析失败 {failedCount}</span>
          )}
        </div>

        <div
          className={cn(
            "divide-y divide-[#F0F4F6] overflow-y-auto border-t border-[#F0F4F6]",
            isAggregate ? "max-h-[320px]" : "max-h-[240px]",
          )}
        >
          {tasks.map(({ record, kind }) => (
            <TaskRow
              key={record.id}
              record={record}
              kind={kind}
              onPause={() => handlePause(record)}
              onRetry={() => handleRetry(record)}
            />
          ))}
        </div>

        <div className="border-t border-[#F0F4F6] px-3.5 py-2.5 text-center">
          <button
            type="button"
            onClick={openAll}
            className="cursor-pointer text-[12px] font-medium text-[#1496B4] hover:text-[#0C819D]"
          >
            查看全部处理记录
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function TaskRow({
  record,
  kind,
  onPause,
  onRetry,
}: {
  record: UploadRecord;
  kind: TaskKind;
  onPause: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5">
      <KbFileTypeIcon fileName={record.fileName} size="sm" className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] text-[#1A2E36]" title={record.fileName}>
          {record.fileName}
        </p>
        <p className="mt-0.5 truncate text-[12px] text-[#8A9AA2]" title={record.targetKnowledgeBaseName}>
          {record.targetKnowledgeBaseName}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <span
          className={cn(
            "text-[12px]",
            kind === "parsing" && "text-[#1496B4]",
            kind === "waiting" && "text-[#8A9AA2]",
            kind === "paused" && "text-[#8A9AA2]",
            kind === "failed" && "text-[#E44A4A]",
            kind === "done" && "text-emerald-600",
          )}
        >
          {statusLabel(kind)}
        </span>
        {kind === "parsing" || kind === "waiting" ? (
          <RowIconButton
            icon={Pause}
            label="暂停"
            filled
            onClick={onPause}
            className="text-[#1496B4] hover:text-[#0C819D]"
          />
        ) : kind === "paused" ? (
          <RowIconButton
            icon={RefreshCw}
            label="继续"
            onClick={onRetry}
            className="text-[#1496B4] hover:text-[#0C819D]"
          />
        ) : kind === "failed" ? (
          <RowIconButton
            icon={RefreshCw}
            label="重试"
            onClick={onRetry}
            className="text-[#E44A4A] hover:text-[#C93A3A]"
          />
        ) : null}
      </div>
    </div>
  );
}

function RowIconButton({
  icon: Icon,
  label,
  filled,
  onClick,
  className,
}: {
  icon: LucideIcon;
  label: string;
  filled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-7 shrink-0 cursor-pointer place-items-center bg-transparent p-0 transition-colors",
        className,
      )}
    >
      <Icon className={cn("size-3.5 stroke-[1.8]", filled && "fill-current stroke-[1.5]")} />
    </button>
  );
}
