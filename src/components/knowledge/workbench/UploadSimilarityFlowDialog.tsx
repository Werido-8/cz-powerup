import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSearch,
  FileText,
  FolderOpen,
  GitCompareArrows,
  History,
  Replace,
  RotateCcw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState, type RefObject } from "react";
import { toast } from "sonner";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { DiffConnectionRail } from "@/components/file-compare/DiffMatchBar";
import { useAnchoredSync } from "@/components/file-compare/useAnchoredSync";
import { DIFF_TONE_CLASSES, DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { DiffType } from "@/lib/file-compare/types";
import { KbUploadCard, KnowledgeBaseIcon } from "@/components/knowledge/ui";
import {
  getInternalDirectoriesForBase,
  getInternalDirectoryPathLabel,
} from "@/lib/knowledge/model";
import { createStoreLibraryUpload } from "@/lib/knowledge/store";
import { pushRecentUploadBaseId } from "@/lib/knowledge/recentUpload";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { KnowledgeInternalDirectoryTree } from "./KnowledgeInternalDirectoryTree";

type UploadFile = { name: string; size: number; type: string };
type FlowStep = "results" | "preview" | "confirm";
type Decision = "new" | "version" | "replace";

type SimilarCandidate = {
  id: string;
  name: string;
  version: string;
  uploadedAt: string;
  fileType: string;
  size: string;
  similarity: number;
  recommendation: string;
  summary: string;
  canCompare: boolean;
  compareReason?: string;
  compareFailsOnce?: boolean;
};

const PDF_CANDIDATES: SimilarCandidate[] = [
  {
    id: "current",
    name: "涉网运行管理规定（2025版）.pdf",
    version: "V5 · 当前版本",
    uploadedAt: "2025-01-12 14:26",
    fileType: "PDF",
    size: "7.4 MB",
    similarity: 96,
    recommendation: "标题与资料主体高度一致，建议设为新版本",
    summary:
      "2025 版涉网运行管理规定，覆盖值班监视、参数记录频次、告警确认时限与归档要求。正文已按新版调度口径调整运行记录周期，并补充异常期间提高记录频次的条款。",
    canCompare: true,
  },
  {
    id: "archive",
    name: "涉网运行管理规定（2023版）.pdf",
    version: "V4 · 历史版本",
    uploadedAt: "2023-06-02 09:18",
    fileType: "PDF",
    size: "6.8 MB",
    similarity: 88,
    recommendation: "可能为同一资料的历史版本",
    summary:
      "2023 版规定沿用旧记录周期与纸质日志补录口径，未单列告警确认时限。若本次上传为制度换版，更宜作为新版本而非覆盖。",
    canCompare: true,
    compareFailsOnce: true,
  },
  {
    id: "ledger",
    name: "涉网运行制度文件台账.xlsx",
    version: "无版本",
    uploadedAt: "2026-02-18 16:40",
    fileType: "Excel",
    size: "428 KB",
    similarity: 73,
    recommendation: "标题关键词相近，可能是配套台账",
    summary:
      "制度文件台账表，登记文件名称、版本、生效日期与责任部门，不含正文条款。适合对照“是否已有同一资料”，一般不应直接覆盖。",
    canCompare: false,
    compareReason: "Excel 文件暂不支持正文差异对比",
  },
  {
    id: "trial",
    name: "涉网运行管理规定（试行）.pdf",
    version: "V3 · 历史版本",
    uploadedAt: "2022-11-08 10:05",
    fileType: "PDF",
    size: "5.9 MB",
    similarity: 81,
    recommendation: "标题结构相近，可能为试行稿",
    summary:
      "试行稿结构与现行规定相近，但条款颗粒度更粗，部分岗位职责仍为过渡表述。若正文已按正式稿重写，建议作为历史版本保留。",
    canCompare: true,
  },
  {
    id: "detail-rules",
    name: "涉网运行管理实施细则.docx",
    version: "V2 · 当前版本",
    uploadedAt: "2024-09-21 15:42",
    fileType: "Word",
    size: "1.2 MB",
    similarity: 69,
    recommendation: "标题关键词相近，可能为配套细则",
    summary:
      "实施细则侧重现场执行步骤、记录表单和班组检查清单，与管理规定正文互补。更可能是配套新资料，而不是同一文件的新版本。",
    canCompare: true,
  },
];

type DiffBlock = {
  id: string;
  type?: DiffType;
  heading?: string;
  left: string;
  right: string;
};

const COMPARE_BLOCKS: DiffBlock[] = [
  {
    id: "intro",
    heading: "第三章 运行管理要求",
    left: "3.1 运行人员应按照岗位分工履行涉网运行的监视与记录职责，交接班时确认设备状态。",
    right: "3.1 运行人员应按照岗位分工履行涉网运行的监视与记录职责，交接班时确认设备状态。",
  },
  {
    id: "d-mod-1",
    type: "modified",
    left: "3.2.2 正常运行期间，应按照运行记录要求，每 60 分钟记录一次主要运行参数。",
    right:
      "3.2.2 正常运行期间，应按照运行记录要求，每 45 分钟记录一次主要运行参数；异常期间应提高记录频次。",
  },
  {
    id: "d-mod-2",
    type: "modified",
    left: "异常处置结束后应恢复正常监视方式。",
    right: "异常处置结束后应恢复正常监视方式，处置过程应留痕并由专业工程师复核签署。",
  },
  {
    id: "keep-1",
    left: "3.2.3 交接班应核对主要参数、未完事项和设备状态，双方签字确认后方可离岗。",
    right: "3.2.3 交接班应核对主要参数、未完事项和设备状态，双方签字确认后方可离岗。",
  },
  {
    id: "d-add-1",
    type: "added",
    left: "",
    right: "3.2.4 新增：涉网相关告警应在 15 分钟内完成确认，并同步值班长。",
  },
  {
    id: "d-rem-1",
    type: "removed",
    left: "3.2.5 纸质运行日志可在次日补录，电子记录不作强制要求。",
    right: "",
  },
  {
    id: "d-mod-3",
    type: "modified",
    left: "资料应在工作结束后 30 个工作日内完成归档。",
    right: "资料应在工作结束后 15 个工作日内完成归档，并登记文件版本与生效日期。",
  },
  {
    id: "keep-2",
    left: "3.3 异常处置过程应保留必要记录，事后完成资料归档与复核。",
    right: "3.3 异常处置过程应保留必要记录，事后完成资料归档与复核。",
  },
];

const DIFF_STATS = { added: 12, removed: 6, modified: 8 } as const;

function fileSize(size: number) {
  if (!size) return "8.1 MB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileTypeOf(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "doc" || ext === "docx") return "Word";
  if (ext === "xls" || ext === "xlsx") return "Excel";
  if (ext === "ppt" || ext === "pptx") return "PPT";
  return ext?.toUpperCase() || "文件";
}

function mockCandidates(file: UploadFile): SimilarCandidate[] {
  const normalized = file.name.toLowerCase();
  if (
    normalized.includes("全新") ||
    normalized.includes("unique") ||
    normalized.includes("new-material")
  ) {
    return [];
  }
  return PDF_CANDIDATES;
}

export function UploadSimilarityFlowDialog({
  base,
  onClose,
  onChangeBase,
  initialFiles,
  defaultDirectoryId,
}: {
  base: KnowledgeBase | null;
  onClose: () => void;
  onChangeBase?: () => void;
  initialFiles?: File[];
  defaultDirectoryId?: string;
}) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [targetDirectoryId, setTargetDirectoryId] = useState<string | undefined>();
  const [directoryPickerOpen, setDirectoryPickerOpen] = useState(false);

  const currentFile = files[0] ?? null;

  useEffect(() => {
    if (!base) {
      setFiles([]);
      setTargetDirectoryId(undefined);
      setDirectoryPickerOpen(false);
      return;
    }
    setTargetDirectoryId(defaultDirectoryId);
    setDirectoryPickerOpen(false);
    setFiles(
      initialFiles?.length
        ? initialFiles.map((file) => ({ name: file.name, size: file.size, type: file.type }))
        : [],
    );
  }, [base, defaultDirectoryId, initialFiles]);

  const chooseFiles = (fileList: FileList) => {
    const next = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    if (!next.length) return;
    setFiles(next);
  };

  const cancelUpload = () => {
    toast.message("已取消本次上传");
    onClose();
  };

  const submitUpload = () => {
    if (!base) return;
    if (!targetDirectoryId) {
      toast.error("请选择上传目录");
      return;
    }
    if (!files.length) {
      toast.error("请选择需要上传的文件");
      return;
    }

    pushRecentUploadBaseId(base.id);
    const personal = base.scope === "personal";
    files.forEach((file, index) => {
      createStoreLibraryUpload({
        fileName: file.name,
        knowledgeBaseId: base.id,
        knowledgeBaseName: base.name,
        fileSize: fileSize(file.size),
        directoryId: targetDirectoryId,
        personal,
        idNonce: index,
      });
    });
    toast.success(
      personal
        ? files.length > 1
          ? `已上传 ${files.length} 个文件，正在解析`
          : "文件已加入列表，正在解析"
        : files.length > 1
          ? `已提交 ${files.length} 个文件，解析完成后进入审批台`
          : "文件已提交，解析完成后进入审批台",
    );
    onClose();
  };

  if (!base) return null;

  return (
    <AppFormDialog
      open
      size="medium"
      title="上传文件"
      titleIcon={UploadCloud}
      onClose={cancelUpload}
      className="upload-similarity-dialog"
      footer={
        <>
          <AppDialogButton variant="outline" onClick={cancelUpload}>
            取消
          </AppDialogButton>
          <AppDialogButton
            variant="primary"
            disabled={!targetDirectoryId || files.length === 0}
            onClick={submitUpload}
          >
            确认上传
          </AppDialogButton>
        </>
      }
    >
      <div className="space-y-4">
        <UploadTargetLocation
          base={base}
          directoryId={targetDirectoryId}
          pickerOpen={directoryPickerOpen}
          onPickerOpenChange={setDirectoryPickerOpen}
          onDirectoryChange={(directoryId) => {
            if (!directoryId) return;
            setTargetDirectoryId(directoryId);
            setDirectoryPickerOpen(false);
          }}
          onChangeBase={onChangeBase}
        />
        <KbUploadCard
          title={files.length ? "重新选择上传文件" : "拖入文件或选择上传"}
          hint={
            files.length
              ? "重新选择将替换当前待上传文件"
              : base.scope === "personal"
                ? "支持 PDF、Word、Excel、PPT；上传后直接进入列表并开始解析"
                : "支持 PDF、Word、Excel、PPT；提交后先解析，完成后进入审批台审核"
          }
          onUpload={chooseFiles}
          className={files.length ? "min-h-[116px]" : "min-h-[172px]"}
        />
        {currentFile && <FileStrip file={currentFile} />}
        {files.length > 1 && (
          <p className="-mt-2 text-[11px] text-kb-muted">本次共选择 {files.length} 个文件，将一并提交。</p>
        )}
      </div>
    </AppFormDialog>
  );
}

