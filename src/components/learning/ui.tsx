import type { CSSProperties, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Search, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopicHeaderIllustration, type TopicHeaderTheme } from "./topic-art";

const cardBase =
  "rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-colors duration-200";

/** 概览大卡右侧竖向操作区（非按钮样式，带背景装饰） */
const heroRailVariants = {
  primary: {
    shell:
      "bg-gradient-to-b from-card via-primary-soft/18 to-primary-soft/42 hover:via-primary-soft/28 hover:to-primary-soft/55 sm:bg-gradient-to-r sm:from-card/50 sm:via-primary-soft/22 sm:to-primary-soft/52 sm:hover:via-primary-soft/32 sm:hover:to-primary-soft/62",
    edgeFade: "from-card via-card/70 to-transparent",
    decor: "text-primary/[0.09]",
    frame: "border-primary/20 bg-card/85 text-primary",
    label: "group-hover:text-primary",
    chevron: "text-primary/45 group-hover:text-primary",
    footer:
      "border-primary/8 bg-gradient-to-b from-primary-soft/35 to-primary-soft/48 text-muted-foreground hover:from-primary-soft/45 hover:to-primary-soft/58 hover:text-primary sm:border-l-0 sm:bg-gradient-to-r sm:from-primary-soft/38 sm:to-primary-soft/55 sm:hover:from-primary-soft/48 sm:hover:to-primary-soft/65",
  },
  review: {
    shell:
      "bg-gradient-to-b from-card via-warning-soft/22 to-warning-soft/45 hover:via-warning-soft/32 hover:to-warning-soft/58 sm:bg-gradient-to-r sm:from-card/50 sm:via-warning-soft/26 sm:to-warning-soft/55 sm:hover:via-warning-soft/36 sm:hover:to-warning-soft/65",
    edgeFade: "from-card via-card/70 to-transparent",
    decor: "text-warning/[0.1]",
    frame: "border-warning/25 bg-card/85 text-warning-foreground",
    label: "group-hover:text-warning-foreground",
    chevron: "text-warning/50 group-hover:text-warning-foreground",
    footer:
      "border-warning/10 bg-gradient-to-b from-warning-soft/38 to-warning-soft/52 text-muted-foreground hover:from-warning-soft/48 hover:to-warning-soft/62 hover:text-warning-foreground sm:border-l-0 sm:bg-gradient-to-r sm:from-warning-soft/42 sm:to-warning-soft/58 sm:hover:from-warning-soft/52 sm:hover:to-warning-soft/68",
  },
} as const;

function HeroRailDecor({ variant }: { variant: keyof typeof heroRailVariants }) {
  if (variant === "review") {
    return (
      <>
        <div className="pointer-events-none absolute -left-3 top-2 h-16 w-16 rounded-full bg-warning/[0.06]" aria-hidden />
        <svg
          className={cn("pointer-events-none absolute -bottom-1 -right-1 h-[72px] w-[72px]", heroRailVariants.review.decor)}
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden
        >
          <circle cx="36" cy="36" r="28" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" />
          <circle cx="36" cy="36" r="16" stroke="currentColor" strokeWidth="1" />
          <path d="M36 20v32M20 36h32" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" />
        </svg>
      </>
    );
  }

  return (
    <>
      <div className="pointer-events-none absolute -left-2 top-3 h-14 w-14 rounded-full bg-primary/[0.06]" aria-hidden />
      <svg
        className={cn("pointer-events-none absolute -bottom-2 -right-2 h-[76px] w-[76px]", heroRailVariants.primary.decor)}
        viewBox="0 0 76 76"
        fill="none"
        aria-hidden
      >
        <path
          d="M18 22h28a4 4 0 014 4v24a4 4 0 01-4 4H18a4 4 0 01-4-4V26a4 4 0 014-4z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <path d="M46 22v32h8a4 4 0 004-4V26a4 4 0 00-4-4h-8" stroke="currentColor" strokeWidth="1.2" />
        <path d="M24 32h20M24 40h14" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
    </>
  );
}

