import { useNavigate } from "@tanstack/react-router";
import { GitCompareArrows } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { toast } from "sonner";
import { KbButton } from "@/components/knowledge/ui";
import {
  COMPARE_DIFFS,
  COMPARE_TASK,
  diffMatchesChapter,
  getChapterLabel,
  getCompareDocuments,
  getCompareVersion,
} from "@/lib/file-compare/data";
import { toOverviewSearch, type CompareReaderSearch } from "@/lib/file-compare/navigation";
import type { CompareSide, DiffItem, DiffType } from "@/lib/file-compare/types";
import { CompareWorkspaceHeader } from "./CompareWorkspaceHeader";
import { DiffConnectionRail } from "./DiffMatchBar";
import { DiffListPanel } from "./DiffListPanel";
import { DiffMinimap } from "./DiffMinimap";
import { DocumentPane } from "./DocumentPane";
import { ExportReportMenu } from "./ExportReportMenu";
import { ReaderToolbar } from "./ReaderToolbar";
import { useAnchoredSync } from "./useAnchoredSync";
import { VersionSwitchDialog } from "./VersionSwitchDialog";

function matchesKeyword(diff: DiffItem, keyword: string) {
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
  const [syncScroll, setSyncScroll] = useState(true);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [hoveredDiffId, setHoveredDiffId] = useState<string | null>(null);
  const [currentDiffId, setCurrentDiffId] = useState<string | null>(search.diff ?? null);
  const selectionOriginRef = useRef<"navigation" | "scroll">("navigation");

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
  const filteredDiffs = useMemo(
    () => (activeType ? scopedDiffs.filter((diff) => diff.type === activeType) : scopedDiffs),
    [scopedDiffs, activeType],
  );
  const activeDiff = useMemo(() => {
    return (
      filteredDiffs.find((diff) => diff.id === currentDiffId) ??
      filteredDiffs.find((diff) => diff.id === search.diff) ??
      filteredDiffs.find((diff) => diff.highlight) ??
      filteredDiffs[0]
    );
  }, [currentDiffId, filteredDiffs, search.diff]);
  const position = activeDiff ? filteredDiffs.indexOf(activeDiff) + 1 : 0;

  const { baseRef, targetRef, align, scrollToAnchor, getCurrentDiff } = useAnchoredSync();
  useEffect(() => {
    if (!search.diff) return;
    selectionOriginRef.current = "navigation";
    setCurrentDiffId(search.diff);
  }, [search.diff]);

  useEffect(() => {
    if (!activeDiff || currentDiffId === activeDiff.id) return;
    selectionOriginRef.current = "navigation";
    setCurrentDiffId(activeDiff.id);
  }, [activeDiff, currentDiffId]);

  useEffect(() => {
    if (!activeDiff?.anchor) return;
    if (selectionOriginRef.current === "scroll") {
      selectionOriginRef.current = "navigation";
      return;
    }
    scrollToAnchor(activeDiff.anchor, "auto");
  }, [activeDiff?.anchor, scrollToAnchor]);

  const selectDiff = (diff: DiffItem) => {
    selectionOriginRef.current = "navigation";
    setCurrentDiffId(diff.id);
    patchSearch({ diff: diff.id });
  };

  const handlePaneScroll = (side: CompareSide, _event: UIEvent<HTMLDivElement>) => {
    if (syncScroll) align(side);
    const nextId = getCurrentDiff(side);
    if (!nextId || nextId === currentDiffId || !filteredDiffs.some((diff) => diff.id === nextId))
      return;
    selectionOriginRef.current = "scroll";
    setCurrentDiffId(nextId);
  };

  const step = (delta: number) => {
    if (filteredDiffs.length === 0) return;
    const current = activeDiff ? filteredDiffs.indexOf(activeDiff) : -1;
    const next = (current + delta + filteredDiffs.length) % filteredDiffs.length;
    selectDiff(filteredDiffs[next]);
  };

  const handleTypeChange = (type?: DiffType) => {
    selectionOriginRef.current = "navigation";
    setCurrentDiffId(null);
    patchSearch({ type, diff: undefined });
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
      <CompareWorkspaceHeader
        taskId={taskId}
        active="reader"
        search={toOverviewSearch(search)}
        baseVersion={baseVersion}
        targetVersion={targetVersion}
        actions={
          <>
            <KbButton
              variant="outline"
              className="border-primary/35 text-primary hover:border-primary/50"
              onClick={() => setVersionDialogOpen(true)}
            >
              <GitCompareArrows className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
              切换比对版本
            </KbButton>
            <ExportReportMenu taskTitle={task.title} />
          </>
        }
      >
        <ReaderToolbar
          keyword={keyword}
          onKeywordChange={(value) => patchSearch({ q: value || undefined })}
          activeType={activeType}
          onTypeChange={handleTypeChange}
          syncScroll={syncScroll}
          onSyncScrollChange={setSyncScroll}
          position={position}
          total={filteredDiffs.length}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
        />

        <div className="flex min-h-0 flex-1">
          <DiffListPanel
            diffs={filteredDiffs}
            documentDiffTotal={COMPARE_DIFFS.length}
            activeDiffId={activeDiff?.id}
            onSelectDiff={selectDiff}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex min-h-0 min-w-0 flex-1">
              <DocumentPane
                doc={documents.base}
                currentPage={activeDiff?.basePage ?? 1}
                zoom={100}
                blocks={documents.base.blocks}
                scrollRef={baseRef}
                onScroll={(event) => handlePaneScroll("base", event)}
                onDiffHover={setHoveredDiffId}
                onDiffClick={(id) =>
                  id && selectDiff(COMPARE_DIFFS.find((diff) => diff.id === id)!)
                }
                hoveredDiffId={hoveredDiffId}
                selectedDiffId={activeDiff?.id}
                className="flex-1"
              />
              <DiffConnectionRail diff={activeDiff} />
              <DocumentPane
                doc={documents.target}
                currentPage={activeDiff?.targetPage ?? 1}
                zoom={100}
                blocks={documents.target.blocks}
                scrollRef={targetRef}
                onScroll={(event) => handlePaneScroll("target", event)}
                onDiffHover={setHoveredDiffId}
                onDiffClick={(id) =>
                  id && selectDiff(COMPARE_DIFFS.find((diff) => diff.id === id)!)
                }
                hoveredDiffId={hoveredDiffId}
                selectedDiffId={activeDiff?.id}
                className="flex-1"
              />
              <DiffMinimap
                diffs={filteredDiffs}
                activeDiffId={activeDiff?.id}
                onSelect={selectDiff}
              />
            </div>
          </div>
        </div>
      </CompareWorkspaceHeader>

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
