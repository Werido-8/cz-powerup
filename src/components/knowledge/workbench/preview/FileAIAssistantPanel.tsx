import {
  BookOpenCheck,
  BrainCircuit,
  FileText,
  GitFork,
  GraduationCap,
  Send,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { KbStatusTag } from "@/components/knowledge/ui";
import type { KnowledgeBase, KnowledgeFile } from "@/lib/knowledge/types";
import { kbRadius, kbSpacing } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

type AiTab = "summary" | "qa" | "evidence" | "training";

const tabs: { id: AiTab; label: string }[] = [
  { id: "summary", label: "摘要" },
  { id: "qa", label: "问答" },
  { id: "evidence", label: "依据" },
  { id: "training", label: "训练题" },
];

export function FileAIAssistantPanel({
  file,
  base,
  questions,
}: {
  file: KnowledgeFile;
  base: KnowledgeBase;
  questions: string[];
}) {
  const [tab, setTab] = useState<AiTab>("summary");
  const enabled = file.parseStatus === "success" && file.status === "published";

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-kb-border bg-card",
        kbSpacing.aiPanel,
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-divider px-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-kb-heading">
          <Sparkles className="h-4 w-4 text-primary stroke-[1.8]" />
          AI 辅助
        </div>
        <KbStatusTag tone={enabled ? "accent" : "neutral"}>
          {enabled ? "可用" : "待解析"}
        </KbStatusTag>
      </div>

      <div className="flex border-b border-divider px-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "flex-1 border-b-2 py-2.5 text-[12px] font-medium transition-colors",
              tab === item.id
                ? "border-primary text-primary"
                : "border-transparent text-kb-muted hover:text-kb-body",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "summary" && (
          <>
            <section className={cn("rounded-[8px] border border-kb-border bg-kb-surface p-4", kbRadius.sm)}>
              <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
                <BookOpenCheck className="h-4 w-4 text-primary stroke-[1.8]" />
                文档摘要
              </div>
              <p className="text-[12.5px] leading-relaxed text-kb-muted">
                {file.summary} 该资料来自 {base.name}，当前版本为 {file.version}。
              </p>
              <div className="mt-3 space-y-1.5">
                <div className="text-[11px] font-medium text-kb-muted">关键点</div>
                <ul className="list-inside list-disc text-[12px] text-kb-body">
                  <li>明确执行边界与适用范围</li>
                  <li>关注部门协同与审批要求</li>
                </ul>
              </div>
              {file.parseStatus !== "success" && (
                <div className="mt-3 rounded-[6px] border border-warning/30 bg-warning-soft px-2.5 py-2 text-[11px] text-warning-foreground">
                  解析完成后可生成完整摘要与风险提示
                </div>
              )}
            </section>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <AiAction icon={GitFork} label="生成脑图" disabled={!enabled} />
              <AiAction icon={GraduationCap} label="相关题目" disabled={!enabled} />
              <AiAction icon={BrainCircuit} label="推荐问题" disabled={!enabled} />
              <AiAction icon={FileText} label="要点摘录" disabled={!enabled} />
            </div>
          </>
        )}
        {tab === "qa" && (
          <section>
            <div className="mb-2 text-[12px] font-semibold text-kb-muted">推荐问题</div>
            <div className="space-y-2">
              {questions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={!enabled}
                  className="w-full rounded-[8px] border border-transparent bg-kb-surface px-3 py-2.5 text-left text-[12px] leading-relaxed text-kb-body transition-colors hover:border-primary/20 hover:bg-primary-soft/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {question}
                </button>
              ))}
            </div>
          </section>
        )}
        {tab === "evidence" && (
          <section className="text-[12.5px] text-kb-muted">
            <p>依据溯源将在解析完成后展示文档段落引用与页码定位。</p>
            <div className="mt-3 rounded-[8px] border border-kb-border bg-kb-surface p-3 text-[12px] text-kb-body">
              第 3 页 · 执行要求章节
            </div>
          </section>
        )}
        {tab === "training" && (
          <section className="text-[12.5px] text-kb-muted">
            <p>基于当前文档可生成判断题、单选题与情景分析题，供培训下发使用。</p>
            <button
              type="button"
              disabled={!enabled}
              className="mt-3 w-full rounded-[8px] border border-primary/25 bg-primary-soft py-2.5 text-[12px] font-medium text-accent-foreground disabled:opacity-50"
            >
              生成训练题
            </button>
          </section>
        )}
      </div>

      <div className="border-t border-divider p-3">
        <div className={cn("rounded-[8px] border border-kb-border bg-card p-2", kbRadius.sm)}>
          <textarea
            disabled={!enabled}
            placeholder={enabled ? "围绕当前文档提问" : "解析完成后可提问"}
            className="min-h-[56px] w-full resize-none bg-transparent px-1 text-[12.5px] leading-relaxed text-kb-body outline-none placeholder:text-kb-muted disabled:cursor-not-allowed"
          />
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!enabled}
              className="grid h-8 w-8 place-items-center rounded-[8px] bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted"
              aria-label="发送"
            >
              <Send className="h-3.5 w-3.5 stroke-[1.9]" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function AiAction({
  icon: Icon,
  label,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="flex h-12 items-center gap-2 rounded-[8px] border border-divider bg-card px-3 text-left transition-colors hover:border-primary/20 hover:bg-kb-surface disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className="h-4 w-4 text-primary stroke-[1.8]" />
      <span className="text-[12px] font-medium text-kb-heading">{label}</span>
    </button>
  );
}
