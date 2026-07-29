import { useEffect, useMemo, useState } from "react";
import { Check, FileText, Search, X } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { KnowledgeBaseIcon } from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES } from "@/lib/knowledge/data";
import type { KnowledgeBase, KnowledgeBaseScope } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

type SelectableKnowledgeScope = Extract<KnowledgeBaseScope, "professional" | "personal">;

export const CHAT_KNOWLEDGE_BASES = KNOWLEDGE_BASES.filter(
  (base) =>
    (base.scope === "professional" || base.scope === "personal") &&
    base.status === "enabled" &&
    base.permission.canView,
);

const SCOPE_OPTIONS: Array<{
  value: SelectableKnowledgeScope;
  label: string;
  description: string;
}> = [
  {
    value: "professional",
    label: "专业知识库",
    description: "已授权的专业规程、标准与业务资料",
  },
  {
    value: "personal",
    label: "个人知识库",
    description: "仅自己可维护和使用的工作沉淀",
  },
];

function scopeCount(scope: SelectableKnowledgeScope) {
  return CHAT_KNOWLEDGE_BASES.filter((base) => base.scope === scope).length;
}

function KnowledgeBaseRow({
  base,
  checked,
  onToggle,
}: {
  base: KnowledgeBase;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "grid min-h-[48px] w-full grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[8px] border px-3 py-1.5 text-left transition-[border-color,background-color,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1",
        checked
          ? "border-primary/35 bg-primary-soft/45 shadow-[0_0_0_1px_rgba(52,155,172,0.04)]"
          : "border-transparent bg-white hover:border-[#dce8eb] hover:bg-[#f8fbfc]",
      )}
    >
      <span
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[4px] border transition-colors",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-[#cdd9dd] bg-white text-transparent",
        )}
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5 stroke-[2.4]" />
      </span>

      <KnowledgeBaseIcon size="sm" />

      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium leading-5 text-kb-heading">{base.name}</span>
        <span className="mt-0.5 block truncate text-[11px] leading-4 text-kb-muted">
          {base.description || "暂无知识库说明"}
        </span>
      </span>

      <span className="inline-flex shrink-0 items-center gap-1 text-[10.5px] text-kb-muted">
        <FileText className="h-3 w-3" />
        {base.fileCount ?? 0}
      </span>
    </button>
  );
}

