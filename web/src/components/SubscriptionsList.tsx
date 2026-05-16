import { RefreshCw, RadioTower, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeBooksFromSource, removeSubscription, resyncShip, unsubscribeFromShip } from "@/api/alexandria";
import type { BookMeta } from "@/api/types";
import { booksQueryKey } from "@/hooks/useBooks";
import { subscriptionsQueryKey, useSubscriptions } from "@/hooks/useSubscriptions";
import { formatShip } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SubscriptionsList() {
  const queryClient = useQueryClient();
  const { data: subscriptions = [], isFetching, error } = useSubscriptions();

  const resync = useMutation({
    mutationFn: resyncShip,
    onMutate: async (targetShip) => {
      await queryClient.cancelQueries({ queryKey: booksQueryKey });
      queryClient.setQueryData<BookMeta[]>(booksQueryKey, (books = []) => removeBooksFromSource(books, targetShip));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: booksQueryKey });
      void queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey });
    },
  });

  const remove = useMutation({
    mutationFn: unsubscribeFromShip,
    onMutate: async (targetShip) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: booksQueryKey }),
        queryClient.cancelQueries({ queryKey: subscriptionsQueryKey }),
      ]);

      const previousBooks = queryClient.getQueryData<BookMeta[]>(booksQueryKey);
      const previousSubscriptions = queryClient.getQueryData<string[]>(subscriptionsQueryKey);

      queryClient.setQueryData<BookMeta[]>(booksQueryKey, (books = []) => removeBooksFromSource(books, targetShip));
      queryClient.setQueryData<string[]>(subscriptionsQueryKey, (ships = []) => removeSubscription(ships, targetShip));

      return { previousBooks, previousSubscriptions };
    },
    onError: (_error, _targetShip, context) => {
      if (context?.previousBooks) queryClient.setQueryData(booksQueryKey, context.previousBooks);
      if (context?.previousSubscriptions) queryClient.setQueryData(subscriptionsQueryKey, context.previousSubscriptions);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: booksQueryKey });
      void queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey });
    },
  });

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <RadioTower className="h-4 w-4 text-secondary" />
          Subscribed ships
        </div>
        {isFetching ? <span className="text-xs font-semibold text-muted-foreground">Refreshing</span> : null}
      </div>

      {subscriptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
      ) : (
        <div className="space-y-2">
          {subscriptions.map((subscribedShip) => {
            const formattedShip = formatShip(subscribedShip);
            const isResyncing = resync.isPending && resync.variables === formattedShip;
            const isRemoving = remove.isPending && remove.variables === formattedShip;

            return (
              <div key={formattedShip} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/35 px-3 py-2">
                <span className="text-sm font-semibold">{formattedShip}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resync.mutate(formattedShip)} disabled={isResyncing || isRemoving}>
                    <RefreshCw className="h-4 w-4" />
                    {isResyncing ? "Syncing..." : "Re-sync"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(formattedShip)} disabled={isResyncing || isRemoving}>
                    <X className="h-4 w-4" />
                    {isRemoving ? "Removing..." : "Remove"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error ? <p className="mt-2 text-sm text-destructive">{String(error.message)}</p> : null}
      {resync.error ? <p className="mt-2 text-sm text-destructive">{String(resync.error.message)}</p> : null}
      {remove.error ? <p className="mt-2 text-sm text-destructive">{String(remove.error.message)}</p> : null}
    </Card>
  );
}
