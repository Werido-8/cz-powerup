import { EXAM_TASK_META, EXAM_TEAMS, MOCK_DETAIL_NAMES } from "./examAnalytics";
import type {
  AnswerDetailItem,
  Paper,
  PersonAggregate,
  PersonExamRecord,
  QuestionType,
  RecordStatus,
} from "./examAdmin";

type ReviewQuestion = {
  no: number;
  stem: string;
  type: QuestionType;
  score: number;
  options?: { key: string; text: string }[];
  correctAnswer: string;
  analysis: string;
  evidence: string;
  sampleWrong?: string;
};

const TEAMS = EXAM_TEAMS.filter((item) => item.id !== "unassigned").map((item) => item.name);
const SPECIALTIES = ["运行专业", "电气专业", "继电保护", "涉网与调度"] as const;

const REVIEW_SHEET: ReviewQuestion[] = [
  {
    no: 1,
    stem: "AGC 投入后机组出力与调度指令偏差持续超过 ±3% 应优先采取?",
    type: "单选题",
    score: 10,
    options: [
      { key: "A", text: "立即手动大幅调整出力以消除偏差" },
      { key: "B", text: "检查 AGC 通道及测点,必要时切至手动" },
      { key: "C", text: "退出一次调频功能" },
      { key: "D", text: "申请停机检查" },
    ],
    correctAnswer: "B",
    analysis: "偏差持续超限应先排查通道与测点,避免盲目调整出力。",
    evidence: "AGC 控制器 SOP v2024.06 第 4.2 节",
    sampleWrong: "A",
  },
  {
    no: 2,
    stem: "一次调频的负荷响应应在频率越限后多少秒内开始?",
    type: "单选题",
    score: 10,
    options: [
      { key: "A", text: "3 秒内" },
      { key: "B", text: "8 秒内" },
      { key: "C", text: "15 秒内" },
      { key: "D", text: "30 秒内" },
    ],
    correctAnswer: "A",
    analysis: "一次调频要求快速响应,频率越限后应在 3 秒内开始动作。",
    evidence: "两细则考核知识点汇编 v2024.05 第 2.1 节",
    sampleWrong: "C",
  },
  {
    no: 3,
    stem: "PSS 投入的主要作用是?",
    type: "单选题",
    score: 10,
    options: [
      { key: "A", text: "提高机组额定出力" },
      { key: "B", text: "改善系统阻尼,抑制低频振荡" },
      { key: "C", text: "替代一次调频" },
      { key: "D", text: "降低厂用电" },
    ],
    correctAnswer: "B",
    analysis: "PSS 用于增加系统阻尼,抑制低频振荡,不能替代一次调频。",
    evidence: "PSS 励磁系统技术手册 v2023.12",
    sampleWrong: "C",
  },
  {
    no: 4,
    stem: "AGC 远方控制信号中断时,机组应?",
    type: "单选题",
    score: 10,
    options: [
      { key: "A", text: "保持当前出力不变" },
      { key: "B", text: "自动停机" },
      { key: "C", text: "按规程切至就地或保持安全状态" },
      { key: "D", text: "立即满出力运行" },
    ],
    correctAnswer: "C",
    analysis: "远方信号中断后应按规程切至就地控制,并保持机组处于安全运行状态。",
    evidence: "AGC 控制器 SOP v2024.06 第 5.3 节",
    sampleWrong: "A",
  },
  {
    no: 5,
    stem: "一次调频动作后,机组有功出力变化方向应与频率偏差方向?",
    type: "单选题",
    score: 10,
    options: [
      { key: "A", text: "相同" },
      { key: "B", text: "相反" },
      { key: "C", text: "无关" },
      { key: "D", text: "由调度指定" },
    ],
    correctAnswer: "B",
    analysis: "频率升高应减出力,频率降低应增出力,出力变化与频率偏差方向相反。",
    evidence: "两细则考核知识点汇编 v2024.05 第 2.2 节",
    sampleWrong: "A",
  },
  {
    no: 6,
    stem: "两细则中 AGC 考核的三项核心指标不包括下列哪一项?",
    type: "单选题",
    score: 10,
    options: [
      { key: "A", text: "调节速率" },
      { key: "B", text: "响应时间" },
      { key: "C", text: "调节精度" },
      { key: "D", text: "机组可用率" },
    ],
    correctAnswer: "D",
    analysis: "AGC 考核核心指标为调节速率、响应时间和调节精度,机组可用率不属于这三项。",
    evidence: "两细则考核知识点汇编 v2024.05 第 3.1 节",
    sampleWrong: "A",
  },
  {
    no: 7,
    stem: "主变停役前必须确认的安全措施包括哪些?",
    type: "多选题",
    score: 10,
    options: [
      { key: "A", text: "断开各侧断路器并确认" },
      { key: "B", text: "拉开各侧隔离开关" },
      { key: "C", text: "投入备用电源自投" },
      { key: "D", text: "验明无电压并装设接地线" },
    ],
    correctAnswer: "ABD",
    analysis: "停役需断开断路器、拉开隔离开关并验电接地。投入备自投与停役安全措施无关。",
    evidence: "厂站运行规程(华东 A 厂) v2024.07 第 6.3 节",
    sampleWrong: "AB",
  },
  {
    no: 8,
    stem: "频率越限后一次调频响应延迟,首先应检查哪些项目?",
    type: "多选题",
    score: 10,
    options: [
      { key: "A", text: "调频投退状态" },
      { key: "B", text: "一次调频死区设置" },
      { key: "C", text: "主变油温" },
      { key: "D", text: "频率测点质量" },
    ],
    correctAnswer: "ABD",
    analysis: "响应延迟应优先核对投退状态、死区整定和频率测点,主变油温与调频响应无直接关系。",
    evidence: "两细则考核知识点汇编 v2024.05 第 2.3 节",
    sampleWrong: "ABC",
  },
  {
    no: 9,
    stem: "一次调频死区设置过大,会导致机组在小扰动下不动作。",
    type: "判断题",
    score: 5,
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    correctAnswer: "T",
    analysis: "死区过大时,小幅频率偏差无法越过动作门槛,机组将不参与一次调频。",
    evidence: "两细则考核知识点汇编 v2024.05 第 2.3 节",
    sampleWrong: "F",
  },
  {
    no: 10,
    stem: "AGC 与一次调频可以同时投入,一般由一次调频优先响应频率扰动。",
    type: "判断题",
    score: 5,
    options: [
      { key: "T", text: "正确" },
      { key: "F", text: "错误" },
    ],
    correctAnswer: "T",
    analysis: "两者可同时投入。频率扰动由一次调频优先响应,AGC 负责跟踪调度指令。",
    evidence: "AGC 控制器 SOP v2024.06 第 5.1 节",
    sampleWrong: "F",
  },
  {
    no: 11,
    stem: "安控装置切机切负荷动作后,运行人员的汇报与处理流程是什么?",
    type: "简答题",
    score: 10,
    correctAnswer: "立即向调度汇报动作情况,确认装置动作正确性,按规程恢复系统,并做好记录与复盘。",
    analysis: "动作后须先汇报、再确认、后恢复,全过程留痕,不得自行改变运行方式后再补报。",
    evidence: "安控装置运行规程 v2023.09 第 5.4 节",
    sampleWrong: "先自行恢复负荷,待系统稳定后再向调度口头说明。",
  },
];

