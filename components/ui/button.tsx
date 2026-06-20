import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-cta to-cta-light text-primary hover:shadow-glow hover:-translate-y-0.5",
        destructive:
          "bg-accent-red text-white hover:bg-accent-red/90 hover:shadow-glow",
        outline:
          "border border bg-transparent hover:bg-surface hover:border-border",
        secondary:
          "bg-surface text-text-primary hover:bg-elevated hover:border-border",
        ghost: "hover:bg-surface hover:text-text-primary",
        link: "text-cta underline-offset-4 hover:underline",
        gold: "bg-gradient-to-br from-cta to-cta-light text-primary hover:shadow-glow hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-lg px-4",
        lg: "h-12 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
