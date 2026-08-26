import { useEffect, useMemo, useState } from "react";
import { CheckSquare2, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StemCell } from "@/components/common/ellipsis-tooltip";
import {
  BANK_QUESTIONS,
  PAPER_QUESTION_TYPES,
  type Difficulty,
  type Paper,
  type QuestionType,
} from "@/lib/mock/examAdmin";
import { AssignPanel } from "@/components/exam/assign-panel";

function diffClass(d: string) {
  return d === "易"
    ? "bg-success-soft text-success"
    : d === "中"
      ? "bg-warning-soft text-warning-foreground"
      : "bg-destructive/10 text-destructive";
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function AddQuestionDialog({
  open,
  type,
  excludedIds = [],
  onClose,
  onAdd,
}: {
  open: boolean;
  type?: QuestionType;
  excludedIds?: string[];
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">(type ?? "all");
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");
  const [knowledgeFilter, setKnowledgeFilter] = useState("all");
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds]);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setKeyword("");
    setTypeFilter(type ?? "all");
    setDifficultyFilter("all");
    setKnowledgeFilter("all");
  }, [open, type]);

  const enabledPool = useMemo(
    () => BANK_QUESTIONS.filter((question) => question.status === "启用"),
    [],
  );

  const knowledgeOptions = useMemo(
    () =>
      [
        ...new Set(
          enabledPool
            .filter((question) => !type || question.type === type)
            .map((question) => question.knowledge),
        ),
      ].sort((a, b) => a.localeCompare(b, "zh-CN")),
    [enabledPool, type],
  );

  const pool = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("zh-CN");
    return enabledPool.filter((question) => {
      const matchesType = type
        ? question.type === type
        : typeFilter === "all" || question.type === typeFilter;
      const matchesDifficulty =
        difficultyFilter === "all" || question.difficulty === difficultyFilter;
      const matchesKnowledge = knowledgeFilter === "all" || question.knowledge === knowledgeFilter;
      const matchesKeyword =
        !normalizedKeyword ||
        question.stem.toLocaleLowerCase("zh-CN").includes(normalizedKeyword) ||
        question.knowledge.toLocaleLowerCase("zh-CN").includes(normalizedKeyword) ||
        question.source.toLocaleLowerCase("zh-CN").includes(normalizedKeyword);
      return matchesType && matchesDifficulty && matchesKnowledge && matchesKeyword;
    });
  }, [difficultyFilter, enabledPool, keyword, knowledgeFilter, type, typeFilter]);

  const selectableVisibleIds = pool
    .filter((question) => !excluded.has(question.id))
    .map((question) => question.id);
  const allVisibleSelected =
    selectableVisibleIds.length > 0 && selectableVisibleIds.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) selectableVisibleIds.forEach((id) => next.delete(id));
      else selectableVisibleIds.forEach((id) => next.add(id));
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[min(86dvh,760px)] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-[#EDF3F5] px-6 py-5 pr-14">
          <DialogTitle className="flex items-center gap-2.5 text-[17px] text-[#1F3440]">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-primary-soft text-primary">
              <CheckSquare2 className="h-4 w-4" />
            </span>
            {type ? `添加${type}` : "直接添加题目"}
          </DialogTitle>
          <DialogDescription className="pl-[42px] text-[12.5px]">
            {type
              ? `从正式题库筛选${type}，支持一次选择多道题目。`
              : "选择已启用题目，确认后将按题型自动分组并补充缺少的模块。"}
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 border-b border-[#EDF3F5] bg-[#FAFCFD] px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(240px,1.6fr)_minmax(130px,0.8fr)_minmax(120px,0.7fr)_minmax(150px,0.9fr)]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-[#6B7F88]">搜索题目</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索题干、知识点或来源"
                  className="h-9 w-full rounded-[8px] border border-[#DCE8EA] bg-white pl-9 pr-3 text-[12.5px] text-[#1F3440] outline-none transition-colors placeholder:text-[#9AAAB0] focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-[#6B7F88]">题型</span>
              <select
                value={type ?? typeFilter}
                disabled={!!type}
                onChange={(event) => setTypeFilter(event.target.value as QuestionType | "all")}
                className="h-9 w-full rounded-[8px] border border-[#DCE8EA] bg-white px-3 text-[12.5px] text-[#425B66] outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-[#F1F5F6] disabled:text-[#6B7F88]"
              >
                {!type && <option value="all">全部题型</option>}
                {(type ? [type] : PAPER_QUESTION_TYPES).map((questionType) => (
                  <option key={questionType} value={questionType}>
                    {questionType}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-[#6B7F88]">难度</span>
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as Difficulty | "all")}
                className="h-9 w-full rounded-[8px] border border-[#DCE8EA] bg-white px-3 text-[12.5px] text-[#425B66] outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">全部难度</option>
                <option value="易">易</option>
                <option value="中">中</option>
                <option value="难">难</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-medium text-[#6B7F88]">知识点</span>
              <select
                value={knowledgeFilter}
                onChange={(event) => setKnowledgeFilter(event.target.value)}
                className="h-9 w-full rounded-[8px] border border-[#DCE8EA] bg-white px-3 text-[12.5px] text-[#425B66] outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              >
                <option value="all">全部知识点</option>
                {knowledgeOptions.map((knowledge) => (
                  <option key={knowledge} value={knowledge}>
                    {knowledge}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
          <div className="min-w-[720px] overflow-hidden rounded-[10px] border border-[#DCE8EA]">
            <table className="w-full whitespace-nowrap text-[12.5px]">
              <thead className="sticky top-0 z-[1] bg-[#F5FAFB] text-[11.5px] text-muted-foreground">
                <tr>
                  <Th className="w-12">
                    <input
                      type="checkbox"
                      aria-label="选择当前筛选结果中的全部题目"
                      checked={allVisibleSelected}
                      disabled={selectableVisibleIds.length === 0}
                      onChange={toggleVisible}
                      className="h-4 w-4 cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed"
                    />
                  </Th>
                  <Th className="min-w-[280px]">题干</Th>
                  <Th>题型</Th>
                  <Th>知识点</Th>
                  <Th>难度</Th>
                  <Th className="w-20">状态</Th>
                </tr>
              </thead>
              <tbody>
                {pool.map((question) => {
                  const isExcluded = excluded.has(question.id);
                  return (
                    <tr
                      key={question.id}
                      className="border-t border-[#EDF3F5] transition-colors hover:bg-[#FAFCFD]"
                    >
                      <Td>
                        <input
                          type="checkbox"
                          aria-label={`选择题目：${question.stem}`}
                          checked={selected.has(question.id)}
                          disabled={isExcluded}
                          onChange={() => toggle(question.id)}
                          className="h-4 w-4 cursor-pointer accent-[var(--primary)] disabled:cursor-not-allowed"
                        />
                      </Td>
                      <StemCell text={question.stem} maxWidthClass="max-w-[360px]" />
                      <Td className="text-muted-foreground">{question.type}</Td>
                      <Td>
                        <Badge variant="secondary" className="font-normal">
                          {question.knowledge}
                        </Badge>
                      </Td>
                      <Td>
                        <span
                          className={`rounded-[4px] px-1.5 py-0.5 text-[11px] ${diffClass(question.difficulty)}`}
                        >
                          {question.difficulty}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={
                            isExcluded ? "text-[11px] text-[#9AAAB0]" : "text-[11px] text-success"
                          }
                        >
                          {isExcluded ? "已添加" : "可添加"}
                        </span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {pool.length === 0 && (
              <div className="flex min-h-40 flex-col items-center justify-center bg-white px-6 text-center">
                <Search className="mb-2 h-5 w-5 text-[#9AAAB0]" />
                <p className="text-[13px] font-medium text-[#425B66]">未找到符合条件的题目</p>
                <p className="mt-1 text-[11.5px] text-[#9AAAB0]">请调整搜索词或筛选条件</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#EDF3F5] bg-white px-6 py-4">
          <div className="flex items-center gap-3 text-[12.5px] text-muted-foreground">
            <span>
              已选择 <strong className="font-semibold text-primary">{selected.size}</strong> 题
            </span>
            <span className="text-[#DCE8EA]">|</span>
            <span>当前筛选 {pool.length} 题</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 rounded-[8px] border border-[#DCE8EA] px-4 text-[13px] text-[#425B66] transition-colors hover:bg-[#F5FAFB]"
            >
              取消
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => {
                onAdd([...selected]);
                setSelected(new Set());
                onClose();
              }}
              className="h-9 rounded-[8px] bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              确认添加{selected.size > 0 ? `（${selected.size}）` : ""}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AssignDialog({
  paper,
  onClose,
  showDraft = true,
}: {
  paper: Paper | null;
  onClose: () => void;
  showDraft?: boolean;
}) {
  return (
    <Dialog open={!!paper} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>试卷下发</DialogTitle>
          <DialogDescription>{paper?.name} · 选择下发对象</DialogDescription>
        </DialogHeader>
        {paper && (
          <AssignPanel
            paperName={paper.name}
            onCancel={onClose}
            showDraft={showDraft}
            onAssign={(count) => {
              toast.success(`已向 ${count} 人下发试卷`);
              onClose();
            }}
            onDraft={() => {
              toast.success("已暂存草稿");
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
