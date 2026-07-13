import { CURRENT_KNOWLEDGE_USER } from "./data";
import type { KnowledgePermissionGroup } from "./types";

/**
 * 递进权限级别：管理 > 上传 > 浏览。
 * 每个角色 / 成员只持有一个最高级别，最终生效权限取角色与个人授权中的较高者。
 */
export type PermissionLevel = KnowledgePermissionGroup;

export const PERMISSION_LEVELS: PermissionLevel[] = ["view", "upload", "manage"];

const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  view: "浏览",
  upload: "上传",
  manage: "管理",
};

const PERMISSION_LEVEL_RANK: Record<PermissionLevel, number> = {
  view: 1,
  upload: 2,
  manage: 3,
};

export function permissionLevelLabel(level: PermissionLevel) {
  return PERMISSION_LEVEL_LABELS[level];
}

export function permissionLevelRank(level: PermissionLevel) {
  return PERMISSION_LEVEL_RANK[level];
}

export const PERMISSION_LEVEL_OPTIONS = PERMISSION_LEVELS.map((level) => ({
  value: level,
  label: permissionLevelLabel(level),
}));

/** 取较高级别；任一为空时返回另一个 */
export function maxPermissionLevel(
  a: PermissionLevel | null | undefined,
  b: PermissionLevel | null | undefined,
): PermissionLevel | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return PERMISSION_LEVEL_RANK[a] >= PERMISSION_LEVEL_RANK[b] ? a : b;
}

/** 系统角色（用于「添加角色」选择） */
export interface SystemRole {
  id: string;
  name: string;
  /** 适用范围 / 所属部门 */
  scopeLabel: string;
  memberCount: number;
}

/** 系统成员（用于「添加成员」选择） */
export interface SystemMember {
  id: string;
  name: string;
  department: string;
  /** 主要角色来源，仅用于展示 */
  roleName?: string;
}

/** 知识库上的角色授权 */
export interface KbRoleGrant {
  roleId: string;
  roleName: string;
  scopeLabel: string;
  memberCount: number;
  level: PermissionLevel;
}

/** 知识库上的成员授权 */
export interface KbMemberGrant {
  memberId: string;
  name: string;
  department: string;
  roleName?: string;
  /** 由所属角色继承的权限；无则为 null */
  roleLevel: PermissionLevel | null;
  /** 个人单独授权；未设置则为 null（此时成员仅靠角色权限存在） */
  directLevel: PermissionLevel | null;
}

export interface PermissionGrants {
  roles: KbRoleGrant[];
  members: KbMemberGrant[];
}

/** 成员最终生效权限 */
export function memberEffectiveLevel(member: KbMemberGrant): PermissionLevel | null {
  return maxPermissionLevel(member.roleLevel, member.directLevel);
}

export const SYSTEM_ROLES: SystemRole[] = [
  { id: "role-run-duty", name: "运行值班员", scopeLabel: "运行部", memberCount: 24 },
  { id: "role-run-lead", name: "运行专责", scopeLabel: "运行部", memberCount: 9 },
  { id: "role-tech", name: "技术专责", scopeLabel: "技术部", memberCount: 8 },
  { id: "role-dispatch", name: "调度专责", scopeLabel: "调度部", memberCount: 6 },
  { id: "role-maint", name: "检修专责", scopeLabel: "检修部", memberCount: 10 },
  { id: "role-kb-admin", name: "知识库管理员", scopeLabel: "全局", memberCount: 3 },
];

export const SYSTEM_MEMBERS: SystemMember[] = [
  { id: "u-run-admin", name: "张工", department: "运行部", roleName: "运行值班员" },
  { id: "u-li", name: "李工", department: "技术部", roleName: "技术专责" },
  { id: "u-wang", name: "王工", department: "调度部", roleName: "调度专责" },
  { id: "u-chen", name: "陈工", department: "运行部", roleName: "运行值班员" },
  { id: "u-zhao", name: "赵工", department: "检修部", roleName: "检修专责" },
  { id: "u-sun", name: "孙工", department: "运行部", roleName: "运行专责" },
  { id: "u-zhou", name: "周工", department: "技术部", roleName: "技术专责" },
];

function findRole(id: string) {
  return SYSTEM_ROLES.find((role) => role.id === id);
}

function role(id: string, level: PermissionLevel): KbRoleGrant {
  const source = findRole(id)!;
  return {
    roleId: source.id,
    roleName: source.name,
    scopeLabel: source.scopeLabel,
    memberCount: source.memberCount,
    level,
  };
}

function member(
  id: string,
  roleLevel: PermissionLevel | null,
  directLevel: PermissionLevel | null,
): KbMemberGrant {
  const source = SYSTEM_MEMBERS.find((item) => item.id === id)!;
  return {
    memberId: source.id,
    name: source.name,
    department: source.department,
    roleName: source.roleName,
    roleLevel,
    directLevel,
  };
}

/** 各专业库的初始授权（演示数据） */
const BASE_GRANTS: Record<string, PermissionGrants> = {
  "kb-agc": {
    roles: [role("role-run-duty", "view"), role("role-tech", "upload"), role("role-kb-admin", "manage")],
    members: [
      member("u-run-admin", "view", "manage"),
      member("u-li", "upload", null),
      member("u-wang", null, "view"),
    ],
  },
  "kb-grid-operation": {
    roles: [role("role-run-duty", "upload"), role("role-kb-admin", "manage")],
    members: [member("u-run-admin", "upload", "manage"), member("u-sun", "view", "upload")],
  },
};

function cloneGrants(grants: PermissionGrants): PermissionGrants {
  return {
    roles: grants.roles.map((item) => ({ ...item })),
    members: grants.members.map((item) => ({ ...item })),
  };
}

/** 读取某知识库的授权配置副本；无配置时至少包含创建人作为管理者 */
export function getGrantsForBase(baseId: string): PermissionGrants {
  const existing = BASE_GRANTS[baseId];
  if (existing) return cloneGrants(existing);
  return createInitialGrants();
}

/** 新建专业库时的初始授权：创建人默认成为管理者 */
export function createInitialGrants(): PermissionGrants {
  const creator = SYSTEM_MEMBERS.find((item) => item.id === CURRENT_KNOWLEDGE_USER.id);
  return {
    roles: [],
    members: [
      {
        memberId: CURRENT_KNOWLEDGE_USER.id,
        name: creator?.name ?? CURRENT_KNOWLEDGE_USER.name,
        department: creator?.department ?? "运行部",
        roleName: creator?.roleName,
        roleLevel: null,
        directLevel: "manage",
      },
    ],
  };
}

export interface GrantsSummary {
  roleCount: number;
  directMemberCount: number;
  managerCount: number;
}

export function summarizeGrants(grants: PermissionGrants): GrantsSummary {
  return {
    roleCount: grants.roles.length,
    directMemberCount: grants.members.filter((item) => item.directLevel != null).length,
    managerCount: grants.members.filter((item) => memberEffectiveLevel(item) === "manage").length,
  };
}

export function hasManager(grants: PermissionGrants) {
  return grants.members.some((item) => memberEffectiveLevel(item) === "manage");
}
