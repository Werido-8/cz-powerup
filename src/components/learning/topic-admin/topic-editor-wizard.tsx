import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  FileText,
  Lightbulb,
  Loader2,
  PencilLine,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Square,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { KbFileTypeIcon } from "@/components/knowledge/ui";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DOCS, QUESTIONS, type Doc, type QuestionType } from "@/lib/mock/data";
import { getFileById } from "@/lib/knowledge/model";
import {
  AI_TOPIC_TEMPLATES,
  EMPTY_TOPIC_DRAFT,
  POSITION_OPTIONS,
  SCENARIO_OPTIONS,
  SPECIALTY_OPTIONS,
  buildAiGeneratedTopicDraft,
  getLearnablePoolDocs,
  getTopicAdminById,
  type TopicAdminRecord,
  type TopicKnowledgePoint,
  type TopicPosition,
  type TopicScenario,
  type TopicSpecialty,
} from "@/lib/mock/topicAdmin";
import { TopicQuestionEditorPanel } from "@/components/learning/topic-admin/topic-question-editor";

const CONTENT_STEPS = ["基本信息", "选择资料", "维护知识点", "关联题目", "预览发布"] as const;
const CONTENT_STEP_HINTS = [
  "填写基础信息",
  "筛选学习资料",
  "提炼核心要点",
  "关联练习题目",
  "核对并发布",
];

type StageKey = "basic" | "materials" | "knowledge" | "questions";
type StageConfirmState = Record<StageKey, boolean>;

const EMPTY_STAGE_CONFIRM: StageConfirmState = {
  basic: false,
  materials: false,
  knowledge: false,
  questions: false,
};

function stageOfContentStep(contentStep: number): StageKey | null {
  if (contentStep === 1) return "basic";
  if (contentStep === 2) return "materials";
  if (contentStep === 3) return "knowledge";
  if (contentStep === 4) return "questions";
  return null;
}

const TOPIC_DRAFT_KEY = "topic-admin-draft";

export type TopicEditorMode = "create" | "edit";

type DraftState = Omit<TopicAdminRecord, "learnerCount" | "maintainer">;

function stageOfPatch(patch: Partial<DraftState>): StageKey | null {
  if (
    "title" in patch ||
    "specialty" in patch ||
    "positions" in patch ||
    "learningGoal" in patch ||
    "scenario" in patch ||
    "intro" in patch
  ) {
    return "basic";
  }
  if ("docIds" in patch) return "materials";
  if ("knowledgePoints" in patch) return "knowledge";
  if ("docQuestions" in patch || "questionEdits" in patch) return "questions";
  return null;
}

function loadDraft(topicId?: string): DraftState | null {
  try {
    const raw = sessionStorage.getItem(`${TOPIC_DRAFT_KEY}:${topicId ?? "new"}`);
    return raw ? (JSON.parse(raw) as DraftState) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: DraftState, topicId?: string) {
  sessionStorage.setItem(`${TOPIC_DRAFT_KEY}:${topicId ?? "new"}`, JSON.stringify(draft));
}

function recordToDraft(record: TopicAdminRecord): DraftState {
  const { learnerCount: _l, maintainer: _m, ...rest } = record;
  return rest;
}

function emptyDraft(): DraftState {
  return {
    ...EMPTY_TOPIC_DRAFT,
    id: `t-draft-${Date.now()}`,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
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

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  text: "简答题",
};

function stripBookMarks(title: string) {
  return title.replace(/^《/, "").replace(/》$/, "");
}

function listDraftQuestions(draft: DraftState) {
  const items: { id: string; title: string; typeLabel: string; docTitle?: string }[] = [];
  for (const group of draft.docQuestions) {
    const docTitle = DOCS.find((item) => item.id === group.docId)?.title;
    for (const questionId of group.questionIds) {
      const edited = draft.questionEdits?.[questionId];
      const raw = QUESTIONS.find((item) => item.id === questionId);
      const type = edited?.type ?? raw?.type;
      const stem = edited?.stem ?? raw?.stem;
      if (!type || !stem) continue;
      items.push({
        id: questionId,
        title: stem.trim(),
        typeLabel: QUESTION_TYPE_LABEL[type],
        docTitle,
      });
    }
  }
  return items;
}

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1 flex min-h-5 items-baseline gap-1.5">
      <label className="shrink-0 text-[13px] font-medium text-[#425B66]">
        {children}
        {required && <span className="ml-0.5 text-[#E65A5A]">*</span>}
      </label>
      {hint ? <span className="truncate text-[11px] text-[#9AAAB0]">{hint}</span> : null}
    </div>
  );
}

