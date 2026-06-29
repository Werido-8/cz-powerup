import { BookMarked, BookOpen, Brain, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { QUESTIONS } from "@/lib/mock/data";
import { LEARNING_ACTIVITIES } from "@/lib/mock/learning-hub";
import { buildReviewPlan, buildSchedule, getRowPhase } from "@/lib/mock/spaced-review";
import { useMockStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ReviewDayView,
  ReviewEntryActions,
  ReviewMonthView,
  ReviewPhaseTag,
  ReviewViewToolbar,
  ReviewWeekView,
  useReviewTimeline,
  type ReviewViewMode,
} from "./review-calendar-views";
import { HeroOverviewCard, HeroOverviewBody, HeroActionRail, ListCard, TableListPager, TABLE_PAGE_SIZE_DEFAULT } from "./ui";

/** 学习概览右侧之「今日动态」 */
export function TodayActivityCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]", className)}>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-md border border-primary/15 bg-primary-soft text-primary">
          <RotateCcw className="h-4 w-4" />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-foreground">今日动态</div>
          <div className="text-[11px] text-muted-foreground">学习行为摘要</div>
        </div>
      </div>
      <ul className="mt-3 flex-1 space-y-2">
        {LEARNING_ACTIVITIES.slice(0, 4).map((a) => (
          <li key={a.id} className="flex items-start gap-2 text-[12px] leading-snug text-foreground/85">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {a.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewPlanRowItem({ row }: { row: import("@/lib/mock/spaced-review").ReviewPlanRow }) {
  const phase = getRowPhase(row);
  const upcoming = row.schedule.filter((s) => s.status !== "done").slice(0, 3);

  return (
    <div className="rounded-md border border-border bg-card px-3.5 py-2.5 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-sm px-1.5 py-px text-[10.5px] font-medium",
                row.kind === "doc" ? "bg-primary-soft/70 text-accent-foreground" : "bg-muted/60 text-muted-foreground",
              )}
            >
              {row.kind === "doc" ? <BookOpen className="h-3 w-3" /> : <BookMarked className="h-3 w-3" />}
              {row.kindLabel}
            </span>
            <ReviewPhaseTag phase={phase} />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="mt-1 truncate text-[13.5px] font-medium leading-snug text-foreground">
                {row.title}
              </p>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm text-[12px] leading-snug">
              {row.title}
            </TooltipContent>
          </Tooltip>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            下次为第 {row.nextRound} 次复习 ·{" "}
            <span className="font-medium text-foreground">{row.nextAt}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <ReviewEntryActions row={row} phase={phase} />
        </div>
      </div>
      {upcoming.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-divider pt-2">
          {upcoming.map((s) => (
            <span
              key={s.round}
              className={cn(
                "rounded-sm border px-1.5 py-px text-[10.5px]",
                s.status === "due"
                  ? "border-warning/25 text-warning-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {s.label} · {s.at}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewPlanList({ plan, query = "" }: { plan: import("@/lib/mock/spaced-review").ReviewPlanRow[]; query?: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const totalPages = Math.max(1, Math.ceil(plan.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageRows = plan.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [plan]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (plan.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
        {query
          ? "暂无匹配的复习项，请调整搜索关键词。"
          : "暂无复习项。标记资料「已学」并纳入复习计划，或完成练习产生错题后将自动出现在此。"}
      </div>
    );
  }

  return (
    <ListCard className="overflow-hidden">
      <div className="max-h-[min(32rem,60vh)] space-y-2 overflow-y-auto p-3">
        {pageRows.map((row) => (
          <ReviewPlanRowItem key={row.id} row={row} />
        ))}
      </div>

      <TableListPager
        page={safePage}
        totalPages={totalPages}
        totalItems={plan.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </ListCard>
  );
}

/** 学习概览左侧之「今日复习」 */
export function TodayReviewHeroCard({ onViewPlan }: { onViewPlan?: () => void }) {
  const { plan, dueCount, docCount, wrongCount } = useSpacedReviewSummary();
  const firstDue = plan.find((p) => p.due);

  return (
    <HeroOverviewCard
      action={
        <HeroActionRail
          label="开始复习"
          icon={Brain}
          variant="review"
          to="/training/session/$id"
          params={{ id: "今日复习" }}
          search={{ mode: "review", filter: "", count: Math.max(1, dueCount), limit: 0 }}
          footerLabel={onViewPlan ? "查看复习计划" : undefined}
          onFooterClick={onViewPlan}
        />
      }
    >
      <HeroOverviewBody className="sm:after:to-warning-soft/10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-warning/25 bg-warning-soft/35 px-2.5 py-1 text-[11px] font-medium text-warning-foreground">
          <Brain className="h-3.5 w-3.5" />
          今日复习
        </div>
        <h2 className="mt-3 text-[18px] font-semibold leading-snug text-foreground">
          {dueCount > 0 ? `${dueCount} 项待复习` : "暂无到期项"}
        </h2>
        <p className="mt-1.5 line-clamp-2 text-[13px] text-muted-foreground">
          资料 {docCount} 项 · 错题 {wrongCount} 题
          {firstDue ? ` · ${firstDue.title}` : " · 保持学习节奏即可"}
        </p>
      </HeroOverviewBody>
    </HeroOverviewCard>
  );
}

export function useSpacedReviewSummary() {
  const { state } = useMockStore();

  const questionTitles = useMemo(
    () => Object.fromEntries(QUESTIONS.map((q) => [q.id, q.stem.slice(0, 36) + (q.stem.length > 36 ? "…" : "")])),
    [],
  );

  const plan = useMemo(
    () => buildReviewPlan(state.reviews, state.wrong, questionTitles),
    [state.reviews, state.wrong, questionTitles],
  );

  return {
    plan,
    dueCount: plan.filter((p) => p.due).length,
    docCount: plan.filter((p) => p.kind === "doc").length,
    wrongCount: plan.filter((p) => p.kind === "wrong").length,
  };
}

/** 艾宾浩斯复习计划面板（独立 Tab 内展示完整清单） */
export function SpacedReviewPanel({ embedded = false }: { embedded?: boolean }) {
  const { plan, dueCount, docCount, wrongCount } = useSpacedReviewSummary();
  const [viewMode, setViewMode] = useState<ReviewViewMode>("list");
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  const filteredPlan = useMemo(() => {
    if (!appliedQuery) return plan;
    const q = appliedQuery.toLowerCase();
    return plan.filter(
      (row) => row.title.toLowerCase().includes(q) || row.kindLabel.toLowerCase().includes(q),
    );
  }, [plan, appliedQuery]);

  const timeline = useReviewTimeline(filteredPlan);

  const visiblePlan = embedded ? filteredPlan : filteredPlan.slice(0, 6);

  const handleSearch = () => {
    setAppliedQuery(searchInput.trim());
  };

  const handleModeChange = (mode: ReviewViewMode) => {
    setViewMode(mode);
    if (mode === "day") setCursorDate(selectedDate);
  };

  const handleToday = () => {
    const today = new Date();
    setCursorDate(today);
    setSelectedDate(today);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setCursorDate(date);
  };

  const handleOpenDay = (date: Date) => {
    setSelectedDate(date);
    setCursorDate(date);
    setViewMode("day");
  };

  return (
    <TooltipProvider delayDuration={200}>
      <section
        className={cn(
          embedded ? "" : "mb-6 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5",
        )}
      >
      {embedded && (
        <>
          <ReviewViewToolbar
            mode={viewMode}
            onModeChange={handleModeChange}
            cursorDate={cursorDate}
            onCursorChange={setCursorDate}
            onToday={handleToday}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            onSearch={handleSearch}
            docCount={docCount}
            wrongCount={wrongCount}
            dueCount={dueCount}
          />

          {viewMode === "list" && <ReviewPlanList plan={filteredPlan} query={appliedQuery} />}

          {viewMode === "month" && (
            <ReviewMonthView
              timeline={timeline}
              cursorDate={cursorDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />
          )}

          {viewMode === "week" && (
            <ReviewWeekView
              timeline={timeline}
              cursorDate={cursorDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onOpenDay={handleOpenDay}
            />
          )}

          {viewMode === "day" && <ReviewDayView timeline={timeline} cursorDate={cursorDate} />}
        </>
      )}

      {!embedded && (
        <div className="space-y-2">
          {filteredPlan.length === 0 ? (
            <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-[13px] text-muted-foreground">
              暂无复习项。标记资料「已学」并纳入复习计划，或完成练习产生错题后将自动出现在此。
            </div>
          ) : (
            visiblePlan.map((row) => <ReviewPlanRowItem key={row.id} row={row} />)
          )}
          {filteredPlan.length > 6 && (
            <p className="text-center text-[11.5px] text-muted-foreground">
              还有 {filteredPlan.length - 6} 项未展示
            </p>
          )}
        </div>
      )}
      </section>
    </TooltipProvider>
  );
}

/** 纳入复习计划弹窗内的节点预览 */
export function ReviewSchedulePreview() {
  const schedule = buildSchedule(new Date().toISOString(), 0).slice(0, 4);

  return (
    <ul className="space-y-1.5 rounded-md border border-border bg-muted/30 p-3 text-[12px]">
      {schedule.map((s) => (
        <li key={s.round} className="flex justify-between gap-2 text-muted-foreground">
          <span>{s.label}</span>
          <span className="font-medium text-foreground">{s.at}</span>
        </li>
      ))}
    </ul>
  );
}
