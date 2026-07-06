import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/knowledge/dept/$deptId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/knowledge/space/department/$departmentId",
      params: { departmentId: params.deptId },
    });
  },
});
