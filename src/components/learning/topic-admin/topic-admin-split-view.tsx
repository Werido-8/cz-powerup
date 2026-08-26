import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Archive,
  BookOpen,
  Check,
  CircleAlert,
  ClipboardList,
  Eye,
  FileText,
  Info,
  Lightbulb,
  Pencil,
  PencilLine,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { KbFileTypeIcon } from "@/components/knowledge/ui";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DOCS, QUESTIONS, type Doc, type QuestionType } from "@/lib/mock/data";
import { getFileById } from "@/lib/knowledge/model";
import {
  TOPIC_ADMIN_RECORDS,
  getTopicQuestionCount,
  type TopicAdminRecord,
  type TopicPublishStatus,
} from "@/lib/mock/topicAdmin";
import { cn } from "@/lib/utils";

type TopicAdminSplitViewProps = {
  onNew: (mode?: "standard" | "ai") => void;
  onEdit: (record: TopicAdminRecord, step?: number) => void;
  onPreview: (record: TopicAdminRecord) => void;
};

const STATUS_FILTERS: { value: "all" | TopicPublishStatus; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "已发布", label: "已发布" },
  { value: "草稿", label: "草稿" },
  { value: "已下架", label: "已下架" },
];

const SECTION_IDS = ["basic", "materials", "knowledge", "practice"] as const;
type SectionId = (typeof SECTION_IDS)[number];

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "basic", label: "基本信息", icon: Info },
  { id: "materials", label: "资料", icon: FileText },
  { id: "knowledge", label: "知识点", icon: Lightbulb },
  { id: "practice", label: "练习", icon: PencilLine },
];

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  text: "简答题",
};

const SECTION_ICON_TONE = "bg-primary-soft text-primary";

function statusTagClass(status: TopicPublishStatus) {
  if (status === "已发布") return "bg-success-soft text-success";
  if (status === "草稿") return "bg-remind-soft text-remind-foreground";
  return "bg-kb-surface text-kb-muted";
}

function sectionDomId(id: SectionId) {
  return `topic-section-${id}`;
}

