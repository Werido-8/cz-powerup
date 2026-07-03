import type { ReactNode } from "react";
import {
  Star,
  MessageSquare,
  NotebookPen,
  FolderInput,
  LayoutList,
} from "lucide-react";
import {
  OverviewStatCard,
  ActionButton,
} from "@/components/learning/ui";
import type {
  PersonalDepositionOverviewData,
  PersonalOverviewCardKey,
} from "@/lib/mock/personal-deposition";

const CARD_ICONS: Record<PersonalOverviewCardKey, ReactNode> = {
  docFav: <Star className="h-[18px] w-[18px]" />,
  qaFav: <MessageSquare className="h-[18px] w-[18px]" />,
  notes: <NotebookPen className="h-[18px] w-[18px]" />,
  pending: <FolderInput className="h-[18px] w-[18px]" />,
};

const CARD_TINT: Record<PersonalOverviewCardKey, number> = {
  docFav: 0,
  qaFav: 1,
  notes: 2,
  pending: 3,
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
  return (
    <>
      <section className="mb-5 flex flex-nowrap items-stretch gap-4">
        {data.cards.map((card) => {
          const clickable = card.key !== "pending" && !!onCardClick;
          const emphasis =
            card.key === "pending" ? "remind" : card.key === "docFav" ? "primary" : "default";

          return (
            <OverviewStatCard
              key={card.key}
              className="min-h-[148px] min-w-0 flex-[1_1_0%] [&_.relative.p-4]:px-[18px] [&_.relative.p-4]:py-5"
              label={card.label}
              value={card.count}
              hint={card.hint}
              detail={`${card.recentPrefix}${card.recentText}`}
              icon={CARD_ICONS[card.key]}
              tint={CARD_TINT[card.key]}
              emphasis={emphasis}
              active={activeKey === card.key}
              onClick={clickable ? () => onCardClick?.(card.key) : undefined}
            />
          );
        })}
      </section>

    </>
  );
}
