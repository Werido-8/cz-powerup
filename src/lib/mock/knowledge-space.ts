// Knowledge space directory mock data — mirrors the reference UI layout.

export type KbSpaceKind = "public" | "dept" | "personal";

export type KbTreeNode = {
  id: string;
  name: string;
  kind?: KbSpaceKind;
  libraryName?: string;
  children?: KbTreeNode[];
};

export type KbFileStatus = "未开始" | "已禁用" | "进行中" | "已完成";

export type KbFile = {
  id: string;
  folderId: string;
  name: string;
  summary: string;
  scope: "公共" | "部门" | "个人";
  status: KbFileStatus;
  updatedAt: string;
  size: string;
};

export const KB_TREE: KbTreeNode[] = [
  {
    id: "space-public",
    name: "公共空间",
    kind: "public",
    children: [
      { id: "cat-regulations", name: "规章制度类" },
      {
        id: "cat-tech",
        name: "技术标准类",
        children: [
          {
            id: "folder-trade-spec",
            name: "电力交易业务技术规范",
            libraryName: "电力交易业务技术标准库",
          },
        ],
      },
      { id: "cat-experience", name: "经验成果类" },
      { id: "cat-basic", name: "基础信息类" },
    ],
  },
  {
    id: "space-dept",
    name: "部门空间",
    kind: "dept",
    children: [
      { id: "dept-run", name: "运行处资料" },
      { id: "dept-tech", name: "技术处资料" },
    ],
  },
  {
    id: "space-personal",
    name: "个人空间",
    kind: "personal",
    children: [{ id: "folder-personal", name: "个人工作资料" }],
  },
];

export const KB_FILES: KbFile[] = [
  {
    id: "kf1",
    folderId: "folder-trade-spec",
    name: "电力现货市场基本规则.pdf",
    summary: "暂无摘要描述信息...",
    scope: "公共",
    status: "未开始",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf2",
    folderId: "folder-trade-spec",
    name: "电力中长期交易基本规则.pdf",
    summary: "暂无摘要描述信息...",
    scope: "公共",
    status: "未开始",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf3",
    folderId: "folder-trade-spec",
    name: "电力中长期交易成分.pdf",
    summary: "暂无摘要描述信息...",
    scope: "公共",
    status: "已禁用",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf4",
    folderId: "folder-trade-spec",
    name: "电力辅助服务基本规则.pdf",
    summary: "暂无摘要描述信息...",
    scope: "公共",
    status: "未开始",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf5",
    folderId: "folder-trade-spec",
    name: "电力市场运营基本规则.pdf",
    summary: "暂无摘要描述信息...",
    scope: "公共",
    status: "未开始",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf6",
    folderId: "folder-trade-spec",
    name: "关于开展电网设备电气信息深度...",
    summary: "暂无摘要描述信息...",
    scope: "公共",
    status: "未开始",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf7",
    folderId: "folder-personal",
    name: "个人学习笔记汇总.docx",
    summary: "暂无摘要描述信息...",
    scope: "个人",
    status: "进行中",
    updatedAt: "2024-06-10 09:30:12",
    size: "856KB",
  },
  {
    id: "kf8",
    folderId: "cat-regulations",
    name: "并网发电厂运行规程汇编.pdf",
    summary: "暂无摘要描述信息...",
    scope: "公共",
    status: "未开始",
    updatedAt: "2024-03-15 14:22:00",
    size: "2.45MB",
  },
];

export const DEFAULT_KB_FOLDER_ID = "folder-trade-spec";

export function findKbNode(id: string, nodes: KbTreeNode[] = KB_TREE): KbTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const found = findKbNode(id, n.children);
      if (found) return found;
    }
  }
  return null;
}

export function getKbBreadcrumb(
  id: string,
  nodes: KbTreeNode[] = KB_TREE,
  trail: KbTreeNode[] = [],
): KbTreeNode[] | null {
  for (const n of nodes) {
    const next = [...trail, n];
    if (n.id === id) return next;
    if (n.children) {
      const found = getKbBreadcrumb(id, n.children, next);
      if (found) return found;
    }
  }
  return null;
}

export function getSpaceIdForNode(
  targetId: string,
  nodes: KbTreeNode[] = KB_TREE,
  currentSpaceId: string | null = null,
): string | null {
  for (const n of nodes) {
    const spaceId = n.kind ? n.id : currentSpaceId;
    if (n.id === targetId) return spaceId;
    if (n.children) {
      const found = getSpaceIdForNode(targetId, n.children, spaceId);
      if (found) return found;
    }
  }
  return null;
}

export function getFilesForFolder(folderId: string): KbFile[] {
  return KB_FILES.filter((f) => f.folderId === folderId);
}
