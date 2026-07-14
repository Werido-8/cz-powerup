import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { KbFilterSelect } from "@/components/knowledge/ui";
import type { GrantTier, PermissionRequest } from "@/lib/knowledge/types";
import {
  GRANT_TIER_SELECT_OPTIONS,
  grantTierLabel,
  levelToTier,
  tierToLevel,
  type PermissionLevel,
} from "@/lib/knowledge/permission";
import { cn } from "@/lib/utils";

export function ApproveRequestDialog({
  request,
  onClose,
  onConfirm,
}: {
  request: PermissionRequest | null;
  onClose: () => void;
  onConfirm: (level: PermissionLevel, addToMembers: boolean) => void;
}) {
  const [tier, setTier] = useState<GrantTier>("access");
  const [addToMembers, setAddToMembers] = useState(true);

  useEffect(() => {
    if (request) {
      setTier(levelToTier(request.group) ?? "access");
      setAddToMembers(true);
    }
  }, [request]);

  return (
    <AppFormDialog
      open={Boolean(request)}
      size="small"
      title="通过权限申请"
      titleIcon={ShieldCheck}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={() => onConfirm(tierToLevel(tier), addToMembers)}>
            确认通过
          </AppDialogButton>
        </>
      }
    >
      {request && (
        <div className="space-y-3">
          <div className="grid grid-cols-[64px_1fr] gap-y-2 text-[13px]">
            <span className="text-kb-muted">申请人</span>
            <span className="font-medium text-kb-heading">
              {request.applicantName}
              <span className="ml-2 text-[12px] font-normal text-kb-muted">
                {request.knowledgeBaseName}
              </span>
            </span>
            <span className="text-kb-muted">申请权限</span>
            <span className="font-medium text-kb-heading">{grantTierLabel(levelToTier(request.group) ?? "access")}</span>
            <span className="text-kb-muted">申请理由</span>
            <span className="leading-relaxed text-kb-body">{request.reason}</span>
          </div>

          <div className="flex items-center justify-between border-t border-[#EEF2F4] pt-3">
            <span className="text-[12.5px] font-medium text-kb-heading">实际授予</span>
            <KbFilterSelect
              value={tier}
              onChange={(value) => setTier(value as GrantTier)}
              options={GRANT_TIER_SELECT_OPTIONS}
              className="min-w-[140px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setAddToMembers((prev) => !prev)}
            className="flex w-full items-center gap-2 text-left"
          >
            <span
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border transition-colors",
                addToMembers ? "border-primary bg-primary text-white" : "border-[#C7D3D8] bg-white",
              )}
            >
              {addToMembers && (
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
                  <path
                    d="M2.5 6.2 5 8.5 9.5 3.8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className="text-[12.5px] text-kb-body">同时加入个人授权名单</span>
          </button>
        </div>
      )}
    </AppFormDialog>
  );
}