function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center", className)}>
      <span className="mr-[5px] h-[1em] w-[5px] shrink-0 rounded-[1px] bg-primary" />
      <h2 className="text-[16px] font-bold leading-none">{children}</h2>
    </div>
  );
}

export function TopicEditorWizard({
  mode,
  topicId,
  assist = "standard",
  initialStep = 1,
  onBack,
  onPreview,
}: {
  mode: TopicEditorMode;
  topicId?: string;
  assist?: "standard" | "ai";
  initialStep?: number;
  onBack: () => void;
  onPreview: (draft: DraftState) => void;
}) {
  const existing = topicId ? getTopicAdminById(topicId) : undefined;
  const isAiMode = assist === "ai";
  const STEPS = isAiMode ? (["AI 起草", ...CONTENT_STEPS] as const) : CONTENT_STEPS;
  const STEP_HINTS = isAiMode ? ["描述专题需求", ...CONTENT_STEP_HINTS] : CONTENT_STEP_HINTS;
  const lastStep = STEPS.length;

  const [step, setStep] = useState(() => Math.min(Math.max(initialStep, 1), lastStep));
  const [reachedContentStep, setReachedContentStep] = useState(() => {
    const initial = Math.min(Math.max(initialStep, 1), lastStep);
    return isAiMode ? initial - 1 : initial;
  });
  const [draft, setDraft] = useState<DraftState>(() => {
    // 编辑态始终以专题维护 mock 为准，避免 sessionStorage 旧草稿与列表不一致
    if (mode === "edit" && existing) {
      try {
        sessionStorage.removeItem(`${TOPIC_DRAFT_KEY}:${topicId}`);
      } catch {
        /* ignore */
      }
      return recordToDraft(existing);
    }
    const saved = loadDraft(topicId);
    if (saved) return saved;
    if (existing) return recordToDraft(existing);
    return emptyDraft();
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDraftDone, setAiDraftDone] = useState(false);
  const [stageConfirmed, setStageConfirmed] = useState<StageConfirmState>(EMPTY_STAGE_CONFIRM);
  const [dirty, setDirty] = useState(false);
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const [docPickerIds, setDocPickerIds] = useState<string[]>([]);
  const [docSearchInput, setDocSearchInput] = useState("");
  const [docTypeDraft, setDocTypeDraft] = useState("all");
  const [docSearch, setDocSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");

  const contentStep = isAiMode ? step - 1 : step;
  const currentStage = stageOfContentStep(contentStep);
  const stageNeedsConfirm = Boolean(isAiMode && currentStage && !stageConfirmed[currentStage]);

  useEffect(() => {
    setStep(Math.min(Math.max(initialStep, 1), lastStep));
  }, [initialStep, lastStep]);

  useEffect(() => {
    setReachedContentStep((prev) => Math.max(prev, contentStep));
  }, [contentStep]);

  const poolDocs = useMemo(() => getLearnablePoolDocs(), []);
  const filteredPool = useMemo(() => {
    const kw = docSearch.trim().toLowerCase();
    return poolDocs.filter((d) => {
      if (docTypeFilter !== "all" && d.docType !== docTypeFilter) return false;
      if (!kw) return true;
      return (
        d.title.toLowerCase().includes(kw) || d.highlight.some((h) => h.toLowerCase().includes(kw))
      );
    });
  }, [poolDocs, docSearch, docTypeFilter]);

  const docTypes = useMemo(() => [...new Set(poolDocs.map((d) => d.docType))], [poolDocs]);
  const selectedDocs = useMemo(
    () =>
      draft.docIds
        .map((id) => DOCS.find((doc) => doc.id === id))
        .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc)),
    [draft.docIds],
  );
  const previewQuestions = useMemo(() => listDraftQuestions(draft), [draft]);

  const updateDraft = (patch: Partial<DraftState>) => {
    setDirty(true);
    if (isAiMode) {
      const stage = stageOfPatch(patch);
      if (stage && stageConfirmed[stage]) {
        setStageConfirmed((prev) => ({ ...prev, [stage]: false }));
      }
    }
    setDraft((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString().slice(0, 10) };
      saveDraft(next, topicId);
      return next;
    });
  };

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [dirty]);

  const handleBack = () => {
    if (dirty && !window.confirm("当前有未保存的修改，确认离开专题编辑吗？")) return;
    onBack();
  };

  const updateKnowledgePoint = (id: string, patch: Partial<TopicKnowledgePoint>) => {
    updateDraft({
      knowledgePoints: draft.knowledgePoints.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    });
  };

  const openDocPicker = () => {
    setDocPickerIds([...draft.docIds]);
    setDocSearchInput("");
    setDocTypeDraft("all");
    setDocSearch("");
    setDocTypeFilter("all");
    setDocPickerOpen(true);
  };

  const runDocSearch = () => {
    setDocSearch(docSearchInput.trim());
    setDocTypeFilter(docTypeDraft);
  };

  const togglePickerDoc = (docId: string) => {
    setDocPickerIds((current) =>
      current.includes(docId) ? current.filter((id) => id !== docId) : [...current, docId],
    );
  };

  const applyDocSelection = (docIds: string[]) => {
    const docQuestions = docIds.map((id) => {
      const existing = draft.docQuestions.find((d) => d.docId === id);
      if (existing) return existing;
      return { docId: id, questionIds: [], generated: false, confirmed: false };
    });
    updateDraft({ docIds, docQuestions });
  };

  const removeDoc = (docId: string) => {
    applyDocSelection(draft.docIds.filter((id) => id !== docId));
  };

  const togglePosition = (pos: TopicPosition) => {
    const has = draft.positions.includes(pos);
    updateDraft({
      positions: has ? draft.positions.filter((p) => p !== pos) : [...draft.positions, pos],
    });
  };

  const handleAiGenerateDraft = () => {
    if (!aiPrompt.trim()) {
      toast.error("请先描述专题目标");
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      const generated = buildAiGeneratedTopicDraft(aiPrompt.trim());
      updateDraft(generated);
      setStageConfirmed(EMPTY_STAGE_CONFIRM);
      setReachedContentStep(1);
      setAiDraftDone(true);
      setAiLoading(false);
      setStep(2);
      toast.success("专题草稿已生成，请按阶段核对后确认");
    }, 1400);
  };

  const canNext = () => {
    if (contentStep === 0) return aiDraftDone;
    if (contentStep === 1)
      return Boolean(draft.title.trim() && draft.learningGoal.trim() && draft.positions.length > 0);
    if (contentStep === 2) return draft.docIds.length > 0;
    if (contentStep === 3)
      return (
        draft.knowledgePoints.length > 0 &&
        draft.knowledgePoints.every((item) => item.title.trim() && item.summary.trim())
      );
    if (contentStep === 4) return draft.docQuestions.some((item) => item.questionIds.length > 0);
    return true;
  };

  const handleNext = () => {
    if (!canNext()) {
      toast.error(
        contentStep === 0
          ? "请先生成专题草稿"
          : contentStep === 3
            ? "请先补全知识点名称和说明"
            : "请完成当前步骤必填项",
      );
      return;
    }
    if (isAiMode && currentStage && !stageConfirmed[currentStage]) {
      setStageConfirmed((prev) => ({ ...prev, [currentStage]: true }));
    }
    setStep((s) => Math.min(s + 1, lastStep));
  };

  const handleSaveDraft = () => {
    saveDraft(draft, topicId);
    setDirty(false);
    toast.success("草稿已保存");
  };

  const handlePublish = () => {
    if (isAiMode && Object.values(stageConfirmed).some((value) => !value)) {
      toast.error("请先完成各阶段确认后再发布");
      return;
    }
    const publishedDraft: DraftState = {
      ...draft,
      status: "已发布",
      publishedAt: new Date().toISOString().slice(0, 10),
    };
    saveDraft(publishedDraft, topicId);
    setDirty(false);
    toast.success("专题已发布，员工可在专题学习中查看");
    onBack();
  };

  const handlePrev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const goContentStep = (nextContentStep: number) => {
    setStep(isAiMode ? nextContentStep + 1 : nextContentStep);
  };

  const questionCount = draft.docQuestions.reduce((total, item) => {
    return total + item.questionIds.length;
  }, 0);
  const pageTitle = mode === "edit" ? "编辑专题" : "新建专题";
  const modeLabel = mode === "edit" ? "专题编辑" : isAiMode ? "AI 辅助创建" : "人工创建";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F5FAFB] px-4 pt-3 sm:px-6 lg:px-8">
      <div className="flex min-h-0 flex-1 flex-col gap-3 pb-16">
        <div className="flex h-9 shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[12.5px] text-[#607681] transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 返回专题维护
          </button>
          <span aria-hidden className="h-4 w-px shrink-0 bg-[#DCE8EA]" />
          {isAiMode ? (
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-primary" />
          )}
          <h1 className="text-[18px] font-semibold leading-none text-[#1F3440]">{pageTitle}</h1>
          <span className="text-[12.5px] text-[#607681]">{modeLabel}</span>
        </div>

        <div className="shrink-0 rounded-[10px] border border-[#E3EEF0] bg-white px-4 py-2.5 shadow-[0_6px_20px_rgba(31,52,64,0.04)] sm:px-5">
          <nav aria-label="步骤导航" className="flex min-w-0 items-center overflow-x-auto">
            {STEPS.map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              const reachable = n <= step;
              return (
                <div
                  key={label}
                  className={cn("flex min-w-0 items-center", i < STEPS.length - 1 && "flex-1")}
                >
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => {
                      if (n !== step && n < step) setStep(n);
                    }}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "group flex shrink-0 items-center gap-2.5 rounded-[8px] px-1 py-0.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      reachable && !active && "hover:bg-[#F5FAFB]",
                      !reachable && !done && !active && "cursor-not-allowed",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold transition-colors",
                        active &&
                          "bg-primary text-white shadow-[0_0_0_3px_rgba(52,155,172,0.14)]",
                        done && "border border-primary/25 bg-primary text-white",
                        !active && !done && "border border-[#DCE8EA] bg-white text-[#8FA2AA]",
                      )}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      ) : n === 1 && isAiMode ? (
                        <Sparkles className="h-3.5 w-3.5" />
                      ) : (
                        n
                      )}
                    </span>
                    <span className="hidden sm:block">
                      <span
                        className={cn(
                          "block whitespace-nowrap text-[12px] font-semibold",
                          active ? "text-primary" : done ? "text-[#2F8D9D]" : "text-[#607681]",
                        )}
                      >
                        {label}
                      </span>
                      <span className="mt-0.5 block whitespace-nowrap text-[10.5px] text-[#9AAAB0]">
                        {STEP_HINTS[i]}
                      </span>
                    </span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div
                      aria-hidden
                      className={cn(
                        "mx-2.5 h-px min-w-4 flex-1 sm:mx-3",
                        step > n ? "bg-primary/40" : "bg-[#DCE8EA]",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden max-lg:overflow-y-auto lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
          <main className="flex min-h-0 min-w-0 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-white p-5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
            {contentStep === 0 && (
              <div className="flex h-full min-h-0 flex-col">
                <SectionTitle>AI 起草</SectionTitle>
                <p className="-mt-1 mb-3 text-[12.5px] text-[#6B7F88]">
                  描述对象、场景和学习目标。生成后会回填基本信息、资料、知识点和练习题。
                </p>
                {aiDraftDone && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary-soft/40 px-3 py-2 text-[12.5px] text-primary">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    草稿已生成。可修改需求后重新生成，新草稿将覆盖当前内容。
                  </div>
                )}
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="示例：面向新入职运行值班人员，围绕交接班、巡检和常见异常判断，组织一套入门专题。"
                  className="min-h-0 w-full flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="mt-3 shrink-0">
                  <p className="mb-2 text-[12px] text-muted-foreground">快捷模板</p>
                  <div className="flex flex-wrap gap-2">
                    {AI_TOPIC_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => setAiPrompt(tpl.prompt)}
                        className="rounded-full border border-border px-3 py-1 text-[12px] text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {contentStep === 1 && (
              <div className="flex h-full min-h-0 flex-col">
                <SectionTitle>基本信息</SectionTitle>
                <div className="grid shrink-0 gap-x-5 gap-y-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>专题名称</FieldLabel>
                    <Input
                      value={draft.title}
                      onChange={(e) => updateDraft({ title: e.target.value })}
                      placeholder="如：新员工运行专业入门、电气专业基础"
                      className="text-[13px]"
                    />
                  </div>
                  <div>
                    <FieldLabel required>所属专业</FieldLabel>
                    <Select
                      value={draft.specialty}
                      onValueChange={(value) =>
                        updateDraft({ specialty: value as TopicSpecialty })
                      }
                    >
                      <SelectTrigger className="h-9 w-full text-[13px]">
                        <SelectValue placeholder="请选择专业" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALTY_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-[13px]">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel required>业务场景</FieldLabel>
                    <Select
                      value={draft.scenario}
                      onValueChange={(value) =>
                        updateDraft({ scenario: value as TopicScenario })
                      }
                    >
                      <SelectTrigger className="h-9 w-full text-[13px]">
                        <SelectValue placeholder="请选择场景" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCENARIO_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-[13px]">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel required>适用岗位</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-[13px] shadow-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <span
                            className={cn(
                              "truncate",
                              draft.positions.length === 0 && "text-muted-foreground",
                            )}
                          >
                            {draft.positions.length === 0
                              ? "请选择岗位"
                              : draft.positions.join("、")}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
                        {POSITION_OPTIONS.map((p) => {
                          const checked = draft.positions.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => togglePosition(p)}
                              className="flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] hover:bg-muted"
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                                  checked
                                    ? "border-primary bg-primary text-white"
                                    : "border-input",
                                )}
                              >
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              {p}
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
                <div className="flex min-h-0 flex-1 flex-col">
                  <FieldLabel required hint="员工学完后要能识别什么、判断什么、执行什么">
                    学习目标
                  </FieldLabel>
                  <textarea
                    value={draft.learningGoal}
                    onChange={(e) => updateDraft({ learningGoal: e.target.value })}
                    placeholder="学完后应掌握的核心能力与可解决的现场问题"
                    className="min-h-0 w-full flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                  <FieldLabel>专题简介</FieldLabel>
                  <textarea
                    value={draft.intro}
                    onChange={(e) => updateDraft({ intro: e.target.value })}
                    placeholder="简短说明适用对象与专题价值"
                    className="min-h-0 w-full flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                </div>
              </div>
            )}

            {contentStep === 2 && (
              <div className="flex h-full min-h-0 flex-col">
                <SectionTitle>选择资料</SectionTitle>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12.5px] text-muted-foreground">
                    已选 <strong className="text-foreground">{draft.docIds.length}</strong> 份资料
                  </p>
                  <button
                    type="button"
                    onClick={openDocPicker}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-primary/30 bg-primary-soft/40 px-3 text-[12px] font-medium text-primary hover:bg-primary-soft"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    选择文件
                  </button>
                </div>

                {selectedDocs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
                    暂无资料，点击「选择文件」从知识资料池添加
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selectedDocs.map((doc) =>
                      (() => {
                        const fileIcon = inferDocFileType(doc);
                        return (
                          <li
                            key={doc.id}
                            className="flex items-start gap-3 rounded-lg border border-divider px-3 py-3"
                          >
                            <KbFileTypeIcon
                              type={fileIcon.type}
                              fileName={fileIcon.fileName}
                              size="md"
                              className="mt-0.5 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-foreground">{doc.title}</p>
                              <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                                {doc.snippet}
                              </p>
                              <div className="mt-1.5 flex flex-wrap gap-2 text-[10.5px] text-muted-foreground">
                                <span>{doc.docType}</span>
                                <span>{doc.source}</span>
                                <span>{doc.updatedAt}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDoc(doc.id)}
                              className="shrink-0 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              移除
                            </button>
                          </li>
                        );
                      })(),
                    )}
                  </ul>
                )}

                <AppFormDialog
                  open={docPickerOpen}
                  onClose={() => setDocPickerOpen(false)}
                  title="选择知识资料"
                  titleIcon={FileText}
                  size="large"
                  fillHeight
                  footer={
                    <>
                      <AppDialogButton onClick={() => setDocPickerOpen(false)}>
                        取消
                      </AppDialogButton>
                      <AppDialogButton
                        variant="primary"
                        onClick={() => {
                          applyDocSelection(docPickerIds);
                          setDocPickerOpen(false);
                          toast.success(`已选择 ${docPickerIds.length} 份资料`);
                        }}
                      >
                        确定
                      </AppDialogButton>
                    </>
                  }
                >
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={docSearchInput}
                        onChange={(e) => setDocSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            runDocSearch();
                          }
                        }}
                        placeholder="搜索资料标题、标签…"
                        className="h-9 min-w-[200px] flex-1 text-[12.5px]"
                      />
                      <Select value={docTypeDraft} onValueChange={setDocTypeDraft}>
                        <SelectTrigger className="h-9 w-[160px] rounded-md border-kb-border bg-white text-[12.5px]">
                          <SelectValue placeholder="资料类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all" className="text-[12.5px]">
                            全部类型
                          </SelectItem>
                          {docTypes.map((t) => (
                            <SelectItem key={t} value={t} className="text-[12.5px]">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        onClick={runDocSearch}
                        className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[12.5px] font-medium text-white hover:bg-primary/90"
                      >
                        <Search className="h-3.5 w-3.5" aria-hidden />
                        查询
                      </button>
                    </div>
                    <p className="text-[12px] text-muted-foreground">
                      已勾选 <strong className="text-foreground">{docPickerIds.length}</strong> 份 ·
                      当前结果 {filteredPool.length} 份
                    </p>
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                      {filteredPool.length === 0 ? (
                        <div className="grid min-h-40 place-items-center text-[13px] text-muted-foreground">
                          没有匹配的资料
                        </div>
                      ) : (
                        filteredPool.map((doc) => {
                          const selected = docPickerIds.includes(doc.id);
                          const fileIcon = inferDocFileType(doc);
                          return (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => togglePickerDoc(doc.id)}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
                                selected
                                  ? "border-primary/40 bg-primary-soft/25"
                                  : "border-divider hover:bg-muted/30",
                              )}
                            >
                              {selected ? (
                                <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              ) : (
                                <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                              )}
                              <KbFileTypeIcon
                                type={fileIcon.type}
                                fileName={fileIcon.fileName}
                                size="md"
                                className="mt-0.5 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-foreground">
                                  {doc.title}
                                </p>
                                <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                                  {doc.snippet}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-2 text-[10.5px] text-muted-foreground">
                                  <span>{doc.docType}</span>
                                  <span>{doc.source}</span>
                                  <span>{doc.updatedAt}</span>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </AppFormDialog>
                </div>
              </div>
            )}

            {contentStep === 3 && (
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
                  <SectionTitle className="mb-0">维护知识点</SectionTitle>
                  <button
                    type="button"
                    onClick={() => {
                      const id = `kp-manual-${Date.now()}`;
                      updateDraft({
                        knowledgePoints: [
                          {
                            id,
                            title: "",
                            summary: "",
                            source: "manual",
                            confirmed: false,
                          },
                          ...draft.knowledgePoints,
                        ],
                      });
                    }}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-primary/30 bg-primary-soft/40 px-3 text-[12px] font-medium text-primary hover:bg-primary-soft"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    添加知识点
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                {draft.knowledgePoints.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
                    暂无知识点，点击「添加知识点」开始维护
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {draft.knowledgePoints.map((kp) => (
                      <li key={kp.id} className="rounded-lg border border-divider bg-card p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[10.5px] text-muted-foreground">
                            {kp.source === "ai" ? "AI 提炼" : "人工维护"}
                          </span>
                          <button
                            type="button"
                            aria-label={`删除知识点：${kp.title || "未命名"}`}
                            onClick={() =>
                              updateDraft({
                                knowledgePoints: draft.knowledgePoints.filter(
                                  (item) => item.id !== kp.id,
                                ),
                              })
                            }
                            className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <Input
                          value={kp.title}
                          aria-label="知识点名称"
                          placeholder="输入知识点名称"
                          onChange={(event) =>
                            updateKnowledgePoint(kp.id, {
                              title: event.target.value,
                              source: "manual",
                            })
                          }
                          className="mb-1.5 h-8 text-[13px] font-medium"
                        />
                        <textarea
                          value={kp.summary}
                          aria-label="知识点说明"
                          placeholder="说明需要掌握的概念、判断或操作要点"
                          onChange={(event) =>
                            updateKnowledgePoint(kp.id, {
                              summary: event.target.value,
                              source: "manual",
                            })
                          }
                          rows={2}
                          className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </li>
                    ))}
                  </ul>
                )}
                </div>
              </div>
            )}

            {contentStep === 4 && (
              <div className="flex h-full min-h-0 flex-col">
                <SectionTitle>关联题目</SectionTitle>
                <div className="min-h-0 flex-1 overflow-y-auto">
                <TopicQuestionEditorPanel
                  docIds={draft.docIds}
                  docQuestions={draft.docQuestions}
                  questionEdits={draft.questionEdits}
                  onUpdate={(patch) => updateDraft(patch)}
                />
                </div>
              </div>
            )}

            {contentStep === 5 && (
              <div className="flex h-full min-h-0 flex-col">
                <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                  <SectionTitle className="mb-0">发布预览</SectionTitle>
                  <button
                    type="button"
                    onClick={() => onPreview(draft)}
                    className="inline-flex min-h-8 items-center rounded-[8px] border border-kb-border bg-white px-3 text-[12px] font-medium text-kb-body hover:bg-kb-surface"
                  >
                    学员端预览
                  </button>
                </div>
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                  <PreviewListSection
                    icon={FileText}
                    title="学习资料"
                    count={`共 ${selectedDocs.length} 份`}
                    action="去修改"
                    onAction={() => goContentStep(2)}
                  >
                    {selectedDocs.length ? (
                      <ul className="divide-y divide-divider overflow-hidden rounded-[10px] border border-kb-border">
                        {selectedDocs.map((doc) => {
                          const related = draft.docQuestions.find((item) => item.docId === doc.id);
                          const fileIcon = inferDocFileType(doc);
                          return (
                            <li
                              key={doc.id}
                              className="flex min-h-[56px] items-center gap-3 px-3.5 py-2"
                            >
                              <KbFileTypeIcon
                                type={fileIcon.type}
                                fileName={fileIcon.fileName}
                                size="md"
                                className="shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-medium text-kb-heading">
                                  {doc.title}
                                </p>
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
                    ) : (
                      <EmptyPreview text="尚未选择资料，专题还没有可学习的内容来源。" />
                    )}
                  </PreviewListSection>

                  <PreviewListSection
                    icon={Lightbulb}
                    title="知识点提炼"
                    count={`共 ${draft.knowledgePoints.length} 个`}
                    action="去修改"
                    onAction={() => goContentStep(3)}
                  >
                    {draft.knowledgePoints.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {draft.knowledgePoints.map((point, index) => {
                          const sourceDoc = selectedDocs[index % Math.max(selectedDocs.length, 1)];
                          const sourceLabel = sourceDoc
                            ? `来源：${stripBookMarks(sourceDoc.title)}${sourceDoc.toc[0] ? ` · ${sourceDoc.toc[0].title}` : ""}`
                            : point.summary;
                          return (
                            <article
                              key={point.id}
                              className="rounded-[10px] border border-kb-border bg-[#FBFCFD] px-3.5 py-2.5"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h5 className="truncate text-[13px] font-semibold text-kb-heading">
                                  {point.title || "未命名知识点"}
                                </h5>
                                {point.source === "ai" && (
                                  <span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                    AI 提炼
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 line-clamp-1 text-[11px] text-kb-muted">
                                {sourceLabel}
                              </p>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyPreview text="选择资料后可辅助提炼知识点。" />
                    )}
                  </PreviewListSection>

                  <PreviewListSection
                    icon={PencilLine}
                    title="关联练习"
                    count={`共 ${previewQuestions.length} 道`}
                    action="去修改"
                    onAction={() => goContentStep(4)}
                  >
                    {previewQuestions.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {previewQuestions.map((item) => (
                          <div
                            key={item.id}
                            className="flex min-h-[64px] items-center gap-2.5 rounded-[10px] border border-kb-border bg-[#FBFCFD] px-3 py-2.5"
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyPreview text="尚未关联练习。" />
                    )}
                  </PreviewListSection>
                </div>
              </div>
            )}
          </div>
        </main>

        <TopicCreationSidebar
          draft={draft}
          questionCount={questionCount}
          contentStep={contentStep}
          reachedContentStep={reachedContentStep}
          isAiMode={isAiMode}
          onEditBasic={() => setStep(isAiMode ? 2 : 1)}
        />
      </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EDF3F5] bg-white shadow-[0_-2px_12px_rgba(31,52,64,0.06)]">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5 text-[13px]">
            <span className="font-semibold text-[#1F3440]">
              步骤 {step}/{lastStep}
            </span>
            <span className="text-[#DCE8EA]">·</span>
            {aiLoading ? (
              <span className="flex items-center gap-1.5 text-primary">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                正在生成草稿…
              </span>
            ) : (
              <span className="text-muted-foreground">{STEPS[step - 1]}</span>
            )}
            {dirty ? (
              <span className="hidden items-center gap-1 rounded-full bg-[#FFF6E8] px-2 py-0.5 text-[11px] font-medium text-[#C48A2A] sm:inline-flex">
                <AlertTriangle className="h-3 w-3" />
                有未保存的修改
              </span>
            ) : (
              <span className="hidden rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary sm:inline">
                草稿已保存
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB]"
            >
              <Save className="h-4 w-4 text-muted-foreground" />
              保存草稿
            </button>
            <button
              type="button"
              disabled={step <= 1}
              onClick={handlePrev}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              上一步
            </button>
            {contentStep === 0 ? (
              <>
                {aiDraftDone && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB]"
                  >
                    下一步
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAiGenerateDraft}
                  disabled={aiLoading}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在生成...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {aiDraftDone ? "重新生成草稿" : "生成专题草稿"}
                    </>
                  )}
                </button>
              </>
            ) : step < lastStep ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canNext()}
                title={!canNext() ? "请完成当前步骤必填项" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D]",
                  !canNext() && "cursor-not-allowed opacity-60 hover:bg-primary",
                )}
              >
                {stageNeedsConfirm ? "确认本阶段" : "下一步"}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D]"
              >
                <Send className="h-4 w-4" />
                发布专题
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicCreationSidebar({
  draft,
  questionCount,
  contentStep,
  reachedContentStep,
  isAiMode,
  onEditBasic,
}: {
  draft: DraftState;
  questionCount: number;
  contentStep: number;
  reachedContentStep: number;
  isAiMode: boolean;
  onEditBasic: () => void;
}) {
  const readiness = [
    {
      label: "基本信息",
      filled: Boolean(draft.title.trim() && draft.learningGoal.trim() && draft.positions.length),
      step: 1,
    },
    { label: "学习资料", filled: draft.docIds.length > 0, step: 2 },
    {
      label: "知识点",
      filled:
        draft.knowledgePoints.length > 0 &&
        draft.knowledgePoints.every((item) => item.title.trim() && item.summary.trim()),
      step: 3,
    },
    { label: "关联练习", filled: questionCount > 0, step: 4 },
  ].map((item) => ({
    ...item,
    // 只统计已走到的步骤：编辑已有专题时，未进入的后续步骤即使有数据也不算已准备
    complete: item.filled && reachedContentStep >= item.step,
  }));
  const readyCount = readiness.filter((item) => item.complete).length;
  const readinessPercent = Math.round((readyCount / readiness.length) * 100);

  return (
    <aside className="flex h-full min-h-0 flex-col gap-3">
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[#E3EEF0] bg-white p-4 shadow-[0_8px_24px_rgba(31,52,64,0.05)]">
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-[#1F3440]">专题预览</h2>
          <button
            type="button"
            onClick={onEditBasic}
            className="rounded-md px-1.5 py-1 text-[11.5px] font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            编辑
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-kb-muted">专题名称</p>
            <p className="mt-1 break-words text-[13px] font-semibold leading-5 text-kb-title">
              {draft.title.trim() || "暂未填写专题名称"}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-kb-muted">适用岗位 / 专业</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {[...draft.positions, draft.specialty].map((label) => (
                <span
                  key={label}
                  className="rounded-md bg-kb-surface px-2 py-0.5 text-[10.5px] text-kb-body"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <dl className="mt-4 divide-y divide-kb-border border-t border-kb-border">
          <SidebarStat icon={FileText} label="关联资料" value={`${draft.docIds.length} 份`} />
          <SidebarStat icon={Target} label="知识点" value={`${draft.knowledgePoints.length} 个`} />
          <SidebarStat icon={ClipboardList} label="关联练习" value={`${questionCount} 道`} />
        </dl>

        <div className="mt-3 rounded-lg bg-primary-soft/35 px-3 py-2 text-[11.5px] text-kb-body">
          <span className="font-medium text-primary">{isAiMode ? "AI 辅助" : "人工创建"}</span>
          <span className="mx-1.5 text-kb-border">·</span>
          {draft.scenario}
        </div>
        </div>
      </section>

      <section className="shrink-0 rounded-[10px] border border-[#E3EEF0] bg-white p-4 shadow-[0_8px_24px_rgba(31,52,64,0.05)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-[#1F3440]">内容准备情况</h2>
          <span className="text-[12px] font-semibold tabular-nums text-primary">
            {readinessPercent}%
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="专题内容准备进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={readinessPercent}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-kb-surface"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${readinessPercent}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-kb-muted">
          {readyCount} / {readiness.length} 项已准备
        </p>

        <ul className="mt-3 space-y-2">
          {readiness.map((item) => {
            const isCurrent = contentStep === item.step;
            return (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 text-[11.5px]"
              >
                <span className={cn("text-kb-body", isCurrent && "font-medium text-primary")}>
                  {item.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    item.complete ? "text-success" : isCurrent ? "text-primary" : "text-kb-muted",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      item.complete ? "bg-success" : isCurrent ? "bg-primary" : "bg-kb-border",
                    )}
                  />
                  {item.complete ? "已准备" : isCurrent ? "进行中" : "待完善"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}

function SidebarStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-[11.5px]">
      <dt className="flex items-center gap-2 text-kb-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="font-medium tabular-nums text-kb-title">{value}</dd>
    </div>
  );
}

function PreviewListSection({
  icon: Icon,
  title,
  count,
  action,
  onAction,
  children,
}: {
  icon: typeof FileText;
  title: string;
  count: string;
  action: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-kb-border p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="inline-flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-[8px] bg-primary-soft text-primary">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <h3 className="text-[15px] font-semibold text-kb-heading">{title}</h3>
            </span>
            <span className="text-[12px] text-kb-muted">{count}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex min-h-8 shrink-0 items-center rounded-[8px] border border-kb-border bg-white px-3 text-[12px] font-medium text-kb-body hover:bg-kb-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {action}
        </button>
      </div>
      {children}
    </section>
  );
}

function EmptyPreview({ text }: { text: string }) {
  return (
    <div className="flex min-h-[60px] items-center gap-3 rounded-[10px] border border-dashed border-kb-border bg-kb-surface/35 px-4 text-[11.5px] text-kb-muted">
      <CircleAlert className="h-4 w-4 shrink-0 text-remind-foreground" /> {text}
    </div>
  );
}
