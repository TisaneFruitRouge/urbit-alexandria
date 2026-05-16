import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RadioTower } from "lucide-react";
import { subscribeToShip } from "@/api/alexandria";
import { ship } from "@/api/urbit";
import { booksQueryKey } from "@/hooks/useBooks";
import { subscriptionsQueryKey } from "@/hooks/useSubscriptions";
import { formatShip } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ShipInput() {
  const [targetShip, setTargetShip] = useState("");
  const queryClient = useQueryClient();
  const normalizedTargetShip = targetShip.trim() ? formatShip(targetShip.trim()) : "";
  const isSelfTarget = normalizedTargetShip === formatShip(ship);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!targetShip.trim()) return;
      if (isSelfTarget) {
        throw new Error("Cannot subscribe to your own ship.");
      }
      await subscribeToShip(normalizedTargetShip);
    },
    onSuccess: () => {
      setTargetShip("");
      void queryClient.invalidateQueries({ queryKey: booksQueryKey });
      void queryClient.invalidateQueries({ queryKey: subscriptionsQueryKey });
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate();
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <RadioTower className="h-4 w-4 text-secondary" />
          Follow a ship
        </div>
        <Input
          value={targetShip}
          onChange={(event) => setTargetShip(event.target.value)}
          placeholder="~sampel-palnet"
          className="sm:flex-1"
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={mutation.isPending || !targetShip.trim() || isSelfTarget}>
            Subscribe
          </Button>
        </div>
      </form>
      {isSelfTarget ? <p className="mt-2 text-sm text-destructive">Cannot subscribe to your own ship.</p> : null}
      {mutation.error ? <p className="mt-2 text-sm text-destructive">{String(mutation.error.message)}</p> : null}
    </Card>
  );
}
