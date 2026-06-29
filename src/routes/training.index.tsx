import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ClipboardList,
  Target,
  BookMarked,
  Sparkles,
  Flame,
  ChevronRight,
  Calendar,
  TrendingUp,
  ListChecks,
  FileSearch,
  RotateCcw,
  History,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { useMockStore } from "@/lib/mock/store";
import {
  TRAINING_OVERVIEW,
  FEATURE_CARDS,
  RECOMMENDED_PRACTICES,
  PRACTICE_RECORDS,
} from "@/lib/mock/learning-hub";
import {
  PageHeader,
  SectionHeader,
  StatPanel,
  FeatureCard,
  TodayPlanCard,
  ModuleTabs,
  ModulePanel,
  ListCard,
  RecommendedItem,
  RecordRow,
  TRAINING_RECORDS_GRID,
  listActionClass,
  LinkButton,
  learningBtnRadius,
} from "@/components/learning/ui";
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
  quizsets: Sparkles,
};

const FEATURE_TAGS: Record<string, string[]> = {
  practice: ["定向强化"],
  exam: ["限时测评"],
  wrong: ["错因分析"],
  quizsets: ["AI 生成"],
};

type PracticeTabKey = "recommended" | "records";

const PRACTICE_TABS: { key: PracticeTabKey; label: string; desc: string; icon: typeof Target }[] = [
  { key: "recommended", label: "推荐练习", desc: "根据薄弱知识点与错题智能推荐", icon: Target },
  { key: "records", label: "最近练习记录", desc: "练习结果联动错题本与个人沉淀", icon: History },
];

function TrainingHome() {
  const [practiceTab, setPracticeTab] = useState<PracticeTabKey>("recommended");
  const { state } = useMockStore();
  const wrongCount = state.wrong.length || TRAINING_OVERVIEW.wrongToReview;
  const overview = {
    ...TRAINING_OVERVIEW,
    wrongToReview: wrongCount,
  };

  return (
    <PageShell>
      <PageHeader
        title="题库训练"
      />

      {/* 训练概览 */}
      <section className="mb-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
          <StatPanel
            className="min-w-0 flex-1"
            caption="本周答题、正确率与错题复习进度"
            items={[
              {
                key: "weekly",
                label: "本周答题",
                value: overview.weeklyAnswers,
                hint: "近 7 日累计",
                icon: <ListChecks />,
                emphasis: "primary",
              },
              {
                key: "accuracy",
                label: "正确率",
                value: `${overview.accuracy}%`,
                hint: "全部练习均值",
                icon: <TrendingUp />,
              },
              {
                key: "wrong",
                label: "待复习错题",
                value: overview.wrongToReview,
                hint: "点击查看错题本",
                icon: <BookMarked />,
                emphasis: overview.wrongToReview > 0 ? "remind" : "default",
                onClick: () => {
                  window.location.href = "/training/wrong";
                },
              },
              {
                key: "quizsets",
                label: "智能生成题单",
                value: overview.quizSetCount,
                hint: "AI 与场景生成",
                icon: <Sparkles />,
              },
              {
                key: "streak",
                label: "连续练习",
                value: `${overview.streakDays} 天`,
                hint: "保持练习节奏",
                icon: <Calendar />,
                emphasis: "primary",
              },
            ]}
          />
          <TodayPlanCard
            title={`今日推荐：${overview.todayPlan.title}`}
            duration={overview.todayPlan.duration}
            count={overview.todayPlan.count}
            action={
              <Link
                to="/training/session/$id"
                params={{ id: "今日练习" }}
                search={{
                  mode: "practice",
                  filter: overview.todayPlan.filter,
                  count: overview.todayPlan.count,
                  limit: 0,
                }}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                开始今日练习 <ChevronRight className="h-4 w-4" />
              </Link>
            }
          />
        </div>
      </section>

      {/* 训练入口 — 对齐专题学习 TopicCard 风格 */}
      <section className="mb-6">
        <SectionHeader title="训练入口" subtitle="专项、模拟、错题与智能题单，覆盖完整练习闭环" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {FEATURE_CARDS.map((card) => {
            const Icon = FEATURE_ICONS[card.id as keyof typeof FEATURE_ICONS];
            const stats =
              card.id === "wrong"
                ? card.stats.map((s) =>
                    s.label === "待复习" ? { ...s, value: `${wrongCount} 题` } : s,
                  )
                : card.stats;

            return (
              <Link
                key={card.id}
                to={card.to}
                search={"search" in card ? card.search : undefined}
                className="block"
              >
                <FeatureCard
                  title={card.title}
                  desc={card.desc}
                  stats={stats}
                  headerTheme={getFeatureHeaderTheme(card.id)}
                  tags={FEATURE_TAGS[card.id] ?? []}
                  action={
                    <span className={cn("inline-flex w-full items-center justify-center gap-1.5 border border-primary/20 bg-primary-soft/50 px-3 py-2 text-[12.5px] font-medium text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground", learningBtnRadius)}>
                      {card.action} <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  }
                  icon={<Icon className="h-5 w-5" />}
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* 推荐练习 / 最近练习记录 */}
      <section>
        <ModulePanel>
          <ModuleTabs
            tabs={PRACTICE_TABS.map((t) => ({
              key: t.key,
              label: t.label,
              desc: t.desc,
              icon: <t.icon className="h-4 w-4" />,
            }))}
            value={practiceTab}
            onChange={setPracticeTab}
          />

          <div className="p-4">
            {practiceTab === "recommended" && (
              <ListCard>
                {RECOMMENDED_PRACTICES.map((r, i) => (
                  <RecommendedItem
                    key={r.id}
                    index={i + 1}
                    title={r.title}
                    reason={r.reason}
                    count={r.count}
                    mastery={r.mastery}
                    tags={r.tags}
                    source={r.source}
                    progress={r.progress}
                    action={
                      <Link
                        to="/training/session/$id"
                        params={{ id: `推荐-${r.id}` }}
                        search={{ mode: "practice", filter: r.filter, count: r.count, limit: 0 }}
                      >
                        <LinkButton>
                          <Target className="h-3.5 w-3.5" />
                          开始练习
                        </LinkButton>
                      </Link>
                    }
                  />
                ))}
              </ListCard>
            )}

            {practiceTab === "records" && (
              <ListCard>
                <div
                  className={cn(
                    "hidden border-b border-divider px-5 py-3 text-[11.5px] font-medium text-muted-foreground lg:grid lg:items-center lg:gap-4",
                    TRAINING_RECORDS_GRID,
                  )}
                >
                  <span>练习名称</span>
                  <span>来源</span>
                  <span>完成时间</span>
                  <span>正确率</span>
                  <span>错题数</span>
                  <span className="text-right">操作</span>
                </div>
                {PRACTICE_RECORDS.map((r) => (
                  <RecordRow
                    key={r.id}
                    cells={[r.title, r.source, r.completedAt, `${r.accuracy}%`, `错题 ${r.wrongCount}`]}
                    actions={
                      <>
                        <Link to="/training/result/$id" params={{ id: r.id }} className={listActionClass()}>
                          <FileSearch className="h-3.5 w-3.5" />
                          查看结果
                        </Link>
                        <Link
                          to="/training/session/$id"
                          params={{ id: `再练-${r.id}` }}
                          search={{
                            mode: "practice",
                            filter: r.filter,
                            count: r.questionCount,
                            limit: 0,
                          }}
                          className={listActionClass("primary")}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          再练一次
                        </Link>
                      </>
                    }
                  />
                ))}
              </ListCard>
            )}
          </div>
        </ModulePanel>
      </section>
    </PageShell>
  );
}
