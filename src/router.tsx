import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // Short default cache so revisiting a page within 30s reuses data instead of refetching.
  // Admin and owner screens stay always-fresh so staff never act on stale orders.
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
  queryClient.setQueryDefaults(["admin"], { staleTime: 0 });
  queryClient.setQueryDefaults(["owner-pin-status"], { staleTime: 0 });
  queryClient.setQueryDefaults(["order-ref"], { staleTime: 0 });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
