export type BookMeta = {
  id: number;
  hash?: string;
  title: string;
  author: string;
  description: string;
  tags: string[];
  uploader: string;
  source: string;
  uploaded: string;
  size: number;
  filename: string;
};

export type LibraryBook = BookMeta & {
  mirrors: BookMeta[];
};

export type LibraryUpdate =
  | { type: "init"; books: BookMeta[] }
  | { type: "book-added"; book: BookMeta }
  | { type: "book-updated"; book: BookMeta }
  | { type: "book-removed"; id: number; source: string };

export type SubscriptionList = {
  ships: string[];
};

export type UploadMetadata = {
  title: string;
  author: string;
  description: string;
  filename: string;
};

export type UpdateBookInput = Pick<BookMeta, "id" | "title" | "author" | "description" | "tags">;
