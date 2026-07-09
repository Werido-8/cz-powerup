import titleBg from "@/assets/title-bg.png";
import titleIcon from "@/assets/title-icon.png";

export function KnowledgeOverviewTitleBanner() {
  return (
    <section className="shrink-0 border-b border-[#E8F0F2] px-3 pb-2.5 pt-3">
      <div className="relative overflow-hidden rounded-[14px] border border-[#C5E6EE]">
        <img
          src={titleBg}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_center] select-none"
          draggable={false}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[78%] bg-gradient-to-r from-white/94 via-white/60 to-transparent"
        />

        <div className="relative z-[1] flex items-center gap-2.5 px-3 py-2.5">
          <img
            src={titleIcon}
            alt=""
            aria-hidden
            className="h-[52px] w-[52px] shrink-0 object-contain"
            draggable={false}
          />
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold leading-tight tracking-tight text-[#002140]">
              知识总览
            </h1>
            <p className="mt-0.5 text-[11px] leading-[1.55] text-[#4E5969]">
              全局视角，快速访问
              <br />
              核心知识资产
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
