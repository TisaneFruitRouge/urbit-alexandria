import { CopyPlus, Download, Eye, Ship, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getDownloadUrl, mirrorBook, removeBook } from "@/api/alexandria";
import type { LibraryBook } from "@/api/types";
import { ship } from "@/api/urbit";
import { booksQueryKey } from "@/hooks/useBooks";
import { cn, formatBytes, formatShip } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type BookCardProps = {
  book: LibraryBook;
  selected: boolean;
  onRead: (book: LibraryBook) => void;
};

export function BookCard({ book, selected, onRead }: BookCardProps) {
  const queryClient = useQueryClient();
  const localShip = formatShip(ship);
  const isLocal = book.mirrors.some((mirror) => formatShip(mirror.source) === localShip);
  const localMirror = book.mirrors.find((mirror) => formatShip(mirror.source) === localShip);
  const hostShips = book.mirrors.map((mirror) => formatShip(mirror.source));
  const downloadUrl = getDownloadUrl(book);
  const previewUrl = `${downloadUrl}#page=1&toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  const remove = useMutation({
    mutationFn: () => removeBook((localMirror ?? book).id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });

  const mirror = useMutation({
    mutationFn: () => mirrorBook(book),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onRead(book)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onRead(book);
        }
      }}
      className={cn(
        "group flex min-h-[28rem] cursor-pointer flex-col justify-between overflow-hidden p-4 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(67,49,31,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "ring-2 ring-primary",
      )}
    >
      <div>
        <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-muted shadow-inner">
          <div className="relative aspect-[3/4]">
            <iframe
              title={`${book.title || book.filename} cover preview`}
              src={previewUrl}
              className="pointer-events-none h-full w-full bg-white"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/12 via-transparent to-background/8" />
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span>{formatBytes(book.size)}</span>
          <span className={cn("rounded-full px-3 py-1", isLocal ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground")}>
            {isLocal ? "Local" : "Remote"} · {hostShips.length} {hostShips.length === 1 ? "host" : "hosts"}
          </span>
        </div>
        <h3 className="font-display text-3xl font-bold leading-none text-foreground">{book.title || book.filename}</h3>
        <p className="mt-2 text-sm font-semibold text-secondary">{book.author || "Unknown author"}</p>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{book.description || "No description yet."}</p>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Ship className="h-4 w-4" />
          <span>Available from {hostShips.join(", ")}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={(event) => {
            event.stopPropagation();
            onRead(book);
          }}>
            <Eye className="h-4 w-4" />
            Read
          </Button>
          <Button size="sm" variant="outline" onClick={(event) => {
            event.stopPropagation();
            window.open(downloadUrl, "_blank", "noopener,noreferrer");
          }}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          {!isLocal ? (
            <Button size="sm" variant="outline" onClick={(event) => {
              event.stopPropagation();
              mirror.mutate();
            }} disabled={mirror.isPending}>
              <CopyPlus className="h-4 w-4" />
              {mirror.isPending ? "Mirroring..." : "Mirror"}
            </Button>
          ) : null}
          {isLocal ? (
            <Button size="sm" variant="ghost" onClick={(event) => {
              event.stopPropagation();
              remove.mutate();
            }} disabled={remove.isPending}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
        {mirror.error ? <p className="text-sm text-destructive">{String(mirror.error.message)}</p> : null}
      </div>
    </Card>
  );
}
