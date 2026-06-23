import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, BookOpen, NotebookPen, Workflow, ShieldAlert, Trash2 } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { useMockStore } from "@/lib/mock/store";
import { DOCS } from "@/lib/mock/data";
import { ALL_SCENARIOS } from "@/lib/mock/scenario";

export const Route = createFileRoute("/assets/collection/$id")({
  loader: ({ params, context }) => {
    void context;
    // Read from defaults; live state read in component via hook
    return { id: params.id };
  },
  component: CollectionDetail,
  notFoundComponent: () => (
    <PageShell>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
        知识集不存在
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        载入出错: {error.message}
      </div>
    </PageShell>
  ),
  head: () => ({ meta: [{ title: "知识集详情 · 涉网运行 AI 训练平台" }] }),
});

function CollectionDetail() {
  const { id } = Route.useLoaderData() as { id: string };
  const navigate = useNavigate();
  const { state } = useMockStore();
  const c = state.collections.find((x) => x.id === id);

  if (!c) {
    return (
      <PageShell>
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          知识集不存在或已删除。
          <div className="mt-3">
            <Link to="/assets" className="text-primary hover:underline">
              返回个人沉淀
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

  const docs = c.docIds.map((d) => DOCS.find((x) => x.id === d)).filter(Boolean);
  const notes = (c.noteIds ?? []).map((n) => state.notes.find((x) => x.id === n)).filter(Boolean);
  const scenes = (c.scenarioIds ?? [])
    .map((s) => ALL_SCENARIOS.find((x) => x.id === s))
    .filter(Boolean);

  return (
    <PageShell>
      <nav className="mb-3 flex items-center gap-1 text-[12px] text-muted-foreground">
        <Link to="/assets" className="hover:text-primary">
          个人沉淀
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{c.name}</span>
      </nav>

      <div className="mb-5 rounded-lg border border-border bg-card p-6">
        <h1 className="text-[20px] font-semibold tracking-tight">{c.name}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{c.desc}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.tags.map((t) => (
            <span
              key={t}
              className="rounded bg-primary-soft px-1.5 py-0.5 text-[11px] text-primary"
            >
              {t}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-[12px]">
          <Stat label="资料" v={docs.length} />
          <Stat label="笔记" v={notes.length} />
          <Stat label="场景" v={scenes.length} />
        </div>
      </div>

      <Section title={`资料 (${docs.length})`}>
        {docs.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {docs.map((d) => d && (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{d.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {d.docType} · {d.plant}
                  </div>
                </div>
                <Link
                  to="/learn/doc/$id"
                  params={{ id: d.id }}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <BookOpen className="h-3 w-3" /> 阅读
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`笔记 (${notes.length})`}>
        {notes.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => n && (
              <li key={n.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-center gap-2">
                  <NotebookPen className="h-3.5 w-3.5 text-primary" />
                  <div className="text-[13px] font-medium">{n.title}</div>
                </div>
                <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-[12px] text-foreground/80">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`场景 (${scenes.length})`}>
        {scenes.length === 0 ? (
          <Empty />
        ) : (
          <ul className="space-y-2">
            {scenes.map((s) => s && (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  {s.kind === "typical" ? (
                    <Workflow className="h-4 w-4 text-primary" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-warning-foreground" />
                  )}
                  <div>
                    <div className="text-[13px] font-medium">{s.title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {s.kind === "typical" ? "典型操作" : "故障处置"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    navigate({
                      to:
                        s.kind === "typical"
                          ? "/scenario/typical/result/$id"
                          : "/scenario/fault/result/$id",
                      params: { id: s.id },
                    })
                  }
                  className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  打开
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-[14px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[18px] font-semibold tabular-nums">{v}</div>
    </div>
  );
}
function Empty() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-[12px] text-muted-foreground">
      暂无内容
    </div>
  );
}
