import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Loader2,
  Pencil,
  Save,
  Send,
  Sparkles,
  Square,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { DOCS, QUESTIONS } from "@/lib/mock/data";
import {
  EMPTY_TOPIC_DRAFT,
  POSITION_OPTIONS,
  SCENARIO_OPTIONS,
  SPECIALTY_OPTIONS,
  getLearnablePoolDocs,
  getTopicAdminById,
  type EditableTopicQuestion,
  type TopicAdminRecord,
  type TopicKnowledgePoint,
  type TopicPosition,
  type TopicScenario,
  type TopicSpecialty,
} from "@/lib/mock/topicAdmin";
import {
  TopicQuestionEditorPanel,
  resolveTopicQuestion,
} from "@/components/learning/topic-admin/topic-question-editor";

const STEPS = ["基本信息", "选择资料", "维护知识点", "关联题目", "预览发布"] as const;
const STEP_HINTS = [
  "明确学习对象、业务场景与学习目标，这是专题价值的起点",
  "从学习资料池筛选权威、清晰的精品资料，避免全量堆叠",
  "提炼核心概念与操作要点，由培训老师人工维护确认",
  "题目跟随文档，帮助员工验证是否真正掌握",
  "确认内容无误后发布，员工即可在专题学习中看到",
];

const TOPIC_DRAFT_KEY = "topic-admin-draft";

export type TopicEditorMode = "create" | "edit";

