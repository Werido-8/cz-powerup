import { Link, useNavigate } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KbButton } from "@/components/knowledge/ui";
import {
  COMPARE_DIFFS,
  COMPARE_TASK,
  countByType,
  diffMatchesChapter,
  getChapterLabel,
  getCompareDocuments,
  getCompareVersion,
} from "@/lib/file-compare/data";
import { toOverviewSearch, type CompareReaderSearch } from "@/lib/file-compare/navigation";
import type { DiffItem, DiffType, ReaderLayout, ReaderZoom } from "@/lib/file-compare/types";
import { CompareBreadcrumb } from "./CompareBreadcrumb";
import { CompareMetaTag, CompareTaskHeader } from "./CompareTaskHeader";
import { DiffListPanel } from "./DiffListPanel";
import { DiffMinimap } from "./DiffMinimap";
import { DocumentPane } from "./DocumentPane";
import { ExportReportMenu } from "./ExportReportMenu";
import { ReaderToolbar } from "./ReaderToolbar";
import { useAnchoredSync } from "./useAnchoredSync";
import { VersionSwitchDialog } from "./VersionSwitchDialog";

function matchesKeyword(diff: DiffItem, keyword: string) {
  if (!keyword) return true;
  const needle = keyword.trim().toLowerCase();
  if (!needle) return true;
  return [
    diff.title,
    diff.summaryTitle,
    diff.description,
    diff.clause,
    getChapterLabel(diff.chapterId),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(needle));
}

