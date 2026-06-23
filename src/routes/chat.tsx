import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  BookOpen,
  Star,
  Plus,
  MessagesSquare,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import { DocDrawer } from "@/components/common/DocDrawer";
import {
  CONVERSATIONS,
  DOCS,
  type ChatMsg,
  type Conversation,
  type Doc,
} from "@/lib/mock/data";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ prefill: z.string().optional() });

export const Route = createFileRoute("/chat")({
  validateSearch: searchSchema,
  component: ChatPage,
  head: () => ({ meta: [{ title: "智能问答 · 涉网运行 AI 训练平台" }] }),
});

const RECOMMENDED = [
  "AGC 考核依据哪些规程?",
  "主变停役前要核对哪些状态?",
  "差动保护动作后复盘应关注什么?",
  "两细则考核常见知识点有哪些?",
];

function buildMockAnswer(question: string): ChatMsg {
  // simple keyword routing
  const lower = question;
  if (lower.includes("AGC") || lower.includes("agc") || lower.includes("两细则")) {
    return {
      role: "assistant",
      card: {
        summary:
          "AGC 考核以「两细则」为主要依据,核心三项指标包括调节速率、调节精度与响应时间 [1]。厂站侧执行可参考本站 AGC 控制器配置说明 [2]。",
        citations: [
          { docId: "d1", section: "二、AGC 考核三项指标", quote: "调节速率、调节精度、响应时间..." },
          { docId: "d6", section: "1 死区参数", quote: "推荐 ≤1MW,过大会导致考核分降低。" },
        ],
        scope: "适用范围:并网发电厂运行值班、技术管理岗位。",
        uncertainty: "各区域细则版本差异,请以本区域最新发布版本为准。",
      },
    };
  }
  if (lower.includes("主变") || lower.includes("停役")) {
    return {
      role: "assistant",
      card: {
        summary:
          "建议核对:① 负荷转移情况;② 保护连接片位置 [1];③ 中性点接地刀闸状态;④ 调度命令与操作票一致性。培训复习可关注厂站接线差异。",
        citations: [
          { docId: "d2", section: "1 前置核对", quote: "核对项包括:主变负荷转移情况、相关保护连接片位置..." },
        ],
        scope: "适用设备:220kV/500kV 主变;场景:计划停役。",
        uncertainty: "厂站接线方式差异较大,具体仍以本厂站接线图为准。",
      },
    };
  }
  if (lower.includes("差动") || lower.includes("保护")) {
    return {
      role: "assistant",
      card: {
        summary:
          "差动保护动作后建议按 TA 极性 → 二次回路 → 定值 → 一次设备四步法核查 [1],并参照同类历史案例 [2] 排查二次回路绝缘隐患。",
        citations: [
          { docId: "d10", section: "1 四步法核查", quote: "TA 极性 → 二次回路 → 定值 → 一次设备。" },
          { docId: "d3", section: "2 原因分析", quote: "二次回路绝缘破损,差动平衡被破坏。" },
        ],
        scope: "适用范围:涉及差动原理的母差、线路差动、变压器差动保护复盘培训。",
      },
    };
  }
  return {
    role: "assistant",
    card: {
      summary: "当前知识库未检索到足够依据,建议查阅厂站运行规程或联系培训管理员。",
      citations: [],
      scope: "—",
      uncertainty: "本问题缺少明确资料命中,回答仅供参考方向。",
    },
  };
}

