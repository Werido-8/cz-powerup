import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormInput } from "@/components/ui/app-form";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui";
import {
  getCategoryNameMaxLength,
  hasSiblingPersonalDirectoryName,
} from "@/lib/knowledge/model";
import type { PersonalDirectory } from "@/lib/knowledge/types";

export function PersonalDirectoryRenameDialog({
  directory,
  loading,
  onClose,
  onConfirm,
}: {
  directory: PersonalDirectory | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  const open = Boolean(directory);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!directory) return;
    setName(directory.name);
    setError(undefined);
  }, [directory]);

  const submit = () => {
    if (!directory || loading) return;
    const trimmed = name.trim();

    if (!trimmed) {
      setError("请输入目录名称");
      return;
    }
    if (trimmed.length > getCategoryNameMaxLength()) {
      setError(`目录名称不超过 ${getCategoryNameMaxLength()} 个字符`);
      return;
    }
    if (trimmed === directory.name) {
      onClose();
      return;
    }
    if (hasSiblingPersonalDirectoryName(directory.parentId, trimmed, directory.id)) {
      setError("同一父级目录下已存在同名目录");
      return;
    }

    setError(undefined);
    onConfirm(trimmed);
  };

  return (
    <KbFormDialog
      open={open}
      size="compact"
      variant="form"
      title="重命名个人目录"
      titleIcon={Pencil}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={submit} loading={loading}>
            {loading ? "保存中" : "保存"}
          </AppDialogButton>
        </>
      }
    >
      <KbFormField label="目录名称" icon={Pencil} required className="mb-0" error={error}>
        <AppFormInput
          value={name}
          maxLength={getCategoryNameMaxLength()}
          error={Boolean(error)}
          disabled={loading}
          autoFocus
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="请输入目录名称"
        />
      </KbFormField>
    </KbFormDialog>
  );
}
