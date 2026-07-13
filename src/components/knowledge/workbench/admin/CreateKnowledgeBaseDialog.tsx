import { useEffect, useState } from "react";
import {
  Check,
  FileText,
  Folder,
  Globe,
  KeyRound,
  Library,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormInput, AppFormTextarea } from "@/components/ui/app-form";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui";
import { CURRENT_KNOWLEDGE_USER } from "@/lib/knowledge/data";
import {
  getCategoryPathLabel,
  getKnowledgeBaseDescriptionMaxLength,
} from "@/lib/knowledge/model";
import {
  createInitialGrants,
  hasManager,
  type PermissionGrants,
} from "@/lib/knowledge/permission";
import type { KnowledgeBase, KnowledgeBaseScope } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { CategoryTreeSelect } from "../CategoryTreeSelect";
import { PermissionEditor, PermissionOverviewStrip } from "../permission/PermissionEditor";

type SelectableScope = Exclude<KnowledgeBaseScope, "personal">;
type WizardStep = 1 | 2;

type FieldErrors = {
  categoryId?: string;
  name?: string;
};

const SCOPE_OPTIONS: {
  value: SelectableScope;
  label: string;
  desc: string;
  icon: typeof Globe;
}[] = [
  {
    value: "public",
    label: "公共知识库",
    desc: "面向全体系统用户开放浏览，无需单独分配访问权限。",
    icon: Globe,
  },
  {
    value: "professional",
    label: "专业知识库",
    desc: "仅指定角色和成员可访问，需要配置浏览、上传和管理权限。",
    icon: ShieldCheck,
  },
];

export function CreateKnowledgeBaseDialog({
  defaultCategoryId,
  onClose,
  onSubmit,
  open = true,
}: {
  defaultCategoryId?: string;
  onClose: () => void;
  onSubmit: (base: KnowledgeBase, grants?: PermissionGrants) => void;
  open?: boolean;
}) {
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId ?? "");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<SelectableScope>("professional");
  const [grants, setGrants] = useState<PermissionGrants>(() => createInitialGrants());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const descriptionMaxLength = getKnowledgeBaseDescriptionMaxLength();
  const isProfessional = scope === "professional";

  useEffect(() => {
    setStep(1);
    setName("");
    setCategoryId(defaultCategoryId ?? "");
    setDescription("");
    setScope("professional");
    setGrants(createInitialGrants());
    setFieldErrors({});
    setSubmitting(false);
  }, [defaultCategoryId, open]);

  const validateStep1 = () => {
    const trimmedName = name.trim();
    const nextErrors: FieldErrors = {};
    if (!categoryId) nextErrors.categoryId = "请选择挂载目录";
    if (!trimmedName) nextErrors.name = "请输入知识库名称";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildBase = (): KnowledgeBase => {
    const trimmedName = name.trim();
    const pathLabel = getCategoryPathLabel(categoryId);
    const isPublic = scope === "public";

    return {
      id: `kb-${Date.now()}`,
      name: trimmedName,
      description: description.trim(),
      scope,
      categoryId,
      categoryPath: pathLabel ? pathLabel.split(" / ") : undefined,
      fileCount: 0,
      status: "enabled",
      permission: isPublic
        ? {
            canView: true,
            canUpload: false,
            canManage: false,
            canConfigurePermission: false,
          }
        : {
            canView: true,
            canUpload: true,
            canManage: true,
            canConfigurePermission: true,
          },
      updatedAt: formatNow(),
      ownerName: CURRENT_KNOWLEDGE_USER.name,
    };
  };

  const handleNext = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleCreate = () => {
    if (submitting) return;
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (isProfessional && !hasManager(grants)) {
      toast.error("至少保留一名管理者");
      return;
    }

    setSubmitting(true);
    const base = buildBase();
    onSubmit(base, isProfessional ? grants : undefined);
    setSubmitting(false);
  };

  const pathLabel = categoryId ? getCategoryPathLabel(categoryId) : "";

  return (
    <KbFormDialog
      open={open}
      size="large"
      variant="form"
      title="新建知识库"
      titleIcon={Library}
      onClose={onClose}
      footer={
        step === 1 ? (
          <>
            <AppDialogButton variant="outline" onClick={onClose} disabled={submitting}>
              取消
            </AppDialogButton>
            {isProfessional ? (
              <AppDialogButton variant="primary" onClick={handleNext}>
                下一步
              </AppDialogButton>
            ) : (
              <AppDialogButton variant="primary" onClick={handleCreate} loading={submitting}>
                创建知识库
              </AppDialogButton>
            )}
          </>
        ) : (
          <>
            <AppDialogButton variant="outline" onClick={() => setStep(1)} disabled={submitting}>
              上一步
            </AppDialogButton>
            <AppDialogButton variant="primary" onClick={handleCreate} loading={submitting}>
              创建知识库
            </AppDialogButton>
          </>
        )
      }
    >
      {isProfessional && (
        <WizardSteps active={step} className="mb-5" />
      )}

      {step === 1 ? (
        <>
          <p className="mb-4 text-[12.5px] text-kb-muted">
            创建知识库并配置基本信息与访问权限
          </p>

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
                      "relative flex flex-col gap-1.5 rounded-[10px] border p-3.5 text-left transition-colors",
                      active
                        ? "border-primary/60 bg-primary-soft/25 ring-1 ring-primary/25"
                        : "border-[#E1EBEE] bg-white hover:border-primary/35 hover:bg-[#F6FBFC]",
                    )}
                  >
                    {active && (
                      <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-primary text-white">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                    )}
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
                    <span className="pr-6 text-[11.5px] leading-snug text-kb-muted">
                      {option.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {scope === "public" ? (
              <div className="mt-3 rounded-[8px] border border-[#E1EBEE] bg-[#F8FAFB] px-3 py-2.5">
                <div className="text-[12px] font-semibold text-kb-heading">公共库默认权限</div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-kb-muted">
                  全体系统用户拥有浏览权限；上传及管理权限由系统知识库管理员承担。
                  公共知识库无需进行成员权限配置。
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-1.5 rounded-[8px] bg-primary-soft/20 px-2.5 py-2 text-[11.5px] leading-snug text-[#2C6E7B]">
                <KeyRound className="mt-[1px] h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                <span>专业知识库需要配置角色或成员权限，至少需要设置一名管理者。</span>
              </div>
            )}
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
              placeholder="请选择知识库挂载目录"
              searchPlaceholder="输入目录名称或路径筛选"
            />
          </KbFormField>

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

          <KbFormField label="知识库简介" icon={FileText} className="mb-0">
            <AppFormTextarea
              value={description}
              maxLength={descriptionMaxLength}
              disabled={submitting}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="请输入知识库用途、资料范围等说明"
            />
          </KbFormField>
        </>
      ) : (
        <>
          <div className="mb-4 rounded-[10px] border border-[#E6F0F2] bg-[#F8FAFB] px-4 py-3">
            <div className="text-[14px] font-semibold text-kb-heading">{name.trim() || "未命名知识库"}</div>
            <div className="mt-0.5 text-[12px] text-kb-muted">
              专业知识库{pathLabel ? ` · ${pathLabel}` : ""}
            </div>
            <div className="mt-2">
              <PermissionOverviewStrip grants={grants} />
            </div>
          </div>

          <PermissionEditor
            grants={grants}
            onChange={setGrants}
            showRequests={false}
            showSummary={false}
          />
        </>
      )}
    </KbFormDialog>
  );
}

function WizardSteps({ active, className }: { active: WizardStep; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <StepBadge index={1} label="基本信息" active={active === 1} done={active > 1} />
      <span className="h-px flex-1 bg-[#E1EBEE]" aria-hidden />
      <StepBadge index={2} label="权限分配" active={active === 2} done={false} />
    </div>
  );
}

function StepBadge({
  index,
  label,
  active,
  done,
}: {
  index: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold",
          active || done
            ? "bg-primary text-white"
            : "border border-[#D5E0E4] bg-white text-kb-muted",
        )}
      >
        {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : index}
      </span>
      <span
        className={cn(
          "text-[12.5px] font-medium",
          active ? "text-primary" : "text-kb-muted",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function formatNow() {
  const date = new Date();
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