function UploadTargetLocation({
  base,
  directoryId,
  pickerOpen,
  onPickerOpenChange,
  onDirectoryChange,
  onChangeBase,
}: {
  base: KnowledgeBase;
  directoryId?: string;
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
  onDirectoryChange: (directoryId?: string) => void;
  onChangeBase?: () => void;
}) {
  const directories = getInternalDirectoriesForBase(base.id);
  const hasDirectory = Boolean(directoryId);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[9px] border bg-[#F8FAFB]",
        hasDirectory ? "border-[#DCEBED]" : "border-[#E4A94F]",
      )}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <KnowledgeBaseIcon size="sm" />
        <div className="min-w-0 flex-1">
          <div className="text-[10.5px] text-kb-muted">
            上传目录 <span className="text-[#C94747]">*</span>
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium text-kb-heading">
            <span className="shrink-0">{base.name}</span>
            <span className="text-kb-muted">/</span>
            <span className={cn("truncate", hasDirectory ? "text-primary" : "text-[#B47518]")}>
              {hasDirectory ? getInternalDirectoryPathLabel(directoryId) : "请选择上传目录"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPickerOpenChange(!pickerOpen)}
          className="shrink-0 rounded-[6px] px-2 py-1 text-[11.5px] font-medium text-primary transition-colors hover:bg-primary-soft"
        >
          {pickerOpen ? "收起" : hasDirectory ? "编辑" : "选择"}
        </button>
        {onChangeBase && (
          <button
            type="button"
            onClick={onChangeBase}
            className="shrink-0 rounded-[6px] px-2 py-1 text-[11.5px] text-kb-muted transition-colors hover:bg-[#EEF4F5] hover:text-primary"
          >
            更换知识库
          </button>
        )}
      </div>
      {pickerOpen && (
        <div className="max-h-[210px] overflow-y-auto border-t border-[#DCEBED] bg-white p-2">
          <KnowledgeInternalDirectoryTree
            baseId={base.id}
            directories={directories}
            selectedId={directoryId}
            compact
            onSelect={onDirectoryChange}
          />
        </div>
      )}
    </div>
  );
}

