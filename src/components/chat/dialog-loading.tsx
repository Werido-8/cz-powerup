import { cn } from "@/lib/utils";

type DialogLoadingProps = {
  text?: string;
  className?: string;
};

const SKELETON_TURNS = [
  { questionWidth: "30%", answerWidths: ["92%", "76%", "48%"] },
  { questionWidth: "24%", answerWidths: ["84%", "68%", "56%"] },
  { questionWidth: "36%", answerWidths: ["88%", "72%", "44%"] },
] as const;

function SkeletonLine({ width }: { width: string }) {
  return <span className="chat-skeleton__block chat-skeleton__line" style={{ width }} />;
}

export function DialogLoading({ text = "正在加载...", className }: DialogLoadingProps) {
  return (
    <section className={cn("dialog-loading-state", className)} aria-live="polite" aria-busy="true">
      <div className="dialog-loading" role="status" aria-label={text}>
        <span className="dialog-loading__runner" aria-hidden="true" />
        <span className="dialog-loading__tiles" aria-hidden="true">
          <span className="dialog-loading__tile" />
          <span className="dialog-loading__tile" />
          <span className="dialog-loading__tile" />
          <span className="dialog-loading__tile" />
        </span>
      </div>
      <p className="dialog-loading-state__text">{text}</p>
    </section>
  );
}

export function ConversationLoadingSkeleton({
  text = "正在加载历史消息...",
  className,
}: DialogLoadingProps) {
  return (
    <section
      className={cn("chat-dialog-skeleton", className)}
      aria-live="polite"
      aria-busy="true"
      aria-label={text}
      role="status"
    >
      <p className="sr-only">{text}</p>
      <div className="chat-dialog-skeleton__list" aria-hidden="true">
        {SKELETON_TURNS.map((turn, index) => (
          <div className="chat-dialog-skeleton__turn" key={index}>
            <div className="chat-dialog-skeleton__user">
              <span
                className="chat-skeleton__block chat-dialog-skeleton__question"
                style={{ width: turn.questionWidth }}
              />
              <span className="chat-skeleton__block chat-dialog-skeleton__user-avatar" />
            </div>

            <div className="chat-dialog-skeleton__answer">
              <span className="chat-skeleton__block chat-dialog-skeleton__assistant-avatar" />
              <div className="chat-dialog-skeleton__answer-content">
                <div className="chat-dialog-skeleton__meta">
                  <span className="chat-skeleton__block chat-dialog-skeleton__name" />
                  <span className="chat-skeleton__block chat-dialog-skeleton__time" />
                </div>
                <div className="chat-dialog-skeleton__lines">
                  {turn.answerWidths.map((width) => (
                    <SkeletonLine width={width} key={width} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
