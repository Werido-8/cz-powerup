import { useNavigate } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { KbButton } from "@/components/knowledge/ui";
import {
  COMPARE_DIFFS,
  COMPARE_TASK,
  countByType,
  getAffectedChapterCount,
  getChapterDensity,
  getCompareVersion,
  sortForSummaryList,
} from "@/lib/file-compare/data";
import type { CompareOverviewSearch } from "@/lib/file-compare/navigation";
import type { DiffItem, DiffType } from "@/lib/file-compare/types";
import { ChangeSummaryPanel } from "./ChangeSummaryPanel";
import { CompareWorkspaceHeader } from "./CompareWorkspaceHeader";
import { DiffAnalysisPanel } from "./DiffAnalysisPanel";
import { DiffStatCards } from "./DiffStatCards";
import { ExportReportMenu } from "./ExportReportMenu";
import { FileInfoPanel } from "./FileInfoPanel";
import { RecompareConfirmDialog } from "./RecompareConfirmDialog";

export function CompareOverviewPage({
  taskId,
  tab,
  search,
}: {
  taskId: string;
  tab: "overview" | "info";
  search: CompareOverviewSearch;
}) {
  const navigate = useNavigate();
  const task = COMPARE_TASK;
  const baseVersion = getCompareVersion(task.baseVersionId);
  const targetVersion = getCompareVersion(task.targetVersionId);
  const [recompareOpen, setRecompareOpen] = useState(false);
  const [recompareLoading, setRecompareLoading] = useState(false);
  const activeType = search.type;

  const patchSearch = (patch: Partial<CompareOverviewSearch>) => {
    void navigate({
      to: tab === "overview" ? "/file-compare/$taskId/overview" : "/file-compare/$taskId/info",
      params: { taskId },
      search: { ...search, ...patch },
      replace: true,
    });
  };

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

  const visibleDiffs = useMemo(
    () => (activeType ? COMPARE_DIFFS.filter((diff) => diff.type === activeType) : COMPARE_DIFFS),
    [activeType],
  );
  const density = useMemo(() => getChapterDensity(visibleDiffs), [visibleDiffs]);
  const primaryChapter = useMemo(
    () => getChapterDensity(COMPARE_DIFFS, 1)[0]?.label ?? "暂无集中章节",
    [],
  );
  const summaryDiffs = useMemo(() => sortForSummaryList(visibleDiffs), [visibleDiffs]);

  const openDiffInReader = (diff: DiffItem) => {
    void navigate({
      to: "/file-compare/$taskId/reader",
      params: { taskId },
      search: { type: activeType, diff: diff.id },
    });
  };

  const openChapterInReader = (chapterId: string) => {
    const first = visibleDiffs.find((diff) => diff.chapterId === chapterId);
    void navigate({
      to: "/file-compare/$taskId/reader",
      params: { taskId },
      search: { chapter: chapterId, type: activeType, diff: first?.id },
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

  const headerActions = (
    <>
      <KbButton variant="outline" onClick={() => setRecompareOpen(true)}>
        <RefreshCw className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
        重新比对
      </KbButton>
      <ExportReportMenu taskTitle={task.title} />
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CompareWorkspaceHeader
        taskId={taskId}
        active={tab}
        search={search}
        baseVersion={baseVersion}
        targetVersion={targetVersion}
        actions={headerActions}
      >
        {tab === "overview" ? (
          <div className="flex h-full min-h-0 flex-col">
            <DiffStatCards
              total={COMPARE_DIFFS.length}
              affectedChapters={getAffectedChapterCount(COMPARE_DIFFS)}
              counts={counts}
              primaryChapter={primaryChapter}
              activeType={activeType}
              onSelectType={(type) => patchSearch({ type })}
            />

            <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-[#E7EFF1] overflow-y-auto xl:grid-cols-[minmax(300px,0.78fr)_minmax(0,1.72fr)] xl:divide-x xl:divide-y-0 xl:overflow-hidden">
              <section className="min-h-[260px] overflow-hidden px-4 py-3.5">
                <DiffAnalysisPanel density={density} onSelectChapter={openChapterInReader} />
              </section>
              <section className="min-h-[320px] overflow-hidden px-4 py-3.5">
                <ChangeSummaryPanel
                  task={task}
                  diffs={summaryDiffs}
                  onOpenDiff={openDiffInReader}
                />
              </section>
            </div>
          </div>
        ) : (
          <FileInfoPanel task={task} baseVersion={baseVersion} targetVersion={targetVersion} />
        )}
      </CompareWorkspaceHeader>

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
