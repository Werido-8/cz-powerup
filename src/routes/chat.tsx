import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  BookOpen,
  Star,
  MessagesSquare,
  SquarePen,
  Clock,
  MoreHorizontal,
  MoreVertical,
  Paperclip,
  Database,
  Quote,
  MessageCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Search,
  Settings,
  Bookmark,
  List,
  Pin,
  PinOff,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CONVERSATIONS,
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
import type { QuizSet } from "@/lib/mock/learning-hub";

const searchSchema = z.object({ prefill: z.string().optional() });

export const Route = createFileRoute("/chat")({
  validateSearch: searchSchema,
  component: ChatPage,
  head: () => ({ meta: [{ title: "智能问答 · 涉网运行能力智能提升平台" }] }),
});

const COMMON_QUESTIONS = [
  "AGC 考核主要依据哪些文件？",
  "主变停役前需要核对哪些状态？",
  "母线差动保护动作后如何复盘？",
  "深度调峰低负荷稳燃有哪些注意点？",
  "220kV 倒闸操作有哪些易错点？",
  "如何根据错题生成专项练习？",
];

const KB_OPTIONS = ["全部资料", "规程标准", "典型操作", "故障处置", "厂家SOP", "历史案例"] as const;

type HistoryGroup = "today" | "week" | "month";

const HISTORY_GROUPS: { key: HistoryGroup; label: string }[] = [
  { key: "today", label: "今天" },
  { key: "week", label: "七天内" },
  { key: "month", label: "一个月内" },
];

type HistorySectionKey = "pinned" | HistoryGroup;

const DEFAULT_SECTION_OPEN: Record<HistorySectionKey, boolean> = {
  pinned: true,
  today: true,
  week: false,
  month: false,
};

const HISTORY_SECTIONS_KEY = "chat-history-sections-v1";