export function HeroActionRail({
  label,
  icon: Icon,
  variant = "primary",
  to,
  params,
  search,
  onClick,
  footerLabel,
  onFooterClick,
}: {
  label: string;
  icon: LucideIcon;
  variant?: keyof typeof heroRailVariants;
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  onClick?: () => void;
  footerLabel?: string;
  onFooterClick?: () => void;
}) {
  const v = heroRailVariants[variant];
  const mainClass = cn(
    "group relative flex w-full shrink-0 flex-row items-center justify-between gap-3 overflow-hidden px-4 py-3.5 transition-all duration-300 sm:w-[92px] sm:flex-col sm:justify-center sm:px-3 sm:py-5",
    v.shell,
    footerLabel ? "sm:flex-1" : "",
  );

  const mainContent = (
    <>
      <span
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r to-transparent sm:block",
          v.edgeFade,
        )}
        aria-hidden
      />
      <HeroRailDecor variant={variant} />
      <Icon
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 h-14 w-14 -translate-y-1/2 opacity-[0.07] sm:right-auto sm:top-3 sm:translate-y-0",
          v.decor,
        )}
        aria-hidden
      />
      <div className="relative flex min-w-0 flex-1 items-center gap-3 sm:flex-col sm:gap-2.5">
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] transition-transform group-hover:scale-105",
            v.frame,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span
          className={cn(
            "text-[13px] font-semibold tracking-wide text-foreground transition-colors",
            v.label,
          )}
        >
          {label}
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 transition-colors sm:rotate-90",
            v.chevron,
          )}
        />
      </div>
    </>
  );

  return (
    <div className={cn("flex shrink-0 flex-col sm:w-[92px]", footerLabel && "sm:self-stretch")}>
      {to ? (
        <Link to={to} params={params} search={search} className={mainClass}>
          {mainContent}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={cn(mainClass, "text-left")}>
          {mainContent}
        </button>
      )}
      {footerLabel && onFooterClick && (
        <button
          type="button"
          onClick={onFooterClick}
          className={cn(
            "w-full border-t px-2 py-2 text-center text-[10.5px] font-medium transition-all duration-300 sm:px-2",
            v.footer,
          )}
        >
          {footerLabel}
        </button>
      )}
    </div>
  );
}

/** 概览大卡容器：左内容 + 右操作区 */
export function HeroOverviewCard({ children, action }: { children: ReactNode; action: ReactNode }) {
  return (
    <div className={cn(cardBase, "overflow-hidden")}>
      <div className="flex flex-col sm:flex-row sm:items-stretch">{children}{action}</div>
    </div>
  );
}

export function HeroOverviewBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative min-w-0 flex-1 p-5 sm:after:pointer-events-none sm:after:absolute sm:after:inset-y-0 sm:after:right-0 sm:after:w-10 sm:after:bg-gradient-to-r sm:after:from-transparent sm:after:to-primary-soft/10",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** 能力提升模块按钮统一圆角 */
export const learningBtnRadius = "rounded-md";

/** 列表/卡片内描边操作按钮 */
export const outlineBtnClass = cn(
  learningBtnRadius,
  "inline-flex items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:border-primary/25 hover:bg-muted/70",
);

export type ListActionVariant = "outline" | "soft" | "primary" | "text" | "textPrimary";

const listActionVariants: Record<ListActionVariant, string> = {
  outline: "border border-border bg-background text-foreground hover:border-primary/25 hover:bg-muted/70",
  soft: "border border-primary/15 bg-primary-soft/60 text-accent-foreground hover:border-primary/30 hover:bg-primary hover:text-primary-foreground",
  primary: "border border-primary bg-primary text-primary-foreground hover:bg-primary/90",
  text: "text-muted-foreground hover:text-primary",
  textPrimary: "text-primary hover:text-primary/80",
};

/** 列表行内操作按钮样式（小圆角，配合 lucide icon 使用） */
export function listActionClass(variant: ListActionVariant = "outline", className?: string) {
  const isText = variant === "text" || variant === "textPrimary";
  return cn(
    learningBtnRadius,
    "inline-flex items-center justify-center gap-1.5 font-medium transition-colors",
    isText ? "px-1 py-0.5 text-[12px]" : "px-2.5 py-1.5 text-[12px]",
    listActionVariants[variant],
    className,
  );
}