const rosterCache = new Map<string, PersonAggregate[]>();

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function pickWrongKeys(question: ReviewQuestion, seed: number) {
  if (question.sampleWrong) return question.sampleWrong;
  if (!question.options?.length) return question.correctAnswer;
  const wrongs = question.options.filter((item) => !question.correctAnswer.includes(item.key));
  if (wrongs.length === 0) return question.correctAnswer;
  return wrongs[seed % wrongs.length]!.key;
}

function markCorrectness(targetScore: number, seed: number) {
  const order = REVIEW_SHEET.map((_, index) => index).sort((a, b) => {
    const left = ((a + 1) * (seed + 7) * 13) % 89;
    const right = ((b + 1) * (seed + 7) * 13) % 89;
    return left - right;
  });
  const correct = REVIEW_SHEET.map(() => true);
  let score = REVIEW_SHEET.reduce((sum, item) => sum + item.score, 0);
  for (const index of order) {
    if (score <= targetScore) break;
    const next = score - REVIEW_SHEET[index]!.score;
    if (next >= Math.max(36, targetScore - 8)) {
      correct[index] = false;
      score = next;
    }
  }
  return correct;
}

export function buildMockAnswerSheet(seed: number, targetScore: number): AnswerDetailItem[] {
  const correctness = markCorrectness(targetScore, seed);
  return REVIEW_SHEET.map((question, index) => {
    const isCorrect = correctness[index] ?? true;
    const userKeys = isCorrect ? question.correctAnswer : pickWrongKeys(question, seed + index);
    return {
      no: question.no,
      stem: question.stem,
      type: question.type,
      options: question.options,
      correctAnswer: question.correctAnswer,
      userAnswer: userKeys,
      isCorrect,
      analysis: question.analysis,
      evidence: question.evidence,
      wrongTags: isCorrect ? [] : [question.type],
    };
  });
}

