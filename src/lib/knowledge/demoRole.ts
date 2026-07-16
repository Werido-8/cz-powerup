import type { KnowledgeUser, KnowledgeUserRole } from "./types";

export const DEMO_USERS: Record<KnowledgeUserRole, KnowledgeUser> = {
  employee: { id: "u-employee-demo", name: "李工", role: "employee" },
  departmentAdmin: { id: "u-dept-admin-demo", name: "刘工", role: "departmentAdmin" },
  knowledgeAdmin: { id: "u-run-admin", name: "张工", role: "knowledgeAdmin" },
  superAdmin: { id: "u-super-admin-demo", name: "王管", role: "superAdmin" },
};

export const DEMO_ROLE_LABELS: Record<KnowledgeUserRole, string> = {
  employee: "普通员工",
  departmentAdmin: "部门管理员",
  knowledgeAdmin: "知识库管理员",
  superAdmin: "超级管理员",
};

/** 当前演示角色，供 Header 切换和 model.ts 默认参数使用 */
let currentRole: KnowledgeUserRole = "knowledgeAdmin";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeDemoRole(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDemoRoleKey(): KnowledgeUserRole {
  return currentRole;
}

export function getDemoRoleServerSnapshot(): KnowledgeUserRole {
  return "knowledgeAdmin";
}

export function getCurrentKnowledgeUser(): KnowledgeUser {
  return DEMO_USERS[currentRole] ?? DEMO_USERS.knowledgeAdmin;
}

export function setDemoRole(role: KnowledgeUserRole) {
  currentRole = role;
  emit();
}