/** 同色系浅底变体，用于统计卡轻微区分（均在 primary 色族内） */
const statTintStyles = [
  "",
  "bg-primary-soft/25 border-primary/12",
  "bg-card",
  "bg-primary-soft/15 border-primary/10",
  "bg-card",
  "bg-primary-soft/20 border-primary/10",
] as const;

function StatCardDecor() {
  return (
    <>
      <div
        className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-primary/[0.07]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-1 top-10 h-10 w-10 rounded-full bg-primary/[0.04]"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 text-primary/[0.06]"
        viewBox="0 0 56 56"
        fill="none"
        aria-hidden
      >
        <circle cx="42" cy="42" r="18" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="42" cy="42" r="10" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" />
      </svg>
    </>
  );
}

function StatIconFrame({ icon, size = "md" }: { icon: ReactNode; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const inner = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconSize = size === "sm" ? "h-[17px] w-[17px]" : "h-5 w-5";

  return (
    <div className={cn("relative grid shrink-0 place-items-center", box)}>
      <div className="absolute inset-0 rounded-xl border border-primary/10 bg-primary-soft/60" aria-hidden />
      <div
        className={cn(
          "relative grid place-items-center rounded-xl border border-primary/20 bg-card text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
          inner,
        )}
      >
        <span className={cn("grid place-items-center [&>svg]:shrink-0", iconSize)}>{icon}</span>
      </div>
    </div>
  );
}

export function PageTitleMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 flex-col gap-[5px] pt-1.5", className)} aria-hidden>
      <div className="h-[26px] w-[3px] rounded-full bg-primary" />
      <div className="h-[10px] w-[3px] rounded-full bg-border" />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  size = "lg",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  size?: "lg" | "md";
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <PageTitleMark />
        <div className="min-w-0">
          <h1
            className={cn(
              "font-bold tracking-tight text-foreground",
              size === "lg" ? "text-[28px]" : "text-[22px] font-semibold",
            )}
          >
            {title}
          </h1>
          {subtitle && <p className="mt-1.5 text-[14px] text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h2 className="text-[18px] font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  active,
  onClick,
  className,
  valueClassName,
  tint = 0,
  emphasis,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
  /** 同色系浅底序号 0–5，用于一行内轻微区分 */
  tint?: number;
  /** 数值强调：default 深色字，primary 主色，remind 少量提示橙 */
  emphasis?: "default" | "primary" | "remind";
}) {
  const Comp = onClick ? "button" : "div";
  const emphasisClass =
    emphasis === "primary"
      ? "text-primary"
      : emphasis === "remind"
        ? "text-warning-foreground"
        : "text-foreground";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        cardBase,
        "relative overflow-hidden p-4 text-left hover:border-primary/30",
        statTintStyles[tint % statTintStyles.length],
        active && "border-primary/40 bg-primary-soft/35",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <StatCardDecor />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-medium tracking-wide text-muted-foreground">{label}</div>
          <div
            className={cn(
              "mt-2 text-[28px] font-bold tabular-nums leading-none tracking-tight",
              emphasisClass,
              valueClassName,
            )}
          >
            {value}
          </div>
          {hint && <div className="mt-2 text-[11.5px] leading-snug text-muted-foreground">{hint}</div>}
        </div>
        {icon && <StatIconFrame icon={icon} />}
      </div>
    </Comp>
  );
}

export type StatPanelItem = {
  key?: string;
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  emphasis?: "default" | "primary" | "remind";
  onClick?: () => void;
};

export function StatPanel({
  heading = "训练概览",
  caption,
  items,
  className,
}: {
  heading?: string;
  caption?: string;
  items: StatPanelItem[];
  className?: string;
}) {
  return (
    <div className={cn(cardBase, "relative flex min-h-full flex-col overflow-hidden border-primary/12", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-divider bg-primary-soft/40 px-5 py-3.5">
        <div>
          <div className="text-[14px] font-semibold text-foreground">{heading}</div>
          {caption && <div className="mt-0.5 text-[11.5px] text-muted-foreground">{caption}</div>}
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-card/80 px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          近 7 日
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 bg-primary-soft/[0.12] md:grid-cols-5">
        {items.map((item, i) => {
          const Comp = item.onClick ? "button" : "div";
          const emphasisClass =
            item.emphasis === "primary"
              ? "text-primary"
              : item.emphasis === "remind"
                ? "text-warning-foreground"
                : "text-foreground";
          const isOddLast = items.length % 2 !== 0 && i === items.length - 1;
          const isLastColMobile = !isOddLast && i % 2 === 1;
          const isLastRowMobile = isOddLast || i >= items.length - 2;
          const isLastMd = i === items.length - 1;

          return (
            <Comp
              key={item.key ?? item.label}
              type={item.onClick ? "button" : undefined}
              onClick={item.onClick}
              className={cn(
                "group relative flex min-w-0 flex-col gap-1.5 px-4 py-4 text-left transition-colors hover:bg-primary-soft/25",
                isOddLast && "col-span-2 md:col-span-1",
                !isLastColMobile && !isOddLast && "border-r border-divider/80",
                !isLastRowMobile && "border-b border-divider/80 md:border-b-0",
                !isLastMd && "md:border-r md:border-divider/80",
                item.onClick && "cursor-pointer",
              )}
            >
              <div className="flex items-center gap-2">
                {item.icon && (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-primary/12 bg-primary-soft/80 text-primary [&>svg]:h-3.5 [&>svg]:w-3.5">
                    {item.icon}
                  </span>
                )}
                <span className="text-[11.5px] font-medium leading-tight text-muted-foreground">{item.label}</span>
              </div>
              <div className={cn("text-[26px] font-bold tabular-nums leading-none tracking-tight", emphasisClass)}>
                {item.value}
              </div>
              {item.hint && (
                <div className="text-[11px] leading-snug text-muted-foreground">{item.hint}</div>
              )}
            </Comp>
          );
        })}
      </div>
    </div>
  );
}

export function OverviewStatCard({
  label,
  value,
  hint,
  detail,
  icon,
  active,
  onClick,
  className,
  valueClassName,
  tint = 0,
  emphasis,
}: {
  label: string;
  value: string | number;
  hint?: string;
  detail?: string;
  icon?: ReactNode;
  /** @deprecated accent is ignored; cards use unified primary styling */
  accent?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
  tint?: number;
  emphasis?: "default" | "primary" | "remind";
}) {
  const Comp = onClick ? "button" : "div";
  const emphasisClass =
    emphasis === "primary"
      ? "text-primary"
      : emphasis === "remind"
        ? "text-warning-foreground"
        : "text-foreground";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        cardBase,
        "relative overflow-hidden p-0 text-left hover:border-primary/30",
        statTintStyles[tint % statTintStyles.length],
        active && "border-primary/40 bg-primary-soft/30 ring-1 ring-primary/12",
        onClick && "cursor-pointer hover:bg-primary-soft/15",
        className,
      )}
    >
      {active && (
        <div className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-primary" aria-hidden />
      )}
      <StatCardDecor />
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {icon && <StatIconFrame icon={icon} size="sm" />}
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium tracking-wide text-muted-foreground">{label}</div>
            <div
              className={cn(
                "mt-1.5 text-[26px] font-bold tabular-nums leading-none tracking-tight",
                emphasisClass,
                valueClassName,
              )}
            >
              {value}
            </div>
            {hint && <div className="mt-1 text-[11.5px] text-muted-foreground">{hint}</div>}
          </div>
        </div>
        {detail && (
          <div
            className={cn(
              "mt-3 flex items-center gap-2 border-t border-divider pt-2.5",
              onClick && "border-primary/15",
            )}
          >
            <span
              className={cn("h-1 w-1 shrink-0 rounded-full", onClick ? "bg-primary" : "bg-primary/50")}
              aria-hidden
            />
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[11px]",
                onClick ? "font-medium text-primary/90" : "text-muted-foreground",
              )}
            >
              {detail}
            </span>
            {onClick && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary/55" aria-hidden />}
          </div>
        )}
      </div>
    </Comp>
  );
}