function FileStrip({ file, className }: { file: UploadFile; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[10px] border border-[#DCEBED] bg-white px-3.5 py-3",
        className,
      )}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-[#EEF7F8] text-primary">
        <FileText className="h-4.5 w-4.5 stroke-[1.8]" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[13px] font-medium text-kb-heading">{file.name}</div>
        <div className="mt-0.5 text-[11px] text-kb-muted">
          {fileTypeOf(file.name)} / {fileSize(file.size)}
        </div>
      </div>
      <KbStatus label="当前文件" tone="success" />
    </div>
  );
}

function ResultsView({
  file,
  filesCount,
  candidates,
  selectedId,
  onSelect,
  onPreview,
  onCompare,
  onDecision,
}: {
  file: UploadFile;
  filesCount: number;
  candidates: SimilarCandidate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPreview: (candidate: SimilarCandidate) => void;
  onCompare: (candidate: SimilarCandidate) => void;
  onDecision: (decision: Decision, candidate?: SimilarCandidate) => void;
}) {
  const selected = candidates.find((item) => item.id === selectedId) ?? null;
  return (
    <div className="space-y-4">
      <FileStrip file={file} />
      {filesCount > 1 && (
        <p className="-mt-2 text-[11px] text-kb-muted">
          本次共选择 {filesCount} 个文件，演示流程当前处理第 1 个文件。
        </p>
      )}

      {candidates.length > 0 ? (
        <div className="grid min-h-0 grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)] overflow-hidden rounded-[10px] border border-[#DCEBED] max-[760px]:grid-cols-1">
          <div className="flex min-h-0 flex-col border-r border-[#E6EEF0] max-[760px]:border-b max-[760px]:border-r-0">
            <div className="flex h-10 shrink-0 items-center justify-between bg-[#F7FAFB] px-4 text-[11.5px] font-medium text-kb-muted">
              <span>相似资料候选</span>
              <span>共 {candidates.length} 份</span>
            </div>
            <div className="min-h-0 flex-1 divide-y divide-[#EDF2F3] overflow-y-auto">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => onSelect(candidate.id)}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition-colors",
                    selectedId === candidate.id
                      ? "bg-[#EEF8F9] shadow-[inset_3px_0_0_#2F9EAC]"
                      : "hover:bg-[#F9FBFC]",
                  )}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-white text-primary ring-1 ring-[#DCEBED]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 truncate text-[12.5px] font-medium text-kb-heading">
                    {candidate.name}
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <IconAction icon={Eye} label="查看" onClick={() => onPreview(candidate)} />
                    <IconAction
                      icon={GitCompareArrows}
                      label="对比"
                      onClick={() => onCompare(candidate)}
                      disabled={!candidate.canCompare}
                      title={candidate.compareReason}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col overflow-y-auto bg-white p-4">
            {selected ? (
              <>
                <div className="text-[11.5px] font-medium text-kb-muted">已选资料</div>
                <h4 className="mt-2 break-words text-[14px] font-semibold leading-5 text-kb-heading">
                  {selected.name}
                </h4>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[11.5px]">
                  <InfoItem label="当前版本" value={selected.version} />
                  <InfoItem label="文件大小" value={selected.size} />
                  <InfoItem label="上传时间" value={selected.uploadedAt} />
                  <InfoItem label="文件类型" value={selected.fileType} />
                </dl>
                <div className="mt-4 rounded-[8px] bg-[#F7FAFB] px-3 py-2.5">
                  <div className="text-[10.5px] font-medium text-kb-muted">文件摘要</div>
                  <p className="mt-1 text-[12px] leading-5 text-kb-body">{selected.summary}</p>
                  <p className="mt-1.5 text-[11px] leading-4 text-primary">
                    {selected.recommendation}
                  </p>
                </div>
                {!selected.canCompare && (
                  <p className="mt-3 text-[10.5px] leading-4 text-[#C0691A]">
                    {selected.compareReason}
                  </p>
                )}
                <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => onDecision("version", selected)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-primary text-[12.5px] font-medium text-white hover:bg-primary/90"
                  >
                    <History className="h-3.5 w-3.5" />
                    设为新版
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision("replace", selected)}
                    className="flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-[#E7C4C4] bg-white text-[12.5px] font-medium text-[#B94747] hover:bg-[#FFF7F7]"
                  >
                    <Replace className="h-3.5 w-3.5" />
                    覆盖已有
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[10px] border border-dashed border-[#CFE2E5] bg-[#FAFCFC] text-center">
          <CheckCircle2 className="h-10 w-10 text-[#46A77B] stroke-[1.5]" />
          <h4 className="mt-4 text-[14px] font-semibold text-kb-heading">可以作为独立资料入库</h4>
          <p className="mt-1.5 max-w-[420px] text-[11.5px] leading-5 text-kb-muted">
            点击右下角“作为新资料”继续，文件将进入正常审批流程。
          </p>
        </div>
      )}
    </div>
  );
}

