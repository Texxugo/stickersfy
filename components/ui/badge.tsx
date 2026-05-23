import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border border-border bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted",
        className
      )}
      {...props}
    />
  );
}
