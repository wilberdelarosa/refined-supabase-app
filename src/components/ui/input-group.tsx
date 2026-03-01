import * as React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group"
    className={cn(
      "flex h-10 w-full overflow-hidden rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      className
    )}
    {...props}
  />
));
InputGroup.displayName = "InputGroup";

type InputGroupAddonAlign = "inline-start" | "inline-end" | "block-start" | "block-end";

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: InputGroupAddonAlign }
>(({ className, align = "inline-start", ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group-addon"
    data-align={align}
    className={cn(
      "inline-flex items-center gap-1 border border-input bg-muted px-3 text-muted-foreground [.border-input]:border-0",
      align === "inline-start" && "order-first border-e",
      align === "inline-end" && "order-last border-s",
      align === "block-start" && "order-first w-full border-b py-2",
      align === "block-end" && "order-last w-full border-t py-2",
      className
    )}
    {...props}
  />
));
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    data-slot="input-group-control"
    className={cn(
      "flex-1 min-w-0 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
      className
    )}
    {...props}
  />
));
InputGroupInput.displayName = "InputGroupInput";

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
InputGroupText.displayName = "InputGroupText";

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="input-group-control"
    className={cn(
      "flex min-h-20 w-full resize-none rounded-none border-0 bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      className
    )}
    {...props}
  />
));
InputGroupTextarea.displayName = "InputGroupTextarea";

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, variant = "ghost", size = "sm", ...props }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant={variant}
    size={size}
    className={cn("h-auto shrink-0", className)}
    {...props}
  />
));
InputGroupButton.displayName = "InputGroupButton";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  InputGroupButton,
};
