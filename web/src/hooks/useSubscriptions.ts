import { useQuery } from "@tanstack/react-query";
import { fetchSubscriptions } from "@/api/alexandria";

export const subscriptionsQueryKey = ["alexandria", "subscriptions"] as const;

export function useSubscriptions() {
  return useQuery({
    queryKey: subscriptionsQueryKey,
    queryFn: fetchSubscriptions,
    initialData: [],
  });
}
