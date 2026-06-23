import { type ReactNode } from "react";
import { X } from "lucide-react";
import type { SimilarCase } from "@/lib/mock/scenario";

export function SimilarCaseDrawer({
  open,
  onClose,
  cases,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  cases: SimilarCase[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (!open) return null;
  const sc = cases.find((c) => c.id === selectedId) ?? cases[0];
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-foreground/30 backdrop-blur-sm" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-xl flex-col bg-card shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-[14px] font-semibold">相似案例详情</div>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="grid grid-cols-12 flex-1 overflow-hidden">
          <div className="col-span-4 overflow-auto border-r border-border bg-muted/20 p-2">
            {cases.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c.id)}
                className={`mb-1 block w-full rounded-md px-2 py-2 text-left text-[12px] ${
                  c.id === sc?.id ? "bg-primary-soft text-primary" : "hover:bg-muted"
                }`}
              >
                <div className="font-medium">{c.title}</div>
                <div className="mt-0.5 text-[10.5px] text-muted-foreground">{c.date}</div>
              </button>
            ))}
          </div>
          {sc && (
            <div className="col-span-8 overflow-auto p-5 text-[13px] leading-6">
              <h3 className="text-[15px] font-semibold">{sc.title}</h3>
              <div className="mt-1 text-[12px] text-muted-foreground">
                {sc.date} · {sc.device}
              </div>
              <Row label="现象">{sc.phenomenon}</Row>
              <Row label="匹配点">{sc.matchPoint}</Row>
              <Row label="处置经过">{sc.process}</Row>
              <Row label="教训与启示">{sc.lesson}</Row>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <p className="mt-1 text-foreground/85">{children}</p>
    </div>
  );
}
