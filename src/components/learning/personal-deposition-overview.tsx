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
    <section className="mb-4 grid gap-3 xl:grid-cols-[minmax(320px,.85fr)_minmax(0,1.15fr)]">
      {pending && (
        <button
          type="button"
          onClick={() => {
            if (onOrganize) onOrganize();
            else onCardClick?.("pending");
          }}
          className={cn(
            "group relative overflow-hidden rounded-[18px] border bg-white px-4 py-3.5 text-left shadow-[0_10px_28px_rgba(28,73,82,0.04)] transition hover:-translate-y-0.5 hover:border-primary/35",
            activeKey === "pending" ? "border-primary ring-2 ring-primary/10" : "border-kb-border",
          )}
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_72%_42%,rgba(52,155,172,.11)_0,rgba(52,155,172,.04)_30%,transparent_68%)]" />
          <div className="pointer-events-none absolute right-6 top-3 h-[72px] w-[72px] rounded-full border border-dashed border-primary/16" />
          <span className="pointer-events-none absolute right-[54px] top-[28px] h-2 w-2 rounded-full bg-primary/20" />
          <span className="pointer-events-none absolute right-[28px] top-[58px] h-1.5 w-1.5 rounded-full bg-[#e4a052]/45" />

          <div className="relative flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-primary-soft text-primary">
              <FolderInput className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold tracking-[0.12em] text-primary">
                  TO ORGANIZE
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/15 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-primary">
                  <Sparkles className="h-2.5 w-2.5" /> 建议今天处理
                </span>
              </div>
              <div className="mt-1 flex items-end gap-2">
                <strong className="text-[26px] leading-none text-kb-heading">{pending.count}</strong>
                <span className="pb-px text-[13px] font-semibold text-kb-heading">条内容待整理</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[11px] text-kb-muted">{pending.recentText}</p>
                <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-primary">
                  开始整理
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </div>
          </div>
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
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
                "group relative overflow-hidden rounded-[18px] border bg-white px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_24px_rgba(28,73,82,0.05)]",
                activeKey === card.key
                  ? "border-primary ring-2 ring-primary/10"
                  : "border-kb-border",
              )}
            >
              <span className="pointer-events-none absolute -right-7 -top-8 h-20 w-20 rounded-full border-[14px] border-current opacity-[0.025]" />
              <div className="flex items-center justify-between gap-2">
                <span className={cn("grid h-8 w-8 place-items-center rounded-[10px]", meta.tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-[10px] font-semibold tracking-[0.12em] text-kb-muted">
                  {meta.eyebrow}
                </p>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <strong className="text-[22px] leading-none text-kb-heading">{card.count}</strong>
                <span className="text-[13px] font-semibold text-kb-heading">{card.label}</span>
              </div>
              <p className="mt-2 truncate border-t border-divider pt-2 text-[10.5px] text-kb-muted">
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
