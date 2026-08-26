import {
  FILE_CONFIRMS,
  FILE_MOVE_APPROVALS,
  KNOWLEDGE_BASES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_FILES,
  PERMISSION_REQUESTS,
  PERSONAL_DIRECTORIES,
  UPLOAD_APPROVALS,
  UPLOAD_RECORDS,
} from "./data";
import type {
  FileMoveApproval,
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  PermissionRequest,
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
let permissionRequests: PermissionRequest[] = PERMISSION_REQUESTS.map((item) => ({ ...item }));
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

export function getStorePermissionRequests() {
  return permissionRequests;
}

/** 提交权限申请：写入 store，返回新建记录 */
export function submitStorePermissionRequest(
  request: Omit<PermissionRequest, "id" | "status" | "notifyStatus">,
): PermissionRequest {
  const newRequest: PermissionRequest = {
    ...request,
    id: `perm-${Date.now()}`,
    status: "pendingApproval",
    notifyStatus: "waiting",
  };
  permissionRequests = [newRequest, ...permissionRequests];
  emit();
  return newRequest;
}

/** 管理员审批通过权限申请 */
export function approveStorePermissionRequest(id: string) {
  permissionRequests = permissionRequests.map((item) =>
    item.id === id
      ? { ...item, status: "approved", reviewedAt: nowStamp(), notifyStatus: "sent" }
      : item,
  );
  emit();
}

/** 管理员驳回权限申请 */
export function rejectStorePermissionRequest(id: string, reason: string) {
  permissionRequests = permissionRequests.map((item) =>
    item.id === id
      ? {
          ...item,
          status: "rejected",
          rejectReason: reason,
          reviewedAt: nowStamp(),
          notifyStatus: "sent",
        }
      : item,
  );
  emit();
}

/**
 * 保存个人库文件解析结果的编辑内容（元数据/摘要/关键词/文件名）。
 * 不改变文件 status，随时可调用。
 */
export function saveStoreFileEditedContent(
  fileId: string,
  patch: {
    name?: string;
    summary?: string;
    aiKeywords?: string[];
    metadata?: Record<string, string | string[]>;
  },
) {
  files = files.map((item) => (item.id === fileId ? { ...item, ...patch, updatedAt: nowStamp() } : item));
  emit();
}

/**
 * 个人库上传：立即创建文件记录（uploading 态）并触发解析状态流转。
 * 解析完成后文件直接置为 published，无需二次确认。
 */
export function createStorePersonalFile(opts: {
  fileName: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  fileSize?: string;
}): KnowledgeFile {
  const stamp = nowStamp();
  const fileId = `file-upload-${Date.now()}`;
  const recordId = `upload-personal-${Date.now()}`;

  const newFile: KnowledgeFile = {
    id: fileId,
    name: opts.fileName,
    knowledgeBaseId: opts.knowledgeBaseId,
    knowledgeBaseName: opts.knowledgeBaseName,
    status: "uploading",
    parseStatus: "waiting",
    size: opts.fileSize,
    uploaderName: "当前用户",
    uploaderId: "u-current",
    createdAt: stamp,
    updatedAt: stamp,
    canPreview: false,
    canDownload: true,
    canEdit: true,
  };
  files = [newFile, ...files];

  const newRecord: UploadRecord = {
    id: recordId,
    fileId,
    fileName: opts.fileName,
    targetKnowledgeBaseId: opts.knowledgeBaseId,
    targetKnowledgeBaseName: opts.knowledgeBaseName,
    submittedAt: stamp,
    updatedAt: stamp,
    status: "uploading",
    parseStatus: "waiting",
  };
  uploadRecords = [newRecord, ...uploadRecords];
  emit();

  // 模拟上传完成 → 解析中
  window.setTimeout(() => {
    const s = nowStamp();
    files = files.map((f) =>
      f.id === fileId ? { ...f, status: "parsing", parseStatus: "parsing", updatedAt: s } : f,
    );
    uploadRecords = uploadRecords.map((r) =>
      r.id === recordId ? { ...r, status: "parsing", parseStatus: "parsing", updatedAt: s } : r,
    );
    emit();

    // 模拟解析完成 → 直接 published
    window.setTimeout(() => {
      const s2 = nowStamp();
      files = files.map((f) =>
        f.id === fileId
          ? {
              ...f,
              status: "published",
              parseStatus: "success",
              docParseStatus: "success",
              aiParseStatus: "success",
              canPreview: true,
              summary: `${opts.fileName}的 AI 摘要（自动生成）`,
              aiKeywords: ["运行", "规程", "自动解析"],
              updatedAt: s2,
            }
          : f,
      );
      uploadRecords = uploadRecords.map((r) =>
        r.id === recordId
          ? {
              ...r,
              status: "published",
              parseStatus: "success",
              docParseStatus: "success",
              aiParseStatus: "success",
              updatedAt: s2,
              publishedAt: s2,
              publisherName: "系统自动发布",
            }
          : r,
      );
      emit();
    }, 3000);
  }, 1500);

  return newFile;
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
    // 移动类型审批通过：将文件切到目标库（finalizeStoreFileMove 处理）
    if (updated.status === "approved" && updated.uploadType === "move" && updated.fileId) {
      files = files.map((f) =>
        f.id === updated.fileId
          ? {
              ...f,
              knowledgeBaseId: updated.knowledgeBaseId ?? f.knowledgeBaseId,
              knowledgeBaseName: updated.knowledgeBaseName ?? f.knowledgeBaseName,
              status: "published" as const,
              updatedAt: nowStamp(),
            }
          : f,
      );
    }
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

export function retryStoreUploadParse(recordId: string) {
  const record = uploadRecords.find((item) => item.id === recordId);
  if (!record) return false;
  uploadRecords = uploadRecords.map((item) =>
    item.id === recordId
      ? {
          ...item,
          status: "parsing",
          parseStatus: "parsing",
          parseProgress: 8,
          parseError: undefined,
          parseStartedAt: nowStamp(),
          parseUpdatedAt: nowStamp(),
        }
      : item,
  );
  if (record.fileId) {
    files = files.map((item) =>
      item.id === record.fileId
        ? {
            ...item,
            status: "parsing",
            parseStatus: "parsing",
            parseError: undefined,
          }
        : item,
    );
  }
  emit();
  return true;
}

export const PAUSED_PARSE_ERROR = "已暂停解析";

export function pauseStoreUploadParse(recordId: string) {
  const record = uploadRecords.find((item) => item.id === recordId);
  if (!record) return false;
  uploadRecords = uploadRecords.map((item) =>
    item.id === recordId
      ? {
          ...item,
          status: "parsing",
          parseStatus: "waiting" as const,
          parseProgress: item.parseProgress ?? 0,
          parseError: PAUSED_PARSE_ERROR,
          parseUpdatedAt: nowStamp(),
        }
      : item,
  );
  if (record.fileId) {
    files = files.map((item) =>
      item.id === record.fileId
        ? {
            ...item,
            status: "parsing",
            parseStatus: "waiting" as const,
            parseError: PAUSED_PARSE_ERROR,
          }
        : item,
    );
  }
  emit();
  return true;
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
 * 提交「移动文件到公共/专业库」申请（单次审批，直接进入重解析队列）。
 * keepSource=true 时复制效果（源文件保留），false 时移动（通过后源文件移除）。
 */
export function submitStoreFileMove(
  file: KnowledgeFile,
  targetBase: KnowledgeBase,
  keepSource = false,
) {
  const sourceBase = bases.find((base) => base.id === file.knowledgeBaseId);
  const stamp = nowStamp();
  const uploadType: import("./types").UploadSourceType = keepSource ? "copy" : "move";
  const sourceNote = `自「${sourceBase?.name ?? file.knowledgeBaseName ?? "原知识库"}」${keepSource ? "复制" : "移动"}入`;

  // 立即在目标库创建一个解析中的副本文件
  const newFileId = keepSource ? `file-copy-${file.id}-${Date.now()}` : file.id;
  if (keepSource) {
    const copyFile: KnowledgeFile = {
      ...file,
      id: newFileId,
      knowledgeBaseId: targetBase.id,
      knowledgeBaseName: targetBase.name,
      status: "parsing",
      parseStatus: "parsing",
      docParseStatus: "parsing",
      aiParseStatus: "parsing",
      updatedAt: stamp,
      canPreview: false,
    };
    files = [copyFile, ...files];
  } else {
    // 移动：源文件改为解析中状态（暂留原库位置，审批通过后再切库）
    files = files.map((f) =>
      f.id === file.id
        ? {
            ...f,
            status: "parsing" as const,
            parseStatus: "parsing" as const,
            docParseStatus: "parsing" as const,
            aiParseStatus: "parsing" as const,
            updatedAt: stamp,
          }
        : f,
    );
  }
  emit();

  // 模拟重解析完成后进入文件入库审批台
  window.setTimeout(() => {
    const s = nowStamp();
    files = files.map((f) =>
      f.id === newFileId
        ? {
            ...f,
            status: "pendingApproval" as const,
            parseStatus: "success" as const,
            docParseStatus: "success" as const,
            aiParseStatus: "success" as const,
            updatedAt: s,
          }
        : f,
    );

    const approval: UploadApproval = {
      id: `approval-move-${newFileId}-${Date.now()}`,
      fileId: newFileId,
      fileName: file.name,
      knowledgeBaseId: targetBase.id,
      knowledgeBaseName: targetBase.name,
      submitterName: file.uploaderName ?? "当前用户",
      submittedAt: s,
      fileSize: file.size,
      uploadNote: sourceNote,
      status: "pendingApproval",
      parseStatus: "success",
      uploadType,
      contentConfirmStatus: "unconfirmed",
      summary: file.summary ?? `${file.name}（重解析后待审）`,
      aiKeywords: file.aiKeywords ?? ["移动入库", "待内容确认"],
      aiMetadata: [
        { id: "meta-move-type", label: "入库方式", value: keepSource ? "复制" : "移动" },
        {
          id: "meta-move-from",
          label: "来源库",
          value: sourceBase?.name ?? file.knowledgeBaseName ?? "原知识库",
        },
      ],
      aiExercises: [],
    };
    uploadApprovals = [approval, ...uploadApprovals];

    uploadRecords = [
      {
        id: `upload-move-${newFileId}`,
        fileId: newFileId,
        fileName: file.name,
        targetKnowledgeBaseId: targetBase.id,
        targetKnowledgeBaseName: targetBase.name,
        submittedAt: s,
        updatedAt: s,
        status: "pendingApproval",
        parseStatus: "success",
        docParseStatus: "success",
        aiParseStatus: "success",
      },
      ...uploadRecords,
    ];
    emit();
  }, 1200);
}

/** 审批台「文件入库」通过后，若来源是移动（非复制），将源文件从原库移除 */
export function finalizeStoreFileMove(approvalId: string) {
  const approval = uploadApprovals.find((a) => a.id === approvalId);
  if (!approval || approval.uploadType !== "move" || !approval.fileId) return;
  // 找原库文件（移动场景下 fileId 就是原文件 id，从 parsing/pendingApproval 状态切到目标库 published）
  files = files.map((f) =>
    f.id === approval.fileId
      ? {
          ...f,
          knowledgeBaseId: approval.knowledgeBaseId ?? f.knowledgeBaseId,
          knowledgeBaseName: approval.knowledgeBaseName ?? f.knowledgeBaseName,
          status: "published" as const,
          updatedAt: nowStamp(),
        }
      : f,
  );
  emit();
}

/** @deprecated 旧版两步审批已废弃，保留以防其他地方引用报错 */
export function approveStoreFileMove(_id: string) {
  /* no-op */
}

/** @deprecated 旧版两步审批已废弃 */
export function rejectStoreFileMove(_id: string, _reason: string) {
  /* no-op */
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
