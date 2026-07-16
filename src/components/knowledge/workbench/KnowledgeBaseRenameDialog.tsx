import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormInput } from "@/components/ui/app-form";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui";
import type { KnowledgeBase } from "@/lib/knowledge/types";

const NAME_MAX_LENGTH = 60;

export function KnowledgeBaseRenameDialog({
  base,
  loading,
  onClose,
  onConfirm,
}: {
  base: KnowledgeBase | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}) {
  const open = Boolean(base);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!base) return;
    setName(base.name);
    setError(undefined);
  }, [base]);

  const submit = () => {
    if (!base || loading) return;
    const trimmed = name.trim();

    if (!trimmed) {
      setError("请输入知识库名称");
      return;
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      setError(`知识库名称不超过 ${NAME_MAX_LENGTH} 个字符`);
      return;
    }
    if (trimmed === base.name) {
      onClose();
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
      title="重命名知识库"
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
      <KbFormField label="知识库名称" icon={Pencil} required className="mb-0" error={error}>
        <AppFormInput
          value={name}
          maxLength={NAME_MAX_LENGTH}
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
          placeholder="请输入知识库名称"
        />
      </KbFormField>
    </KbFormDialog>
  );
}