function ChatPage() {
  const { prefill } = Route.useSearch();
  const [conversations, setConversations] = useState<Conversation[]>(CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(CONVERSATIONS[0].id);
  const [input, setInput] = useState(prefill ?? "");
  const [loading, setLoading] = useState(false);
  const [drawer, setDrawer] = useState<Doc | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conv = conversations.find((c) => c.id === activeId) ?? conversations[0];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.messages.length, loading]);

  useEffect(() => {
    if (prefill) setInput(prefill);
  }, [prefill]);

  const send = (val?: string) => {
    const text = (val ?? input).trim();
    if (!text || loading) return;
    setInput("");
    setLoading(true);
    setConversations((cs) =>
      cs.map((c) =>
        c.id === activeId ? { ...c, messages: [...c.messages, { role: "user", text }] } : c,
      ),
    );
    setTimeout(() => {
      setConversations((cs) =>
        cs.map((c) =>
          c.id === activeId ? { ...c, messages: [...c.messages, buildMockAnswer(text)] } : c,
        ),
      );
      setLoading(false);
    }, 1400);
  };

  const newConv = () => {
    const id = `c${Date.now()}`;
    const c: Conversation = { id, title: "新会话", updatedAt: "刚刚", messages: [] };
    setConversations((cs) => [c, ...cs]);
    setActiveId(id);
  };

  return (
    <PageShell>
      <div className="grid h-[calc(100vh-9rem)] grid-cols-12 gap-4">
        {/* Left: history */}
        <aside className="col-span-2 hidden flex-col rounded-lg border border-border bg-card p-3 lg:flex">
          <button
            onClick={newConv}
            className="mb-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> 新建会话
          </button>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
            会话历史
          </div>
          <div className="mt-2 space-y-1 overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-[12.5px] transition-colors ${
                  c.id === activeId
                    ? "bg-primary-soft text-accent-foreground"
                    : "text-foreground/80 hover:bg-muted"
                }`}
              >
                <div className="truncate font-medium">{c.title}</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground">{c.updatedAt}</div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main */}
        <section className="col-span-12 flex flex-col rounded-lg border border-border bg-card lg:col-span-7">
          <div className="border-b border-border px-6 py-4">
            <h1 className="text-[18px] font-semibold tracking-tight">智能问答</h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              基于内部知识库回答,所有结论可溯源到原文片段
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {conv.messages.length === 0 && (
              <div className="grid place-items-center py-12 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="mt-3 text-[15px] font-medium">向智能助手提问</div>
                <p className="mt-1 max-w-md text-[12.5px] text-muted-foreground">
                  仅基于已收录的规程、SOP、案例与厂站资料作答
                </p>
                <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
                  {RECOMMENDED.map((r) => (
                    <button
                      key={r}
                      onClick={() => send(r)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-[12px] text-foreground hover:border-primary hover:text-primary"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="mt-6 w-full max-w-xl">
                  <SafetyBanner compact />
                </div>
              </div>
            )}

            {conv.messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg rounded-br-md bg-primary px-4 py-2.5 text-[13.5px] text-primary-foreground">
                    {m.text}
                  </div>
                </div>
              ) : (
                <AnswerCardView key={i} card={m.card} onCite={(id) => {
                  const d = DOCS.find((x) => x.id === id);
                  if (d) setDrawer(d);
                }} />
              ),
            )}

            {loading && (
              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary" />
                正在检索知识库并组织答案…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border px-6 py-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="输入问题,Enter 发送,Shift+Enter 换行"
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] outline-none focus:border-primary"
              />
              <button
                disabled={loading}
                onClick={() => send()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-3 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> 发送
              </button>
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              · 仅基于知识库回答 · 不构成调度指令或操作命令 · 结果仅供培训学习参考
            </div>
          </div>
        </section>

        {/* Right: citations */}
        <aside className="col-span-3 hidden flex-col rounded-lg border border-border bg-card p-4 xl:flex">
          <div className="text-[12px] font-medium text-foreground">本次回答依据</div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">点击依据查看原文片段</p>
          <div className="mt-3 space-y-2 overflow-y-auto">
            {(() => {
              const last = [...conv.messages].reverse().find((m) => m.role === "assistant");
              if (!last || last.role !== "assistant") {
                return (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-[11.5px] text-muted-foreground">
                    暂无依据,开始提问后会展示引用
                  </div>
                );
              }
              return last.card.citations.map((c, i) => {
                const doc = DOCS.find((d) => d.id === c.docId);
                return (
                  <button
                    key={i}
                    onClick={() => doc && setDrawer(doc)}
                    className="w-full rounded-lg border border-border bg-background p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-primary">
                      <BookOpen className="h-3 w-3" /> 依据 [{i + 1}]
                    </div>
                    <div className="mt-1 text-[12.5px] font-medium text-foreground">{doc?.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{c.section}</div>
                    <div className="mt-1.5 text-[11.5px] italic text-foreground/70">「{c.quote}」</div>
                  </button>
                );
              });
            })()}
          </div>
        </aside>
      </div>

      <DocDrawer doc={drawer} onClose={() => setDrawer(null)} />
    </PageShell>
  );
}

function AnswerCardView({
  card,
  onCite,
}: {
  card: import("@/lib/mock/data").AnswerCard;
  onCite: (docId: string) => void;
}) {
  const renderSummary = (txt: string) => {
    // Render [n] citations as buttons
    const parts = txt.split(/(\[\d+\])/);
    return parts.map((p, i) => {
      const m = p.match(/^\[(\d+)\]$/);
      if (m) {
        const n = parseInt(m[1], 10) - 1;
        const c = card.citations[n];
        return (
          <button
            key={i}
            onClick={() => c && onCite(c.docId)}
            className="mx-0.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded bg-primary-soft px-1 align-baseline text-[10px] font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground"
          >
            {m[1]}
          </button>
        );
      }
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <div className="rounded-lg border border-border bg-background shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-[11px] font-medium text-primary">
          <Sparkles className="h-3 w-3" /> AI 助手回答
        </div>
      </div>
      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            回答摘要
          </div>
          <p className="text-[13.5px] leading-relaxed text-foreground">{renderSummary(card.summary)}</p>
        </div>

        {card.citations.length > 0 && (
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              依据引用 ({card.citations.length})
            </div>
            <div className="space-y-2">
              {card.citations.map((c, i) => {
                const doc = DOCS.find((d) => d.id === c.docId);
                return (
                  <button
                    key={i}
                    onClick={() => onCite(c.docId)}
                    className="block w-full rounded-lg border border-border bg-muted/30 p-3 text-left transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-4 w-4 place-items-center rounded bg-primary text-[10px] font-medium text-primary-foreground">
                        {i + 1}
                      </span>
                      <span className="truncate text-[12.5px] font-medium text-foreground">
                        {doc?.title}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{c.section}</div>
                    <div className="mt-1 text-[12px] italic text-foreground/70">「{c.quote}」</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            适用范围
          </div>
          <p className="text-[12.5px] text-foreground/80">{card.scope}</p>
        </div>

        {card.uncertainty && (
          <div className="rounded-lg border border-warning/30 bg-warning-soft/50 p-3">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-warning-foreground">
              <AlertTriangle className="h-3 w-3" /> 不确定项
            </div>
            <p className="text-[12px] text-warning-foreground/90">{card.uncertainty}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <button
            onClick={() => toast.success("已加入笔记")}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] hover:bg-muted"
          >
            加入笔记
          </button>
          <button
            onClick={() => toast.success("已收藏")}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] hover:bg-muted"
          >
            <Star className="h-3 w-3" /> 收藏
          </button>
          <Link
            to="/training"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] hover:bg-muted"
          >
            <MessagesSquare className="h-3 w-3" /> 生成训练题
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => toast.success("感谢反馈")}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => toast.error("已记录,问题将进入复盘队列")}
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
