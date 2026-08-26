import { useId, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, BookOpenCheck, Clock3 } from "lucide-react";
import { DOCS } from "@/lib/mock/data";
import { ENRICHED_TOPICS, type EnrichedTopic } from "@/lib/mock/learning-hub";
import { getTopicProgress } from "@/lib/mock/learning-progress";
import type { MockState } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

type RecentTopicItem = {
  topic: EnrichedTopic;
  visitedAt: string;
  lastDocTitle: string;
  progress: number;
};

function formatRelativeTime(iso: string): string {
  const timestamp = Date.parse(iso);
  if (!timestamp) return "近期访问";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;

  return new Date(timestamp).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

function buildRecentTopics(state: MockState, limit: number): RecentTopicItem[] {
  const seenTopicIds = new Set<string>();
  const items: RecentTopicItem[] = [];
  const entries = [...state.recentDocs].sort(
    (left, right) => Date.parse(right.visitedAt) - Date.parse(left.visitedAt),
  );

  for (const entry of entries) {
    const doc = DOCS.find((item) => item.id === entry.docId);
    if (!doc?.topicId || seenTopicIds.has(doc.topicId)) continue;

    const topic = ENRICHED_TOPICS.find((item) => item.id === doc.topicId);
    if (!topic) continue;

    seenTopicIds.add(topic.id);
    items.push({
      topic,
      visitedAt: entry.visitedAt,
      lastDocTitle: doc.title,
      progress: getTopicProgress(topic.id, state),
    });

    if (items.length >= limit) break;
  }

  if (items.length < limit) {
    for (const topic of ENRICHED_TOPICS) {
      if (seenTopicIds.has(topic.id)) continue;
      seenTopicIds.add(topic.id);
      items.push({
        topic,
        visitedAt: `${topic.updatedAt}T09:00:00.000Z`,
        lastDocTitle: topic.title,
        progress: getTopicProgress(topic.id, state),
      });
      if (items.length >= limit) break;
    }
  }

  return items;
}

export function RecentTopicAccess({
  state,
  limit = 5,
  className,
}: {
  state: MockState;
  limit?: number;
  className?: string;
}) {
  const headingId = useId();
  const items = useMemo(() => buildRecentTopics(state, limit), [limit, state]);

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex min-h-0 flex-col rounded-lg border border-kb-border bg-white p-2", className)}
    >
      <div className="flex min-h-9 shrink-0 items-center justify-between gap-2 px-2">
        <h3
          id={headingId}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-kb-heading"
        >
          <Clock3 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          最近访问
        </h3>
      </div>

      {items.length > 0 ? (
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-hidden scrollbar-thin" aria-label="最近访问的专题">
          {items.map((item) => {
            const relativeTime = formatRelativeTime(item.visitedAt);
            const progressLabel =
              item.progress >= 100
                ? "已完成"
                : item.progress > 0
                  ? `完成 ${item.progress}%`
                  : "最近访问";

            return (
              <li key={item.topic.id}>
                <Link
                  to="/learn/topic/$id"
                  params={{ id: item.topic.id }}
                  aria-label={`打开专题：${item.topic.title}，${relativeTime}，${progressLabel}`}
                  title={`上次访问资料：${item.lastDocTitle}`}
                  className="group flex min-h-8 items-center gap-1.5 rounded-md px-2 py-1 transition-colors duration-150 hover:bg-primary-soft/35 active:bg-primary-soft/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                >
                  <BookOpenCheck
                    className="h-3.5 w-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-kb-heading group-hover:text-primary">
                    {item.topic.title}
                  </span>
                  <span className="shrink-0 text-[10.5px] tabular-nums text-kb-muted">
                    {relativeTime}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mx-1 mb-1 flex flex-1 flex-col items-center justify-center rounded-md border border-dashed border-kb-border bg-kb-surface/40 px-3 py-4 text-center">
          <BookOpen className="h-3.5 w-3.5 text-kb-muted" aria-hidden="true" />
          <p className="mt-1.5 text-[12px] font-medium text-kb-heading">暂无访问记录</p>
          <p className="mt-0.5 text-[10.5px] leading-4 text-kb-muted">打开专题后会显示在这里。</p>
        </div>
      )}
    </section>
  );
}
