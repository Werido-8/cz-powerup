import { ArrowLeftRight, FileStack, GitCompareArrows, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { KbFormField } from "@/components/knowledge/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPARE_VERSIONS, getCompareVersion } from "@/lib/file-compare/data";

export function VersionSwitchDialog({
  open,
  baseVersionId,
  targetVersionId,
  onClose,
  onConfirm,
}: {
  open: boolean;
  baseVersionId: string;
  targetVersionId: string;
  onClose: () => void;
  onConfirm: (next: { baseVersionId: string; targetVersionId: string }) => void;
}) {
  const [base, setBase] = useState(baseVersionId);
  const [target, setTarget] = useState(targetVersionId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setBase(baseVersionId);
    setTarget(targetVersionId);
    setError(null);
  }, [open, baseVersionId, targetVersionId]);

  const currentBase = getCompareVersion(baseVersionId);
  const currentTarget = getCompareVersion(targetVersionId);

  const validate = (nextBase: string, nextTarget: string) => {
    if (nextBase === nextTarget) {
      setError("基准版本与更新版本不能相同，请选择不同的两个版本。");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSwap = () => {
    setBase(target);
    setTarget(base);
    validate(target, base);
  };

  const handleConfirm = () => {
    if (!validate(base, target)) return;
    onConfirm({ baseVersionId: base, targetVersionId: target });
  };

  const unchanged = base === baseVersionId && target === targetVersionId;
  const invalid = base === target;

  return (
    <AppFormDialog
      open={open}
      size="medium"
      title="切换比对版本"
      titleIcon={GitCompareArrows}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton
            variant="primary"
            onClick={handleConfirm}
            disabled={unchanged || invalid}
          >
            确定切换
          </AppDialogButton>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3">
        <CurrentFileCard
          label="当前基准文件"
          name={currentBase.fileName}
          meta={`${currentBase.label} · ${currentBase.pages} 页 · ${currentBase.publishedAt}`}
        />
        <CurrentFileCard
          label="当前更新文件"
          name={currentTarget.fileName}
          meta={`${currentTarget.label} · ${currentTarget.pages} 页 · ${currentTarget.publishedAt}`}
        />
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <KbFormField label="基准版本" icon={Layers} required className="mb-0">
          <Select
            value={base}
            onValueChange={(value) => {
              setBase(value);
              validate(value, target);
            }}
          >
            <SelectTrigger className="h-10 !rounded-[7px] border-[#D6E1E9] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPARE_VERSIONS.map((version) => (
                <SelectItem key={version.id} value={version.id} className="text-[13px]">
                  {version.label} · {version.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </KbFormField>

        <button
          type="button"
          onClick={handleSwap}
          aria-label="交换基准文件与更新文件"
          className="mb-[1px] grid h-10 w-10 shrink-0 place-items-center rounded-[7px] border border-[#D6E1E9] bg-white text-kb-muted transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          <ArrowLeftRight className="h-4 w-4 stroke-[1.9]" />
        </button>

        <KbFormField label="更新版本" icon={FileStack} required className="mb-0">
          <Select
            value={target}
            onValueChange={(value) => {
              setTarget(value);
              validate(base, value);
            }}
          >
            <SelectTrigger className="h-10 !rounded-[7px] border-[#D6E1E9] text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMPARE_VERSIONS.map((version) => (
                <SelectItem key={version.id} value={version.id} className="text-[13px]">
                  {version.label} · {version.fileName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </KbFormField>
      </div>

      {error ? (
        <p className="mt-2.5 text-[12px] text-[var(--form-required)]" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-2.5 text-[12px] text-kb-muted">
          切换后将以所选版本重新加载差异结果，示例环境使用演示数据。
        </p>
      )}
    </AppFormDialog>
  );
}

function CurrentFileCard({ label, name, meta }: { label: string; name: string; meta: string }) {
  return (
    <div className="rounded-[8px] border border-[#E4EDF0] bg-[#F8FBFC] px-3.5 py-2.5">
      <div className="text-[11.5px] text-kb-muted">{label}</div>
      <div className="mt-1 truncate text-[13.5px] font-semibold text-kb-heading" title={name}>
        {name}
      </div>
      <div className="mt-0.5 truncate text-[11.5px] text-kb-muted">{meta}</div>
    </div>
  );
}
