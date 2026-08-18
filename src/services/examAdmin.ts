import {
  getAggregatesForPaper,
  PAPERS,
  type Paper,
  type PersonAggregate,
} from "@/lib/mock/examAdmin";
import {
  EXAM_SERIES,
  EXAM_SPECIALTIES,
  EXAM_TASK_META,
  EXAM_TEAMS,
  MOCK_ANALYTICS_EXAMS,
  MOCK_ANALYTICS_WEAKNESSES,
  MOCK_DETAIL_NAMES,
  type MockAnalyticsSegment,
} from "@/lib/mock/examAnalytics";
import { safeRate } from "@/lib/exam-admin/format";
import type {
  AnalyticsBreakdownItem,
  AnalyticsComparison,
  ExamAnalyticsOptions,
  ExamAnalyticsQuery,
  ExamAnalyticsResult,
  ExamDetail,
  ExamPersonResult,
  ExamTask,
  ExamTaskQuery,
} from "@/lib/exam-admin/types";

const TEAM_NAMES = new Map(EXAM_TEAMS.map((item) => [item.id, item.name]));
const SPECIALTY_NAMES = new Map(EXAM_SPECIALTIES.map((item) => [item.id, item.name]));

function round(value: number, digits = 1) {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function mapPaperToTask(paper: Paper): ExamTask {
  const meta = EXAM_TASK_META[paper.id];
  const assignedCount = paper.assigned;
  const submittedCount = paper.finished;
  const hasResult = submittedCount > 0;
  const scoreMode = meta?.scoreMode ?? "fixed";
  const hasComparableScore = scoreMode === "fixed";

  return {
    id: paper.id,
    paperId: paper.id,
    name: paper.name,
    goal: paper.goal,
    category: paper.category,
    status:
      meta?.status ??
      (paper.status === "草稿" ? "draft" : paper.status === "已结束" ? "ended" : "inProgress"),
    startsAt: meta?.startsAt ?? null,
    endsAt: meta?.endsAt ?? null,
    scoreMode,
    totalScore: hasComparableScore ? (meta?.totalScore ?? 100) : null,
    scope: {
      teamIds: meta?.teamIds ?? [],
      teamNames: (meta?.teamIds ?? []).map((id) => TEAM_NAMES.get(id) ?? "未归属"),
      specialtyIds: meta?.specialtyIds ?? [],
      specialtyNames: (meta?.specialtyIds ?? []).map((id) => SPECIALTY_NAMES.get(id) ?? "未归属"),
      assignedCount,
    },
    submittedCount,
    completionRate: safeRate(submittedCount, assignedCount),
    averageScore: hasResult && hasComparableScore ? paper.avgScore : null,
    passRate: hasResult && hasComparableScore ? (meta?.passRate ?? null) : null,
    creatorName: meta?.creatorName ?? "培训管理员",
    updatedAt: meta?.updatedAt ?? paper.createdAt,
  };
}

const ALL_TASKS = PAPERS.map(mapPaperToTask).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

function inTaskTimeRange(task: ExamTask, range: ExamTaskQuery["timeRange"]) {
  if (!range || range === "all") return true;
  const taskDate = (task.startsAt ?? task.updatedAt).slice(0, 10);
  const boundary = range === "30d" ? "2026-05-20" : "2026-03-21";
  return taskDate >= boundary;
}

export async function listExamTasks(query: ExamTaskQuery = {}): Promise<ExamTask[]> {
  const keyword = query.keyword?.trim().toLowerCase() ?? "";
  return ALL_TASKS.filter((task) => {
    if (query.status && query.status !== "all" && task.status !== query.status) return false;
    if (query.teamId && !task.scope.teamIds.includes(query.teamId)) return false;
    if (query.specialtyId && !task.scope.specialtyIds.includes(query.specialtyId)) return false;
    if (!inTaskTimeRange(task, query.timeRange)) return false;
    if (!keyword) return true;
    return [
      task.name,
      task.goal,
      task.category,
      ...task.scope.teamNames,
      ...task.scope.specialtyNames,
    ]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
}

export async function getExamTask(examId: string): Promise<ExamTask | null> {
  return ALL_TASKS.find((task) => task.id === examId) ?? null;
}

function mapRecordStatus(status: string): ExamPersonResult["status"] {
  if (status === "已提交") return "submitted";
  if (status === "进行中") return "inProgress";
  if (status === "已过期") return "expired";
  return "notStarted";
}

function specialtyForPerson(person: PersonAggregate) {
  if (person.position.includes("继保")) return "继电保护";
  if (person.position.includes("检修")) return "电气专业";
  return "运行专业";
}

function mapAggregate(person: PersonAggregate): ExamPersonResult {
  const latest = person.records[0];
  const submitted = latest?.status === "已提交";
  return {
    id: person.id,
    name: person.user,
    teamName: person.team || "未归属",
    specialtyName: specialtyForPerson(person),
    positionName: person.position,
    status: mapRecordStatus(latest?.status ?? "未开始"),
    submittedAt: latest?.submittedAt ?? null,
    score: submitted ? latest.score : null,
    passed: submitted && latest.score != null ? latest.score >= 60 : null,
    answerRoutePersonId: submitted ? person.id : null,
  };
}

function createFallbackPeople(task: ExamTask, existing: ExamPersonResult[]) {
  const limit = Math.min(task.scope.assignedCount, MOCK_DETAIL_NAMES.length);
  const submittedTarget = Math.min(task.submittedCount, limit);
  const sortedExisting = [...existing]
    .slice(0, limit)
    .sort((a, b) => Number(b.status === "submitted") - Number(a.status === "submitted"));
  const people = sortedExisting.map((person, index) => {
    const shouldSubmit = index < submittedTarget;
    if (!shouldSubmit) {
      return person.status === "submitted"
        ? {
            ...person,
            status: "notStarted" as const,
            submittedAt: null,
            score: null,
            passed: null,
            answerRoutePersonId: null,
          }
        : person;
    }
    if (person.status === "submitted") return person;
    const score = Math.max(52, Math.min(96, (task.averageScore ?? 76) + ((index % 5) - 2) * 4));
    return {
      ...person,
      status: "submitted" as const,
      submittedAt: `${task.endsAt?.slice(0, 10) ?? task.updatedAt.slice(0, 10)} 16:${String(
        10 + index,
      ).padStart(2, "0")}`,
      score,
      passed: score >= 60,
      answerRoutePersonId: null,
    };
  });
  const existingNames = new Set(people.map((person) => person.name));
  let submittedSeen = people.filter((person) => person.status === "submitted").length;

  for (const [index, name] of MOCK_DETAIL_NAMES.entries()) {
    if (people.length >= limit) break;
    if (existingNames.has(name)) continue;
    const shouldSubmit = submittedSeen < submittedTarget;
    const score = shouldSubmit
      ? Math.max(52, Math.min(96, (task.averageScore ?? 76) + ((index % 5) - 2) * 4))
      : null;
    if (shouldSubmit) submittedSeen += 1;
    people.push({
      id: `fixture-${task.id}-${index}`,
      name,
      teamName: task.scope.teamNames[index % Math.max(task.scope.teamNames.length, 1)] ?? "未归属",
      specialtyName:
        task.scope.specialtyNames[index % Math.max(task.scope.specialtyNames.length, 1)] ??
        "未归属",
      positionName: index % 4 === 0 ? "值班长" : "值班员",
      status: shouldSubmit ? "submitted" : index % 2 === 0 ? "inProgress" : "notStarted",
      submittedAt: shouldSubmit
        ? `${task.endsAt?.slice(0, 10) ?? task.updatedAt.slice(0, 10)} 16:${String(10 + index).padStart(2, "0")}`
        : null,
      score,
      passed: score == null ? null : score >= 60,
      answerRoutePersonId: null,
    });
  }
  return people;
}

export async function getExamDetail(examId: string): Promise<ExamDetail | null> {
  const task = await getExamTask(examId);
  if (!task) return null;
  const aggregates = getAggregatesForPaper(task.paperId).map(mapAggregate);
  const people = createFallbackPeople(task, aggregates).map((person) =>
    task.scoreMode === "fixed" ? person : { ...person, score: null, passed: null },
  );
  const weaknessRows = MOCK_ANALYTICS_WEAKNESSES.filter((item) => item.examId === examId);
  const questionPerformance = (
    weaknessRows.length ? weaknessRows : MOCK_ANALYTICS_WEAKNESSES.slice(0, 4)
  ).map((item) => ({
    id: item.id,
    knowledgePoint: item.knowledgePoint,
    questionCount: item.questionCount,
    respondentCount: item.respondentCount,
    errorRate: item.errorRate,
    sampleSufficient: item.respondentCount >= 10,
  }));
  const submitted = task.submittedCount;
  const excellent = Math.round(submitted * 0.22);
  const good = Math.round(submitted * 0.42);
  const pass = Math.max(0, Math.round(submitted * 0.24));

  const scoreDistribution =
    task.scoreMode === "fixed"
      ? [
          { label: "90-100", count: excellent },
          { label: "80-89", count: good },
          { label: "60-79", count: pass },
          { label: "0-59", count: Math.max(0, submitted - excellent - good - pass) },
        ]
      : [];

  return {
    task,
    people,
    peopleTotal: task.scope.assignedCount,
    questionPerformance,
    scoreDistribution,
  };
}

export async function getExamAnalyticsOptions(): Promise<ExamAnalyticsOptions> {
  return {
    teams: EXAM_TEAMS,
    specialties: EXAM_SPECIALTIES,
    examSeries: EXAM_SERIES,
  };
}

function isDateInRange(date: string, query: ExamAnalyticsQuery) {
  return date >= query.startDate && date <= query.endDate;
}

function filterSegments(segments: MockAnalyticsSegment[], query: ExamAnalyticsQuery) {
  return segments.filter((segment) => {
    if (query.teamIds?.length && !query.teamIds.includes(segment.teamId)) return false;
    if (query.specialtyIds?.length && !query.specialtyIds.includes(segment.specialtyId))
      return false;
    return true;
  });
}

function aggregateSegments(segments: MockAnalyticsSegment[]) {
  const assignedCount = segments.reduce((sum, item) => sum + item.assignedCount, 0);
  const submittedCount = segments.reduce((sum, item) => sum + item.submittedCount, 0);
  const scoreTotal = segments.reduce((sum, item) => sum + item.scoreTotal, 0);
  const passedCount = segments.reduce((sum, item) => sum + item.passedCount, 0);
  return {
    assignedCount,
    submittedCount,
    scoreTotal,
    passedCount,
    completionRate: safeRate(submittedCount, assignedCount),
    averageScore: submittedCount > 0 ? scoreTotal / submittedCount : null,
    passRate: safeRate(passedCount, submittedCount),
  };
}

function buildBreakdown(
  segments: MockAnalyticsSegment[],
  dimension: "team" | "specialty",
): AnalyticsBreakdownItem[] {
  const grouped = new Map<string, MockAnalyticsSegment[]>();
  for (const segment of segments) {
    const id = dimension === "team" ? segment.teamId : segment.specialtyId;
    grouped.set(id, [...(grouped.get(id) ?? []), segment]);
  }
  return Array.from(grouped.entries())
    .map(([id, items]) => {
      const aggregate = aggregateSegments(items);
      return {
        id,
        name: (dimension === "team" ? TEAM_NAMES.get(id) : SPECIALTY_NAMES.get(id)) ?? "未归属",
        assignedCount: aggregate.assignedCount,
        submittedCount: aggregate.submittedCount,
        completionRate: aggregate.completionRate == null ? null : round(aggregate.completionRate),
        averageScore: aggregate.averageScore == null ? null : round(aggregate.averageScore),
        passRate: aggregate.passRate == null ? null : round(aggregate.passRate),
        scoreDelta: null,
        sampleCount: aggregate.submittedCount,
      };
    })
    .sort((a, b) => (a.completionRate ?? -1) - (b.completionRate ?? -1));
}

function buildComparison(
  query: ExamAnalyticsQuery,
  selectedRuns: typeof MOCK_ANALYTICS_EXAMS,
): AnalyticsComparison {
  if (!query.examSeriesId) {
    return {
      kind: "none",
      scoreDelta: null,
      passRateDelta: null,
      sampleCount: 0,
      label: "暂无可比数据",
      reason: "需选择同一考试系列，并使用统一量纲与可比人群。",
    };
  }
  if (query.teamIds?.length || query.specialtyIds?.length) {
    return {
      kind: "none",
      scoreDelta: null,
      passRateDelta: null,
      sampleCount: 0,
      label: "暂无可比数据",
      reason: "当前班组或专业筛选后，mock 接口未返回同一人群前后期样本。",
    };
  }
  const latest = [...selectedRuns]
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt))
    .find(
      (run) =>
        run.comparison && selectedRuns.some((item) => item.id === run.comparison?.previousExamId),
    );
  if (!latest?.comparison || latest.comparison.sampleCount < 5) {
    return {
      kind: "none",
      scoreDelta: null,
      passRateDelta: null,
      sampleCount: latest?.comparison?.sampleCount ?? 0,
      label: "暂无可比数据",
      reason: "同一考试系列至少需要两期且具备足够的共同参考人员。",
    };
  }
  return {
    kind: "comparable",
    scoreDelta: round(
      latest.comparison.currentAverageScore - latest.comparison.previousAverageScore,
    ),
    passRateDelta: round(latest.comparison.currentPassRate - latest.comparison.previousPassRate),
    sampleCount: latest.comparison.sampleCount,
    label: "同系列可比提升",
  };
}

export async function getExamAnalytics(query: ExamAnalyticsQuery): Promise<ExamAnalyticsResult> {
  const runsInRange = MOCK_ANALYTICS_EXAMS.filter((run) => {
    if (!isDateInRange(run.endedAt, query)) return false;
    if (query.examSeriesId && run.seriesId !== query.examSeriesId) return false;
    if (query.examIds?.length && !query.examIds.includes(run.id)) return false;
    return true;
  });
  const excludedUnreviewedExamCount = runsInRange.filter((run) => !run.reviewed).length;
  const selectedRuns = runsInRange
    .filter((run) => run.reviewed)
    .map((run) => ({ ...run, segments: filterSegments(run.segments, query) }))
    .filter((run) => run.segments.length > 0);
  const segments = selectedRuns.flatMap((run) => run.segments);
  const totals = aggregateSegments(segments);
  const comparison = buildComparison(query, selectedRuns);
  const selectedExamIds = new Set(selectedRuns.map((run) => run.id));

  return {
    query,
    scopeNote: `统计范围：${query.startDate} 至 ${query.endDate}；仅统计已结束且已完成阅卷的考试，共 ${selectedRuns.length} 场。`,
    excludedUnreviewedExamCount,
    summary: {
      finishedExamCount: selectedRuns.length,
      assignedCount: totals.assignedCount,
      submittedCount: totals.submittedCount,
      completionRate: totals.completionRate == null ? null : round(totals.completionRate),
      averageScore: totals.averageScore == null ? null : round(totals.averageScore),
      passRate: totals.passRate == null ? null : round(totals.passRate),
      comparableSampleCount: comparison.sampleCount,
      scoreDelta: comparison.scoreDelta,
      passRateDelta: comparison.passRateDelta,
      comparisonLabel: comparison.label,
    },
    comparison,
    trend: selectedRuns
      .map((run) => {
        const aggregate = aggregateSegments(run.segments);
        return {
          examId: run.id,
          examName: run.name,
          label: run.endedAt.slice(5),
          endedAt: run.endedAt,
          averageScore: aggregate.averageScore == null ? null : round(aggregate.averageScore),
          passRate: aggregate.passRate == null ? null : round(aggregate.passRate),
          assignedCount: aggregate.assignedCount,
          submittedCount: aggregate.submittedCount,
          normalizedToHundred: run.normalizedToHundred,
        };
      })
      .sort((a, b) => a.endedAt.localeCompare(b.endedAt)),
    teamBreakdown: buildBreakdown(segments, "team"),
    specialtyBreakdown: buildBreakdown(segments, "specialty"),
    weaknesses: MOCK_ANALYTICS_WEAKNESSES.filter((item) => {
      if (!selectedExamIds.has(item.examId)) return false;
      if (query.specialtyIds?.length && !query.specialtyIds.includes(item.specialtyId))
        return false;
      return true;
    })
      .map((item) => ({
        id: item.id,
        knowledgePoint: item.knowledgePoint,
        specialtyName: SPECIALTY_NAMES.get(item.specialtyId) ?? "未归属",
        topicName: item.topicName,
        respondentCount: item.respondentCount,
        questionCount: item.questionCount,
        errorRate: item.errorRate,
        errorRateDelta:
          item.previousErrorRate == null ? null : round(item.errorRate - item.previousErrorRate),
        relatedExamCount: 1,
        sampleSufficient: item.respondentCount >= 10,
      }))
      .sort((a, b) => (b.errorRate ?? -1) - (a.errorRate ?? -1)),
  };
}