export function CompareReaderPage({
  taskId,
  search,
}: {
  taskId: string;
  search: CompareReaderSearch;
}) {
  const navigate = useNavigate();
  const task = COMPARE_TASK;

  const [versionPair, setVersionPair] = useState({
    base: task.baseVersionId,
    target: task.targetVersionId,
  });
  const [layout, setLayout] = useState<ReaderLayout>("dual");
  const [syncScroll, setSyncScroll] = useState(true);
  const [zoom, setZoom] = useState<ReaderZoom>(100);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);

  const keyword = search.q ?? "";
  const activeType = search.type;

  const baseVersion = getCompareVersion(versionPair.base);
  const targetVersion = getCompareVersion(versionPair.target);
  const documents = useMemo(
    () => getCompareDocuments(versionPair.base, versionPair.target),
    [versionPair],
  );

  const patchSearch = useCallback(
    (patch: Partial<CompareReaderSearch>) => {
      void navigate({
        to: "/file-compare/$taskId/reader",
        params: { taskId },
        search: { ...search, ...patch },
        replace: true,
      });
    },
    [navigate, search, taskId],
  );

  const scopedDiffs = useMemo(
    () =>
      COMPARE_DIFFS.filter(
        (diff) => diffMatchesChapter(diff, search.chapter) && matchesKeyword(diff, keyword),
      ),
    [search.chapter, keyword],
  );

  const counts = useMemo(
    () =>
      ({
        added: countByType(scopedDiffs, "added"),
        removed: countByType(scopedDiffs, "removed"),
        modified: countByType(scopedDiffs, "modified"),
        moved: countByType(scopedDiffs, "moved"),
      }) satisfies Record<DiffType, number>,
    [scopedDiffs],
  );

  const filteredDiffs = useMemo(
    () => (activeType ? scopedDiffs.filter((diff) => diff.type === activeType) : scopedDiffs),
    [scopedDiffs, activeType],
  );

  const activeDiff = useMemo(() => {
    const requested = filteredDiffs.find((diff) => diff.id === search.diff);
    if (requested) return requested;
    return filteredDiffs.find((diff) => diff.highlight) ?? filteredDiffs[0];
  }, [filteredDiffs, search.diff]);

  const position = activeDiff ? filteredDiffs.indexOf(activeDiff) + 1 : 0;

  const { baseRef, targetRef, align, scrollToAnchor } = useAnchoredSync();

  const activeAnchor = activeDiff?.anchor;
  useEffect(() => {
    if (!activeAnchor) return;
    scrollToAnchor(activeAnchor, "auto");
  }, [activeAnchor, scrollToAnchor, layout, zoom]);

  const selectDiff = (diff: DiffItem) => patchSearch({ diff: diff.id });

  const step = (delta: number) => {
    if (filteredDiffs.length === 0) return;
    const current = activeDiff ? filteredDiffs.indexOf(activeDiff) : -1;
    const next = (current + delta + filteredDiffs.length) % filteredDiffs.length;
    patchSearch({ diff: filteredDiffs[next].id });
  };

  const handleVersionConfirm = (next: { baseVersionId: string; targetVersionId: string }) => {
    setVersionPair({ base: next.baseVersionId, target: next.targetVersionId });
    setVersionDialogOpen(false);
    toast.success("已切换比对版本", {
      description: `${getCompareVersion(next.baseVersionId).fileName} → ${getCompareVersion(next.targetVersionId).fileName}`,
    });
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
          {
            label: "差异概览",
            link: (
              <Link
                to="/file-compare/$taskId/overview"
                params={{ taskId }}
                search={toOverviewSearch(search)}
              >
                差异概览
              </Link>
            ),
          },
          { label: "对照阅读" },
        ]}
      />

      <CompareTaskHeader
        className="mt-2"
        title="双栏对照阅读"
        tags={<CompareMetaTag>{task.title}</CompareMetaTag>}
        actions={
          <>
            <KbButton
              variant="outline"
              className="border-primary/35 text-primary hover:border-primary/50"
              onClick={() => setVersionDialogOpen(true)}
            >
              <GitCompareArrows className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
              切换版本
            </KbButton>
            <ExportReportMenu taskTitle={task.title} />
          </>
        }
      />

      <section className="mt-3 flex min-h-0 flex-1 overflow-hidden rounded-[10px] border border-kb-border bg-white shadow-[0_1px_2px_0_rgba(31,52,64,0.03)]">
        <DiffListPanel
          diffs={filteredDiffs}
          keyword={keyword}
          onKeywordChange={(value) => patchSearch({ q: value || undefined })}
          activeType={activeType}
          onTypeChange={(type) => patchSearch({ type })}
          counts={counts}
          totalCount={scopedDiffs.length}
          documentDiffTotal={COMPARE_DIFFS.length}
          activeDiffId={activeDiff?.id}
          onSelectDiff={selectDiff}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ReaderToolbar
            layout={layout}
            onLayoutChange={setLayout}
            syncScroll={syncScroll}
            onSyncScrollChange={setSyncScroll}
            zoom={zoom}
            onZoomChange={setZoom}
            position={position}
            total={filteredDiffs.length}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />

          <div className="flex min-h-0 min-w-0 flex-1">
            {layout === "dual" && (
              <DocumentPane
                doc={documents.base}
                currentPage={activeDiff?.basePage ?? 1}
                zoom={zoom}
                blocks={documents.base.blocks}
                scrollRef={baseRef}
                onScroll={() => syncScroll && align("base")}
                className="flex-1 border-r border-kb-border"
              />
            )}
            <DocumentPane
              doc={documents.target}
              currentPage={activeDiff?.targetPage ?? 1}
              zoom={zoom}
              blocks={documents.target.blocks}
              scrollRef={targetRef}
              onScroll={() => syncScroll && align("target")}
              className="flex-1"
            />
            <DiffMinimap
              diffs={filteredDiffs}
              activeDiffId={activeDiff?.id}
              onSelect={selectDiff}
            />
          </div>
        </div>
      </section>

      <VersionSwitchDialog
        open={versionDialogOpen}
        baseVersionId={baseVersion.id}
        targetVersionId={targetVersion.id}
        onClose={() => setVersionDialogOpen(false)}
        onConfirm={handleVersionConfirm}
      />
    </div>
  );
}
