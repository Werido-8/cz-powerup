import { useEffect, useState } from "react";
import {
  FileText,
  Folder,
  Globe,
  KeyRound,
  Library,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormInput, AppFormTextarea } from "@/components/ui/app-form";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui";
import { CURRENT_KNOWLEDGE_USER } from "@/lib/knowledge/data";
import {
  getCategoryPathLabel,
  getKnowledgeBaseDescriptionMaxLength,
} from "@/lib/knowledge/model";
import type { KnowledgeBase, KnowledgeBaseScope } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { CategoryTreeSelect } from "../CategoryTreeSelect";

type FieldErrors = {
  categoryId?: string;
  name?: string;
};

type SelectableScope = Exclude<KnowledgeBaseScope, "personal">;

const SCOPE_OPTIONS: {
  value: SelectableScope;
  label: string;
  desc: string;
  icon: typeof Globe;
}[] = [
  {
    value: "professional",
    label: "专业知识库",
    desc: "面向特定部门 / 岗位，需配置查看、上传与管理权限",
    icon: ShieldCheck,
  },
  {
    value: "public",
    label: "公共库",
    desc: "面向全员开放，无需配置权限，所有人可查看",
    icon: Globe,
  },
];

export function KnowledgeBaseFormDrawer({
  base,
  defaultCategoryId,
  onClose,
  onSubmit,
  open = true,
}: {
  base?: KnowledgeBase;
  /** 新建时预填挂载目录；全局入口可不传 */
  defaultCategoryId?: string;
  onClose: () => void;
  onSubmit: (base: KnowledgeBase) => void;
  open?: boolean;
}) {
  const isEdit = Boolean(base);
  const [name, setName] = useState(base?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    base?.categoryId ?? defaultCategoryId ?? "",
  );
  const [description, setDescription] = useState(base?.description ?? "");
  const [scope, setScope] = useState<SelectableScope>(
    base?.scope === "public" ? "public" : "professional",
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const descriptionMaxLength = getKnowledgeBaseDescriptionMaxLength();

  useEffect(() => {
    setName(base?.name ?? "");
    setCategoryId(base?.categoryId ?? defaultCategoryId ?? "");
    setDescription(base?.description ?? "");
    setScope(base?.scope === "public" ? "public" : "professional");
    setFieldErrors({});
    setSubmitting(false);
  }, [base, defaultCategoryId, open]);

  const submit = () => {
    if (submitting) return;

    const trimmedName = name.trim();
    const nextErrors: FieldErrors = {};

    if (!categoryId) {
      nextErrors.categoryId = "请选择挂载目录";
    }
    if (!trimmedName) {
      nextErrors.name = "请输入知识库名称";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    const pathLabel = getCategoryPathLabel(categoryId);
    const isPublic = scope === "public";

    const basePermission = base?.permission ?? {
      canView: true,
      canUpload: true,
      canManage: true,
      canConfigurePermission: true,
    };

    onSubmit({
      id: base?.id ?? `kb-${Date.now()}`,
      name: trimmedName,
      description: description.trim(),
      scope,
      categoryId,
      categoryPath: pathLabel ? pathLabel.split(" / ") : undefined,
      fileCount: base?.fileCount ?? 0,
      status: base?.status ?? "enabled",
      permission: isPublic
        ? {
            // 公共库对全员开放，且不提供权限配置能力
            canView: true,
            canUpload: basePermission.canUpload,
            canManage: basePermission.canManage,
            canConfigurePermission: false,
          }
        : {
            ...basePermission,
            canConfigurePermission: true,
          },
      updatedAt: base?.updatedAt ?? formatNow(),
      ownerName: base?.ownerName ?? CURRENT_KNOWLEDGE_USER.name,
    });
    setSubmitting(false);
  };

  return (
    <KbFormDialog
      open={open}
      size="compact"
      variant="form"
      title={isEdit ? "编辑知识库" : "新建知识库"}
      titleIcon={Library}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={submit} loading={submitting}>
            {submitting ? "保存中" : "保存"}
          </AppDialogButton>
        </>
      }
    >
      <KbFormField label="知识库类型" icon={Library} required>
        <div className="grid grid-cols-2 gap-2.5">
          {SCOPE_OPTIONS.map((option) => {
            const active = scope === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setScope(option.value)}
                className={cn(
                  "group flex flex-col gap-1.5 rounded-[10px] border p-3 text-left transition-colors",
                  active
                    ? "border-primary/60 bg-primary-soft/25 ring-1 ring-primary/25"
                    : "border-[#E1EBEE] bg-white hover:border-primary/35 hover:bg-[#F6FBFC]",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "h-4 w-4 stroke-[1.8]",
                      active ? "text-primary" : "text-kb-muted",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[13px] font-semibold",
                      active ? "text-primary" : "text-kb-heading",
                    )}
                  >
                    {option.label}
                  </span>
                </span>
                <span className="text-[11.5px] leading-snug text-kb-muted">
                  {option.desc}
                </span>
              </button>
            );
          })}
        </div>
        <div
          className={cn(
            "mt-2 flex items-start gap-1.5 rounded-[8px] px-2.5 py-2 text-[11.5px] leading-snug",
            scope === "professional"
              ? "bg-primary-soft/20 text-[#2C6E7B]"
              : "bg-[#F4F6F7] text-kb-muted",
          )}
        >
          {scope === "professional" ? (
            <>
              <KeyRound className="mt-[1px] h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
              <span>专业知识库需在保存后于「权限」中配置查看 / 上传 / 管理范围。</span>
            </>
          ) : (
            <>
              <Globe className="mt-[1px] h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
              <span>公共库对全员开放，无需配置权限。</span>
            </>
          )}
        </div>
      </KbFormField>

      <KbFormField
        label="挂载目录"
        icon={Folder}
        required
        error={fieldErrors.categoryId}
      >
        <CategoryTreeSelect
          value={categoryId}
          variant="form"
          error={Boolean(fieldErrors.categoryId)}
          onChange={(value) => {
            setCategoryId(value);
            setFieldErrors((prev) => ({ ...prev, categoryId: undefined }));
          }}
          placeholder="请选择挂载目录"
          searchPlaceholder="输入目录名称或路径筛选"
        />
      </KbFormField>

      <KbFormField label="名称" icon={Pencil} required error={fieldErrors.name}>
        <AppFormInput
          value={name}
          error={Boolean(fieldErrors.name)}
          onChange={(event) => {
            setName(event.target.value);
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="请输入知识库名称"
        />
      </KbFormField>

      <KbFormField label="简介" icon={FileText} className="mb-0">
        <AppFormTextarea
          value={description}
          maxLength={descriptionMaxLength}
          disabled={submitting}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="简要描述知识库用途与内容范围"
        />
      </KbFormField>
    </KbFormDialog>
  );
}

function formatNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
