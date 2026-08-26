import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { COMPARE_TASK } from "@/lib/file-compare/data";
import type { CompareOverviewSearch } from "@/lib/file-compare/navigation";
import type { CompareVersion } from "@/lib/file-compare/types";
import { CompareBreadcrumb } from "./CompareBreadcrumb";
import { CompareModuleTabs, type CompareTabKey } from "./CompareModuleTabs";
import { CompareMetaTag, CompareTaskHeader, CompareVersions } from "./CompareTaskHeader";

/** 文件比对任务的统一框架头部。三个视图共享标题、版本关系、状态与一级页签。 */
export function CompareWorkspaceHeader({
  taskId,
  active,
  search,
  baseVersion,
  targetVersion,
  actions,
  children,
}: {
  taskId: string;
  active: CompareTabKey;
  search: CompareOverviewSearch;
  baseVersion: CompareVersion;
  targetVersion: CompareVersion;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CompareBreadcrumb
        items={[
          {
            label: "文件比对",
            link: (
              <Link to="/file-compare/$taskId/overview" params={{ taskId }}>
                文件比对
              </Link>
            ),
          },
          { label: "涉网运行管理规定" },
        ]}
      />

      <section className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-kb-border bg-white shadow-[0_1px_2px_rgba(31,52,64,0.035)]">
        <CompareTaskHeader
          className="px-5 py-3"
          title="涉网运行管理规定"
          tags={
            <CompareVersions
              baseLabel={baseVersion.label}
              baseVersion={baseVersion.fileName.replace(".pdf", "")}
              targetLabel={targetVersion.label}
              targetVersion={targetVersion.fileName.replace(".pdf", "")}
              status={COMPARE_TASK.status}
              meta={<CompareMetaTag>完成时间 {COMPARE_TASK.finishedAt}</CompareMetaTag>}
            />
          }
          actions={actions}
        />
        <CompareModuleTabs taskId={taskId} active={active} search={search} />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </section>
    </div>
  );
}
