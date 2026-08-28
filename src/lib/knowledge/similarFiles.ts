/** 演示用：文件名命中这些词时，视为库内存在相似资料候选 */
const SIMILAR_NAME_PATTERN = /管理规定|运行规程|操作规程|制度|规范|标准|规程/;

export function fileHasSimilarCandidates(fileName: string) {
  return SIMILAR_NAME_PATTERN.test(fileName);
}