function loadSectionOpen(): Record<HistorySectionKey, boolean> {
  try {
    const raw = localStorage.getItem(HISTORY_SECTIONS_KEY);
    if (raw) return { ...DEFAULT_SECTION_OPEN, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SECTION_OPEN;
}

function HistorySection({
  label,
  count,
  open,
  onToggle,
  children,
  leading,
  hasActive,
}: {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  leading?: React.ReactNode;
  hasActive?: boolean;
}) {
  if (count === 0) return null;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={onToggle}
        className={`group flex w-full items-center gap-1 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-[#f0f6f7] ${
          !open && hasActive ? "bg-primary-soft/40" : ""
        }`}
      >
        <ChevronRight
          className={`h-3 w-3 shrink-0 text-muted-foreground/60 transition-transform duration-200 group-hover:text-muted-foreground ${
            open ? "rotate-90" : ""
          }`}
        />
        {leading}
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className="shrink-0 rounded-md bg-muted/70 px-1.5 py-px text-[10px] tabular-nums text-muted-foreground/80">
          {count}
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          open
            ? "grid-rows-[1fr] overflow-visible opacity-100"
            : "pointer-events-none grid-rows-[0fr] overflow-hidden opacity-0"
        }`}
      >
        <ul className={`min-h-0 space-y-px pl-1 pt-0.5 ${open ? "overflow-visible" : "overflow-hidden"}`}>
          {children}
        </ul>
      </div>
    </div>
  );
}

const COLLAPSE_MAX = 420;

type ChatSettings = {
  citeTrace: boolean;
  autoScrollOnSend: boolean;
  defaultKb: string;
};

const CHAT_SETTINGS_KEY = "chat-settings-v1";
const CHAT_COMMON_KEY = "chat-common-questions-v1";

const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  citeTrace: true,
  autoScrollOnSend: true,
  defaultKb: "全部资料",
};

function readChatSettings(): ChatSettings {
  if (typeof window === "undefined") return DEFAULT_CHAT_SETTINGS;
  try {
    const raw = localStorage.getItem(CHAT_SETTINGS_KEY);
    if (!raw) return DEFAULT_CHAT_SETTINGS;
    return { ...DEFAULT_CHAT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CHAT_SETTINGS;
  }
}

function writeChatSettings(s: ChatSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_SETTINGS_KEY, JSON.stringify(s));
}

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

function getHistoryGroup(updatedAt: string): HistoryGroup {
  if (updatedAt.startsWith("今天") || updatedAt === "刚刚") return "today";
  if (updatedAt.startsWith("昨天") || updatedAt.startsWith("前天")) return "week";
  const m = updatedAt.match(/(\d+)\s*天前/);
  if (m) return Number(m[1]) <= 7 ? "week" : "month";
  return "week";
}

function groupConversations(list: Conversation[]) {
  const g: Record<HistoryGroup, Conversation[]> = { today: [], week: [], month: [] };
  for (const c of list) g[getHistoryGroup(c.updatedAt)].push(c);
  return g;
}

function docTypeLabel(doc: Doc) {
  const map: Record<string, string> = {
    规程标准: "规程",
    典型操作: "操作票",
    故障处置: "案例",
    历史案例: "案例",
    厂家SOP: "SOP",
    厂站资料: "厂站",
    "两细则/考核": "题库",
  };
  return map[doc.docType] ?? "资料";
}

function citeLabel(c: AnswerCitation, doc?: Doc) {
  return c.label ?? (doc ? docTypeLabel(doc) : "资料");
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
        uncertainty: "各区域细则版本差异，具体计算公式以本区域最新发布版本为准。",
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
        uncertainty: "厂站接线方式差异较大，具体仍以本厂站接线图为准。",
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
      scope: "—",
      uncertainty: "本问题缺少明确资料命中，回答仅供参考方向。",
    },
  };
}

// ─── Citation panel (right, collapsible) ───────────────────

function CitationToggleBar({
  collapsed,
  citationsCount,
  activeIndex,
  onToggle,
  className = "",
}: {
  collapsed: boolean;
  citationsCount: number;
  activeIndex: number;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      title={collapsed ? "展开原文依据" : "收起原文依据"}
      className={`inline-flex items-center gap-1.5 rounded-md border border-border bg-white/95 px-3 py-1.5 text-[12px] font-medium text-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/35 hover:text-primary ${className}`}
    >
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span>原文依据</span>
      {citationsCount > 0 && (
        <span className="text-[10px] font-normal text-muted-foreground">
          {activeIndex + 1}/{citationsCount}
        </span>
      )}
      {collapsed ? (
        <ChevronLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}

function CitationPanel({
  citations,
  activeIndex,
  onChangeIndex,
}: {
  citations: AnswerCitation[];
  activeIndex: number;
  onChangeIndex: (i: number) => void;
}) {
  const c = citations[activeIndex];
  const doc = c ? DOCS.find((d) => d.id === c.docId) : undefined;
  const bodySection = c && doc ? resolveBodySection(c, doc) : undefined;

  return (
    <aside className="hidden h-full min-h-0 w-[400px] shrink-0 flex-col border-l border-border bg-white pt-11 xl:flex">

      {citations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center text-[12px] text-muted-foreground">
          开始提问后，点击回答中的「查看原文」即可在此查看依据片段
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 border-b border-divider px-4 py-2">
            {citations.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChangeIndex(i)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  i === activeIndex
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-primary-soft hover:text-primary"
                }`}
              >
                依据 {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-2 border-b border-divider px-4 py-2">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => onChangeIndex(activeIndex - 1)}
              className="rounded-lg border border-border px-2.5 py-1 text-[11px] disabled:opacity-40"
            >
              上一条
            </button>
            <button
              type="button"
              disabled={activeIndex >= citations.length - 1}
              onClick={() => onChangeIndex(activeIndex + 1)}
              className="rounded-lg border border-border px-2.5 py-1 text-[11px] disabled:opacity-40"
            >
              下一条
            </button>
          </div>
          {c && doc && (
            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                  {citeLabel(c, doc)}
                </span>
                <span className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                  {doc.source}
                </span>
              </div>
              <h3 className="text-[13px] font-semibold leading-snug">{doc.title}</h3>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {c.position ?? c.section} · 更新 {doc.updatedAt}
              </p>
              <div className="mt-4 rounded-lg border border-border bg-[#f8fbfc] p-3.5">
                <div className="mb-1 text-[11px] font-semibold text-primary">命中片段</div>
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                  <mark className="rounded bg-[#fff5e8] px-0.5">{c.quote}</mark>
                </p>
              </div>
              {bodySection && (
                <div className="mt-4">
                  <div className="mb-2 text-[12px] font-semibold">章节原文</div>
                  <p className="text-[13px] leading-[1.75] whitespace-pre-wrap text-foreground/90">
                    {bodySection.text}
                  </p>
                </div>
              )}
            </div>
          )}
          {c && doc && (
            <div className="border-t border-divider px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(c.quote);
                  toast.success("引用已复制");
                }}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[12px] hover:bg-muted"
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

type SidebarPanel = "none" | "favorites" | "common" | "settings";

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
  return (
    <li className="relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(conv.id)}
        onKeyDown={(e) => e.key === "Enter" && onSelect(conv.id)}
        className={`group flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition-colors ${
          active ? "bg-primary-soft shadow-[inset_2px_0_0_0_hsl(var(--primary))]" : "hover:bg-[#f0f6f7]"
        }`}
      >
        {conv.pinned ? (
          <Pin className="h-3.5 w-3.5 shrink-0 fill-primary/20 text-primary" />
        ) : active ? (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        ) : (
          <span className="h-1.5 w-1.5 shrink-0" />
        )}
        <span
          className={`min-w-0 flex-1 truncate text-[13px] leading-snug ${
            active ? "font-semibold text-primary" : "text-foreground/80"
          }`}
        >
          {conv.title}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-white/80 hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4} className="min-w-[112px] text-[12px]">
            <DropdownMenuItem
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(conv.id);
              }}
            >
              {conv.pinned ? (
                <>
                  <PinOff className="h-3 w-3" />
                  取消置顶
                </>
              ) : (
                <>
                  <Pin className="h-3 w-3" />
                  置顶
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onClick={(e) => {
                e.stopPropagation();
                const t = window.prompt("重命名会话", conv.title);
                if (t?.trim()) onRename(conv.id, t.trim());
              }}
            >
              <Pencil className="h-3 w-3" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}

function ChatSidebar({
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
}) {
  const [search, setSearch] = useState("");
  const [historyMenu, setHistoryMenu] = useState(false);
  const [panel, setPanel] = useState<SidebarPanel>("none");
  const [newQuestion, setNewQuestion] = useState("");
  const [sectionOpen, setSectionOpen] = useState(loadSectionOpen);

  useEffect(() => {
    localStorage.setItem(HISTORY_SECTIONS_KEY, JSON.stringify(sectionOpen));
  }, [sectionOpen]);

  const searching = search.trim().length > 0;

  const toggleSection = (key: HistorySectionKey) => {
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllSections = (open: boolean) => {
    setSectionOpen({ pinned: open, today: open, week: open, month: open });
  };

  const isSectionOpen = (key: HistorySectionKey, count: number) =>
    searching && count > 0 ? true : sectionOpen[key];

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return conversations;
    return conversations.filter((c) => c.title.includes(q));
  }, [conversations, search]);

  const pinnedList = useMemo(() => filtered.filter((c) => c.pinned), [filtered]);
  const grouped = useMemo(
    () => groupConversations(filtered.filter((c) => !c.pinned)),
    [filtered],
  );
  const favoriteDocs = useMemo(
    () => favoriteIds.map((id) => DOCS.find((d) => d.id === id)).filter(Boolean) as Doc[],
    [favoriteIds],
  );

  const closePanel = () => setPanel("none");

  const panelTitle =
    panel === "favorites" ? "我的收藏" : panel === "common" ? "常用问题" : panel === "settings" ? "问答设置" : "";

  return (
    <aside className="flex h-full w-[288px] shrink-0 flex-col border-r border-border bg-white">
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-[#2a8a9a] text-white shadow-sm">
            <Sparkles className="h-[18px] w-[18px]" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-foreground">智能对话</div>
            <div className="text-[11px] text-muted-foreground">知识问答与能力巩固助手</div>
          </div>
        </div>
      </div>

      <div className="space-y-2 px-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-between rounded-lg bg-primary-soft/90 px-4 py-2.5 transition-colors hover:bg-primary-soft"
        >
          <span className="inline-flex items-center gap-2 text-[13px] font-medium text-primary">
            <SquarePen className="h-4 w-4" />
            新对话
          </span>
          <kbd className="rounded-md border border-border/70 bg-white px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Ctrl K
          </kbd>
        </button>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索会话"
            className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-[13px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/15"
          />
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between px-4">
        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          历史记录
        </span>
        <button
          type="button"
          onClick={() => setHistoryMenu((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {historyMenu && (
          <div className="absolute right-3 top-8 z-20 min-w-[120px] rounded-lg border border-border bg-popover py-1 shadow-md">
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-muted"
              onClick={() => {
                setSearch("");
                setHistoryMenu(false);
                toast.success("已清空搜索");
              }}
            >
              清空搜索
            </button>
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-muted"
              onClick={() => {
                setAllSections(true);
                setHistoryMenu(false);
              }}
            >
              全部展开
            </button>
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-muted"
              onClick={() => {
                setAllSections(false);
                setHistoryMenu(false);
              }}
            >
              全部折叠
            </button>
            <button
              type="button"
              className="block w-full px-3 py-1.5 text-left text-[12px] hover:bg-muted"
              onClick={() => {
                setHistoryMenu(false);
                toast.message(`共 ${conversations.length} 条会话`);
              }}
            >
              会话统计
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 min-h-0 flex-1 overflow-hidden px-3 pb-2">
        {panel !== "none" ? (
          <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[13px] font-semibold text-foreground">{panelTitle}</span>
              <button
                type="button"
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
                      暂无收藏资料，可在回答中点击「收藏」或在资料检索页收藏。
                    </p>
                  ) : (
                    favoriteDocs.map((doc) => (
                      <div key={doc.id} className="rounded-lg border border-border bg-[#f8fbfc] p-3">
                        <div className="mb-1 text-[12px] font-semibold leading-snug">{doc.title}</div>
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">{doc.snippet}</p>
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
                      <div className="text-[11px] text-muted-foreground">回答中展示依据编号与原文面板</div>
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
                      <div className="text-[11px] text-muted-foreground">浏览历史消息时发送新问题自动定位最新内容</div>
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
            <HistorySection
              label="置顶"
              count={pinnedList.length}
              open={isSectionOpen("pinned", pinnedList.length)}
              onToggle={() => toggleSection("pinned")}
              leading={<Pin className="h-3 w-3 shrink-0 text-primary/70" />}
              hasActive={pinnedList.some((c) => c.id === activeId)}
            >
              {pinnedList.map((c) => (
                <ConvListItem
                  key={c.id}
                  conv={c}
                  active={c.id === activeId}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDelete={onDelete}
                  onTogglePin={onTogglePin}
                />
              ))}
            </HistorySection>
            {HISTORY_GROUPS.map(({ key, label }) => (
              <HistorySection
                key={key}
                label={label}
                count={grouped[key].length}
                open={isSectionOpen(key, grouped[key].length)}
                onToggle={() => toggleSection(key)}
                hasActive={grouped[key].some((c) => c.id === activeId)}
              >
                {grouped[key].map((c) => (
                  <ConvListItem
                    key={c.id}
                    conv={c}
                    active={c.id === activeId}
                    onSelect={onSelect}
                    onRename={onRename}
                    onDelete={onDelete}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </HistorySection>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-[12px] text-muted-foreground">未找到匹配会话</p>
            )}
          </div>
        )}
      </div>

      {/* <div className="border-t border-divider px-3 py-3">
        {[
          { icon: Bookmark, label: "我的收藏", key: "favorites" as const },
          { icon: List, label: "常用问题", key: "common" as const },
          { icon: Settings, label: "问答设置", key: "settings" as const },
        ].map(({ icon: Icon, label, key }) => (
          <button
            key={label}
            type="button"
            onClick={() => setPanel((p) => (p === key ? "none" : key))}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[12px] transition-colors ${
              panel === key
                ? "bg-primary-soft font-medium text-primary"
                : "text-muted-foreground hover:bg-[#f0f6f7] hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === "favorites" && favoriteDocs.length > 0 && (
              <span className="ml-auto rounded-md bg-muted px-1.5 text-[10px]">{favoriteDocs.length}</span>
            )}
          </button>
        ))}
      </div> */}
    </aside>
  );
}

// ─── Messages ────────────────────────────────────────────

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
    >
      <button
        type="button"
        onClick={onViewRight}
        className="mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-primary-soft px-1 text-[10px] font-semibold text-primary hover:bg-primary hover:text-white"
      >
        {n}
      </button>
      {hover && (
        <div className="absolute bottom-[calc(100%+6px)] left-1/2 z-50 w-72 -translate-x-1/2 rounded-lg border border-border bg-white p-3 shadow-lg">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[9px] font-medium text-primary">
              {citeLabel(citation, doc)}
            </span>
            <span className="truncate text-[10px] text-muted-foreground">{doc?.title}</span>
          </div>
          <p className="line-clamp-4 text-[11px] leading-relaxed text-foreground/85">「{citation.quote}」</p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewRight();
            }}
            className="mt-2 w-full rounded-lg bg-primary py-1.5 text-[11px] font-medium text-white hover:bg-primary/90"
          >
            在右侧查看原文
          </button>
          <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-border bg-white" />
        </div>
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
        <CiteRefButton
          key={i}
          n={n}
          citation={citation}
          onViewRight={() => onOpenCitation(idx)}
        />
      );
    }
    return <span key={i}>{p}</span>;
  });
}

function UserBubble({ text, time }: { text: string; time?: string }) {
  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[65%]">
        <div className="mb-1.5 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
          <span>{time ?? nowTime()}</span>
          <span className="font-medium text-foreground">张工</span>
        </div>
        <div className="rounded-lg rounded-tr-sm bg-[#0f9b8e] px-4 py-3 text-[14px] leading-relaxed text-white">
          {text}
        </div>
      </div>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0f9b8e] text-[13px] font-semibold text-white">
        张
      </div>
    </div>
  );
}

function AnswerBubble({
  card,
  msgId,
  time,
  showCiteTrace,
  onOpenCitation,
  onFollowUp,
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
  onFollowUp: (text: string) => void;
  onAddNote: () => void;
  onFavorite: () => void;
  onQuizAction: () => void;
  quizGenerating?: boolean;
  quizReady?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAllCites, setShowAllCites] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const [liked, setLiked] = useState<"up" | "down" | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const visibleCites = showAllCites ? card.citations : card.citations.slice(0, 3);
  const openCite = (index: number) => onOpenCitation(card.citations, index);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) setNeedsCollapse(el.scrollHeight > COLLAPSE_MAX);
  }, [card]);

  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="min-w-0 max-w-[min(860px,100%)] flex-1">
        <div className="mb-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">AI 学习助手</span>
          <span>{time ?? nowTime()}</span>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-white shadow-[0_1px_4px_rgba(52,155,172,0.06)]">
          <div className="relative">
            <div
              ref={bodyRef}
              className={`px-5 pt-5 ${!expanded && needsCollapse ? "max-h-[420px] overflow-hidden" : ""}`}
            >
              <div className="space-y-4 text-[14px] leading-[1.7]">
                <div>
                  <div className="mb-2 text-[14px] font-semibold text-foreground">回答摘要</div>
                  <p>{renderCites(card.summary, card.citations, openCite)}</p>
                </div>
                <div>
                  <div className="mb-2 text-[14px] font-semibold text-foreground">适用范围</div>
                  <p className="text-foreground/85">{card.scope}</p>
                </div>
                {card.uncertainty && (
                  <div className="rounded-lg border border-[#ffe4c4] bg-[#fff5e8] px-4 py-3">
                    <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-[#b45309]">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      注意事项
                    </div>
                    <p className="text-[13px] text-[#92400e]/90">{card.uncertainty}</p>
                  </div>
                )}
              </div>
            </div>
            {!expanded && needsCollapse && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>

          {needsCollapse && (
            <div className="border-t border-divider px-5 py-2">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-primary"
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
            <div className="border-t border-divider px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openCite(0)}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-foreground hover:text-primary"
                >
                  <BookOpen className="h-4 w-4 text-primary" />
                  本次回答依据
                </button>
                <button
                  type="button"
                  onClick={() => openCite(0)}
                  className="text-[12px] text-primary hover:underline"
                >
                  查看全部
                </button>
              </div>
              <div className="space-y-2">
                {visibleCites.map((c, i) => {
                  const doc = DOCS.find((d) => d.id === c.docId);
                  return (
                    <button
                      key={i}
                      type="button"
                      id={`${msgId}-cite-${i}`}
                      onClick={() => openCite(i)}
                      className="w-full rounded-lg border border-border bg-[#f8fbfc] p-3.5 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft/20"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary text-[11px] font-bold text-white">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-accent-foreground ring-1 ring-border">
                              {citeLabel(c, doc)}
                            </span>
                          </div>
                          <div className="text-[13px] font-semibold leading-snug">{doc?.title}</div>
                          <p className="mt-1 line-clamp-2 text-[12px] italic text-muted-foreground">「{c.quote}」</p>
                        </div>
                        <span className="shrink-0 text-[11px] font-medium text-primary">查看原文</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {card.citations.length > 3 && !showAllCites && (
                <button
                  type="button"
                  onClick={() => setShowAllCites(true)}
                  className="mt-2 text-[12px] font-medium text-primary hover:underline"
                >
                  展开更多依据
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-divider px-5 py-3">
            <button
              type="button"
              onClick={onAddNote}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] hover:border-primary/30 hover:bg-primary-soft/40"
            >
              加入笔记
            </button>
            <button
              type="button"
              onClick={onFavorite}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] hover:border-primary/30 hover:bg-primary-soft/40"
            >
              <Star className="h-3 w-3" />
              收藏
            </button>
            <button
              type="button"
              onClick={onQuizAction}
              disabled={quizGenerating}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] hover:border-primary/30 hover:bg-primary-soft/40 disabled:opacity-60"
            >
              <MessagesSquare className="h-3 w-3" />
              {quizGenerating ? "生成中…" : quizReady ? "查看题单" : "生成题单"}
            </button>
            {/* <button
              type="button"
              onClick={() => onFollowUp("基于上面的依据，继续说明：")}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[11.5px] hover:border-primary/30 hover:bg-primary-soft/40"
            >
              <MessageCircle className="h-3 w-3" />
              继续追问
            </button> */}
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setLiked("up");
                  toast.success("感谢反馈");
                }}
                className={`grid h-8 w-8 place-items-center rounded-md hover:bg-muted ${liked === "up" ? "text-primary" : "text-muted-foreground"}`}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLiked("down");
                  toast.message("已记录，将用于优化回答");
                }}
                className={`grid h-8 w-8 place-items-center rounded-md hover:bg-muted ${liked === "down" ? "text-remind" : "text-muted-foreground"}`}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(card.summary);
                  toast.success("已复制回答");
                }}
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
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
  commonQuestions,
  onChange,
  onSend,
  onAttach,
  onKbChange,
  onQuoteDoc,
  onCommonQuestion,
}: {
  input: string;
  loading: boolean;
  attachedFile: string | null;
  kbScope: string;
  commonQuestions: string[];
  onChange: (v: string) => void;
  onSend: () => void;
  onAttach: (name: string | null) => void;
  onKbChange: (scope: string) => void;
  onQuoteDoc: (title: string) => void;
  onCommonQuestion: (q: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showKb, setShowKb] = useState(false);
  const [showCommon, setShowCommon] = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  const toolBtn =
    "inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40";

  return (
    <div className="border-t border-divider bg-white/90 px-4 py-3 backdrop-blur-sm">
      {/* <p className="mb-2 text-[11px] text-muted-foreground">
        当前回答将基于已入库资料生成，并展示可追溯依据
      </p> */}
      <div className="rounded-lg border border-[#dce8ea] bg-white shadow-sm focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/10">
        {attachedFile && (
          <div className="flex items-center gap-2 border-b border-divider px-3 py-1.5 text-[11px] text-muted-foreground">
            <Paperclip className="h-3 w-3" />
            {attachedFile}
            <button type="button" onClick={() => onAttach(null)} className="text-primary hover:underline">
              移除
            </button>
          </div>
        )}
        <textarea
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          style={{ minHeight: 52, maxHeight: 140 }}
          placeholder="输入问题，Enter 发送，Shift + Enter 换行"
          className="block w-full resize-none border-0 bg-transparent px-4 pt-3.5 pb-1 text-[14px] leading-relaxed outline-none"
        />
        <div className="relative flex items-center justify-between gap-2 px-2 pb-2">
          <div className="flex flex-wrap items-center">
            <button type="button" disabled={loading} className={toolBtn} onClick={() => fileRef.current?.click()}>
              <Paperclip className="h-3.5 w-3.5" />
              上传资料
            </button>
            <button type="button" disabled={loading} className={toolBtn} onClick={() => setShowKb((v) => !v)}>
              <Database className="h-3.5 w-3.5" />
              选择知识库
            </button>
            <button type="button" disabled={loading} className={toolBtn} onClick={() => setShowQuote((v) => !v)}>
              <Quote className="h-3.5 w-3.5" />
              引用当前资料
            </button>
            <button type="button" disabled={loading} className={toolBtn} onClick={() => setShowCommon((v) => !v)}>
              <MessageCircle className="h-3.5 w-3.5" />
              常用问题
            </button>
          </div>
          <button
            type="button"
            disabled={loading || !input.trim()}
            onClick={onSend}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary/90 disabled:opacity-45"
          >
            <Send className="h-3.5 w-3.5" />
            发送
          </button>

          {showKb && (
            <div className="absolute bottom-10 left-2 z-10 w-48 rounded-lg border border-border bg-popover p-2 shadow-lg">
              {KB_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onKbChange(opt);
                    setShowKb(false);
                    toast.success(`知识库范围：${opt}`);
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-muted ${kbScope === opt ? "bg-primary-soft font-medium text-primary" : ""}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {showCommon && (
            <div className="absolute bottom-10 left-2 z-10 max-h-48 w-72 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg">
              {commonQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => {
                    onCommonQuestion(q);
                    setShowCommon(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
          {showQuote && (
            <div className="absolute bottom-10 left-2 z-10 max-h-48 w-80 overflow-y-auto rounded-lg border border-border bg-popover p-2 shadow-lg">
              {DOCS.slice(0, 8).map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onQuoteDoc(d.title);
                    setShowQuote(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-[12px] hover:bg-muted"
                >
                  <span className="mr-1.5 rounded bg-primary-soft px-1 py-0.5 text-[10px] text-primary">
                    {docTypeLabel(d)}
                  </span>
                  {d.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[10.5px] text-muted-foreground/80">
        AI 回答用于学习参考，关键结论请结合规程原文和现场要求判断
      </p>
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
  const { prefill } = Route.useSearch();
  const { state, addNote, toggleFavorite, removeFavorite, addQuizSet, getQuizSetByMsgId } = useMockStore();

  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [input, setInput] = useState(prefill ?? "");
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [kbScope, setKbScope] = useState<string>(() => readChatSettings().defaultKb);
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => readChatSettings());
  const [commonQuestions, setCommonQuestions] = useState<string[]>(() => readCommonQuestions());
  const [citationView, setCitationView] = useState<{
    citations: AnswerCitation[];
    index: number;
  }>({ citations: [], index: 0 });
  const [citationCollapsed, setCitationCollapsed] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [hasNewReply, setHasNewReply] = useState(false);
  const [quizDialog, setQuizDialog] = useState<{ open: boolean; msgId: string | null }>({
    open: false,
    msgId: null,
  });
  const [generatingMsgIds, setGeneratingMsgIds] = useState<Set<string>>(() => new Set());
  const genTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);

  const conv = conversations.find((c) => c.id === activeId) ?? conversations[0];

  const openCitation = useCallback((citations: AnswerCitation[], index: number) => {
    setCitationView({ citations, index });
    setCitationCollapsed(false);
  }, []);

  const openDocCitation = useCallback((docId: string) => {
    const doc = DOCS.find((d) => d.id === docId);
    if (!doc) return;
    openCitation([docToCitation(doc)], 0);
  }, [openCitation]);

  const handleSettingsChange = useCallback((s: ChatSettings) => {
    setChatSettings(s);
    writeChatSettings(s);
    setKbScope(s.defaultKb);
  }, []);

  const handleCommonQuestionsChange = useCallback((qs: string[]) => {
    setCommonQuestions(qs);
    writeCommonQuestions(qs);
  }, []);

  useEffect(() => {
    const last = [...conv.messages].reverse().find((m) => m.role === "assistant");
    if (last && last.role === "assistant" && last.card.citations.length > 0) {
      setCitationView((prev) => {
        if (prev.citations === last.card.citations) return prev;
        return { citations: last.card.citations, index: 0 };
      });
    } else if (conv.messages.length === 0) {
      setCitationView({ citations: [], index: 0 });
    }
  }, [conv.messages.length, activeId]);

  const scrollToBottom = useCallback((smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setHasNewReply(false);
    nearBottomRef.current = true;
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
    requestAnimationFrame(() => {
      scrollToBottom(false);
      handleScroll();
    });
  }, [activeId, scrollToBottom, handleScroll]);

  const send = (val?: string) => {
    const text = (val ?? input).trim();
    if (!text || loading) return;
    const t = nowTime();
    setInput("");
    setLoading(true);
    if (chatSettings.autoScrollOnSend) {
      nearBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom(false));
    }
    setConversations((cs) =>
      cs.map((c) => {
        if (c.id !== activeId) return c;
        const title = c.title === "新对话" ? text.slice(0, 28) : c.title;
        return {
          ...c,
          title,
          updatedAt: "刚刚",
          messages: [...c.messages, { role: "user", text, time: t }],
        };
      }),
    );
    setTimeout(() => {
      setConversations((cs) =>
        cs.map((c) =>
          c.id === activeId ? { ...c, messages: [...c.messages, buildMockAnswer(text)] } : c,
        ),
      );
      setLoading(false);
      setAttachedFile(null);
      if (chatSettings.autoScrollOnSend) {
        requestAnimationFrame(() => scrollToBottom());
      }
    }, 1200);
  };

  const newConv = () => {
    const id = `c${Date.now()}`;
    setConversations((cs) => [{ id, title: "新对话", updatedAt: "刚刚", messages: [] }, ...cs]);
    setActiveId(id);
  };

  const deleteConv = (id: string) => {
    setConversations((cs) => {
      const next = cs.filter((c) => c.id !== id);
      if (activeId === id && next.length > 0) setActiveId(next[0].id);
      if (next.length === 0) newConv();
      return next.length ? next : [{ id: `c${Date.now()}`, title: "新对话", updatedAt: "刚刚", messages: [] }];
    });
    toast.success("会话已删除");
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
  }, []);

  const handleAddNote = (card: AnswerCard) => {
    const firstDoc = card.citations[0] ? DOCS.find((d) => d.id === card.citations[0].docId) : undefined;
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
    ? state.quizSets.find((q) => q.relatedMsgId === quizDialog.msgId) ?? null
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
    return () => {
      genTimersRef.current.forEach((t) => clearTimeout(t));
      genTimersRef.current.clear();
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

  return (
    <PageShell compact>
      <div className="flex h-full overflow-hidden rounded-lg border border-border bg-[#f6fafb]">
        <div className="hidden h-full min-h-0 lg:block">
          <ChatSidebar
            conversations={conversations}
            activeId={activeId}
            favoriteIds={state.favorites}
            commonQuestions={commonQuestions}
            settings={chatSettings}
            onSelect={setActiveId}
            onNew={newConv}
            onDelete={deleteConv}
            onRename={renameConv}
            onTogglePin={togglePinConv}
            onSendQuestion={send}
            onFillInput={setInput}
            onQuoteDoc={(title) =>
              setInput((v) => (v ? `${v}\n引用：${title}` : `请结合《${title}》回答：`))
            }
            onOpenDocCitation={openDocCitation}
            onSettingsChange={handleSettingsChange}
            onCommonQuestionsChange={handleCommonQuestionsChange}
            onRemoveFavorite={removeFavorite}
          />
        </div>

        <div className="relative flex min-h-0 min-w-0 flex-1">
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-4 py-4"
          >
            <div className="mx-auto max-w-[960px] space-y-6">
              {conv.messages.length === 0 && (
                <div className="py-10 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-primary-soft text-primary">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h2 className="mt-4 text-[17px] font-semibold">开始一次知识问答</h2>
                  <p className="mx-auto mt-2 max-w-md text-[13px] text-muted-foreground">
                    你可以询问规程条款、典型操作、故障处置、题库知识点或场景复盘
                  </p>
                  <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                    {commonQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => send(q)}
                        className="rounded-lg border border-border bg-white px-4 py-3 text-left text-[12.5px] hover:border-primary/35 hover:bg-primary-soft/30"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {conv.messages.map((m, i) => {
                if (m.role === "user") {
                  return <UserBubble key={i} text={m.text} time={m.time} />;
                }
                const msgId = `msg-${activeId}-${i}`;
                const quizSet = state.quizSets.find((q) => q.relatedMsgId === msgId);
                return (
                  <AnswerBubble
                    key={i}
                    msgId={msgId}
                    card={m.card}
                    time={m.time}
                    showCiteTrace={chatSettings.citeTrace}
                    onOpenCitation={openCitation}
                    onFollowUp={setInput}
                    onAddNote={() => handleAddNote(m.card)}
                    onFavorite={() => handleFavorite(m.card)}
                    quizReady={!!quizSet}
                    quizGenerating={generatingMsgIds.has(msgId)}
                    onQuizAction={() => handleQuizAction(msgId, m.card, findUserQuestionForMsg(i))}
                  />
                );
              })}

              {loading && (
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  <span className="text-[13px] text-muted-foreground">正在检索知识库并组织答案…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {showScrollBtn && (
            <button
              type="button"
              onClick={() => scrollToBottom()}
              title={hasNewReply ? "有新回复" : "回到底部"}
              className="absolute bottom-32 right-6 z-10 grid h-10 w-10 place-items-center rounded-full bg-primary text-white shadow-lg transition-transform hover:scale-105 hover:bg-primary/90"
            >
              <ArrowDown className="h-4 w-4" />
              {hasNewReply && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-remind" />
              )}
            </button>
          )}

          <div className="shrink-0">
            <ChatComposer
              input={input}
              loading={loading}
              attachedFile={attachedFile}
              kbScope={kbScope}
              onChange={setInput}
              onSend={() => send()}
              onAttach={setAttachedFile}
              onKbChange={setKbScope}
              onQuoteDoc={(title) => setInput((v) => (v ? `${v}\n引用：${title}` : `请结合《${title}》回答：`))}
              onCommonQuestion={(q) => setInput(q)}
              commonQuestions={commonQuestions}
            />
          </div>
        </div>

          {!citationCollapsed && (
            <CitationPanel
              citations={citationView.citations}
              activeIndex={citationView.index}
              onChangeIndex={(index) => setCitationView((v) => ({ ...v, index }))}
            />
          )}

          <div className="absolute right-4 top-3 z-30 hidden xl:block">
            <CitationToggleBar
              collapsed={citationCollapsed}
              citationsCount={citationView.citations.length}
              activeIndex={citationView.index}
              onToggle={() => setCitationCollapsed((v) => !v)}
            />
          </div>
        </div>
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
