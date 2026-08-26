import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Difficulty, QuestionType } from "@/lib/mock/examAdmin";
import { AI_APPEND_BATCH_SIZE } from "./paper-context";

export interface AiAppendContext {
  name: string;
  goal: string;
  category: string;
  specialty: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  gapCount: number;
}

interface AiAppendConfirmDialogProps {
  open: boolean;
  context: AiAppendContext | null;
  onClose: () => void;
  onConfirm: () => void;
}

function difficultyLabel(d: Difficulty) {
  return d === "易" ? "简单" : d === "中" ? "中等" : "困难";
}

export function AiAppendConfirmDialog({
  open,
  context,
  onClose,
  onConfirm,
}: AiAppendConfirmDialogProps) {
  if (!context) return null;

  const appendCount = Math.min(context.gapCount, AI_APPEND_BATCH_SIZE);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI 补题
          </DialogTitle>
          <DialogDescription>当前将基于以下信息生成题目</DialogDescription>
        </DialogHeader>

        <ul className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-[12.5px]">
          <li><span className="text-muted-foreground">试卷名称：</span>{context.name}</li>
          <li><span className="text-muted-foreground">考试目标：</span>{context.goal}</li>
          <li><span className="text-muted-foreground">适用专业：</span>{context.specialty}</li>
          <li><span className="text-muted-foreground">分类：</span>{context.category}</li>
          <li><span className="text-muted-foreground">难度：</span>{difficultyLabel(context.difficulty)}</li>
          <li><span className="text-muted-foreground">题型：</span>{context.questionType}</li>
          <li>
            <span className="text-muted-foreground">当前缺口：</span>
            还需补 {appendCount} 题
          </li>
        </ul>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Sparkles className="h-3.5 w-3.5" /> 生成补题
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
