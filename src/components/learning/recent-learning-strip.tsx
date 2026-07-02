import { Link } from "@tanstack/react-router";
import { Clock, FileText, ChevronRight } from "lucide-react";
import { DOCS } from "@/lib/mock/data";
import { ENRICHED_TOPICS } from "@/lib/mock/learning-hub";
import { getEffectiveDocStatus } from "@/lib/mock/learning-progress";
import type { MockState } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

const STATUS_CLS: Record<string, string> = {
  未学: "bg-muted text-muted-foreground",
  学习中: "bg-primary-soft text-primary",
  已学: "bg-success-soft text-success",
};

export function RecentLearningStrip({ state }: { state: MockState }) {
  const items = state.recentDocs.slice(0, 5).map((entry) => {
    const doc = DOCS.find((d) => d.id === entry.docId);
    if (!doc) return null;
    const topic = ENRICHED_TOPICS.find((t) => t.id === doc.topicId);
    const status = getEffectiveDocStatus(doc.id, state);
    return { entry, doc, topic, status };
  }).filter(Boolean) as {
    entry: { docId: string; visitedAt: string };
    doc: (typeof DOCS)[number];
    topic: (typeof ENRICHED_TOPICS)[number] | undefined;
    status: string;
  }[];

  if (items.length === 0) {
    return (
      <section className="mb-5 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-[13px] text-muted-foreground">
        暂无最近学习，从下方专题开始吧
      </section>
    );
  }

  return (
    <section className="mb-5 rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <Clock className="h-4 w-4 text-primary" />
          最近学习
        </div>
        <span className="text-[11.5px] text-muted-foreground">最近 {items.length} 份资料</span>
      </div>
      <ul className="divide-y divide-border">
        {items.map(({ entry, doc, topic, status }) => (
          <li key={entry.docId}>
            <Link
              to="/learn/doc/$id"
              params={{ id: doc.id }}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary/70" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium">{doc.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
                  {topic && <span>{topic.title}</span>}
                  <span>{formatRelative(entry.visitedAt)}</span>
                </div>
              </div>
              <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-medium", STATUS_CLS[status] ?? STATUS_CLS["未学"])}>
                {status}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
