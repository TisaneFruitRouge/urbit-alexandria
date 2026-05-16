import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadBook } from "@/api/alexandria";
import type { UploadMetadata } from "@/api/types";
import { booksQueryKey } from "@/hooks/useBooks";

export function useUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: UploadMetadata }) => uploadBook(file, metadata),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: booksQueryKey });
    },
  });
}
