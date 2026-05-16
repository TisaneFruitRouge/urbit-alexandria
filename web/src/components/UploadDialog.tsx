import { FormEvent, useState } from "react";
import { Upload } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export function UploadDialog() {
  const upload = useUpload();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  function selectFile(nextFile: File | null) {
    setFile(nextFile);
    if (nextFile) {
      setTitle(bookTitleFromFilename(nextFile.name));
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || file.size > MAX_FILE_SIZE) return;

    upload.mutate(
      {
        file,
        metadata: {
          title: title.trim() || file.name,
          author: author.trim(),
          description: description.trim(),
          filename: file.name,
        },
      },
      {
        onSuccess: () => {
          setFile(null);
          setTitle("");
          setAuthor("");
          setDescription("");
          setFileInputKey((key) => key + 1);
        },
      },
    );
  }

  const fileTooLarge = Boolean(file && file.size > MAX_FILE_SIZE);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-secondary px-5 py-4 text-secondary-foreground">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-white/15 p-2">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold">Add a book</h2>
            <p className="text-sm text-secondary-foreground/75">Host a PDF book from this ship's Clay desk.</p>
          </div>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4 p-5">
        <Input key={fileInputKey} type="file" accept="application/pdf,.pdf" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} />
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
        <Input value={author} onChange={(event) => setAuthor(event.target.value)} placeholder="Author" />
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
        {fileTooLarge ? <p className="text-sm text-destructive">Files must be 50 MB or smaller.</p> : null}
        {upload.error ? <p className="text-sm text-destructive">{String(upload.error.message)}</p> : null}
        <Button type="submit" className="w-full" disabled={!file || fileTooLarge || upload.isPending}>
          {upload.isPending ? "Uploading..." : "Upload to Clay"}
        </Button>
      </form>
    </Card>
  );
}

function bookTitleFromFilename(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
