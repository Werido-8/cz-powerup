import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Pin, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Conversation } from "@/lib/mock/data";

type ChatConversationSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function ChatConversationSearchDialog({
  open,
  onOpenChange,
  conversations,
  activeId,
  onSelect,
}: ChatConversationSearchDialogProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
    else setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim();
    return normalized
      ? conversations.filter((conversation) => conversation.title.includes(normalized))
      : conversations;
  }, [conversations, query]);

  const selectAndClose = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-[#1f3440]/12 backdrop-blur-[1px]"
        className="max-w-[min(46rem,calc(100%-2rem))] rounded-2xl border-border bg-card p-0 shadow-[0_24px_64px_rgba(22,43,54,0.2)] [&>button.absolute]:hidden"
      >
        <DialogTitle className="sr-only">搜索聊天</DialogTitle>
        <DialogDescription className="sr-only">搜索并打开历史对话</DialogDescription>
        <div className="border-b border-divider px-5 py-4 sm:px-6">
          <label htmlFor="chat-global-search" className="sr-only">
            搜索聊天
          </label>
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            <input
              ref={inputRef}
              id="chat-global-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索聊天"
              className="h-10 min-w-0 flex-1 bg-transparent text-[18px] text-kb-heading outline-none placeholder:text-kb-muted"
            />
            <button
              type="button"
              aria-label="关闭搜索"
              onClick={() => onOpenChange(false)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-kb-muted transition-colors hover:bg-muted hover:text-kb-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              <X className="h-4 w-4" />
            </button>
            <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-1 text-[10px] text-kb-muted sm:inline">
              Esc
            </kbd>
          </div>
        </div>
        <div className="max-h-[min(28rem,calc(100dvh-12rem))] overflow-y-auto p-2">
          {results.length ? (
            results.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => selectAndClose(conversation.id)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${conversation.id === activeId ? "bg-primary-soft text-accent-foreground" : "text-kb-body"}`}
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{conversation.title}</span>
                {conversation.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            ))
          ) : (
            <div className="px-4 py-14 text-center text-[13px] text-kb-muted">未找到匹配聊天</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
