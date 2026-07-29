import { cn } from "@/lib/utils";

type DialogLoadingProps = {
  text?: string;
  className?: string;
};

export function DialogLoading({
  text = "正在加载对话内容...",
  className,
}: DialogLoadingProps) {
  return (
    <section
      className={cn("dialog-loading-state", className)}
      aria-live="polite"
      aria-busy="true"
    >
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
