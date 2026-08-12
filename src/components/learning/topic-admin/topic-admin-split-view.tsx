import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Archive,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardCheck,
  Eye,
  FileText,
  Layers3,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DOCS } from "@/lib/mock/data";
import {
  TOPIC_ADMIN_RECORDS,
  getTopicQuestionCount,
  type TopicAdminRecord,
  type TopicPublishStatus,
} from "@/lib/mock/topicAdmin";
import { cn } from "@/lib/utils";

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
  if (status === "已发布") return "bg-success-soft text-success";
  if (status === "草稿") return "bg-remind-soft text-remind-foreground";
  return "bg-kb-surface text-kb-muted";
}

function getReleaseReadiness(record: TopicAdminRecord) {
  const questionCount = getTopicQuestionCount(record);
  const materialsReady = record.docIds.length > 0;
  const knowledgeReady =
    record.knowledgePoints.length > 0 && record.knowledgePoints.every((item) => item.confirmed);
  const exercisesReady =
    questionCount > 0 &&
    record.docQuestions
      .filter((item) => item.questionIds.length > 0)
      .every((item) => item.confirmed);
  const completed = [true, materialsReady, knowledgeReady, exercisesReady].filter(Boolean).length;

  return {
    questionCount,
    materialsReady,
    knowledgeReady,
    exercisesReady,
    completed,
    ready: materialsReady && knowledgeReady && exercisesReady,
  };
}

