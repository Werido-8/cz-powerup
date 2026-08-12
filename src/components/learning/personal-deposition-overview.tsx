import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  FolderInput,
  MessageSquare,
  NotebookPen,
  Sparkles,
  Star,
} from "lucide-react";
import type {
  PersonalDepositionOverviewData,
  PersonalOverviewCardKey,
} from "@/lib/mock/personal-deposition";
import { cn } from "@/lib/utils";

const CARD_META: Record<
  PersonalOverviewCardKey,
  { icon: LucideIcon; eyebrow: string; tone: string }
> = {
  docFav: { icon: Star, eyebrow: "REFERENCE", tone: "text-[#b36a1f] bg-[#fff4e8]" },
  qaFav: { icon: MessageSquare, eyebrow: "INSIGHT", tone: "text-[#397ca2] bg-[#eaf4fa]" },
  notes: { icon: NotebookPen, eyebrow: "NOTE", tone: "text-[#3c8169] bg-[#e9f6f1]" },
  pending: { icon: FolderInput, eyebrow: "TO ORGANIZE", tone: "text-primary bg-primary-soft" },
};

type PersonalDepositionOverviewProps = {
  data: PersonalDepositionOverviewData;
  activeKey?: PersonalOverviewCardKey | null;
  onCardClick?: (key: PersonalOverviewCardKey) => void;
  onOrganize?: () => void;
  onViewFavorites?: () => void;
};

export function PersonalDepositionOverview({
  data,
  activeKey,
  onCardClick,
  onOrganize,
  onViewFavorites,
}: PersonalDepositionOverviewProps) {
  const pending = data.cards.find((card) => card.key === "pending");
  const collectionCards = data.cards.filter((card) => card.key !== "pending");

  return (
    <section className="mb-5 grid gap-4 xl:grid-cols-[minmax(360px,.8fr)_minmax(0,1.2fr)]">
      {pending && (
        <button
          type="button"
          onClick={() => {
            if (onOrganize) onOrganize();
            else onCardClick?.("pending");
          }}
          className={cn(
            "group relative min-h-[176px] overflow-hidden rounded-[20px] border bg-white p-6 text-left shadow-[0_14px_38px_rgba(28,73,82,0.05)] transition hover:-translate-y-0.5 hover:border-primary/35",
            activeKey === "pending" ? "border-primary ring-2 ring-primary/10" : "border-kb-border",
          )}
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_70%_40%,rgba(52,155,172,.12)_0,rgba(52,155,172,.05)_28%,transparent_68%)]" />
          <div className="pointer-events-none absolute right-8 top-7 h-[104px] w-[104px] rounded-full border border-dashed border-primary/18" />
          <span className="pointer-events-none absolute right-[76px] top-[54px] h-3 w-3 rounded-full bg-primary/20" />
          <span className="pointer-events-none absolute right-[38px] top-[102px] h-2 w-2 rounded-full bg-[#e4a052]/45" />

          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-primary-soft text-primary">
                <FolderInput className="h-5 w-5" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-white/80 px-2.5 py-1 text-[10.5px] font-medium text-primary">
                <Sparkles className="h-3 w-3" /> 建议今天处理
              </span>
            </div>
            <div className="mt-5">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-primary">
                TO ORGANIZE
              </p>
              <div className="mt-1 flex items-end gap-3">
                <strong className="text-[34px] leading-none text-kb-heading">
                  {pending.count}
                </strong>
                <span className="pb-1 text-[15px] font-semibold text-kb-heading">条内容待整理</span>
              </div>
              <p className="mt-2 max-w-[320px] text-[12px] leading-5 text-kb-muted">
                {pending.recentText}。归类后可更快用于复习、组卷和后续追问。
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
                开始整理{" "}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </button>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {collectionCards.map((card) => {
          const meta = CARD_META[card.key];
          const Icon = meta.icon;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                if (card.key === "docFav" && onViewFavorites) onViewFavorites();
                else onCardClick?.(card.key);
              }}
              className={cn(
                "group relative min-h-[176px] overflow-hidden rounded-[20px] border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_30px_rgba(28,73,82,0.06)]",
                activeKey === card.key
                  ? "border-primary ring-2 ring-primary/10"
                  : "border-kb-border",
              )}
            >
              <span className="pointer-events-none absolute -right-8 -top-9 h-24 w-24 rounded-full border-[16px] border-current opacity-[0.025]" />
              <div className="flex items-center justify-between gap-3">
                <span className={cn("grid h-10 w-10 place-items-center rounded-[12px]", meta.tone)}>
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-kb-muted/40 transition group-hover:text-primary" />
              </div>
              <p className="mt-5 text-[10px] font-semibold tracking-[0.14em] text-kb-muted">
                {meta.eyebrow}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <strong className="text-[28px] text-kb-heading">{card.count}</strong>
                <span className="text-[13px] font-semibold text-kb-heading">{card.label}</span>
              </div>
              <p className="mt-1 line-clamp-1 text-[11px] text-kb-muted">{card.hint}</p>
              <p className="absolute inset-x-5 bottom-4 truncate border-t border-divider pt-3 text-[10.5px] text-kb-muted">
                {card.recentPrefix}
                <span className="text-kb-body">{card.recentText}</span>
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
