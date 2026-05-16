import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[var(--radius)] border border-border bg-card/80 shadow-[0_20px_60px_rgba(67,49,31,0.12)] backdrop-blur", className)}
      {...props}
    />
  );
}