function PreviewView({ candidate }: { candidate: SimilarCandidate }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-[#DCEBED] max-[760px]:grid-cols-1">
      <aside className="border-r border-[#E6EEF0] bg-[#F8FAFB] p-5 max-[760px]:border-b max-[760px]:border-r-0">
        <div className="grid h-12 w-12 place-items-center rounded-[10px] bg-white text-primary ring-1 ring-[#DCEBED]">
          <FileText className="h-5 w-5" />
        </div>
        <h3 className="mt-3 break-words text-[13px] font-semibold leading-5 text-kb-heading">
          {candidate.name}
        </h3>
        <dl className="mt-5 space-y-3 text-[11.5px]">
          <InfoItem label="版本" value={candidate.version} />
          <InfoItem label="上传时间" value={candidate.uploadedAt} />
          <InfoItem label="文件信息" value={`${candidate.fileType} / ${candidate.size}`} />
        </dl>
      </aside>
      <article className="min-h-0 overflow-y-auto bg-[#EEF2F3] p-6">
        <div className="mx-auto min-h-[560px] max-w-[760px] bg-white px-14 py-12 shadow-[0_8px_28px_rgba(43,65,75,0.08)]">
          <div className="text-center text-[17px] font-semibold text-[#273E48]">
            涉网运行管理规定
          </div>
          <div className="mt-8 space-y-5 text-[12px] leading-7 text-[#536871]">
            <p className="font-semibold text-[#334E59]">第三章 运行管理要求</p>
            <p>3.1 运行人员应按照岗位分工履行涉网运行的监视与记录职责，交接班时确认设备状态。</p>
            <p>3.2 正常运行期间，应按照运行记录要求定时记录主要运行参数，并完整保存运行日志。</p>
            <p>3.3 异常处置过程应保留必要记录，事后完成资料归档与复核。</p>
          </div>
        </div>
      </article>
    </div>
  );
}

