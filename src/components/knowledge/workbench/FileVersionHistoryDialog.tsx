import { Download, Eye, History } from "lucide-react";
import { toast } from "sonner";
import { AppFormDialog } from "@/components/ui/app-dialog";
import type { KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export function FileVersionHistoryDialog({
  file,
  onClose,
  onPreviewVersion,
}: {
  file: KnowledgeFile | null;
  onClose: () => void;
  onPreviewVersion?: (versionId: string) => void;
}) {
  const versions = file?.versions ?? [];

  return (
    <AppFormDialog
      open={Boolean(file)}
      size="compact"
      title="历史版本"
      titleIcon={History}
      onClose={onClose}
    >
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-[#526670]">
          <strong className="font-semibold text-foreground">{file?.name}</strong>
          共 {versions.length} 个版本。所有版本均可在文件列表中被检索到，历史版本不参与智能问答召回，仅支持预览与下载。
        </p>

        <ol className="relative space-y-2.5 pl-1">
          {versions.map((version) => (
            <li
              key={version.id}
              className={cn(
                "rounded-[10px] border px-3.5 py-3 transition-colors",
                version.isCurrent
                  ? "border-primary/30 bg-primary-soft/25"
                  : "border-divider bg-card hover:border-primary/20",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-5 items-center rounded-[6px] bg-muted px-1.5 text-[11px] font-semibold text-foreground">
                      {version.version}
                    </span>
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {version.name}
                    </span>
                    {version.isCurrent && (
                      <span className="shrink-0 rounded-[6px] bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                        当前版本
                      </span>
                    )}
                  </div>
                  {version.description && (
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                      {version.description}
                    </p>
                  )}
                  <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                    {version.uploaderName} · {version.uploadedAt}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <VersionAction
                    icon={Eye}
                    label="预览"
                    onClick={() => {
                      if (onPreviewVersion) onPreviewVersion(version.id);
                      else toast.message(`预览 ${version.version}`);
                    }}
                  />
                  <VersionAction
                    icon={Download}
                    label="下载"
                    onClick={() => toast.message(`下载 ${version.version}`)}
                  />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </AppFormDialog>
  );
}

function VersionAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
    >
      <Icon className="h-4 w-4 stroke-[1.8]" />
    </button>
  );
}
