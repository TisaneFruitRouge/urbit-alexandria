import { ExternalLink, X } from "lucide-react";
import { getDownloadUrl } from "@/api/alexandria";
import type { LibraryBook } from "@/api/types";
import { formatShip } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type PDFViewerProps = {
  book: LibraryBook | null;
  onClose: () => void;
};

export function PDFViewer({ book, onClose }: PDFViewerProps) {
  if (!book) return null;

  const url = getDownloadUrl(book);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/55 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close reader" onClick={onClose} />
      <Card className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden shadow-[0_34px_120px_rgba(24,17,10,0.42)]">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {book.mirrors.map((mirror) => formatShip(mirror.source)).join(", ")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">{book.title || book.filename}</h2>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="outline" onClick={() => window.open(url, "_blank", "noopener,noreferrer")} aria-label="Open book in a new tab">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close reader">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <iframe title={book.title || book.filename} src={url} className="min-h-0 flex-1 bg-white" />
      </Card>
    </div>
  );
}
