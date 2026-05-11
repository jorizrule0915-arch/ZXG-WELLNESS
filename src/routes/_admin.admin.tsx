import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin")({ component: AdminLayoutInner });

function AdminLayoutInner() {
  return <Outlet />;
}
