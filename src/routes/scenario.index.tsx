import { createFileRoute, Link } from "@tanstack/react-router";
import { Workflow, ShieldAlert, Award, Users, ArrowRight, Star } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { SafetyBanner } from "@/components/common/SafetyBanner";
import { useMockStore } from "@/lib/mock/store";
import { ALL_SCENARIOS } from "@/lib/mock/scenario";

export const Route = createFileRoute("/scenario/")({
  component: ScenarioHome,
  head: () => ({ meta: [{ title: "场景训练 · 涉网运行 AI 训练平台" }] }),
});

const ENTRIES = [
  {
    to: "/scenario/typical",
    icon: Workflow,
    title: "典型操作",
    desc: "围绕设备、任务和前置条件,学习典型操作关键步骤、票据参考与依据。",
    tag: "P0",
    enabled: true,
  },
  {
    to: "/scenario/fault",
    icon: ShieldAlert,
    title: "故障处置",
    desc: "围绕故障对象与现象,组织判断思路、参考处置、风险与案例。",
    tag: "P0",
    enabled: true,
  },
  {
    to: "/scenario/peak",
    icon: Workflow,
    title: "深度调峰",
    desc: "围绕机组类型、运行负荷与调峰任务,组织深调风险核查、操作要点与学习重点。",
    tag: "P0",
    enabled: true,
  },
  {
    to: "/scenario",
    icon: Award,
    title: "考证专项训练",
    desc: "考证季节专项题目与场景训练。",
    tag: "占位",
    enabled: false,
  },
  {
    to: "/scenario",
    icon: Users,
    title: "班组专题训练",
    desc: "班组带教、专题任务、协同复盘。",
    tag: "占位",
    enabled: false,
  },
] as const;

function ScenarioHome() {
  const { state } = useMockStore();
  const recent = state.recentScenarios
    .map((id) => ALL_SCENARIOS.find((s) => s.id === id))
    .filter(Boolean)
    .slice(0, 4);
  const favs = state.scenarioFavorites.slice(0, 4);

  return (
    <PageShell>
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold tracking-tight">场景训练</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">围绕典型操作、故障复盘和专题任务进行结构化训练</p>
      </div>
      <SafetyBanner />

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ENTRIES.map((e) => {
          const Icon = e.icon;
          const inner = (
            <div
              className={`group flex h-full flex-col rounded-lg border border-border bg-card p-5 transition-all ${e.enabled ? "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" : "opacity-60"}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] ${e.enabled ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {e.tag}
                </span>
              </div>
              <div className="text-[15px] font-semibold tracking-tight">{e.title}</div>
              <p className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">{e.desc}</p>
              {e.enabled && (
                <div className="mt-auto pt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary">
                  进入训练 <ArrowRight className="h-3 w-3" />
                </div>
              )}
            </div>
          );
          return e.enabled ? (
            <Link key={e.title} to={e.to} params={(e as any).params} className="block h-full">
              {inner}
            </Link>
          ) : (
            <div key={e.title} className="h-full">
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 text-[14px] font-semibold">最近使用场景</h2>
          {recent.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-[12.5px] text-muted-foreground">
              暂无最近场景。可从「典型操作训练」或「故障处置复盘」开始。
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map(
                (s) =>
                  s && (
                    <li key={s.id}>
                      <Link
                        to={s.kind === "typical" ? "/scenario/typical/result/$id" : "/scenario/fault/result/$id"}
                        params={{ id: s.id }}
                        className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 hover:border-primary/40"
                      >
                        <div className="text-[13px]">{s.title}</div>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {s.kind === "typical" ? "典型操作" : "故障处置"}
                        </span>
                      </Link>
                    </li>
                  ),
              )}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[14px] font-semibold">
            <Star className="h-4 w-4 text-warning-foreground" /> 收藏场景
          </h2>
          {favs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-[12.5px] text-muted-foreground">
              暂无收藏场景。在结果页点击「收藏」即可保存。
            </div>
          ) : (
            <ul className="space-y-2">
              {favs.map((f) => (
                <li key={f.id}>
                  <Link
                    to={f.kind === "typical" ? "/scenario/typical/result/$id" : "/scenario/fault/result/$id"}
                    params={{ id: f.scenarioId }}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 hover:border-primary/40"
                  >
                    <div className="text-[13px]">{f.title}</div>
                    <span className="text-[11px] text-muted-foreground">{f.savedAt}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}
