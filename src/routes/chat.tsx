import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  BookOpen,
  SquarePen,
  MoreHorizontal,
  Paperclip,
  Quote,
  MessageCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Search,
  Bookmark,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  X,
  Menu,
  Plus,
  Square,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  BrainCircuit,
  User,
  ExternalLink,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ELLIPSIS_TOOLTIP_CLASS, useTextOverflow } from "@/components/common/ellipsis-tooltip";
import { cn } from "@/lib/utils";
import {
  CONVERSATIONS,
  DEFAULT_CONVERSATION_ID,
  DOCS,
  type AnswerCard,
  type AnswerCitation,
  type ChatMsg,
  type Conversation,
  type Doc,
} from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";
import { toast } from "sonner";
import { z } from "zod";
import {
  QuizSetDialog,
  buildQuizSetTitle,
  inferQuizFilter,
  pickQuestionsForAnswer,
} from "@/components/chat/quiz-set-dialog";
import { KnowledgeBaseIcon, KbFileTypeIcon } from "@/components/knowledge/ui";
import type { QuizSet } from "@/lib/mock/learning-hub";
import {
  CHAT_KNOWLEDGE_BASES,
  KnowledgeBaseSelectorDialog,
} from "@/components/chat/knowledge-base-selector-dialog";
import { DialogLoading } from "@/components/chat/dialog-loading";
import { ChatConversationSearchDialog } from "@/components/chat/chat-conversation-search-dialog";
import { getCurrentKnowledgeUser } from "@/lib/knowledge/demoRole";
import { getFileById } from "@/lib/knowledge/model";
import { openFileDetailInNewTab } from "@/lib/knowledge/searchNav";
import type { KnowledgeFile } from "@/lib/knowledge/types";

function resolveKnowledgeFileForChatDoc(doc: Doc): KnowledgeFile | undefined {
  if (doc.knowledgeFileId) {
    const mapped = getFileById(doc.knowledgeFileId);
    if (mapped) return mapped;
  }
  return undefined;
}

const searchSchema = z.object({
  prefill: z.string().optional(),
  libId: z.string().optional(),
  fileId: z.string().optional(),
});

export const Route = createFileRoute("/chat")({
  validateSearch: searchSchema,
  component: ChatPage,
  head: () => ({ meta: [{ title: "智能对话 · 涉网运行能力智能提升平台" }] }),
});

const COMMON_QUESTIONS = [
  "AGC 考核主要依据哪些文件？",
  "主变停役前需要核对哪些状态？",
  "母线差动保护动作后如何复盘？",
  "深度调峰低负荷稳燃有哪些注意点？",
  "220kV 倒闸操作有哪些易错点？",
  "如何根据错题生成专项练习？",
];

// 附件/引用资料/常用问题快捷入口暂不开放，后续视需要再启用
const SHOW_COMPOSER_ADD_MENU = false;

const CHAT_CONVERSATIONS_KEY = "chat-conversations-v1";
const CHAT_ACTIVE_ID_KEY = "chat-active-conversation-v1";
const MOCK_CONVERSATION_IDS = new Set(CONVERSATIONS.map((conversation) => conversation.id));

function isValidConversation(item: unknown): item is Conversation {
  return !!(
    item &&
    typeof item === "object" &&
    typeof (item as Conversation).id === "string" &&
    typeof (item as Conversation).title === "string" &&
    typeof (item as Conversation).updatedAt === "string" &&
    Array.isArray((item as Conversation).messages)
  );
}

function readConversations(): Conversation[] {
  if (typeof window === "undefined") return CONVERSATIONS;

  try {
    const parsed = JSON.parse(localStorage.getItem(CHAT_CONVERSATIONS_KEY) ?? "null");
    if (!Array.isArray(parsed) || parsed.length === 0) return CONVERSATIONS;
    if (!parsed.every(isValidConversation)) return CONVERSATIONS;

    const storedById = new Map(parsed.map((conversation) => [conversation.id, conversation]));
    const mergedMocks = CONVERSATIONS.map((mock) =>
      mock.id === DEFAULT_CONVERSATION_ID ? mock : (storedById.get(mock.id) ?? mock),
    );
    const userConversations = parsed.filter(
      (conversation) => !MOCK_CONVERSATION_IDS.has(conversation.id),
    );

    return [...mergedMocks, ...userConversations];
  } catch {
    return CONVERSATIONS;
  }
}

function readActiveConversationId(conversations: Conversation[]) {
  // 每次进入对话页默认打开 mock「新对话」
  if (conversations.some((conversation) => conversation.id === DEFAULT_CONVERSATION_ID)) {
    return DEFAULT_CONVERSATION_ID;
  }
  return conversations[0]?.id ?? "";
}

const COLLAPSE_MAX = 420;

const CHAT_COMMON_KEY = "chat-common-questions-v1";

function readCommonQuestions(): string[] {
  if (typeof window === "undefined") return [...COMMON_QUESTIONS];
  try {
    const raw = localStorage.getItem(CHAT_COMMON_KEY);
    if (!raw) return [...COMMON_QUESTIONS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...COMMON_QUESTIONS];
  } catch {
    return [...COMMON_QUESTIONS];
  }
}

function writeCommonQuestions(qs: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_COMMON_KEY, JSON.stringify(qs));
}

function resolveBodySection(c: AnswerCitation, doc: Doc) {
  return (
    doc.body.find((b) => b.title.includes(c.section) || c.section.includes(b.title)) ?? doc.body[0]
  );
}

/** Normalize punctuation so truncated / halfwidth quotes still match chapter text. */
function normalizeCiteMatch(text: string) {
  return text
    .replace(/[，]/g, ",")
    .replace(/[；]/g, ";")
    .replace(/[：]/g, ":")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/[“”「」]/g, '"')
    .replace(/[…⋯]+/g, "...")
    .replace(/\s+/g, "");
}

function findQuoteRange(source: string, quote: string): [number, number] | null {
  const candidates = [
    quote,
    quote.replace(/[…⋯.]+$/u, "").trim(),
    quote.replace(/……$/, "").replace(/\.\.\.$/, "").trim(),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const index = source.indexOf(candidate);
    if (index >= 0) return [index, index + candidate.length];
  }

  const needle = normalizeCiteMatch(
    quote.replace(/[…⋯.]+$/u, "").replace(/\.\.\.$/, "").trim(),
  );
  if (!needle) return null;

  const normChars: Array<{ ch: string; origIndex: number }> = [];
  for (let i = 0; i < source.length; i++) {
    const normalized = normalizeCiteMatch(source[i] ?? "");
    if (normalized) normChars.push({ ch: normalized, origIndex: i });
  }

  const haystack = normChars.map((item) => item.ch).join("");
  const startNorm = haystack.indexOf(needle);
  if (startNorm < 0) return null;

  const start = normChars[startNorm]?.origIndex;
  const endChar = normChars[startNorm + needle.length - 1];
  if (start == null || !endChar) return null;
  return [start, endChar.origIndex + 1];
}