type DraftState = Omit<TopicAdminRecord, "learnerCount" | "maintainer">;

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
    <div className="mb-1.5">
      <label className="block text-[13px] font-medium text-foreground">
        {children}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[11.5px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TopicEditorWizard({
  mode,
  topicId,
  onBack,
  onPreview,
}: {
  mode: TopicEditorMode;
  topicId?: string;
  onBack: () => void;
  onPreview: (draft: DraftState) => void;
}) {
  const existing = topicId ? getTopicAdminById(topicId) : undefined;

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<DraftState>(() => {
    const saved = loadDraft(topicId);
    if (saved) return saved;
    if (existing) return recordToDraft(existing);
    return emptyDraft();
    // 本期暂不开放：AI 辅助创建预填
    // if (aiAssist) {
    //   d.title = "新员工运行专业入门";
    //   d.learningGoal = "掌握值班巡检基本流程与常见异常初步判断。";
    //   d.intro = "面向首次上岗运行人员，围绕岗位能力与真实业务场景组织学习。";
    // }
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [knowledgeFilter, setKnowledgeFilter] = useState<"all" | "pending" | "confirmed">("all");
  const [expandedKnowledgeIds, setExpandedKnowledgeIds] = useState<Set<string>>(new Set());
  const [aiKnowledgeResult, setAiKnowledgeResult] = useState<{
    created: number;
    skipped: number;
  } | null>(null);
  const [docSearch, setDocSearch] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("all");

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

  const updateDraft = (patch: Partial<DraftState>) => {
    setDirty(true);
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

  const knowledgeStats = useMemo(
    () => ({
      total: draft.knowledgePoints.length,
      pending: draft.knowledgePoints.filter((item) => !item.confirmed).length,
      confirmed: draft.knowledgePoints.filter((item) => item.confirmed).length,
    }),
    [draft.knowledgePoints],
  );

  const visibleKnowledgePoints = useMemo(() => {
    const sorted = [...draft.knowledgePoints].sort(
      (a, b) => Number(a.confirmed) - Number(b.confirmed),
    );
    if (knowledgeFilter === "pending") return sorted.filter((item) => !item.confirmed);
    if (knowledgeFilter === "confirmed") return sorted.filter((item) => item.confirmed);
    return sorted;
  }, [draft.knowledgePoints, knowledgeFilter]);

  const toggleDoc = (docId: string) => {
    const has = draft.docIds.includes(docId);
    const docIds = has ? draft.docIds.filter((id) => id !== docId) : [...draft.docIds, docId];
    const docQuestions = docIds.map((id) => {
      const existing = draft.docQuestions.find((d) => d.docId === id);
      if (existing) return existing;
      const qids = QUESTIONS.filter((q) => q.relatedDocId === id).map((q) => q.id);
      return { docId: id, questionIds: qids, generated: false, confirmed: qids.length > 0 };
    });
    updateDraft({ docIds, docQuestions });
  };

  const togglePosition = (pos: TopicPosition) => {
    const has = draft.positions.includes(pos);
    updateDraft({
      positions: has ? draft.positions.filter((p) => p !== pos) : [...draft.positions, pos],
    });
  };

  const handleAiRecommendDocs = () => {
    setAiLoading(true);
    setTimeout(() => {
      const recommended = poolDocs.slice(0, 3).map((d) => d.id);
      const docIds = [...new Set([...draft.docIds, ...recommended])];
      const docQuestions = docIds.map((id) => {
        const existing = draft.docQuestions.find((d) => d.docId === id);
        if (existing) return existing;
        return { docId: id, questionIds: [], generated: false, confirmed: false };
      });
      updateDraft({ docIds, docQuestions });
      setAiLoading(false);
      toast.success("AI 已推荐 3 份候选资料，请人工筛选确认");
    }, 1200);
  };

  const handleAiKnowledge = () => {
    if (draft.docIds.length === 0) {
      toast.error("请先选择资料");
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      const kpSet = new Set<string>();
      draft.docIds.forEach((docId) => {
        const doc = DOCS.find((d) => d.id === docId);
        doc?.highlight.slice(0, 2).forEach((h) => kpSet.add(h));
        QUESTIONS.filter((q) => q.relatedDocId === docId)
          .flatMap((q) => q.knowledgePoints)
          .forEach((k) => kpSet.add(k));
      });
      const knowledgePoints: TopicKnowledgePoint[] = Array.from(kpSet)
        .slice(0, 6)
        .map((title, i) => ({
          id: `kp-ai-${i}-${Date.now()}`,
          title,
          summary: `基于所选资料提炼：${title} 的核心概念与现场要点。`,
          source: "ai",
          confirmed: false,
        }));
      const existingTitles = new Set(
        draft.knowledgePoints.map((item) => item.title.trim().toLowerCase()),
      );
      const newKnowledgePoints = knowledgePoints.filter(
        (item) => !existingTitles.has(item.title.trim().toLowerCase()),
      );
      updateDraft({ knowledgePoints: [...draft.knowledgePoints, ...newKnowledgePoints] });
      setExpandedKnowledgeIds(new Set(newKnowledgePoints.map((item) => item.id)));
      setAiKnowledgeResult({
        created: newKnowledgePoints.length,
        skipped: knowledgePoints.length - newKnowledgePoints.length,
      });
      setAiLoading(false);
      toast.success(`AI 已生成 ${newKnowledgePoints.length} 条知识点草稿，请逐条确认`);
    }, 1400);
  };

  const handleGenerateQuestions = (docId: string) => {
    setAiLoading(true);
    setTimeout(() => {
      const qids = QUESTIONS.filter((q) => q.relatedDocId === docId).map((q) => q.id);
      const fallback =
        qids.length > 0 ? qids : [`mock-q-${docId}-1`, `mock-q-${docId}-2`, `mock-q-${docId}-3`];
      const docQuestions = draft.docQuestions.map((d) =>
        d.docId === docId ? { ...d, questionIds: fallback, generated: true, confirmed: false } : d,
      );
      const questionEdits: Record<string, EditableTopicQuestion> = {
        ...(draft.questionEdits ?? {}),
      };
      fallback.forEach((qid, i) => {
        questionEdits[qid] = resolveTopicQuestion(qid, questionEdits, docId, i);
      });
      updateDraft({ docQuestions, questionEdits });
      setAiLoading(false);
      toast.success("已生成文档关联题目草稿");
    }, 1000);
  };

  const canNext = () => {
    if (step === 1)
      return draft.title.trim() && draft.learningGoal.trim() && draft.positions.length > 0;
    if (step === 2) return draft.docIds.length > 0;
    if (step === 3)
      return (
        draft.knowledgePoints.length > 0 &&
        draft.knowledgePoints.every(
          (item) => item.confirmed && item.title.trim() && item.summary.trim(),
        )
      );
    if (step === 4) return draft.docQuestions.every((d) => d.questionIds.length > 0);
    return true;
  };

  const handleSaveDraft = () => {
    saveDraft(draft, topicId);
    setDirty(false);
    toast.success("草稿已保存");
  };

  const handlePublish = () => {
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

  return (
    <div className="mx-auto w-full max-w-[1480px] pb-24">
      {/* 步骤条 */}
      <div className="mb-6 rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            返回专题维护
          </button>
          <span className="text-[12px] text-muted-foreground">
            {mode === "edit" ? "编辑专题" : "新建专题"}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <button
                key={label}
                type="button"
                onClick={() => n < step && setStep(n)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] transition-colors",
                  active && "bg-primary-soft font-medium text-primary",
                  done && "text-muted-foreground hover:bg-muted",
                  !active && !done && "text-muted-foreground/60",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-primary/20 text-primary",
                    !active && !done && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : n}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[12.5px] text-muted-foreground">{STEP_HINTS[step - 1]}</p>
      </div>

      {existing?.status === "已发布" && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft/50 px-3.5 py-3 text-[12.5px] text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">当前专题已有线上版本</p>
            <p className="mt-0.5 text-muted-foreground">
              本次修改先保存为未发布草稿；只有在最后一步提交发布后，员工端内容才会更新。
            </p>
          </div>
        </div>
      )}

      {/* 步骤内容 */}
      <div className="mb-6 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        {step === 1 && (
          <div className="space-y-5">
            <FieldLabel required>专题名称</FieldLabel>
            <Input
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="如：新员工运行专业入门、电气专业基础"
              className="text-[13px]"
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <FieldLabel required>所属专业</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTY_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateDraft({ specialty: s as TopicSpecialty })}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                        draft.specialty === s
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel required>业务场景</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  {SCENARIO_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateDraft({ scenario: s as TopicScenario })}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                        draft.scenario === s
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border hover:bg-muted",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <FieldLabel required>适用岗位</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {POSITION_OPTIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePosition(p)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[12px] transition-colors",
                      draft.positions.includes(p)
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel required hint="员工学完后要能识别什么、判断什么、执行什么">
                学习目标
              </FieldLabel>
              <textarea
                value={draft.learningGoal}
                onChange={(e) => updateDraft({ learningGoal: e.target.value })}
                rows={3}
                placeholder="学完后应掌握的核心能力与可解决的现场问题"
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div>
              <FieldLabel>专题简介</FieldLabel>
              <textarea
                value={draft.intro}
                onChange={(e) => updateDraft({ intro: e.target.value })}
                rows={2}
                placeholder="简短说明适用对象与专题价值"
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="搜索资料标题、标签…"
                className="h-8 max-w-xs text-[12px]"
              />
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setDocTypeFilter("all")}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11.5px]",
                    docTypeFilter === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  全部
                </button>
                {docTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocTypeFilter(t)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11.5px]",
                      docTypeFilter === t
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAiRecommendDocs}
                disabled={aiLoading}
                className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary-soft/50 px-3 py-1.5 text-[12px] text-primary hover:bg-primary-soft"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                AI 推荐资料
              </button>
            </div>

            <p className="text-[12px] text-muted-foreground">
              已选 <strong className="text-foreground">{draft.docIds.length}</strong> 份资料 ·
              学习资料池仅展示可学习、已入库的知识类资料
            </p>

            <div className="max-h-[min(28rem,50vh)] space-y-2 overflow-y-auto pr-1">
              {filteredPool.map((doc) => {
                const selected = draft.docIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDoc(doc.id)}
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
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">知识点维护</h3>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  待确认项优先展开；已确认项收起展示，修改后需重新确认。
                </p>
              </div>
              <button
                type="button"
                onClick={handleAiKnowledge}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary-soft/50 px-3 py-1.5 text-[12px] text-primary"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                AI 提炼知识点
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-divider bg-muted/20 px-3 py-2.5">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { value: "all", label: "全部", count: knowledgeStats.total },
                    { value: "pending", label: "待确认", count: knowledgeStats.pending },
                    { value: "confirmed", label: "已确认", count: knowledgeStats.confirmed },
                  ] as const
                ).map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setKnowledgeFilter(filter.value)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[11.5px] transition-colors",
                      knowledgeFilter === filter.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {filter.label} {filter.count}
                  </button>
                ))}
              </div>
              {knowledgeStats.pending > 0 && (
                <span className="text-[11.5px] text-warning-foreground">
                  仍有 {knowledgeStats.pending} 条待确认
                </span>
              )}
            </div>

            {aiKnowledgeResult && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-soft/30 px-3 py-2.5 text-[12px]">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>
                  本次生成 <strong>{aiKnowledgeResult.created}</strong> 条知识点
                  {aiKnowledgeResult.skipped > 0 && (
                    <>，已跳过 {aiKnowledgeResult.skipped} 条重复内容</>
                  )}
                  。AI 结果仅作为草稿，需人工确认后才能进入下一步。
                </span>
              </div>
            )}

            {draft.knowledgePoints.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
                暂无知识点，可手动添加或使用 AI 根据已选资料生成
              </div>
            ) : visibleKnowledgePoints.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-[13px] text-muted-foreground">
                当前筛选下暂无知识点
              </div>
            ) : (
              <ul className="space-y-2">
                {visibleKnowledgePoints.map((kp) => {
                  const expanded = !kp.confirmed || expandedKnowledgeIds.has(kp.id);
                  return (
                    <li
                      key={kp.id}
                      className={cn(
                        "rounded-lg border transition-colors",
                        kp.confirmed
                          ? "border-divider bg-card"
                          : "border-warning/30 bg-warning-soft/20",
                      )}
                    >
                      {!expanded ? (
                        <div className="flex min-h-[68px] items-center gap-3 px-3 py-2.5">
                          <span className="shrink-0 rounded-md bg-success-soft px-2 py-0.5 text-[10.5px] text-success">
                            已确认
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-medium text-foreground">
                              {kp.title}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                              {kp.summary}
                            </p>
                          </div>
                          <span className="hidden shrink-0 text-[10.5px] text-muted-foreground sm:inline">
                            {kp.source === "ai" ? "AI 提炼" : "人工维护"}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedKnowledgeIds((current) => new Set(current).add(kp.id))
                            }
                            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-primary hover:bg-primary-soft"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            展开编辑
                          </button>
                        </div>
                      ) : (
                        <div className="p-3">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-md px-2 py-0.5 text-[10.5px]",
                                  kp.confirmed
                                    ? "bg-success-soft text-success"
                                    : "bg-warning-soft text-warning-foreground",
                                )}
                              >
                                {kp.confirmed ? "已确认" : "待确认"}
                              </span>
                              <span className="text-[10.5px] text-muted-foreground">
                                {kp.source === "ai" ? "AI 提炼草稿" : "人工维护"}
                              </span>
                            </div>
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
                                confirmed: false,
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
                                confirmed: false,
                              })
                            }
                            rows={2}
                            className="w-full resize-none rounded-md border border-input bg-background px-2 py-1.5 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                if (!kp.title.trim() || !kp.summary.trim()) {
                                  toast.error("请先填写知识点名称和说明");
                                  return;
                                }
                                updateKnowledgePoint(kp.id, { confirmed: !kp.confirmed });
                                if (!kp.confirmed) {
                                  setExpandedKnowledgeIds((current) => {
                                    const next = new Set(current);
                                    next.delete(kp.id);
                                    return next;
                                  });
                                }
                              }}
                              className={cn(
                                "rounded-md border px-3 py-1.5 text-[11.5px] font-medium",
                                kp.confirmed
                                  ? "border-border text-muted-foreground hover:bg-muted"
                                  : "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                              )}
                            >
                              {kp.confirmed ? "取消确认" : "确认知识点"}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              onClick={() => {
                const id = `kp-manual-${Date.now()}`;
                updateDraft({
                  knowledgePoints: [
                    ...draft.knowledgePoints,
                    {
                      id,
                      title: "",
                      summary: "",
                      source: "manual",
                      confirmed: false,
                    },
                  ],
                });
                setKnowledgeFilter("all");
                setExpandedKnowledgeIds((current) => new Set(current).add(id));
              }}
              className="text-[12.5px] text-primary hover:underline"
            >
              + 手动添加知识点
            </button>
          </div>
        )}

        {step === 4 && (
          <TopicQuestionEditorPanel
            docIds={draft.docIds}
            docQuestions={draft.docQuestions}
            questionEdits={draft.questionEdits}
            aiLoading={aiLoading}
            onGenerate={handleGenerateQuestions}
            onUpdate={(patch) => updateDraft(patch)}
          />
        )}

        {step === 5 && (
          <div className="space-y-5">
            <div className="rounded-lg border border-primary/20 bg-primary-soft/20 p-4">
              <h3 className="mb-1 text-[16px] font-semibold text-foreground">{draft.title}</h3>
              <p className="text-[13px] text-muted-foreground">{draft.intro}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-md bg-card px-2 py-0.5">{draft.specialty}</span>
                <span className="rounded-md bg-card px-2 py-0.5">{draft.scenario}</span>
                {draft.positions.map((p) => (
                  <span key={p} className="rounded-md bg-card px-2 py-0.5">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <PreviewStat icon={BookOpen} label="资料" value={draft.docIds.length} />
              <PreviewStat icon={Target} label="知识点" value={draft.knowledgePoints.length} />
              <PreviewStat
                icon={ClipboardList}
                label="题目"
                value={draft.docQuestions.reduce((n, d) => n + d.questionIds.length, 0)}
              />
            </div>

            <div>
              <h4 className="mb-2 text-[13px] font-semibold">学习目标</h4>
              <p className="text-[13px] text-muted-foreground">{draft.learningGoal}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onPreview(draft)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[12.5px] hover:bg-muted"
              >
                <Eye className="h-3.5 w-3.5" />
                员工端预览
              </button>
              {topicId && (
                <Link
                  to="/learn/topic/$id"
                  params={{ id: topicId }}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-[12.5px] hover:bg-muted"
                >
                  <Eye className="h-3.5 w-3.5" />
                  打开现有专题页
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 始终可见的步骤操作，长卷面无需滚到底部 */}
      <div className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[1480px] -translate-x-1/2 items-center justify-between gap-3 rounded-[12px] border border-kb-border bg-white/95 px-3 py-2.5 shadow-[0_14px_40px_rgba(18,59,67,0.16)] backdrop-blur-md sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[8px] border border-kb-border px-3 text-[12.5px] text-kb-body transition-colors hover:bg-kb-surface"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">保存草稿</span>
            <span className="sm:hidden">保存</span>
          </button>
          <span className="hidden items-center gap-1.5 text-[11.5px] text-kb-muted md:inline-flex">
            {dirty ? (
              <AlertTriangle className="h-3.5 w-3.5 text-warning-foreground" />
            ) : (
              <Check className="h-3.5 w-3.5 text-success" />
            )}
            {step === 3 && knowledgeStats.pending > 0
              ? `还有 ${knowledgeStats.pending} 条知识点待确认`
              : dirty
                ? "有未确认保存的修改"
                : "草稿已保存"}{" "}
            · 当前为第 {step} 步「
            {STEPS[step - 1]}」
          </span>
        </div>

        <div className="flex shrink-0 gap-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex min-h-10 items-center gap-1 rounded-[8px] border border-kb-border px-3 text-[12.5px] text-kb-body transition-colors hover:bg-kb-surface"
            >
              <ChevronLeft className="h-4 w-4" />
              上一步
            </button>
          )}
          {step < 5 ? (
            <button
              type="button"
              onClick={() => {
                if (!canNext()) {
                  toast.error(
                    step === 3 ? "请补全并确认全部知识点后再进入下一步" : "请完成当前步骤必填项",
                  );
                  return;
                }
                setStep((s) => s + 1);
              }}
              disabled={!canNext()}
              title={
                !canNext()
                  ? step === 3
                    ? "请补全并确认全部知识点后再进入下一步"
                    : "请完成当前步骤必填项"
                  : undefined
              }
              className={cn(
                "inline-flex min-h-10 items-center gap-1 rounded-[8px] bg-primary px-4 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90",
                !canNext() && "cursor-not-allowed opacity-60 hover:bg-primary",
              )}
            >
              下一步
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[8px] bg-primary px-4 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Send className="h-3.5 w-3.5" />
              发布专题
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-divider bg-muted/20 px-4 py-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-primary" />
      <div className="text-[20px] font-semibold tabular-nums text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