function CompareView({
  candidate,
  candidates,
  currentFile,
  failed,
  retrying,
  onCandidateChange,
  onRetry,
}: {
  candidate: SimilarCandidate;
  candidates: SimilarCandidate[];
  currentFile: UploadFile;
  failed: boolean;
  retrying: boolean;
  onCandidateChange: (id: string) => void;
  onRetry: () => void;
}) {
  const diffs = COMPARE_BLOCKS.filter((block) => block.type);
  const [activeIndex, setActiveIndex] = useState(0);
  const { baseRef, targetRef, align, scrollToAnchor } = useAnchoredSync();

  useEffect(() => {
    setActiveIndex(0);
  }, [candidate.id]);

  const activeDiff = diffs[activeIndex];
  const activeBlockIndex = activeDiff
    ? Math.max(
        0,
        COMPARE_BLOCKS.findIndex((block) => block.id === activeDiff.id),
      )
    : 0;
  const totalPages = COMPARE_BLOCKS.length;
  const currentPage = Math.min(totalPages, activeBlockIndex + 1);

  const goToDiff = (index: number) => {
    if (!diffs.length) return;
    const next = (index + diffs.length) % diffs.length;
    setActiveIndex(next);
    scrollToAnchor(diffs[next].id);
  };

  if (failed) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <XCircle className="h-11 w-11 text-[#C94747] stroke-[1.5]" />
        <h3 className="mt-4 text-[15px] font-semibold text-kb-heading">对比生成失败</h3>
        <p className="mt-1.5 text-[11.5px] text-kb-muted">文档解析结果暂不可用，请重试生成对比。</p>
        <AppDialogButton variant="primary" loading={retrying} onClick={onRetry} className="mt-5">
          <RotateCcw className="h-3.5 w-3.5" />
          重试对比
        </AppDialogButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] items-end gap-3 max-[760px]:grid-cols-1">
        <label className="block text-[11px] text-kb-muted">
          库内版本
          <select
            value={candidate.id}
            onChange={(event) => onCandidateChange(event.target.value)}
            className="mt-1.5 h-9 w-full rounded-[8px] border border-[#DCEBED] bg-white px-3 text-[12px] text-kb-heading outline-none focus:border-primary"
          >
            {candidates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} / {item.version}
              </option>
            ))}
          </select>
        </label>
        <div className="mb-1 grid h-8 w-8 place-items-center rounded-[8px] bg-[#F0F6F7] text-primary max-[760px]:hidden">
          <GitCompareArrows className="h-4 w-4" />
        </div>
        <label className="block text-[11px] text-kb-muted">
          当前上传文件
          <div className="mt-1.5 flex h-9 items-center rounded-[8px] border border-[#DCEBED] bg-[#F8FAFB] px-3 text-[12px] font-medium text-kb-heading">
            {currentFile.name}
          </div>
        </label>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {(
          [
            ["added", DIFF_STATS.added],
            ["removed", DIFF_STATS.removed],
            ["modified", DIFF_STATS.modified],
          ] as const
        ).map(([type, count]) => (
          <DiffStatCard key={type} type={type} count={count} />
        ))}
        <div className="min-w-[220px] flex-1 px-1 py-0.5">
          <div className="text-[10.5px] text-kb-muted">差异摘要</div>
          <div className="mt-0.5 text-[12px] font-medium text-kb-heading">
            共 {DIFF_STATS.added + DIFF_STATS.removed + DIFF_STATS.modified}{" "}
            处，集中在运行记录与归档要求
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[12px] tabular-nums text-kb-muted">
            第 {diffs.length ? activeIndex + 1 : 0} / {diffs.length} 处
          </span>
          <button
            type="button"
            aria-label="上一处差异"
            disabled={!diffs.length}
            onClick={() => goToDiff(activeIndex - 1)}
            className="grid h-8 w-8 place-items-center rounded-[7px] border border-[#DCEBED] bg-white text-kb-muted hover:border-primary/40 hover:text-primary disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="下一处差异"
            disabled={!diffs.length}
            onClick={() => goToDiff(activeIndex + 1)}
            className="grid h-8 w-8 place-items-center rounded-[7px] border border-[#DCEBED] bg-white text-kb-muted hover:border-primary/40 hover:text-primary disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[10px] border border-kb-border">
        <DocumentComparePane
          title={candidate.name}
          versionLabel={candidate.version.split("·")[0]?.trim() || candidate.version}
          side="base"
          currentPage={currentPage}
          totalPages={totalPages}
          scrollRef={baseRef}
          onScroll={() => align("base")}
          activeId={activeDiff?.id}
          className="flex-1"
        />
        <DiffConnectionRail
          diff={
            activeDiff?.type
              ? {
                  type: activeDiff.type,
                  title: activeDiff.heading || activeDiff.left || activeDiff.right || activeDiff.id,
                }
              : null
          }
        />
        <DocumentComparePane
          title={currentFile.name}
          versionLabel="本次上传"
          side="target"
          currentPage={currentPage}
          totalPages={totalPages}
          scrollRef={targetRef}
          onScroll={() => align("target")}
          activeId={activeDiff?.id}
          className="flex-1"
        />
        <UploadDiffMinimap
          blocks={COMPARE_BLOCKS}
          activeId={activeDiff?.id}
          onSelect={(id) => {
            const index = diffs.findIndex((item) => item.id === id);
            if (index >= 0) goToDiff(index);
          }}
        />
      </div>
    </div>
  );
}

