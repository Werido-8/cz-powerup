import {
  ArrowLeft,
  Download,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Share2,
  Star,
  ThumbsUp,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { KnowledgeFile, KnowledgeVersion } from "@/lib/mock/knowledge-space";
import { DragUploadOverlay } from "./DragUploadOverlay";
import { FileTypeIcon } from "./FileTypeIcon";
import { VersionDropdown } from "./VersionDropdown";

type KnowledgeFilePreviewProps = {
  kbId: string;
  file: KnowledgeFile;
  versions: KnowledgeVersion[];
  currentVersionId?: string;
  onVersionChange: (versionId: string) => void;
  canManage: boolean;
};

export function KnowledgeFilePreview({
  kbId,
  file,
  versions,
  currentVersionId,
  onVersionChange,
  canManage,
}: KnowledgeFilePreviewProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <section
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F3F6F7]"
      onDragEnter={() => setDragging(true)}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
    >
      <div className="flex h-[52px] shrink-0 items-center gap-2 border-b border-[#EDF3F5] bg-white px-4">
        <Link
          to="/knowledge/kb/$kbId"
          params={{ kbId }}
          search={{ dir: file.directoryId }}
          className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[12px] text-[#607681] transition-colors hover:bg-[#F7FAFB] hover:text-[#1F3440]"
        >
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.9]" />
          返回
        </Link>
        <div className="h-4 w-px bg-[#E2ECEF]" />
        <FileTypeIcon type={file.type} size="sm" />
        <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#1F3440]" title={file.name}>
          {file.name}
        </h1>
        <VersionDropdown
          versions={versions}
          currentVersionId={currentVersionId}
          onVersionChange={onVersionChange}
        />
        <ToolbarIcon label="分享" icon={<Share2 className="h-4 w-4 stroke-[1.8]" />} />
        <ToolbarIcon label="点赞" icon={<ThumbsUp className="h-4 w-4 stroke-[1.8]" />} />
        <ToolbarIcon label="收藏" icon={<Star className="h-4 w-4 stroke-[1.8]" />} />
        <ToolbarIcon label="评论" icon={<MessageSquare className="h-4 w-4 stroke-[1.8]" />} />
        <ToolbarIcon label="下载" icon={<Download className="h-4 w-4 stroke-[1.8]" />} />
        {canManage && <ToolbarIcon label="编辑" icon={<Pencil className="h-4 w-4 stroke-[1.8]" />} />}
        <ToolbarIcon label="更多" icon={<MoreHorizontal className="h-4 w-4 stroke-[1.8]" />} />
      </div>

      <KnowledgeDocumentViewer file={file} />
      <DragUploadOverlay active={dragging} compact />
    </section>
  );
}

export function KnowledgeDocumentViewer({ file }: { file: KnowledgeFile }) {
  return (
    <div className="scrollbar-thin min-h-0 flex-1 overflow-auto px-8 py-8">
      {file.type === "pdf" ? (
        <article className="mx-auto min-h-[900px] w-full max-w-[780px] bg-white px-14 py-11 shadow-[0_18px_44px_-34px_rgba(31,52,64,0.55)] ring-1 ring-[#E6F0F2]">
          <div className="mb-8 flex items-center justify-between border-b border-[#EDF3F5] pb-4 text-[11px] text-[#8EA1A8]">
            <span>第 1 页 / 共 12 页</span>
            <span>{file.currentVersion}</span>
          </div>
          <h2 className="text-[24px] font-semibold leading-tight text-[#1F3440]">
            {file.name.replace(/\.pdf$/i, "")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-4 text-[12px] text-[#607681]">
            <span>上传人：{file.uploadedBy}</span>
            <span>更新时间：{file.updatedAt}</span>
            <span>文件大小：{file.size}</span>
          </div>
          <p className="mt-8 text-[14px] leading-[1.9] text-[#1F3440]">{file.summary}</p>
          <div className="mt-7 rounded-[12px] border border-[#CFE9ED] border-l-[3px] border-l-[#349BAC] bg-[#F0FAFB] px-4 py-3 text-[13px] leading-relaxed text-[#1F3440]">
            本页为模拟预览画布。实际接入时可嵌入 PDF 阅读器、Office 预览服务或媒体播放器，并保持左侧库内目录树与右侧 AI 辅助区不变。
          </div>
          <h3 className="mt-9 text-[16px] font-semibold text-[#1F3440]">1. 适用范围</h3>
          <p className="mt-3 text-[13.5px] leading-[1.9] text-[#1F3440]/85">
            操作人员应了解文件适用范围、执行边界和部门协同要求。对条款存在疑问时，应向主管部门确认后执行。
          </p>
          <h3 className="mt-8 text-[16px] font-semibold text-[#1F3440]">2. 执行要求</h3>
          <p className="mt-3 text-[13.5px] leading-[1.9] text-[#1F3440]/85">
            各部门应结合现场实际制定实施细则，定期复盘执行情况，并将更新内容沉淀回对应知识库。
          </p>
        </article>
      ) : (
        <div className="mx-auto flex min-h-[560px] max-w-[720px] flex-col items-center justify-center bg-white text-center shadow-[0_18px_44px_-34px_rgba(31,52,64,0.55)] ring-1 ring-[#E6F0F2]">
          <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-[#EAF7F9] text-[#349BAC] ring-1 ring-[#D7ECEF]">
            <FileText className="h-7 w-7 stroke-[1.8]" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-[#1F3440]">预览暂不可用</div>
          <div className="mt-2 max-w-[440px] text-[12.5px] leading-relaxed text-[#607681]">
            该格式当前以下载查看为主。后续接入对应预览服务后，将在此处直接展示原文内容。
          </div>
          <button
            onClick={() => toast.message("开始下载（演示占位）")}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-[#349BAC] px-4 text-[12.5px] font-semibold text-white shadow-[0_8px_18px_-12px_rgba(52,155,172,0.8)] hover:bg-[#2F8D9D]"
          >
            <Download className="h-4 w-4 stroke-[1.9]" />
            下载文件
          </button>
        </div>
      )}
    </div>
  );
}

function ToolbarIcon({ label, icon }: { label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => toast.message(`${label}（演示占位）`)}
      className="grid h-8 w-8 place-items-center rounded-full text-[#607681] transition-colors hover:bg-[#F7FAFB] hover:text-[#1F3440]"
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}
