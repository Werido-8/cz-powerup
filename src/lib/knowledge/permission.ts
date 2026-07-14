import { getCurrentKnowledgeUser } from "./demoRole";
import type { GrantTier, KnowledgePermissionGroup } from "./types";

export type { GrantTier };
export type PermissionLevel = KnowledgePermissionGroup;

const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  view: "浏览",
  upload: "上传",
  manage: "管理",
};

export const GRANT_TIER_OPTIONS: { value: GrantTier; label: string; desc: string }[] = [
  { value: "access", label: "访问权限", desc: "可查看、下载、收藏、上传" },
  { value: "manage", label: "库管理", desc: "可删除、跨库移动、配置权限" },
];

export function tierToLevel(tier: GrantTier): PermissionLevel {
  return tier === "manage" ? "manage" : "upload";
}

export function levelToTier(level: PermissionLevel | null | undefined): GrantTier | null {
  if (!level) return null;
  return level === "manage" ? "manage" : "access";
}

export function grantTierLabel(tier: GrantTier) {
  return GRANT_TIER_OPTIONS.find((item) => item.value === tier)?.label ?? tier;
}

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

export const PERMISSION_LEVEL_OPTIONS = GRANT_TIER_OPTIONS.map((item) => ({
  value: tierToLevel(item.value),
  label: item.label,
}));

export const GRANT_TIER_SELECT_OPTIONS = GRANT_TIER_OPTIONS.map((item) => ({
  value: item.value,
  label: item.label,
}));

/**
 * 一期演示开关：隐藏「访问权限 / 库管理」档位选择 UI。
 * 角色/成员一旦加入授权列表，即默认获得浏览、下载、收藏、上传（`access` → `upload` level）。
 * 二期再开放档位细分与库管理授权。
 */
export const SHOW_GRANT_TIER_UI = false;

/** 一期默认授权档位：访问权限（含浏览、下载、收藏、上传） */
export const DEFAULT_GRANT_TIER: GrantTier = "access";

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
  /** 个人单独授权；未设置则为 null */
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
  { id: "role-run-duty", name: "运行值班员", memberCount: 24 },
  { id: "role-run-lead", name: "运行专责", memberCount: 9 },
  { id: "role-tech", name: "技术专责", memberCount: 8 },
  { id: "role-dispatch", name: "调度专责", memberCount: 6 },
  { id: "role-maint", name: "检修专责", memberCount: 10 },
  { id: "role-kb-admin", name: "知识库管理员", memberCount: 3 },
];

export const SYSTEM_MEMBERS: SystemMember[] = [
  { id: "u-run-admin", name: "张工", department: "运行部", roleName: "知识库管理员" },
  { id: "u-li", name: "李工", department: "技术部", roleName: "普通员工" },
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
  const user = getCurrentKnowledgeUser();
  const creator = SYSTEM_MEMBERS.find((item) => item.id === user.id);
  return {
    roles: [],
    members: [
      {
        memberId: user.id,
        name: creator?.name ?? user.name,
        department: creator?.department ?? "—",
        roleName: creator?.roleName,
        roleLevel: null,
        directLevel: "manage",
      },
    ],
  };
}

/** 读取某用户在某库的有效权限级别 */
export function getEffectiveLevelForUser(
  baseId: string,
  userId: string,
  grants?: PermissionGrants,
): PermissionLevel | null {
  const config = grants ?? getGrantsForBase(baseId);
  const memberGrant = config.members.find((item) => item.memberId === userId);
  if (memberGrant) {
    const effective = memberEffectiveLevel(memberGrant);
    if (effective) return effective;
  }
  // 演示：角色授权未展开到用户，仅通过成员/管理员角色判断
  return null;
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