export function TopicAdminSplitView({ onNew, onEdit, onPreview }: TopicAdminSplitViewProps) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TopicPublishStatus>("all");
  const [selectedId, setSelectedId] = useState(TOPIC_ADMIN_RECORDS[0]?.id ?? "");

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return TOPIC_ADMIN_RECORDS.filter((topic) => {
      if (statusFilter !== "all" && topic.status !== statusFilter) return false;
      if (!normalized) return true;
      return [
        topic.title,
        topic.specialty,
        topic.scenario,
        topic.maintainer,
        ...topic.positions,
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [keyword, statusFilter]);

  const selected = filtered.find((topic) => topic.id === selectedId) ?? filtered[0];

  return (
    <div className="grid min-h-[720px] overflow-hidden rounded-[16px] border border-kb-border bg-white shadow-[0_12px_38px_rgba(28,67,75,0.055)] xl:h-full xl:min-h-0 xl:grid-cols-[336px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-kb-border bg-[linear-gradient(180deg,rgba(241,248,249,0.88),rgba(255,255,255,0.98)_34%)] xl:border-b-0 xl:border-r">
        <div className="border-b border-kb-border px-4 pb-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-kb-heading">专题库</h2>
              <p className="mt-0.5 text-[11px] text-kb-muted">
                {TOPIC_ADMIN_RECORDS.length} 个专题 · 最近更新优先
              </p>
            </div>
            <button
              type="button"
              onClick={onNew}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-[9px] border border-primary/25 bg-white px-3 text-[12px] font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Plus className="h-3.5 w-3.5" /> 新建
            </button>
          </div>

          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索名称、专业或维护人"
              className="h-10 rounded-[9px] border-kb-border bg-white pl-9 text-[12.5px] shadow-none"
            />
          </label>

          <div className="mt-2.5 flex gap-1 overflow-x-auto" aria-label="专题状态筛选">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setStatusFilter(item.value)}
                className={cn(
                  "min-h-8 shrink-0 rounded-full px-3 text-[11.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  statusFilter === item.value
                    ? "bg-primary text-white"
                    : "bg-white text-kb-muted hover:bg-kb-surface hover:text-kb-heading",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 xl:h-auto xl:overflow-y-auto">
          {filtered.length ? (
            filtered.map((topic) => {
              const active = selected?.id === topic.id;
              const questionCount = getTopicQuestionCount(topic);
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedId(topic.id)}
                  className={cn(
                    "group relative w-full border-b border-divider px-4 py-4 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30",
                    active ? "bg-white" : "hover:bg-white/70",
                  )}
                >
                  {active && (
                    <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-primary" />
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <span className="line-clamp-2 text-[13.5px] font-semibold leading-5 text-kb-heading">
                      {topic.title}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 text-[10px] font-medium",
                        statusTagClass(topic.status),
                      )}
                    >
                      {topic.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-kb-muted">
                    <span>{topic.specialty}</span>
                    <span className="h-3 w-px bg-kb-border" />
                    <span>{topic.docIds.length} 份资料</span>
                    <span className="h-3 w-px bg-kb-border" />
                    <span>{questionCount} 道练习</span>
                  </div>
                  <div className="mt-2 text-[10.5px] text-kb-muted">
                    {topic.maintainer} · 更新于 {topic.updatedAt}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="grid min-h-52 place-items-center px-6 text-center">
              <div>
                <Search className="mx-auto h-5 w-5 text-kb-muted" />
                <p className="mt-2 text-[12.5px] text-kb-muted">没有匹配的专题</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="min-w-0 xl:min-h-0 xl:overflow-y-auto">
        {selected ? (
          <TopicWorkspace record={selected} onEdit={onEdit} onPreview={onPreview} />
        ) : (
          <div className="grid min-h-[560px] place-items-center text-[13px] text-kb-muted">
            请选择专题查看内容
          </div>
        )}
      </main>
    </div>
  );
}

function TopicWorkspace({
  record,
  onEdit,
  onPreview,
}: {
  record: TopicAdminRecord;
  onEdit: (record: TopicAdminRecord) => void;
  onPreview: (record: TopicAdminRecord) => void;
}) {
  const release = getReleaseReadiness(record);

  const publish = () => {
    if (!release.ready) return;
    toast.success(`《${record.title}》已提交发布`);
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="relative overflow-hidden border-b border-kb-border px-5 py-5 sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full border-[30px] border-primary/[0.035]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-md px-2 py-1 text-[10.5px] font-medium",
                  statusTagClass(record.status),
                )}
              >
                {record.status}
              </span>
              <span className="text-[11.5px] text-kb-muted">{record.specialty}</span>
              <span className="text-[11.5px] text-kb-muted">·</span>
              <span className="text-[11.5px] text-kb-muted">{record.scenario}</span>
            </div>
            <h2 className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-kb-heading sm:text-[24px]">
              {record.title}
            </h2>
            <p className="mt-1.5 max-w-4xl text-[12.5px] leading-5 text-kb-muted">{record.intro}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPreview(record)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[9px] border border-kb-border bg-white px-3 text-[12px] font-medium text-kb-body hover:bg-kb-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Eye className="h-4 w-4" /> 预览
            </button>
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[9px] bg-primary px-3.5 text-[12px] font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <Pencil className="h-4 w-4" /> 编辑专题
            </button>
            {record.status === "已发布" && (
              <button
                type="button"
                onClick={() => toast.message("专题下架前将再次确认影响范围")}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[9px] px-2.5 text-[12px] text-kb-muted hover:bg-kb-surface"
              >
                <Archive className="h-4 w-4" /> 下架
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="border-b border-kb-border px-5 py-4 sm:px-6" aria-label="专题发布流程">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[13px] font-semibold text-kb-heading">发布准备</h3>
            <p className="mt-0.5 text-[11px] text-kb-muted">
              基础信息确定后，依次完成内容编排与核对
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[10.5px] font-medium",
              release.ready
                ? "bg-success-soft text-success"
                : "bg-remind-soft text-remind-foreground",
            )}
          >
            {release.ready ? "发布条件完整" : `${release.completed}/4 项已完成`}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
          <ReadinessStep index="01" label="基本信息" detail="目标与适用范围" ready />
          <ReadinessStep
            index="02"
            label="学习资料"
            detail={`${record.docIds.length} 份已选`}
            ready={release.materialsReady}
          />
          <ReadinessStep
            index="03"
            label="知识点"
            detail={`${record.knowledgePoints.filter((item) => item.confirmed).length} 条已确认`}
            ready={release.knowledgeReady}
          />
          <ReadinessStep
            index="04"
            label="关联练习"
            detail={`${release.questionCount} 道题`}
            ready={release.exercisesReady}
          />
        </div>
      </section>

      <div className="grid flex-1 gap-5 p-5 sm:p-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-semibold text-kb-heading">内容编排</h3>
              <p className="mt-1 text-[11.5px] text-kb-muted">
                维护学习内容之间的来源、提炼与练习关系。
              </p>
            </div>
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="min-h-9 rounded-[8px] px-2.5 text-[12px] font-medium text-primary hover:bg-primary-soft"
            >
              调整全部内容
            </button>
          </div>

          <div className="space-y-3">
            <AssemblyStage
              number="01"
              icon={BookOpen}
              title="学习资料"
              description="确定专题的可信内容来源"
              count={`${record.docIds.length} 份`}
              ready={release.materialsReady}
              action="管理资料"
              onAction={() => onEdit(record)}
            >
              {record.docIds.length ? (
                <div className="divide-y divide-divider overflow-hidden rounded-[10px] border border-kb-border">
                  {record.docIds.slice(0, 3).map((docId) => {
                    const doc = DOCS.find((item) => item.id === docId);
                    const related = record.docQuestions.find((item) => item.docId === docId);
                    return (
                      <div
                        key={docId}
                        className="flex min-h-[58px] items-center gap-3 px-3.5 py-2.5"
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-primary-soft text-primary">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-medium text-kb-heading">
                            {doc?.title ?? docId}
                          </p>
                          <p className="mt-0.5 truncate text-[10.5px] text-kb-muted">
                            {doc?.source} · {doc?.docType}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10.5px] text-kb-muted">
                          关联 {related?.questionIds.length ?? 0} 题
                        </span>
                      </div>
                    );
                  })}
                  {record.docIds.length > 3 && (
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="min-h-9 w-full text-[11.5px] text-primary hover:bg-kb-surface"
                    >
                      查看其余 {record.docIds.length - 3} 份资料
                    </button>
                  )}
                </div>
              ) : (
                <EmptyStage text="尚未选择资料，专题还没有可学习的内容来源。" />
              )}
            </AssemblyStage>

            <AssemblyStage
              number="02"
              icon={Layers3}
              title="知识点提炼"
              description="从资料中提取必须掌握的能力要点"
              count={`${record.knowledgePoints.length} 条`}
              ready={release.knowledgeReady}
              action="核对知识点"
              onAction={() => onEdit(record)}
            >
              {record.knowledgePoints.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {record.knowledgePoints.slice(0, 4).map((point) => (
                    <div
                      key={point.id}
                      className="rounded-[9px] border border-kb-border px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[12px] font-medium text-kb-heading">
                          {point.title}
                        </span>
                        {point.source === "ai" && (
                          <span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[9px] text-primary">
                            AI 提炼
                          </span>
                        )}
                        {point.confirmed && (
                          <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-success" />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-[10.5px] text-kb-muted">
                        {point.summary}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStage text="选择资料后可辅助提炼知识点，再由维护人确认。" />
              )}
            </AssemblyStage>

            <AssemblyStage
              number="03"
              icon={ClipboardCheck}
              title="练习核对"
              description="检查资料覆盖与题目确认状态"
              count={`${release.questionCount} 道`}
              ready={release.exercisesReady}
              action="管理练习"
              onAction={() => onEdit(record)}
            >
              {record.docQuestions.length ? (
                <div className="divide-y divide-divider overflow-hidden rounded-[10px] border border-kb-border">
                  {record.docQuestions.slice(0, 3).map((item) => {
                    const doc = DOCS.find((candidate) => candidate.id === item.docId);
                    const configured = item.questionIds.length > 0;
                    return (
                      <div key={item.docId} className="flex min-h-[52px] items-center gap-3 px-3.5">
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                            configured && item.confirmed
                              ? "bg-success-soft text-success"
                              : configured
                                ? "bg-remind-soft text-remind-foreground"
                                : "bg-kb-surface text-kb-muted",
                          )}
                        >
                          {configured && item.confirmed ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <CircleAlert className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] text-kb-body">
                          {doc?.title ?? item.docId}
                        </span>
                        <strong className="shrink-0 text-[11.5px] text-kb-heading">
                          {item.questionIds.length} 道
                        </strong>
                        <span
                          className={cn(
                            "w-12 shrink-0 text-right text-[10.5px]",
                            configured && item.confirmed
                              ? "text-success"
                              : configured
                                ? "text-remind-foreground"
                                : "text-kb-muted",
                          )}
                        >
                          {configured ? (item.confirmed ? "已确认" : "待确认") : "未配置"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyStage text="尚未关联练习，发布前需要为学习内容配置题目。" />
              )}
            </AssemblyStage>
          </div>
        </section>

        <aside className="space-y-4 2xl:sticky 2xl:top-5 2xl:self-start">
          <div className="overflow-hidden rounded-[12px] border border-kb-border bg-white">
            <div className="border-b border-kb-border px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[14px] font-semibold text-kb-heading">发布检查</h3>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-[10px] font-medium",
                    release.ready
                      ? "bg-success-soft text-success"
                      : "bg-remind-soft text-remind-foreground",
                  )}
                >
                  {release.ready ? "可发布" : `待完成 ${4 - release.completed} 项`}
                </span>
              </div>
            </div>

            <div className="space-y-1 px-4 py-3">
              <CheckRow
                label="资料来源已确定"
                value={`${record.docIds.length} 份`}
                ready={release.materialsReady}
              />
              <CheckRow
                label="知识点已确认"
                value={`${record.knowledgePoints.filter((item) => item.confirmed).length} 条`}
                ready={release.knowledgeReady}
              />
              <CheckRow
                label="关联练习已核对"
                value={`${release.questionCount} 道`}
                ready={release.exercisesReady}
              />
            </div>

            {record.aiHints?.length ? (
              <div className="mx-4 mb-4 rounded-[9px] border border-remind/20 bg-[linear-gradient(135deg,rgba(255,248,235,0.92),rgba(255,255,255,0.9))] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-remind-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> 完善建议
                </div>
                <p className="mt-1 text-[10.5px] leading-5 text-kb-muted">{record.aiHints[0]}</p>
              </div>
            ) : null}

            {record.status === "草稿" && (
              <div className="border-t border-kb-border p-4">
                <button
                  type="button"
                  onClick={publish}
                  disabled={!release.ready}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[9px] bg-primary px-4 text-[12px] font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-kb-surface disabled:text-kb-muted"
                >
                  <Send className="h-4 w-4" /> {release.ready ? "提交发布" : "完成检查后发布"}
                </button>
              </div>
            )}
            {record.status === "已发布" && (
              <div className="flex items-center gap-2 border-t border-kb-border px-4 py-3 text-[11px] text-success">
                <CircleCheck className="h-4 w-4" /> 当前版本已面向员工发布
              </div>
            )}
          </div>

          <div className="rounded-[12px] border border-kb-border bg-[radial-gradient(circle_at_92%_8%,rgba(52,155,172,0.08),transparent_34%),white] p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="text-[13.5px] font-semibold text-kb-heading">学习交付</h3>
            </div>
            <dl className="mt-4 space-y-3">
              <DeliveryItem label="应用场景" value={record.scenario} />
              <DeliveryItem label="适用岗位" value={record.positions.join("、")} />
              <DeliveryItem label="学习目标" value={record.learningGoal || "尚未填写"} />
            </dl>
            {record.status === "已发布" && (
              <div className="mt-4 flex items-center justify-between border-t border-kb-border pt-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-kb-muted">
                  <Users className="h-3.5 w-3.5" /> {record.learnerCount} 人在学
                </span>
                <Link
                  to="/learn/topic/$id"
                  params={{ id: record.id }}
                  className="inline-flex min-h-9 items-center gap-1 text-[11.5px] font-medium text-primary hover:underline"
                >
                  查看员工端 <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>

      <footer className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-t border-kb-border px-5 text-[10.5px] text-kb-muted sm:px-6">
        <span>维护人：{record.maintainer}</span>
        <span>最近更新：{record.updatedAt}</span>
      </footer>
    </div>
  );
}

function ReadinessStep({
  index,
  label,
  detail,
  ready,
}: {
  index: string;
  label: string;
  detail: string;
  ready: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[58px] items-center gap-3 rounded-[10px] border px-3",
        ready ? "border-kb-border bg-white" : "border-remind/20 bg-remind-soft/45",
      )}
    >
      <span
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-semibold",
          ready ? "bg-success-soft text-success" : "bg-white text-kb-muted",
        )}
      >
        {ready ? <Check className="h-3.5 w-3.5" /> : index}
      </span>
      <div className="min-w-0">
        <p className="text-[11.5px] font-semibold text-kb-heading">{label}</p>
        <p className="mt-0.5 truncate text-[10px] text-kb-muted">{detail}</p>
      </div>
    </div>
  );
}

function AssemblyStage({
  number,
  icon: Icon,
  title,
  description,
  count,
  ready,
  action,
  onAction,
  children,
}: {
  number: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count: string;
  ready: boolean;
  action: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <article className="grid overflow-hidden rounded-[12px] border border-kb-border bg-white lg:grid-cols-[92px_minmax(0,1fr)]">
      <div className="flex items-center gap-3 border-b border-kb-border bg-[linear-gradient(145deg,rgba(238,248,250,0.85),rgba(255,255,255,0.9))] px-4 py-3 lg:flex-col lg:items-start lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
        <span className="text-[10px] font-semibold tracking-[0.12em] text-primary">{number}</span>
        <span className="grid h-9 w-9 place-items-center rounded-[9px] border border-primary/10 bg-white text-primary shadow-[0_4px_12px_rgba(52,155,172,0.08)]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <span
          className={cn(
            "ml-auto text-[10px] font-medium lg:ml-0 lg:mt-auto",
            ready ? "text-success" : "text-remind-foreground",
          )}
        >
          {ready ? "已就绪" : "待完善"}
        </span>
      </div>
      <div className="min-w-0 p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-semibold text-kb-heading">{title}</h4>
              <span className="rounded bg-kb-surface px-1.5 py-0.5 text-[10px] font-medium text-kb-muted">
                {count}
              </span>
            </div>
            <p className="mt-1 text-[10.5px] text-kb-muted">{description}</p>
          </div>
          <button
            type="button"
            onClick={onAction}
            className="min-h-8 rounded-[8px] px-2 text-[11.5px] font-medium text-primary hover:bg-primary-soft"
          >
            {action}
          </button>
        </div>
        {children}
      </div>
    </article>
  );
}

function CheckRow({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return (
    <div className="flex min-h-10 items-center gap-2.5 rounded-[8px] px-2 hover:bg-kb-surface/70">
      <span
        className={cn(
          "grid h-6 w-6 shrink-0 place-items-center rounded-full",
          ready ? "bg-success-soft text-success" : "bg-remind-soft text-remind-foreground",
        )}
      >
        {ready ? <Check className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0 flex-1 text-[11.5px] text-kb-body">{label}</span>
      <strong className="text-[11px] text-kb-heading">{value}</strong>
    </div>
  );
}

function DeliveryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-kb-muted">{label}</dt>
      <dd className="mt-1 text-[11.5px] leading-5 text-kb-body">{value}</dd>
    </div>
  );
}

function EmptyStage({ text }: { text: string }) {
  return (
    <div className="flex min-h-[68px] items-center gap-3 rounded-[10px] border border-dashed border-kb-border bg-kb-surface/35 px-4 text-[11.5px] text-kb-muted">
      <CircleAlert className="h-4 w-4 shrink-0 text-remind-foreground" /> {text}
    </div>
  );
}
