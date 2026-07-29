import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Check, Search, Share2, UserRound, Users, X } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SYSTEM_MEMBERS } from "@/lib/knowledge/permission";
import { cn } from "@/lib/utils";

const AVATAR_STYLES = [
  "bg-[#dff4f6] text-[#238b9e]",
  "bg-[#e9f1fb] text-[#4778a8]",
  "bg-[#e9f5ed] text-[#3c8960]",
  "bg-[#f8efe1] text-[#9a6a31]",
];

function MemberAvatar({ name, index }: { name: string; index: number }) {
  return (
    <Avatar className="h-8 w-8">
      <AvatarFallback
        className={cn("text-[11px] font-semibold", AVATAR_STYLES[index % AVATAR_STYLES.length])}
      >
        {name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}

export function ChatConversationShareDialog({
  open,
  conversationTitle,
  currentUserId,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  conversationTitle: string;
  currentUserId?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (memberIds: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!open) return;
    setDraft([]);
    setQuery("");
  }, [open]);

  const availableMembers = useMemo(
    () => SYSTEM_MEMBERS.filter((member) => member.id !== currentUserId),
    [currentUserId],
  );

  const visibleMembers = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase();
    if (!normalizedQuery) return availableMembers;
    return availableMembers.filter((member) =>
      [member.name, member.department, member.roleName]
        .filter(Boolean)
        .some((text) => text?.toLocaleLowerCase().includes(normalizedQuery)),
    );
  }, [availableMembers, deferredQuery]);

  const selectedMembers = useMemo(
    () => availableMembers.filter((member) => draft.includes(member.id)),
    [availableMembers, draft],
  );

  const toggleMember = (memberId: string) => {
    setDraft((current) =>
      current.includes(memberId)
        ? current.filter((item) => item !== memberId)
        : [...current, memberId],
    );
  };

  const allVisibleSelected =
    visibleMembers.length > 0 && visibleMembers.every((member) => draft.includes(member.id));

  const toggleVisibleMembers = () => {
    const visibleIds = visibleMembers.map((member) => member.id);
    setDraft((current) =>
      allVisibleSelected
        ? current.filter((memberId) => !visibleIds.includes(memberId))
        : Array.from(new Set([...current, ...visibleIds])),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#17252b]/45 backdrop-blur-[1px]"
        className="flex h-[min(650px,calc(100dvh-2rem))] max-w-[880px] flex-col gap-0 rounded-[14px] border-[#dce6e9] bg-white p-0 shadow-[0_24px_80px_rgba(24,53,63,0.22)]"
      >
        <div className="shrink-0 border-b border-divider px-5 py-4 pr-14 sm:px-6 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-primary-soft text-primary">
              <Share2 className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-[17px] font-semibold leading-6 text-kb-heading">
                分享对话
              </DialogTitle>
              <DialogDescription className="mt-1 text-[12px] leading-5 text-kb-muted">
                选择可查看“{conversationTitle || "未命名会话"}”的成员，对方将获得只读访问权限。
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.8fr)]">
          <section
            className="flex min-h-0 flex-col md:border-r md:border-divider"
            aria-label="可分享成员"
          >
            <div className="shrink-0 px-4 pt-4 sm:px-5">
              <div className="flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label="搜索分享成员"
                    placeholder="搜索姓名、部门或角色"
                    className="h-10 w-full rounded-[8px] border border-[#dce6e9] bg-white pl-9 pr-9 text-[12.5px] text-kb-heading outline-none transition-[border-color,box-shadow] placeholder:text-kb-muted focus:border-primary/55 focus:ring-2 focus:ring-primary/10"
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label="清空成员搜索"
                      onClick={() => setQuery("")}
                      className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[6px] text-kb-muted hover:bg-[#f2f6f7] hover:text-kb-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={visibleMembers.length === 0}
                  onClick={toggleVisibleMembers}
                  className="h-10 shrink-0 rounded-[8px] border border-[#dce6e9] bg-white px-3 text-[11.5px] font-medium text-kb-body transition-colors hover:border-primary/30 hover:bg-primary-soft/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:opacity-40"
                >
                  {allVisibleSelected ? "取消全选" : "全选"}
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11.5px] text-kb-muted">可选成员</span>
                {selectedMembers.length > 0 && (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-primary md:hidden">
                    已选成员
                  </span>
                )}
              </div>
            </div>

            <div className="scrollbar-neutral min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5">
              {visibleMembers.length > 0 ? (
                <div className="space-y-1.5">
                  {visibleMembers.map((member, index) => {
                    const checked = draft.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleMember(member.id)}
                        className={cn(
                          "grid min-h-[52px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[9px] border px-3 py-2 text-left transition-[border-color,background-color,box-shadow] duration-150",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-1",
                          checked
                            ? "border-primary/30 bg-primary-soft/40 shadow-[0_0_0_1px_rgba(52,155,172,0.03)]"
                            : "border-transparent bg-white hover:border-[#dce8eb] hover:bg-[#f8fbfc]",
                        )}
                      >
                        <MemberAvatar name={member.name} index={index} />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium leading-5 text-kb-heading">
                            {member.name}
                          </span>
                          <span className="block truncate text-[11px] leading-4 text-kb-muted">
                            {[member.department, member.roleName].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "grid h-[18px] w-[18px] place-items-center rounded-[5px] border transition-colors",
                            checked
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-[#cdd9dd] bg-white text-transparent",
                          )}
                          aria-hidden="true"
                        >
                          <Check className="h-3.5 w-3.5 stroke-[2.4]" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full min-h-40 flex-col items-center justify-center px-6 text-center">
                  <Search className="h-5 w-5 text-[#9aadb4]" />
                  <p className="mt-2 text-[12.5px] font-medium text-kb-body">未找到匹配成员</p>
                  <p className="mt-1 text-[11px] text-kb-muted">可以尝试姓名、部门或岗位关键词</p>
                </div>
              )}
            </div>
          </section>

          <aside className="hidden min-h-0 flex-col bg-[#fafcfc] md:flex" aria-label="已选分享成员">
            <div className="flex h-14 shrink-0 items-center gap-2 border-b border-divider px-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-[12.5px] font-semibold text-kb-heading">已选成员</span>
              {selectedMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft([])}
                  className="ml-auto text-[11px] text-kb-muted transition-colors hover:text-kb-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                >
                  清空
                </button>
              )}
            </div>

            <div className="scrollbar-neutral min-h-0 flex-1 overflow-y-auto p-3">
              {selectedMembers.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex min-h-[48px] items-center gap-2.5 rounded-[8px] border border-[#e3eaec] bg-white px-2.5 py-2"
                    >
                      <MemberAvatar name={member.name} index={index} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-kb-heading">
                          {member.name}
                        </span>
                        <span className="block truncate text-[10.5px] text-kb-muted">
                          {member.department}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`移除${member.name}`}
                        onClick={() => toggleMember(member.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] text-kb-muted hover:bg-[#f1f5f6] hover:text-kb-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-40 flex-col items-center justify-center px-6 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eef4f5] text-[#8da2aa]">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-[12.5px] font-medium text-kb-body">尚未选择成员</p>
                  <p className="mt-1 text-[11px] leading-5 text-kb-muted">
                    从左侧选择成员后，可在这里快速移除
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-divider bg-white px-4 py-3 sm:px-6">
          <span className="hidden text-[11px] text-kb-muted sm:block">
            {selectedMembers.length > 0
              ? "选中的成员将获得只读访问权限"
              : "请选择要分享的成员"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-[8px] border border-[#d7e1e4] bg-white px-4 text-[12px] font-medium text-kb-body transition-colors hover:bg-[#f6f9f9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              取消
            </button>
            <button
              type="button"
              disabled={selectedMembers.length === 0}
              onClick={() => onConfirm(draft)}
              className="h-9 min-w-24 rounded-[8px] bg-primary px-4 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              确认分享
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