function UploadDiffMinimap({
  blocks,
  activeId,
  onSelect,
}: {
  blocks: DiffBlock[];
  activeId?: string;
  onSelect: (id: string) => void;
}) {
  const total = Math.max(1, blocks.length - 1);
  return (
    <div
      className="relative w-[11px] shrink-0 border-l border-kb-border bg-[#FAFCFC]"
      role="navigation"
      aria-label="差异位置缩略条"
    >
      {blocks.map((block, index) => {
        if (!block.type) return null;
        const active = block.id === activeId;
        return (
          <button
            key={block.id}
            type="button"
            title={`${DIFF_TYPE_META[block.type].label}`}
            aria-label={`跳转到差异：${DIFF_TYPE_META[block.type].label}`}
            onClick={() => onSelect(block.id)}
            style={{
              top: `calc(${(index / total) * 100}% - 3px)`,
              backgroundColor: DIFF_TYPE_META[block.type].chartColor,
            }}
            className={cn(
              "absolute left-[2px] right-[2px] h-[6px] rounded-[1px] transition-[outline] focus-visible:outline-none",
              active && "outline outline-2 outline-offset-[1px] outline-primary",
            )}
          />
        );
      })}
    </div>
  );
}

function DiffStatCard({ type, count }: { type: DiffType; count: number }) {
  const meta = DIFF_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <div className="flex min-w-[132px] items-center gap-2.5 rounded-[10px] border border-[#DCEBED] bg-white px-3 py-2">
      <span className={cn("grid h-8 w-8 place-items-center rounded-[8px]", meta.cardIcon)}>
        <Icon className="h-4 w-4 stroke-[2]" />
      </span>
      <div>
        <div className="text-[11px] text-kb-muted">{meta.label}</div>
        <div className={cn("text-[18px] font-semibold leading-5 tabular-nums", meta.valueText)}>
          {count}
        </div>
      </div>
    </div>
  );
}

