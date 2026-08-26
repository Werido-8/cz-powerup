import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Save, ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import {
  PaperQuestionList,
  PaperQuestionSummary,
  PaperTypeToolbar,
  usePaperQuestionGroups,
} from "@/components/exam/paper-question-list";
import { AddQuestionDialog, AssignDialog } from "@/components/exam/exam-dialogs";
import { PaperBasicInfoPanel, PAPER_SPLIT_PANEL_H } from "@/components/exam/paper-side-panel";
import { cn } from "@/lib/utils";
import {
  EMPTY_EDITOR_GROUPS,
  getPaperQuestionGroups,
  type Difficulty,
  type EditorGroup,
  type ExamGoal,
  type Paper,
  type QuestionType,
} from "@/lib/mock/examAdmin";

export interface PaperBasicInfo {
  name: string;
  goal: ExamGoal;
  category: string;
  specialty: string;
  duration: string;
  passLine: string;
  /** 固定总分试卷的目标分值。 */
  totalScore?: string;
  /** 未设置时兼容旧草稿，按固定总分处理。 */
  scoreMode?: "fixed" | "variable" | "unscored";
  difficulty: Difficulty | "";
  note: string;
}

const EMPTY_BASIC_INFO: PaperBasicInfo = {
  name: "",
  goal: "取证复习",
  category: "",
  specialty: "",
  duration: "",
  passLine: "60",
  totalScore: "100",
  difficulty: "",
  note: "",
};

type ExamPaperEditorPageProps = {
  paper: Paper | null;
  initialGroups?: EditorGroup[];
  initialBasicInfo?: Partial<PaperBasicInfo>;
  backTo?: string;
  onSave?: (basic: PaperBasicInfo, groups: EditorGroup[]) => void;
};

export function ExamPaperEditorPage({
  paper,
  initialGroups,
  initialBasicInfo,
  backTo = "/exam-admin",
  onSave,
}: ExamPaperEditorPageProps) {
  const isEdit = !!paper;
  const seedGroups =
    initialGroups ?? (paper ? getPaperQuestionGroups(paper.id) : EMPTY_EDITOR_GROUPS);

  const {
    groups,
    collapsed,
    toggleCollapse,
    moveQuestion,
    removeQuestion,
    moveGroup,
    removeGroup,
    addGroup,
    resetGroups,
    expandAll,
    summary,
    appendFromBank,
  } = usePaperQuestionGroups(seedGroups);

  const [basicInfo, setBasicInfo] = useState<PaperBasicInfo>(() => {
    if (paper) {
      return {
        name: paper.name,
        goal: paper.goal,
        category: paper.category,
        specialty: "运行专业",
        duration: String(paper.duration),
        passLine: "60",
        difficulty: "中",
        note: "",
        ...initialBasicInfo,
      };
    }
    return { ...EMPTY_BASIC_INFO, ...initialBasicInfo };
  });

  const [addType, setAddType] = useState<QuestionType | null>(null);
  const [assignPaper, setAssignPaper] = useState<Paper | null>(null);
  const initRef = useRef("");

  useEffect(() => {
    const key = paper?.id ?? "new";
    if (initRef.current === key) return;
    initRef.current = key;
    resetGroups(seedGroups);
    expandAll();
  }, [paper?.id, resetGroups, expandAll, seedGroups]);

  const updateBasicInfo = <K extends keyof PaperBasicInfo>(key: K, value: PaperBasicInfo[K]) => {
    setBasicInfo((prev) => ({ ...prev, [key]: value }));
  };

  const questionCount = groups.reduce((s, g) => s + g.questions.length, 0);
  const totalScore = groups.reduce((s, g) => s + g.questions.length * g.perScore, 0);

  const validateBeforeSave = () => {
    if (!basicInfo.name.trim()) {
      toast.error("请填写试卷名称");
      return false;
    }
    return true;
  };

  const handleDraft = () => {
    if (!validateBeforeSave()) return;
    onSave?.(basicInfo, groups);
    toast.success(isEdit ? "试卷已暂存" : "试卷已暂存为草稿");
  };

  const handleSaveAndAssign = () => {
    if (!validateBeforeSave()) return;
    onSave?.(basicInfo, groups);
    if (paper) {
      setAssignPaper({ ...paper, name: basicInfo.name.trim() });
    } else {
      toast.error("请先暂存试卷后再下发");
    }
  };

  const title = isEdit ? `编辑试卷 · ${paper.name}` : "新建试卷";

  return (
    <PageShell compact>
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={backTo}
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 考试管理
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="flex min-w-0 items-center gap-2 truncate text-[16px] font-semibold">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{title}</span>
          </h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to={backTo}
            className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted"
          >
            返回
          </Link>
          <button
            type="button"
            onClick={handleDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted"
          >
            <Save className="h-4 w-4" /> 暂存试卷
          </button>
          <button
            type="button"
            onClick={handleSaveAndAssign}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Send className="h-4 w-4" /> 保存试卷并下发
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
        <div
          className={cn("min-h-0 overflow-y-auto overscroll-contain pr-0.5", PAPER_SPLIT_PANEL_H)}
        >
          <div className="space-y-4 pb-2">
            <PaperTypeToolbar groups={groups} onAddGroup={addGroup} />
            <PaperQuestionSummary summary={summary} />
            <PaperQuestionList
              groups={groups}
              collapsed={collapsed}
              onToggleCollapse={toggleCollapse}
              onAdd={setAddType}
              onMoveQuestion={moveQuestion}
              onRemoveQuestion={removeQuestion}
              onMoveGroup={moveGroup}
              onRemoveGroup={(type) => {
                if (groups.length <= 1) {
                  toast.warning("至少保留一种题型");
                  return;
                }
                removeGroup(type);
              }}
            />
          </div>
        </div>

        <PaperBasicInfoPanel
          basicInfo={basicInfo}
          onChange={updateBasicInfo}
          questionCount={questionCount}
          totalScore={totalScore}
        />
      </div>

      <AddQuestionDialog
        open={addType !== null}
        type={addType ?? undefined}
        onClose={() => setAddType(null)}
        onAdd={(ids) => {
          if (addType) appendFromBank(addType, ids);
          toast.success(`已添加 ${ids.length} 题`);
        }}
      />

      <AssignDialog paper={assignPaper} onClose={() => setAssignPaper(null)} showDraft={false} />
    </PageShell>
  );
}

export type { PaperBasicInfo as ExamPaperBasicInfo };
