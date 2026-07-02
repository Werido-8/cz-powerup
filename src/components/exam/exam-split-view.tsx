import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  PAPERS,
  getAggregatesForPaper,
  type Paper,
} from "@/lib/mock/examAdmin";
import { cn } from "@/lib/utils";
import { Search, Send, Sparkles, Plus, Pencil, Eye, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type ExamSplitViewProps = {
  onGenerate: () => void;
  onNew: () => void;
  onEdit: (p: Paper) => void;
  onAssign: (p: Paper) => void;
  onPreview: (p: Paper) => void;
};

function finishRate(p: Paper): number | null {
  if (!p.assigned) return null;
  return Math.round((p.finished / p.assigned) * 100);
}

function paperStatusTag(status: Paper["status"]) {
  switch (status) {
    case "已下发":
      return "bg-primary-soft text-primary";
    case "已结束":
      return "bg-[#E8F6F2] text-[#19A974]";
    case "草稿":
    default:
      return "bg-[#F0F5F6] text-[#607681]";
  }
}

function recordStatusTag(status: string) {
  switch (status) {
    case "已提交":
      return "bg-[#E8F6F2] text-[#19A974]";
    case "进行中":
      return "bg-warning-soft text-warning-foreground";
    case "未开始":
    case "已过期":
    default:
      return "bg-[#F0F5F6] text-[#91A3AA]";
  }
}

const PERSON_TABLE_COLS =
  "grid grid-cols-[minmax(64px,1fr)_minmax(72px,1fr)_minmax(64px,0.9fr)_68px_52px_60px_56px_64px] items-center gap-2";

export function ExamSplitView({
  onGenerate,
  onNew,
  onEdit,
  onAssign,
  onPreview,
}: ExamSplitViewProps) {
  const [keyword, setKeyword] = useState("");
  const [selectedId, setSelectedId] = useState(PAPERS[0]?.id ?? "");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return PAPERS;
    return PAPERS.filter((p) =>
      [p.name, p.category, p.goal, p.status].some((f) => f.toLowerCase().includes(kw)),
    );
  }, [keyword]);

  const selected = PAPERS.find((p) => p.id === selectedId) ?? filtered[0];
  const aggregates = selected ? getAggregatesForPaper(selected.id) : [];
  const rate = selected ? finishRate(selected) : null;

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索考试名称…"
            className="h-8 pl-8 text-[12px]"
          />
        </div>
        <button
          type="button"
          onClick={onGenerate}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Sparkles className="h-3.5 w-3.5" /> 智能组卷
        </button>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[12.5px] hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" /> 新建试卷
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(280px,340px)_1fr]">
        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-[#EDF3F5] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#425B66]">
            历次考试（{filtered.length}）
          </div>
          <div className="scrollbar-thin flex-1 overflow-y-auto bg-white">
            {filtered.map((p) => {
              const active = selected?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "w-full border-b border-[#EDF3F5] py-4 pr-4 text-left transition-colors",
                    "border-l-4",
                    active
                      ? "border-l-primary bg-[#EAF7F9] pl-3"
                      : "border-l-transparent bg-white pl-3 hover:bg-[#F6FBFC]",
                  )}
                >
                  <div className="truncate text-[14px] font-semibold leading-snug text-[#1F3440]">
                    {p.name}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[11px] font-medium",
                        paperStatusTag(p.status),
                      )}
                    >
                      {p.status}
                    </span>
                    <span className="text-[12px] text-[#607681]">
                      参与 {p.assigned ?? 0} 人
                    </span>
                    <span className="text-[12px] text-[#607681]">{p.questionCount} 题</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#91A3AA]">创建 {p.createdAt}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
          {selected ? (
            <>
              <div className="border-b border-border px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold">{selected.name}</h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {selected.goal} · {selected.category} · {selected.duration} 分钟 · {selected.status}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                      <StatPill label="参与" value={`${selected.assigned} 人`} />
                      <StatPill label="完成" value={`${selected.finished} 人${rate != null ? ` (${rate}%)` : ""}`} />
                      <StatPill label="平均正确率" value={selected.avgCorrect ? `${selected.avgCorrect}%` : "—"} highlight />
                      <StatPill label="平均分" value={selected.avgScore ? `${selected.avgScore} 分` : "—"} />
                      <StatPill label="平均用时" value={selected.avgDuration ? `${selected.avgDuration} 分` : "—"} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <ActionBtn icon={Pencil} label="编辑" onClick={() => onEdit(selected)} primary />
                    <ActionBtn icon={Send} label="下发" onClick={() => onAssign(selected)} />
                    <ActionBtn icon={Eye} label="预览" onClick={() => onPreview(selected)} />
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3">
                <div className="mb-3 text-[13px] font-semibold text-[#425B66]">答题人员</div>
                {aggregates.length === 0 ? (
                  <p className="text-[13px] text-[#91A3AA]">暂无答题记录（草稿或未下发）</p>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] border border-[#DCE8EA]">
                    <div className="overflow-x-auto">
                      <div className="min-w-[680px]">
                        <div
                          className={cn(
                            PERSON_TABLE_COLS,
                            "border-b border-[#EDF3F5] bg-[#F5FAFB] px-4 py-2.5 text-[12px] font-medium text-[#425B66]",
                          )}
                        >
                          <span>姓名</span>
                          <span>班组</span>
                          <span>岗位</span>
                          <span>状态</span>
                          <span className="text-right">得分</span>
                          <span className="text-right">正确率</span>
                          <span className="text-right">用时</span>
                          <span className="text-right">操作</span>
                        </div>
                        <div className="scrollbar-thin max-h-[calc(100vh-420px)] overflow-y-auto">
                          {aggregates.map((a) => {
                            const latest = a.records[0];
                            const status = latest?.status ?? "—";
                            return (
                              <Link
                                key={a.id}
                                to="/exam-admin/paper/$paperId/person/$personId"
                                params={{ paperId: selected.id, personId: a.id }}
                                className={cn(
                                  PERSON_TABLE_COLS,
                                  "group border-b border-[#EDF3F5] px-4 text-[13px] transition-colors last:border-b-0 hover:bg-[#F6FBFC]",
                                )}
                              >
                                <span className="truncate py-3.5 font-medium text-[#1F3440] group-hover:text-primary">
                                  {a.user}
                                </span>
                                <span className="truncate py-3.5 text-[#607681]">{a.team}</span>
                                <span className="py-3.5">
                                  <span className="inline-flex rounded-full bg-[#F0F5F6] px-2 py-0.5 text-[11px] text-[#607681]">
                                    {a.position}
                                  </span>
                                </span>
                                <span className="py-3.5">
                                  <span
                                    className={cn(
                                      "inline-flex h-6 items-center rounded-full px-2 text-[11px] font-medium",
                                      recordStatusTag(status),
                                    )}
                                  >
                                    {status}
                                  </span>
                                </span>
                                <span className="py-3.5 text-right tabular-nums font-medium text-[#1F3440]">
                                  {latest?.score ?? "—"}
                                </span>
                                <span className="py-3.5 text-right tabular-nums text-[#607681]">
                                  {latest?.correctRate != null ? `${latest.correctRate}%` : "—"}
                                </span>
                                <span className="py-3.5 text-right tabular-nums text-[#607681]">
                                  {latest?.duration != null ? `${latest.duration}分` : "—"}
                                </span>
                                <span className="flex items-center justify-end gap-0.5 py-3.5 text-[12px] text-[#91A3AA] transition-colors group-hover:text-primary">
                                  查看
                                  <ChevronRight className="h-4 w-4" />
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-[13px] text-muted-foreground">
              请选择左侧考试查看详情
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5", highlight ? "bg-primary-soft text-primary" : "bg-muted/60 text-foreground")}>
      {label} <strong>{value}</strong>
    </span>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  primary,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium",
        primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border hover:bg-muted",
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
