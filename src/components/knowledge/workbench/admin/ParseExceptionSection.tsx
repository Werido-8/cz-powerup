import { AlertTriangle, FileWarning, RefreshCw, ScrollText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KbButton,
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbFilterBar,
  KbFilterSelect,
  KbIconButton,
  KbPageContent,
  KbPageHeader,
  KbStatStrip,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import type { ParseException } from "@/lib/knowledge/types";

const GRID =
  "grid-cols-[40px_minmax(240px,1.4fr)_minmax(160px,1fr)_130px_minmax(200px,1fr)_minmax(140px,auto)] min-w-[1000px]";

function failureTypeLabel(type?: ParseException["failureType"]) {
  if (type === "ocr") return "OCR 识别失败";
  if (type === "timeout") return "解析超时";
  if (type === "format") return "格式异常";
  return "解析失败";
}

function failureTypeTone(type?: ParseException["failureType"]) {
  if (type === "ocr") return "warning" as const;
  if (type === "timeout") return "danger" as const;
  return "danger" as const;
}

export function ParseExceptionSection({
  items,
  embedded = false,
}: {
  items: ParseException[];
  embedded?: boolean;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [failureType, setFailureType] = useState("all");
  const [timeRange, setTimeRange] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (failureType !== "all" && item.failureType !== failureType) return false;
      if (!q) return true;
      return (
        item.fileName.toLowerCase().includes(q) ||
        item.knowledgeBaseName.toLowerCase().includes(q)
      );
    });
  }, [failureType, items, query]);

  const stats = useMemo(() => {
    const ocr = items.filter((i) => i.failureType === "ocr").length;
    const timeout = items.filter((i) => i.failureType === "timeout").length;
    return {
      total: items.length,
      ocr,
      timeout,
      retryable: items.length,
    };
  }, [items]);

  const toolbar = (
    <>
      <KbStatStrip
        items={[
          { label: "解析失败", value: stats.total, icon: FileWarning },
          { label: "OCR 识别失败", value: stats.ocr, icon: AlertTriangle },
          { label: "解析超时", value: stats.timeout, icon: RefreshCw },
          { label: "可重试", value: stats.retryable, icon: RefreshCw },
        ]}
      />

      <KbFilterBar
        className={embedded ? "mb-0" : undefined}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="搜索文件名 / 所属知识库"
        searchClassName="max-w-[280px] !rounded-[8px]"
        filters={
          <>
            <KbFilterSelect
              value={failureType}
              onChange={setFailureType}
              placeholder="失败类型"
              options={[
                { value: "all", label: "全部类型" },
                { value: "ocr", label: "OCR 识别失败" },
                { value: "timeout", label: "解析超时" },
                { value: "format", label: "格式异常" },
              ]}
            />
            <KbFilterSelect
              value={timeRange}
              onChange={setTimeRange}
              placeholder="时间范围"
              options={[
                { value: "all", label: "全部时间" },
                { value: "today", label: "今天" },
                { value: "week", label: "近 7 天" },
                { value: "month", label: "近 30 天" },
              ]}
            />
          </>
        }
        trailing={
          <KbButton
            disabled={selectedIds.length === 0}
            onClick={() => toast.success(`已发起 ${selectedIds.length} 个文件的批量重试`)}
          >
            <RefreshCw className="h-4 w-4 stroke-[1.8]" />
            批量重试
          </KbButton>
        }
      />
    </>
  );

  const table = (
    <KbDataTable
        minWidth={GRID}
        header={
          <>
            <span />
            <span>文件名</span>
            <span>所属知识库</span>
            <span>上传时间</span>
            <span>失败原因</span>
            <span className="text-right">操作</span>
          </>
        }
        empty={
          <KbEmptyState title="暂无解析异常" description="解析失败文件会在这里集中处理。" />
        }
      >
        {filtered.map((item) => (
          <KbDataTableRow key={item.id} className={GRID}>
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={(event) =>
                setSelectedIds((previous) =>
                  event.target.checked
                    ? [...previous, item.id]
                    : previous.filter((id) => id !== item.id),
                )
              }
              className="h-4 w-4 rounded border-kb-border accent-primary"
              aria-label={`选择 ${item.fileName}`}
            />
            <KbTableCellFile
              name={item.fileName}
              subtitle={[item.fileSize, item.version].filter(Boolean).join(" / ")}
              type={item.fileName.endsWith(".pdf") ? "pdf" : "xlsx"}
            />
            <span className="truncate text-kb-muted">{item.knowledgeBaseName}</span>
            <span className="text-kb-muted">{item.uploadedAt}</span>
            <div className="min-w-0">
              <KbStatusTag tone={failureTypeTone(item.failureType)} className="mb-1">
                {failureTypeLabel(item.failureType)}
              </KbStatusTag>
              <div className="truncate text-[12px] text-kb-muted">{item.reason}</div>
            </div>
            <span className="flex justify-end gap-1">
              <KbIconButton
                icon={RefreshCw}
                label="重试"
                onClick={() => toast.success("已发起重新解析")}
              />
              <KbIconButton
                icon={ScrollText}
                label="查看日志"
                onClick={() => toast.message("打开解析日志")}
              />
              <KbIconButton
                icon={Trash2}
                label="删除"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm("确认逻辑删除该异常文件？")
                  ) {
                    toast.success("文件已标记删除");
                  }
                }}
              />
            </span>
          </KbDataTableRow>
        ))}
    </KbDataTable>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-3 border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
          {toolbar}
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto">{table}</div>
      </div>
    );
  }

  return (
    <KbPageContent>
      <KbPageHeader
        label="异常处理"
        title="解析异常"
        description="展示解析失败文件，支持查看失败原因、重试解析和日志排查。"
      />
      {toolbar}
      {table}
    </KbPageContent>
  );
}
