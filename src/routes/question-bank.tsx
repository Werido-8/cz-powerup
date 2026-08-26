import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ClipboardCheck, Library } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PageShell } from "@/components/workbench/PageShell";
import { ReviewModule } from "@/components/exam/review-module";
import { BankModule } from "@/components/exam/bank-module";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/learning/ui";
import { REVIEW_QUESTIONS } from "@/lib/mock/examAdmin";

export const Route = createFileRoute("/question-bank")({
  component: QuestionBankPage,
  head: () => ({
    meta: [
      { title: "题库管理 · 涉网运行 AI 训练平台" },
      { name: "description", content: "题目资产分类、来源维护与审核入库。" },
    ],
  }),
});

type TabKey = "bank" | "review";

const TABS: { key: TabKey; label: string; icon: typeof Library; count: string }[] = [
  { key: "bank", label: "题库维护", icon: Library, count: "1,842" },
  {
    key: "review",
    label: "审核队列",
    icon: ClipboardCheck,
    count: String(REVIEW_QUESTIONS.length),
  },
];

function QuestionBankPage() {
  const [tab, setTab] = useState<TabKey>("bank");
  return (
    <TooltipProvider delayDuration={200}>
      <PageShell mainClassName="py-3">
        <div className="w-full">
          <PageHeader
            title="题库管理"
            subtitle="维护题目分类、来源与状态；审核通过后进入正式题库。"
            size="md"
            className="mb-3"
          />

          <nav
            className="mb-3 flex min-h-10 gap-7 border-b border-divider"
            aria-label="题库管理工作区"
          >
            {TABS.map((item) => {
              const active = item.key === tab;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "relative inline-flex min-h-10 items-center gap-2 text-[13.5px] font-medium transition-colors",
                    active ? "text-primary" : "text-kb-muted hover:text-kb-heading",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="h-[17px] w-[17px]" />
                  {item.label}
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10.5px] tabular-nums",
                      active ? "bg-primary-soft text-primary" : "bg-kb-surface text-kb-muted",
                    )}
                  >
                    {item.count}
                  </span>
                  {active && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
                  )}
                </button>
              );
            })}
          </nav>

          {tab === "review" ? <ReviewModule /> : <BankModule />}
        </div>
      </PageShell>
    </TooltipProvider>
  );
}
