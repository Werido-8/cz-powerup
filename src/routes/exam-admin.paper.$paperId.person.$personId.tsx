import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { ExamAnswerList } from "@/components/exam/exam-answer-list";
import { Input } from "@/components/ui/input";
import { PAPERS, getAggregatesForPaper } from "@/lib/mock/examAdmin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exam-admin/paper/$paperId/person/$personId")({
  component: PersonRecordPage,
  head: () => ({ meta: [{ title: "答卷详情 · 考试管理" }] }),
});

function statusClass(status: string) {
  if (status === "已提交") return "bg-success-soft text-success";
  if (status === "进行中") return "bg-primary-soft text-primary";
  return "bg-kb-surface text-kb-muted";
}

function PersonRecordPage() {
  const { paperId, personId } = Route.useParams();
  const paper = PAPERS.find((item) => item.id === paperId);
  if (!paper) throw notFound();

  const people = getAggregatesForPaper(paperId);
  const person = people.find((item) => item.id === personId);
  if (!person) throw notFound();

  const record = person.records[0];
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "pending">("all");

  const submittedCount = useMemo(
    () => people.filter((item) => item.records[0]?.status === "已提交").length,
    [people],
  );
  const filteredPeople = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return people.filter((item) => {
      const latest = item.records[0]?.status ?? "未开始";
      if (statusFilter === "submitted" && latest !== "已提交") return false;
      if (statusFilter === "pending" && latest === "已提交") return false;
      if (!normalized) return true;
      return [item.user, item.team, item.specialty].join(" ").toLowerCase().includes(normalized);
    });
  }, [keyword, people, statusFilter]);

  return (
    <PageShell compact mainClassName="flex min-h-0 flex-col overflow-hidden px-5 py-4 lg:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col">
        <div className="mb-3 shrink-0">
          <Link
            to="/exam-admin/exam/$examId"
            params={{ examId: paperId }}
            className="inline-flex items-center gap-1 text-[12px] text-kb-muted hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 返回考试详情
          </Link>
          <h1 className="mt-1 text-[18px] font-semibold text-kb-heading">{paper.name}</h1>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[252px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-kb-border bg-white">
            <div className="shrink-0 border-b border-divider px-3 py-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[13px] font-semibold text-kb-heading">人员完成情况</h2>
                <span className="text-[11px] text-kb-muted">
                  已交 {submittedCount} / {people.length}
                </span>
              </div>
              <div className="relative mt-2.5">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索姓名或班组"
                  className="h-8 rounded-[6px] border-kb-border bg-kb-surface pl-8 text-[12px] shadow-none"
                />
              </div>
              <div className="mt-2 flex gap-1">
                {(
                  [
                    ["all", "全部"],
                    ["submitted", "已交"],
                    ["pending", "未交"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      "h-7 rounded-[5px] px-2 text-[11px] font-medium",
                      statusFilter === value
                        ? "bg-primary text-white"
                        : "bg-kb-surface text-kb-muted hover:text-kb-heading",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {filteredPeople.length === 0 ? (
                <p className="px-3 py-8 text-center text-[12px] text-kb-muted">
                  没有符合条件的人员
                </p>
              ) : (
                filteredPeople.map((item) => {
                  const latest = item.records[0];
                  const active = item.id === person.id;
                  const status = latest?.status ?? "未开始";
                  return (
                    <Link
                      key={item.id}
                      to="/exam-admin/paper/$paperId/person/$personId"
                      params={{ paperId, personId: item.id }}
                      className={cn(
                        "flex items-center justify-between gap-2 border-b border-divider px-3 py-2.5 last:border-b-0",
                        active ? "bg-primary-soft" : "hover:bg-kb-surface",
                      )}
                    >
                      <div className="min-w-0">
                        <div
                          className={cn(
                            "truncate text-[13px] font-medium",
                            active ? "text-primary" : "text-kb-heading",
                          )}
                        >
                          {item.user}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] text-kb-muted">
                          {item.team} {item.specialty}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={cn(
                            "inline-flex h-5 items-center rounded px-1.5 text-[10px] font-medium",
                            statusClass(status),
                          )}
                        >
                          {status}
                        </span>
                        <div className="mt-1 text-[12px] font-semibold tabular-nums text-kb-heading">
                          {latest?.score != null ? `${latest.score}` : "-"}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-kb-border bg-white">
            <header className="shrink-0 border-b border-divider px-6 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[16px] font-semibold text-kb-heading">{person.user}</div>
                  <div className="mt-1 text-[12.5px] text-kb-muted">
                    {person.team} {person.specialty}
                    {record?.submittedAt ? `  提交于 ${record.submittedAt}` : ""}
                  </div>
                </div>
                <dl className="flex flex-wrap items-end gap-6">
                  <ScoreMetric label="状态" value={record?.status ?? "未开始"} />
                  <ScoreMetric
                    label="得分"
                    value={record?.score != null ? String(record.score) : "-"}
                  />
                  <ScoreMetric
                    label="正确率"
                    value={record?.correctRate != null ? `${record.correctRate}%` : "-"}
                  />
                  <ScoreMetric
                    label="用时"
                    value={record?.duration != null ? `${record.duration} 分钟` : "-"}
                  />
                </dl>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-2">
              {record?.answers?.length ? (
                <ExamAnswerList items={record.answers} />
              ) : (
                <div className="grid min-h-[280px] place-items-center text-center">
                  <div>
                    <p className="text-[14px] font-medium text-kb-heading">尚未提交答卷</p>
                    <p className="mt-1 text-[12.5px] text-kb-muted">该人员还未完成本次考试。</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function ScoreMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-kb-muted">{label}</dt>
      <dd className="mt-0.5 text-[16px] font-semibold tabular-nums text-kb-heading">{value}</dd>
    </div>
  );
}
