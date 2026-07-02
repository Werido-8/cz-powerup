import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Library, Wand2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageShell } from "@/components/workbench/PageShell";
import { PageHeader, ModuleTabs, ModulePanel, StatCard } from "@/components/learning/ui";
import { ReviewModule } from "@/components/exam/review-module";
import { BankModule } from "@/components/exam/bank-module";
import { BANK_OVERVIEW_STATS } from "@/lib/mock/examAdmin";

export const Route = createFileRoute("/question-bank")({
  component: QuestionBankPage,
  head: () => ({
    meta: [
      { title: "题库管理 · 涉网运行 AI 训练平台" },
      { name: "description", content: "题目审核、录入与题库分类维护。" },
    ],
  }),
});

type TabKey = "review" | "bank";

const TABS: { key: TabKey; label: string; icon: typeof Library; desc: string }[] = [
  { key: "review", label: "题目审核", icon: ClipboardCheck, desc: "AI 生成 / 人工录入待审核题目" },
  { key: "bank", label: "题库维护", icon: Library, desc: "正式题库资产维护与分类" },
];

const STAT_ICONS: Record<string, React.ReactNode> = {
  pending: <ClipboardCheck className="h-[18px] w-[18px]" />,
  bank: <Library className="h-[18px] w-[18px]" />,
  active: <CheckCircle2 className="h-[18px] w-[18px]" />,
  optimize: <Wand2 className="h-[18px] w-[18px]" />,
};

function QuestionBankPage() {
  const [tab, setTab] = useState<TabKey>("bank");

  return (
    <TooltipProvider delayDuration={200}>
      <PageShell>
        <PageHeader
          title="题库管理"
          subtitle="题目录入、审核与分类维护，供多人协同共建题库资产。"
          size="md"
        />

        <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {BANK_OVERVIEW_STATS.map((s, i) => (
            <StatCard
              key={s.key}
              label={s.label}
              value={s.value}
              hint={s.hint}
              icon={STAT_ICONS[s.key]}
              tint={i}
              emphasis={s.tone === "warning" ? "remind" : "default"}
            />
          ))}
        </section>

        <ModulePanel>
          <ModuleTabs
            compact
            tabs={TABS.map((t) => ({
              key: t.key,
              label: t.label,
              desc: t.desc,
              icon: <t.icon className="h-4 w-4" />,
            }))}
            value={tab}
            onChange={setTab}
          />
          <div className="p-4">
            {tab === "review" && <ReviewModule />}
            {tab === "bank" && <BankModule />}
          </div>
        </ModulePanel>
      </PageShell>
    </TooltipProvider>
  );
}
