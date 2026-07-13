import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  FileText,
  Folder,
  Globe,
  KeyRound,
  Library,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { AppFormInput, AppFormTextarea } from "@/components/ui/app-form";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui";
import {
  getCategoryPathLabel,
  getKnowledgeBaseDescriptionMaxLength,
} from "@/lib/knowledge/model";
import {
  createInitialGrants,
  getGrantsForBase,
  hasManager,
  summarizeGrants,
  type PermissionGrants,
} from "@/lib/knowledge/permission";
import type { KnowledgeBase, KnowledgeBaseScope } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { CategoryTreeSelect } from "../CategoryTreeSelect";
import { PermissionEditor } from "../permission/PermissionEditor";

type FieldErrors = {
  categoryId?: string;
  name?: string;
};

type TypeChangeFlow = null | "confirm-to-professional" | "configure-permission" | "confirm-to-public";

export function EditKnowledgeBaseDialog({
  base,
  onClose,
  onSubmit,
  open = true,
}: {
  base: KnowledgeBase;
  onClose: () => void;
  onSubmit: (base: KnowledgeBase, grants?: PermissionGrants) => void;
  open?: boolean;
}) {
  const [name, setName] = useState(base.name);
  const [categoryId, setCategoryId] = useState(base.categoryId ?? "");
  const [description, setDescription] = useState(base.description ?? "");
  const [scope, setScope] = useState<KnowledgeBase["scope"]>(base.scope);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [typeChangeFlow, setTypeChangeFlow] = useState<TypeChangeFlow>(null);
  const [pendingGrants, setPendingGrants] = useState<PermissionGrants>(() =>
    getGrantsForBase(base.id),
  );

  const descriptionMaxLength = getKnowledgeBaseDescriptionMaxLength();
  const grantsSummary = summarizeGrants(getGrantsForBase(base.id));
  const isProfessional = scope === "professional";
  const isPublic = scope === "public";

  useEffect(() => {
    setName(base.name);
    setCategoryId(base.categoryId ?? "");
    setDescription(base.description ?? "");
    setScope(base.scope);
    setFieldErrors({});
    setSubmitting(false);
    setTypeChangeFlow(null);
    setPendingGrants(getGrantsForBase(base.id));
  }, [base, open]);

  const submit = () => {
    if (submitting) return;

    const trimmedName = name.trim();
    const nextErrors: FieldErrors = {};
    if (!categoryId) nextErrors.categoryId = "请选择挂载目录";
    if (!trimmedName) nextErrors.name = "请输入知识库名称";

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    const pathLabel = getCategoryPathLabel(categoryId);

    onSubmit({
      ...base,
      name: trimmedName,
      description: description.trim(),
      scope,
      categoryId,
      categoryPath: pathLabel ? pathLabel.split(" / ") : undefined,
      permission: isPublic
        ? {
            canView: true,
            canUpload: false,
            canManage: false,
            canConfigurePermission: false,
          }
        : {
            ...base.permission,
            canConfigurePermission: true,
          },
      updatedAt: formatNow(),
    });
    setSubmitting(false);
  };

  const handleTypeChangeClick = () => {
    if (isPublic) {
      setTypeChangeFlow("confirm-to-professional");
      setPendingGrants(createInitialGrants());
    } else if (isProfessional) {
      setTypeChangeFlow("confirm-to-public");
    }
  };

  const confirmToProfessional = () => {
    setTypeChangeFlow("configure-permission");
  };

  const finishProfessionalTypeChange = () => {
    if (!hasManager(pendingGrants)) {
      toast.error("至少保留一名管理者");
      return;
    }
    setScope("professional");
    setTypeChangeFlow(null);
    toast.success("类型将变更为专业知识库，保存后生效");
  };

  const confirmToPublic = () => {
    setScope("public");
    setTypeChangeFlow(null);
    toast.success("类型将变更为公共知识库，保存后生效");
  };

  return (
    <>
      <KbFormDialog
        open={open && typeChangeFlow !== "configure-permission"}
        size="medium"
        variant="form"
        title="编辑知识库"
        titleIcon={Library}
        onClose={onClose}
        footer={
          <>
            <AppDialogButton variant="outline" onClick={onClose} disabled={submitting}>
              取消
            </AppDialogButton>
            <AppDialogButton variant="primary" onClick={submit} loading={submitting}>
              保存修改
            </AppDialogButton>
          </>
        }
      >
        <p className="mb-4 text-[12.5px] text-kb-muted">{base.name}</p>

        <KbFormField label="知识库名称" icon={Pencil} required error={fieldErrors.name}>
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

        <KbFormField label="知识库类型" icon={Library}>
          <div className="flex items-center gap-2">
            <div className="flex h-10 flex-1 items-center gap-2 rounded-[8px] border border-[#E1EBEE] bg-[#F8FAFB] px-3">
              {isPublic ? (
                <Globe className="h-4 w-4 text-kb-muted" strokeWidth={1.8} />
              ) : (
                <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.8} />
              )}
              <span className="text-[13px] font-medium text-kb-heading">
                {isPublic ? "公共知识库" : "专业知识库"}
              </span>
            </div>
            {base.scope !== "personal" && (
              <button
                type="button"
                onClick={handleTypeChangeClick}
                className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[8px] border border-kb-border bg-white px-3 text-[12.5px] font-medium text-kb-body hover:border-primary/30 hover:text-primary"
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                变更类型
              </button>
            )}
          </div>
        </KbFormField>

        <KbFormField label="知识库简介" icon={FileText}>
          <AppFormTextarea
            value={description}
            maxLength={descriptionMaxLength}
            disabled={submitting}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="简要描述知识库用途与内容范围"
          />
        </KbFormField>

        {isProfessional && (
          <div className="mt-1 rounded-[10px] border border-[#E6F0F2] bg-[#F8FAFB] px-4 py-3">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-kb-heading">
              <KeyRound className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
              权限概览
            </div>
            <p className="mt-1.5 text-[12px] leading-relaxed text-kb-muted">
              专业知识库 · {grantsSummary.roleCount} 个授权角色 ·{" "}
              {grantsSummary.directMemberCount} 名授权成员 · {grantsSummary.managerCount} 名管理者
            </p>
            <p className="mt-1 text-[11.5px] text-kb-muted">
              权限配置请通过知识库列表中的「权限」入口进行管理。
            </p>
          </div>
        )}
      </KbFormDialog>

      <AppFormDialog
        open={typeChangeFlow === "confirm-to-professional"}
        size="small"
        variant="confirm"
        title="变更为专业知识库？"
        onClose={() => setTypeChangeFlow(null)}
        footer={
          <>
            <AppDialogButton variant="outline" onClick={() => setTypeChangeFlow(null)}>
              取消
            </AppDialogButton>
            <AppDialogButton variant="primary" onClick={confirmToProfessional}>
              继续配置权限
            </AppDialogButton>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-kb-body">
          变更后，知识库将不再对全体用户开放，必须重新配置角色和成员权限。
        </p>
      </AppFormDialog>

      <AppFormDialog
        open={typeChangeFlow === "confirm-to-public"}
        size="small"
        variant="confirm"
        title="变更为公共知识库？"
        onClose={() => setTypeChangeFlow(null)}
        footer={
          <>
            <AppDialogButton variant="outline" onClick={() => setTypeChangeFlow(null)}>
              取消
            </AppDialogButton>
            <AppDialogButton variant="primary" onClick={confirmToPublic}>
              确认变更
            </AppDialogButton>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-kb-body">
          变更后，全体系统用户将获得浏览权限。当前角色和成员的自定义授权将停止生效，历史配置将保留，便于以后恢复为专业库。
        </p>
      </AppFormDialog>

      {typeChangeFlow === "configure-permission" && (
        <KbFormDialog
          open
          size="xlarge"
          title="配置权限"
          titleIcon={KeyRound}
          onClose={() => setTypeChangeFlow("confirm-to-professional")}
          footer={
            <>
              <AppDialogButton
                variant="outline"
                onClick={() => setTypeChangeFlow("confirm-to-professional")}
              >
                取消
              </AppDialogButton>
              <AppDialogButton variant="primary" onClick={finishProfessionalTypeChange}>
                完成配置
              </AppDialogButton>
            </>
          }
        >
          <p className="mb-4 text-[12.5px] text-kb-muted">
            变更为专业知识库前，请先完成角色与成员权限配置。
          </p>
          <PermissionEditor
            grants={pendingGrants}
            onChange={setPendingGrants}
            showRequests={false}
            showSummary
          />
        </KbFormDialog>
      )}
    </>
  );
}

function formatNow() {
  const date = new Date();
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
