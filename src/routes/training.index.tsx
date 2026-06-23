import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Target, BookMarked, TrendingUp, ChevronRight, Flame } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { useMockStore } from "@/lib/mock/store";

export const Route = createFileRoute("/training/")({
  component: TrainingHome,
  head: () => ({ meta: [{ title: "题库训练 · 涉网运行 AI 训练平台" }] }),
});

const RECOMMENDED = [
  { name: "AGC", title: "AGC 与两细则专项", count: 12, weak: 38 },
  { name: "主变停役", title: "主变停送电典型操作", count: 10, weak: 22 },
  { name: "差动保护", title: "差动保护复盘", count: 8, weak: 30 },
  { name: "厂站规程", title: "新员工基础", count: 15, weak: 18 },
];

type CardDef = { icon: typeof Target; title: string; desc: string; to: "/training/practice" | "/training/exam" | "/training/wrong" | "/training/growth"; tone: string };

function TrainingHome() {
  const { state } = useMockStore();
  const wrongCount = state.wrong.length;

  const cards: CardDef[] = [
    { icon: Target, title: "专项练习", desc: "按知识点 / 场景练", to: "/training/practice", tone: "from-[oklch(0.95_0.04_205)] to-transparent" },
    { icon: ClipboardList, title: "模拟考试", desc: "限时套卷,接近实战", to: "/training/exam", tone: "from-[oklch(0.95_0.04_280)] to-transparent" },
    { icon: BookMarked, title: "错题本", desc: `待巩固 ${wrongCount} 题`, to: "/training/wrong", tone: "from-[oklch(0.95_0.05_45)] to-transparent" },
    { icon: TrendingUp, title: "能力成长", desc: "雷达图与趋势", to: "/training/growth", tone: "from-[oklch(0.95_0.05_165)] to-transparent" },
  ];

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight">题库训练</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">练 → 析 → 错题 → 复习 → 能力可视化</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-6 rounded-lg border border-border bg-gradient-to-r from-primary-soft/60 to-transparent p-5">
        <div>
          <div className="text-[11px] text-muted-foreground">本周答题</div>
          <div className="text-[22px] font-semibold">48</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">正确率</div>
          <div className="text-[22px] font-semibold text-success">76%</div>
        </div>
        <Link to="/training/wrong" className="group">
          <div className="text-[11px] text-muted-foreground">待复习</div>
          <div className="text-[22px] font-semibold text-warning-foreground group-hover:underline">
            {wrongCount}
          </div>
        </Link>
        <Link
          to="/training/session/$id"
          params={{ id: "今日复习" }}
          search={{ mode: "review", filter: "", count: 5, limit: 0 }}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Flame className="h-3.5 w-3.5" /> 今日建议复习 5 题
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.title} to={c.to}>
              <div className="group relative h-full flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]">
                {/* Top gradient strip with icon */}
                <div className={`relative h-24 overflow-hidden bg-gradient-to-br ${c.tone}`}>
                  <svg
                    className="absolute inset-0 h-full w-full opacity-[0.15]"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <defs>
                      <pattern
                        id={`grid-${c.title}`}
                        width="22"
                        height="22"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 22 0 L 0 0 0 22"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="0.6"
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${c.title})`} />
                  </svg>
                  <div className="absolute -bottom-3 left-5 grid h-12 w-12 place-items-center rounded-lg border border-border bg-card shadow-[var(--shadow-card)] text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary/30">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5 pt-6">
                  <div className="text-[14.5px] font-semibold">{c.title}</div>
                  <div className="mt-1 text-[12px] text-muted-foreground">{c.desc}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11.5px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    立即进入 <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <h2 className="mb-3 text-[15px] font-semibold">推荐练习</h2>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {RECOMMENDED.map((r, i) => (
          <div
            key={r.name}
            className={`flex items-center gap-4 px-5 py-4 ${i ? "border-t border-border" : ""}`}
          >
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary font-semibold text-[12px]">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-medium">{r.title}</div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{r.count} 题 · 薄弱度 {r.weak}%</div>
            </div>
            <div className="hidden h-1.5 w-32 overflow-hidden rounded-full bg-muted md:block">
              <div className="h-full rounded-full bg-warning" style={{ width: `${r.weak}%` }} />
            </div>
            <Link
              to="/training/session/$id"
              params={{ id: `推荐-${r.name}` }}
              search={{ mode: "practice", filter: r.name, count: r.count, limit: 0 }}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              开始练习 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
