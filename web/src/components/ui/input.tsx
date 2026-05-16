import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-input bg-card/80 px-3 py-2 text-sm shadow-sm outline-none transition file:mr-3 file:h-7 file:rounded-full file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-semibold file:leading-7 file:text-secondary-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
        className,
      )}
      {...props}
    />
  );
}
