import { useState } from "react";
import { KbButton, KbDrawer, KbDrawerField, KbFilterSelect } from "@/components/knowledge/ui";
import {
  CURRENT_KNOWLEDGE_USER,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_DEPARTMENTS,
} from "@/lib/knowledge/data";
import type { KnowledgeBase, KnowledgeCategory } from "@/lib/knowledge/types";

export function KnowledgeBaseFormDrawer({
  base,
  onClose,
  onSubmit,
}: {
  base?: KnowledgeBase;
  onClose: () => void;
  onSubmit: (base: KnowledgeBase) => void;
}) {
  const [name, setName] = useState(base?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    base?.categoryId ?? KNOWLEDGE_CATEGORIES[0]?.id ?? "",
  );
  const [departmentId, setDepartmentId] = useState(
    base?.departmentId ?? CURRENT_KNOWLEDGE_USER.departmentId,
  );
  const [description, setDescription] = useState(base?.description ?? "");

  const submit = () => {
    const category = KNOWLEDGE_CATEGORIES.find((item) => item.id === categoryId);
    const department = KNOWLEDGE_DEPARTMENTS.find((item) => item.id === departmentId);
    onSubmit({
      id: base?.id ?? `kb-${Date.now()}`,
      name: name.trim() || "未命名知识库",
      description,
      scope: "department",
      categoryId,
      categoryPath: category ? [category.name] : undefined,
      departmentId,
      departmentName: department?.name,
      fileCount: base?.fileCount ?? 0,
      status: base?.status ?? "enabled",
      permission: base?.permission ?? {
        canView: true,
        canUpload: true,
        canManage: true,
        canConfigurePermission: true,
      },
      updatedAt: base?.updatedAt ?? "2026-07-08 10:00",
      ownerName: department?.name,
    });
  };

  return (
    <KbDrawer
      open
      title={base ? "编辑知识库" : "新建知识库"}
      onClose={onClose}
    >
      <KbDrawerField label="名称">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-9 w-full rounded-[8px] border border-kb-border bg-card px-3 text-[13px] text-kb-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </KbDrawerField>
      <KbDrawerField label="所属分类">
        <KbFilterSelect
          value={categoryId}
          onChange={setCategoryId}
          options={KNOWLEDGE_CATEGORIES.map((category) => ({
            value: category.id,
            label: getCategoryPathLabel(category),
          }))}
        />
      </KbDrawerField>
      <KbDrawerField label="所属部门">
        <KbFilterSelect
          value={departmentId}
          onChange={setDepartmentId}
          options={KNOWLEDGE_DEPARTMENTS.map((department) => ({
            value: department.id,
            label: department.name,
          }))}
        />
      </KbDrawerField>
      <KbDrawerField label="简介">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[92px] w-full resize-none rounded-[8px] border border-kb-border bg-card px-3 py-2 text-[13px] text-kb-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
      </KbDrawerField>
      <div className="mt-6 flex justify-end gap-2">
        <KbButton variant="outline" onClick={onClose}>
          取消
        </KbButton>
        <KbButton onClick={submit}>保存</KbButton>
      </div>
    </KbDrawer>
  );
}

function getCategoryPathLabel(category: KnowledgeCategory) {
  if (!category.parentId) return category.name;
  const parent = KNOWLEDGE_CATEGORIES.find((item) => item.id === category.parentId);
  return parent ? `${parent.name} / ${category.name}` : category.name;
}
