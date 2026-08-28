import { Check, Folder, FolderInput, Info, Search } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { KnowledgeBaseIcon } from "@/components/knowledge/ui";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import {
  getBaseById,
  getInternalDirectoriesForBase,
  getInternalDirectoryPathLabel,
  getMoveTargetBases,
  isSubmitToPublicMove,
} from "@/lib/knowledge/model";
import { pushRecentMoveId } from "@/lib/knowledge/recentMove";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type {
  KnowledgeBase,
  KnowledgeFile,
  KnowledgeInternalDirectory,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { KnowledgeInternalDirectoryTree } from "./KnowledgeInternalDirectoryTree";

export function FileMoveDialog({
  files,
  currentBaseId,
  loading,
  onClose,
  onConfirm,
}: {
  files: KnowledgeFile[];
  currentBaseId?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (
    files: KnowledgeFile[],
    targetBaseId: string,
    targetDirectoryId: string | undefined,
    keepSource: boolean,
  ) => void;
}) {
  const open = files.length === 1;
  const rejectedBatch = files.length > 1;
  const storeVersion = useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );
  const effectiveBaseId = currentBaseId ?? files[0]?.knowledgeBaseId;
  const sourceBase = effectiveBaseId ? getBaseById(effectiveBaseId) : undefined;
  const sourceDirectoryId = files[0]?.directoryId;
  const [targetBaseId, setTargetBaseId] = useState("");
  const [targetDirectoryId, setTargetDirectoryId] = useState<string | undefined>();
  const [keepSource, setKeepSource] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!rejectedBatch) return;
    toast.error("移动仅支持单个文件，不做批量移动");
    onClose();
  }, [onClose, rejectedBatch]);

  const targets = useMemo(() => {
    void storeVersion;
    const otherTargets = getMoveTargetBases(effectiveBaseId);
    return sourceBase ? [sourceBase, ...otherTargets] : otherTargets;
  }, [effectiveBaseId, sourceBase, storeVersion]);

  useEffect(() => {
    if (!open) return;
    setTargetBaseId(sourceBase?.id ?? targets[0]?.id ?? "");
    setTargetDirectoryId(undefined);
    setKeepSource(false);
    setQuery("");
  }, [files, open, sourceBase?.id, targets]);

  const selectedBase = targets.find((base) => base.id === targetBaseId);
  const selectedDirectories = useMemo(() => {
    void storeVersion;
    return targetBaseId ? getInternalDirectoriesForBase(targetBaseId) : [];
  }, [storeVersion, targetBaseId]);
  const normalizedQuery = query.trim().toLocaleLowerCase("zh-CN");
  const filteredBases = useMemo(() => {
    if (!normalizedQuery) return targets;
    return targets.filter((base) => {
      if (base.name.toLocaleLowerCase("zh-CN").includes(normalizedQuery)) return true;
      return getInternalDirectoriesForBase(base.id).some((directory) =>
        directory.name.toLocaleLowerCase("zh-CN").includes(normalizedQuery),
      );
    });
  }, [normalizedQuery, targets]);
  const filteredDirectories = useMemo(
    () =>
      normalizedQuery
        ? selectedDirectories.filter((directory) =>
            directory.name.toLocaleLowerCase("zh-CN").includes(normalizedQuery),
          )
        : selectedDirectories,
    [normalizedQuery, selectedDirectories],
  );

  const currentLocation = sourceBase
    ? `${sourceBase.name} / ${getInternalDirectoryPathLabel(sourceDirectoryId)}`
    : "未知位置";
  const targetLocation =
    selectedBase && targetDirectoryId
      ? `${selectedBase.name} / ${getInternalDirectoryPathLabel(targetDirectoryId)}`
      : "请选择目标位置";
  const sameLocation =
    selectedBase?.id === sourceBase?.id && targetDirectoryId === sourceDirectoryId;
  const isSubmitApproval = isSubmitToPublicMove(effectiveBaseId, targetBaseId);
  const isCopy = keepSource;
  const confirmDisabled = !selectedBase || !targetDirectoryId || (!keepSource && sameLocation);

  const handleConfirm = () => {
    if (!selectedBase || !targetDirectoryId || files.length !== 1 || confirmDisabled) return;
    pushRecentMoveId(selectedBase.id);
    onConfirm(files, selectedBase.id, targetDirectoryId, keepSource);
  };

  if (!open) return null;

  return (
    <AppFormDialog
      open
      size="medium"
      title={isCopy ? "复制文件" : isSubmitApproval ? "提交到专业/公共知识库" : "移动文件"}
      titleIcon={FolderInput}
      onClose={onClose}
      className="file-move-dialog w-[720px]"
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton
            variant="primary"
            loading={loading}
            disabled={confirmDisabled}
            onClick={handleConfirm}
          >
            {isCopy ? "确认复制" : isSubmitApproval ? "提交移入申请" : "确认移动"}
          </AppDialogButton>
        </>
      }
    >
      <div className="space-y-3.5">
        <p className="text-[12.5px] leading-5 text-kb-body">
          将「<strong className="font-semibold text-primary">{files[0]?.name}</strong>」
          {isCopy ? "复制" : "移动"}到目标位置。
        </p>

        <LocationBlock label="当前位置" value={currentLocation} trailing="当前位置" />

        <section>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-kb-body">
            目标位置
            <span className="font-normal text-kb-muted">（选择目标知识库和目录）</span>
          </div>
          <div className="overflow-hidden rounded-[9px] border border-[#DCEBED] bg-white">
            <div className="border-b border-[#E4EEF0] p-2.5">
              <label className="flex h-8 items-center gap-2 rounded-[7px] border border-[#DCEBED] bg-white px-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted stroke-[1.8]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="搜索知识库或目录"
                  className="min-w-0 flex-1 bg-transparent text-[12px] text-kb-heading outline-none placeholder:text-kb-muted"
                />
              </label>
            </div>

            <div className="grid h-[246px] grid-cols-[220px_minmax(0,1fr)] max-[640px]:h-auto max-[640px]:grid-cols-1">
              <div className="scrollbar-thin overflow-y-auto border-r border-[#E4EEF0] p-1.5 max-[640px]:max-h-[170px] max-[640px]:border-b max-[640px]:border-r-0">
                {filteredBases.length ? (
                  filteredBases.map((base) => (
                    <KnowledgeBaseRow
                      key={base.id}
                      base={base}
                      selected={base.id === targetBaseId}
                      onSelect={() => {
                        setTargetBaseId(base.id);
                        setTargetDirectoryId(undefined);
                      }}
                    />
                  ))
                ) : (
                  <EmptySearch label="未找到匹配的知识库" />
                )}
              </div>

              <div className="scrollbar-thin overflow-y-auto p-1.5">
                {selectedBase ? (
                  normalizedQuery && filteredDirectories.length === 0 ? (
                    <EmptySearch label="当前知识库内没有匹配目录" />
                  ) : normalizedQuery ? (
                    <FlatDirectoryResults
                      directories={filteredDirectories}
                      selectedId={targetDirectoryId}
                      onSelect={setTargetDirectoryId}
                    />
                  ) : (
                    <KnowledgeInternalDirectoryTree
                      baseId={selectedBase.id}
                      directories={selectedDirectories}
                      selectedId={targetDirectoryId}
                      compact
                      onSelect={setTargetDirectoryId}
                    />
                  )
                ) : (
                  <EmptySearch label="请先选择目标知识库" />
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-[8px] bg-primary-soft/65 px-3 py-2.5 text-[11.5px] leading-5 text-[#54717B]">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary stroke-[1.9]" />
          <div>
            <div className="font-medium text-primary">跨知识库移动</div>
            <div>文件将进入目标知识库所选目录，并按目标库规则处理。</div>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-kb-body">
          <input
            type="checkbox"
            checked={keepSource}
            onChange={(event) => setKeepSource(event.target.checked)}
            className="h-4 w-4 rounded border-kb-border accent-primary"
          />
          同时保留一份在原位置
          <Info className="h-3.5 w-3.5 text-kb-muted stroke-[1.7]" />
        </label>

        <LocationBlock label={isCopy ? "复制后位置" : "移动后位置"} value={targetLocation} />
      </div>
    </AppFormDialog>
  );
}

function LocationBlock({
  label,
  value,
  trailing,
}: {
  label: string;
  value: string;
  trailing?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-kb-body">{label}</div>
      <div className="flex min-h-9 items-center gap-2 rounded-[7px] bg-[#F2F6F7] px-3 text-[12px] text-kb-body">
        <span className="min-w-0 flex-1 truncate">{value}</span>
        {trailing && (
          <span className="shrink-0 rounded-[5px] bg-primary-soft px-2 py-1 text-[10.5px] font-medium text-primary">
            {trailing}
          </span>
        )}
      </div>
    </div>
  );
}

function KnowledgeBaseRow({
  base,
  selected,
  onSelect,
}: {
  base: KnowledgeBase;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-[7px] px-2 text-left transition-colors",
        selected ? "bg-primary-soft text-primary" : "text-kb-body hover:bg-kb-surface-hover",
      )}
    >
      <KnowledgeBaseIcon size="sm" className={cn(!selected && "bg-[#EEF4F5] text-[#7F969F]")} />
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">{base.name}</span>
      {selected && <Check className="h-3.5 w-3.5 shrink-0 stroke-[2]" />}
    </button>
  );
}

function FlatDirectoryResults({
  directories,
  selectedId,
  onSelect,
}: {
  directories: KnowledgeInternalDirectory[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-px">
      {directories.map((directory) => (
        <button
          key={directory.id}
          type="button"
          onClick={() => onSelect(directory.id)}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-[7px] px-2.5 text-left text-[12px] transition-colors",
            selectedId === directory.id
              ? "bg-primary-soft font-medium text-primary"
              : "text-kb-body hover:bg-kb-surface-hover",
          )}
        >
          <Folder className="h-4 w-4 shrink-0 stroke-[1.8]" />
          <span className="min-w-0 flex-1 truncate">{directory.name}</span>
          {selectedId === directory.id && <Check className="h-3.5 w-3.5" />}
        </button>
      ))}
    </div>
  );
}

function EmptySearch({ label }: { label: string }) {
  return (
    <div className="grid h-full min-h-24 place-items-center px-4 text-center text-[11.5px] text-kb-muted">
      {label}
    </div>
  );
}
