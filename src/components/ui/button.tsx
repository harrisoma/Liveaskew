import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-[box-shadow,transform,background-color,color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:translate-y-px",
  {
    variants: {
      variant: {
        default:
          "rounded-full bg-ink text-cream shadow-[8px_8px_16px_color-mix(in_oklab,var(--ink)_28%,transparent),-4px_-4px_10px_color-mix(in_oklab,white_35%,var(--cream)),inset_0_1px_0_color-mix(in_oklab,white_18%,transparent)] hover:bg-[color-mix(in_oklab,var(--gold-deep)_70%,var(--ink))]",
        destructive:
          "rounded-full bg-destructive text-destructive-foreground shadow-[6px_6px_12px_color-mix(in_oklab,var(--ink)_18%,transparent)] hover:opacity-90",
        outline: "rounded-full bg-cream text-ink shadow-neo hover:shadow-neo-sm",
        secondary: "rounded-full bg-cream text-ink shadow-neo hover:shadow-neo-sm",
        ghost: "rounded-full hover:shadow-neo-sm hover:text-gold-deep",
        link: "rounded-full text-gold-deep underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-12 rounded-full px-8",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
