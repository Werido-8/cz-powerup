import { cn } from "@/lib/utils";

/** 左侧栏轻量矢量装饰：几何网格 + 弧光，不抢内容 */
export function KbSidebarDecor({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* 顶部淡主色光晕 */}
      <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-primary/[0.07] blur-3xl" />
      <div className="absolute -right-10 top-28 h-36 w-36 rounded-full bg-primary/[0.05] blur-2xl" />

      {/* 底部书册抽象矢量 */}
      <svg
        className="absolute -bottom-6 -right-4 h-[180px] w-[168px] text-primary/[0.08]"
        viewBox="0 0 168 180"
        fill="none"
      >
        <path
          d="M28 34c18-10 42-14 62-8 16 5 28 16 34 30v88c-8-12-22-20-38-24-20-5-42-2-58 8V34Z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path
          d="M36 48c14-7 32-10 48-6 12 3 22 11 27 22v76c-7-9-18-15-30-18-16-4-34-2-45 6V48Z"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.8"
        />
        <path d="M44 148c12-6 28-8 42-5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M48 158c10-4 24-6 36-4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="126" cy="42" r="10" stroke="currentColor" strokeWidth="1" opacity="0.7" />
        <path d="M126 36v12M120 42h12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* 右侧细网格 */}
      <svg className="absolute inset-y-8 right-0 h-auto w-[88px] text-primary/[0.045]" viewBox="0 0 88 320" fill="none">
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="8"
            x2="80"
            y1={20 + i * 28}
            y2={20 + i * 28}
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={16 + i * 18}
            x2={16 + i * 18}
            y1="12"
            y2="308"
            stroke="currentColor"
            strokeWidth="1"
          />
        ))}
      </svg>
    </div>
  );
}
