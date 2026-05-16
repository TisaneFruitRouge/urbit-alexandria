import { api, connectUrbit, ship, shipUrls } from "@/api/urbit";
import type { BookMeta, LibraryBook, LibraryUpdate, SubscriptionList, UpdateBookInput, UploadMetadata } from "@/api/types";
import { formatShip, patpToHost } from "@/lib/utils";

const APP = "alexandria";
const UPDATE_MARK = "alexandria-update";
const ACTION_MARK = "alexandria-action";

type Subscription = {
  quit?: () => void;
};

export async function fetchBooks(): Promise<BookMeta[]> {
  await connectUrbit();
  const result = await api.scry<LibraryUpdate>({ app: APP, path: "/books" });
  return result.type === "init" ? result.books : [];
}

export async function fetchSubscriptions(): Promise<string[]> {
  await connectUrbit();
  const result = await api.scry<SubscriptionList>({ app: APP, path: "/subscriptions" });
  return result.ships.map(formatShip);
}

export function subscribeBooks(onUpdate: (update: LibraryUpdate) => void, onError?: (error: unknown) => void): Subscription {
  let active = true;
  let subscriptionId: number | null = null;

  void connectUrbit()
    .then(() => api.subscribe({
      app: APP,
      path: "/books",
      event: (event: unknown) => onUpdate(event as LibraryUpdate),
      err: onError,
    }))
    .then((id) => {
      if (!active) {
        void api.unsubscribe(id).catch(onError);
        return;
      }
      subscriptionId = id;
    })
    .catch(onError);

  return {
    quit: () => {
      active = false;
      if (subscriptionId !== null) {
        api.unsubscribe(subscriptionId).catch(onError);
      }
    },
  };
}

