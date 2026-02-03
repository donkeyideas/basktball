"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated" | "game";
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, children, ...props }, ref) => {
    const baseStyles = "relative transition-all duration-300";

    const variants = {
      default: cn(
        "bg-[var(--dark-gray)] border-2 border-[var(--border)]"
      ),
      bordered: cn(
        "bg-[var(--black)] border-3 border-[var(--border)]"
      ),
      elevated: cn(
        "bg-[var(--dark-gray)] border-2 border-[var(--border)]",
        "shadow-lg"
      ),
      game: cn(
        "bg-[var(--black)] border-2 border-[var(--border)]",
        "before:content-['LIVE'] before:absolute before:top-[-1px] before:right-[-1px]",
        "before:bg-[var(--orange)] before:px-4 before:py-1",
        "before:text-xs before:font-bold before:tracking-wider",
        "before:animate-blink"
      ),
    };

    const hoverStyles = hover
      ? "hover:border-[var(--orange)] hover:translate-y-[-3px] hover:shadow-[0_5px_20px_rgba(244,123,32,0.3)] cursor-pointer"
      : "";

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], hoverStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card subcomponents
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4 pb-4 mb-4 border-b-2 border-[var(--border)]",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "font-[family-name:var(--font-anton)] text-2xl uppercase tracking-wider",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
