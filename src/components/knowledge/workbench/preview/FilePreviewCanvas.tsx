import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";
import { KbEmptyState, KbIconButton, KbStatusTag } from "@/components/knowledge/ui";
import { isStorageOnlyFile } from "@/lib/knowledge/parseMerge";
import {
  parseStatusLabel,
  parseStatusTone,
  publishStatusLabel,
  publishStatusTone,
} from "@/lib/knowledge/status";
import type { KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";
import { kbRadius } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

export function FilePreviewCanvas({
  file,
  version,
  historyVersion,
  page: pageProp,
  onPageChange,
}: {
  file: KnowledgeFile;
  version?: KnowledgeFileVersion;
  historyVersion?: boolean;
  /** Controlled page number; when provided the component acts as controlled */
  page?: number;
  onPageChange?: (page: number) => void;
}) {
  const [internalPage, setInternalPage] = useState(1);
  const page = pageProp ?? internalPage;
  const setPage = (value: number | ((prev: number) => number)) => {
    const next = typeof value === "function" ? value(page) : value;
    if (onPageChange) {
      onPageChange(next);
    } else {
      setInternalPage(next);
    }
  };

  useEffect(() => {
    if (pageProp == null) setInternalPage(1);
  }, [file.id, pageProp]);

  const [zoom, setZoom] = useState(100);
  const totalPages = 12;
  const storageOnly = isStorageOnlyFile(file);

  if (storageOnly) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <KbEmptyState
          title="暂不支持在线预览"
          description="当前格式无法直接展示内容，可下载原文件后查看。"
        />
      </div>
    );
  }

  if (file.status === "parseFailed") {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <KbEmptyState
          title="文件解析失败"
          description={
            file.parseError ??
            "当前文件暂时无法在线预览，请下载原文件或联系管理员处理。"
          }
        />
      </div>
    );
  }

  return (
    <section className="scrollbar-thin flex min-w-0 flex-1 flex-col overflow-hidden bg-[rgb(246,247,249)]">
      <div className="flex h-14 shrink-0 items-center justify-center gap-2 border-b border-[#E3ECEE] bg-[rgb(246,247,249)] px-4">
        <KbIconButton
          icon={ChevronLeft}
          label="上一页"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        />
        <span className="text-[12px] tabular-nums text-kb-muted">
          第 {page} 页 / 共 {totalPages} 页
        </span>
        <KbIconButton
          icon={ChevronRight}
          label="下一页"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
        <div className="mx-2 h-5 w-px bg-[#DCE7E9]" />
        <KbIconButton
          icon={ZoomOut}
          label="缩小"
          onClick={() => setZoom((z) => Math.max(50, z - 10))}
        />
        <span className="min-w-[40px] text-center text-[12px] tabular-nums text-kb-muted">
          {zoom}%
        </span>
        <KbIconButton
          icon={ZoomIn}
          label="放大"
          onClick={() => setZoom((z) => Math.min(200, z + 10))}
        />
        <KbIconButton icon={Maximize2} label="适合宽度" onClick={() => setZoom(100)} />
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-6 py-5 lg:px-9 lg:py-6">
        {historyVersion && (
          <div
            className={cn(
              "mx-auto mb-4 max-w-[900px] rounded-[8px] border border-warning/30 bg-warning-soft px-4 py-3 text-[12.5px] text-warning-foreground",
            )}
          >
            当前为历史版本，只读预览，可下载，不参与默认 AI 问答召回。
          </div>
        )}
        <article
          className={cn(
            "mx-auto min-h-[720px] w-full max-w-[900px] border border-[#E7EEF0] bg-white px-10 py-9 shadow-[0_10px_28px_rgba(31,52,64,0.09)] lg:px-14 lg:py-11",
            kbRadius.lg,
          )}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <div className="mb-7 flex items-center justify-between border-b border-[#E8EFF1] pb-4 text-[11.5px] text-kb-muted">
            <span>
              第 {page} 页 / 共 {totalPages} 页
            </span>
            <span>{version?.version ?? file.version}</span>
          </div>
          <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-kb-heading">
            {file.name.replace(/\.(pdf|docx|xlsx|pptx)$/i, "")}
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-kb-muted">
            <span>上传人：{file.uploaderName}</span>
            <span>更新时间：{file.updatedAt}</span>
            <span>文件大小：{file.size}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <KbStatusTag tone={publishStatusTone(file.status)}>
              {publishStatusLabel(file.status)}
            </KbStatusTag>
            <KbStatusTag tone={parseStatusTone(file.parseStatus)}>
              {parseStatusLabel(file.parseStatus)}
            </KbStatusTag>
          </div>
          <p className="mt-8 text-[14px] leading-[1.9] text-kb-body">{file.summary}</p>
          <div className="mt-6 rounded-[8px] border border-[#BFE8ED] bg-[#F4FCFD] px-4 py-3 text-[13px] leading-relaxed text-kb-body">
            此处为在线预览画布。接入真实接口后，可替换为 PDF 阅读器、Office 预览服务或媒体播放器。
          </div>
          <h3 className="mt-8 text-[16px] font-semibold text-kb-heading">1. 适用范围</h3>
          <p className="mt-3 text-[13.5px] leading-[1.9] text-kb-body/90">
            操作人员应了解文件适用范围、执行边界和协同要求。对条款存在疑问时，应向主管部门确认后执行。
          </p>
          <h3 className="mt-7 text-[16px] font-semibold text-kb-heading">2. 执行要求</h3>
          <p className="mt-3 text-[13.5px] leading-[1.9] text-kb-body/90">
            相关单位应结合现场实际制定实施细则，定期复盘执行情况，并将更新内容沉淀回对应知识库。
          </p>
        </article>
      </div>
    </section>
  );
}
