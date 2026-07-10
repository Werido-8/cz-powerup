import type { ReactNode } from "react";
import titleAreaBg from "@/assets/title-area-bg.png";

export function KnowledgePageTitleBanner({
  title,
  subtitle,
  iconSrc,
  backgroundSrc = titleAreaBg,
}: {
  title: string;
  subtitle: ReactNode;
  iconSrc: string;
  backgroundSrc?: string;
}) {
  return (
    <section className="shrink-0 px-3 pb-2.5 pt-3">
      <div className="relative h-[88px] overflow-hidden rounded-[14px]">
        <img
          src={backgroundSrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center select-none"
          draggable={false}
        />

        <div className="relative z-[1] flex h-full items-center gap-1 pl-1.5 pr-3">
          <img
            src={iconSrc}
            alt=""
            aria-hidden
            className="h-[76px] w-[76px] shrink-0 object-contain"
            draggable={false}
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-semibold leading-tight tracking-tight text-[#002140]">
              {title}
            </h1>
            <div className="mt-0.5 text-[11px] leading-[1.55] text-[#4E5969]">{subtitle}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
