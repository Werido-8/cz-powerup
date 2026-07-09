import { ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  KbButton,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
  KbStatusTag,
} from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES } from "@/lib/knowledge/data";
import { getCategoryChildren } from "@/lib/knowledge/model";
import type { KnowledgeCategory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { kbCardShell, kbRadius } from "@/lib/knowledge/tokens";

export function CategoryManagerSection() {
  return (
    <KbPageContent>
      <KbPageHeader
        label="仅知识库管理员可见"
        title="分类管理"
        description="分类用于组织公共和部门知识库，可嵌套维护。下属仍有知识库时禁止删除。"
        action={
          <KbButton onClick={() => toast.success("已预留新建根分类入口")}>
            <Plus className="h-4 w-4 stroke-[1.8]" />
            新建根分类
          </KbButton>
        }
      />
      <div className={cn(kbCardShell, kbRadius.md, "p-3")}>
        {getCategoryChildren().map((category) => (
          <CategoryNode key={category.id} category={category} level={0} />
        ))}
      </div>
    </KbPageContent>
  );
}

function CategoryNode({ category, level }: { category: KnowledgeCategory; level: number }) {
  const children = getCategoryChildren(category.id);
  const hasBases = KNOWLEDGE_BASES.some((base) => base.categoryId === category.id);
  return (
    <div>
      <div
        className="flex min-h-10 items-center gap-2 rounded-[8px] px-2 text-[12.5px] text-kb-body hover:bg-kb-surface-hover"
        style={{ paddingLeft: 8 + level * 18 }}
      >
        <ChevronRight
          className={cn("h-3.5 w-3.5 text-kb-muted", children.length > 0 && "rotate-90")}
        />
        <span className="flex-1 font-medium">{category.name}</span>
        {hasBases && (
          <KbStatusTag>
            {KNOWLEDGE_BASES.filter((base) => base.categoryId === category.id).length} 个库
          </KbStatusTag>
        )}
        <KbIconTextButton
          icon={Plus}
          label="子分类"
          onClick={() => toast.success("已预留新建子分类入口")}
        />
        <KbIconTextButton
          icon={Pencil}
          label="重命名"
          onClick={() => toast.success("已预留重命名入口")}
        />
        <KbIconTextButton
          icon={Trash2}
          label="删除"
          disabled={hasBases}
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm("确认删除该分类？")) {
              toast.success("分类已删除");
            }
          }}
        />
      </div>
      {children.map((child) => (
        <CategoryNode key={child.id} category={child} level={level + 1} />
      ))}
    </div>
  );
}