function DocumentComparePane({
  title,
  versionLabel,
  side,
  currentPage,
  totalPages,
  scrollRef,
  onScroll,
  activeId,
  className,
}: {
  title: string;
  versionLabel: string;
  side: "base" | "target";
  currentPage: number;
  totalPages: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  activeId?: string;
  className?: string;
}) {
  const isBase = side === "base";
  const shortTitle = title.replace(/\.(pdf|docx?|png|jpe?g)$/i, "");

  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-kb-border bg-[#FCFDFD] px-4">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-kb-heading">
            {versionLabel} {shortTitle}
          </span>
          <span
            className={cn(
              "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[10.5px] font-medium",
              isBase ? "bg-[#EFF4F5] text-kb-muted" : "bg-primary-soft text-primary",
            )}
          >
            {isBase ? "库内版本" : "上传文件"}
          </span>
        </span>
        <span className="shrink-0 text-[11.5px] tabular-nums text-kb-muted">
          第 {currentPage} / {totalPages} 页
        </span>
      </header>
      <div
        ref={scrollRef}
        data-document-scroll={side}
        onScroll={onScroll}
        className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 text-[12px] leading-6 text-[#4F6570]"
      >
        {COMPARE_BLOCKS.map((block) => {
          const text = side === "base" ? block.left : block.right;
          const isDiff = Boolean(block.type);
          const isActive = activeId === block.id;
          return (
            <div
              key={`${side}-${block.id}`}
              data-anchor={block.id}
              data-diff-id={block.type ? block.id : undefined}
              className={cn(
                "scroll-mt-4 rounded-[4px] px-2 py-1.5 -mx-2 transition-all",
                isActive && "ring-2 ring-primary/35 ring-offset-1",
                block.type === "removed" && side === "base" && DIFF_TONE_CLASSES.remove,
                block.type === "added" && side === "target" && DIFF_TONE_CLASSES.add,
                block.type === "modified" && side === "base" && DIFF_TONE_CLASSES.modifyOld,
                block.type === "modified" && side === "target" && DIFF_TONE_CLASSES.modifyNew,
                isDiff &&
                  !text &&
                  "min-h-[44px] border border-dashed border-[#D5E2E6] bg-[#F7FAFB] text-[#8A9DA4]",
              )}
            >
              {block.heading && (
                <div className="mb-1 text-[12.5px] font-semibold text-[#334E59]">
                  {block.heading}
                </div>
              )}
              {text || (isDiff ? "此处无对应内容" : null)}
            </div>
          );
        })}
        <div className="h-10" aria-hidden />
      </div>
    </section>
  );
}

function ConfirmView({
  decision,
  file,
  candidate,
  highSimilarityCount,
  targetLocation,
}: {
  decision: Decision;
  file: UploadFile | null;
  candidate: SimilarCandidate | null;
  highSimilarityCount: number;
  targetLocation?: string;
}) {
  const config = {
    new: {
      icon: UploadCloud,
      title: "确认作为新资料上传？",
      desc: highSimilarityCount
        ? `该文件与 ${highSimilarityCount} 份资料高度相似，确认后仍会创建一份独立资料。`
        : "确认后将创建一份独立资料，并进入正常审批流程。",
      tone: "text-[#C76A16] bg-[#FFF7ED]",
    },
    version: {
      icon: History,
      title: "确认设为已有资料的新版本？",
      desc: "审批通过后，新文件成为当前版本；历史版本继续保留并形成可追溯的版本链。",
      tone: "text-primary bg-primary-soft",
    },
    replace: {
      icon: Replace,
      title: "确认覆盖已有资料？",
      desc: "覆盖会替换该资料的当前文件，不新增历史版本。此操作将在管理员审批通过后生效。",
      tone: "text-[#C94747] bg-[#FFF1F1]",
    },
  }[decision];
  const Icon = config.icon;
  return (
    <div className="mx-auto flex min-h-[280px] max-w-[720px] flex-col justify-center">
      <div className="text-center">
        <div
          className={cn("mx-auto grid h-14 w-14 place-items-center rounded-[14px]", config.tone)}
        >
          <Icon className="h-6 w-6 stroke-[1.7]" />
        </div>
        <h3 className="mt-4 text-[17px] font-semibold text-kb-heading">{config.title}</h3>
        <p className="mx-auto mt-2 max-w-[560px] text-[12px] leading-5 text-kb-muted">
          {config.desc}
        </p>
      </div>
      <div className="mt-7 overflow-hidden rounded-[10px] border border-[#DCEBED]">
        {file && <ConfirmRow label="本次上传文件" value={file.name} icon={UploadCloud} />}
        {targetLocation && <ConfirmRow label="上传位置" value={targetLocation} icon={FolderOpen} />}
        {(decision === "version" || decision === "replace") && candidate && (
          <>
            <ConfirmRow label="目标资料" value={candidate.name} icon={FileText} />
            <ConfirmRow label="当前版本" value={candidate.version} icon={History} />
          </>
        )}
        <ConfirmRow
          label="对比记录"
          value={decision === "new" ? "不创建" : "提交时自动保存"}
          icon={GitCompareArrows}
        />
      </div>
    </div>
  );
}

function ConfirmRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
}) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] items-center border-b border-[#EDF2F3] px-4 py-3 last:border-b-0">
      <div className="flex items-center gap-2 text-[11.5px] text-kb-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="truncate text-[12.5px] font-medium text-kb-heading">{value}</div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10.5px] text-kb-muted">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-kb-heading">{value}</dd>
    </div>
  );
}

function KbStatus({ label, tone }: { label: string; tone: "success" | "warning" | "neutral" }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-[5px] px-2 py-1 text-[10.5px] font-medium",
        tone === "success" && "bg-[#EEFBF3] text-[#159463]",
        tone === "warning" && "bg-[#FEF6EC] text-[#C0691A]",
        tone === "neutral" && "bg-[#F1F5F6] text-[#5E737C]",
      )}
    >
      <Check className="h-3 w-3" />
      {label}
    </span>
  );
}

function IconAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title ?? label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex h-7 items-center gap-0.5 rounded-[4px] px-1 text-[11.5px] font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-kb-muted disabled:opacity-45"
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
      {label}
    </button>
  );
}

/**
 * 解析完成后触发的相似资料识别弹窗（不含文件上传步骤）。
 * 专业库：从审核侧边栏入口打开；个人库：从文件列表行标识入口打开。
 */
