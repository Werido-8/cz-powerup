import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { TrainingResultView } from "@/components/training/training-result-view";
import { PageShell } from "@/components/workbench/PageShell";
import { QUESTIONS, type Question } from "@/lib/mock/data";
import { PRACTICE_RECORDS } from "@/lib/mock/learning-hub";
import type { SavedTrainingResult, TrainingResultQuestion } from "@/lib/training/result";
import { resolveTrainingResultUpstream, trainingResultStorageKey } from "@/lib/training/result";

export const Route = createFileRoute("/training/result/$id")({
  component: ResultPage,
  head: () => ({ meta: [{ title: "答题结果 · 训练中心" }] }),
});

const EXAM_RESULT_MOCKS: Record<
  string,
  { title: string; score: number; count: number; elapsed: number; submittedAt: string }
> = {
  "exam-复证巩固-20260601": {
    title: "复证巩固与调频控制考试",
    score: 80,
    count: 18,
    elapsed: 1420,
    submittedAt: "2026-06-01T14:28:00+08:00",
  },
  "exam-复证巩固-20260510": {
    title: "复证巩固与调频控制考试",
    score: 70,
    count: 18,
    elapsed: 1680,
    submittedAt: "2026-05-10T10:52:00+08:00",
  },
  "exam-AGC-20260605": {
    title: "AGC / 两细则取证复习考试",
    score: 72,
    count: 20,
    elapsed: 1560,
    submittedAt: "2026-06-05T15:26:00+08:00",
  },
  "exam-AGC-20260528": {
    title: "AGC / 两细则取证复习考试",
    score: 65,
    count: 20,
    elapsed: 1740,
    submittedAt: "2026-05-28T10:29:00+08:00",
  },
  "exam-PSS-20260608": {
    title: "PSS 参数与运行要求考试",
    score: 85,
    count: 16,
    elapsed: 1320,
    submittedAt: "2026-06-08T16:22:00+08:00",
  },
  "exam-黑启动-20260606": {
    title: "黑启动与事故处置考试",
    score: 78,
    count: 18,
    elapsed: 1580,
    submittedAt: "2026-06-06T11:16:00+08:00",
  },
  "exam-黑启动-20260520": {
    title: "黑启动与事故处置考试",
    score: 68,
    count: 18,
    elapsed: 1720,
    submittedAt: "2026-05-20T14:42:00+08:00",
  },
  "exam-厂用电-20260603": {
    title: "厂用电切换与运行监视考试",
    score: 92,
    count: 15,
    elapsed: 980,
    submittedAt: "2026-06-03T09:16:00+08:00",
  },
};

function questionSnapshot(question: Question): TrainingResultQuestion {
  return {
    id: question.id,
    type: { single: "单选题", multiple: "多选题", judge: "判断题", text: "简答题" }[question.type],
    stem: question.stem,
    options: question.options,
    answer: question.answer,
    analysis: question.analysis,
    knowledge: question.knowledgePoints.join(" / "),
  };
}

function mockQuestions(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const source = QUESTIONS[index % QUESTIONS.length];
    return { ...questionSnapshot(source), id: `${source.id}-mock-${index}` };
  });
}

function buildMockResult(
  id: string,
  meta: { title: string; score: number; count: number; elapsed: number; submittedAt?: string },
  sourceLabel: string,
  kind: SavedTrainingResult["kind"],
): SavedTrainingResult & { questions: TrainingResultQuestion[] } {
  const questions = mockQuestions(meta.count);
  const correctCount = Math.round((meta.count * meta.score) / 100);
  const wrongCount = Math.max(0, meta.count - correctCount);
  const wrongIds = questions.slice(0, wrongCount).map((question) => question.id);
  const answers = Object.fromEntries(
    questions.map((question, index) => {
      const isWrong = index < wrongCount;
      if (!isWrong) return [question.id, question.answer];
      const keys = question.options?.map((option) => option.key) ?? [];
      const correctKeys = Array.isArray(question.answer) ? question.answer : [question.answer];
      return [question.id, keys.find((key) => !correctKeys.includes(key)) ?? ""];
    }),
  );
  return {
    wrongIds,
    total: meta.count,
    answers,
    qids: questions.map((question) => question.id),
    elapsed: meta.elapsed,
    mode: kind === "formal" || kind === "custom" ? "exam" : "practice",
    kind,
    title: meta.title || decodeURIComponent(id),
    sourceLabel,
    submittedAt: meta.submittedAt,
    passScore: kind === "practice" || kind === "file" || kind === "review" ? null : 60,
    durationLimit: kind === "formal" || kind === "custom" ? 30 : 0,
    score: kind === "practice" || kind === "file" || kind === "review" ? undefined : meta.score,
    scoreMode: kind === "formal" || kind === "custom" ? "fixed" : undefined,
    totalScore: kind === "formal" || kind === "custom" ? 100 : undefined,
    questions,
  };
}

function getFallbackResult(id: string) {
  const exam = EXAM_RESULT_MOCKS[id];
  if (exam) return buildMockResult(id, exam, "正式考试", "formal");

  const record = PRACTICE_RECORDS.find((item) => item.id === id);
  if (record) {
    return buildMockResult(
      id,
      {
        title: record.title,
        score: record.accuracy,
        count: record.questionCount,
        elapsed: Number.parseInt(record.duration, 10) * 60 || 0,
        submittedAt: record.completedAt,
      },
      record.source === "模拟考试" ? "自主组卷" : "专项练习",
      record.source === "模拟考试" ? "custom" : "practice",
    );
  }

  return buildMockResult(
    id,
    { title: decodeURIComponent(id), score: 80, count: 10, elapsed: 8 * 60 },
    "专项练习",
    "practice",
  );
}

function ResultPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [stored, setStored] = useState<SavedTrainingResult>();

  useEffect(() => {
    const raw = sessionStorage.getItem(trainingResultStorageKey(id));
    if (!raw) {
      setStored(undefined);
      return;
    }
    try {
      setStored(JSON.parse(raw) as SavedTrainingResult);
    } catch {
      sessionStorage.removeItem(trainingResultStorageKey(id));
      setStored(undefined);
    }
  }, [id]);

  const result = useMemo(() => {
    if (!stored) return getFallbackResult(id);
    const questions =
      stored.questions ??
      stored.qids
        .map((qid) => QUESTIONS.find((question) => question.id === qid))
        .filter((question): question is Question => Boolean(question))
        .map(questionSnapshot);
    return { ...stored, questions };
  }, [id, stored]);

  const goBack = () => {
    const upstream = resolveTrainingResultUpstream(result);
    switch (upstream.type) {
      case "file":
        navigate({
          to: "/knowledge/file/$fileId",
          params: { fileId: upstream.fileId },
          search: { kbId: upstream.knowledgeBaseId },
        });
        return;
      case "topic":
        navigate({ to: "/learn/topic/$id", params: { id: upstream.topicId } });
        return;
      case "doc":
        navigate({ to: "/learn/doc/$id", params: { id: upstream.docId } });
        return;
      case "exam":
        navigate({ to: "/training/exam" });
        return;
      case "custom-exam":
        navigate({ to: "/training/custom-exam" });
        return;
      case "wrong":
        navigate({ to: "/training/wrong" });
        return;
      case "practice":
        navigate({ to: "/training/practice" });
        return;
      case "records":
        navigate({ to: "/training/records", search: { source: "all" } });
    }
  };

  return (
    <PageShell compact mainClassName="py-2">
      <TrainingResultView
        result={result}
        onBack={goBack}
        onViewWrong={() => navigate({ to: "/training/wrong" })}
      />
    </PageShell>
  );
}
