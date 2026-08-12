import {
  FILE_CONFIRMS,
  FILE_MOVE_APPROVALS,
  KNOWLEDGE_BASES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_FILES,
  PERSONAL_DIRECTORIES,
  UPLOAD_APPROVALS,
  UPLOAD_RECORDS,
} from "./data";
import type {
  FileMoveApproval,
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
  uploadType: item.uploadType ?? "direct",
  contentConfirmStatus:
    item.contentConfirmStatus ?? (item.status === "approved" ? "confirmed" : "unconfirmed"),
  aiMetadata: item.aiMetadata?.map((field) => ({ ...field })),
  aiExercises: item.aiExercises?.map((exercise) => ({
    ...exercise,
    options: exercise.options.map((option) => ({ ...option })),
    correctAnswers: [...exercise.correctAnswers],
  })),
}));
let fileMoveApprovals: FileMoveApproval[] = FILE_MOVE_APPROVALS.map((item) => ({ ...item }));
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

function nowStamp() {
  return new Date().toISOString().replace("T", " ").slice(0, 16);
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

export function getStoreFileMoveApprovals() {
  return fileMoveApprovals;
}

export function getStoreUploadRecords() {
  return uploadRecords;
}

export function getStoreFileConfirms() {
  return fileConfirms;
}

export function updateStoreUploadApproval(id: string, patch: Partial<UploadApproval>) {
  uploadApprovals = uploadApprovals.map((item) => {
    if (item.id !== id) return item;
    const next = { ...item, ...patch };
    if (patch.status === "approved") {
      next.contentConfirmStatus = "confirmed";
    }
    return next;
  });

  const updated = uploadApprovals.find((item) => item.id === id);
  if (updated?.status === "approved" || updated?.status === "rejected") {
    const stamp = updated.reviewedAt ?? nowStamp();
    uploadRecords = uploadRecords.map((record) => {
      const matchedByFile = updated.fileId && record.fileId === updated.fileId;
      const matchedByName =
        record.fileName === updated.fileName &&
        record.targetKnowledgeBaseId === (updated.knowledgeBaseId ?? record.targetKnowledgeBaseId);
      if (!matchedByFile && !matchedByName) return record;
      return {
        ...record,
        status: updated.status === "approved" ? "published" : "rejected",
        updatedAt: stamp,
        reviewedAt: stamp,
        reviewerName: updated.reviewerName,
        reviewNote: updated.reviewNote,
        publishedAt: updated.status === "approved" ? stamp : record.publishedAt,
        publisherName: updated.status === "approved" ? updated.reviewerName : record.publisherName,
        rejectReason: updated.status === "rejected" ? updated.reviewNote : record.rejectReason,
      };
    });
    if (updated.fileId) {
      files = files.map((file) =>
        file.id === updated.fileId
          ? {
              ...file,
              status: updated.status === "approved" ? "published" : "rejected",
              summary: updated.summary ?? file.summary,
              aiKeywords: updated.aiKeywords ?? file.aiKeywords,
              updatedAt: stamp,
              canPreview: updated.status === "approved" ? true : file.canPreview,
            }
          : file,
      );
    }
  }

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
  const stamp = nowStamp();
  fileConfirms = fileConfirms.map((item) =>
    item.id === confirm.id
      ? {
          ...confirm,
          status: "approved" as const,
          reviewerName: "本人确认",
          reviewedAt: stamp,
          contentConfirmStatus: "confirmed" as const,
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

/**
 * 提交「移入公共/专业库」申请：文件保留原位置，进入审批台文件移动列表。
 */
export function submitStoreFileMove(file: KnowledgeFile, targetBase: KnowledgeBase) {
  const sourceBase = bases.find((base) => base.id === file.knowledgeBaseId);
  const stamp = nowStamp();
  const existing = fileMoveApprovals.find(
    (item) =>
      item.fileId === file.id &&
      item.targetKnowledgeBaseId === targetBase.id &&
      item.status === "pendingMove",
  );
  if (existing) return existing;

  const request: FileMoveApproval = {
    id: `move-${file.id}-${Date.now()}`,
    fileId: file.id,
    fileName: file.name,
    sourceKnowledgeBaseId: file.knowledgeBaseId,
    sourceKnowledgeBaseName: sourceBase?.name ?? file.knowledgeBaseName ?? "原知识库",
    targetKnowledgeBaseId: targetBase.id,
    targetKnowledgeBaseName: targetBase.name,
    submitterName: file.uploaderName ?? "当前用户",
    submittedAt: stamp,
    fileSize: file.size,
    status: "pendingMove",
  };
  fileMoveApprovals = [request, ...fileMoveApprovals];
  emit();
  return request;
}

/**
 * 批准移入：文件进入目标库并触发重解析；解析完成后进入文件入库审批。
 * 申请从移动列表移除。
 */
export function approveStoreFileMove(id: string) {
  const item = fileMoveApprovals.find((entry) => entry.id === id);
  if (!item || item.status !== "pendingMove") return;

  fileMoveApprovals = fileMoveApprovals.filter((entry) => entry.id !== id);

  files = files.map((file) =>
    file.id === item.fileId
      ? {
          ...file,
          knowledgeBaseId: item.targetKnowledgeBaseId,
          knowledgeBaseName: item.targetKnowledgeBaseName,
          status: "parsing",
          parseStatus: "parsing",
          docParseStatus: "parsing",
          aiParseStatus: "parsing",
          updatedAt: nowStamp(),
        }
      : file,
  );
  emit();

  window.setTimeout(() => {
    const stamp = nowStamp();
    const file = files.find((entry) => entry.id === item.fileId);
    files = files.map((entry) =>
      entry.id === item.fileId
        ? {
            ...entry,
            status: "pendingApproval",
            parseStatus: "success",
            docParseStatus: "success",
            aiParseStatus: "success",
            updatedAt: stamp,
          }
        : entry,
    );

    const approval: UploadApproval = {
      id: `approval-move-${item.fileId}-${Date.now()}`,
      fileId: item.fileId,
      fileName: item.fileName,
      knowledgeBaseId: item.targetKnowledgeBaseId,
      knowledgeBaseName: item.targetKnowledgeBaseName,
      submitterName: item.submitterName,
      submittedAt: stamp,
      fileSize: item.fileSize ?? file?.size,
      uploadNote: `自「${item.sourceKnowledgeBaseName}」移入，已批准移入并完成重解析`,
      status: "pendingApproval",
      parseStatus: "success",
      uploadType: "move",
      contentConfirmStatus: "unconfirmed",
      summary: file?.summary ?? `${item.fileName}（个人库移入后重解析）`,
      aiKeywords: file?.aiKeywords ?? ["个人库移入", "待内容确认"],
      aiMetadata: [
        { id: "meta-move-source", label: "来源", value: "个人库移入" },
        { id: "meta-move-from", label: "原知识库", value: item.sourceKnowledgeBaseName },
      ],
      aiQuestions: ["移入后请核对该文件的 AI 解析内容是否准确？"],
      aiAnswers: ["请在审批工作台核对摘要、关键词与题目后确认入库。"],
      aiExercises: [],
    };
    uploadApprovals = [approval, ...uploadApprovals];

    const hasRecord = uploadRecords.some((record) => record.fileId === item.fileId);
    if (!hasRecord) {
      uploadRecords = [
        {
          id: `upload-move-${item.fileId}`,
          fileId: item.fileId,
          fileName: item.fileName,
          targetKnowledgeBaseId: item.targetKnowledgeBaseId,
          targetKnowledgeBaseName: item.targetKnowledgeBaseName,
          submittedAt: stamp,
          updatedAt: stamp,
          status: "pendingApproval",
          parseStatus: "success",
          docParseStatus: "success",
          aiParseStatus: "success",
        },
        ...uploadRecords,
      ];
    } else {
      uploadRecords = uploadRecords.map((record) =>
        record.fileId === item.fileId
          ? {
              ...record,
              targetKnowledgeBaseId: item.targetKnowledgeBaseId,
              targetKnowledgeBaseName: item.targetKnowledgeBaseName,
              status: "pendingApproval",
              parseStatus: "success",
              updatedAt: stamp,
            }
          : record,
      );
    }
    emit();
  }, 1200);
}

/** 驳回移入：文件保留原位置，申请从移动列表移除 */
export function rejectStoreFileMove(id: string, reason: string) {
  const item = fileMoveApprovals.find((entry) => entry.id === id);
  if (!item || item.status !== "pendingMove") return;
  fileMoveApprovals = fileMoveApprovals.filter((entry) => entry.id !== id);
  emit();
  return { ...item, status: "rejected" as const, rejectReason: reason };
}

/**
 * 撤回审核：撤回申请并删除文件及相关上传/审批记录。
 */
export function withdrawStoreUpload(recordId: string) {
  const record = uploadRecords.find((item) => item.id === recordId);
  if (!record) return false;

  uploadRecords = uploadRecords.filter((item) => item.id !== recordId);
  uploadApprovals = uploadApprovals.filter(
    (item) =>
      !(
        (record.fileId && item.fileId === record.fileId) ||
        (item.fileName === record.fileName &&
          item.knowledgeBaseId === record.targetKnowledgeBaseId &&
          (item.status ?? "pendingApproval") === "pendingApproval")
      ),
  );
  fileConfirms = fileConfirms.filter(
    (item) =>
      !(
        item.fileName === record.fileName &&
        item.knowledgeBaseId === record.targetKnowledgeBaseId
      ),
  );
  files = files.filter((item) => item.id !== record.fileId);
  emit();
  return true;
}

export function removeStoreUploadRecord(recordId: string) {
  const record = uploadRecords.find((item) => item.id === recordId);
  uploadRecords = uploadRecords.filter((item) => item.id !== recordId);
  if (record) {
    uploadApprovals = uploadApprovals.filter(
      (item) =>
        !(
          (record.fileId && item.fileId === record.fileId) ||
          (item.fileName === record.fileName &&
            item.knowledgeBaseId === record.targetKnowledgeBaseId)
        ),
    );
    files = files.filter((item) => item.id !== record.fileId);
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
