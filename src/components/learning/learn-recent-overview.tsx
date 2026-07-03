import { Link } from "@tanstack/react-router";
import { BookOpen, ChevronRight, Clock } from "lucide-react";
import { DOCS } from "@/lib/mock/data";
import { ENRICHED_TOPICS } from "@/lib/mock/learning-hub";
import { getEffectiveDocStatus } from "@/lib/mock/learning-progress";
import type { MockState } from "@/lib/mock/store";
import { StatCardDecor, StatIconFrame } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

const cardBase =
  "relative overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-card)] transition-colors duration-200";

const STATUS_CLS: Record<string, string> = {
  未学: "bg-muted text-muted-foreground",
  学习中: "bg-primary-soft text-primary",
  已学: "bg-success-soft text-success",
  需复习: "bg-warning-soft text-warning-foreground",
};

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

type RecentItem = {
  entry: { docId: string; visitedAt: string };
  doc: (typeof DOCS)[number];
  topicTitle?: string;
  status: string;
};

function buildRecentItems(state: MockState): RecentItem[] {
  return state.recentDocs
    .slice(0, 5)
    .map((entry) => {
      const doc = DOCS.find((d) => d.id === entry.docId);
      if (!doc) return null;
      const topic = ENRICHED_TOPICS.find((t) => t.id === doc.topicId);
      const status = getEffectiveDocStatus(doc.id, state);
      return { entry, doc, topicTitle: topic?.title, status };
    })
    .filter(Boolean) as RecentItem[];
}

function DocRow({ item }: { item: RecentItem }) {
  const { entry, doc, topicTitle, status } = item;

  return (
    <Link
      to="/learn/doc/$id"
      params={{ id: doc.id }}
      className="group flex flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-primary-soft/10"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground group-hover:text-primary">
          {doc.title}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {topicTitle ? `${topicTitle} · ` : ""}
          {formatRelative(entry.visitedAt)}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-md px-2 py-0.5 text-[10.5px] font-medium",
          STATUS_CLS[status] ?? STATUS_CLS["未学"],
        )}
      >
        {status}
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45 group-hover:text-primary/60" aria-hidden />
    </Link>
  );
}

export function LearnRecentOverviewCard({
  state,
  className,
}: {
  state: MockState;
  className?: string;
}) {
  const items = buildRecentItems(state);
  const preview = items.slice(0, 2);
  const latest = preview[0];
  const learningCount = items.filter((i) => i.status === "学习中").length;
  const learnedCount = items.filter((i) => i.status === "已学").length;
  const footerHint =
    learningCount > 0 && learnedCount > 0
      ? `${learningCount} 份学习中 · ${learnedCount} 份已学`
      : learningCount > 0
        ? `${learningCount} 份学习中`
        : learnedCount > 0
          ? `${learnedCount} 份已学完`
          : "近 7 日阅读记录";

  if (items.length === 0) {
    return (
      <div
        className={cn(
          cardBase,
          "border-primary/12 bg-primary-soft/25 p-4",
          className,
        )}
      >
        <StatCardDecor />
        <div className="relative flex items-start gap-3">
          <StatIconFrame icon={<Clock className="h-[18px] w-[18px]" />} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium tracking-wide text-muted-foreground">最近阅读</div>
            <div className="mt-1.5 text-[26px] font-bold tabular-nums leading-none text-foreground">0</div>
            <div className="mt-1 text-[11.5px] text-muted-foreground">暂无阅读记录</div>
          </div>
          <Link
            to="/learn"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <BookOpen className="h-3.5 w-3.5" />
            去浏览
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        cardBase,
        "border-primary/12 bg-primary-soft/25 hover:border-primary/30",
        className,
      )}
    >
      <StatCardDecor />
      <div className="relative grid h-full sm:grid-cols-[minmax(0,220px)_1fr]">
        <Link
          to="/learn/doc/$id"
          params={{ id: latest.doc.id }}
          className="group flex flex-col border-b border-divider p-4 transition-colors hover:bg-primary-soft/15 sm:border-b-0 sm:border-r"
        >
          <div className="flex items-start gap-3">
            <StatIconFrame icon={<Clock className="h-[18px] w-[18px]" />} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-medium tracking-wide text-muted-foreground">最近阅读</div>
              <div className="mt-1.5 text-[26px] font-bold tabular-nums leading-none tracking-tight text-primary">
                {items.length}
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">近期阅读资料</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-primary/15 pt-2.5">
            <span className="h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
              {footerHint}
            </span>
          </div>
        </Link>

        <div className="flex min-h-0 flex-col divide-y divide-divider">
          {preview.map((item) => (
            <DocRow key={item.entry.docId} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
