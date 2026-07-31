import { Check, ChevronDown, Clock3, FolderInput, Library, Lock, Search, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getCategoryChain,
  getCategoryChildren,
  getCategoryPathLabel,
  getMoveTargetBases,
  isSubmitToPublicMove,
} from "@/lib/knowledge/model";
import { loadRecentMoveIds, pushRecentMoveId } from "@/lib/knowledge/recentMove";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type { KnowledgeBase, KnowledgeCategory, KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

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
  onConfirm: (files: KnowledgeFile[], targetBaseId: string) => void;
}) {
  const open = files.length === 1;
  const rejectedBatch = files.length > 1;

  useEffect(() => {
    if (!rejectedBatch) return;
    toast.error("移动仅支持单个文件，不做批量移动");
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在误传批量时关闭一次
  }, [rejectedBatch]);

  const storeVersion = useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );
  const [target, setTarget] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);

  useEffect(() => {
    if (open) setTarget("");
  }, [open, files]);

  // 未显式传入当前库时（如全库页面），以文件所属库推断源作用域
  const effectiveBaseId = currentBaseId ?? files[0]?.knowledgeBaseId;
  const targets = useMemo(
    () => getMoveTargetBases(effectiveBaseId),
    [effectiveBaseId, open, storeVersion],
  );
  const targetById = useMemo(() => new Map(targets.map((b) => [b.id, b])), [targets]);

  const recentBases = useMemo(() => {
    if (!open) return [];
    return loadRecentMoveIds()
      .map((id) => targetById.get(id))
      .filter((base): base is KnowledgeBase => Boolean(base))
      .slice(0, 4);
  }, [open, targetById]);

  const selectedBase = target ? targetById.get(target) : undefined;
  const isSubmitApproval = isSubmitToPublicMove(effectiveBaseId, target);

  const handleConfirm = () => {
    if (!target || files.length !== 1) return;
    if (isSubmitApproval) {
      toast.message("跨库移动入库（重解析 + 审批）需求已保留，一期暂不开放（依赖 RAG）");
      return;
    }
    pushRecentMoveId(target);
    onConfirm(files, target);
  };

  return (
    <AppFormDialog
      open={open}
      size="small"
      title={isSubmitApproval ? "提交到专业/公共知识库" : "移动文件"}
      titleIcon={FolderInput}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton
            variant="primary"
            loading={loading}
            disabled={!target || isSubmitApproval}
            onClick={handleConfirm}
          >
            {isSubmitApproval ? "暂未开放" : "确认移动"}
          </AppDialogButton>
        </>
      }
    >
      <div className="space-y-3.5">
        <p className="text-[13px] leading-relaxed text-[#526670]">
          {isSubmitApproval ? (
            <>
              移入专业/公共知识库并触发重解析与审批的能力已写入需求（SR-48），一期暂不实现，依赖 RAG 入库链路后续开放。
            </>
          ) : (
            <>
              将
              <strong className="mx-1 font-semibold text-foreground">{files[0]?.name}</strong>
              移动到目标知识库。
            </>
          )}
        </p>

        <div className="space-y-1.5">
          <span className="block text-[12px] font-medium text-kb-body">目标知识库</span>
          <BaseTreeSelect
            value={target}
            selectedBase={selectedBase}
            targets={targets}
            open={treeOpen}
            onOpenChange={setTreeOpen}
            onChange={(id) => {
              setTarget(id);
              setTreeOpen(false);
            }}
          />
        </div>

        {recentBases.length > 0 && (
          <div className="space-y-1.5">
            <span className="flex items-center gap-1 text-[11.5px] font-medium text-kb-muted">
              <Clock3 className="h-3 w-3 stroke-[1.8]" />
              最近移动
            </span>
            <div className="flex flex-wrap gap-1.5">
              {recentBases.map((base) => (
                <button
                  key={base.id}
                  type="button"
                  onClick={() => setTarget(base.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                    target === base.id
                      ? "border-primary/40 bg-primary-soft/40 text-accent-foreground"
                      : "border-kb-border bg-card text-kb-body hover:border-primary/30 hover:bg-kb-surface-hover",
                  )}
                >
                  {base.scope === "personal" ? (
                    <UserRound className="h-3 w-3 shrink-0 stroke-[1.8]" />
                  ) : (
                    <Library className="h-3 w-3 shrink-0 stroke-[1.8]" />
                  )}
                  <span className="max-w-[140px] truncate">{base.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppFormDialog>
  );
}

export function BaseTreeSelect({
  value,
  selectedBase,
  targets,
  open,
  onOpenChange,
  onChange,
}: {
  value: string;
  selectedBase?: KnowledgeBase;
  targets: KnowledgeBase[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const personalTargets = useMemo(
    () => targets.filter((base) => base.scope === "personal"),
    [targets],
  );
  const professionalTargets = useMemo(
    () => targets.filter((base) => base.scope !== "personal"),
    [targets],
  );
  const rootProfessional = useMemo(
    () => professionalTargets.filter((base) => !base.categoryId),
    [professionalTargets],
  );

  const categoriesWithTargets = useMemo(() => {
    const set = new Set<string>();
    for (const base of professionalTargets) {
      if (base.categoryId) {
        for (const category of getCategoryChain(base.categoryId)) set.add(category.id);
      }
    }
    return set;
  }, [professionalTargets]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return targets.filter((base) => base.name.toLowerCase().includes(normalized));
  }, [query, targets]);

  const hasTargets = targets.length > 0;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={!hasTargets}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-[8px] border border-kb-border bg-card px-3 text-left text-[13px] transition-colors",
            "hover:border-primary/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20",
            selectedBase ? "text-kb-body" : "text-kb-muted",
            !hasTargets && "cursor-not-allowed opacity-60",
          )}
        >
          {selectedBase ? (
            selectedBase.scope === "personal" ? (
              <UserRound className="h-4 w-4 shrink-0 text-primary stroke-[1.8]" />
            ) : (
              <Library className="h-4 w-4 shrink-0 text-primary stroke-[1.8]" />
            )
          ) : (
            <FolderInput className="h-4 w-4 shrink-0 text-kb-muted stroke-[1.8]" />
          )}
          <span className="min-w-0 flex-1 truncate">
            {selectedBase?.name ?? (hasTargets ? "请选择目标知识库" : "暂无可移动到的知识库")}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-kb-muted transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={1.8}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[300px] p-0"
        align="start"
        sideOffset={4}
      >
        <div className="border-b border-divider px-2.5 py-2">
          <div className="flex h-8 items-center gap-2 rounded-[6px] border border-kb-border bg-card px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索知识库"
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-kb-body outline-none placeholder:text-kb-muted"
            />
          </div>
        </div>
        <div className="scrollbar-thin max-h-[280px] overflow-y-auto p-1">
          {!hasTargets ? (
            <EmptyHint />
          ) : query.trim() ? (
            filtered.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-kb-muted">无匹配知识库</p>
            ) : (
              filtered.map((base) => (
                <BaseRow
                  key={base.id}
                  base={base}
                  selected={value === base.id}
                  onSelect={() => onChange(base.id)}
                  showPath
                />
              ))
            )
          ) : (
            <>
              {personalTargets.length > 0 && (
                <GroupLabel label="个人知识库" />
              )}
              {personalTargets.map((base) => (
                <BaseRow
                  key={base.id}
                  base={base}
                  selected={value === base.id}
                  onSelect={() => onChange(base.id)}
                />
              ))}

              {professionalTargets.length > 0 && <GroupLabel label="公共知识库" />}
              {rootProfessional.map((base) => (
                <BaseRow
                  key={base.id}
                  base={base}
                  selected={value === base.id}
                  onSelect={() => onChange(base.id)}
                />
              ))}
              {getCategoryChildren().map((category) => (
                <CategoryBranch
                  key={category.id}
                  category={category}
                  depth={0}
                  value={value}
                  professionalTargets={professionalTargets}
                  categoriesWithTargets={categoriesWithTargets}
                  onSelect={onChange}
                />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CategoryBranch({
  category,
  depth,
  value,
  professionalTargets,
  categoriesWithTargets,
  onSelect,
}: {
  category: KnowledgeCategory;
  depth: number;
  value: string;
  professionalTargets: KnowledgeBase[];
  categoriesWithTargets: Set<string>;
  onSelect: (id: string) => void;
}) {
  if (!categoriesWithTargets.has(category.id)) return null;
  const directBases = professionalTargets.filter((base) => base.categoryId === category.id);
  const children = getCategoryChildren(category.id);

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 pr-2 text-[11.5px] font-medium text-kb-muted"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <Library className="h-3.5 w-3.5 shrink-0 text-kb-muted/70 stroke-[1.8]" />
        <span className="min-w-0 flex-1 truncate">{category.name}</span>
      </div>
      {directBases.map((base) => (
        <BaseRow
          key={base.id}
          base={base}
          selected={value === base.id}
          depth={depth + 1}
          onSelect={() => onSelect(base.id)}
        />
      ))}
      {children.map((child) => (
        <CategoryBranch
          key={child.id}
          category={child}
          depth={depth + 1}
          value={value}
          professionalTargets={professionalTargets}
          categoriesWithTargets={categoriesWithTargets}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function BaseRow({
  base,
  selected,
  depth = 0,
  showPath = false,
  onSelect,
}: {
  base: KnowledgeBase;
  selected: boolean;
  depth?: number;
  showPath?: boolean;
  onSelect: () => void;
}) {
  const Icon = base.scope === "personal" ? UserRound : Library;
  const path =
    showPath && base.categoryId
      ? getCategoryPathLabel(base.categoryId)
      : base.scope === "personal"
        ? "个人知识库"
        : undefined;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-[6px] py-1.5 pr-2 text-left transition-colors",
        selected ? "bg-primary-soft text-accent-foreground" : "text-kb-body hover:bg-kb-surface-hover",
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 stroke-[1.8]",
          selected ? "text-primary" : "text-kb-muted",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium">{base.name}</span>
        {path && (
          <span className="block truncate text-[11px] text-kb-muted">{path}</span>
        )}
      </span>
      <Check
        className={cn("h-3.5 w-3.5 shrink-0 text-primary", selected ? "opacity-100" : "opacity-0")}
      />
    </button>
  );
}

function GroupLabel({ label }: { label: string }) {
  return (
    <div className="px-2 pb-0.5 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-kb-muted/80">
      {label}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <Lock className="h-5 w-5 text-kb-muted" strokeWidth={1.6} />
      <p className="px-4 text-[12.5px] text-kb-muted">
        没有可移动到的知识库，你需要对目标库有管理或上传权限。
      </p>
    </div>
  );
}
