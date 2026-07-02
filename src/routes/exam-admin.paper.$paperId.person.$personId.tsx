import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { ExamAnswerList } from "@/components/exam/exam-answer-list";
import {
  PAPERS,
  getAggregatesForPaper,
  type PersonExamRecord,
} from "@/lib/mock/examAdmin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exam-admin/paper/$paperId/person/$personId")({
  component: PersonRecordPage,
  head: () => ({ meta: [{ title: "答卷详情 · 考试管理" }] }),
});

function recordStatusTag(s: string) {
  switch (s) {
    case "已提交":
      return "bg-[#E8F6F2] text-[#19A974]";
    case "进行中":
      return "bg-warning-soft text-warning-foreground";
    default:
      return "bg-[#F0F5F6] text-[#91A3AA]";
  }
}

function PersonRecordPage() {
  const { paperId, personId } = Route.useParams();
  const paper = PAPERS.find((p) => p.id === paperId);
  if (!paper) throw notFound();

  const people = getAggregatesForPaper(paperId);
  const person = people.find((p) => p.id === personId) ?? people[0];
  if (!person) throw notFound();

  const [viewRecordId, setViewRecordId] = useState<string | null>(null);
  const record: PersonExamRecord | undefined =
    person.records.find((r) => r.id === viewRecordId) ?? person.records[0];

  const submittedCount = useMemo(
    () => people.filter((p) => p.records[0]?.status === "已提交").length,
    [people],
  );
  const unsubmittedCount = people.length - submittedCount;

  return (
    <PageShell>
      <div className="relative -mx-6 -my-7 min-h-[calc(100vh-64px)] bg-[#F5FAFB] px-6 py-7 lg:-mx-8 lg:px-8">
        <div className="mx-auto w-full max-w-[1760px]">
          <div className="mb-5">
            <Link
              to="/exam-admin"
              className="inline-flex items-center gap-1 text-[12px] text-[#91A3AA] transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 返回考试管理
            </Link>
            <h1 className="mt-2 text-[20px] font-semibold text-[#1F3440]">{paper.name}</h1>
            <p className="mt-1 text-[13px] text-[#607681]">
              答卷详情 · {person.user} · {person.team} · {person.position}
            </p>
          </div>

          <div className="grid min-h-[calc(100vh-220px)] gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Left: person nav — same highlight as exam list */}
            <aside className="flex max-h-[calc(100vh-220px)] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.04)]">
              <div className="shrink-0 border-b border-[#EDF3F5] px-4 py-3">
                <div className="text-[14px] font-semibold text-[#1F3440]">
                  本卷人员（{people.length}）
                </div>
                <div className="mt-1 text-[12px] text-[#91A3AA]">
                  已交 {submittedCount} / 未交 {unsubmittedCount}
                </div>
              </div>

              <div className="scrollbar-thin flex-1 overflow-y-auto">
                {people.map((p) => {
                  const latest = p.records[0];
                  const active = p.id === person.id;
                  const status = latest?.status ?? "未开始";

                  return (
                    <Link
                      key={p.id}
                      to="/exam-admin/paper/$paperId/person/$personId"
                      params={{ paperId, personId: p.id }}
                      className={cn(
                        "relative block border-b border-[#EDF3F5] px-4 py-3 transition-colors",
                        active
                          ? "bg-[#EAF7F9] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-primary"
                          : "bg-white hover:bg-[#F6FBFC]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={cn(
                            "text-[14px] font-semibold",
                            active ? "text-primary" : "text-[#1F3440]",
                          )}
                        >
                          {p.user}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {p.records.length > 1 && (
                            <span className="inline-flex h-5 items-center rounded-full bg-primary-soft px-2 text-[10px] font-medium text-primary">
                              历史 {p.records.length} 次
                            </span>
                          )}
                          <span
                            className={cn(
                              "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-medium",
                              recordStatusTag(status),
                            )}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="mt-1 text-[12px] text-[#91A3AA]">
                        {p.team} · {p.position}
                      </div>

                      <div className="mt-1.5 text-[12px] text-[#607681]">
                        {latest?.score != null ? `${latest.score} 分` : "—"}
                        {latest?.correctRate != null && (
                          <span className="ml-3">正确率 {latest.correctRate}%</span>
                        )}
                      </div>

                      <div className="mt-1 text-[11px] text-[#91A3AA]">
                        {latest?.submittedAt
                          ? `提交 ${latest.submittedAt}`
                          : latest?.assignedAt
                            ? `下发 ${latest.assignedAt}`
                            : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>

            {/* Right: answer detail */}
            <div className="flex max-h-[calc(100vh-220px)] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.04)]">
              <div className="shrink-0 border-b border-[#EDF3F5] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-[16px] font-semibold text-[#1F3440]">{person.user}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#607681]">
                      <span>{person.team}</span>
                      <span className="text-[#DCE8EA]">·</span>
                      <span>{person.position}</span>
                      {record?.assignedAt && (
                        <>
                          <span className="text-[#DCE8EA]">·</span>
                          <span>下发 {record.assignedAt}</span>
                        </>
                      )}
                      {record?.submittedAt && <span>提交 {record.submittedAt}</span>}
                    </div>
                  </div>

                  {record && (
                    <div className="flex flex-wrap items-center gap-4">
                      <span
                        className={cn(
                          "inline-flex h-7 items-center rounded-full px-3 text-[12px] font-medium",
                          recordStatusTag(record.status),
                        )}
                      >
                        {record.status}
                      </span>
                      <ScoreMetric label="得分" value={record.score ?? "—"} />
                      <ScoreMetric
                        label="正确率"
                        value={record.correctRate != null ? `${record.correctRate}%` : "—"}
                        accent
                      />
                      <ScoreMetric
                        label="用时"
                        value={record.duration != null ? `${record.duration} 分钟` : "—"}
                      />
                    </div>
                  )}
                </div>

                {person.records.length > 1 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#EDF3F5] pt-3">
                    {person.records.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setViewRecordId(r.id)}
                        className={cn(
                          "rounded-[6px] border px-2.5 py-1 text-[11px] transition-colors",
                          (viewRecordId ?? person.records[0].id) === r.id
                            ? "border-primary/30 bg-primary-soft text-primary"
                            : "border-[#DCE8EA] text-[#607681] hover:bg-[#F5FAFB]",
                        )}
                      >
                        {r.reason} · {r.submittedAt ?? "未提交"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
                {record?.answers?.length ? (
                  <ExamAnswerList items={record.answers} />
                ) : (
                  <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                    <p className="text-[13px] text-[#91A3AA]">暂无提交记录或答卷未作答</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

/** 参考图三：标签在上、数值在下 */
function ScoreMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-[11px] text-[#91A3AA]">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-[18px] font-semibold tabular-nums leading-none",
          accent ? "text-primary" : "text-[#1F3440]",
        )}
      >
        {value}
      </div>
    </div>
  );
}
