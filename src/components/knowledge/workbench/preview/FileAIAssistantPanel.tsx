import { useNavigate } from "@tanstack/react-router";
import {
  BookOpenCheck,
  Check,
  ChevronDown,
  ChevronUp,
  CircleCheck,
  FileText,
  GitFork,
  GraduationCap,
  Hash,
  ListChecks,
  Loader2,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  SearchCheck,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormTextarea } from "@/components/ui/app-form";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui/KbFormDialog";
import { KbHighlightText } from "@/components/knowledge/ui";
import {
  getDemoRoleKey,
  getDemoRoleServerSnapshot,
  subscribeDemoRole,
} from "@/lib/knowledge/demoRole";
import {
  getFilePracticeAnalysis,
  getFilePracticeQuestions,
  regenerateFilePracticeQuestion,
  type FilePracticeQuestion,
} from "@/lib/knowledge/filePractice";
import {
  countFilePracticeDraftAnswers,
  loadFileLastPracticeScore,
} from "@/lib/knowledge/filePracticeProgress";
import { getFileMatchChunks } from "@/lib/knowledge/fulltextSearch";
import type { KnowledgeBase, KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

function PanelSection({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Hash;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-[#EEF2F4] bg-card px-4 py-4 shadow-[0_1px_3px_rgba(31,52,64,0.03)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
          <Icon className="h-4 w-4 text-primary stroke-[1.8]" />
          {title}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function MindMapBoard({
  fileName,
  branches,
  zoom,
  expanded = false,
  onZoomOut,
  onZoomIn,
  onOpen,
}: {
  fileName: string;
  branches: string[];
  zoom: number;
  expanded?: boolean;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onOpen: () => void;
}) {
  const tree = useMemo(() => buildFileMindMap(fileName, branches), [fileName, branches]);
  const layout = useMemo(() => buildMindMapLayout(tree, expanded), [tree, expanded]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[8px] border border-kb-border bg-[#F7FBFC]",
        expanded ? "min-h-[460px]" : "min-h-[240px]",
      )}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-[7px] border border-kb-border bg-card/95 p-1 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          aria-label="缩小知识脑图"
          title="缩小"
          onClick={onZoomOut}
          className="flex h-7 w-7 items-center justify-center rounded-[5px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <Minus className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
        <span className="min-w-8 text-center text-[10px] font-medium text-kb-muted">{zoom}%</span>
        <button
          type="button"
          aria-label="放大知识脑图"
          title="放大"
          onClick={onZoomIn}
          className="flex h-7 w-7 items-center justify-center rounded-[5px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <Plus className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
        {!expanded ? (
          <button
            type="button"
            aria-label="打开知识脑图"
            title="打开脑图"
            onClick={onOpen}
            className="flex h-7 w-7 items-center justify-center rounded-[5px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <Maximize2 className="h-3.5 w-3.5 stroke-[1.8]" />
          </button>
        ) : null}
      </div>

      <div
        className={cn(
          "flex origin-center items-center justify-center px-2 py-4 transition-transform duration-150",
          expanded ? "min-h-[460px]" : "min-h-[240px]",
        )}
        style={{ transform: `scale(${zoom / 100})` }}
      >
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className={cn("h-auto w-full", expanded ? "max-w-[960px]" : "max-w-[560px]")}
          role="img"
          aria-label={`${tree.label}知识脑图`}
        >
          {layout.links.map((link) => (
            <path
              key={link.id}
              d={link.d}
              fill="none"
              stroke={link.level === 1 ? "rgba(20,150,180,0.45)" : "rgba(20,150,180,0.28)"}
              strokeWidth={link.level === 1 ? 1.6 : 1.2}
              strokeLinecap="round"
            />
          ))}

          <rect
            x={layout.root.x}
            y={layout.root.y}
            width={layout.root.w}
            height={layout.root.h}
            rx={10}
            fill="#1496B4"
          />
          {wrapSvgText(layout.root.label, layout.root.x + layout.root.w / 2, layout.root.y + layout.root.h / 2, {
            maxChars: expanded ? 10 : 8,
            maxLines: 2,
            fontSize: expanded ? 13 : 11.5,
            fill: "#FFFFFF",
            fontWeight: 600,
          })}

          {layout.nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={7}
                fill={node.level === 1 ? "#FFFFFF" : "#F2F8FA"}
                stroke={node.level === 1 ? "rgba(20,150,180,0.28)" : "#D8E8EC"}
                strokeWidth={1}
              />
              {wrapSvgText(node.label, node.x + node.w / 2, node.y + node.h / 2, {
                maxChars: expanded ? (node.level === 1 ? 8 : 7) : node.level === 1 ? 7 : 6,
                maxLines: 1,
                fontSize: expanded ? (node.level === 1 ? 12 : 11) : node.level === 1 ? 11 : 10,
                fill: node.level === 1 ? "#203A43" : "#526670",
                fontWeight: node.level === 1 ? 600 : 500,
              })}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

type MindMapTreeNode = {
  label: string;
  children: Array<{ label: string; children?: string[] }>;
};

type MindMapLayoutNode = {
  id: string;
  label: string;
  level: 1 | 2;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  side: "left" | "right";
};

type MindMapLayoutLink = {
  id: string;
  level: 1 | 2;
  d: string;
};

function buildFileMindMap(fileName: string, branches: string[]): MindMapTreeNode {
  const title = fileName.replace(/\.[^.]+$/, "");
  if (/并网|运行规程|调度|异常/.test(title) || branches.some((item) => /并网|运行/.test(item))) {
    return {
      label: title,
      children: [
        {
          label: "适用范围",
          children: ["并网运行机组", "值班运行人员", "调度联系场景"],
        },
        {
          label: "日常监视",
          children: ["运行参数巡检", "告警分级确认", "交接班核查"],
        },
        {
          label: "异常处置",
          children: ["现场状态确认", "分级上报路径", "隔离与复盘"],
        },
        {
          label: "调度协同",
          children: ["调令接收执行", "联系确认留痕", "闭环销号"],
        },
      ],
    };
  }

  const primary =
    branches.length >= 4
      ? branches.slice(0, 4)
      : ["核心要点", "执行要求", "风险提示", "闭环管理"];

  return {
    label: title,
    children: primary.map((label, index) => ({
      label,
      children:
        index === 0
          ? ["适用范围", "责任分工"]
          : index === 1
            ? ["操作步骤", "确认节点"]
            : index === 2
              ? ["常见风险", "处置口径"]
              : ["记录留痕", "复盘改进"],
    })),
  };
}

function buildMindMapLayout(tree: MindMapTreeNode, expanded: boolean) {
  const width = expanded ? 920 : 540;
  const height = expanded ? 420 : 250;
  const rootW = expanded ? 168 : 128;
  const rootH = expanded ? 58 : 48;
  const branchW = expanded ? 108 : 88;
  const branchH = expanded ? 32 : 28;
  const leafW = expanded ? 100 : 84;
  const leafH = expanded ? 26 : 22;
  const leafGap = expanded ? 8 : 6;
  const branchGap = expanded ? 28 : 18;
  const sideGap = expanded ? 56 : 36;

  const root = {
    label: tree.label,
    x: (width - rootW) / 2,
    y: (height - rootH) / 2,
    w: rootW,
    h: rootH,
    cx: width / 2,
    cy: height / 2,
  };

  const left = tree.children.slice(0, Math.ceil(tree.children.length / 2));
  const right = tree.children.slice(Math.ceil(tree.children.length / 2));
  const nodes: MindMapLayoutNode[] = [];
  const links: MindMapLayoutLink[] = [];

  const placeSide = (items: MindMapTreeNode["children"], side: "left" | "right") => {
    const clusterHeights = items.map((item) => {
      const childCount = Math.min(item.children?.length ?? 0, expanded ? 4 : 3);
      return (
        branchH +
        (childCount > 0 ? 12 + childCount * leafH + Math.max(childCount - 1, 0) * leafGap : 0)
      );
    });
    const totalHeight =
      clusterHeights.reduce((sum, value) => sum + value, 0) +
      Math.max(items.length - 1, 0) * branchGap;
    let cursorY = Math.max(12, (height - totalHeight) / 2);

    items.forEach((item, index) => {
      const childLabels = (item.children ?? []).slice(0, expanded ? 4 : 3);
      const clusterH = clusterHeights[index];
      const branchX = side === "left" ? root.x - sideGap - branchW : root.x + root.w + sideGap;
      const branchY = cursorY;
      const branchCx = branchX + branchW / 2;
      const branchCy = branchY + branchH / 2;
      const branchId = `${side}-b-${index}`;

      nodes.push({
        id: branchId,
        label: item.label,
        level: 1,
        x: branchX,
        y: branchY,
        w: branchW,
        h: branchH,
        cx: branchCx,
        cy: branchCy,
        side,
      });

      const rootJoinX = side === "left" ? root.x : root.x + root.w;
      const branchJoinX = side === "left" ? branchX + branchW : branchX;
      const ctrl = side === "left" ? rootJoinX - sideGap * 0.55 : rootJoinX + sideGap * 0.55;
      links.push({
        id: `${branchId}-link`,
        level: 1,
        d: `M ${rootJoinX} ${root.cy} C ${ctrl} ${root.cy}, ${ctrl} ${branchCy}, ${branchJoinX} ${branchCy}`,
      });

      if (childLabels.length > 0) {
        const leafX = side === "left" ? branchX - 20 - leafW : branchX + branchW + 20;
        childLabels.forEach((label, leafIndex) => {
          const y = branchY + branchH + 12 + leafIndex * (leafH + leafGap);
          const leafId = `${branchId}-l-${leafIndex}`;
          const leafCy = y + leafH / 2;
          nodes.push({
            id: leafId,
            label,
            level: 2,
            x: leafX,
            y,
            w: leafW,
            h: leafH,
            cx: leafX + leafW / 2,
            cy: leafCy,
            side,
          });

          const fromX = side === "left" ? branchX : branchX + branchW;
          const toX = side === "left" ? leafX + leafW : leafX;
          const midX = side === "left" ? fromX - 12 : fromX + 12;
          links.push({
            id: `${leafId}-link`,
            level: 2,
            d: `M ${fromX} ${branchCy} C ${midX} ${branchCy}, ${midX} ${leafCy}, ${toX} ${leafCy}`,
          });
        });
      }

      cursorY += clusterH + branchGap;
    });
  };

  placeSide(left, "left");
  placeSide(right, "right");

  return { width, height, root, nodes, links };
}

function wrapSvgText(
  text: string,
  x: number,
  y: number,
  options: {
    maxChars: number;
    maxLines: number;
    fontSize: number;
    fill: string;
    fontWeight?: number;
  },
) {
  const lines: string[] = [];
  let rest = text;
  while (rest.length > 0 && lines.length < options.maxLines) {
    if (rest.length <= options.maxChars || lines.length === options.maxLines - 1) {
      lines.push(
        rest.length > options.maxChars ? `${rest.slice(0, options.maxChars - 1)}…` : rest,
      );
      break;
    }
    lines.push(rest.slice(0, options.maxChars));
    rest = rest.slice(options.maxChars);
  }

  const lineHeight = options.fontSize + 3;
  const startY = y - ((lines.length - 1) * lineHeight) / 2 + options.fontSize * 0.35;

  return (
    <text
      x={x}
      y={startY}
      textAnchor="middle"
      fill={options.fill}
      fontSize={options.fontSize}
      fontWeight={options.fontWeight ?? 500}
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function FileAIAssistantPanel({
  file,
  base,
  showHitTabs = false,
  searchQuery = "",
  onJumpToPage,
}: {
  file: KnowledgeFile;
  base: KnowledgeBase;
  /** When true, render tab switcher: "搜索命中" | "智能解读" */
  showHitTabs?: boolean;
  searchQuery?: string;
  onJumpToPage?: (page: number) => void;
}) {
  const navigate = useNavigate();
  const questions = useMemo(() => getFilePracticeQuestions(file), [file]);
  const keywords = file.aiKeywords ?? file.tags ?? [];
  const enabled = file.parseStatus === "success" && file.status === "published";
  const fileLastScore = loadFileLastPracticeScore(file.id);
  const filePracticeDraftCount = countFilePracticeDraftAnswers(
    file.id,
    questions.map((item) => item.id),
  );
  const role = useSyncExternalStore(subscribeDemoRole, getDemoRoleKey, getDemoRoleServerSnapshot);
  const isAdmin = role !== "employee";
  const [displayedQuestions, setDisplayedQuestions] = useState<FilePracticeQuestion[]>(questions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingQuestion, setDeletingQuestion] = useState<FilePracticeQuestion | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<FilePracticeQuestion | null>(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [mindMapZoom, setMindMapZoom] = useState(100);
  const [mindMapOpen, setMindMapOpen] = useState(false);

  // Search-hit tab state
  const [activeTab, setActiveTab] = useState<"hits" | "interpret">("hits");
  const [activeHitIndex, setActiveHitIndex] = useState(0);
  const chunks = useMemo(
    () => (showHitTabs && searchQuery ? getFileMatchChunks(file, searchQuery) : []),
    [file, searchQuery, showHitTabs],
  );

  useEffect(() => {
    setDisplayedQuestions(questions);
    setSelectedIds([]);
    setDeletingQuestion(null);
    setViewingQuestion(null);
    setDetailEditing(false);
    setMindMapZoom(100);
    setMindMapOpen(false);
  }, [file.id, questions]);

  // Jump to first hit when file or chunks change
  useEffect(() => {
    setActiveHitIndex(0);
    if (showHitTabs && chunks.length > 0 && onJumpToPage) {
      onJumpToPage(chunks[0].page);
    }
  }, [file.id, chunks, showHitTabs, onJumpToPage]);

  const jumpToHit = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, chunks.length - 1));
    setActiveHitIndex(safeIndex);
    if (onJumpToPage && chunks[safeIndex]) {
      onJumpToPage(chunks[safeIndex].page);
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const submitSelectedQuestions = () => {
    if (selectedIds.length === 0) return;
    toast.success(
      isAdmin
        ? `已将 ${selectedIds.length} 道练习题提交至题库`
        : `已提交 ${selectedIds.length} 道练习题至题库`,
    );
  };

  const openQuestionDetail = (question: FilePracticeQuestion, editing = false) => {
    setViewingQuestion(question);
    setDetailEditing(editing);
  };

  const saveQuestion = (next: FilePracticeQuestion, submitToBank = false) => {
    setDisplayedQuestions((current) =>
      current.map((question) => (question.id === next.id ? next : question)),
    );
    if (submitToBank) {
      setViewingQuestion(null);
      setDetailEditing(false);
      toast.success("已保存并提交至题库");
      return;
    }
    setViewingQuestion(next);
    setDetailEditing(false);
    toast.success("练习题已更新");
  };

  const deleteQuestion = () => {
    if (!deletingQuestion) return;
    setDisplayedQuestions((current) =>
      current.filter((question) => question.id !== deletingQuestion.id),
    );
    setSelectedIds((current) => current.filter((id) => id !== deletingQuestion.id));
    toast.success("练习题已删除");
    setDeletingQuestion(null);
  };

  return (
    <aside className="flex w-[390px] shrink-0 flex-col border-l border-[#E0E9EB] bg-white 2xl:w-[420px]">
      {/* Tab bar — only shown when full-text search context is active */}
      {showHitTabs && (
        <div className="flex shrink-0 gap-1 border-b border-[#E8EFF1] px-3 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab("hits")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-t-[7px] px-3 py-2 text-[12.5px] font-medium transition-colors",
              activeTab === "hits"
                ? "bg-primary-soft/60 text-primary"
                : "text-kb-muted hover:bg-kb-surface hover:text-kb-heading",
            )}
          >
            <SearchCheck className="h-3.5 w-3.5 stroke-[1.8]" />
            搜索命中
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("interpret")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-t-[7px] px-3 py-2 text-[12.5px] font-medium transition-colors",
              activeTab === "interpret"
                ? "bg-primary-soft/60 text-primary"
                : "text-kb-muted hover:bg-kb-surface hover:text-kb-heading",
            )}
          >
            <BookOpenCheck className="h-3.5 w-3.5 stroke-[1.8]" />
            智能解读
          </button>
        </div>
      )}

      {/* ── 搜索命中 tab ──────────────────────────────────────── */}
      {showHitTabs && activeTab === "hits" && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Header: hit count + prev/next navigation */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E8EFF1] px-4 py-2.5">
            <span className="text-[12.5px] font-medium text-kb-heading">
              本文件命中{" "}
              <span className="font-semibold text-primary">{chunks.length}</span> 处
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="上一处命中"
                disabled={chunks.length === 0 || activeHitIndex === 0}
                onClick={() => jumpToHit(activeHitIndex - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#DCE8EA] text-kb-muted transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronUp className="h-4 w-4 stroke-[2]" />
              </button>
              <button
                type="button"
                aria-label="下一处命中"
                disabled={chunks.length === 0 || activeHitIndex >= chunks.length - 1}
                onClick={() => jumpToHit(activeHitIndex + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[#DCE8EA] text-kb-muted transition-colors hover:border-primary/30 hover:bg-primary-soft hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronDown className="h-4 w-4 stroke-[2]" />
              </button>
            </div>
          </div>

          {/* Hit list */}
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
            {chunks.length === 0 ? (
              <div className="flex flex-1 items-center justify-center py-12 text-center text-[12px] text-kb-muted">
                当前文件无命中内容
              </div>
            ) : (
              <div className="space-y-2">
                {chunks.map((chunk, index) => (
                  <button
                    key={chunk.id}
                    type="button"
                    onClick={() => jumpToHit(index)}
                    className={cn(
                      "w-full rounded-[8px] border px-3.5 py-3 text-left transition-colors",
                      index === activeHitIndex
                        ? "border-primary/30 bg-primary-soft/40"
                        : "border-[#EEF2F4] bg-white hover:border-primary/20 hover:bg-primary-soft/20",
                    )}
                  >
                    <p className="line-clamp-3 text-[12.5px] leading-relaxed text-kb-body">
                      <KbHighlightText text={chunk.text} keyword={chunk.keyword} />
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 智能解读 tab (or full content when no tabs) ─────────── */}
      {(!showHitTabs || activeTab === "interpret") && (
      <div className={cn("scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-3 pr-2.5")}>
        <section className="rounded-[8px] border border-[#EEF2F4] bg-card px-4 py-4 shadow-[0_1px_3px_rgba(31,52,64,0.03)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
                <BookOpenCheck className="h-4 w-4 text-primary stroke-[1.8]" />
                智能解读
              </div>
              <p className="mt-0.5 truncate text-[10.5px] text-kb-muted">来源：{base.name}</p>
            </div>
            <span className="shrink-0 text-[11px] text-kb-muted">
              {enabled ? "解析完成" : "等待解析"}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-kb-heading">
                <Hash className="h-3.5 w-3.5 text-primary stroke-[1.8]" />
                关键字
              </div>
              {keywords.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {keywords.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-[4px] border border-primary/18 bg-primary-soft/40 px-2 py-1 text-[11px] text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-kb-muted">解析完成后自动提取关键字。</p>
              )}
            </div>

            <div className="border-t border-divider pt-3">
              <p className="mb-2 text-[12px] font-medium text-kb-heading">摘要</p>
              <p className="text-[12.5px] leading-6 text-kb-body">
                {file.summary ?? "解析完成后将自动生成文档摘要。"}
              </p>
            </div>
          </div>
        </section>

        <PanelSection title="知识脑图" icon={GitFork}>
          {enabled ? (
            <MindMapBoard
              fileName={file.name}
              branches={keywords}
              zoom={mindMapZoom}
              onZoomOut={() => setMindMapZoom((value) => Math.max(80, value - 10))}
              onZoomIn={() => setMindMapZoom((value) => Math.min(130, value + 10))}
              onOpen={() => setMindMapOpen(true)}
            />
          ) : (
            <p className="text-[12px] text-kb-muted">解析完成后生成知识结构。</p>
          )}
        </PanelSection>

        <PanelSection
          title="练习题"
          icon={GraduationCap}
          action={
            enabled ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    navigate({
                      to: "/knowledge-practice/$fileId",
                      params: { fileId: file.id },
                    })
                  }
                  className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-primary/25 bg-primary-soft/25 px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft/55"
                >
                  <ListChecks className="h-3.5 w-3.5 stroke-[1.8]" />
                  {filePracticeDraftCount > 0
                    ? "继续练习"
                    : fileLastScore
                      ? "再练一次"
                      : "开始练习"}
                </button>
                <button
                  type="button"
                  onClick={submitSelectedQuestions}
                  disabled={selectedIds.length === 0}
                  className="inline-flex h-8 items-center gap-1 rounded-[6px] border border-primary/25 bg-card px-2.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft/30 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="h-3.5 w-3.5 stroke-[1.8]" />
                  提交题库
                </button>
              </div>
            ) : undefined
          }
        >
          {enabled ? (
            <>
              {(fileLastScore || filePracticeDraftCount > 0) && (
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[7px] border border-[#E8F2F4] bg-[#F7FBFC] px-2.5 py-2 text-[11px] text-kb-muted">
                  {fileLastScore && (
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      <CircleCheck className="h-3 w-3" />
                      最近练习 {fileLastScore.accuracy}%
                      <span className="font-normal text-kb-muted">
                        （{fileLastScore.correct}/{fileLastScore.total}）
                      </span>
                    </span>
                  )}
                  {filePracticeDraftCount > 0 && (
                    <span>
                      本次已作答 {filePracticeDraftCount}/{questions.length}
                    </span>
                  )}
                </div>
              )}
              <div className="scrollbar-neutral max-h-[280px] overflow-y-auto pr-0.5">
              {displayedQuestions.map((question) => {
                const selected = selectedIds.includes(question.id);
                return (
                  <div
                    key={question.id}
                    className={cn(
                      "group flex items-center gap-1.5 border-b border-divider/80 px-0 py-2 transition-colors last:border-b-0",
                      selected ? "bg-primary-soft/30" : "hover:bg-kb-surface/80",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2 pl-1">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleQuestion(question.id)}
                        aria-label={`选择练习题：${question.stem}`}
                        className="h-4 w-4 shrink-0 rounded-[3px] border-kb-border text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                      />
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => openQuestionDetail(question)}
                              className="min-w-0 flex-1 truncate text-left text-[12px] leading-[18px] text-kb-body transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                            >
                              {question.stem}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-[320px] bg-[#2f424d] text-[12px] leading-relaxed text-white"
                          >
                            {question.stem}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {isAdmin ? (
                      <div className="flex shrink-0 items-center gap-0.5 pr-0.5">
                        <button
                          type="button"
                          aria-label={`编辑练习题：${question.stem}`}
                          title="编辑练习题"
                          onClick={() => openQuestionDetail(question, true)}
                          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-primary transition-colors hover:bg-primary-soft/60 active:scale-[0.96]"
                        >
                          <Pencil className="h-3.5 w-3.5 stroke-[1.9]" />
                        </button>
                        <button
                          type="button"
                          aria-label={`删除练习题：${question.stem}`}
                          title="删除练习题"
                          onClick={() => setDeletingQuestion(question)}
                          className="flex h-6 w-6 items-center justify-center rounded-[5px] text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.96]"
                        >
                          <Trash2 className="h-3.5 w-3.5 stroke-[1.9]" />
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {displayedQuestions.length === 0 ? (
                <p className="px-1.5 py-6 text-center text-[12px] text-kb-muted">
                  暂无练习题，可等待资料重新解析后生成。
                </p>
              ) : null}
            </div>
            </>
          ) : (
            <p className="text-[12px] text-kb-muted">解析完成后可选择练习题并提交。</p>
          )}
        </PanelSection>
      </div>
      )}

      <QuestionDetailDialog
        question={viewingQuestion}
        isAdmin={isAdmin}
        editing={detailEditing}
        onClose={() => {
          setViewingQuestion(null);
          setDetailEditing(false);
        }}
        onEditingChange={setDetailEditing}
        onSave={(question) => saveQuestion(question)}
        onSaveAndSubmit={(question) => saveQuestion(question, true)}
      />
      <KbFormDialog
        open={Boolean(deletingQuestion)}
        title="删除练习题"
        titleIcon={Trash2}
        size="small"
        variant="confirm"
        onClose={() => setDeletingQuestion(null)}
        footer={
          <>
            <AppDialogButton variant="outline" onClick={() => setDeletingQuestion(null)}>
              取消
            </AppDialogButton>
            <AppDialogButton
              variant="primary"
              className="border-destructive bg-destructive hover:border-destructive/90 hover:bg-destructive/90"
              onClick={deleteQuestion}
            >
              删除
            </AppDialogButton>
          </>
        }
      >
        <p className="text-[13px] leading-6 text-kb-body">
          删除后，该题将不再出现在这份资料的练习题中。
        </p>
      </KbFormDialog>
      <KbFormDialog
        open={mindMapOpen}
        title="知识脑图"
        titleIcon={GitFork}
        size="large"
        onClose={() => setMindMapOpen(false)}
        footer={
          <AppDialogButton variant="primary" onClick={() => setMindMapOpen(false)}>
            关闭
          </AppDialogButton>
        }
      >
        <MindMapBoard
          fileName={file.name}
          branches={keywords}
          zoom={mindMapZoom}
          expanded
          onZoomOut={() => setMindMapZoom((value) => Math.max(80, value - 10))}
          onZoomIn={() => setMindMapZoom((value) => Math.min(130, value + 10))}
          onOpen={() => undefined}
        />
      </KbFormDialog>
    </aside>
  );
}

function QuestionDetailDialog({
  question,
  isAdmin,
  editing,
  onClose,
  onEditingChange,
  onSave,
  onSaveAndSubmit,
}: {
  question: FilePracticeQuestion | null;
  isAdmin: boolean;
  editing: boolean;
  onClose: () => void;
  onEditingChange: (editing: boolean) => void;
  onSave: (question: FilePracticeQuestion) => void;
  onSaveAndSubmit: (question: FilePracticeQuestion) => void;
}) {
  const [stem, setStem] = useState("");
  const [options, setOptions] = useState<FilePracticeQuestion["options"]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);

  useEffect(() => {
    if (!question) return;
    setStem(question.stem);
    setOptions(question.options.map((option) => ({ ...option })));
    setAnswers(Array.isArray(question.answer) ? [...question.answer] : [question.answer]);
    setAnalysis(getFilePracticeAnalysis(question));
    setRegenPrompt("");
  }, [question]);

  if (!question) return null;

  const multiple = question.type === "multiple";
  const answerText = answers.join("，");
  const canSave = Boolean(stem.trim()) && answers.length > 0;

  const toggleAnswer = (key: string) => {
    if (!editing) return;
    if (multiple) {
      setAnswers((current) =>
        current.includes(key)
          ? current.filter((item) => item !== key)
          : [...current, key].sort(),
      );
      return;
    }
    setAnswers([key]);
  };

  const cancelEditing = () => {
    setStem(question.stem);
    setOptions(question.options.map((option) => ({ ...option })));
    setAnswers(Array.isArray(question.answer) ? [...question.answer] : [question.answer]);
    setAnalysis(getFilePracticeAnalysis(question));
    setRegenPrompt("");
    onEditingChange(false);
  };

  const regenerateByPrompt = () => {
    if (!regenPrompt.trim()) {
      toast.error("请先用自然语言说明希望怎么改这道题");
      return;
    }
    setRegenLoading(true);
    window.setTimeout(() => {
      const next = regenerateFilePracticeQuestion(
        {
          ...question,
          stem,
          options,
          answer: multiple ? answers : answers[0] ?? "",
          analysis,
        },
        regenPrompt.trim(),
      );
      setStem(next.stem);
      setOptions(next.options);
      setAnswers(Array.isArray(next.answer) ? [...next.answer] : [next.answer]);
      setAnalysis(getFilePracticeAnalysis(next));
      setRegenLoading(false);
      toast.success("已按说明重新生成题目，请核对后保存");
    }, 700);
  };

  const buildNext = (): FilePracticeQuestion => ({
    ...question,
    stem: stem.trim(),
    options: options.map((option) => ({ ...option, label: option.label.trim() })),
    answer: multiple ? answers : answers[0] ?? "",
    analysis: analysis.trim(),
  });

  const submit = () => {
    if (!canSave) return;
    onSave(buildNext());
  };

  const submitAndUpload = () => {
    if (!canSave) return;
    onSaveAndSubmit(buildNext());
  };

  return (
    <KbFormDialog
      open
      title={editing ? "题目编辑" : "题目详情"}
      titleIcon={GraduationCap}
      size="medium"
      onClose={onClose}
      footer={
        editing ? (
          <>
            <AppDialogButton variant="outline" onClick={cancelEditing}>
              取消
            </AppDialogButton>
            <AppDialogButton variant="outline" disabled={!canSave} onClick={submit}>
              保存
            </AppDialogButton>
            <AppDialogButton variant="primary" disabled={!canSave} onClick={submitAndUpload}>
              保存并提交至题库
            </AppDialogButton>
          </>
        ) : (
          <>
            {isAdmin ? (
              <AppDialogButton variant="outline" onClick={() => onEditingChange(true)}>
                <Pencil className="h-3.5 w-3.5" />
                开启编辑
              </AppDialogButton>
            ) : null}
            <AppDialogButton variant="primary" onClick={onClose}>
              关闭
            </AppDialogButton>
          </>
        )
      }
    >
      <div className="space-y-1">
        {editing ? (
          <div className="mb-3 rounded-[8px] border border-primary/18 bg-primary-soft/30 px-3 py-2.5">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              自然语言重新生成
            </div>
            <p className="mt-0.5 text-[11px] text-kb-muted">
              说明题干场景、干扰项或难度，系统会据此重写本题，不覆盖未保存前可取消。
            </p>
            <div className="mt-2 flex items-end gap-2">
              <textarea
                value={regenPrompt}
                onChange={(event) => setRegenPrompt(event.target.value)}
                rows={2}
                placeholder="例如：改成交接班现场场景，增加一个容易和习惯做法混淆的干扰项"
                className="min-h-[64px] flex-1 resize-none rounded-[7px] border border-[#D6E1E9] bg-white px-3 py-2 text-[12.5px] leading-5 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={regenerateByPrompt}
                disabled={regenLoading}
                className="inline-flex h-9 shrink-0 items-center gap-1 rounded-[7px] bg-primary px-3 text-[12px] font-medium text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {regenLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                重新生成
              </button>
            </div>
          </div>
        ) : null}
        <KbFormField label="题干" icon={FileText} required={editing}>
          {editing ? (
            <AppFormTextarea
              value={stem}
              onChange={(event) => setStem(event.target.value)}
              rows={1}
              showCount={false}
              className="!h-10 !min-h-10 !resize-none !rounded-[7px] !px-3 !py-[7px] overflow-y-auto text-[13px] leading-6"
            />
          ) : (
            <p className="text-[14px] leading-6 text-kb-heading">{question.stem}</p>
          )}
        </KbFormField>

        <KbFormField label="选项" icon={ListChecks} required={editing}>
          <div className="space-y-1.5">
            {editing
              ? options.map((option) => {
                  const checked = answers.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      role="button"
                      tabIndex={0}
                      aria-pressed={checked}
                      aria-label={`选择正确答案 ${option.key}`}
                      onClick={() => toggleAnswer(option.key)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleAnswer(option.key);
                        }
                      }}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-[7px] border px-3 py-2 text-left transition-colors",
                        checked
                          ? "border-primary/45 bg-primary-soft/70"
                          : "border-[#EDF3F5] bg-white hover:border-primary/25 hover:bg-[#FBFDFD]",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-[18px] w-[18px] shrink-0 place-items-center border transition-colors",
                          multiple ? "rounded-[3px]" : "rounded-full",
                          checked ? "border-primary bg-primary" : "border-[#B9CED3] bg-white",
                        )}
                        aria-hidden
                      >
                        {checked ? (
                          multiple ? (
                            <Check className="h-3 w-3 text-primary-foreground stroke-[2.4]" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                          )
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[3px] px-1 text-[10.5px] font-semibold",
                          checked ? "bg-primary/15 text-primary" : "bg-[#EAF1F3] text-[#6B7F88]",
                        )}
                      >
                        {option.key}
                      </span>
                      <input
                        aria-label={`选项 ${option.key}`}
                        value={option.label}
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                        onChange={(event) =>
                          setOptions((current) =>
                            current.map((entry) =>
                              entry.key === option.key
                                ? { ...entry, label: event.target.value }
                                : entry,
                            ),
                          )
                        }
                        className="h-8 min-w-0 flex-1 cursor-text rounded-[6px] border border-[#D6E1E9] bg-white px-2.5 text-[13px] leading-5 text-[#314955] outline-none transition-colors focus:border-primary"
                      />
                    </div>
                  );
                })
              : question.options.map((option) => {
                  const answerKeys = Array.isArray(question.answer)
                    ? question.answer
                    : [question.answer];
                  const checked = answerKeys.includes(option.key);
                  return (
                    <div
                      key={option.key}
                      className={cn(
                        "flex items-start gap-2 rounded-[7px] border px-3 py-2.5 text-[13px] leading-5",
                        checked
                          ? "border-primary/55 bg-primary-soft/55 text-kb-heading shadow-[inset_3px_0_0_0_var(--primary)]"
                          : "border-[#EEF2F4] bg-white text-kb-body",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] px-1 text-[10.5px] font-semibold",
                          checked ? "bg-primary text-primary-foreground" : "bg-[#F3F6F7] text-[#8A9BA3]",
                        )}
                      >
                        {option.key}
                      </span>
                      <span className="min-w-0 flex-1">{option.label}</span>
                      {checked ? (
                        <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      ) : null}
                    </div>
                  );
                })}
          </div>
        </KbFormField>

        <KbFormField label="正确答案" icon={CircleCheck} required={editing}>
          <input
            readOnly
            value={answerText}
            placeholder={editing ? "请在上方选择正确选项" : ""}
            className="h-10 w-full cursor-default rounded-[7px] border border-[#D6E1E9] bg-[#F8FAFC] px-3 text-[13px] text-[#31485D] outline-none"
          />
        </KbFormField>

        <KbFormField label="解析" icon={BookOpenCheck} className="mb-0">
          {editing ? (
            <AppFormTextarea
              value={analysis}
              onChange={(event) => setAnalysis(event.target.value)}
              rows={1}
              showCount={false}
              className="!h-10 !min-h-10 !resize-none !rounded-[7px] !px-3 !py-[7px] overflow-y-auto text-[13px] leading-6"
            />
          ) : (
            <div className="rounded-[8px] border border-primary/15 bg-primary-soft/25 px-3 py-3">
              <p className="text-[12.5px] leading-6 text-kb-body">
                {getFilePracticeAnalysis(question)}
              </p>
            </div>
          )}
        </KbFormField>
      </div>
    </KbFormDialog>
  );
}
