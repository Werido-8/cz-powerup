import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";

export const Route = createFileRoute("/governance")({
  component: GovPage,
  head: () => ({ meta: [{ title: "知识治理 · 演示占位" }] }),
});

function GovPage() {
  const ROWS = [
    { name: "厂站运行规程(华东 A 厂)", status: "已审核", version: "v2024.07", owner: "运行处" },
    { name: "AGC 控制器 SOP", version: "v2024.06", status: "待复核", owner: "技术处" },
    { name: "差动保护误动复盘案例库", version: "v2023.11", status: "已审核", owner: "继保室" },
    { name: "两细则考核知识点汇编", version: "v2024.05", status: "草稿", owner: "培训中心" },
  ];
  return (
    <PageShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">知识治理</h1>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">资料生命周期、版本与审核状态(原型占位)</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-[13px]">
          <thead className="bg-muted/40 text-[12px] text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-medium">资料名称</th>
              <th className="px-5 py-3 text-left font-medium">版本</th>
              <th className="px-5 py-3 text-left font-medium">归属</th>
              <th className="px-5 py-3 text-left font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} className="border-t border-border">
                <td className="px-5 py-3 font-medium">{r.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.version}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.owner}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] ${
                      r.status === "已审核"
                        ? "bg-success-soft text-success"
                        : r.status === "待复核"
                          ? "bg-warning-soft text-warning-foreground"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
