import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { applyLibraryUpdate, fetchBooks, subscribeBooks } from "@/api/alexandria";
import type { BookMeta } from "@/api/types";

export const booksQueryKey = ["alexandria", "books"] as const;

export function useBooks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: booksQueryKey,
    queryFn: fetchBooks,
    initialData: [],
  });

  useEffect(() => {
    const subscription = subscribeBooks((update) => {
      queryClient.setQueryData<BookMeta[]>(booksQueryKey, (books = []) => applyLibraryUpdate(books, update));
    });

    return () => subscription.quit?.();
  }, [queryClient]);

  return query;
}
