import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, X, FileText, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import type { ScenarioCard, ScenarioEvidence } from "@/lib/mock/scenario";

/** scenario result 页面区块统一边框与圆角 */
export const scenarioResultBlockClass =
  "rounded-[14px] border border-[#EEEFF2] bg-card";

export const scenarioResultInnerBlockClass =
  "rounded-[14px] border border-[#EEEFF2] bg-background";

/** scenario result 区块标题左侧图标容器 */
export function ScenarioSectionHeader({
  icon,
  iconWrapClassName,
  title,
  titleClassName,
  className,
}: {
  icon: ReactNode;
  iconWrapClassName: string;
  title: string;
  titleClassName?: string;
  className?: string;
}) {
  return (
    <header className={`flex items-center gap-2.5 ${className ?? "mb-3"}`}>
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${iconWrapClassName}`}
      >
        {icon}
      </span>
      <h3 className={`text-[15px] font-semibold tracking-tight ${titleClassName ?? ""}`}>
        {title}
      </h3>
    </header>
  );
}

export function SelectedConditionBar({
  items,
  onRemove,
}: {
  items: { key: string; label: string; value?: string; removable?: boolean }[];
  onRemove?: (key: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-primary-soft/40 px-4 py-3">
      <div className="mb-1.5 text-[12px] text-muted-foreground">已选条件</div>
      <div className="flex flex-wrap items-center gap-2">
        {items.length === 0 && (
          <span className="text-[12.5px] text-muted-foreground">尚未选择,请按步骤完成必填项</span>
        )}
        {items.map((it) => (
          <span
            key={it.key}
            className={`inline-flex items-center gap-1 rounded-md border border-primary/30 bg-card px-2 py-1 text-[12px] ${
              it.value ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <span className="text-muted-foreground">{it.label}:</span>
            <span className="font-medium">{it.value || "待选择"}</span>
            {it.removable && it.value && onRemove && (
              <button
                onClick={() => onRemove(it.key)}
                className="ml-1 grid h-4 w-4 place-items-center rounded hover:bg-muted"
                aria-label={`移除${it.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

export function StepCard({
  step,
  title,
  required,
  children,
}: {
  step: number;
  title: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center gap-2">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-primary-soft text-[12px] font-semibold text-primary">
          {step}
        </span>
        <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
        {required && (
          <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[11px] text-warning-foreground">必填</span>
        )}
      </header>
      {children}
    </section>
  );
}

export function OptionChips<T extends string>({
  options,
  value,
  onChange,
  multi,
}: {
  options: { key: T; label: string }[];
  value?: T | T[];
  onChange: (v: T) => void;
  multi?: boolean;
}) {
  const selected = (k: T) =>
    multi ? Array.isArray(value) && value.includes(k) : value === k;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors ${
            selected(o.key)
              ? "border-primary bg-primary-soft text-primary"
              : "border-border bg-background hover:border-primary/50 hover:bg-muted/60"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ResultCardShell({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${scenarioResultBlockClass} p-5`}>
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
        {badge && (
          <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] text-primary">{badge}</span>
        )}
      </header>
      <div className="space-y-3 text-[13px] leading-6 text-foreground/90">{children}</div>
    </section>
  );
}

export function CitationChip({
  ids,
  onPick,
}: {
  ids?: string[];
  onPick?: (id: string) => void;
}) {
  if (!ids || ids.length === 0) return null;
  return (
    <span className="ml-1 inline-flex gap-1">
      {ids.map((id) => (
        <button
          key={id}
          onClick={() => onPick?.(id)}
          className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15"
          title="点击查看原文"
        >
          [{id}]
        </button>
      ))}
    </span>
  );
}

export function EvidenceCard({
  ev,
  active,
  onPick,
}: {
  ev: ScenarioEvidence;
  active?: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(ev.id)}
      className={`w-full rounded-lg border p-4 text-left transition-colors ${
        active
          ? "border-primary bg-primary-soft/50"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
      }`}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary">
          [{ev.id}]
        </span>
        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
          {ev.sourceType}
        </span>
        {ev.version && (
          <span className="text-[11px] text-muted-foreground">· {ev.version}</span>
        )}
      </div>
      <div className="text-[13.5px] font-medium">{ev.docTitle}</div>
      <div className="mt-0.5 text-[12px] text-muted-foreground">章节:{ev.section}</div>
      <div className="mt-2 line-clamp-2 rounded bg-muted/40 px-2 py-1.5 text-[12.5px] text-foreground/85">
        {ev.snippet}
      </div>
    </button>
  );
}

export function ResultCardBody({
  card,
  onCitation,
}: {
  card: ScenarioCard;
  onCitation: (id: string) => void;
}) {
  return (
    <>
      {card.summary && <p>{card.summary}</p>}
      {card.bullets && (
        <ul className="space-y-1.5">
          {card.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>
                {b.text}
                <CitationChip ids={b.refIds} onPick={onCitation} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {card.steps && (
        <ol className="space-y-2">
          {card.steps.map((s) => (
            <li key={s.no} className="flex gap-3 rounded-lg bg-muted/40 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary text-[12px] font-semibold text-primary-foreground">
                {s.no}
              </span>
              <div className="flex-1">
                <div>
                  {s.text}
                  <CitationChip ids={s.refIds} onPick={onCitation} />
                </div>
                {s.focus && (
                  <div className="mt-1 text-[12px] text-muted-foreground">关注:{s.focus}</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      {card.risks && (
        <ul className="space-y-2">
          {card.risks.map((r, i) => (
            <li key={i} className="rounded-lg border-l-2 border-warning bg-warning-soft/40 p-3">
              <div className="text-[13px] font-medium">
                {r.name}
                <CitationChip ids={r.refIds} onPick={onCitation} />
              </div>
              <div className="mt-1 text-[12.5px] text-muted-foreground">
                典型误区:{r.pitfall}
              </div>
              <div className="mt-0.5 text-[12.5px]">建议:{r.advice}</div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function RightAuxPanel({
  mode,
  setMode,
  scenarioTitle,
  evidence,
  selectedEvId,
  quickFollowups,
  followups,
  onAsk,
}: {
  mode: "ask" | "source";
  setMode: (m: "ask" | "source") => void;
  scenarioTitle: string;
  evidence: ScenarioEvidence[];
  selectedEvId?: string;
  quickFollowups: string[];
  followups: { q: string; a: string }[];
  onAsk: (q: string) => void;
}) {
  const ev = evidence.find((e) => e.id === selectedEvId);
  return (
    <aside className="sticky top-20 flex h-[calc(100vh-7rem)] w-[400px] shrink-0 flex-col rounded-lg border border-border bg-card">
      <div className="flex items-center gap-1 border-b border-border px-3 py-2">
        {(["ask", "source"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              mode === m
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {m === "ask" ? "继续追问" : "原文引用"}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {mode === "ask" ? (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted/40 p-3 text-[12.5px] text-muted-foreground">
              <div className="mb-1 text-[11px]">当前场景</div>
              <div className="text-foreground">{scenarioTitle}</div>
            </div>
            <div>
              <div className="mb-1.5 text-[12px] text-muted-foreground">快捷追问</div>
              <div className="flex flex-wrap gap-1.5">
                {quickFollowups.map((q) => (
                  <button
                    key={q}
                    onClick={() => onAsk(q)}
                    className="rounded-md border border-border bg-background px-2 py-1 text-[12px] hover:border-primary/50 hover:bg-primary-soft/40"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {followups.map((f, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="ml-6 rounded-lg bg-primary-soft px-3 py-2 text-[12.5px]">
                    {f.q}
                  </div>
                  <div className="mr-6 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px] text-foreground/85">
                    <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Sparkles className="h-3 w-3" /> 追问回答(培训参考)
                    </div>
                    {f.a}
                  </div>
                </div>
              ))}
              {followups.length === 0 && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-[12px] text-muted-foreground">
                  点击上方快捷追问,或直接输入问题
                </div>
              )}
            </div>
          </div>
        ) : ev ? (
          <div className="space-y-3 text-[13px]">
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] font-medium text-primary">
                [{ev.id}]
              </span>
              <span className="text-[12px] text-muted-foreground">{ev.sourceType}</span>
            </div>
            <div className="font-medium">{ev.docTitle}</div>
            <div className="text-[12px] text-muted-foreground">章节:{ev.section}</div>
            <div className="rounded-lg bg-primary-soft/40 p-3 text-[13px] leading-6">
              <span className="bg-warning-soft/70 px-1 py-0.5">{ev.snippet}</span>
            </div>
            {ev.context && (
              <div className="rounded-lg bg-muted/40 p-3 text-[12.5px] leading-6 text-foreground/85">
                <div className="mb-1 text-[11px] text-muted-foreground">上下文</div>
                {ev.context}
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="rounded-md border border-border bg-background px-2 py-1 text-[12px] hover:bg-muted">
                展开上一段
              </button>
              <button className="rounded-md border border-border bg-background px-2 py-1 text-[12px] hover:bg-muted">
                展开下一段
              </button>
              {ev.docId && (
                <Link
                  to="/learn/doc/$id"
                  params={{ id: ev.docId }}
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <FileText className="h-3 w-3" /> 查看资料详情
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-[12.5px] text-muted-foreground">
            <div>
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-muted-foreground/60" />
              点击主内容中的引用编号 [依据-xx] 或下方依据卡片,可在此查看原文片段。
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export function ScenarioBreadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {it.to ? (
            <Link to={it.to as any} className="hover:text-foreground">
              {it.label}
            </Link>
          ) : (
            <span className="text-foreground">{it.label}</span>
          )}
          {i < items.length - 1 && <ChevronRight className="h-3 w-3" />}
        </span>
      ))}
    </nav>
  );
}

export function SectionLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to as any}
      className="inline-flex items-center gap-1 text-[12.5px] font-medium text-primary hover:underline"
    >
      {label} <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
