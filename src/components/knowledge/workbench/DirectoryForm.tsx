import { useEffect, useState } from "react";
import { Folder, FolderPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormInput } from "@/components/ui/app-form";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui";
import {
  getCategoryNameMaxLength,
  hasSiblingCategoryName,
} from "@/lib/knowledge/model";
import {
  PROFESSIONAL_CATEGORY_ROOT_ID,
  addStoreCategory,
} from "@/lib/knowledge/store";
import type { KnowledgeCategory } from "@/lib/knowledge/types";
import { CategoryTreeSelect } from "./CategoryTreeSelect";

type FieldErrors = {
  parentId?: string;
  name?: string;
};

export interface DirectoryFormProps {
  open: boolean;
  mode?: "create";
  defaultParentId?: string;
  onSuccess?: (directory: KnowledgeCategory) => void;
  onClose: () => void;
}

export function DirectoryForm({
  open,
  defaultParentId,
  onSuccess,
  onClose,
}: DirectoryFormProps) {
  const [parentId, setParentId] = useState("");
  const [name, setName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setParentId(defaultParentId ?? "");
    setName("");
    setFieldErrors({});
    setSubmitting(false);
  }, [open, defaultParentId]);

  const submit = () => {
    if (submitting) return;

    const trimmed = name.trim();
    const nextErrors: FieldErrors = {};

    if (!parentId) {
      nextErrors.parentId = "请选择父级目录";
    }
    if (!trimmed) {
      nextErrors.name = "请输入目录名称";
    } else if (trimmed.length > getCategoryNameMaxLength()) {
      nextErrors.name = `目录名称不超过 ${getCategoryNameMaxLength()} 个字符`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    const resolvedParentId =
      parentId === PROFESSIONAL_CATEGORY_ROOT_ID ? undefined : parentId;

    if (hasSiblingCategoryName(resolvedParentId, trimmed)) {
      setFieldErrors({ name: "同一父级目录下已存在同名目录" });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    const directory: KnowledgeCategory = {
      id: `cat-${Date.now()}`,
      name: trimmed,
      ...(resolvedParentId ? { parentId: resolvedParentId } : {}),
    };

    addStoreCategory(directory);
    toast.success("目录已创建");
    onSuccess?.(directory);
    onClose();
    setSubmitting(false);
  };

  return (
    <KbFormDialog
      open={open}
      size="compact"
      variant="form"
      title="新建目录"
      titleIcon={FolderPlus}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={submit} loading={submitting}>
            {submitting ? "创建中" : "创建"}
          </AppDialogButton>
        </>
      }
    >
      <KbFormField label="父级目录" icon={Folder} required error={fieldErrors.parentId}>
        <CategoryTreeSelect
          value={parentId}
          variant="form"
          error={Boolean(fieldErrors.parentId)}
          onChange={(value) => {
            setParentId(value);
            setFieldErrors((prev) => ({ ...prev, parentId: undefined }));
          }}
          placeholder="请选择父级目录"
          searchPlaceholder="输入目录名称或路径筛选"
          includeRoot
        />
      </KbFormField>
      <KbFormField label="目录名称" icon={Pencil} required className="mb-0" error={fieldErrors.name}>
        <AppFormInput
          value={name}
          maxLength={getCategoryNameMaxLength()}
          error={Boolean(fieldErrors.name)}
          disabled={submitting}
          onChange={(event) => {
            setName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="请输入目录名称"
        />
      </KbFormField>
    </KbFormDialog>
  );
}
