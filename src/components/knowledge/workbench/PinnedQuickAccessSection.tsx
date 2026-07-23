import { Library, PinOff } from "lucide-react";
import type { ReactNode } from "react";
import { KbFileTypeIcon, KbSidebarSection } from "@/components/knowledge/ui";
import type { KnowledgeBase, KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export function PinnedQuickAccessSection({
  pinnedBases,
  pinnedFiles,
  selectedBaseId,
  onSelectBase,
  onOpenFile,
  onUnpinBase,
  onUnpinFile,
}: {
  pinnedBases: KnowledgeBase[];
  pinnedFiles: KnowledgeFile[];
  selectedBaseId?: string;
  onSelectBase: (baseId: string) => void;
  onOpenFile: (file: KnowledgeFile) => void;
  onUnpinBase: (baseId: string) => void;
  onUnpinFile: (file: KnowledgeFile) => void;
}) {
  const isEmpty = pinnedBases.length === 0 && pinnedFiles.length === 0;

  return (
    <KbSidebarSection title="快速访问">
      {isEmpty ? (
        <p className="px-2.5 py-1 text-[11px] text-kb-muted">
          置顶知识库或文件后将显示在这里
        </p>
      ) : (
        <div className="space-y-0.5 px-1">
          {pinnedBases.map((base) => (
            <QuickAccessRow
              key={`base-${base.id}`}
              label={base.name}
              selected={selectedBaseId === base.id}
              icon={<Library className="h-3.5 w-3.5 text-primary stroke-[1.8]" />}
              onClick={() => onSelectBase(base.id)}
              onUnpin={() => onUnpinBase(base.id)}
            />
          ))}
          {pinnedFiles.map((file) => {
            return (
              <QuickAccessRow
                key={`file-${file.id}`}
                label={file.name}
                icon={<KbFileTypeIcon type={file.type} fileName={file.name} size="xs" />}
                onClick={() => onOpenFile(file)}
                onUnpin={() => onUnpinFile(file)}
              />
            );
          })}
        </div>
      )}
    </KbSidebarSection>
  );
}

function QuickAccessRow({
  label,
  icon,
  selected,
  onClick,
  onUnpin,
}: {
  label: string;
  icon: ReactNode;
  selected?: boolean;
  onClick: () => void;
  onUnpin: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex h-8 w-full items-center rounded-[8px] transition-colors",
        selected ? "bg-primary-soft font-medium text-accent-foreground" : "text-kb-body hover:bg-[#F4FAFB]",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-2 px-2.5 text-left text-[12.5px]"
      >
        <span className="shrink-0">{icon}</span>
        <span className="min-w-0 flex-1 truncate pr-6">{label}</span>
      </button>
      <button
        type="button"
        aria-label="取消置顶"
        title="取消置顶"
        onClick={(event) => {
          event.stopPropagation();
          onUnpin();
        }}
        className={cn(
          "absolute right-1.5 grid h-5 w-5 place-items-center rounded-[5px] text-kb-muted",
          "opacity-0 transition-opacity group-hover:opacity-100",
          "hover:bg-white/80 hover:text-primary",
        )}
      >
        <PinOff className="h-3 w-3 stroke-[1.8]" />
      </button>
    </div>
  );
}
