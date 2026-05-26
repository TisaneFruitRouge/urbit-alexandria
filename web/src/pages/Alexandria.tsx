import { useDeferredValue, useMemo, useState } from "react";
import { BookOpen, Search, Sparkles } from "lucide-react";
import { groupBookMirrors } from "@/api/alexandria";
import type { LibraryBook } from "@/api/types";
import { useBooks } from "@/hooks/useBooks";
import { formatShip } from "@/lib/utils";
import { BookGrid } from "@/components/BookGrid";
import { PDFViewer } from "@/components/PDFViewer";
import { ShipInput } from "@/components/ShipInput";
import { SubscriptionsList } from "@/components/SubscriptionsList";
import { UploadDialog } from "@/components/UploadDialog";
import { useUrbitIdentity } from "@/hooks/useUrbitIdentity";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type FilterMode = "all" | "local" | "remote";

export function Alexandria() {
  const { data: books = [], isFetching, error } = useBooks();
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const deferredQuery = useDeferredValue(query);
  const identity = useUrbitIdentity();

  const groupedBooks = useMemo(() => groupBookMirrors(books), [books]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const localShip = formatShip(identity.ship);

    return groupedBooks
      .filter((book) => {
        const hasLocalMirror = book.mirrors.some((mirror) => formatShip(mirror.source) === localShip);
        if (filterMode === "local") return hasLocalMirror;
        if (filterMode === "remote") return !hasLocalMirror;
        return true;
      })
      .filter((book) => {
        if (!normalizedQuery) return true;
        return [book.title, book.author, book.description, book.filename, book.source, ...book.tags, ...book.mirrors.map((mirror) => mirror.source)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => b.uploaded.localeCompare(a.uploaded));
  }, [groupedBooks, deferredQuery, filterMode, identity.ship]);

  const selectedId = selectedBook ? selectedBook.hash || `${selectedBook.source}-${selectedBook.id}` : undefined;

  return (
    <main className="paper-grain min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.42fr)_340px]">
          <div className="space-y-6">
            <Hero total={groupedBooks.length} visible={filteredBooks.length} isFetching={isFetching} ship={identity.ship} desk={identity.desk} />
            <Card className="p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search title, author, ship, filename..."
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  {(["all", "local", "remote"] as const).map((mode) => (
                    <Button key={mode} size="sm" variant={filterMode === mode ? "default" : "outline"} onClick={() => setFilterMode(mode)}>
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>
              {error ? <p className="mt-3 text-sm text-destructive">{String(error.message)}</p> : null}
            </Card>
            <BookGrid books={filteredBooks} selectedId={selectedId} onRead={setSelectedBook} />
          </div>

          <aside className="space-y-6">
            <UploadDialog />
            <ShipInput />
            <SubscriptionsList />
          </aside>
        </div>
      </section>
      <PDFViewer book={selectedBook} onClose={() => setSelectedBook(null)} />
    </main>
  );
}

function Hero({ total, visible, isFetching, ship, desk }: { total: number; visible: number; isFetching: boolean; ship: string; desk: string }) {
  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-[30px] border border-border bg-foreground p-6 text-background shadow-[0_28px_90px_rgba(40,31,21,0.3)] sm:p-7">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent opacity-80 blur-2xl" />
      <div className="absolute bottom-0 right-20 h-28 w-72 rotate-[-8deg] rounded-full bg-secondary opacity-50 blur-xl" />
      <div className="relative">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-4 py-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-accent" />
          {formatShip(ship)}/{desk}
        </div>
        <h1 className="max-w-3xl font-display text-4xl font-bold leading-[0.98] tracking-tight sm:text-5xl">
          Host books and PDFs from your Urbit.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-background/72 sm:text-lg">
          Upload PDF books locally, mirror useful titles, and read from the closest hosting ship. Metadata syncs over Gall; files stay in Clay.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Stat icon={<BookOpen className="h-4 w-4" />} label="Total books" value={total} />
          <Stat label="Visible now" value={visible} />
          <Stat label="Sync" value={isFetching ? "refreshing" : "live"} />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-background/15 bg-background/10 px-4 py-2.5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-background/55">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
