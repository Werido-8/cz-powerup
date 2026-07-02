import { createFileRoute, redirect } from "@tanstack/react-router";
import { readLastDept } from "@/lib/mock/knowledge-utils";

export const Route = createFileRoute("/knowledge/")({
  beforeLoad: () => {
    const lastDept = readLastDept();
    if (lastDept) {
      throw redirect({ to: "/knowledge/dept/$deptId", params: { deptId: lastDept } });
    }
    throw redirect({ to: "/knowledge/mine" });
  },
});
