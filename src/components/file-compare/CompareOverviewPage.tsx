import { Link, useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KbButton } from "@/components/knowledge/ui";
import {
  COMPARE_DIFFS,
  COMPARE_TASK,
  countByType,
  diffMatchesChapter,
  getAffectedChapterCount,
  getChapterDensity,
  getCompareVersion,
  sortForSummaryList,
} from "@/lib/file-compare/data";
import type { CompareOverviewSearch } from "@/lib/file-compare/navigation";
import type { DiffItem, DiffType } from "@/lib/file-compare/types";
import { CompareBreadcrumb } from "./CompareBreadcrumb";
import { CompareModuleTabs, type CompareTabKey } from "./CompareModuleTabs";
import { CompareMetaTag, CompareStatusTag, CompareTaskHeader } from "./CompareTaskHeader";
import { ALL_CHAPTERS, ChapterOutlinePanel } from "./ChapterOutlinePanel";
import { ChangeListPanel } from "./ChangeListPanel";
import { ChangeSummaryPanel } from "./ChangeSummaryPanel";
import { DiffAnalysisPanel } from "./DiffAnalysisPanel";
import { DiffStatCards } from "./DiffStatCards";
import { ExportReportMenu } from "./ExportReportMenu";
import { FileInfoPanel } from "./FileInfoPanel";
import { RecompareConfirmDialog } from "./RecompareConfirmDialog";

type OverviewTabKey = Exclude<CompareTabKey, "reader">;

const TAB_CRUMB_LABEL: Record<OverviewTabKey, string> = {
  overview: "差异概览",
  changes: "变更清单",
  info: "文件信息",
};

const TAB_ROUTE = {
  overview: "/file-compare/$taskId/overview",
  changes: "/file-compare/$taskId/changes",
  info: "/file-compare/$taskId/info",
} as const;

export function CompareOverviewPage({
  taskId,
  tab,
  search,
}: {
  taskId: string;
  tab: OverviewTabKey;
  search: CompareOverviewSearch;
}) {
  const navigate = useNavigate();
  const task = COMPARE_TASK;
  const baseVersion = getCompareVersion(task.baseVersionId);
  const targetVersion = getCompareVersion(task.targetVersionId);

  const [recompareOpen, setRecompareOpen] = useState(false);
  const [recompareLoading, setRecompareLoading] = useState(false);

  const chapterId = search.chapter ?? ALL_CHAPTERS;
  const activeType = search.type;

  const patchSearch = (patch: Partial<CompareOverviewSearch>) => {
    void navigate({
      to: TAB_ROUTE[tab],
      params: { taskId },
      search: { ...search, ...patch },
      replace: true,
    });
  };

  const typeFiltered = useMemo(
    () => (activeType ? COMPARE_DIFFS.filter((diff) => diff.type === activeType) : COMPARE_DIFFS),
    [activeType],
  );

  const filtered = useMemo(
    () => typeFiltered.filter((diff) => diffMatchesChapter(diff, chapterId)),
    [typeFiltered, chapterId],
  );

  const counts = useMemo(
    () =>
      ({
        added: countByType(COMPARE_DIFFS, "added"),
        removed: countByType(COMPARE_DIFFS, "removed"),
        modified: countByType(COMPARE_DIFFS, "modified"),
        moved: countByType(COMPARE_DIFFS, "moved"),
      }) satisfies Record<DiffType, number>,
    [],
  );

  const density = useMemo(() => getChapterDensity(typeFiltered), [typeFiltered]);
  const summaryDiffs = useMemo(() => sortForSummaryList(filtered), [filtered]);

  const openDiffInReader = (diff: DiffItem) => {
    void navigate({
      to: "/file-compare/$taskId/reader",
      params: { taskId },
      search: { chapter: search.chapter, type: activeType, diff: diff.id },
    });
  };

  const handleRecompare = () => {
    setRecompareLoading(true);
    window.setTimeout(() => {
      setRecompareLoading(false);
      setRecompareOpen(false);
      toast.success("已提交重新比对任务", {
        description: `${baseVersion.fileName} → ${targetVersion.fileName}，预计 2 分钟后完成。`,
      });
    }, 900);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CompareBreadcrumb
        items={[
          {
            label: "文件比对",
            link: (
              <Link to="/file-compare/$taskId/overview" params={{ taskId }}>
                文件比对
              </Link>
            ),
          },
          { label: TAB_CRUMB_LABEL[tab] },
        ]}
      />

      <CompareTaskHeader
        className="mt-2"
        title={task.title}
        tags={
          <>
            <CompareMetaTag>
              {baseVersion.label} 基准 <span className="text-kb-muted/70">→</span>{" "}
              {targetVersion.label} 更新
            </CompareMetaTag>
            <CompareStatusTag status={task.status} />
          </>
        }
        actions={
          <>
            <KbButton variant="outline" onClick={() => setRecompareOpen(true)}>
              <RefreshCw className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
              重新比对
            </KbButton>
            <ExportReportMenu taskTitle={task.title} />
          </>
        }
      />

      <div className="mt-3 shrink-0">
        <DiffStatCards
          total={COMPARE_DIFFS.length}
          affectedChapters={getAffectedChapterCount(COMPARE_DIFFS)}
          counts={counts}
          activeType={activeType}
          onSelectType={(type) => patchSearch({ type })}
        />
      </div>

      <section className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-kb-border bg-white shadow-[0_1px_2px_0_rgba(31,52,64,0.03)]">
        <CompareModuleTabs taskId={taskId} active={tab} search={search} />

        {tab === "overview" && (
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(258px,21%)_minmax(0,1fr)_minmax(304px,25%)] divide-x divide-[#EDF3F5] overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-col px-4 py-3.5">
              <ChapterOutlinePanel
                diffs={typeFiltered}
                totalCount={typeFiltered.length}
                selectedChapterId={chapterId}
                onSelectChapter={(next) =>
                  patchSearch({ chapter: next === ALL_CHAPTERS ? undefined : next })
                }
              />
            </div>
            <div className="flex min-h-0 min-w-0 flex-col px-5 py-3.5">
              <ChangeSummaryPanel task={task} diffs={summaryDiffs} onOpenDiff={openDiffInReader} />
            </div>
            <div className="flex min-h-0 min-w-0 flex-col px-5 py-3.5">
              <DiffAnalysisPanel
                total={COMPARE_DIFFS.length}
                counts={counts}
                density={density}
                activeType={activeType}
                onSelectType={(type) => patchSearch({ type })}
                onSelectChapter={(next) => patchSearch({ chapter: next })}
              />
            </div>
          </div>
        )}

        {tab === "changes" && <ChangeListPanel diffs={filtered} onOpenDiff={openDiffInReader} />}

        {tab === "info" && (
          <FileInfoPanel task={task} baseVersion={baseVersion} targetVersion={targetVersion} />
        )}
      </section>

      <RecompareConfirmDialog
        open={recompareOpen}
        loading={recompareLoading}
        baseLabel={`${baseVersion.label} ${baseVersion.fileName}`}
        targetLabel={`${targetVersion.label} ${targetVersion.fileName}`}
        onClose={() => setRecompareOpen(false)}
        onConfirm={handleRecompare}
      />
    </div>
  );
}
