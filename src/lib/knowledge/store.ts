import {
  FILE_CONFIRMS,
  FILE_MOVE_APPROVALS,
  KNOWLEDGE_BASES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_FILES,
  KNOWLEDGE_INTERNAL_DIRECTORIES,
  PERMISSION_REQUESTS,
  PERSONAL_DIRECTORIES,
  UPLOAD_APPROVALS,
  UPLOAD_RECORDS,
} from "./data";
import { getCurrentKnowledgeUser } from "./demoRole";
import { fileHasSimilarCandidates } from "./similarFiles";
import type {
  FileMoveApproval,
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  KnowledgeFileType,
  KnowledgeInternalDirectory,
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

function seedFileDirectory(file: KnowledgeFile) {
  if (file.directoryId) return file.directoryId;
  if (file.knowledgeBaseId === "kb-grid-operation") {
    if (/应急|异常|故障|处置/.test(file.name)) return "dir-grid-emergency";
    if (/事故|复盘|案例/.test(file.name)) return "dir-grid-cases";
    if (/培训|教材|学习/.test(file.name)) return "dir-grid-training";
    if (/操作票|操作规程/.test(file.name)) return "dir-grid-rules-operation";
    if (/调度|运行规程|管理规定|制度/.test(file.name)) return "dir-grid-rules-manage";
  }
  if (file.knowledgeBaseId === "kb-agc") {
    return /案例|通报|结果/.test(file.name) ? "dir-agc-cases" : "dir-agc-rules";
  }
  if (file.knowledgeBaseId === "kb-personal-work") {
    return /异常|复盘/.test(file.name) ? "dir-personal-review" : "dir-personal-notes";
  }
  return undefined;
}

let files: KnowledgeFile[] = KNOWLEDGE_FILES.map((item) => ({
  ...item,
  enabled: item.enabled ?? true,
  directoryId: seedFileDirectory(item),
}));
let internalDirectories: KnowledgeInternalDirectory[] = KNOWLEDGE_INTERNAL_DIRECTORIES.map(
  (item) => ({
    ...item,
  }),
);
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
const fileMoveApprovals: FileMoveApproval[] = FILE_MOVE_APPROVALS.map((item) => ({ ...item }));
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

function fileTypeFromName(name: string): KnowledgeFileType {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "xls" || ext === "xlsx") return "xlsx";
  if (ext === "ppt" || ext === "pptx") return "pptx";
  if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif" || ext === "webp") {
    return "image";
  }
  return "other";
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

export function getStoreInternalDirectories() {
  return internalDirectories;
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
  files = files.map((item) =>
    item.id === fileId ? { ...item, ...patch, updatedAt: nowStamp() } : item,
  );
  emit();
}

type LibraryUploadOpts = {
  fileName: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  fileSize?: string;
  directoryId?: string;
  idNonce?: number;
};

/**
 * 个人库上传：立即创建文件记录（uploading 态）并触发解析状态流转。
 * 解析完成后文件直接置为 published，无需二次确认。
 */
export function createStorePersonalFile(opts: LibraryUploadOpts): KnowledgeFile {
  return createLibraryUpload(opts, "personal");
}

/**
 * 专业库/公共库上传：解析完成后进入审批台，由管理员审核。
 * 相似资料识别不在上传时打断，审核侧根据文件名给出入口。
 */
export function createStoreProfessionalUpload(opts: LibraryUploadOpts): KnowledgeFile {
  return createLibraryUpload(opts, "professional");
}

export function createStoreLibraryUpload(
  opts: LibraryUploadOpts & { personal?: boolean },
): KnowledgeFile {
  return createLibraryUpload(opts, opts.personal ? "personal" : "professional");
}