export async function uploadBook(file: File, metadata: UploadMetadata): Promise<number> {
  await connectUrbit();

  const params = new URLSearchParams({
    title: metadata.title,
    author: metadata.author,
    description: metadata.description,
    filename: metadata.filename || file.name || "book.pdf",
  });

  const response = await fetch(`/alexandria?${params.toString()}`, {
    method: "POST",
    headers: {
      "content-type": file.type || "application/pdf",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return Number.parseInt(await response.text(), 10);
}

export async function mirrorBook(book: LibraryBook): Promise<number> {
  const localShip = formatShip(ship);
  const remoteMirror = sortMirrors(book.mirrors).find((mirror) => formatShip(mirror.source) !== localShip);

  if (!remoteMirror) {
    throw new Error("No remote mirror available");
  }

  const response = await fetch(getDownloadUrl(remoteMirror));
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const blob = await response.blob();
  const file = new File([blob], remoteMirror.filename || book.filename || "book.pdf", {
    type: blob.type || "application/pdf",
  });

  return uploadBook(file, {
    title: book.title,
    author: book.author,
    description: book.description,
    filename: remoteMirror.filename || book.filename || "book.pdf",
  });
}

export async function removeBook(id: number) {
  await connectUrbit();

  await api.poke({
    app: APP,
    mark: ACTION_MARK,
    json: { "remove-book": { id } },
  });
}

export async function updateBook(input: UpdateBookInput) {
  await connectUrbit();

  await api.poke({
    app: APP,
    mark: ACTION_MARK,
    json: {
      "update-book": {
        id: input.id,
        title: input.title,
        author: input.author,
        description: input.description,
        tags: input.tags,
      },
    },
  });
}

export async function subscribeToShip(targetShip: string) {
  assertNotSelfSubscription(targetShip, "subscribe to");
  await connectUrbit();

  await api.poke({
    app: APP,
    mark: ACTION_MARK,
    json: { subscribe: formatShip(targetShip) },
  });
}

export async function unsubscribeFromShip(targetShip: string) {
  assertNotSelfSubscription(targetShip, "unsubscribe from");
  await connectUrbit();

  await api.poke({
    app: APP,
    mark: ACTION_MARK,
    json: { unsubscribe: formatShip(targetShip) },
  });
}

export async function resyncShip(targetShip: string) {
  assertNotSelfSubscription(targetShip, "resync from");
  await connectUrbit();

  await api.poke({
    app: APP,
    mark: ACTION_MARK,
    json: { resync: formatShip(targetShip) },
  });
}

export function removeBooksFromSource(current: BookMeta[], targetShip: string) {
  const source = formatShip(targetShip);
  return current.filter((book) => formatShip(book.source) !== source);
}

export function removeSubscription(current: string[], targetShip: string) {
  const source = formatShip(targetShip);
  return current.filter((subscribedShip) => formatShip(subscribedShip) !== source);
}

export function getDownloadUrl(book: BookMeta | LibraryBook) {
  const mirror = selectBestMirror(book);
  const localShip = formatShip(ship);
  const source = formatShip(mirror.source);
  const path = `/alexandria?id=${mirror.id}`;

  if (source === localShip) {
    return path;
  }

  const proxyPath = devProxyPath(source, path);
  if (proxyPath) return proxyPath;

  const baseUrl = shipBaseUrl(source);
  if (baseUrl) return `${baseUrl}${path}`;

  return `https://${patpToHost(source)}.arvo.network${path}`;
}

export function applyLibraryUpdate(current: BookMeta[], update: LibraryUpdate) {
  switch (update.type) {
    case "init":
      return update.books;
    case "book-added":
      return upsertBook(current, update.book);
    case "book-updated":
      return upsertBook(current, update.book);
    case "book-removed":
      return current.filter((book) => !(book.id === update.id && formatShip(book.source) === formatShip(update.source)));
  }
}

function upsertBook(current: BookMeta[], next: BookMeta) {
  const index = current.findIndex((book) => book.id === next.id && formatShip(book.source) === formatShip(next.source));
  if (index === -1) return [next, ...current];
  return current.map((book, itemIndex) => (itemIndex === index ? next : book));
}

export function groupBookMirrors(books: BookMeta[]): LibraryBook[] {
  const grouped = new Map<string, LibraryBook>();

  for (const book of books) {
    const key = logicalBookKey(book);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { ...book, mirrors: [book] });
      continue;
    }

    existing.mirrors = upsertMirror(existing.mirrors, book);
  }

  return Array.from(grouped.values()).map((book) => {
    const mirrors = sortMirrors(book.mirrors);
    return { ...mirrors[0], mirrors };
  });
}

function upsertMirror(current: BookMeta[], next: BookMeta) {
  const source = formatShip(next.source);
  const index = current.findIndex((book) => formatShip(book.source) === source);
  if (index === -1) return [...current, next];

  return current.map((book, itemIndex) => {
    if (itemIndex !== index) return book;
    return next.id > book.id ? next : book;
  });
}

function selectBestMirror(book: BookMeta | LibraryBook) {
  if (!("mirrors" in book)) return book;
  return sortMirrors(book.mirrors)[0] ?? book;
}

function sortMirrors(mirrors: BookMeta[]) {
  const localShip = formatShip(ship);
  return [...mirrors].sort((a, b) => {
    if (formatShip(a.source) === localShip) return -1;
    if (formatShip(b.source) === localShip) return 1;
    return b.id - a.id;
  });
}

function logicalBookKey(book: BookMeta) {
  const normalized = normalizeHash(book.hash);
  if (normalized) return `hash:${normalized}`;
  return `source:${formatShip(book.source)}:${book.id}`;
}

function normalizeHash(hash?: string) {
  if (!hash || hash === "0v0" || hash === "0") return null;
  return hash;
}

function assertNotSelfSubscription(targetShip: string, action: string) {
  if (formatShip(targetShip) === formatShip(ship)) {
    throw new Error(`Cannot ${action} your own ship.`);
  }
}

function devProxyPath(source: string, path: string) {
  if (!import.meta.env.DEV) return null;

  const withoutSig = patpToHost(source);
  if (!shipUrls[source] && !shipUrls[withoutSig]) return null;

  return `/__ship/${withoutSig}${path}`;
}

function shipBaseUrl(source: string) {
  const withoutSig = patpToHost(source);
  const configured = shipUrls[source] ?? shipUrls[withoutSig];
  return configured?.replace(/\/$/, "");
}

export { UPDATE_MARK };
