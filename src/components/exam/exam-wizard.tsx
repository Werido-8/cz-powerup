import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GEN_PREVIEW, type Paper } from "@/lib/mock/examAdmin";
import { toast } from "sonner";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

type ExamWizardProps = {
  open: boolean;
  onClose: () => void;
  onComplete: (paper: Partial<Paper>) => void;
};

const STEPS = ["条件输入", "AI 出题", "编辑筛选", "预览确认", "下发设置"];

export function ExamWizard({ open, onClose, onComplete }: ExamWizardProps) {
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(20);
  const [deadline, setDeadline] = useState("");

  const reset = () => {
    setStep(0);
    setPrompt("");
    setCount(20);
    setDeadline("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finish = () => {
    onComplete({
      name: prompt.slice(0, 40) || "AI 组卷试卷",
      questionCount: count,
      deadline: deadline || undefined,
      source: "AI 组卷",
      status: "草稿",
    });
    toast.success("组卷向导完成，已创建草稿试卷");
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[16px]">
            <Sparkles className="h-4 w-4 text-primary" /> 智能组卷向导
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            步骤 {step + 1}/{STEPS.length}：{STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {step === 0 && (
            <>
              <label className="block text-[12px] font-medium text-muted-foreground">自然语言描述 / 组卷条件</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例：AGC 与两细则取证，单选+多选，难度中等，20 题"
                className="min-h-[100px] text-[13px]"
              />
              <label className="block text-[12px] font-medium text-muted-foreground">题量</label>
              <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} className="h-8" />
            </>
          )}
          {step === 1 && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-[12.5px]">
              <p className="mb-2 font-medium">AI 出题预览（mock）</p>
              <ul className="space-y-1 text-muted-foreground">
                {GEN_PREVIEW.questions.slice(0, 4).map((q, i) => (
                  <li key={i}>· {q.stem.slice(0, 48)}…</li>
                ))}
              </ul>
            </div>
          )}
          {step === 2 && (
            <p className="text-[13px] text-muted-foreground">可在下一步预览后，于详情页继续增删换题。</p>
          )}
          {step === 3 && (
            <div className="rounded-lg border border-border p-3 text-[13px]">
              <div>试卷名称：{prompt.slice(0, 40) || "AI 组卷试卷"}</div>
              <div className="mt-1 text-muted-foreground">题量 {count} · 来源 AI 组卷</div>
            </div>
          )}
          {step === 4 && (
            <>
              <label className="block text-[12px] font-medium text-muted-foreground">截止时间（可选）</label>
              <Input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="2026-08-01 18:00" className="h-8" />
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-[12px] hover:bg-muted">
              <ChevronLeft className="h-3.5 w-3.5" /> 上一步
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90">
              下一步 <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button type="button" onClick={finish} className="rounded-md bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground hover:bg-primary/90">
              完成并创建
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
