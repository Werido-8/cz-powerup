import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TopicThemeKey = "t-newbie" | "t-op" | "t-fault" | "t-agc" | "default";

export type TopicHeaderTheme = {
  bg: string;
  accent: string;
  accentMuted: string;
  pattern: ReactNode;
};

/** 卡片内嵌装饰，仅出现在图标底板内，不溢出到标签区 */
function PatternNewbie({ accent, accentMuted }: { accent: string; accentMuted: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="38" cy="10" r="8" fill={accentMuted} fillOpacity="0.18" />
      <circle cx="10" cy="38" r="10" fill={accent} fillOpacity="0.1" />
      <path d="M14 30c3-6 7-9 11-9" stroke={accent} strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PatternOperation({ accent }: { accent: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M8 34l6-10 5 7 8-5 5 8H8z"
        fill={accent}
        fillOpacity="0.1"
        stroke={accent}
        strokeOpacity="0.28"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="36" cy="12" r="6" stroke={accent} strokeOpacity="0.22" strokeWidth="1" />
    </svg>
  );
}

function PatternFault({ accent }: { accent: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M8 34h28" stroke={accent} strokeOpacity="0.2" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M10 32l8-14 6 8 10-16 6 10"
        stroke={accent}
        strokeOpacity="0.45"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PatternAgc({ accent, accentMuted }: { accent: string; accentMuted: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M6 28h36" stroke={accentMuted} strokeOpacity="0.35" strokeWidth="0.8" strokeDasharray="3 3" />
      <path
        d="M6 30c5-4 9-14 15-10s8 14 14 10 9-6 15-4"
        stroke={accent}
        strokeOpacity="0.5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PatternDefault({ accent }: { accent: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="28" y="8" width="14" height="18" rx="2" fill={accent} fillOpacity="0.1" stroke={accent} strokeOpacity="0.25" />
    </svg>
  );
}

const THEME_DEFS: Record<
  TopicThemeKey,
  {
    bg: string;
    accent: string;
    accentMuted: string;
    Pattern: (props: { accent: string; accentMuted: string }) => ReactNode;
  }
> = {
  "t-newbie": {
    bg: "bg-[#EAF7F8]",
    accent: "#349BAC",
    accentMuted: "#5BB8C7",
    Pattern: PatternNewbie,
  },
  "t-op": {
    bg: "bg-[#E3F2F4]",
    accent: "#2E8F9E",
    accentMuted: "#349BAC",
    Pattern: PatternOperation,
  },
  "t-fault": {
    bg: "bg-[#E8F4F6]",
    accent: "#1F7A8C",
    accentMuted: "#349BAC",
    Pattern: PatternFault,
  },
  "t-agc": {
    bg: "bg-[#EDF9FA]",
    accent: "#349BAC",
    accentMuted: "#6EC4D0",
    Pattern: PatternAgc,
  },
  default: {
    bg: "bg-primary-soft/50",
    accent: "#349BAC",
    accentMuted: "#5BB8C7",
    Pattern: PatternDefault,
  },
};

export function getTopicHeaderTheme(topicId: string): TopicHeaderTheme {
  const key = (topicId in THEME_DEFS ? topicId : "default") as TopicThemeKey;
  const def = THEME_DEFS[key];
  const Pattern = def.Pattern;
  return {
    bg: def.bg,
    accent: def.accent,
    accentMuted: def.accentMuted,
    pattern: <Pattern accent={def.accent} accentMuted={def.accentMuted} />,
  };
}

const FEATURE_THEME_KEYS: Record<string, TopicThemeKey> = {
  practice: "t-op",
  exam: "default",
  wrong: "t-fault",
  quizsets: "t-agc",
};

export function getFeatureHeaderTheme(featureId: string): TopicHeaderTheme {
  return getTopicHeaderTheme(FEATURE_THEME_KEYS[featureId] ?? "default");
}

export function TopicHeaderIllustration({
  theme,
  icon,
  roleTags,
}: {
  theme: TopicHeaderTheme;
  icon: ReactNode;
  roleTags: string[];
}) {
  return (
    <div
      className={cn("relative border-b border-l-[3px] border-divider px-4 py-3.5", theme.bg)}
      style={{ borderLeftColor: theme.accent }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border bg-card"
            style={{ borderColor: `${theme.accent}28`, color: theme.accent }}
          >
            {theme.pattern}
            <span className="relative z-[1] [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
          </div>
          <div className="hidden min-w-0 sm:block">
            <div
              className="h-1 w-8 rounded-full opacity-60"
              style={{ backgroundColor: theme.accent }}
              aria-hidden
            />
            <div
              className="mt-1 h-1 w-5 rounded-full opacity-30"
              style={{ backgroundColor: theme.accentMuted }}
              aria-hidden
            />
          </div>
        </div>
        <div className="flex max-w-[58%] flex-wrap justify-end gap-1">
          {roleTags.map((r) => (
            <span
              key={r}
              className="inline-flex items-center rounded-full border bg-card/95 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground"
              style={{ borderColor: `${theme.accent}20` }}
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
