import { DOCS, type Doc, type DocType } from "@/lib/mock/data";
import type { KnowledgeFile, KnowledgeFileType } from "@/lib/knowledge/types";

const LEARNING_MATERIAL_FILE_PREFIX = "learning-material-";
const LEARNING_MATERIAL_BASE_ID = "kb-grid-operation";

const fileTypeByDocType: Record<DocType, KnowledgeFileType> = {
  规程标准: "pdf",
  典型操作: "docx",
  故障处置: "pdf",
  厂站资料: "docx",
  历史案例: "pptx",
  厂家SOP: "docx",
  "两细则/考核": "pdf",
};

const extensionByFileType: Record<KnowledgeFileType, string> = {
  pdf: "pdf",
  docx: "docx",
  xlsx: "xlsx",
  pptx: "pptx",
  image: "png",
  other: "dat",
};

function buildLearningMaterialFile(doc: Doc): KnowledgeFile {
  const type = fileTypeByDocType[doc.docType];
  const contentLength = doc.body.reduce((total, section) => total + section.text.length, 0);

  return {
    id: `${LEARNING_MATERIAL_FILE_PREFIX}${doc.id}`,
    name: `${doc.title}.${extensionByFileType[type]}`,
    type,
    knowledgeBaseId: LEARNING_MATERIAL_BASE_ID,
    knowledgeBaseName: "知识资料",
    categoryPath: ["知识学习", doc.docType],
    professionalType: doc.equipment,
    tags: doc.highlight,
    metadata: {
      docType: doc.docType,
      source: doc.source,
      equipment: doc.equipment,
      year: String(doc.year),
    },
    version: "v1",
    isCurrentVersion: true,
    status: "published",
    parseStatus: "success",
    uploaderName: doc.source,
    updatedAt: `${doc.updatedAt} 09:00`,
    createdAt: `${doc.updatedAt} 09:00`,
    size: `${Math.max(128, Math.ceil(contentLength / 2.4))}KB`,
    summary: doc.snippet,
    canPreview: true,
    canDownload: true,
    canEdit: false,
    fullTextContent: doc.body.map((section) => `${section.title}\n${section.text}`).join("\n"),
  };
}

const learningMaterialEntries = DOCS.map((doc) => ({ doc, file: buildLearningMaterialFile(doc) }));
const learningMaterialFiles = learningMaterialEntries.map(({ file }) => file);
const fileById = new Map(learningMaterialEntries.map(({ file }) => [file.id, file]));
const fileByDocId = new Map(learningMaterialEntries.map(({ doc, file }) => [doc.id, file]));
const docByFileId = new Map(learningMaterialEntries.map(({ doc, file }) => [file.id, doc]));

export function getLearningMaterialFiles() {
  return learningMaterialFiles;
}

export function getLearningMaterialFileById(fileId: string) {
  return fileById.get(fileId);
}

export function getLearningMaterialFileByDocId(docId: string) {
  return fileByDocId.get(docId);
}

export function getLearningMaterialDocByFileId(fileId: string) {
  return docByFileId.get(fileId);
}