export function KnowledgeBaseSelectorDialog({
  open,
  value,
  onOpenChange,
  onChange,
}: {
  open: boolean;
  value: string[];
  onOpenChange: (open: boolean) => void;
  onChange: (value: string[]) => void;
}) {
  const [activeScope, setActiveScope] = useState<SelectableKnowledgeScope>("professional");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>(value);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setQuery("");
  }, [open, value]);

  const visibleBases = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return CHAT_KNOWLEDGE_BASES.filter((base) => {
      if (base.scope !== activeScope) return false;
      if (!normalizedQuery) return true;
      return [base.name, base.description, ...(base.categoryPath ?? [])]
        .filter(Boolean)
        .some((text) => text?.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [activeScope, query]);

  const selectedBases = useMemo(
    () => CHAT_KNOWLEDGE_BASES.filter((base) => draft.includes(base.id)),
    [draft],
  );

  const toggleBase = (baseId: string) => {
    setDraft((current) =>
      current.includes(baseId) ? current.filter((item) => item !== baseId) : [...current, baseId],
    );
  };

  const confirmSelection = () => {
    onChange(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#17252b]/45 backdrop-blur-[1px]"
        className="flex h-[min(720px,calc(100dvh-2rem))] max-w-[960px] flex-col gap-0 rounded-[14px] border-[#dce6e9] bg-white p-0 shadow-[0_24px_80px_rgba(24,53,63,0.22)]"
      >
        <div className="shrink-0 border-b border-divider px-5 py-4 pr-14 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <KnowledgeBaseIcon size="md" className="mt-0.5" />
            <div className="min-w-0">
              <DialogTitle className="text-[17px] font-semibold leading-6 text-kb-heading">
                选择对话知识库
              </DialogTitle>
              <DialogDescription className="mt-1 text-[12px] leading-5 text-kb-muted">
                智能助手会优先从已选知识库检索依据，本次设置将用于当前对话。
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
          <section
            className="flex min-h-0 flex-col border-divider md:border-r"
            aria-label="知识库列表"
          >
            <div className="shrink-0 px-4 pt-3 sm:px-5">
              <div className="flex gap-1 border-b border-divider" role="tablist">
                {SCOPE_OPTIONS.map((option) => {
                  const active = option.value === activeScope;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveScope(option.value)}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 px-1 pb-2.5 pt-1 text-[12.5px] font-medium transition-colors duration-150 focus-visible:outline-none",
                        active ? "text-primary" : "text-kb-muted hover:text-kb-body",
                      )}
                    >
                      {option.label}
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-px text-[10px] tabular-nums",
                          active
                            ? "bg-primary-soft text-primary"
                            : "bg-[#eef2f3] text-kb-muted",
                        )}
                      >
                        {scopeCount(option.value)}
                      </span>
                      {active && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label={`搜索${activeScope === "professional" ? "专业" : "个人"}知识库`}
                  placeholder="搜索知识库名称或说明"
                  className="h-10 w-full rounded-[8px] border border-[#dce6e9] bg-white pl-9 pr-9 text-[12.5px] text-kb-heading outline-none transition-[border-color,box-shadow] placeholder:text-kb-muted focus:border-primary/55 focus:ring-2 focus:ring-primary/10"
                />
                {query && (
                  <button
                    type="button"
                    aria-label="清空搜索"
                    onClick={() => setQuery("")}
                    className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[6px] text-kb-muted hover:bg-[#f2f6f7] hover:text-kb-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="scrollbar-neutral min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              {visibleBases.length > 0 ? (
                <div className="space-y-2">
                  {visibleBases.map((base) => (
                    <KnowledgeBaseRow
                      key={base.id}
                      base={base}
                      checked={draft.includes(base.id)}
                      onToggle={() => toggleBase(base.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-40 flex-col items-center justify-center px-6 text-center">
                  <Search className="h-5 w-5 text-[#9aadb4]" />
                  <p className="mt-2 text-[12.5px] font-medium text-kb-body">未找到匹配的知识库</p>
                  <p className="mt-1 text-[11px] text-kb-muted">
                    可以尝试缩短关键词或切换知识库类型
                  </p>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden min-h-0 flex-col bg-[#fafcfc] md:flex" aria-label="已选知识库">
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-divider px-4">
              <span className="text-[12.5px] font-semibold text-kb-heading">已选知识库</span>
              <span className="rounded-[6px] bg-primary-soft px-2 py-1 text-[10.5px] font-medium text-primary">
                {selectedBases.length} 个
              </span>
              {selectedBases.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft([])}
                  className="ml-auto text-[11px] text-kb-muted transition-colors hover:text-kb-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  清空全部
                </button>
              )}
            </div>

            <div className="scrollbar-neutral min-h-0 flex-1 overflow-y-auto p-3">
              {selectedBases.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedBases.map((base) => (
                    <div
                      key={base.id}
                      className="flex min-h-12 items-start gap-2.5 rounded-[8px] border border-[#e3ebed] bg-white px-2.5 py-2"
                    >
                      <KnowledgeBaseIcon size="sm" className="mt-px" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12px] font-medium text-kb-heading">
                          {base.name}
                        </div>
                        <div className="mt-0.5 text-[10.5px] text-kb-muted">
                          {base.scope === "personal" ? "个人知识库" : "专业知识库"}
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`移除${base.name}`}
                        onClick={() => toggleBase(base.id)}
                        className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-[5px] text-kb-muted transition-colors hover:bg-[#f0f5f6] hover:text-kb-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-40 flex-col items-center justify-center px-6 text-center">
                  <KnowledgeBaseIcon size="md" className="opacity-70" />
                  <p className="mt-3 text-[12.5px] font-medium text-kb-body">暂未选择知识库</p>
                  <p className="mt-1 max-w-48 text-[11px] leading-5 text-kb-muted">
                    未选择时将使用平台默认知识范围回答
                  </p>
                </div>
              )}
            </div>

          </aside>
        </div>

        <div className="flex shrink-0 items-center gap-3 border-t border-divider bg-white px-4 py-3 sm:px-6">
          <p className="min-w-0 flex-1 truncate text-[11px] text-kb-muted">
            已选 {selectedBases.length} 个知识库，可在输入框上方随时移除
          </p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-[7px] border border-[#d8e2e5] bg-white px-4 text-[12px] font-medium text-kb-body transition-colors hover:bg-[#f6f9f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            取消
          </button>
          <button
            type="button"
            onClick={confirmSelection}
            className="h-9 rounded-[7px] bg-primary px-5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            确定
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
