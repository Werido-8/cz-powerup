import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ClipboardList,
  Target,
  BookMarked,
  ListChecks,
  TrendingUp,
  Flame,
  ChevronRight,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { useMockStore } from "@/lib/mock/store";
import {
  TRAINING_OVERVIEW,
  FEATURE_CARDS,
  getVisiblePracticeRecords,
} from "@/lib/mock/learning-hub";
import {
  PageHeader,
  OverviewStatCard,
  FeatureCard,
  ModulePanel,
  learningBtnRadius,
} from "@/components/learning/ui";
import { TrainingRecentOverviewCard } from "@/components/learning/training-recent-overview";
import { getFeatureHeaderTheme } from "@/components/learning/topic-art";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/")({
  component: TrainingHome,
  head: () => ({ meta: [{ title: "题库训练 · 涉网运行能力智能提升平台" }] }),
});

const FEATURE_ICONS = {
  practice: Target,
  exam: ClipboardList,
  wrong: BookMarked,
};

const FEATURE_TAGS: Record<string, string[]> = {
  practice: ["定向强化"],
  exam: ["限时测评"],
  wrong: ["错因分析"],
};

function TrainingHome() {
  const { state } = useMockStore();
  const wrongCount = state.wrong.length || TRAINING_OVERVIEW.wrongToReview;
  const overview = {
    ...TRAINING_OVERVIEW,
    wrongToReview: wrongCount,
  };
  const recentRecords = getVisiblePracticeRecords();

  return (
    <PageShell>
      <PageHeader
        title="题库训练"
        subtitle="专项练习、正式考试与错题巩固，自主安排练题节奏"
      />

      {/* 训练概览：3 指标卡 + 最近练习长卡，单行不换行 */}
      <section className="mb-5 flex flex-nowrap items-stretch gap-3">
        <OverviewStatCard
          className="min-w-0 flex-[1_1_0%]"
          label="本周答题"
          value={overview.weeklyAnswers}
          hint="近 7 日累计"
          detail={`日均约 ${Math.round(overview.weeklyAnswers / 7)} 题`}
          icon={<ListChecks className="h-[18px] w-[18px]" />}
          tint={0}
          emphasis="primary"
        />
        <OverviewStatCard
          className="min-w-0 flex-[1_1_0%]"
          label="正确率"
          value={`${overview.accuracy}%`}
          hint="全部练习均值"
          detail={overview.accuracy >= 80 ? "表现良好，继续保持" : "可针对薄弱点加练"}
          icon={<TrendingUp className="h-[18px] w-[18px]" />}
          tint={1}
          emphasis="primary"
        />
        <OverviewStatCard
          className="min-w-0 flex-[1_1_0%]"
          label="连续练习"
          value={`${overview.streakDays} 天`}
          hint="连续打卡"
          detail={
            overview.streakDays >= 7
              ? "坚持不错，继续保持"
              : overview.streakDays >= 3
                ? "再坚持几天养成习惯"
                : "今日练一题延续连续"
          }
          icon={<Flame className="h-[18px] w-[18px]" />}
          tint={2}
          emphasis="primary"
        />
        <TrainingRecentOverviewCard
          className="min-w-0 flex-[2.4_1_0%]"
          records={recentRecords}
        />
      </section>

      {/* 训练入口 */}
      <ModulePanel>
        <div className="border-b border-[#DCE8EA] bg-primary-soft/30 px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-foreground">训练入口</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">专项练习、模拟考试与错题巩固</p>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURE_CARDS.filter((card) => card.id !== "quizsets").map((card) => {
            const Icon = FEATURE_ICONS[card.id as keyof typeof FEATURE_ICONS];
            const stats =
              card.id === "wrong"
                ? card.stats.map((s) =>
                    s.label === "待复习" ? { ...s, value: `${wrongCount} 题` } : s,
                  )
                : card.stats;

            return (
              <Link key={card.id} to={card.to} className="block">
                <FeatureCard
                  title={card.title}
                  desc={card.desc}
                  stats={stats}
                  headerTheme={getFeatureHeaderTheme(card.id)}
                  tags={FEATURE_TAGS[card.id] ?? []}
                  action={
                    <span
                      className={cn(
                        "inline-flex w-full items-center justify-center gap-1.5 border border-primary/20 bg-primary-soft/50 px-3 py-2 text-[12.5px] font-medium text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                        learningBtnRadius,
                      )}
                    >
                      {card.action} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  }
                  icon={<Icon className="h-5 w-5" />}
                />
              </Link>
            );
          })}
        </div>
      </ModulePanel>
    </PageShell>
  );
}