function createLibraryUpload(opts: LibraryUploadOpts, kind: "personal" | "professional") {
  const stamp = nowStamp();
  const user = getCurrentKnowledgeUser();
  const nonce = opts.idNonce != null ? `-${opts.idNonce}` : "";
  const fileId = `file-upload-${Date.now()}${nonce}`;
  const recordId = `upload-${kind}-${Date.now()}${nonce}`;

  const newFile: KnowledgeFile = {
    id: fileId,
    name: opts.fileName,
    type: fileTypeFromName(opts.fileName),
    knowledgeBaseId: opts.knowledgeBaseId,
    knowledgeBaseName: opts.knowledgeBaseName,
    directoryId: opts.directoryId,
    status: "uploading",
    parseStatus: "waiting",
    size: opts.fileSize,
    uploaderName: user.name,
    uploaderId: user.id,
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

  window.setTimeout(() => {
    const s = nowStamp();
    files = files.map((f) =>
      f.id === fileId ? { ...f, status: "parsing", parseStatus: "parsing", updatedAt: s } : f,
    );
    uploadRecords = uploadRecords.map((r) =>
      r.id === recordId ? { ...r, status: "parsing", parseStatus: "parsing", updatedAt: s } : r,
    );
    emit();

    window.setTimeout(() => {
      const s2 = nowStamp();
      if (kind === "personal") {
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
        return;
      }

      const similar = fileHasSimilarCandidates(opts.fileName);
      files = files.map((f) =>
        f.id === fileId
          ? {
              ...f,
              status: "pendingApproval",
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
              status: "pendingApproval",
              parseStatus: "success",
              docParseStatus: "success",
              aiParseStatus: "success",
              updatedAt: s2,
              reviewNote: similar
                ? "解析已完成，发现相似资料，等待管理员审核"
                : "解析已完成，等待管理员审核",
            }
          : r,
      );
      const approval: UploadApproval = {
        id: `approval-upload-${fileId}`,
        fileId,
        fileName: opts.fileName,
        knowledgeBaseId: opts.knowledgeBaseId,
        knowledgeBaseName: opts.knowledgeBaseName,
        submitterName: user.name,
        submittedAt: stamp,
        fileSize: opts.fileSize,
        uploadNote: "文件直传",
        riskHint: similar ? "发现相似资料，建议比对后决定是否作为新版本或覆盖。" : undefined,
        status: "pendingApproval",
        parseStatus: "success",
        uploadType: "direct",
        contentConfirmStatus: "unconfirmed",
        summary: `${opts.fileName}的 AI 摘要（自动生成）`,
        aiKeywords: ["运行", "规程", "自动解析"],
      };
      uploadApprovals = [approval, ...uploadApprovals];
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
  targetDirectoryId?: string,
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
      directoryId: targetDirectoryId,
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
            directoryId: targetDirectoryId,
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
      !(item.fileName === record.fileName && item.knowledgeBaseId === record.targetKnowledgeBaseId),
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

export function addStoreInternalDirectory(directory: KnowledgeInternalDirectory) {
  internalDirectories = [...internalDirectories, directory];
  emit();
  return directory;
}

export function updateStoreInternalDirectory(
  id: string,
  patch: Partial<Pick<KnowledgeInternalDirectory, "name" | "parentId">>,
) {
  internalDirectories = internalDirectories.map((item) =>
    item.id === id ? { ...item, ...patch } : item,
  );
  emit();
}

/** 删除库内目录及子目录，目录中的文件回到知识库根目录。 */
export function removeStoreInternalDirectoryCascade(id: string) {
  const removedIds = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const directory of internalDirectories) {
      if (
        directory.parentId &&
        removedIds.has(directory.parentId) &&
        !removedIds.has(directory.id)
      ) {
        removedIds.add(directory.id);
        changed = true;
      }
    }
  }
  internalDirectories = internalDirectories.filter((item) => !removedIds.has(item.id));
  files = files.map((file) =>
    file.directoryId && removedIds.has(file.directoryId)
      ? { ...file, directoryId: undefined }
      : file,
  );
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
  internalDirectories = internalDirectories.filter((directory) => directory.knowledgeBaseId !== id);
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
