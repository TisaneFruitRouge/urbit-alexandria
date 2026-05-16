import type { LibraryBook } from "@/api/types";
import { BookCard } from "@/components/BookCard";

type BookGridProps = {
  books: LibraryBook[];
  selectedId?: string;
  onRead: (book: LibraryBook) => void;
};

export function BookGrid({ books, selectedId, onRead }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="font-display text-3xl font-bold">No books yet</p>
        <p className="mt-2 text-muted-foreground">Upload a book PDF or subscribe to another ship's hosted library.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {books.map((book, index) => (
        <div key={book.hash || `${book.source}-${book.id}`} className="animate-rise-in" style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}>
          <BookCard book={book} selected={selectedId === (book.hash || `${book.source}-${book.id}`)} onRead={onRead} />
        </div>
      ))}
    </div>
  );
}
