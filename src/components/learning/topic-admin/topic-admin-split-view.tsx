import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Eye,
  Layers,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DOCS } from "@/lib/mock/data";
import {
  TOPIC_ADMIN_RECORDS,
  getTopicQuestionCount,
  type TopicAdminRecord,
  type TopicPublishStatus,
} from "@/lib/mock/topicAdmin";
import { listActionClass } from "@/components/learning/ui";

type TopicAdminSplitViewProps = {
  onNew: () => void;
  onEdit: (record: TopicAdminRecord) => void;
  onPreview: (record: TopicAdminRecord) => void;
};

const STATUS_FILTERS: { value: "all" | TopicPublishStatus; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "已发布", label: "已发布" },
  { value: "草稿", label: "草稿" },
  { value: "已下架", label: "已下架" },
];

function statusTagClass(status: TopicPublishStatus) {
  switch (status) {
    case "已发布":
      return "bg-primary-soft text-primary";
    case "已下架":
      return "bg-muted text-muted-foreground";
    case "草稿":
    default:
      return "bg-warning-soft text-warning-foreground";
  }
}

export function TopicAdminSplitView({ onNew, onEdit, onPreview }: TopicAdminSplitViewProps) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TopicPublishStatus>("all");
  const [selectedId, setSelectedId] = useState(TOPIC_ADMIN_RECORDS[0]?.id ?? "");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return TOPIC_ADMIN_RECORDS.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (!kw) return true;
      return [t.title, t.specialty, t.scenario, t.maintainer, ...t.positions].some((f) =>
        f.toLowerCase().includes(kw),
      );
    });
  }, [keyword, statusFilter]);

  const selected = filtered.find((t) => t.id === selectedId) ?? filtered[0];
  const questionCount = selected ? getTopicQuestionCount(selected) : 0;

  return (
    <div className="flex h-[calc(100vh-260px)] min-h-[520px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索专题名称、专业、场景…"
            className="h-8 pl-8 text-[12px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "rounded-[3px] px-2.5 py-1 text-[11.5px] transition-colors",
                statusFilter === f.value
                  ? "bg-primary font-medium text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12.5px] hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> 新建专题
        </button>
        {/* 本期暂不开放：AI 辅助创建
        <Link
          to="/learn-admin/topic/new"
          search={{ source: "ai" }}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-3.5 w-3.5" /> AI 辅助创建
        </Link>
        */}
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(300px,360px)_1fr]">
        {/* 左侧列表 */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-divider px-4 py-2.5 text-[13px] font-semibold text-foreground">
            专题列表（{filtered.length}）
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                暂无匹配的专题
              </div>
            ) : (
              filtered.map((t) => {
                const active = selected?.id === t.id;
                const qCount = getTopicQuestionCount(t);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full border-b border-divider py-4 pr-4 text-left transition-colors",
                      "border-l-4",
                      active
                        ? "border-l-primary bg-primary-soft/30 pl-3"
                        : "border-l-transparent pl-4 hover:bg-muted/40",
                    )}
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-[13.5px] font-medium leading-snug text-foreground">
                        {t.title}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          statusTagClass(t.status),
                        )}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      <span>{t.specialty}</span>
                      <span>·</span>
                      <span>{t.docIds.length} 份资料</span>
                      <span>·</span>
                      <span>{qCount} 题</span>
                    </div>
                    <div className="mt-1.5 text-[10.5px] text-muted-foreground/80">
                      更新 {t.updatedAt}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧详情 */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
          {selected ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-divider px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10.5px] font-medium",
                        statusTagClass(selected.status),
                      )}
                    >
                      {selected.status}
                    </span>
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">
                      {selected.specialty}
                    </span>
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">
                      {selected.scenario}
                    </span>
                  </div>
                  <h2 className="text-[18px] font-semibold text-foreground">{selected.title}</h2>
                  <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{selected.intro}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(selected)}
                    className={listActionClass("outline")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreview(selected)}
                    className={listActionClass("outline")}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    预览
                  </button>
                  {selected.status === "草稿" && (
                    <button type="button" className={listActionClass("primary")}>
                      <Send className="h-3.5 w-3.5" />
                      发布
                    </button>
                  )}
                  {selected.status === "已发布" && (
                    <button type="button" className={listActionClass("outline")}>
                      <Archive className="h-3.5 w-3.5" />
                      下架
                    </button>
                  )}
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-divider px-5 py-3 sm:grid-cols-4">
                <DetailStat icon={BookOpen} label="资料" value={`${selected.docIds.length} 份`} />
                <DetailStat icon={ClipboardList} label="题目" value={`${questionCount} 题`} />
                <DetailStat icon={Layers} label="知识点" value={`${selected.knowledgePoints.length} 条`} />
                <DetailStat icon={Users} label="在学" value={`${selected.learnerCount} 人`} />
              </div>

              {selected.aiHints && selected.aiHints.length > 0 && (
                <div className="mx-5 mt-4 rounded-lg border border-warning/25 bg-warning-soft/40 px-4 py-3">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[12px] font-medium text-warning-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    AI 维护建议
                  </div>
                  <ul className="space-y-1 text-[12px] text-muted-foreground">
                    {selected.aiHints.map((hint) => (
                      <li key={hint} className="flex items-start gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warning" />
                        {hint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
                <section className="mb-5">
                  <h3 className="mb-2 text-[14px] font-semibold text-foreground">学习目标</h3>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {selected.learningGoal || "尚未填写"}
                  </p>
                </section>

                <section className="mb-5">
                  <h3 className="mb-2 text-[14px] font-semibold text-foreground">适用岗位</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.positions.map((p) => (
                      <span
                        key={p}
                        className="rounded-md border border-border bg-muted/30 px-2 py-0.5 text-[11.5px] text-foreground"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="mb-5">
                  <h3 className="mb-2 text-[14px] font-semibold text-foreground">资料清单</h3>
                  {selected.docIds.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">尚未选择资料</p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.docIds.map((docId) => {
                        const doc = DOCS.find((d) => d.id === docId);
                        const dq = selected.docQuestions.find((d) => d.docId === docId);
                        return (
                          <li
                            key={docId}
                            className="flex items-center justify-between gap-3 rounded-lg border border-divider bg-muted/20 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-foreground">
                                {doc?.title ?? docId}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {doc?.docType} · {dq?.questionIds.length ?? 0} 道关联题
                                {dq?.confirmed ? " · 已确认" : dq?.generated ? " · 待确认" : ""}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                <section>
                  <h3 className="mb-2 text-[14px] font-semibold text-foreground">知识点</h3>
                  {selected.knowledgePoints.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground">尚未维护知识点</p>
                  ) : (
                    <ul className="space-y-2">
                      {selected.knowledgePoints.map((kp) => (
                        <li
                          key={kp.id}
                          className="rounded-lg border border-divider px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-medium text-foreground">{kp.title}</span>
                            {kp.source === "ai" && (
                              <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[10px] text-primary">
                                AI
                              </span>
                            )}
                            {kp.confirmed && (
                              <span className="text-[10px] text-success">已确认</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">{kp.summary}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              <div className="flex items-center justify-between border-t border-divider px-5 py-3 text-[12px] text-muted-foreground">
                <span>维护人 {selected.maintainer}</span>
                {selected.status === "已发布" && (
                  <Link
                    to="/learn/topic/$id"
                    params={{ id: selected.id }}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    查看员工端专题 <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-[13px] text-muted-foreground">
              请选择左侧专题查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-divider bg-muted/20 px-3 py-2">
      <div className="mb-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-[15px] font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