export function TopicAdminSplitView({ onNew, onEdit, onPreview }: TopicAdminSplitViewProps) {
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TopicPublishStatus>("all");
  const [selectedId, setSelectedId] = useState(TOPIC_ADMIN_RECORDS[0]?.id ?? "");
  const [page, setPage] = useState(1);
  const pageSize = 5;

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = filtered.find((topic) => topic.id === selectedId) ?? paged[0];

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter]);

  useEffect(() => {
    if (!paged.some((item) => item.id === selectedId) && paged[0]) {
      setSelectedId(paged[0].id);
    }
  }, [paged, selectedId]);

  return (
    <div className="grid min-h-[720px] overflow-hidden rounded-[16px] border border-kb-border bg-white shadow-[0_12px_38px_rgba(28,67,75,0.055)] xl:h-full xl:min-h-0 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col border-b border-kb-border bg-[linear-gradient(180deg,rgba(241,248,249,0.88),rgba(255,255,255,0.98)_34%)] xl:border-b-0 xl:border-r">
        <div className="border-b border-kb-border px-4 pb-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-kb-heading">专题库</h2>
              <p className="mt-0.5 text-[11px] text-kb-muted">
                {filtered.length} 个专题 · 最近更新优先
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => onNew("standard")}
                className="inline-flex min-h-9 items-center gap-1 rounded-[9px] border border-primary/25 bg-white px-2.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Plus className="h-3.5 w-3.5" /> 新建
              </button>
              <button
                type="button"
                onClick={() => onNew("ai")}
                className="inline-flex min-h-9 items-center gap-1 rounded-[9px] bg-primary px-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <Sparkles className="h-3.5 w-3.5" /> 智能创建
              </button>
            </div>
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
          {paged.length ? (
            paged.map((topic) => {
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

        <div className="flex items-center justify-between border-t border-kb-border px-4 py-3 text-[11.5px] text-kb-muted">
          <span>
            第 {currentPage}/{totalPages} 页
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-kb-border bg-white px-2.5 py-1 text-kb-body hover:bg-kb-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              上一页
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-kb-border bg-white px-2.5 py-1 text-kb-body hover:bg-kb-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-col xl:h-full xl:overflow-hidden">
        {selected ? (
          <TopicWorkspace
            key={selected.id}
            record={selected}
            onEdit={onEdit}
            onPreview={onPreview}
          />
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
  onEdit: (record: TopicAdminRecord, step?: number) => void;
  onPreview: (record: TopicAdminRecord) => void;
}) {
  const questionCount = getTopicQuestionCount(record);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<ReturnType<typeof listTopicQuestions>[number] | null>(
    null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const { activeId, scrollTo } = useSectionSpy(scrollRef, record.id);

  const questions = useMemo(() => listTopicQuestions(record), [record]);
  const materials = useMemo(
    () =>
      record.docIds
        .map((docId) => DOCS.find((item) => item.id === docId))
        .filter((doc): doc is Doc => Boolean(doc)),
    [record.docIds],
  );
  const editStep = (step: number) => onEdit(record, step);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-kb-border px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-primary-soft text-primary">
              <BookOpen className="h-5 w-5" />
            </span>
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-kb-heading sm:text-[24px]">
              {record.title}
            </h2>
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
                onClick={() => setUnpublishOpen(true)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-[9px] px-2.5 text-[12px] text-destructive hover:bg-destructive/10"
              >
                <Archive className="h-4 w-4" /> 下架
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
        <SectionStepper activeId={activeId} onSelect={scrollTo} />

        <div
          ref={scrollRef}
          className="scrollbar-thin min-h-0 min-w-0 flex-1 overflow-y-auto bg-white px-5 py-5 pb-[28vh] sm:px-6"
        >
          <div className="min-w-0 space-y-4">
              <ContentSection
                id="basic"
                title="基本信息"
                description="专题定位、适用对象与学习目标。"
              >
                <p className="text-[13px] leading-6 text-kb-body">{record.intro || "尚未填写专题简介。"}</p>
                <dl className="mt-4 grid gap-6 sm:grid-cols-2">
                  <MetaField label="适用专业" value={record.specialty} />
                  <MetaField label="适用岗位" value={record.positions.join("、") || "尚未选择"} />
                </dl>
                <div className="mt-4 rounded-[10px] bg-[#F3F7F8] px-3.5 py-3">
                  <p className="text-[11px] text-kb-muted">学习目标</p>
                  <p className="mt-1 text-[12.5px] leading-5 text-kb-heading">
                    {record.learningGoal || "尚未填写"}
                  </p>
                </div>
              </ContentSection>

              <ContentSection
                id="materials"
                title="学习资料"
                count={`共 ${record.docIds.length} 份`}
                description="从权威资料中筛选本专题的学习内容来源。"
                action="管理资料"
                onAction={() => editStep(2)}
              >
                {materials.length ? (
                  <>
                    <ul className="divide-y divide-divider overflow-hidden rounded-[10px] border border-kb-border">
                      {materials.slice(0, 10).map((doc) => {
                        const related = record.docQuestions.find((item) => item.docId === doc.id);
                        const fileIcon = inferDocFileType(doc);
                        return (
                          <li key={doc.id} className="flex min-h-[64px] items-center gap-3 px-3.5 py-2.5">
                            <KbFileTypeIcon
                              type={fileIcon.type}
                              fileName={fileIcon.fileName}
                              size="md"
                              className="shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-kb-heading">{doc.title}</p>
                              <p className="mt-0.5 truncate text-[11px] text-kb-muted">
                                {doc.source} · {doc.docType}
                              </p>
                            </div>
                            <span className="hidden shrink-0 text-[11px] text-kb-muted sm:inline">
                              关联 {related?.questionIds.length ?? 0} 题
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <ViewAllButton onClick={() => editStep(2)}>
                      查看全部资料（共 {record.docIds.length} 份）
                    </ViewAllButton>
                  </>
                ) : (
                  <EmptyStage text="尚未选择资料，专题还没有可学习的内容来源。" />
                )}
              </ContentSection>

              <ContentSection
                id="knowledge"
                title="知识点提炼"
                count={`共 ${record.knowledgePoints.length} 个`}
                description="从资料中提取学员必须掌握的能力要点。"
                action="管理知识点"
                onAction={() => editStep(3)}
              >
                {record.knowledgePoints.length ? (
                  <>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {record.knowledgePoints.slice(0, 10).map((point, index) => {
                        const sourceDoc = materials[index % Math.max(materials.length, 1)];
                        const sourceLabel = sourceDoc
                          ? `来源：${stripBookMarks(sourceDoc.title)}${sourceDoc.toc[0] ? ` · ${sourceDoc.toc[0].title}` : ""}`
                          : point.summary;
                        return (
                          <article
                            key={point.id}
                            className="rounded-[10px] border border-kb-border bg-[#FBFCFD] px-3.5 py-3"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h5 className="truncate text-[13px] font-semibold text-kb-heading">
                                  {point.title}
                                </h5>
                                {point.source === "ai" && (
                                  <span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                    AI 提炼
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 line-clamp-1 text-[11px] text-kb-muted">{sourceLabel}</p>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    <ViewAllButton onClick={() => editStep(3)}>
                      查看全部知识点（共 {record.knowledgePoints.length} 个）
                    </ViewAllButton>
                  </>
                ) : (
                  <EmptyStage text="选择资料后可辅助提炼知识点。" />
                )}
              </ContentSection>

              <ContentSection
                id="practice"
                title="关联练习（预览）"
                count={`共 ${questionCount} 道`}
                description="为学习资料配置对应练习，帮助验证是否掌握。"
                action="管理练习"
                onAction={() => editStep(4)}
              >
                {questions.length ? (
                  <>
                    <TooltipProvider>
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {questions.slice(0, 10).map((item) => (
                          <Tooltip key={item.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => setPreviewQuestion(item)}
                                className="flex min-h-[72px] items-center gap-2.5 rounded-[10px] border border-kb-border bg-[#FBFCFD] px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                              >
                                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-primary-soft text-primary">
                                  <ClipboardList className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[12.5px] font-medium leading-5 text-kb-heading">
                                    {item.title}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                    <span className="inline-flex rounded bg-[#EEF2F4] px-1.5 py-0.5 text-[10px] text-kb-muted">
                                      {item.typeLabel}
                                    </span>
                                    {item.docTitle ? (
                                      <span className="truncate text-[10px] text-kb-muted">
                                        来源：{stripBookMarks(item.docTitle)}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[480px] whitespace-normal break-words bg-[#1F2A30] text-white">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
                    <ViewAllButton onClick={() => editStep(4)}>
                      查看全部练习（共 {questionCount} 道）
                    </ViewAllButton>
                  </>
                ) : (
                  <EmptyStage text="尚未关联练习。" />
                )}
              </ContentSection>
          </div>
        </div>
      </div>

      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认下架专题？</AlertDialogTitle>
            <AlertDialogDescription>
              下架后，{record.learnerCount}{" "}
              名已在学员工将无法继续打开该专题；既有学习记录会保留。此操作不会删除专题内容。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toast.success(`《${record.title}》已下架，历史学习记录已保留`)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认下架
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewQuestion} onOpenChange={(open) => !open && setPreviewQuestion(null)}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-divider px-5 py-4">
            <DialogTitle className="flex items-center gap-2 text-[16px] font-semibold text-kb-heading">
              <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-primary-soft text-primary">
                <ClipboardList className="h-3.5 w-3.5" />
              </span>
              题目详情
            </DialogTitle>
            {previewQuestion ? (
              <p className="text-left text-[12px] text-kb-muted">
                {previewQuestion.typeLabel}
                {previewQuestion.docTitle ? ` · 来源：${stripBookMarks(previewQuestion.docTitle)}` : ""}
              </p>
            ) : null}
          </DialogHeader>
          {previewQuestion ? (
            <div className="space-y-3 px-5 py-4">
              <div>
                <p className="text-[11px] text-kb-muted">题干</p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-6 text-kb-heading">
                  {previewQuestion.title}
                </p>
              </div>
              {previewQuestion.options?.length ? (
                <div>
                  <p className="text-[11px] text-kb-muted">选项</p>
                  <ul className="mt-2 space-y-2">
                    {previewQuestion.options.map((option) => {
                      const isCorrect = isAnswerOption(previewQuestion.answer, option.key, option.label);
                      return (
                        <li
                          key={option.key}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded-[10px] border px-3 py-2 text-[13px]",
                            isCorrect
                              ? "border-success/40 bg-success-soft text-success"
                              : "border-kb-border bg-[#FBFCFD] text-kb-body",
                          )}
                        >
                          <span>
                            {option.key}. {option.label}
                          </span>
                          {isCorrect ? (
                            <span className="shrink-0 text-[11px] font-medium">正确答案</span>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              {previewQuestion.answer ? (
                <div>
                  <p className="text-[11px] text-kb-muted">答案</p>
                  <p className="mt-1 text-[13px] font-medium text-kb-heading">{previewQuestion.answer}</p>
                </div>
              ) : null}
              {previewQuestion.analysis ? (
                <div>
                  <p className="text-[11px] text-kb-muted">解析</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] leading-6 text-kb-body">
                    {previewQuestion.analysis}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function useSectionSpy(rootRef: RefObject<HTMLDivElement | null>, topicId: string) {
  const [activeId, setActiveId] = useState<SectionId>("basic");
  const lockRef = useRef(false);
  const lockTimer = useRef<number>(0);

  const syncActive = useCallback(() => {
    if (lockRef.current) return;
    const root = rootRef.current;
    if (!root) return;

    const spyY = root.getBoundingClientRect().top + 120;
    let current: SectionId = SECTION_IDS[0];
    for (const id of SECTION_IDS) {
      const el = document.getElementById(sectionDomId(id));
      if (!el) continue;
      if (el.getBoundingClientRect().top <= spyY) current = id;
    }
    setActiveId((prev) => (prev === current ? prev : current));
  }, [rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    setActiveId("basic");
    root.scrollTop = 0;

    const observer = new IntersectionObserver(syncActive, {
      root,
      threshold: [0, 0.15, 0.35, 0.6, 1],
    });
    for (const id of SECTION_IDS) {
      const el = document.getElementById(sectionDomId(id));
      if (el) observer.observe(el);
    }

    root.addEventListener("scroll", syncActive, { passive: true });
    syncActive();

    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", syncActive);
      window.clearTimeout(lockTimer.current);
    };
  }, [rootRef, syncActive, topicId]);

  const scrollTo = useCallback(
    (id: SectionId) => {
      const root = rootRef.current;
      const el = document.getElementById(sectionDomId(id));
      if (!root || !el) return;

      lockRef.current = true;
      setActiveId(id);
      const top =
        el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 12;
      root.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      window.clearTimeout(lockTimer.current);
      lockTimer.current = window.setTimeout(() => {
        lockRef.current = false;
        syncActive();
      }, 750);
    },
    [rootRef, syncActive],
  );

  return { activeId, scrollTo };
}

function SectionStepper({
  activeId,
  onSelect,
}: {
  activeId: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const activeIndex = SECTIONS.findIndex((item) => item.id === activeId);

  return (
    <nav
      aria-label="专题内容导航"
      className="flex w-full shrink-0 items-start overflow-x-auto border-b border-kb-border bg-white px-3 py-3 xl:h-full xl:w-[88px] xl:overflow-visible xl:border-b-0 xl:border-r xl:px-2 xl:py-6"
    >
      <ol className="relative flex flex-nowrap items-start xl:w-full xl:flex-col xl:items-center">
        <span
          aria-hidden
          className="pointer-events-none absolute left-10 right-10 top-5 h-px border-t border-dashed border-[#D5E3E6] xl:left-1/2 xl:right-auto xl:top-5 xl:h-[calc(100%-52px)] xl:w-px xl:-translate-x-1/2 xl:border-l xl:border-t-0"
        />
        {SECTIONS.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.id === activeId;
          const isPast = index < activeIndex;
          return (
            <li key={item.id} className={cn("relative z-[1]", index < SECTIONS.length - 1 && "xl:mb-5")}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={isActive ? "true" : undefined}
                className="group flex min-w-[68px] flex-col items-center gap-1.5 rounded-md px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full border transition-colors",
                    isActive &&
                      "border-primary bg-primary text-white shadow-[0_6px_16px_rgba(52,155,172,0.28)]",
                    isPast && "border-primary bg-white text-primary",
                    !isActive &&
                      !isPast &&
                      "border-[#D5E3E6] bg-white text-[#8AA0A7] group-hover:border-primary/40 group-hover:text-primary",
                  )}
                >
                  {<Icon className="h-4 w-4" />}
                </span>
                <span
                  className={cn(
                    "text-[11px] leading-4",
                    isActive ? "font-semibold text-primary" : "font-medium text-kb-muted",
                  )}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ContentSection({
  id,
  title,
  count,
  description,
  action,
  onAction,
  children,
}: {
  id: SectionId;
  title: string;
  count?: string;
  description: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  const section = SECTIONS.find((item) => item.id === id);
  const Icon = section?.icon ?? Info;

  return (
    <section id={sectionDomId(id)} className="scroll-mt-4 rounded-[12px] border border-kb-border bg-white p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="inline-flex items-center gap-2">
              <span className={cn("grid h-7 w-7 place-items-center rounded-[8px]", SECTION_ICON_TONE)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[16px] font-semibold text-kb-heading">{title}</h3>
            </span>
            {count ? <span className="text-[12px] text-kb-muted">{count}</span> : null}
          </div>
          <p className="mt-1 text-[12px] leading-5 text-kb-muted">{description}</p>
        </div>
        {action && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-8 shrink-0 items-center rounded-[8px] border border-kb-border bg-white px-3 text-[12px] font-medium text-kb-body hover:bg-kb-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {action}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-kb-muted">{label}</dt>
      <dd className="mt-1 text-[12.5px] text-kb-heading">{value}</dd>
    </div>
  );
}

function ViewAllButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex min-h-9 w-full items-center justify-center text-[12.5px] font-medium text-primary hover:underline"
    >
      {children}
    </button>
  );
}

function EmptyStage({ text }: { text: string }) {
  return (
    <div className="flex min-h-[68px] items-center gap-3 rounded-[10px] border border-dashed border-kb-border bg-kb-surface/35 px-4 text-[11.5px] text-kb-muted">
      <CircleAlert className="h-4 w-4 shrink-0 text-remind-foreground" /> {text}
    </div>
  );
}

function listTopicQuestions(record: TopicAdminRecord) {
  const items: {
    id: string;
    title: string;
    typeLabel: string;
    docTitle?: string;
    options?: { key: string; label: string }[];
    answer?: string;
    analysis?: string;
  }[] = [];
  for (const group of record.docQuestions) {
    const docTitle = DOCS.find((item) => item.id === group.docId)?.title;
    for (const questionId of group.questionIds) {
      const edited = record.questionEdits?.[questionId];
      const raw = QUESTIONS.find((item) => item.id === questionId);
      const type = edited?.type ?? raw?.type;
      const stem = edited?.stem ?? raw?.stem;
      if (!type || !stem) continue;
      items.push({
        id: questionId,
        title: stem.trim(),
        typeLabel: QUESTION_TYPE_LABEL[type],
        docTitle,
        options: raw?.options ?? [],
        answer: Array.isArray(raw?.answer) ? raw.answer.join("、") : raw?.answer,
        analysis: raw?.analysis,
      });
    }
  }
  return items;
}

function stripBookMarks(title: string) {
  return title.replace(/^《/, "").replace(/》$/, "");
}

function isAnswerOption(answer: string | undefined, optionKey: string, optionLabel: string) {
  if (!answer) return false;
  const tokens = answer
    .split(/[、,，/\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const normalizedKey = optionKey.trim().toUpperCase();
  const normalizedLabel = optionLabel.trim();
  return tokens.some((token) => {
    const normalized = token.toUpperCase();
    return normalized === normalizedKey || token === normalizedLabel;
  });
}

function inferDocFileType(doc: Doc): { type: string; fileName?: string } {
  const knowledgeFile = doc.knowledgeFileId ? getFileById(doc.knowledgeFileId) : undefined;
  if (knowledgeFile) {
    return { type: knowledgeFile.type ?? "pdf", fileName: knowledgeFile.name };
  }

  const fromTitle = doc.title.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (fromTitle) return { type: fromTitle, fileName: doc.title };

  switch (doc.docType) {
    case "厂站资料":
    case "典型操作":
    case "厂家SOP":
      return { type: "docx", fileName: `${doc.title}.docx` };
    default:
      return { type: "pdf", fileName: `${doc.title}.pdf` };
  }
}
