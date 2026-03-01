import * as React from "react";

import { cn } from "@/lib/utils";

const Item = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="item"
    className={cn(
      "flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-muted/50",
      className
    )}
    {...props}
  />
));
Item.displayName = "Item";

const ItemIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
));
ItemIcon.displayName = "ItemIcon";

const ItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("min-w-0 flex-1 space-y-1", className)} {...props} />
));
ItemContent.displayName = "ItemContent";

const ItemTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm font-medium leading-none", className)} {...props} />
));
ItemTitle.displayName = "ItemTitle";

const ItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ItemDescription.displayName = "ItemDescription";

const ItemAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("shrink-0", className)} {...props} />
));
ItemAction.displayName = "ItemAction";

export { Item, ItemIcon, ItemContent, ItemTitle, ItemDescription, ItemAction };
