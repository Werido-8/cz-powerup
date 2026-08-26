import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  FileSearch,
  FileText,
  GitCompareArrows,
  History,
  Library,
  Loader2,
  Replace,
  RotateCcw,
  ShieldAlert,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { KbUploadCard } from "@/components/knowledge/ui";
import { createStorePersonalFile } from "@/lib/knowledge/store";
import { pushRecentUploadBaseId } from "@/lib/knowledge/recentUpload";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

type UploadFile = { name: string; size: number; type: string };
type FlowStep = "select" | "scanning" | "results" | "preview" | "compare" | "confirm";
type Decision = "new" | "version" | "replace" | "cancel";

type SimilarCandidate = {
  id: string;
  name: string;
  version: string;
  uploadedAt: string;
  fileType: string;
  size: string;
  similarity: number;
  recommendation: string;
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
    canCompare: false,
    compareReason: "Excel 文件暂不支持正文差异对比",
  },
];

const DIFF_PARAGRAPHS = {
  left: [
    "3.2.2 正常运行期间，应按照运行记录要求，每 60 分钟记录一次主要运行参数。",
    "异常处置结束后应恢复正常监视方式。",
    "资料应在工作结束后 30 个工作日内完成归档。",
  ],
  right: [
    "3.2.2 正常运行期间，应按照运行记录要求，每 45 分钟记录一次主要运行参数；异常期间应提高记录频次。",
    "异常处置结束后应恢复正常监视方式，处置过程应留痕并由专业工程师复核签署。",
    "资料应在工作结束后 15 个工作日内完成归档，并登记文件版本与生效日期。",
  ],
};

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
}: {
  base: KnowledgeBase | null;
  onClose: () => void;
  onChangeBase?: () => void;
  initialFiles?: File[];
}) {
  const [step, setStep] = useState<FlowStep>("select");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [candidates, setCandidates] = useState<SimilarCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [failedCandidateIds, setFailedCandidateIds] = useState<string[]>(["archive"]);
  const [retrying, setRetrying] = useState(false);

  const currentFile = files[0] ?? null;
  const selected = candidates.find((item) => item.id === selectedId) ?? null;
  const highSimilarityCount = candidates.filter((item) => item.similarity >= 85).length;

  useEffect(() => {
    if (!base) {
      setStep("select");
      setFiles([]);
      setCandidates([]);
      setSelectedId(null);
      setDecision(null);
      setFailedCandidateIds(["archive"]);
      return;
    }
    if (initialFiles?.length) {
      setFiles(initialFiles.map((file) => ({ name: file.name, size: file.size, type: file.type })));
      setStep("scanning");
    }
  }, [base, initialFiles]);

  useEffect(() => {
    if (step !== "scanning" || !currentFile) return;
    const timer = window.setTimeout(() => {
      const next = mockCandidates(currentFile);
      setCandidates(next);
      setSelectedId(next[0]?.id ?? null);
      setStep("results");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [currentFile, step]);

  const title = useMemo(() => {
    if (step === "preview") return "资料预览";
    if (step === "compare") return "文件差异对比";
    if (step === "confirm") return "确认上传方式";
    return "上传文件";
  }, [step]);

  const chooseFiles = (fileList: FileList) => {
    const next = Array.from(fileList).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    if (!next.length) return;
    setFiles(next);
    setStep("scanning");
  };

  const openDecision = (next: Decision, candidate?: SimilarCandidate) => {
    if (candidate) setSelectedId(candidate.id);
    setDecision(next);
    setStep("confirm");
  };

  const finish = () => {
    if (!base || !currentFile || !decision) return;
    if (decision === "cancel") {
      toast.message("已取消本次上传");
      onClose();
      return;
    }

    pushRecentUploadBaseId(base.id);
    if (base.scope === "personal") {
      createStorePersonalFile({
        fileName: currentFile.name,
        knowledgeBaseId: base.id,
        knowledgeBaseName: base.name,
        fileSize: fileSize(currentFile.size),
      });
    }

    const messages: Record<Exclude<Decision, "cancel">, string> = {
      new: "已作为新资料提交，后续进入正常审批流程",
      version: `已作为 ${selected?.name ?? "所选资料"} 的新版本提交，并保存对比记录`,
      replace: `已提交覆盖 ${selected?.name ?? "所选资料"} 的申请，并保存对比记录`,
    };
    toast.success(messages[decision]);
    onClose();
  };

  const returnToResults = () => {
    setDecision(null);
    setStep("results");
  };

  if (!base) return null;

  return (
    <AppFormDialog
      open
      size={step === "select" || step === "scanning" ? "medium" : "xlarge"}
      title={title}
      titleIcon={step === "compare" ? GitCompareArrows : UploadCloud}
      onClose={() => openDecision("cancel")}
      className={cn(
        "upload-similarity-dialog",
        step !== "select" && step !== "scanning" && "min-h-[650px]",
      )}
      footer={
        step === "results" ? (
          <>
            <AppDialogButton variant="outline" onClick={() => openDecision("cancel")}>
              取消上传
            </AppDialogButton>
            <AppDialogButton variant="primary" onClick={() => openDecision("new")}>
              作为新资料上传
            </AppDialogButton>
          </>
        ) : step === "preview" || step === "compare" ? (
          <AppDialogButton variant="outline" onClick={returnToResults}>
            <ArrowLeft className="h-3.5 w-3.5" />
            返回识别结果
          </AppDialogButton>
        ) : step === "confirm" ? (
          <>
            <AppDialogButton
              variant="outline"
              onClick={decision === "cancel" && !currentFile ? onClose : returnToResults}
            >
              返回
            </AppDialogButton>
            <AppDialogButton
              variant="primary"
              onClick={finish}
              className={
                decision === "replace" || decision === "cancel"
                  ? "border-[#C94747] bg-[#C94747] hover:border-[#B23C3C] hover:bg-[#B23C3C]"
                  : undefined
              }
            >
              {decision === "cancel"
                ? "确认取消"
                : decision === "replace"
                  ? "确认覆盖"
                  : "确认提交"}
            </AppDialogButton>
          </>
        ) : undefined
      }
    >
      {step === "select" && (
        <div className="space-y-4">
          <BaseBar base={base} onChangeBase={onChangeBase} />
          <KbUploadCard
            title="拖入文件或选择上传"
            hint="支持 PDF、Word、Excel、PPT；选择后先进行基础校验与相似资料识别"
            onUpload={chooseFiles}
            className="min-h-[172px]"
          />
          <div className="flex items-start gap-2 rounded-[8px] bg-[#F5F9FA] px-3 py-2.5 text-[11.5px] leading-5 text-kb-muted">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            相似识别只用于辅助判断，最终上传方式由你确认。识别过程中不会正式入库。
          </div>
        </div>
      )}

      {step === "scanning" && currentFile && (
        <div className="flex min-h-[350px] flex-col items-center justify-center px-8 text-center">
          <div className="relative grid h-16 w-16 place-items-center rounded-[16px] bg-primary-soft text-primary">
            <FileSearch className="h-7 w-7 stroke-[1.7]" />
            <Loader2 className="absolute -right-1 -top-1 h-5 w-5 animate-spin rounded-full bg-white p-0.5" />
          </div>
          <h3 className="mt-5 text-[17px] font-semibold text-kb-heading">正在识别库内相似资料</h3>
          <p className="mt-1.5 max-w-[430px] text-[12.5px] leading-5 text-kb-muted">
            已完成格式与文件名校验，正在根据标题、版本信息和资料元数据检索候选项。
          </p>
          <FileStrip file={currentFile} className="mt-6 w-full max-w-[520px]" />
          <div className="mt-5 h-1.5 w-full max-w-[360px] overflow-hidden rounded-full bg-[#E8F0F2]">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      )}

      {step === "results" && currentFile && (
        <ResultsView
          file={currentFile}
          filesCount={files.length}
          candidates={candidates}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPreview={(item) => {
            setSelectedId(item.id);
            setStep("preview");
          }}
          onCompare={(item) => {
            setSelectedId(item.id);
            setStep("compare");
          }}
          onDecision={openDecision}
        />
      )}

      {step === "preview" && selected && currentFile && <PreviewView candidate={selected} />}

      {step === "compare" && selected && currentFile && (
        <CompareView
          candidate={selected}
          candidates={candidates.filter((item) => item.canCompare)}
          currentFile={currentFile}
          failed={failedCandidateIds.includes(selected.id)}
          retrying={retrying}
          onCandidateChange={(id) => setSelectedId(id)}
          onRetry={() => {
            setRetrying(true);
            window.setTimeout(() => {
              setFailedCandidateIds((ids) => ids.filter((id) => id !== selected.id));
              setRetrying(false);
              toast.success("对比已重新生成");
            }, 700);
          }}
          onDecision={openDecision}
        />
      )}

      {step === "confirm" && decision && (
        <ConfirmView
          decision={decision}
          file={currentFile}
          candidate={selected}
          highSimilarityCount={highSimilarityCount}
        />
      )}
    </AppFormDialog>
  );
}

function BaseBar({ base, onChangeBase }: { base: KnowledgeBase; onChangeBase?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-[#DCEBED] bg-[#F8FAFB] px-3 py-2.5">
      <Library className="h-4 w-4 shrink-0 text-primary stroke-[1.8]" />
      <div className="min-w-0">
        <div className="text-[11px] text-kb-muted">目标知识库</div>
        <div className="truncate text-[13px] font-medium text-kb-heading">{base.name}</div>
      </div>
      {onChangeBase && (
        <button
          type="button"
          onClick={onChangeBase}
          className="ml-auto shrink-0 text-[11.5px] text-primary hover:underline"
        >
          更换
        </button>
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
      <KbStatus label="校验通过" tone="success" />
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
      <div
        className={cn(
          "flex items-start gap-3 rounded-[10px] border px-4 py-3.5",
          candidates.length ? "border-[#F1D8B7] bg-[#FFF9F1]" : "border-[#CDE9DA] bg-[#F1FBF5]",
        )}
      >
        {candidates.length ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#C76A16]" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#159463]" />
        )}
        <div>
          <h3 className="text-[14px] font-semibold text-kb-heading">
            {candidates.length
              ? `发现 ${candidates.length} 份可能相关资料，请确认本次上传方式`
              : "未发现相似资料，可以直接作为新资料上传"}
          </h3>
          <p className="mt-1 text-[11.5px] leading-5 text-kb-muted">
            {candidates.length
              ? "候选结果已按推荐程度排序。选择一份资料后可预览、对比或指定处理方式。"
              : "系统已完成标题与基础信息检索，本次上传不会建立版本关系。"}
          </p>
        </div>
      </div>

      <FileStrip file={file} />
      {filesCount > 1 && (
        <p className="-mt-2 text-[11px] text-kb-muted">
          本次共选择 {filesCount} 个文件，演示流程当前处理第 1 个文件。
        </p>
      )}

      {candidates.length > 0 ? (
        <div className="grid min-h-[350px] grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] overflow-hidden rounded-[10px] border border-[#DCEBED] max-[760px]:grid-cols-1">
          <div className="border-r border-[#E6EEF0] max-[760px]:border-b max-[760px]:border-r-0">
            <div className="flex h-10 items-center justify-between bg-[#F7FAFB] px-4 text-[11.5px] font-medium text-kb-muted">
              <span>相似资料候选</span>
              <span>共 {candidates.length} 份</span>
            </div>
            <div className="divide-y divide-[#EDF2F3]">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => onSelect(candidate.id)}
                  className={cn(
                    "grid w-full grid-cols-[40px_minmax(0,1fr)_58px] items-center gap-3 px-4 py-3.5 text-left transition-colors",
                    selectedId === candidate.id
                      ? "bg-[#EEF8F9] shadow-[inset_3px_0_0_#2F9EAC]"
                      : "hover:bg-[#F9FBFC]",
                  )}
                >
                  <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-white text-primary ring-1 ring-[#DCEBED]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[12.5px] font-medium text-kb-heading">
                      {candidate.name}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-kb-muted">
                      <span>{candidate.version}</span>
                      <span>{candidate.uploadedAt}</span>
                      <span>{candidate.fileType}</span>
                    </div>
                    <p className="mt-1 truncate text-[10.5px] text-[#617A83]">
                      {candidate.recommendation}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[16px] font-semibold tabular-nums text-primary">
                      {candidate.similarity}%
                    </div>
                    <div className="text-[9.5px] text-kb-muted">相似度</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-col bg-white p-4">
            {selected ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11.5px] font-medium text-kb-muted">已选资料</span>
                  <KbStatus
                    label={selected.similarity >= 90 ? "高度相似" : "可能相关"}
                    tone={selected.similarity >= 90 ? "warning" : "neutral"}
                  />
                </div>
                <h4 className="mt-3 break-words text-[14px] font-semibold leading-5 text-kb-heading">
                  {selected.name}
                </h4>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[11.5px]">
                  <InfoItem label="当前版本" value={selected.version} />
                  <InfoItem label="文件大小" value={selected.size} />
                  <InfoItem label="上传时间" value={selected.uploadedAt} />
                  <InfoItem label="文件类型" value={selected.fileType} />
                </dl>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <SmallAction icon={Eye} label="查看资料" onClick={() => onPreview(selected)} />
                  <SmallAction
                    icon={GitCompareArrows}
                    label="对比"
                    onClick={() => onCompare(selected)}
                    disabled={!selected.canCompare}
                    title={selected.compareReason}
                  />
                </div>
                {!selected.canCompare && (
                  <p className="mt-2 text-[10.5px] leading-4 text-[#C0691A]">
                    {selected.compareReason}
                  </p>
                )}
                <div className="mt-auto space-y-2 pt-5">
                  <button
                    type="button"
                    onClick={() => onDecision("version", selected)}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] bg-primary text-[12.5px] font-medium text-white hover:bg-primary/90"
                  >
                    <History className="h-3.5 w-3.5" />
                    设为新版本
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision("replace", selected)}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[8px] border border-[#E7C4C4] bg-white text-[12.5px] font-medium text-[#B94747] hover:bg-[#FFF7F7]"
                  >
                    <Replace className="h-3.5 w-3.5" />
                    覆盖已有资料
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
            点击右下角“作为新资料上传”继续，文件将进入正常审批流程。
          </p>
        </div>
      )}
    </div>
  );
}

function PreviewView({ candidate }: { candidate: SimilarCandidate }) {
  return (
    <div className="grid min-h-[500px] grid-cols-[260px_minmax(0,1fr)] overflow-hidden rounded-[10px] border border-[#DCEBED] max-[760px]:grid-cols-1">
      <aside className="border-r border-[#E6EEF0] bg-[#F8FAFB] p-4 max-[760px]:border-b max-[760px]:border-r-0">
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
      <article className="bg-[#EEF2F3] p-5">
        <div className="mx-auto min-h-[450px] max-w-[620px] bg-white px-12 py-10 shadow-[0_8px_28px_rgba(43,65,75,0.08)]">
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
  onDecision,
}: {
  candidate: SimilarCandidate;
  candidates: SimilarCandidate[];
  currentFile: UploadFile;
  failed: boolean;
  retrying: boolean;
  onCandidateChange: (id: string) => void;
  onRetry: () => void;
  onDecision: (decision: Decision, candidate?: SimilarCandidate) => void;
}) {
  if (failed) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
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
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_36px_minmax(0,1fr)] items-end gap-3 max-[760px]:grid-cols-1">
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

      <div className="grid grid-cols-[repeat(3,minmax(0,1fr))_1.4fr] overflow-hidden rounded-[10px] border border-[#DCEBED] max-[760px]:grid-cols-2">
        <DiffStat label="新增" value="12" tone="text-[#159463]" />
        <DiffStat label="删除" value="6" tone="text-[#C94747]" />
        <DiffStat label="修改" value="8" tone="text-[#C76A16]" />
        <div className="border-l border-[#E6EEF0] bg-[#F8FAFB] px-4 py-3 max-[760px]:border-l-0 max-[760px]:border-t">
          <div className="text-[10.5px] text-kb-muted">差异摘要</div>
          <div className="mt-1 text-[11.5px] font-medium text-kb-heading">
            共识别 26 处差异，主要集中在运行记录与资料归档要求。
          </div>
        </div>
      </div>

      <div className="grid min-h-[350px] grid-cols-2 overflow-hidden rounded-[10px] border border-[#DCEBED] max-[760px]:grid-cols-1">
        <DocumentComparePane
          title={candidate.name}
          label="库内文件"
          paragraphs={DIFF_PARAGRAPHS.left}
          old
        />
        <DocumentComparePane
          title={currentFile.name}
          label="上传文件"
          paragraphs={DIFF_PARAGRAPHS.right}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-[#F6FAFA] px-4 py-3">
        <p className="text-[11px] text-kb-muted">对比记录会随本次申请保存，管理员审批时可查看。</p>
        <div className="flex gap-2">
          <SmallAction
            icon={History}
            label="设为新版本"
            onClick={() => onDecision("version", candidate)}
          />
          <SmallAction
            icon={Replace}
            label="覆盖已有资料"
            danger
            onClick={() => onDecision("replace", candidate)}
          />
        </div>
      </div>
    </div>
  );
}

function DocumentComparePane({
  title,
  label,
  paragraphs,
  old,
}: {
  title: string;
  label: string;
  paragraphs: string[];
  old?: boolean;
}) {
  return (
    <section className={cn("min-w-0", old ? "border-r border-[#E6EEF0]" : "")}>
      <header className="border-b border-[#E6EEF0] bg-[#F8FAFB] px-4 py-2.5">
        <div className="text-[10px] text-kb-muted">{label}</div>
        <div className="mt-0.5 truncate text-[11.5px] font-medium text-kb-heading">{title}</div>
      </header>
      <div className="space-y-4 p-5 text-[11.5px] leading-6 text-[#4F6570]">
        {paragraphs.map((paragraph, index) => (
          <p
            key={paragraph}
            className={cn(
              index > 0 && "rounded-[6px] px-2 py-1",
              index > 0 &&
                (old
                  ? "bg-[#FFF1F1] text-[#8F4545] line-through decoration-[#D98A8A]"
                  : "bg-[#EFFAF4] text-[#317357]"),
            )}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}

function ConfirmView({
  decision,
  file,
  candidate,
  highSimilarityCount,
}: {
  decision: Decision;
  file: UploadFile | null;
  candidate: SimilarCandidate | null;
  highSimilarityCount: number;
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
    cancel: {
      icon: XCircle,
      title: "确认取消本次上传？",
      desc: "取消后上传流程结束，本次识别结果不会保存。",
      tone: "text-[#C94747] bg-[#FFF1F1]",
    },
  }[decision];
  const Icon = config.icon;
  return (
    <div className="mx-auto flex min-h-[430px] max-w-[720px] flex-col justify-center">
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
        {(decision === "version" || decision === "replace") && candidate && (
          <>
            <ConfirmRow label="目标资料" value={candidate.name} icon={FileText} />
            <ConfirmRow label="当前版本" value={candidate.version} icon={History} />
          </>
        )}
        {decision !== "cancel" && (
          <ConfirmRow
            label="对比记录"
            value={decision === "new" ? "不创建" : "提交时自动保存"}
            icon={GitCompareArrows}
          />
        )}
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

function DiffStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border-r border-[#E6EEF0] px-4 py-3 last:border-r-0">
      <div className="text-[10.5px] text-kb-muted">{label}</div>
      <div className={cn("mt-0.5 text-[20px] font-semibold tabular-nums", tone)}>{value}</div>
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

function SmallAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
  danger,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-[8px] border px-3 text-[11.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        danger
          ? "border-[#E7C4C4] bg-white text-[#B94747] hover:bg-[#FFF7F7]"
          : "border-[#DCEBED] bg-white text-[#334E59] hover:border-primary/35 hover:text-primary",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
