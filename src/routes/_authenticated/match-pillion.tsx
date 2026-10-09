import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/match-pillion")({
  beforeLoad: () => {
    throw redirect({ to: "/match", search: { mode: "pillion" } });
  },
});
