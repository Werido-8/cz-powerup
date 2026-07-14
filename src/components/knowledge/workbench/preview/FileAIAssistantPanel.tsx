import {
  BookOpenCheck,
  GitFork,
  GraduationCap,
  Hash,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { KbStatusTag } from "@/components/knowledge/ui";
import { isStorageOnlyFile } from "@/lib/knowledge/parseMerge";
import type { KnowledgeBase, KnowledgeFile } from "@/lib/knowledge/types";
import { kbRadius, kbSpacing } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

type AiTab = "summary" | "mindmap" | "training" | "keywords";

const tabs: { id: AiTab; label: string }[] = [
  { id: "summary", label: "摘要" },
  { id: "mindmap", label: "脑图" },
  { id: "training", label: "训练题" },
  { id: "keywords", label: "关键词" },
];

export function FileAIAssistantPanel({
  file,
  base,
}: {
  file: KnowledgeFile;
  base: KnowledgeBase;
}) {
  const [tab, setTab] = useState<AiTab>("summary");
  const storageOnly = isStorageOnlyFile(file);
  const enabled =
    !storageOnly && file.parseStatus === "success" && file.status === "published";
  const keywords = file.aiKeywords ?? file.tags ?? [];

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
        <KbStatusTag tone={storageOnly ? "neutral" : enabled ? "accent" : "neutral"}>
          {storageOnly ? "仅存储" : enabled ? "可用" : "待解析"}
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
        {storageOnly && (
          <div className="mb-3 rounded-[8px] border border-warning/30 bg-warning-soft px-3 py-2.5 text-[12px] text-warning-foreground">
            该格式不支持预览、检索与问答，仅作文件存储。
          </div>
        )}

        {tab === "summary" && (
          <section className={cn("rounded-[8px] border border-kb-border bg-kb-surface p-4", kbRadius.sm)}>
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
              <BookOpenCheck className="h-4 w-4 text-primary stroke-[1.8]" />
              文档摘要
            </div>
            <p className="text-[12.5px] leading-relaxed text-kb-muted">
              {file.summary ?? "解析完成后将自动生成文档摘要。"}
              {enabled ? ` 该资料来自 ${base.name}，当前版本为 ${file.version}。` : ""}
            </p>
          </section>
        )}

        {tab === "mindmap" && (
          <section className={cn("rounded-[8px] border border-kb-border bg-kb-surface p-4", kbRadius.sm)}>
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
              <GitFork className="h-4 w-4 text-primary stroke-[1.8]" />
              知识脑图
            </div>
            {enabled ? (
              <div className="rounded-[6px] border border-dashed border-primary/25 bg-primary-soft/20 px-3 py-6 text-center text-[12px] text-kb-muted">
                脑图预览区（演示占位）
              </div>
            ) : (
              <p className="text-[12.5px] text-kb-muted">解析完成后可生成知识结构脑图。</p>
            )}
          </section>
        )}

        {tab === "training" && (
          <section className={cn("rounded-[8px] border border-kb-border bg-kb-surface p-4", kbRadius.sm)}>
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
              <GraduationCap className="h-4 w-4 text-primary stroke-[1.8]" />
              训练题
            </div>
            <p className="text-[12.5px] text-kb-muted">
              基于当前文档可生成判断题、单选题与情景分析题。
            </p>
            {(file.aiQuestions ?? []).length > 0 && (
              <ul className="mt-3 space-y-2">
                {file.aiQuestions!.map((q) => (
                  <li key={q} className="rounded-[6px] bg-card px-3 py-2 text-[12px] text-kb-body">
                    {q}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={!enabled}
              className="mt-3 w-full rounded-[8px] border border-primary/25 bg-primary-soft py-2.5 text-[12px] font-medium text-accent-foreground disabled:opacity-50"
            >
              生成训练题
            </button>
          </section>
        )}

        {tab === "keywords" && (
          <section className={cn("rounded-[8px] border border-kb-border bg-kb-surface p-4", kbRadius.sm)}>
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
              <Hash className="h-4 w-4 text-primary stroke-[1.8]" />
              关键词
            </div>
            {keywords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-primary/20 bg-primary-soft/40 px-2.5 py-0.5 text-[11.5px] text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-kb-muted">解析完成后自动提取关键词。</p>
            )}
          </section>
        )}
      </div>
    </aside>
  );
}
