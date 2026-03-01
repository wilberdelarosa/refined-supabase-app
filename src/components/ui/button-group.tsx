import * as React from "react";

import { cn } from "@/lib/utils";

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex overflow-hidden rounded-md [&>*]:rounded-none [&>*:first-child]:rounded-s-md [&>*:last-child]:rounded-e-md [&>*:not(:first-child)]:border-l-0",
      className
    )}
    {...props}
  />
));
ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };
