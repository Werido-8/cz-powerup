export type ExamTaskStatus = "draft" | "scheduled" | "inProgress" | "ended";
export type ExamScoreMode = "fixed" | "variable" | "unscored";

export interface ExamTaskScope {
  teamIds: string[];
  teamNames: string[];
  specialtyIds: string[];
  specialtyNames: string[];
  assignedCount: number;
}

export interface ExamTask {
  id: string;
  paperId: string;
  name: string;
  goal: string;
  category: string;
  status: ExamTaskStatus;
  startsAt: string | null;
  endsAt: string | null;
  /** 固定总分才可稳定计算平均分和通过率。 */
  scoreMode: ExamScoreMode;
  totalScore: number | null;
  scope: ExamTaskScope;
  submittedCount: number;
  completionRate: number | null;
  averageScore: number | null;
  passRate: number | null;
  creatorName: string;
  updatedAt: string;
}

export interface ExamTaskQuery {
  keyword?: string;
  status?: ExamTaskStatus | "all";
  timeRange?: "all" | "30d" | "90d";
  teamId?: string;
  specialtyId?: string;
}

export interface ExamPersonResult {
  id: string;
  name: string;
  teamName: string;
  specialtyName: string;
  positionName: string;
  status: "notStarted" | "inProgress" | "submitted" | "expired";
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
  answerRoutePersonId: string | null;
}

export interface ExamQuestionPerformance {
  id: string;
  knowledgePoint: string;
  questionCount: number;
  respondentCount: number;
  errorRate: number | null;
  sampleSufficient: boolean;
}

export interface ExamDetail {
  task: ExamTask;
  people: ExamPersonResult[];
  peopleTotal: number;
  questionPerformance: ExamQuestionPerformance[];
  scoreDistribution: Array<{ label: string; count: number }>;
}

export interface ExamAnalyticsQuery {
  startDate: string;
  endDate: string;
  teamIds?: string[];
  specialtyIds?: string[];
  examIds?: string[];
  examSeriesId?: string;
}

export type ComparisonKind = "comparable" | "period" | "none";

export interface AnalyticsComparison {
  kind: ComparisonKind;
  scoreDelta: number | null;
  passRateDelta: number | null;
  sampleCount: number;
  label: string;
  reason?: string;
}

export interface ExamAnalyticsSummary {
  finishedExamCount: number;
  assignedCount: number;
  submittedCount: number;
  completionRate: number | null;
  averageScore: number | null;
  passRate: number | null;
  comparableSampleCount: number;
  scoreDelta: number | null;
  passRateDelta: number | null;
  comparisonLabel?: string;
}

export interface AnalyticsTrendPoint {
  examId: string;
  examName: string;
  label: string;
  endedAt: string;
  averageScore: number | null;
  passRate: number | null;
  assignedCount: number;
  submittedCount: number;
  normalizedToHundred: boolean;
}

export interface AnalyticsBreakdownItem {
  id: string;
  name: string;
  assignedCount: number;
  submittedCount: number;
  completionRate: number | null;
  averageScore: number | null;
  passRate: number | null;
  scoreDelta: number | null;
  sampleCount: number;
}

export interface AnalyticsWeaknessItem {
  id: string;
  knowledgePoint: string;
  specialtyName: string;
  topicName: string;
  respondentCount: number;
  questionCount: number;
  errorRate: number | null;
  errorRateDelta: number | null;
  relatedExamCount: number;
  sampleSufficient: boolean;
}

export interface ExamAnalyticsResult {
  query: ExamAnalyticsQuery;
  scopeNote: string;
  excludedUnreviewedExamCount: number;
  summary: ExamAnalyticsSummary;
  comparison: AnalyticsComparison;
  trend: AnalyticsTrendPoint[];
  teamBreakdown: AnalyticsBreakdownItem[];
  specialtyBreakdown: AnalyticsBreakdownItem[];
  weaknesses: AnalyticsWeaknessItem[];
}

export interface ExamFilterOption {
  id: string;
  name: string;
}

export interface ExamAnalyticsOptions {
  teams: ExamFilterOption[];
  specialties: ExamFilterOption[];
  examSeries: ExamFilterOption[];
}
