import * as React from "react";

import { cn } from "@/lib/utils";

const Empty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="status"
    aria-label="Empty state"
    className={cn(
      "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center",
      className
    )}
    {...props}
  />
));
Empty.displayName = "Empty";

const EmptyIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
));
EmptyIcon.displayName = "EmptyIcon";

const EmptyTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-sm font-semibold text-foreground", className)}
    {...props}
  />
));
EmptyTitle.displayName = "EmptyTitle";

const EmptyDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground max-w-sm", className)}
    {...props}
  />
));
EmptyDescription.displayName = "EmptyDescription";

const EmptyAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mt-2", className)} {...props} />
));
EmptyAction.displayName = "EmptyAction";

export { Empty, EmptyIcon, EmptyTitle, EmptyDescription, EmptyAction };