function scoresForPaper(submitted: number, averageScore: number, passRate: number | null) {
  if (submitted <= 0) return [];
  const passCount = Math.min(
    submitted,
    Math.max(0, Math.round(((passRate ?? 70) / 100) * submitted)),
  );
  const failCount = submitted - passCount;
  const scores: number[] = [];
  for (let i = 0; i < passCount; i += 1) {
    scores.push(62 + ((i * 7) % 30));
  }
  for (let i = 0; i < failCount; i += 1) {
    scores.push(44 + ((i * 5) % 15));
  }
  const currentAvg = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const delta = averageScore - currentAvg;
  return scores.map((value) => Math.round(Math.max(38, Math.min(96, value + delta))));
}

function recordStatus(submitted: boolean, index: number): RecordStatus {
  if (submitted) return "已提交";
  return index % 2 === 0 ? "进行中" : "未开始";
}

function teamName(paperId: string, index: number, paperTeams: string[]) {
  if (paperTeams.length) return paperTeams[index % paperTeams.length]!;
  return TEAMS[index % TEAMS.length]!;
}

export function buildExamRoster(paperId: string, paper?: Paper | null): PersonAggregate[] {
  const cached = rosterCache.get(paperId);
  if (cached) return cached;
  const assigned = paper?.assigned ?? 0;
  if (assigned <= 0) {
    rosterCache.set(paperId, []);
    return [];
  }

  const meta = EXAM_TASK_META[paperId];
  const paperTeams = (meta?.teamIds ?? [])
    .map((id) => EXAM_TEAMS.find((team) => team.id === id)?.name)
    .filter((name): name is string => Boolean(name && name !== "未归属"));
  const submittedCount = Math.min(paper?.finished ?? 0, assigned);
  const scoreList = scoresForPaper(submittedCount, paper?.avgScore || 68, meta?.passRate ?? null);
  const startDate = (meta?.startsAt ?? paper?.createdAt ?? "2026-06-12").slice(0, 10);
  const people: PersonAggregate[] = Array.from({ length: assigned }, (_, index) => {
    const submitted = index < submittedCount;
    const score = submitted ? (scoreList[index] ?? 68) : null;
    const hour = 8 + (index % 6);
    const minute = (12 + index * 3) % 60;
    const record: PersonExamRecord = {
      id: `${paperId}-${pad(index + 1)}-r1`,
      status: recordStatus(submitted, index),
      reason: "首次下发",
      score,
      correctRate: score,
      duration: submitted ? 18 + (index % 16) : null,
      assignedAt: `${startDate} 08:00`,
      submittedAt: submitted ? `${startDate} ${pad(hour)}:${pad(minute)}` : null,
      rule: "标准卷",
      answers: submitted ? buildMockAnswerSheet(index + 1, score ?? 68) : [],
    };
    return {
      id: `${paperId}-${pad(index + 1)}`,
      user: MOCK_DETAIL_NAMES[index % MOCK_DETAIL_NAMES.length] ?? `学员${index + 1}`,
      team: teamName(paperId, index, paperTeams),
      specialty: SPECIALTIES[index % SPECIALTIES.length]!,
      records: [record],
    };
  });

  rosterCache.set(paperId, people);
  return people;
}
