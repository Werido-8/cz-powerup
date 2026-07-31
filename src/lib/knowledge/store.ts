import {
  FILE_CONFIRMS,
  KNOWLEDGE_BASES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_FILES,
  PERSONAL_DIRECTORIES,
  UPLOAD_APPROVALS,
  UPLOAD_RECORDS,
} from "./data";
import type {
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  PersonalDirectory,
  UploadApproval,
  UploadRecord,
} from "./types";

/** 公共知识库根目录（表单选择器用，写入时 parentId 为空） */
export const PROFESSIONAL_CATEGORY_ROOT_ID = "__professional_category_root__";

let categories: KnowledgeCategory[] = KNOWLEDGE_CATEGORIES.map((item) => ({ ...item }));
let personalDirectories: PersonalDirectory[] = PERSONAL_DIRECTORIES.map((item) => ({ ...item }));
let bases: KnowledgeBase[] = KNOWLEDGE_BASES.map((item) => ({ ...item }));
let files: KnowledgeFile[] = KNOWLEDGE_FILES.map((item) => ({
  ...item,
  enabled: item.enabled ?? true,
}));
let uploadRecords: UploadRecord[] = UPLOAD_RECORDS.map((item) => ({ ...item }));
let uploadApprovals: UploadApproval[] = UPLOAD_APPROVALS.map((item) => ({
  ...item,
  aiMetadata: item.aiMetadata?.map((field) => ({ ...field })),
  aiExercises: item.aiExercises?.map((exercise) => ({
    ...exercise,
    options: exercise.options.map((option) => ({ ...option })),
    correctAnswers: [...exercise.correctAnswers],
  })),
}));
let fileConfirms: UploadApproval[] = FILE_CONFIRMS.map((item) => ({
  ...item,
  aiMetadata: item.aiMetadata?.map((field) => ({ ...field })),
  aiExercises: item.aiExercises?.map((exercise) => ({
    ...exercise,
    options: exercise.options.map((option) => ({ ...option })),
    correctAnswers: [...exercise.correctAnswers],
  })),
}));
let version = 0;

const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeKnowledgeStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getKnowledgeStoreVersion() {
  return version;
}

export function getKnowledgeStoreServerSnapshot() {
  return 0;
}

export function getStoreCategories() {
  return categories;
}

export function getStorePersonalDirectories() {
  return personalDirectories;
}

export function getStoreBases() {
  return bases;
}

export function getStoreFiles() {
  return files;
}

export function getStoreUploadApprovals() {
  return uploadApprovals;
}

export function getStoreUploadRecords() {
  return uploadRecords;
}

export function getStoreFileConfirms() {
  return fileConfirms;
}

export function updateStoreUploadApproval(id: string, patch: Partial<UploadApproval>) {
  uploadApprovals = uploadApprovals.map((item) => (item.id === id ? { ...item, ...patch } : item));
  emit();
}

export function updateStoreUploadRecord(id: string, patch: Partial<UploadRecord>) {
  uploadRecords = uploadRecords.map((item) => (item.id === id ? { ...item, ...patch } : item));
  emit();
}

export function updateStoreFileConfirm(id: string, patch: Partial<UploadApproval>) {
  fileConfirms = fileConfirms.map((item) => (item.id === id ? { ...item, ...patch } : item));
  emit();
}

function publishPersonalConfirm(confirm: UploadApproval) {
  const stamp = new Date().toISOString().replace("T", " ").slice(0, 16);
  fileConfirms = fileConfirms.map((item) =>
    item.id === confirm.id
      ? {
          ...confirm,
          status: "approved" as const,
          reviewerName: "本人确认",
          reviewedAt: stamp,
        }
      : item,
  );
  uploadRecords = uploadRecords.map((item) =>
    item.fileName === confirm.fileName && item.targetKnowledgeBaseId === confirm.knowledgeBaseId
      ? {
          ...item,
          status: "published",
          parseStatus: "success",
          updatedAt: stamp,
          publishedAt: stamp,
          publisherName: "本人确认",
          reviewNote: "本人已确认 AI 解析内容并发布",
        }
      : item,
  );
  files = files.map((item) =>
    item.name === confirm.fileName &&
    item.knowledgeBaseId === (confirm.knowledgeBaseId ?? item.knowledgeBaseId)
      ? {
          ...item,
          status: "published",
          parseStatus: "success",
          summary: confirm.summary ?? item.summary,
          aiKeywords: confirm.aiKeywords ?? item.aiKeywords,
          updatedAt: stamp,
          canPreview: true,
        }
      : item,
  );
}

/** 确认单条个人库文件（编辑内容后发布） */
export function confirmStoreFile(id: string, patch?: Partial<UploadApproval>) {
  const current = fileConfirms.find((item) => item.id === id);
  if (!current) return;
  publishPersonalConfirm({ ...current, ...patch });
  emit();
}

/** 批量确认个人库文件 */
export function batchConfirmStoreFiles(ids: string[]) {
  const idSet = new Set(ids);
  for (const item of fileConfirms) {
    if (idSet.has(item.id)) publishPersonalConfirm(item);
  }
  emit();
}

export function updateStoreFile(fileId: string, patch: Partial<KnowledgeFile>) {
  files = files.map((item) => (item.id === fileId ? { ...item, ...patch } : item));
  emit();
}

export function removeStoreFiles(fileIds: string[]) {
  const idSet = new Set(fileIds);
  files = files.filter((item) => !idSet.has(item.id));
  emit();
}

export function addStoreCategory(category: KnowledgeCategory) {
  categories = [...categories, category];
  emit();
  return category;
}

export function updateStoreCategory(id: string, patch: Partial<KnowledgeCategory>) {
  categories = categories.map((item) => (item.id === id ? { ...item, ...patch } : item));
  emit();
}

export function removeStoreCategory(id: string) {
  categories = categories.filter((item) => item.id !== id);
  emit();
}

/** 删除目录及其所有子目录，同时移除这些目录下的知识库与文件 */
export function removeStoreCategoryCascade(id: string) {
  const removedIds = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of categories) {
      if (item.parentId && removedIds.has(item.parentId) && !removedIds.has(item.id)) {
        removedIds.add(item.id);
        changed = true;
      }
    }
  }

  const removedBaseIds = new Set(
    bases.filter((base) => base.categoryId && removedIds.has(base.categoryId)).map((b) => b.id),
  );

  categories = categories.filter((item) => !removedIds.has(item.id));
  bases = bases.filter((base) => !removedBaseIds.has(base.id));
  files = files.filter((file) => !removedBaseIds.has(file.knowledgeBaseId));
  emit();
}

export function addStoreBase(base: KnowledgeBase) {
  bases = [base, ...bases];
  emit();
  return base;
}

export function updateStoreBase(base: KnowledgeBase) {
  bases = bases.map((item) => (item.id === base.id ? base : item));
  emit();
  return base;
}

export function removeStoreBase(id: string) {
  bases = bases.filter((item) => item.id !== id);
  files = files.filter((file) => file.knowledgeBaseId !== id);
  emit();
}

export function updateStorePersonalDirectory(id: string, patch: Partial<PersonalDirectory>) {
  personalDirectories = personalDirectories.map((item) =>
    item.id === id ? { ...item, ...patch } : item,
  );
  emit();
}

export function removeStorePersonalDirectory(id: string) {
  personalDirectories = personalDirectories.filter((item) => item.id !== id);
  emit();
}
