import type { DiffItem, DiffMatchState } from "./types";

/**
 * 前端演示用章节匹配层。真实接口接入后可直接用服务端匹配结果替换，
 * 不改变现有差异与正文数据结构。
 */
const MATCH_OVERRIDES: Record<string, DiffMatchState> = {
  d03: {
    kind: "semantic",
    baseLabel: "运行监视记录",
    targetLabel: "涉网运行监视记录",
  },
  d07: {
    kind: "auto",
    baseLabel: "3.2 运行监视",
    targetLabel: "3.2 运行监视",
  },
  d11: {
    kind: "semantic",
    baseLabel: "异常处置责任",
    targetLabel: "异常处置组织责任",
  },
  d26: {
    kind: "unmatched",
    baseLabel: "6.3.4 纸质运行台账",
  },
  d27: {
    kind: "semantic",
    baseLabel: "附录 A",
    targetLabel: "附录索引前置内容",
  },
};

export function getDiffMatchState(diff: DiffItem): DiffMatchState {
  return (
    MATCH_OVERRIDES[diff.id] ?? {
      kind: "auto",
      baseLabel: diff.clause,
      targetLabel: diff.clause,
    }
  );
}
