import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { StemCell } from "@/components/common/ellipsis-tooltip";
import { BANK_QUESTIONS, type Paper, type QuestionType } from "@/lib/mock/examAdmin";
import { AssignPanel } from "@/components/exam/assign-panel";

function diffClass(d: string) {
  return d === "易"
    ? "bg-success-soft text-success"
    : d === "中"
      ? "bg-warning-soft text-warning-foreground"
      : "bg-destructive/10 text-destructive";
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
}

export function AddQuestionDialog({
  open,
  type,
  onClose,
  onAdd,
}: {
  open: boolean;
  type?: QuestionType;
  onClose: () => void;
  onAdd: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const pool = useMemo(
    () => BANK_QUESTIONS.filter((b) => b.status === "启用" && (!type || b.type === type)),
    [type],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>添加题目</DialogTitle>
          <DialogDescription>从正式题库选择题目加入试卷。</DialogDescription>
        </DialogHeader>
        <div className="max-h-80 overflow-auto rounded-lg border border-border">
          <table className="w-full whitespace-nowrap text-[12.5px]">
            <thead className="sticky top-0 bg-muted/60 text-[11.5px] text-muted-foreground">
              <tr>
                <Th className="w-8"> </Th>
                <Th className="min-w-[240px]">题干</Th>
                <Th>题型</Th>
                <Th>知识点</Th>
                <Th>难度</Th>
              </tr>
            </thead>
            <tbody>
              {pool.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-muted/40">
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(b.id)}
                      onChange={() => toggle(b.id)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                  </Td>
                  <StemCell text={b.stem} maxWidthClass="max-w-[300px]" />
                  <Td className="text-muted-foreground">{b.type}</Td>
                  <Td><Badge variant="secondary" className="font-normal">{b.knowledge}</Badge></Td>
                  <Td><span className={`rounded-md px-1.5 py-0.5 text-[11px] ${diffClass(b.difficulty)}`}>{b.difficulty}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12.5px] text-muted-foreground">已选择 {selected.size} 题</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted">取消</button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => {
                onAdd([...selected]);
                setSelected(new Set());
                onClose();
              }}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              确认添加
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AssignDialog({
  paper,
  onClose,
}: {
  paper: Paper | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!paper} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>试卷下发</DialogTitle>
          <DialogDescription>{paper?.name} · 选择下发对象</DialogDescription>
        </DialogHeader>
        {paper && (
          <AssignPanel
            paperName={paper.name}
            onCancel={onClose}
            onAssign={(count) => {
              toast.success(`已向 ${count} 人下发试卷`);
              onClose();
            }}
            onDraft={() => {
              toast.success("已暂存草稿");
              onClose();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
