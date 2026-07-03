import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ClipboardCheck,
  History,
  Pencil,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { learningBtnRadius } from "@/components/learning/ui";
import {
  CONTRIBUTION_AUDIT_LOGS,
  CONTRIBUTION_STATUS_STYLE,
  type ContributionAuditRecord,
  type QuestionContribution,
  getContributionsByDoc,
} from "@/lib/mock/my-question-contributions";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<QuestionContribution["type"], string> = {
  单选题: "单选",
  多选题: "多选",
  判断题: "判断",
  简答题: "简答",
};

function ContributionStatusBadge({ status }: { status: QuestionContribution["status"] }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[10.5px] font-medium", CONTRIBUTION_STATUS_STYLE[status])}>
      {status}
    </span>
  );
}

function AuditTimeline({ logs }: { logs: ContributionAuditRecord[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
        暂无审核记录
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border pl-4">
      {logs.map((log, index) => (
        <li key={log.id} className="relative pb-5 last:pb-0">
          <span
            className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary"
            aria-hidden
          />
          <div className="rounded-lg border border-border bg-card px-3.5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[13px] font-medium text-foreground">{log.action}</span>
              <span className="text-[11.5px] tabular-nums text-muted-foreground">{log.time}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
              <span>操作人: {log.operator}</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                状态:
                <ContributionStatusBadge status={log.statusAfter} />
              </span>
            </div>
            {log.comment && (
              <div className="mt-2 rounded-md bg-muted/40 px-2.5 py-2 text-[12px] leading-relaxed text-muted-foreground">
                {log.comment}
              </div>
            )}
          </div>
          {index < logs.length - 1 && <div className="h-1" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function ContributionEditSheet({
  item,
  onClose,
  onResubmit,
}: {
  item: QuestionContribution | null;
  onClose: () => void;
  onResubmit: (id: string) => void;
}) {
  const [stem, setStem] = useState(item?.stem ?? "");
  const [analysis, setAnalysis] = useState(item?.analysis ?? "");

  useEffect(() => {
    if (item) {
      setStem(item.stem);
      setAnalysis(item.analysis ?? "");
    }
  }, [item]);

  const isReturned = item?.status === "已退回";
  const isDraft = item?.status === "草稿";

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {item && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>{isReturned ? "修改并重新提交" : isDraft ? "编辑题目" : "查看题目"}</SheetTitle>
              <SheetDescription>
                {isReturned
                  ? "根据审核意见修订后重新提交"
                  : "确认题干、答案与解析后提交审核"}
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {item.rejectComment && (
                <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3.5 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[12px] font-medium text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    审核意见
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-destructive/90">{item.rejectComment}</p>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">题干</label>
                <Textarea
                  value={stem}
                  onChange={(e) => setStem(e.target.value)}
                  rows={3}
                  readOnly={!isReturned && !isDraft}
                  className="mt-1 text-[13px]"
                />
              </div>

              {item.options && item.options.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-muted-foreground">选项</label>
                  {item.options.map((opt) => (
                    <div
                      key={opt.key}
                      className="rounded-md border border-border bg-background px-3 py-2 text-[12.5px]"
                    >
                      <span className="font-medium text-primary">{opt.key}.</span> {opt.text}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-muted-foreground">解析</label>
                <Textarea
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  rows={3}
                  readOnly={!isReturned && !isDraft}
                  className="mt-1 text-[13px]"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                <span>题型: {item.type}</span>
                <span>·</span>
                <ContributionStatusBadge status={item.status} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
              <button
                type="button"
                onClick={onClose}
                className={cn("border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted", learningBtnRadius)}
              >
                取消
              </button>
              {(isReturned || isDraft) && (
                <button
                  type="button"
                  onClick={() => {
                    onResubmit(item.id);
                    onClose();
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90",
                    learningBtnRadius,
                  )}
                >
                  <Send className="h-3.5 w-3.5" />
                  {isReturned ? "重新提交审核" : "提交审核"}
                </button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ContributionAuditSheet({
  item,
  onClose,
}: {
  item: QuestionContribution | null;
  onClose: () => void;
}) {
  const logs = item ? (CONTRIBUTION_AUDIT_LOGS[item.id] ?? []) : [];

  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {item && (
          <>
            <SheetHeader className="border-b border-border px-6 py-4">
              <SheetTitle>审核记录</SheetTitle>
              <SheetDescription>该题目的提交与审核流转历史</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <div className="rounded-lg border border-border bg-muted/20 px-3.5 py-3">
                <div className="line-clamp-2 text-[13px] font-medium text-foreground">{item.stem}</div>
                <div className="mt-2">
                  <ContributionStatusBadge status={item.status} />
                </div>
              </div>
              <AuditTimeline logs={logs} />
            </div>
            <div className="flex justify-end border-t border-border px-6 py-3">
              <button
                type="button"
                onClick={onClose}
                className={cn("border border-border px-3.5 py-2 text-[12.5px] hover:bg-muted", learningBtnRadius)}
              >
                关闭
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function MyQuestionContributionsPanel({
  docId,
  className,
  defaultExpanded,
}: {
  docId: string;
  className?: string;
  defaultExpanded?: boolean;
}) {
  const contributions = useMemo(() => getContributionsByDoc(docId), [docId]);
  const [editItem, setEditItem] = useState<QuestionContribution | null>(null);
  const [auditItem, setAuditItem] = useState<QuestionContribution | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, QuestionContribution["status"]>>({});

  const items = contributions.map((c) => ({
    ...c,
    status: localStatuses[c.id] ?? c.status,
  }));

  const returnedCount = items.filter((c) => c.status === "已退回").length;

  const handleResubmit = (id: string) => {
    setLocalStatuses((prev) => ({ ...prev, [id]: "待审核" }));
    toast.success("已重新提交审核,请等待培训老师审核");
  };

  const handleAiGenerate = () => {
    toast.success("已根据资料内容生成题目草稿（演示）");
  };

  if (contributions.length === 0) {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-5", className)}>
        <div className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold">
          <Wand2 className="h-4 w-4 text-primary" />
          我提交的题目
        </div>
        <p className="text-[12.5px] text-muted-foreground">阅读资料后可 AI 解析生成题目,编辑后提交审核入库。</p>
        <button
          type="button"
          onClick={handleAiGenerate}
          className={cn(
            "mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-primary/30 bg-primary-soft/40 px-3 py-2 text-[12.5px] font-medium text-primary hover:bg-primary-soft",
            learningBtnRadius,
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI 解析生成题目
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        id="my-question-contributions"
        className={cn(
          "rounded-lg border bg-card p-5",
          returnedCount > 0 ? "border-destructive/30" : "border-border",
          defaultExpanded && returnedCount > 0 && "ring-2 ring-destructive/15",
          className,
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              我提交的题目
            </div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              从本文解析的题目,提交后由培训老师审核
            </p>
          </div>
          {returnedCount > 0 && (
            <span className="shrink-0 rounded-md bg-destructive/10 px-2 py-0.5 text-[10.5px] font-medium text-destructive">
              {returnedCount} 题待改
            </span>
          )}
        </div>

        <div className="space-y-2">
          {items.map((c) => {
            const canEdit = c.status === "已退回" || c.status === "草稿";
            const hasAudit = (CONTRIBUTION_AUDIT_LOGS[c.id]?.length ?? 0) > 0;
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-lg border bg-background p-3",
                  c.status === "已退回" ? "border-destructive/25 bg-destructive/[0.02]" : "border-border",
                )}
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
                    {TYPE_LABEL[c.type]}
                  </span>
                  <ContributionStatusBadge status={c.status} />
                </div>
                <div className="line-clamp-2 text-[12px] leading-relaxed">{c.stem}</div>
                {c.rejectComment && c.status === "已退回" && (
                  <div className="mt-2 rounded-md bg-destructive/5 px-2 py-1.5 text-[11px] leading-relaxed text-destructive/90">
                    {c.rejectComment}
                  </div>
                )}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setEditItem(c)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] font-medium text-primary hover:bg-primary-soft"
                    >
                      <Pencil className="h-3 w-3" />
                      {c.status === "已退回" ? "修改重提" : "编辑提交"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={!hasAudit}
                    onClick={() => hasAudit && setAuditItem(c)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    title={hasAudit ? undefined : "暂无审核记录"}
                  >
                    <History className="h-3 w-3" />
                    审核记录
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleAiGenerate}
          className={cn(
            "mt-3 inline-flex w-full items-center justify-center gap-1.5 border border-dashed border-border px-3 py-2 text-[12px] text-muted-foreground hover:border-primary/40 hover:text-primary",
            learningBtnRadius,
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          继续 AI 解析生成
        </button>
      </div>

      <ContributionEditSheet
        item={editItem}
        onClose={() => setEditItem(null)}
        onResubmit={handleResubmit}
      />
      <ContributionAuditSheet item={auditItem} onClose={() => setAuditItem(null)} />
    </>
  );
}