export function FeatureCard({
  title,
  desc,
  stats,
  action,
  icon,
  headerTheme,
  tags = [],
  progress,
  onClick,
  href,
  children,
}: {
  title: string;
  desc: string;
  stats: { label: string; value: string }[];
  action: ReactNode;
  icon?: ReactNode;
  headerTheme?: TopicHeaderTheme;
  tags?: string[];
  progress?: number;
  /** @deprecated tone is ignored; cards use unified primary styling */
  tone?: string;
  onClick?: () => void;
  href?: string;
  children?: ReactNode;
}) {
  const inner = (
    <>
      {headerTheme && icon ? (
        <TopicHeaderIllustration theme={headerTheme} icon={icon} roleTags={tags} />
      ) : (
        <div className="relative flex items-start justify-between gap-3 border-b border-divider bg-primary-soft/50 px-4 py-3.5">
          {icon && (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/80 bg-card text-primary">
              {icon}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-1">
            {tags.map((t) => (
              <Tag key={t} variant="outline">
                {t}
              </Tag>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[16px] font-semibold leading-snug text-foreground">{title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          {stats.map((s) => (
            <span key={s.label}>
              {s.label} {s.value}
            </span>
          ))}
        </div>
        {progress != null && (
          <div className="mt-3">
            <div className="mb-1.5 flex justify-between text-[12px] text-muted-foreground">
              <span>掌握度 {progress}%</span>
            </div>
            <ProgressBar
              value={progress}
              barStyle={headerTheme ? { backgroundColor: headerTheme.accent } : undefined}
            />
          </div>
        )}
        <div className="mt-4">{action}</div>
        {children}
      </div>
    </>
  );

  const cls = cn(cardBase, "group flex h-full flex-col overflow-hidden hover:border-primary/30");

  if (href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cls, "text-left")}>
        {inner}
      </button>
    );
  }

  return <div className={cls}>{inner}</div>;
}

export function ProgressBar({
  value,
  className,
  barClassName,
  barStyle,
}: {
  value: number;
  className?: string;
  barClassName?: string;
  barStyle?: CSSProperties;
}) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-primary transition-all", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, ...barStyle }}
      />
    </div>
  );
}

export function Tag({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "outline";
  className?: string;
}) {
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary-soft text-accent-foreground",
    success: "bg-muted text-foreground",
    warning: "bg-warning-soft text-warning-foreground",
    outline: "border border-border bg-background text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function FilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { key: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1 rounded-xl border border-border bg-card p-1", className)}>
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/70 hover:bg-muted",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export type ModuleTabItem<T extends string> = {
  key: T;
  label: string;
  desc?: string;
  icon: ReactNode;
};

