import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: "vertical" | "horizontal" }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    data-slot="field"
    className={cn(
      "grid gap-2",
      orientation === "horizontal" &&
        "grid-cols-[minmax(0,auto)_1fr] items-center gap-4",
      className
    )}
    {...props}
  />
));
Field.displayName = "Field";

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentProps<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(className)}
    {...props}
  />
));
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

const FieldError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    role="alert"
    className={cn("text-sm font-medium text-destructive", className)}
    {...props}
  />
));
FieldError.displayName = "FieldError";

const FieldGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
FieldGroup.displayName = "FieldGroup";

const FieldSet = React.forwardRef<
  HTMLFieldSetElement,
  React.HTMLAttributes<HTMLFieldSetElement>
>(({ className, ...props }, ref) => (
  <fieldset
    ref={ref}
    className={cn("space-y-4 [&>legend]:sr-only", className)}
    {...props}
  />
));
FieldSet.displayName = "FieldSet";

const FieldLegend = React.forwardRef<
  HTMLLegendElement,
  React.HTMLAttributes<HTMLLegendElement> & { variant?: "default" | "label" }
>(({ className, variant = "default", ...props }, ref) => (
  <legend
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none",
      variant === "label" && "text-muted-foreground",
      className
    )}
    {...props}
  />
));
FieldLegend.displayName = "FieldLegend";

const FieldSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} role="separator" className={cn("my-4 border-t border-border", className)} {...props} />
));
FieldSeparator.displayName = "FieldSeparator";

const FieldContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("grid gap-2", className)} {...props} />
));
FieldContent.displayName = "FieldContent";

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldSeparator,
  FieldContent,
};