function HighlightedOriginalText({ text, quote }: { text: string; quote: string }) {
  const range = findQuoteRange(text, quote);
  if (!range) {
    return <>{text}</>;
  }

  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-[3px] bg-warning-soft px-0.5 py-px font-medium text-warning-foreground">
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

function docToCitation(doc: Doc): AnswerCitation {
  const section = doc.body.find((b) => b.highlight)?.title ?? doc.body[0]?.title ?? "摘要";
  const bodySection = resolveBodySection({ docId: doc.id, section, quote: "" }, doc);
  const text = bodySection?.text ?? doc.snippet;
  return {
    docId: doc.id,
    section,
    quote: text.length > 160 ? `${text.slice(0, 160)}…` : text,
    label: docTypeLabel(doc),
    position: section,
  };
}

function nowTime() {
  return `今天 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function docTypeLabel(doc: Doc) {
  const map: Record<string, string> = {
    规程标准: "规程",
    典型操作: "操作票",
    故障处置: "案例",
    历史案例: "案例",
    // 厂家SOP: "SOP",
    厂站资料: "厂站",
    "两细则/考核": "题库",
  };
  return map[doc.docType] ?? "资料";
}

/** Infer display file type for chat source list icons. */
function docFileType(doc?: Doc): string {
  if (!doc) return "pdf";
  const fromTitle = doc.title.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (fromTitle) return fromTitle;
  switch (doc.docType) {
    case "厂站资料":
    case "典型操作":
      return "docx";
    case "两细则/考核":
    case "规程标准":
    case "故障处置":
    case "历史案例":
    default:
      return "pdf";
  }
}

function buildMockAnswer(question: string): ChatMsg {
  const lower = question;
  if (lower.includes("AGC") || lower.includes("agc") || lower.includes("两细则")) {
    return {
      role: "assistant",
      time: nowTime(),
      card: {
        summary:
          "AGC 考核主要依据《并网发电厂辅助服务管理实施细则》[1]、《厂站运行规程》[2] 以及厂家提供的 AGC 控制器 SOP 配置说明 [3]。不同地区的细则口径可能存在差异，实际应以当地调度发布版本为准。",
        citations: [
          {
            docId: "d1",
            section: "二、AGC 考核三项指标",
            quote: "调节速率、调节精度、响应时间可作为考核关注指标……",
            label: "题库",
            position: "二、AGC 考核三项指标",
          },
          {
            docId: "d4",
            section: "1 总则",
            quote: "厂站资料优先适用，通用规程作为补充……",
            label: "厂站",
            position: "1 总则",
          },
          {
            docId: "d6",
            section: "1 死区参数",
            quote: "推荐 ≤ 1MW，过大会导致考核响应降低……",
            label: "SOP",
            position: "1 死区参数",
          },
        ],
        scope: "适用厂站：接入辅助服务市场的并网发电厂；岗位：运行值班、技术管理。",
      },
    };
  }
  if (lower.includes("主变") || lower.includes("停役")) {
    return {
      role: "assistant",
      time: nowTime(),
      card: {
        summary:
          "建议核对：① 负荷转移情况；② 保护连接片位置 [1]；③ 中性点接地刀闸状态；④ 调度命令与操作票一致性。",
        citations: [
          {
            docId: "d2",
            section: "1 前置核对",
            quote: "核对项包括：主变负荷转移情况、相关保护连接片位置……",
            label: "SOP",
            position: "1 前置核对",
          },
        ],
        scope: "适用设备：220kV/500kV 主变；场景：计划停役。",
      },
    };
  }
  if (lower.includes("差动") || lower.includes("保护") || lower.includes("母差")) {
    return {
      role: "assistant",
      time: nowTime(),
      card: {
        summary:
          "差动保护动作后建议按 TA 极性 → 二次回路 → 定值 → 一次设备四步法核查 [1]，并参照同类历史案例 [2] 排查隐患。",
        citations: [
          {
            docId: "d10",
            section: "1 四步法核查",
            quote: "TA 极性 → 二次回路 → 定值 → 一次设备。",
            label: "案例",
            position: "1 四步法核查",
          },
          {
            docId: "d3",
            section: "2 原因分析",
            quote: "二次回路绝缘破损，差动平衡被破坏。",
            label: "案例",
            position: "2 原因分析",
          },
        ],
        scope: "适用范围：母差、线路差动、变压器差动保护复盘培训。",
      },
    };
  }
  return {
    role: "assistant",
    time: nowTime(),
    card: {
      summary: "当前知识库未检索到足够依据，建议查阅厂站运行规程或联系培训管理员。",
      citations: [],
      scope: "",
      uncertainty: "本问题缺少明确资料命中，回答仅供参考方向。",
    },
  };
}

// ─── Evidence workspace ────────────────────────────────────

function CitationPanel({
  citations,
  activeIndex,
  onChangeIndex,
  onClose,
  className = "",
}: {
  citations: AnswerCitation[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;
  onClose?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const c = citations[activeIndex];
  const doc = c ? DOCS.find((d) => d.id === c.docId) : undefined;
  const bodySection = c && doc ? resolveBodySection(c, doc) : undefined;
  const knowledgeFile = doc ? resolveKnowledgeFileForChatDoc(doc) : undefined;

  const openFileDetail = () => {
    if (!knowledgeFile) {
      toast.message("暂无对应文件详情");
      return;
    }
    openFileDetailInNewTab(router, knowledgeFile);
  };

  return (
    <aside
      aria-label="回答依据"
      className={`h-full min-h-0 w-full flex-col border-l border-border bg-card ${className}`}
    >
      <div className="border-b border-divider px-5 py-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-primary" />
              <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-kb-heading">依据</h2>
            </div>
            <p className="mt-0.5 text-[11px] leading-5 text-kb-muted">
              {citations.length > 0
                ? `当前回答引用了 ${citations.length} 份资料`
                : "选择回答中的引用查看原文"}
            </p>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭回答依据"
              title="关闭依据"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {citations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-border bg-primary-soft text-primary">
            <BookOpen className="h-[18px] w-[18px]" />
          </span>
          <p className="mt-3 max-w-52 text-[12px] leading-5 text-kb-muted">
            回答中的引用编号和来源区域会在这里打开对应原文。
          </p>
        </div>
      ) : (
        <>
          <div className="flex border-b border-divider">
            {citations.map((cit, i) => {
              const tabDoc = DOCS.find((d) => d.id === cit.docId);
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={i === activeIndex}
                  onClick={() => onChangeIndex(i)}
                  title={tabDoc?.title ?? cit.section}
                  className={`relative flex min-h-[38px] flex-1 items-center justify-center gap-1.5 px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    i === activeIndex
                      ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t after:bg-primary"
                      : "text-kb-muted hover:bg-[#f7f7f4] hover:text-kb-body"
                  }`}
                >
                  <span className="min-w-0 max-w-[120px] truncate">
                    {tabDoc?.title ?? cit.section}
                  </span>
                  <span className="tabular-nums text-[10px] opacity-50">[{i + 1}]</span>
                </button>
              );
            })}
          </div>
          {c && doc && (
            <div className="scrollbar-neutral min-h-0 flex-1 overflow-y-auto">
              {/* 文件元信息区 */}
              <div className="border-b border-divider bg-[#f9f9f7] px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-white text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="min-w-0 text-[13.5px] font-semibold leading-[1.4] text-kb-heading">
                        {doc.title}
                      </h3>
                      <button
                        type="button"
                        onClick={openFileDetail}
                        aria-label="在新标签页打开文件详情"
                        title="在新标签页打开文件详情"
                        className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap pt-0.5 text-[12px] font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                      >
                        打开文件详情
                        <ExternalLink className="h-3.5 w-3.5 stroke-[1.8]" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-kb-muted">
                      <span>{c.position ?? c.section}</span>
                      <span aria-hidden="true" className="opacity-40">
                        ·
                      </span>
                      <span>更新 {doc.updatedAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 原文（命中片段在原文中高亮） */}
              <div className="px-5 py-5">
                <div className="rounded-xl border border-border bg-white px-4 py-4">
                  <p className="text-[13px] leading-7 whitespace-pre-wrap text-kb-body">
                    {bodySection ? (
                      <HighlightedOriginalText text={bodySection.text} quote={c.quote} />
                    ) : (
                      <mark className="rounded-[3px] bg-warning-soft px-0.5 py-px font-medium text-warning-foreground">
                        {c.quote}
                      </mark>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
          {c && doc && (
            <div className="border-t border-divider px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(c.quote);
                  toast.success("引用已复制");
                }}
                className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-[12px] text-kb-body hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                <Copy className="h-3.5 w-3.5" />
                复制引用
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}

// ─── Sidebar ───────────────────────────────────────────────

function ConvListItem({
  conv,
  active,
  onSelect,
  onRename,
  onDelete,
  onTogglePin,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conv.title);
  const editRef = useRef<HTMLInputElement>(null);
  const { ref: titleRef, overflow: titleOverflow } = useTextOverflow<HTMLSpanElement>(1, [
    conv.title,
  ]);

  useEffect(() => setDraftTitle(conv.title), [conv.title]);

  const startEditing = () => {
    setDraftTitle(conv.title);
    setEditing(true);
    requestAnimationFrame(() => editRef.current?.select());
  };

  const commitRename = () => {
    const nextTitle = draftTitle.trim();
    setEditing(false);
    if (nextTitle && nextTitle !== conv.title) onRename(conv.id, nextTitle);
    else setDraftTitle(conv.title);
  };

  const listItem = (
    <li
      className={`group relative flex min-h-9 items-center rounded-[7px] transition-colors ${
        active
          ? "bg-[#eaf7f9] text-accent-foreground"
          : "hover:bg-[#f4fafb] focus-within:bg-[#f4fafb]"
      }`}
    >
      {active ? (
        <span className="absolute bottom-2 left-0 top-2 w-[2px] rounded-r-full bg-primary" />
      ) : null}
      {editing ? (
        <input
          ref={editRef}
          aria-label="重命名会话"
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") commitRename();
            if (event.key === "Escape") {
              setDraftTitle(conv.title);
              setEditing(false);
            }
          }}
          className="mx-2 h-8 min-w-0 flex-1 rounded-md border border-border bg-white px-2 text-[13px] text-kb-heading outline-none ring-2 ring-primary/15"
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelect(conv.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onSelect(conv.id);
            }
          }}
          aria-current={active ? "page" : undefined}
          className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <MessageCircle
            className={`h-3.5 w-3.5 shrink-0 transition-colors ${
              active ? "text-primary" : "text-kb-muted group-hover:text-primary"
            }`}
          />
          <span
            ref={titleRef}
            className={`w-0 min-w-0 flex-1 truncate text-[13px] leading-snug ${
              active
                ? "font-medium text-accent-foreground"
                : "text-kb-body group-hover:text-accent-foreground"
            }`}
          >
            {conv.title}
          </span>
        </div>
      )}
      {!editing && (
        <div className="mr-1 flex shrink-0 items-center rounded-md bg-[inherit] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <button
            type="button"
            aria-label={conv.pinned ? `取消置顶：${conv.title}` : `置顶：${conv.title}`}
            title={conv.pinned ? "取消置顶" : "置顶"}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin(conv.id);
            }}
            className={`grid h-7 w-7 place-items-center rounded-[5px] hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              conv.pinned ? "text-primary" : "text-kb-muted"
            }`}
          >
            {conv.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`更多会话操作：${conv.title}`}
                title="更多"
                className="grid h-7 w-7 place-items-center rounded-[5px] text-kb-muted hover:bg-white/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 data-[state=open]:bg-white/80"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={4} className="min-w-[132px] text-[12px]">
              <DropdownMenuItem className="gap-2" onSelect={startEditing}>
                <Pencil className="h-3.5 w-3.5" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-2 text-destructive focus:text-destructive"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(conv.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </li>
  );

  if (!titleOverflow || editing) return listItem;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{listItem}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        sideOffset={10}
        collisionPadding={12}
        className={cn(ELLIPSIS_TOOLTIP_CLASS, "whitespace-normal")}
      >
        {conv.title}
      </TooltipContent>
    </Tooltip>
  );
}

/* Previous sidebar panel implementation retained only as migration reference.
function LegacyChatSidebar({
  conversations,
  activeId,
  favoriteIds,
  commonQuestions,
  settings,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onTogglePin,
  onSendQuestion,
  onFillInput,
  onQuoteDoc,
  onOpenDocCitation,
  onSettingsChange,
  onCommonQuestionsChange,
  onRemoveFavorite,
  className = "",
}: {
  conversations: Conversation[];
  activeId: string;
  favoriteIds: string[];
  commonQuestions: string[];
  settings: ChatSettings;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onSendQuestion: (q: string) => void;
  onFillInput: (q: string) => void;
  onQuoteDoc: (title: string) => void;
  onOpenDocCitation: (docId: string) => void;
  onSettingsChange: (s: ChatSettings) => void;
  onCommonQuestionsChange: (qs: string[]) => void;
  onRemoveFavorite: (docId: string) => void;
  className?: string;
}) {
  const [search, setSearch] = useState("");
  const [panel, setPanel] = useState<SidebarPanel>("none");
  const [newQuestion, setNewQuestion] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.includes(q));
  }, [conversations, search]);

  const pinnedList = useMemo(() => filtered.filter((c) => c.pinned), [filtered]);
  const recentList = useMemo(() => filtered.filter((c) => !c.pinned), [filtered]);
  const favoriteDocs = useMemo(
    () => favoriteIds.map((id) => DOCS.find((d) => d.id === id)).filter(Boolean) as Doc[],
    [favoriteIds],
  );

  const closePanel = () => setPanel("none");

  const panelTitle =
    panel === "favorites"
      ? "我的收藏"
      : panel === "common"
        ? "常用问题"
        : panel === "settings"
          ? "问答设置"
          : "";

  return (
    <aside
      className={`flex h-full w-[280px] shrink-0 flex-col border-r border-[#e7e7e5] bg-[#f7f7f5] ${className}`}
    >
      <div className="flex min-h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#252523] text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-[#20201f]">
            智能对话
          </span>
        </div>
        <button
          type="button"
          onClick={() => setPanel("settings")}
          aria-label="打开问答设置"
          title="问答设置"
          className="grid h-9 w-9 place-items-center rounded-lg text-[#696965] hover:bg-[#e9e9e6] hover:text-[#20201f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5 px-3">
        <button
          type="button"
          onClick={onNew}
          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-[#30302e] transition-colors hover:bg-[#e9e9e6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SquarePen className="h-4 w-4" />
          <span>新对话</span>
          <kbd className="ml-auto rounded-md border border-[#dededb] bg-white/70 px-1.5 py-0.5 text-[10px] font-normal text-[#777773]">
            Ctrl K
          </kbd>
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#777773]" />
          <input
            aria-label="搜索历史会话"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索会话"
            className="h-10 w-full rounded-lg border border-transparent bg-transparent pl-8 pr-9 text-[13px] text-[#30302e] outline-none placeholder:text-[#92928d] hover:bg-[#eeeeeb] focus:border-[#cececa] focus:bg-white focus:ring-2 focus:ring-primary/10"
          />
          {search && (
            <button
              type="button"
              aria-label="清空搜索"
              onClick={() => setSearch("")}
              className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-[#777773] hover:bg-[#e4e4e1] hover:text-[#20201f]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 min-h-0 flex-1 overflow-hidden px-3 pb-2">
        {panel !== "none" ? (
          <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold text-foreground">{panelTitle}</span>
              <button
                type="button"
                aria-label={`关闭${panelTitle}`}
                onClick={closePanel}
                className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto">
              {panel === "favorites" && (
                <div className="space-y-2">
                  {favoriteDocs.length === 0 ? (
                    <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">
                      暂无收藏资料，可在回答中点击「收藏依据」或在资料检索页收藏。
                    </p>
                  ) : (
                    favoriteDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="rounded-lg border border-border bg-[#f8fbfc] p-3"
                      >
                        <div className="mb-1 text-[12px] font-semibold leading-snug">
                          {doc.title}
                        </div>
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">
                          {doc.snippet}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onQuoteDoc(doc.title);
                              closePanel();
                              toast.success("已引用到输入框");
                            }}
                            className="rounded-lg border border-border bg-white px-2 py-1 text-[11px] hover:border-primary/30"
                          >
                            引用提问
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenDocCitation(doc.id);
                              closePanel();
                            }}
                            className="rounded-lg bg-primary-soft px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/15"
                          >
                            查看原文
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveFavorite(doc.id);
                              toast.success("已取消收藏");
                            }}
                            className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {panel === "common" && (
                <div className="space-y-2">
                  {commonQuestions.map((q) => (
                    <div key={q} className="group rounded-lg border border-border bg-white p-3">
                      <p className="text-[12.5px] leading-snug text-foreground/90">{q}</p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            onSendQuestion(q);
                            closePanel();
                          }}
                          className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary/90"
                        >
                          直接提问
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onFillInput(q);
                            closePanel();
                          }}
                          className="rounded-lg border border-border px-2 py-1 text-[11px] hover:bg-muted"
                        >
                          填入输入框
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onCommonQuestionsChange(commonQuestions.filter((x) => x !== q));
                            toast.success("已移除");
                          }}
                          className="rounded-lg px-2 py-1 text-[11px] text-muted-foreground opacity-0 hover:bg-muted group-hover:opacity-100"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="添加常用问题…"
                      className="w-full rounded-lg border border-border px-2.5 py-1.5 text-[12px] outline-none focus:border-primary/40"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newQuestion.trim()) {
                          onCommonQuestionsChange([newQuestion.trim(), ...commonQuestions]);
                          setNewQuestion("");
                          toast.success("已添加");
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={!newQuestion.trim()}
                      onClick={() => {
                        if (!newQuestion.trim()) return;
                        onCommonQuestionsChange([newQuestion.trim(), ...commonQuestions]);
                        setNewQuestion("");
                        toast.success("已添加");
                      }}
                      className="mt-2 w-full rounded-lg bg-primary-soft py-1.5 text-[11px] font-medium text-primary disabled:opacity-40"
                    >
                      添加问题
                    </button>
                  </div>
                </div>
              )}

              {panel === "settings" && (
                <div className="space-y-4 px-1">
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div>
                      <div className="text-[12.5px] font-medium">引用溯源</div>
                      <div className="text-[11px] text-muted-foreground">
                        回答中展示依据编号与原文面板
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.citeTrace}
                      onChange={(e) =>
                        onSettingsChange({ ...settings, citeTrace: e.target.checked })
                      }
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div>
                      <div className="text-[12.5px] font-medium">发送后自动滚到底部</div>
                      <div className="text-[11px] text-muted-foreground">
                        浏览历史消息时发送新问题自动定位最新内容
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoScrollOnSend}
                      onChange={(e) =>
                        onSettingsChange({ ...settings, autoScrollOnSend: e.target.checked })
                      }
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                  <div className="rounded-lg border border-border p-3">
                    <div className="mb-2 text-[12.5px] font-medium">默认知识库范围</div>
                    <select
                      value={settings.defaultKb}
                      onChange={(e) => onSettingsChange({ ...settings, defaultKb: e.target.value })}
                      className="w-full rounded-lg border border-border bg-white px-2.5 py-2 text-[12px] outline-none focus:border-primary/40"
                    >
                      {KB_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onCommonQuestionsChange([...COMMON_QUESTIONS]);
                      onSettingsChange(DEFAULT_CHAT_SETTINGS);
                      toast.success("已恢复默认设置");
                    }}
                    className="w-full rounded-lg border border-border py-2 text-[12px] text-muted-foreground hover:bg-muted"
                  >
                    恢复默认
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="scrollbar-hide h-full overflow-y-auto pr-0.5">
            {pinnedList.length > 0 && (
              <section className="mb-5" aria-labelledby="pinned-conversations">
                <h2
                  id="pinned-conversations"
                  className="px-2.5 pb-1.5 text-[12px] font-semibold text-[#20201f]"
                >
                  已置顶
                </h2>
                <ul className="space-y-0.5">
                  {pinnedList.map((conversation) => (
                    <ConvListItem
                      key={conversation.id}
                      conv={conversation}
                      active={conversation.id === activeId}
                      onSelect={onSelect}
                      onRename={onRename}
                      onDelete={onDelete}
                      onTogglePin={onTogglePin}
                    />
                  ))}
                </ul>
              </section>
            )}
            {recentList.length > 0 && (
              <section aria-labelledby="recent-conversations">
                <h2
                  id="recent-conversations"
                  className="flex items-center gap-1 px-2.5 pb-1.5 text-[12px] font-semibold text-[#20201f]"
                >
                  最近
                  <ChevronDown className="h-3 w-3 text-[#777773]" />
                </h2>
                <ul className="space-y-0.5">
                  {recentList.map((conversation) => (
                    <ConvListItem
                      key={conversation.id}
                      conv={conversation}
                      active={conversation.id === activeId}
                      onSelect={onSelect}
                      onRename={onRename}
                      onDelete={onDelete}
                      onTogglePin={onTogglePin}
                    />
                  ))}
                </ul>
              </section>
            )}
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto h-4 w-4 text-[#9a9a95]" />
                <p className="mt-2 text-[12px] text-[#777773]">未找到匹配会话</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[#e7e7e5] px-3 py-3">
        {[
          { icon: Bookmark, label: "我的收藏", key: "favorites" as const },
          { icon: List, label: "常用问题", key: "common" as const },
          { icon: Settings, label: "问答设置", key: "settings" as const },
        ].map(({ icon: Icon, label, key }) => (
          <button
            key={label}
            type="button"
            onClick={() => setPanel((p) => (p === key ? "none" : key))}
            className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors ${
              panel === key
                ? "bg-[#e9e9e7] font-medium text-[#20201f]"
                : "text-[#5f5f5b] hover:bg-[#ededeb] hover:text-[#20201f]"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === "favorites" && favoriteDocs.length > 0 && (
              <span className="ml-auto rounded-md bg-muted px-1.5 text-[10px]">
                {favoriteDocs.length}
              </span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}

// ─── Messages ────────────────────────────────────────────

*/

function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onTogglePin,
  onCollapse,
  className = "",
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onCollapse?: () => void;
  className?: string;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinnedExpanded, setPinnedExpanded] = useState(true);
  const [recentExpanded, setRecentExpanded] = useState(true);
  const pinnedList = useMemo(
    () => conversations.filter((conversation) => conversation.pinned),
    [conversations],
  );
  const recentList = useMemo(
    () => conversations.filter((conversation) => !conversation.pinned),
    [conversations],
  );

  const openSearch = () => setSearchOpen(true);

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={`relative flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-white ${className}`}
      >
        <div className="border-b border-divider px-3 pb-3 pt-4">
          <div className="flex items-center gap-2.5 px-1.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] font-semibold text-kb-heading">智能问答</h2>
            </div>
            <button
              type="button"
              onClick={openSearch}
              aria-label="搜索会话"
              title="搜索会话"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              <Search className="h-4 w-4" />
            </button>
            {onCollapse ? (
              <button
                type="button"
                onClick={onCollapse}
                aria-label="收起智能问答侧栏"
                title="收起侧栏"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-[6px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onNew}
            className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-[7px] border border-primary/25 bg-primary-soft/45 px-3 text-[13px] font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <SquarePen className="h-4 w-4" />
            新对话
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-hidden px-3 pb-4">
          <div className="scrollbar-hide h-full overflow-y-auto pr-0.5">
            {pinnedList.length > 0 && (
              <section className="mb-5" aria-labelledby="pinned-conversations">
                <button
                  id="pinned-conversations"
                  type="button"
                  aria-expanded={pinnedExpanded}
                  aria-controls="pinned-conversation-list"
                  onClick={() => setPinnedExpanded((expanded) => !expanded)}
                  className="flex min-h-9 w-full items-center gap-1.5 rounded-lg px-2.5 py-1 text-left text-[12px] font-semibold text-kb-heading transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-kb-muted transition-transform duration-200 ${
                      pinnedExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  已置顶
                  <span className="ml-auto text-[10px] font-medium text-kb-muted">
                    {pinnedList.length}
                  </span>
                </button>
                {pinnedExpanded && (
                  <ul id="pinned-conversation-list" className="mt-0.5 space-y-0.5">
                    {pinnedList.map((conversation) => (
                      <ConvListItem
                        key={conversation.id}
                        conv={conversation}
                        active={conversation.id === activeId}
                        onSelect={onSelect}
                        onRename={onRename}
                        onDelete={onDelete}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}
            {recentList.length > 0 && (
              <section aria-labelledby="recent-conversations">
                <button
                  id="recent-conversations"
                  type="button"
                  aria-expanded={recentExpanded}
                  aria-controls="recent-conversation-list"
                  onClick={() => setRecentExpanded((expanded) => !expanded)}
                  className="flex min-h-9 w-full items-center gap-1.5 rounded-lg px-2.5 py-1 text-left text-[12px] font-semibold text-kb-heading transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 text-kb-muted transition-transform duration-200 ${
                      recentExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  最近
                  <span className="ml-auto text-[10px] font-medium text-kb-muted">
                    {recentList.length}
                  </span>
                </button>
                {recentExpanded && (
                  <ul id="recent-conversation-list" className="mt-0.5 space-y-0.5">
                    {recentList.map((conversation) => (
                      <ConvListItem
                        key={conversation.id}
                        conv={conversation}
                        active={conversation.id === activeId}
                        onSelect={onSelect}
                        onRename={onRename}
                        onDelete={onDelete}
                        onTogglePin={onTogglePin}
                      />
                    ))}
                  </ul>
                )}
              </section>
            )}
            {pinnedList.length === 0 && recentList.length === 0 && (
              <div className="px-4 py-8 text-center">
                <MessageCircle className="mx-auto h-4 w-4 text-kb-muted" />
                <p className="mt-2 text-[12px] text-kb-muted">暂无会话记录</p>
              </div>
            )}
          </div>
        </div>

        <ChatConversationSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
        />
      </aside>
    </TooltipProvider>
  );
}

function RailTooltip({
  label,
  shortcut,
  children,
}: {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        className="bg-[#252525] px-2.5 py-1.5 text-[12px] text-white shadow-none"
      >
        <span>{label}</span>
        {shortcut && <kbd className="ml-2 text-[10px] text-white/65">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

function ConversationPopover({
  title,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
}: {
  title: string;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
}) {
  return (
    <div className="max-h-[min(28rem,calc(100dvh-7rem))] overflow-y-auto p-2">
      <h2 className="px-2.5 pb-2 pt-1 text-[14px] font-semibold text-kb-heading">{title}</h2>
      {conversations.length ? (
        <ul className="space-y-0.5">
          {conversations.map((conversation) => (
            <ConvListItem
              key={conversation.id}
              conv={conversation}
              active={conversation.id === activeId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onTogglePin={onTogglePin}
            />
          ))}
        </ul>
      ) : (
        <p className="px-2.5 py-8 text-center text-[12px] text-kb-muted">暂无会话</p>
      )}
    </div>
  );
}

function ChatRail({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onTogglePin,
  onExpand,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onExpand: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activePopover, setActivePopover] = useState<"pinned" | "recent" | null>(null);
  const pinned = useMemo(
    () => conversations.filter((conversation) => conversation.pinned),
    [conversations],
  );
  const recent = useMemo(
    () => conversations.filter((conversation) => !conversation.pinned),
    [conversations],
  );

  const selectFromPopover = (id: string) => {
    onSelect(id);
    setActivePopover(null);
  };

  const railButton =
    "grid h-11 w-11 place-items-center rounded-xl text-kb-body transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        aria-label="对话工具栏"
        className="flex h-full w-16 shrink-0 flex-col items-center border-r border-border bg-white py-2"
      >
        <RailTooltip label="展开智能问答侧栏">
          <button
            type="button"
            aria-label="展开智能问答侧栏"
            onClick={onExpand}
            className={`${railButton} group relative text-primary`}
          >
            <Sparkles className="h-5 w-5 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" />
            <PanelLeftOpen className="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        </RailTooltip>

        <div className="mt-2 flex flex-col items-center gap-1">
          <RailTooltip label="新聊天" shortcut="Ctrl + K">
            <button type="button" aria-label="新对话" onClick={onNew} className={railButton}>
              <SquarePen className="h-5 w-5" />
            </button>
          </RailTooltip>

          <RailTooltip label="搜索聊天">
            <button
              type="button"
              aria-label="搜索会话"
              onClick={() => {
                setActivePopover(null);
                setSearchOpen(true);
              }}
              className={railButton}
            >
              <Search className="h-5 w-5" />
            </button>
          </RailTooltip>

          <Popover
            open={activePopover === "pinned" && !searchOpen}
            onOpenChange={(open) => setActivePopover(open ? "pinned" : null)}
          >
            <RailTooltip label="已置顶">
              <PopoverTrigger asChild>
                <button type="button" aria-label="查看已置顶会话" className={railButton}>
                  <Pin className="h-5 w-5" />
                </button>
              </PopoverTrigger>
            </RailTooltip>
            <PopoverContent
              side="right"
              align="start"
              sideOffset={10}
              className="w-[328px] rounded-2xl border-border bg-card p-0 shadow-[var(--shadow-card)]"
            >
              <ConversationPopover
                title="已置顶"
                conversations={pinned}
                activeId={activeId}
                onSelect={selectFromPopover}
                onRename={onRename}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            </PopoverContent>
          </Popover>

          <Popover
            open={activePopover === "recent" && !searchOpen}
            onOpenChange={(open) => setActivePopover(open ? "recent" : null)}
          >
            <RailTooltip label="最近聊天">
              <PopoverTrigger asChild>
                <button type="button" aria-label="查看最近会话" className={railButton}>
                  <MessageCircle className="h-5 w-5" />
                </button>
              </PopoverTrigger>
            </RailTooltip>
            <PopoverContent
              side="right"
              align="start"
              sideOffset={10}
              className="w-[328px] rounded-2xl border-border bg-card p-0 shadow-[var(--shadow-card)]"
            >
              <ConversationPopover
                title="最近聊天"
                conversations={recent}
                activeId={activeId}
                onSelect={selectFromPopover}
                onRename={onRename}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            </PopoverContent>
          </Popover>
        </div>
      </aside>

      <ChatConversationSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        conversations={conversations}
        activeId={activeId}
        onSelect={onSelect}
      />
    </TooltipProvider>
  );
}

function SidebarRailTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={10}
        className="bg-[#252525] px-2.5 py-1.5 text-[12px] text-white shadow-none"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function CompactChatRail({ onExpand, onNew }: { onExpand: () => void; onNew: () => void }) {
  const railButton =
    "grid h-11 w-11 place-items-center rounded-[8px] text-kb-body transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        aria-label="智能问答侧栏"
        className="flex h-full w-16 shrink-0 flex-col items-center border-r border-border bg-white py-2"
      >
        <SidebarRailTooltip label="展开智能问答侧栏">
          <button
            type="button"
            onClick={onExpand}
            aria-label="展开智能问答侧栏"
            className={`${railButton} group relative text-primary`}
          >
            <Sparkles className="h-5 w-5 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" />
            <PanelLeftOpen className="absolute h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        </SidebarRailTooltip>

        <div className="mt-2 flex flex-col items-center gap-1">
          <SidebarRailTooltip label="新对话">
            <button type="button" onClick={onNew} aria-label="新对话" className={railButton}>
              <SquarePen className="h-5 w-5" />
            </button>
          </SidebarRailTooltip>
          <SidebarRailTooltip label="搜索会话">
            <button type="button" onClick={onExpand} aria-label="搜索会话" className={railButton}>
              <Search className="h-5 w-5" />
            </button>
          </SidebarRailTooltip>
          <SidebarRailTooltip label="已置顶">
            <button
              type="button"
              onClick={onExpand}
              aria-label="查看已置顶会话"
              className={railButton}
            >
              <Pin className="h-5 w-5" />
            </button>
          </SidebarRailTooltip>
          <SidebarRailTooltip label="最近聊天">
            <button
              type="button"
              onClick={onExpand}
              aria-label="查看最近会话"
              className={railButton}
            >
              <MessageCircle className="h-5 w-5" />
            </button>
          </SidebarRailTooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function CiteRefButton({
  n,
  citation,
  onViewRight,
}: {
  n: number;
  citation: AnswerCitation;
  onViewRight: () => void;
}) {
  const [hover, setHover] = useState(false);
  const doc = DOCS.find((d) => d.id === citation.docId);

  return (
    <span
      className="relative inline-block align-baseline"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setHover(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHover(false);
      }}
    >
      <button
        type="button"
        aria-label={`查看依据 ${n}${doc ? `：${doc.title}` : ""}`}
        onClick={onViewRight}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[#e3f0ed] px-1 text-[10px] font-semibold text-primary hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {n}
      </button>
      {hover && (
        <span
          role="tooltip"
          className="absolute bottom-[calc(100%+6px)] left-1/2 z-50 block w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-border bg-white p-3 shadow-lg"
        >
          <span className="mb-2 block min-w-0 text-[11px] font-medium leading-[1.45] text-foreground/90 [overflow-wrap:anywhere] [word-break:keep-all]">
            {doc?.title}
          </span>
          <span className="block text-[11px] leading-[1.6] text-foreground/80 [overflow-wrap:anywhere] [word-break:keep-all]">
            「{citation.quote}」
          </span>
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-white" />
        </span>
      )}
    </span>
  );
}

function renderCites(
  txt: string,
  citations: AnswerCitation[],
  onOpenCitation: (index: number) => void,
) {
  return txt.split(/(\[\d+\])/).map((p, i) => {
    const m = p.match(/^\[(\d+)\]$/);
    if (m) {
      const n = parseInt(m[1], 10);
      const idx = n - 1;
      const citation = citations[idx];
      if (!citation) return <span key={i}>{p}</span>;
      return (
        <CiteRefButton key={i} n={n} citation={citation} onViewRight={() => onOpenCitation(idx)} />
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function UserBubble({
  text,
  time,
  editable = false,
  onEdit,
}: {
  text: string;
  time?: string;
  editable?: boolean;
  onEdit?: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useEffect(() => {
    setDraft(text);
    if (!editable) setEditing(false);
  }, [editable, text]);

  const saveEdit = () => {
    const next = draft.trim();
    if (!next || !onEdit) return;
    onEdit(next);
    setEditing(false);
  };

  const user = getCurrentKnowledgeUser();

  return (
    <div className="flex justify-end">
      <div className="flex max-w-[min(800px,calc(100%-2.75rem))] flex-row-reverse items-start gap-3 sm:gap-4">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-white">
          <User className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-end gap-1.5 text-[10.5px] text-kb-muted">
            <span className="text-[12.5px] font-semibold text-kb-heading">{user.name}</span>
            <span aria-hidden="true">/</span>
            <span>{time ?? nowTime()}</span>
          </div>
          <div className="group relative rounded-[18px] bg-primary-soft px-4 py-2 text-[14px] leading-6 text-kb-heading">
            {editing ? (
              <div>
                <textarea
                  autoFocus
                  aria-label="编辑已发送的问题"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      saveEdit();
                    }
                    if (event.key === "Escape") {
                      setDraft(text);
                      setEditing(false);
                    }
                  }}
                  rows={2}
                  className="block w-full resize-none rounded-lg border border-primary/25 bg-white/80 px-3 py-2 text-[14px] leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
                <div className="mt-2 flex justify-end gap-2 text-[11px] leading-5">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(text);
                      setEditing(false);
                    }}
                    className="rounded-md px-2 py-1 text-kb-muted transition-colors hover:bg-white/70 hover:text-kb-heading"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={!draft.trim()}
                    onClick={saveEdit}
                    className="rounded-md bg-primary px-2.5 py-1 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-45"
                  >
                    保存并重新提问
                  </button>
                </div>
              </div>
            ) : (
              <>
                {text}
                {editable && (
                  <button
                    type="button"
                    aria-label="编辑刚才的问题"
                    title="编辑并重新提问"
                    onClick={() => setEditing(true)}
                    className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-border bg-white text-kb-muted opacity-0 shadow-sm transition-all hover:border-primary/30 hover:bg-primary-soft hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 group-hover:opacity-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StructuredAnswer({
  text,
  citations,
  onOpenCitation,
}: {
  text: string;
  citations: AnswerCitation[];
  onOpenCitation: (index: number) => void;
}) {
  const markers = [...text.matchAll(/[①②③④⑤⑥⑦⑧⑨⑩]/g)];
  if (markers.length < 2) {
    return <p>{renderCites(text, citations, onOpenCitation)}</p>;
  }

  const intro = text.slice(0, markers[0].index).trim();
  const items = markers.map((marker, index) => {
    const start = (marker.index ?? 0) + marker[0].length;
    const end = markers[index + 1]?.index ?? text.length;
    return text
      .slice(start, end)
      .trim()
      .replace(/^[：:；;\s]+|[；;\s]+$/g, "");
  });

  return (
    <div className="space-y-3">
      {intro && <p>{renderCites(intro, citations, onOpenCitation)}</p>}
      <ol className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">{renderCites(item, citations, onOpenCitation)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AnswerBubble({
  card,
  msgId,
  time,
  showCiteTrace,
  onOpenCitation,
  onAddNote,
  onFavorite,
  onQuizAction,
  quizGenerating,
  quizReady,
}: {
  card: AnswerCard;
  msgId: string;
  time?: string;
  showCiteTrace: boolean;
  onOpenCitation: (citations: AnswerCitation[], index: number) => void;
  onAddNote: () => void;
  onFavorite: () => void;
  onQuizAction: () => void;
  quizGenerating?: boolean;
  quizReady?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const openCite = (index: number) => onOpenCitation(card.citations, index);
  const answerForClipboard = [
    card.summary,
    card.uncertainty ? `注意事项：${card.uncertainty}` : "",
    ...card.citations.map((citation, index) => {
      const doc = DOCS.find((item) => item.id === citation.docId);
      return `[${index + 1}] ${doc?.title ?? citation.section}：${citation.quote}`;
    }),
  ]
    .filter(Boolean)
    .join("\n\n");

  useEffect(() => {
    const el = bodyRef.current;
    if (el) setNeedsCollapse(el.scrollHeight > COLLAPSE_MAX);
  }, [card]);

  return (
    <div className="group flex gap-3 sm:gap-4">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 max-w-[min(800px,calc(100%-2.75rem))] flex-1">
        <div className="mb-3 flex items-center gap-1.5 text-[10.5px] text-kb-muted">
          <span className="text-[12.5px] font-semibold text-kb-heading">运行智库</span>
          <span aria-hidden="true">/</span>
          <span>{time ?? nowTime()}</span>
        </div>

        <article>
          <div className="relative">
            <div
              ref={bodyRef}
              className={!expanded && needsCollapse ? "max-h-[420px] overflow-hidden" : ""}
            >
              <div className="space-y-5 text-[14px] leading-7 text-kb-body">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  基于知识库检索生成
                </div>
                <StructuredAnswer
                  text={card.summary}
                  citations={card.citations}
                  onOpenCitation={openCite}
                />
              </div>
            </div>
            {!expanded && needsCollapse && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>

          {needsCollapse && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[12px] font-medium text-primary hover:bg-[#f0f0ed]"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" /> 收起回答
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" /> 展开完整回答
                  </>
                )}
              </button>
            </div>
          )}

          {showCiteTrace && card.citations.length > 0 && (
            <div className="mt-5 border-t border-[#e7e7e4] pt-4">
              <div className="mb-2.5 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11.5px] font-semibold text-[#30302e]">
                  {card.citations.length} 个来源
                </span>
              </div>
              <div id={`${msgId}-sources`} className="flex flex-col gap-1">
                {card.citations.map((citation, i) => {
                  const srcDoc = DOCS.find((d) => d.id === citation.docId);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => openCite(i)}
                      className="flex min-h-9 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#f4f4f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <KbFileTypeIcon
                        type={docFileType(srcDoc)}
                        fileName={srcDoc?.title}
                        size="xs"
                        className="shrink-0 opacity-90"
                      />
                      <span className="min-w-0 flex-1 truncate text-[12px] text-[#8a8a84]">
                        {srcDoc?.title ?? citation.section}
                      </span>
                      <span className="shrink-0 tabular-nums text-[10.5px] text-[#b0b0aa]">
                        [{i + 1}]
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-2 flex min-h-10 flex-wrap items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            {/* 后续开放：加入笔记
            <button
              type="button"
              aria-label="加入笔记"
              title="加入笔记"
              onClick={onAddNote}
              className="grid h-10 w-10 place-items-center rounded-lg text-[#73736f] hover:bg-[#efefec] hover:text-[#20201f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <NotebookPen className="h-3.5 w-3.5" />
            </button>
            */}
            {/* 后续开放：收藏依据
            <button
              type="button"
              aria-label="收藏依据"
              title="收藏依据"
              onClick={onFavorite}
              className="grid h-10 w-10 place-items-center rounded-lg text-[#73736f] hover:bg-[#efefec] hover:text-[#20201f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Star className="h-3.5 w-3.5" />
            </button>
            */}
            {/* 本期暂不开放：问答生成练习题
            <button
              type="button"
              onClick={onQuizAction}
              disabled={quizGenerating}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] hover:border-primary/30 hover:bg-primary-soft/40 disabled:opacity-60"
            >
              <MessagesSquare className="h-3 w-3" />
              {quizGenerating ? "生成中…" : quizReady ? "查看题单" : "生成题单"}
            </button>
            */}
            <div className="flex items-center gap-0.5" aria-label="回答反馈与复制">
              <button
                type="button"
                aria-label="回答有帮助"
                title="回答有帮助"
                onClick={() => {
                  setLiked("up");
                  toast.success("感谢反馈");
                }}
                className={`grid h-10 w-10 place-items-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${liked === "up" ? "text-primary" : "text-muted-foreground"}`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="回答需改进"
                title="回答需改进"
                onClick={() => {
                  setLiked("down");
                  toast.message("已记录，将用于优化回答");
                }}
                className={`grid h-10 w-10 place-items-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${liked === "down" ? "text-remind" : "text-muted-foreground"}`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="复制完整回答"
                title="复制完整回答"
                onClick={() => {
                  void navigator.clipboard.writeText(answerForClipboard);
                  toast.success("已复制回答");
                }}
                className="grid h-10 w-10 place-items-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

// ─── Composer ────────────────────────────────────────────

function ChatComposer({
  input,
  loading,
  attachedFile,
  kbScope,
  kbDialogOpen,
  knowledgeBaseEnabled,
  deepThinkingEnabled,
  commonQuestions,
  onChange,
  onSend,
  onStop,
  onAttach,
  onKbChange,
  onKbDialogOpenChange,
  onKnowledgeBaseEnabledChange,
  onDeepThinkingEnabledChange,
  onQuoteDoc,
  onCommonQuestion,
}: {
  input: string;
  loading: boolean;
  attachedFile: string | null;
  kbScope: string[];
  kbDialogOpen: boolean;
  knowledgeBaseEnabled: boolean;
  deepThinkingEnabled: boolean;
  commonQuestions: string[];
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onAttach: (name: string | null) => void;
  onKbChange: (scope: string[]) => void;
  onKbDialogOpenChange: (open: boolean) => void;
  onKnowledgeBaseEnabledChange: (enabled: boolean) => void;
  onDeepThinkingEnabledChange: (enabled: boolean) => void;
  onQuoteDoc: (title: string) => void;
  onCommonQuestion: (q: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const toolsCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeTool, setActiveTool] = useState<"common" | "quote" | null>(null);
  const [showMobileTools, setShowMobileTools] = useState(false);

  const toolBtn =
    "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!composerRef.current?.contains(event.target as Node)) {
        setActiveTool(null);
        setShowMobileTools(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveTool(null);
        onKbDialogOpenChange(false);
        setShowMobileTools(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onKbDialogOpenChange]);

  useEffect(
    () => () => {
      if (toolsCloseTimerRef.current) clearTimeout(toolsCloseTimerRef.current);
    },
    [],
  );

  const openMobileTools = () => {
    if (loading) return;
    if (toolsCloseTimerRef.current) {
      clearTimeout(toolsCloseTimerRef.current);
      toolsCloseTimerRef.current = null;
    }
    setShowMobileTools(true);
  };

  const scheduleMobileToolsClose = () => {
    if (toolsCloseTimerRef.current) clearTimeout(toolsCloseTimerRef.current);
    toolsCloseTimerRef.current = setTimeout(() => {
      setShowMobileTools(false);
      toolsCloseTimerRef.current = null;
    }, 180);
  };

  const toggleTool = (tool: "common" | "quote") => {
    onKbDialogOpenChange(false);
    setActiveTool((current) => (current === tool ? null : tool));
  };

  const selectedKnowledgeBases = useMemo(
    () => CHAT_KNOWLEDGE_BASES.filter((base) => kbScope.includes(base.id)),
    [kbScope],
  );

  return (
    <div className="bg-white px-3 pb-2 pt-3 sm:px-6 sm:pb-3">
      <div
        ref={composerRef}
        className="mx-auto max-w-[820px] rounded-2xl border border-border bg-white shadow-[var(--shadow-card)] transition-[border-color,box-shadow] focus-within:border-primary/50 focus-within:shadow-[0_10px_28px_rgba(52,155,172,0.12)]"
      >
        <div
          className={cn(
            "scrollbar-hide flex min-h-10 items-center gap-1.5 overflow-x-auto rounded-t-2xl border-b border-divider bg-[#fbfcfc] px-3 py-2 transition-opacity sm:px-4",
            !knowledgeBaseEnabled && "opacity-55",
          )}
          aria-label="已选知识库"
        >
          {selectedKnowledgeBases.length > 0 ? (
            selectedKnowledgeBases.map((base) => (
              <span
                key={base.id}
                className="inline-flex max-w-[min(15rem,72vw)] shrink-0 items-center gap-1 rounded-[4px] border border-primary/20 bg-primary-soft/35 px-2 py-0.5 text-[10.5px] text-primary"
              >
                <span className="truncate">{base.name}</span>
                <button
                  type="button"
                  aria-label={`移除${base.name}`}
                  onClick={() =>
                    onKbChange(kbScope.filter((knowledgeBaseId) => knowledgeBaseId !== base.id))
                  }
                  className="grid h-4 w-4 shrink-0 place-items-center rounded-[2px] text-primary/70 hover:bg-white/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))
          ) : (
            <span className="shrink-0 text-[10.5px] text-kb-muted">暂未选择知识库</span>
          )}
        </div>

        <textarea
          aria-label="输入对话问题"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          style={{ minHeight: 58, maxHeight: 180 }}
          placeholder="向智能助手提问"
          className="block w-full resize-none border-0 bg-transparent px-4 pb-1 pt-3.5 text-[16px] leading-7 text-kb-heading outline-none placeholder:text-kb-muted sm:px-5 sm:text-[14px]"
        />

        {attachedFile && (
          <div className="px-3 pb-1 sm:px-4">
            <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 text-[11px] text-kb-body">
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-56 truncate">{attachedFile}</span>
              <button
                type="button"
                aria-label="移除附件"
                onClick={() => onAttach(null)}
                className="grid h-6 w-6 place-items-center rounded-md hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}

        <div className="relative flex items-center gap-1.5 px-2.5 pb-2.5 sm:px-3.5">
          {SHOW_COMPOSER_ADD_MENU && (
            <div
              className="relative"
              onMouseEnter={openMobileTools}
              onMouseLeave={scheduleMobileToolsClose}
              onFocusCapture={openMobileTools}
            >
              <button
                type="button"
                aria-label="添加内容"
                title="添加内容"
                aria-expanded={showMobileTools}
                disabled={loading}
                onClick={() => {
                  setShowMobileTools((value) => !value);
                  setActiveTool(null);
                }}
                className="grid h-10 w-10 place-items-center rounded-full text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-40"
              >
                <Plus
                  className={`h-[18px] w-[18px] transition-transform ${showMobileTools ? "rotate-45" : ""}`}
                />
              </button>

              {showMobileTools && (
                <div
                  className="absolute bottom-full left-0 z-30 w-48 pb-2"
                  onMouseEnter={openMobileTools}
                  onMouseLeave={scheduleMobileToolsClose}
                >
                  <div className="rounded-xl border border-border bg-white p-1.5 shadow-[var(--shadow-card)]">
                    <button
                      type="button"
                      disabled={loading}
                      className={toolBtn + " w-full"}
                      onClick={() => {
                        fileRef.current?.click();
                        setShowMobileTools(false);
                      }}
                    >
                      <Paperclip className="h-4 w-4" />
                      上传附件
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className={toolBtn + " w-full"}
                      onClick={() => {
                        setShowMobileTools(false);
                        toggleTool("quote");
                      }}
                    >
                      <Quote className="h-4 w-4" />
                      引用资料
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      className={toolBtn + " w-full"}
                      onClick={() => {
                        setShowMobileTools(false);
                        toggleTool("common");
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      常用问题
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <div className="inline-flex h-8 shrink-0 items-center rounded-md border border-[#d7e1e4] bg-white text-[11.5px] font-medium text-kb-body shadow-[0_1px_2px_rgba(35,66,75,0.03)]">
              <div className="inline-flex h-full items-center gap-1.5 px-2">
                <KnowledgeBaseIcon size="xs" />
                <span>知识库</span>
                <Switch
                  checked={knowledgeBaseEnabled}
                  disabled={loading}
                  onCheckedChange={(checked) => {
                    onKnowledgeBaseEnabledChange(checked);
                    if (checked && kbScope.length === 0) onKbDialogOpenChange(true);
                  }}
                  aria-label={knowledgeBaseEnabled ? "关闭知识库检索" : "开启知识库检索"}
                  className="ml-0.5 h-[18px] w-8 shadow-none [&>span]:h-3.5 [&>span]:w-3.5 data-[state=checked]:[&>span]:translate-x-3.5"
                />
              </div>

              <span className="h-4 w-px bg-divider" aria-hidden="true" />

              <button
                type="button"
                disabled={loading || !knowledgeBaseEnabled}
                aria-label="知识库设置"
                title={knowledgeBaseEnabled ? "知识库设置" : "请先开启知识库"}
                onClick={() => {
                  setShowMobileTools(false);
                  setActiveTool(null);
                  onKbDialogOpenChange(true);
                }}
                className="inline-flex h-full items-center justify-center rounded-r-[5px] px-2 text-kb-body transition-[background-color,color,opacity] hover:bg-primary-soft/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35 disabled:pointer-events-none disabled:opacity-40"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              aria-pressed={deepThinkingEnabled}
              disabled={loading}
              onClick={() => onDeepThinkingEnabledChange(!deepThinkingEnabled)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2 text-[11.5px] font-medium shadow-[0_1px_2px_rgba(35,66,75,0.03)] transition-[border-color,background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-40",
                deepThinkingEnabled
                  ? "border-primary/35 bg-primary-soft/55 text-primary"
                  : "border-[#d7e1e4] bg-white text-kb-body hover:border-primary/30 hover:bg-primary-soft/30 hover:text-primary",
              )}
            >
              <BrainCircuit className="hidden h-3.5 w-3.5 stroke-[1.8] sm:block" />
              深度思考
            </button>
          </div>

          <button
            type="button"
            disabled={!loading && !input.trim()}
            onClick={loading ? onStop : onSend}
            aria-label={loading ? "停止生成" : "发送"}
            title={loading ? "停止生成" : "发送"}
            className={`ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-35 ${
              loading
                ? "bg-[#f3e8e8] text-[#963f3f] hover:bg-[#eddada]"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {loading ? (
              <Square className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>

          {activeTool === "common" && (
            <div className="scrollbar-neutral absolute bottom-[calc(100%+8px)] left-0 z-20 max-h-64 w-[min(22rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-[var(--shadow-card)]">
              {commonQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    onCommonQuestion(q);
                    setActiveTool(null);
                    setShowMobileTools(false);
                  }}
                  className="block min-h-10 w-full rounded-lg px-3 py-2 text-left text-[12px] text-kb-body hover:bg-primary-soft"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {activeTool === "quote" && (
            <div className="scrollbar-neutral absolute bottom-[calc(100%+8px)] left-0 z-20 max-h-64 w-[min(24rem,calc(100vw-3rem))] overflow-y-auto rounded-xl border border-border bg-white p-1.5 shadow-[var(--shadow-card)]">
              {DOCS.slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onQuoteDoc(d.title);
                    setActiveTool(null);
                    setShowMobileTools(false);
                  }}
                  className="block min-h-10 w-full rounded-lg px-3 py-2 text-left text-[12px] text-kb-body hover:bg-primary-soft"
                >
                  <span className="mr-1.5 text-[10px] font-medium text-primary">
                    {docTypeLabel(d)}
                  </span>
                  {d.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mx-auto mt-1.5 max-w-[820px] text-center text-[10px] leading-4 text-kb-muted sm:text-[10.5px]">
        AI 回答用于学习参考，关键结论请结合规程原文和现场要求判断
      </p>
      <KnowledgeBaseSelectorDialog
        open={kbDialogOpen}
        value={kbScope}
        onOpenChange={onKbDialogOpenChange}
        onChange={onKbChange}
      />
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            onAttach(f.name);
            toast.success(`已选择：${f.name}`);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────

function ChatPage() {
  const { prefill, libId } = Route.useSearch();
  const { state, addNote, toggleFavorite, removeFavorite, addQuizSet, getQuizSetByMsgId } =
    useMockStore();

  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState(DEFAULT_CONVERSATION_ID);
  const [input, setInput] = useState(prefill ?? "");
  const [loading, setLoading] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [citationPanelOpen, setCitationPanelOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [kbScope, setKbScope] = useState<string[]>(() => {
    if (libId && CHAT_KNOWLEDGE_BASES.some((base) => base.id === libId)) return [libId];
    return ["kb-grid-operation"];
  });
  const [kbDialogOpen, setKbDialogOpen] = useState(false);
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(true);
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [commonQuestions, setCommonQuestions] = useState(() => readCommonQuestions());
  const [storageReady, setStorageReady] = useState(false);
  const [chatPageReady, setChatPageReady] = useState(false);
  const [citationView, setCitationView] = useState<{
    citations: AnswerCitation[];
    index: number;
  }>({ citations: [], index: 0 });
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasNewReply, setHasNewReply] = useState(false);
  const [pausedUserMessage, setPausedUserMessage] = useState<{
    conversationId: string;
    index: number;
  } | null>(null);
  const [quizDialog, setQuizDialog] = useState<{ open: boolean; msgId: string | null }>({
    open: false,
    msgId: null,
  });
  const [generatingMsgIds, setGeneratingMsgIds] = useState<Set<string>>(() => new Set());
  const genTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    const loadedConversations = readConversations();
    const loadedActiveId = readActiveConversationId(loadedConversations);
    setConversations(loadedConversations);
    setActiveId(loadedActiveId);
    setStorageReady(true);

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setChatPageReady(true);
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, []);

  const conv = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const openCitation = useCallback((citations: AnswerCitation[], index: number) => {
    setCitationView({ citations, index });
    setCitationPanelOpen(true);
  }, []);

  const openDocCitation = useCallback(
    (docId: string) => {
      const doc = DOCS.find((d) => d.id === docId);
      if (!doc) return;
      openCitation([docToCitation(doc)], 0);
    },
    [openCitation],
  );

  const handleCommonQuestionsChange = useCallback((qs: string[]) => {
    setCommonQuestions(qs);
    writeCommonQuestions(qs);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(conversations));
  }, [conversations, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    if (activeId) localStorage.setItem(CHAT_ACTIVE_ID_KEY, activeId);
  }, [activeId, storageReady]);

  // 仅在切换会话或最新回答引用变化时同步右侧 tabs；点击某条回答的引用时由 openCitation 绑定该回合引用
  const lastAssistantCitations = (() => {
    const last = [...conv.messages].reverse().find((m) => m.role === "assistant");
    return last && last.role === "assistant" ? last.card.citations : null;
  })();

  useEffect(() => {
    if (lastAssistantCitations && lastAssistantCitations.length > 0) {
      setCitationView({ citations: lastAssistantCitations, index: 0 });
    } else if (conv.messages.length === 0) {
      setCitationView({ citations: [], index: 0 });
      setCitationPanelOpen(false);
    }
  }, [activeId, lastAssistantCitations, conv.messages.length]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    const end = el.scrollHeight - el.clientHeight;
    if (!smooth || Math.abs(el.scrollTop - end) < 2) {
      el.scrollTop = end;
      setHasNewReply(false);
      nearBottomRef.current = true;
      return;
    }
    const start = el.scrollTop;
    const duration = 280;
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      // ease-out cubic
      el.scrollTop = start + (end - start) * (1 - Math.pow(1 - t, 3));
      if (t < 1) requestAnimationFrame(animate);
      else {
        setHasNewReply(false);
        nearBottomRef.current = true;
      }
    };
    requestAnimationFrame(animate);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    nearBottomRef.current = dist < 80;
    setShowScrollBtn(dist > 100);
    if (dist < 80) setHasNewReply(false);
  }, []);

  useEffect(() => {
    if (nearBottomRef.current) scrollToBottom();
    else if (!loading) setHasNewReply(true);
  }, [conv.messages.length, loading, scrollToBottom]);

  useEffect(() => {
    if (prefill) setInput(prefill);
  }, [prefill]);

  useEffect(() => {
    if (!libId || !CHAT_KNOWLEDGE_BASES.some((base) => base.id === libId)) return;
    setKbScope((current) => (current.length === 1 && current[0] === libId ? current : [libId]));
  }, [libId]);

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom(false);
      handleScroll();
    });
  }, [activeId, scrollToBottom, handleScroll]);

  const send = (val?: string) => {
    const text = (val ?? input).trim();
    if (!text || loading) return;
    const targetConversationId = activeId;
    const t = nowTime();
    setInput("");
    setPausedUserMessage(null);
    setLoading(true);
    nearBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom());
    setConversations((cs) =>
      cs.map((c) => {
        if (c.id !== targetConversationId) return c;
        const title = c.title === "新对话" ? text.slice(0, 28) : c.title;
        return {
          ...c,
          title,
          updatedAt: "刚刚",
          messages: [...c.messages, { role: "user", text, time: t }],
        };
      }),
    );
    responseTimerRef.current = setTimeout(() => {
      responseTimerRef.current = null;
      setConversations((cs) =>
        cs.map((c) =>
          c.id === targetConversationId
            ? { ...c, messages: [...c.messages, buildMockAnswer(text)] }
            : c,
        ),
      );
      setLoading(false);
      setAttachedFile(null);
      requestAnimationFrame(() => scrollToBottom());
    }, 1200);
  };

  const stopGeneration = useCallback(() => {
    if (!responseTimerRef.current) return;
    clearTimeout(responseTimerRef.current);
    responseTimerRef.current = null;
    setLoading(false);
    const lastUserIndex = conv.messages.map((message) => message.role).lastIndexOf("user");
    if (lastUserIndex >= 0) {
      setPausedUserMessage({ conversationId: activeId, index: lastUserIndex });
    }
    toast.message("已停止生成，可继续编辑问题");
  }, [activeId, conv.messages]);

  const resendEditedQuestion = (messageIndex: number, nextText: string) => {
    const text = nextText.trim();
    if (!text || loading) return;
    const targetConversationId = activeId;
    const t = nowTime();
    setPausedUserMessage(null);
    setLoading(true);
    nearBottomRef.current = true;
    requestAnimationFrame(() => scrollToBottom());
    setConversations((cs) =>
      cs.map((conversation) => {
        if (conversation.id !== targetConversationId) return conversation;
        const messages = conversation.messages.slice(0, messageIndex + 1);
        const message = messages[messageIndex];
        if (!message || message.role !== "user") return conversation;
        messages[messageIndex] = { ...message, text, time: t };
        return { ...conversation, updatedAt: "刚刚", messages };
      }),
    );
    responseTimerRef.current = setTimeout(() => {
      responseTimerRef.current = null;
      setConversations((cs) =>
        cs.map((conversation) =>
          conversation.id === targetConversationId
            ? { ...conversation, messages: [...conversation.messages, buildMockAnswer(text)] }
            : conversation,
        ),
      );
      setLoading(false);
      setAttachedFile(null);
      requestAnimationFrame(() => scrollToBottom());
    }, 1200);
  };

  const newConv = useCallback(() => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
      setLoading(false);
    }
    const id = `c${Date.now()}`;
    setConversations((cs) => [{ id, title: "新对话", updatedAt: "刚刚", messages: [] }, ...cs]);
    setActiveId(id);
    setHistoryDrawerOpen(false);
    setCitationPanelOpen(false);
    setCitationView({ citations: [], index: 0 });
    setPausedUserMessage(null);
    setInput("");
  }, []);

  const deleteConv = (id: string) => {
    const removedIndex = conversations.findIndex((conversation) => conversation.id === id);
    const removed = conversations[removedIndex];
    if (!removed) return;

    const remaining = conversations.filter((conversation) => conversation.id !== id);
    const replacement: Conversation | null =
      remaining.length === 0
        ? { id: `c${Date.now()}`, title: "新对话", updatedAt: "刚刚", messages: [] }
        : null;
    const next = replacement ? [replacement] : remaining;

    setConversations(next);
    if (activeId === id) setActiveId(next[Math.min(removedIndex, next.length - 1)].id);

    toast.success("会话已删除", {
      duration: 6000,
      action: {
        label: "撤销",
        onClick: () => {
          setConversations((current) => {
            const base = replacement
              ? current.filter((conversation) => conversation.id !== replacement.id)
              : current;
            const restored = [...base];
            restored.splice(Math.min(removedIndex, restored.length), 0, removed);
            return restored;
          });
          setActiveId(id);
          toast.success("已恢复会话");
        },
      },
    });
  };

  const renameConv = (id: string, title: string) => {
    setConversations((cs) => cs.map((c) => (c.id === id ? { ...c, title } : c)));
    toast.success("已重命名");
  };

  const togglePinConv = (id: string) => {
    setConversations((cs) =>
      cs.map((c) => {
        if (c.id !== id) return c;
        const pinned = !c.pinned;
        toast.success(pinned ? "已置顶会话" : "已取消置顶");
        return { ...c, pinned };
      }),
    );
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        newConv();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newConv]);

  const handleAddNote = (card: AnswerCard) => {
    const firstDoc = card.citations[0]
      ? DOCS.find((d) => d.id === card.citations[0].docId)
      : undefined;
    addNote({
      title: `问答笔记 · ${card.summary.slice(0, 20)}…`,
      body: card.summary,
      tag: "智能问答",
      docId: firstDoc?.id,
    });
    toast.success("已加入笔记");
  };

  const handleFavorite = (card: AnswerCard) => {
    const docId = card.citations[0]?.docId;
    if (docId) {
      toggleFavorite(docId);
      toast.success("已收藏相关依据资料");
    } else toast.message("本条回答暂无可收藏资料");
  };

  const activeQuizSet = quizDialog.msgId
    ? (state.quizSets.find((q) => q.relatedMsgId === quizDialog.msgId) ?? null)
    : null;
  const quizDialogLoading = !!quizDialog.msgId && generatingMsgIds.has(quizDialog.msgId);

  const startQuizGeneration = useCallback(
    (msgId: string, card: AnswerCard, userQuestion: string) => {
      if (getQuizSetByMsgId(msgId)) {
        setQuizDialog({ open: true, msgId });
        return;
      }
      if (generatingMsgIds.has(msgId) || genTimersRef.current.has(msgId)) {
        setQuizDialog({ open: true, msgId });
        return;
      }

      setQuizDialog({ open: true, msgId });
      setGeneratingMsgIds((prev) => new Set(prev).add(msgId));
      toast.message("已开始生成题单，完成后将同步至个人沉淀");

      const timer = setTimeout(() => {
        genTimersRef.current.delete(msgId);
        const docIds = card.citations.map((c) => c.docId);
        const questionIds = pickQuestionsForAnswer(docIds, card.summary, 5);
        const quiz: QuizSet = {
          id: `qs-${Date.now()}`,
          title: buildQuizSetTitle(userQuestion, card.summary),
          source: "智能问答生成",
          questionCount: questionIds.length,
          status: "未开始",
          relatedChat: userQuestion || card.summary.slice(0, 40),
          relatedMsgId: msgId,
          relatedConvId: activeId,
          createdAt: new Date().toLocaleString("zh-CN", { hour12: false }),
          filter: inferQuizFilter(questionIds),
          questionIds,
        };
        addQuizSet(quiz);
        setGeneratingMsgIds((prev) => {
          const next = new Set(prev);
          next.delete(msgId);
          return next;
        });
        toast.success("题单已生成，可在个人沉淀查看");
      }, 2500);

      genTimersRef.current.set(msgId, timer);
    },
    [activeId, addQuizSet, generatingMsgIds, getQuizSetByMsgId],
  );

  useEffect(() => {
    const generationTimers = genTimersRef.current;
    return () => {
      if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
      generationTimers.forEach((timer) => clearTimeout(timer));
      generationTimers.clear();
    };
  }, []);

  const handleQuizAction = (msgId: string, card: AnswerCard, userQuestion: string) => {
    const existing = getQuizSetByMsgId(msgId);
    if (existing) {
      setQuizDialog({ open: true, msgId });
      return;
    }
    startQuizGeneration(msgId, card, userQuestion);
  };

  const findUserQuestionForMsg = (msgIndex: number) => {
    for (let i = msgIndex - 1; i >= 0; i -= 1) {
      const m = conv.messages[i];
      if (m.role === "user") return m.text;
    }
    return conv.title;
  };

  const quoteDocIntoInput = (title: string) => {
    setInput((value) => (value ? `${value}\n引用：${title}` : `请结合《${title}》回答：`));
  };

  const selectConversation = (id: string) => {
    setActiveId(id);
    setHistoryDrawerOpen(false);
    const selected = conversations.find((c) => c.id === id);
    if (!selected || selected.messages.length === 0) {
      setCitationPanelOpen(false);
      setCitationView({ citations: [], index: 0 });
    }
  };

  const renderSidebar = (className = "", onCollapse?: () => void) => (
    <ChatSidebar
      className={className}
      conversations={conversations}
      activeId={activeId}
      onSelect={selectConversation}
      onNew={newConv}
      onDelete={deleteConv}
      onRename={renameConv}
      onTogglePin={togglePinConv}
      onCollapse={onCollapse}
    />
  );

  const isEmptyConversation = conv.messages.length === 0;

  const composerElement = (
    <ChatComposer
      input={input}
      loading={loading}
      attachedFile={attachedFile}
      kbScope={kbScope}
      kbDialogOpen={kbDialogOpen}
      knowledgeBaseEnabled={knowledgeBaseEnabled}
      deepThinkingEnabled={deepThinkingEnabled}
      onChange={setInput}
      onSend={() => send()}
      onStop={stopGeneration}
      onAttach={setAttachedFile}
      onKbChange={setKbScope}
      onKbDialogOpenChange={setKbDialogOpen}
      onKnowledgeBaseEnabledChange={setKnowledgeBaseEnabled}
      onDeepThinkingEnabledChange={setDeepThinkingEnabled}
      onQuoteDoc={quoteDocIntoInput}
      onCommonQuestion={(question) => setInput(question)}
      commonQuestions={commonQuestions}
    />
  );

  const composerSection = <div className="shrink-0">{composerElement}</div>;

  return (
    <PageShell compact>
      <div className="chat-workspace flex h-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="hidden h-full min-h-0 xl:block">
          {sidebarCollapsed ? (
            <ChatRail
              conversations={conversations}
              activeId={activeId}
              onSelect={selectConversation}
              onNew={newConv}
              onDelete={deleteConv}
              onRename={renameConv}
              onTogglePin={togglePinConv}
              onExpand={() => setSidebarCollapsed(false)}
            />
          ) : (
            renderSidebar("", () => setSidebarCollapsed(true))
          )}
        </div>

        <Sheet open={historyDrawerOpen} onOpenChange={setHistoryDrawerOpen}>
          <SheetContent side="left" className="w-[min(90vw,340px)] p-0 sm:max-w-[340px]">
            <SheetHeader className="sr-only">
              <SheetTitle>对话记录与设置</SheetTitle>
            </SheetHeader>
            {renderSidebar("w-full border-r-0", () => setHistoryDrawerOpen(false))}
          </SheetContent>
        </Sheet>

        <div className="relative flex min-h-0 min-w-0 flex-1">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            {!chatPageReady ? (
              <div className="flex min-h-0 flex-1 items-center justify-center bg-[#f7fafb]">
                <DialogLoading />
              </div>
            ) : (
              <>
                {isEmptyConversation ? (
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(#d9d9d4 1px, transparent 1px), radial-gradient(ellipse 55% 60% at 50% 15%, rgba(52,155,172,0.09), transparent 70%)",
                      backgroundSize: "20px 20px, 100% 100%",
                      maskImage:
                        "radial-gradient(ellipse 65% 60% at 50% 22%, black, transparent)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse 65% 60% at 50% 22%, black, transparent)",
                    }}
                    aria-hidden="true"
                  />
                ) : null}

                <div
                  className={
                    isEmptyConversation
                      ? "relative z-10 flex min-h-14 shrink-0 items-center gap-2 bg-transparent px-2 sm:px-5"
                      : "flex min-h-14 shrink-0 items-center gap-2 border-b border-divider bg-white px-2 sm:px-5"
                  }
                >
                  <button
                    type="button"
                    aria-label="打开对话记录"
                    onClick={() => setHistoryDrawerOpen(true)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] text-kb-muted hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 xl:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  {!isEmptyConversation ? (
                    <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-kb-heading">
                      {conv.title}
                    </div>
                  ) : null}
                </div>

                {isEmptyConversation ? (
                  <div className="scrollbar-neutral relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-10 sm:px-7 sm:py-14">
                    <div className="relative flex w-full max-w-[760px] flex-col items-center text-center">
                      <div className="relative">
                        <span
                          className="absolute -right-2.5 top-0 h-2 w-2 rounded-full bg-primary/35"
                          aria-hidden="true"
                        />
                        <span
                          className="absolute -left-3 top-4 h-1.5 w-1.5 rounded-full bg-primary/45"
                          aria-hidden="true"
                        />
                        <span
                          className="absolute left-1 -top-3 h-1 w-1 rounded-full bg-primary/40"
                          aria-hidden="true"
                        />
                        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#4fb8cb] to-primary text-white shadow-[0_12px_28px_rgba(52,155,172,0.35)]">
                          <Sparkles className="h-7 w-7" />
                        </div>
                      </div>

                      <h2 className="mt-6 text-[24px] font-bold tracking-[-0.02em] text-kb-heading">
                        hi张工，今天想要了解什么
                      </h2>
                      <p className="mt-2 max-w-md text-[13px] leading-6 text-kb-muted">
                        支持规程条款、典型操作、故障处置和场景复盘，回答会附带可核验原文。
                      </p>

                      <div className="mt-8 w-full">{composerSection}</div>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 px-2">
                        {commonQuestions.slice(0, 6).map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => send(q)}
                            className="rounded-full border border-border bg-white px-3.5 py-2 text-[12px] text-kb-body shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-soft/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative min-h-0 flex-1">
                      <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="scrollbar-neutral absolute inset-0 overflow-y-auto px-4 py-7 sm:px-7 sm:py-9"
                      >
                        <div className="mx-auto max-w-[820px] space-y-10">
                          {conv.messages.map((m, i) => {
                            if (m.role === "user") {
                              const editable =
                                pausedUserMessage?.conversationId === activeId &&
                                pausedUserMessage.index === i;
                              return (
                                <UserBubble
                                  key={i}
                                  text={m.text}
                                  time={m.time}
                                  editable={editable}
                                  onEdit={(text) => resendEditedQuestion(i, text)}
                                />
                              );
                            }
                            const msgId = `msg-${activeId}-${i}`;
                            const quizSet = state.quizSets.find((q) => q.relatedMsgId === msgId);
                            return (
                              <AnswerBubble
                                key={i}
                                msgId={msgId}
                                card={m.card}
                                time={m.time}
                                showCiteTrace
                                onOpenCitation={openCitation}
                                onAddNote={() => handleAddNote(m.card)}
                                onFavorite={() => handleFavorite(m.card)}
                                quizReady={!!quizSet}
                                quizGenerating={generatingMsgIds.has(msgId)}
                                onQuizAction={() =>
                                  handleQuizAction(msgId, m.card, findUserQuestionForMsg(i))
                                }
                              />
                            );
                          })}

                          {loading && (
                            <div
                              role="status"
                              aria-live="polite"
                              className="flex items-start gap-4"
                            >
                              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                              </div>
                              <div className="w-full max-w-[520px] pt-1">
                                <div className="text-[12.5px] font-medium text-[#30302e]">
                                  {deepThinkingEnabled
                                    ? knowledgeBaseEnabled
                                      ? "正在深度思考并检索知识库"
                                      : "正在深度思考并组织回答"
                                    : knowledgeBaseEnabled
                                      ? "正在检索资料并组织回答"
                                      : "正在组织回答"}
                                </div>
                                <div className="mt-3 space-y-2" aria-hidden="true">
                                  <span className="block h-2 w-full animate-pulse rounded-full bg-[#ececea]" />
                                  <span className="block h-2 w-4/5 animate-pulse rounded-full bg-[#ececea]" />
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={endRef} />
                        </div>
                      </div>

                      {showScrollBtn && (
                        <button
                          type="button"
                          onClick={() => scrollToBottom()}
                          aria-label={hasNewReply ? "有新回复，回到底部" : "回到底部"}
                          title={hasNewReply ? "有新回复" : "回到底部"}
                          className="animate-in fade-in slide-in-from-top-1 absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#d8d8d4] bg-white/90 px-3 py-1.5 text-[12px] text-[#3d3d39] shadow-sm backdrop-blur-sm duration-150 hover:bg-[#f2f2ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <ArrowDown className="h-3 w-3 shrink-0" />
                          <span>{hasNewReply ? "有新回复" : "回到底部"}</span>
                          {hasNewReply && (
                            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-2 border-white bg-remind" />
                          )}
                        </button>
                      )}
                    </div>

                    {composerSection}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {citationPanelOpen ? (
          <div className="hidden h-full min-h-0 w-[clamp(24rem,31vw,42rem)] shrink-0 animate-in fade-in slide-in-from-right-3 duration-200 xl:flex">
            <CitationPanel
              className="flex w-full border-l"
              citations={citationView.citations}
              activeIndex={citationView.index}
              onChangeIndex={(index) => setCitationView((value) => ({ ...value, index }))}
              onClose={() => setCitationPanelOpen(false)}
            />
          </div>
        ) : null}
      </div>

      <QuizSetDialog
        open={quizDialog.open}
        onOpenChange={(open) => setQuizDialog((prev) => ({ ...prev, open }))}
        loading={quizDialogLoading}
        quizSet={activeQuizSet}
      />
    </PageShell>
  );
}