/** 考试管理 / 个人沉淀等模块级 Tab 条（图标 + 标题 + 副标题） */
export function ModuleTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: ModuleTabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1 border-b border-divider bg-primary-soft/25 px-2 pt-2 pb-0", className)}>
      {tabs.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              "relative flex items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-left transition-all",
              active
                ? "z-[1] -mb-px border border-divider border-b-card bg-card text-primary shadow-sm ring-1 ring-primary/15"
                : "border border-transparent text-foreground/70 hover:bg-card/55 hover:text-foreground",
            )}
          >
            {active && (
              <span
                className="absolute inset-x-2.5 bottom-0 h-[3px] rounded-t-full bg-primary"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "shrink-0 [&>svg]:h-4 [&>svg]:w-4",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              {t.icon}
            </span>
            <div>
              <div className={cn("text-[13px] font-semibold", active ? "text-primary" : "font-medium")}>
                {t.label}
              </div>
              {t.desc && (
                <div className={cn("text-[10.5px]", active ? "text-primary/65" : "text-muted-foreground")}>
                  {t.desc}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** 模块 Tab 外层容器（Tab 条 + 内容区统一白底圆角面板） */
export function ModulePanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[13px] leading-normal outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}

/** 带「查询」按钮的搜索条，圆角较小，点击或回车触发 onSearch */
export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
  className,
  buttonLabel = "查询",
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
  buttonLabel?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-card px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 sm:max-w-xs">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch();
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[13px] leading-normal outline-none placeholder:text-muted-foreground"
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="shrink-0 rounded-md bg-primary px-3.5 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title?: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      {title && <div className="text-[15px] font-semibold text-foreground">{title}</div>}
      <p className={cn("text-[13px] text-muted-foreground", title && "mt-2")}>{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  size = "sm",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-border bg-background text-foreground hover:bg-muted hover:border-primary/30",
    ghost: "text-primary hover:bg-primary-soft/50",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-[12.5px]",
    md: "px-4 py-2.5 text-[13px]",
  };
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-colors",
        learningBtnRadius,
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({
  children,
  className,
  variant = "primary",
  size = "sm",
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "outline";
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: cn(outlineBtnClass, "hover:border-primary/30"),
  };
  const sizes = {
    sm: "px-3 py-1.5 text-[12.5px]",
    md: "px-4 py-2.5 text-[13px]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-colors",
        learningBtnRadius,
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ListCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        cardBase,
        "p-0 hover:border-primary/30",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function GridPattern({ id }: { id: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.14]" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern id={id} width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M 22 0 L 0 0 0 22" fill="none" stroke="currentColor" strokeWidth="0.6" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function TodayPlanCard({
  title,
  duration,
  count,
  action,
}: {
  title: string;
  duration: string;
  count: number;
  action: ReactNode;
}) {
  return (
    <div
      className={cn(
        cardBase,
        "relative flex min-h-full flex-col justify-between overflow-hidden border-primary/15 bg-primary-soft/35 p-5 lg:min-w-[240px]",
      )}
    >
      <StatCardDecor />
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <StatIconFrame
            icon={
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden>
                <path
                  d="M10 3v4M10 13v4M3 10h4M13 10h4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            }
            size="sm"
          />
          <div className="text-[12px] font-semibold text-primary">今日练习计划</div>
        </div>
        <div className="mt-3 text-[15px] font-semibold leading-snug text-foreground">{title}</div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-md border border-primary/15 bg-card/80 px-2 py-1 text-[11.5px] text-muted-foreground">
            预计 {duration}
          </span>
          <span className="inline-flex items-center rounded-md border border-primary/15 bg-card/80 px-2 py-1 text-[11.5px] text-muted-foreground">
            {count} 题
          </span>
        </div>
      </div>
      <div className="relative mt-4">{action}</div>
    </div>
  );
}

export function RecommendedItem({
  index,
  title,
  reason,
  count,
  mastery,
  tags,
  source,
  progress,
  action,
}: {
  index: number;
  title: string;
  reason: string;
  count: number;
  mastery: number;
  tags: string[];
  source: string;
  progress: number;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-divider px-5 py-4 transition-colors first:border-t-0 hover:bg-primary-soft/10 lg:flex-row lg:items-center lg:gap-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/15 bg-primary-soft text-[12px] font-bold tabular-nums text-primary">
          {String(index).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div className="text-[15px] font-semibold leading-snug text-foreground">{title}</div>
            <span
              className={cn(
                "text-[12px] font-medium tabular-nums",
                mastery < 40 ? "text-warning-foreground" : "text-primary",
              )}
            >
              掌握度 {mastery}%
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-[12.5px] text-muted-foreground">{reason}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12px] text-muted-foreground">
            <span>{count} 题</span>
            <span aria-hidden>·</span>
            <span>来源 {source}</span>
            {tags.map((t) => (
              <Tag key={t} variant="outline" className="ml-0.5">
                {t}
              </Tag>
            ))}
          </div>
          <div className="mt-2.5 flex max-w-xs items-center gap-2.5">
            <ProgressBar
              value={progress}
              className="flex-1"
              barClassName={mastery < 40 ? "bg-warning" : undefined}
            />
          </div>
        </div>
      </div>
      <div className="shrink-0 lg:w-[108px] lg:text-right">{action}</div>
    </div>
  );
}

export function TopicCard({
  title,
  desc,
  roleTags,
  docCount,
  questionCount,
  scenarioCount,
  scenarioLabel = "场景",
  progress,
  updatedAt,
  icon,
  headerTheme,
  action,
}: {
  title: string;
  desc: string;
  roleTags: string[];
  docCount: number;
  questionCount: number;
  scenarioCount: number;
  scenarioLabel?: string;
  progress: number;
  updatedAt?: string;
  icon: ReactNode;
  headerTheme?: TopicHeaderTheme;
  /** @deprecated tone is ignored; cards use unified primary styling */
  tone?: string;
  action: ReactNode;
}) {
  return (
    <div className={cn(cardBase, "group flex h-full flex-col overflow-hidden hover:border-primary/30")}>
      {headerTheme ? (
        <TopicHeaderIllustration theme={headerTheme} icon={icon} roleTags={roleTags} />
      ) : (
        <div className="relative flex items-start justify-between gap-3 border-b border-divider bg-primary-soft/50 px-5 py-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/80 bg-card text-primary">
            {icon}
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            {roleTags.map((r) => (
              <Tag key={r} variant="outline">
                {r}
              </Tag>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-[16px] font-semibold leading-snug">{title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
          <span>资料 {docCount}</span>
          <span>题目 {questionCount}</span>
          <span>
            {scenarioLabel} {scenarioCount}
          </span>
        </div>
        <div className="mt-3">
          <div className="mb-1.5 flex justify-between text-[12px]">
            <span className="text-muted-foreground">进度 {progress}%</span>
            {updatedAt && <span className="text-muted-foreground">更新 {updatedAt}</span>}
          </div>
          <ProgressBar
            value={progress}
            barStyle={headerTheme ? { backgroundColor: headerTheme.accent } : undefined}
          />
        </div>
        <div className="mt-4">{action}</div>
      </div>
    </div>
  );
}

export function PersonalAssetCard({
  icon,
  title,
  meta,
  tags,
  actions,
}: {
  icon: ReactNode;
  title: string;
  meta: ReactNode;
  tags?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className={cn(cardBase, "flex flex-col gap-4 p-5 hover:border-primary/30 sm:flex-row sm:items-start")}>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold leading-snug text-foreground">{title}</div>
        {tags && <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div>}
        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-[12px] text-muted-foreground">{meta}</div>
      </div>
      <div className="flex flex-wrap gap-2 sm:shrink-0 sm:justify-end">{actions}</div>
    </div>
  );
}

export function GrowthReminderCard({
  items,
  action,
}: {
  items: { label: string; value: string }[];
  action: ReactNode;
}) {
  return (
    <div className={cn(cardBase, "border-primary/15 bg-primary-soft/25 p-5")}>
      <div className="text-[16px] font-semibold">今日沉淀提醒</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-border/80 bg-background/60 px-4 py-3">
            <div className="text-[12px] text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-[14px] font-medium text-foreground">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">{action}</div>
    </div>
  );
}

export function RecordRow({
  cells,
  actions,
  gridClassName,
}: {
  cells: ReactNode[];
  actions: ReactNode;
  /** 不传则按 cells 数量自动匹配列数（含操作列） */
  gridClassName?: string;
}) {
  const autoGrid =
    cells.length >= 7
      ? RECORDS_TABLE_GRID
      : "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_0.65fr_0.65fr_minmax(148px,1fr)]";

  return (
    <div
      className={cn(
        "border-t border-divider px-5 py-3.5 transition-colors first:border-t-0 hover:bg-primary-soft/10",
        gridClassName ?? autoGrid,
        "lg:grid lg:items-center lg:gap-4",
      )}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          className={cn(
            "min-w-0 text-[13px] leading-snug",
            i === 0 && "font-medium text-foreground",
            i > 0 && "text-muted-foreground",
            i > 0 && "mt-1 lg:mt-0",
          )}
        >
          {cell}
        </div>
      ))}
      <div className="mt-3 flex shrink-0 flex-wrap gap-2 lg:mt-0 lg:justify-end">{actions}</div>
    </div>
  );
}

/** 练习记录 7 数据列 + 操作列 */
export const RECORDS_TABLE_GRID =
  "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_0.55fr_0.55fr_0.55fr_0.55fr_minmax(148px,1fr)]";

/** 训练概览 5 数据列 + 操作列 */
export const TRAINING_RECORDS_GRID =
  "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_0.65fr_0.65fr_minmax(148px,1fr)]";

export function PillSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
            value === o.value ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
