import { Link } from "@tanstack/react-router";
import { X, BookOpen, Star, FileText, MessagesSquare } from "lucide-react";
import type { Doc } from "@/lib/mock/data";
import { DOCS } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";

export function DocDrawer({
  doc,
  onClose,
  highlightKeyword,
}: {
  doc: Doc | null;
  onClose: () => void;
  highlightKeyword?: string;
}) {
  const { state, toggleFavorite } = useMockStore();
  if (!doc) return null;
  const fav = state.favorites.includes(doc.id);

  const hl = (text: string) => {
    if (!highlightKeyword) return text;
    const idx = text.indexOf(highlightKeyword);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="rounded bg-warning-soft px-0.5 text-warning-foreground">
          {highlightKeyword}
        </mark>
        {text.slice(idx + highlightKeyword.length)}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[560px] overflow-y-auto bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card/95 px-6 py-4 backdrop-blur">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-foreground">
                {doc.docType}
              </span>
              <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">
                {doc.source}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold leading-snug text-foreground">{doc.title}</h3>
            <div className="mt-1 text-[11.5px] text-muted-foreground">
              {doc.plant} · {doc.equipment} · 更新 {doc.updatedAt}
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              目录
            </div>
            <ul className="space-y-1">
              {doc.toc.map((t) => (
                <li key={t.id} className="text-[12.5px] text-foreground/80">
                  · {t.title}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            {doc.body.map((b) => (
              <div
                key={b.id}
                className={`rounded-lg border p-4 ${
                  b.highlight ? "border-warning/40 bg-warning-soft/40" : "border-border bg-background"
                }`}
              >
                <div className="mb-1.5 text-[12px] font-semibold text-foreground">{b.title}</div>
                <p className="text-[13px] leading-relaxed text-foreground/85">{hl(b.text)}</p>
              </div>
            ))}
          </div>

          {doc.related?.length ? (
            <div className="mt-6">
              <div className="mb-2 text-[12px] font-medium text-foreground">关联资料</div>
              <div className="grid gap-2">
                {doc.related.map((rid) => {
                  const r = DOCS.find((d) => d.id === rid);
                  if (!r) return null;
                  return (
                    <Link
                      key={rid}
                      to="/learn/doc/$id"
                      params={{ id: rid }}
                      onClick={onClose}
                      className="block rounded-lg border border-border bg-background p-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
                    >
                      <div className="text-[12.5px] font-medium text-foreground">{r.title}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {r.docType} · {r.plant}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-card/95 px-6 py-3 backdrop-blur">
          <Link
            to="/learn/doc/$id"
            params={{ id: doc.id }}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <BookOpen className="h-3.5 w-3.5" /> 打开全文
          </Link>
          <button
            onClick={() => toggleFavorite(doc.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors ${
              fav
                ? "border-warning/40 bg-warning-soft text-warning-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} /> {fav ? "已收藏" : "收藏"}
          </button>
          {/* 本期暂不开放：智能问答
          <Link
            to="/chat"
            search={{ prefill: `针对《${doc.title}》提问` }}
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] font-medium text-foreground hover:bg-muted"
          >
            <MessagesSquare className="h-3.5 w-3.5" /> 针对此文提问
          </Link>
          */}
          <div className="ml-auto inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileText className="h-3 w-3" /> 培训用
          </div>
        </div>
      </aside>
    </div>
  );
}