export function SimilarityReviewDialog({
  open,
  fileName,
  onClose,
}: {
  open: boolean;
  fileName: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<FlowStep>("results");
  const [candidates, setCandidates] = useState<SimilarCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [failedCandidateIds, setFailedCandidateIds] = useState<string[]>(["archive"]);
  const [retrying, setRetrying] = useState(false);

  const currentFile = useMemo<UploadFile>(
    () => ({ name: fileName, size: 0, type: "application/pdf" }),
    [fileName],
  );

  useEffect(() => {
    if (!open) {
      setStep("results");
      setCandidates([]);
      setSelectedId(null);
      setDecision(null);
      setCompareOpen(false);
      setFailedCandidateIds(["archive"]);
      return;
    }
    const next = mockCandidates(currentFile);
    setCandidates(next);
    setSelectedId(next[0]?.id ?? null);
    setDecision(null);
    setCompareOpen(false);
    setStep("results");
  }, [open, currentFile]);

  const selected = candidates.find((c) => c.id === selectedId) ?? null;
  const highSimilarityCount = candidates.filter((c) => c.similarity >= 85).length;
  const showingCompare = Boolean(compareOpen && selected);

  const openDecision = (next: Decision, candidate?: SimilarCandidate) => {
    if (candidate) setSelectedId(candidate.id);
    setDecision(next);
    setStep("confirm");
  };

  const returnToResults = () => {
    setDecision(null);
    setStep("results");
    setCompareOpen(false);
  };

  const finish = () => {
    const messages: Record<Decision, string> = {
      new: "已标记忽略重复，作为独立资料保留",
      version: `已设为 ${selected?.name ?? "所选资料"} 的新版本`,
      replace: `已提交覆盖 ${selected?.name ?? "所选资料"} 的申请`,
    };
    if (decision) toast.success(messages[decision]);
    onClose();
  };

  const title = showingCompare ? "文件差异对比" : step === "confirm" ? "确认处理方式" : "相似资料识别";

  return (
    <AppFormDialog
      open={open}
      size={showingCompare || step === "preview" ? "full" : "xlarge"}
      fillHeight={showingCompare || step === "preview"}
      title={title}
      titleIcon={showingCompare ? GitCompareArrows : FileSearch}
      onClose={showingCompare ? () => setCompareOpen(false) : onClose}
      className="similarity-review-dialog"
      headerRight={
        showingCompare ? (
          <button
            type="button"
            onClick={() => setCompareOpen(false)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[8px] px-2.5 text-[12.5px] font-medium text-primary transition-colors hover:bg-primary-soft"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回相似列表
          </button>
        ) : step === "preview" ? (
          <button
            type="button"
            onClick={returnToResults}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[8px] px-2.5 text-[12.5px] font-medium text-primary transition-colors hover:bg-primary-soft"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回文件列表
          </button>
        ) : undefined
      }
      footer={
        showingCompare && selected ? (
          failedCandidateIds.includes(selected.id) ? (
            <AppDialogButton variant="outline" onClick={() => setCompareOpen(false)}>
              返回相似列表
            </AppDialogButton>
          ) : (
            <>
              <AppDialogButton
                variant="outline"
                onClick={() => {
                  setCompareOpen(false);
                  openDecision("replace", selected);
                }}
              >
                <Replace className="h-3.5 w-3.5" />
                覆盖已有
              </AppDialogButton>
              <AppDialogButton
                variant="primary"
                onClick={() => {
                  setCompareOpen(false);
                  openDecision("version", selected);
                }}
              >
                <History className="h-3.5 w-3.5" />
                设为新版
              </AppDialogButton>
            </>
          )
        ) : step === "results" ? (
          <>
            <AppDialogButton variant="outline" onClick={onClose}>
              关闭
            </AppDialogButton>
            <AppDialogButton variant="primary" onClick={() => openDecision("new")}>
              忽略，保留为独立资料
            </AppDialogButton>
          </>
        ) : step === "confirm" ? (
          <>
            <AppDialogButton variant="outline" onClick={returnToResults}>
              返回
            </AppDialogButton>
            <AppDialogButton
              variant="primary"
              onClick={finish}
              className={
                decision === "replace"
                  ? "border-[#C94747] bg-[#C94747] hover:border-[#B23C3C] hover:bg-[#B23C3C]"
                  : undefined
              }
            >
              {decision === "replace" ? "确认覆盖" : "确认提交"}
            </AppDialogButton>
          </>
        ) : undefined
      }
    >
      {showingCompare && selected ? (
        <CompareView
          candidate={selected}
          candidates={candidates.filter((c) => c.canCompare)}
          currentFile={currentFile}
          failed={failedCandidateIds.includes(selected.id)}
          retrying={retrying}
          onCandidateChange={setSelectedId}
          onRetry={() => {
            setRetrying(true);
            window.setTimeout(() => {
              setFailedCandidateIds((ids) => ids.filter((id) => id !== selected.id));
              setRetrying(false);
              toast.success("对比已重新生成");
            }, 700);
          }}
        />
      ) : step === "results" ? (
        <ResultsView
          file={currentFile}
          filesCount={1}
          candidates={candidates}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPreview={(item) => {
            setSelectedId(item.id);
            setStep("preview");
          }}
          onCompare={(item) => {
            setSelectedId(item.id);
            setCompareOpen(true);
          }}
          onDecision={openDecision}
        />
      ) : step === "preview" && selected ? (
        <PreviewView candidate={selected} />
      ) : step === "confirm" && decision ? (
        <ConfirmView
          decision={decision}
          file={currentFile}
          candidate={selected}
          highSimilarityCount={highSimilarityCount}
        />
      ) : null}
    </AppFormDialog>
  );
}
